# CY174 — Sensi on GCP: Implementation Guide

Sensi (this repo) is the "digital platform connecting smallholder farmers to
buyers" option from the brief. This guide walks Task 1–4 end to end on GCP
using Cloud Run (serverless containers) as the container platform and Cloud
SQL for MySQL as the database, with a defense-in-depth security layer around
both. Screenshot every numbered step for your appendix.

## Architecture (for Task 2's diagram)

```
Internet
   │
   ▼
Cloud Armor (WAF + rate limiting)
   │
   ▼
Cloud Run (containerized Sensi app, HTTPS-only, private service account)
   │
   ├─── Secret Manager (JWT_SECRET, DB password — injected at runtime)
   │
   ▼
Cloud SQL for MySQL (private IP only, no public IP)
   │
   ▼
VPC (Serverless VPC Access connector bridges Cloud Run → private Cloud SQL)

Cross-cutting: Cloud Logging + Cloud Monitoring + Security Command Center
IAM: least-privilege service account, no owner/editor roles on the app SA
```

Draw this in draw.io / Lucidchart / Google's own architecture diagramming
tool for the report. Justify each box against a threat: Cloud Armor stops
L7 attacks (SQLi/XSS/volumetric) before they reach the app; private-IP
Cloud SQL removes the database from the public attack surface entirely;
Secret Manager removes credentials from source/env files; the dedicated
service account with minimal IAM roles limits blast radius if the
container is compromised.

**On Proxmox:** the brief asks you to consider Proxmox alongside a cloud
platform. Proxmox is a bare-metal hypervisor — it doesn't run inside GCP.
If your team has spare hardware or wants a hybrid story: install Proxmox
on a local machine, run a VM there as a secondary/DR container host
(Docker + the same image), and note in the report that this demonstrates
portability of the containerized artefact across an on-prem hypervisor and
a public cloud, plus gives you a Proxmox firewall/backup story to discuss.
If you don't have hardware for it, it's fine to state that decision and
justify going all-in on GCP for cost/scale/managed-security reasons —
examiners want a justified choice, not every technology used.

## Task 1 — Research (write-up only, no commands needed)

Cover in your report, each tied back to what you actually deploy below:
- **WAF / Cloud Armor**: OWASP-based rule sets, adaptive protection (ML-based
  anomaly detection), rate limiting.
- **IAM & least privilege**: Google's recommender tooling flags over-permissioned
  service accounts.
- **Secrets management**: Secret Manager vs. hardcoded env vars — CVEs caused
  by leaked secrets in repos.
- **Container security**: image scanning (Artifact Registry vulnerability
  scanning), distroless/slim base images, running as non-root (already done
  in the Dockerfile below).
- **Monitoring & detection**: Cloud Logging + Security Command Center,
  MITRE ATT&CK mapping for cloud.
- **Ethical/legal**: Ghana Data Protection Act (Act 843) — Sensi stores PII
  (names, phone numbers, locations) so note lawful basis for processing,
  and GDPR-style principles if any EU buyers ever use the platform.

## Task 2 — Design justification

Table format works well: for each control, state what it protects,
why it was chosen over an alternative, and what you deliberately excluded
and why (e.g. "excluded a self-managed WAF/ModSecurity — Cloud Armor is
managed, reduces ops burden and patch lag, at acceptable cost for this
scale").

## Task 3 — Artefact implementation on GCP

### 3.1 Prerequisites

```bash
gcloud auth login
gcloud projects create sensi-cy174 --name="Sensi CY174"
gcloud config set project sensi-cy174
gcloud services enable run.googleapis.com sqladmin.googleapis.com \
  secretmanager.googleapis.com vpcaccess.googleapis.com \
  compute.googleapis.com artifactregistry.googleapis.com \
  containerscanning.googleapis.com
```

### 3.2 Artifact Registry + build the image

```bash
gcloud artifacts repositories create sensi-repo \
  --repository-format=docker --location=africa-south1

gcloud auth configure-docker africa-south1-docker.pkg.dev

docker build -t africa-south1-docker.pkg.dev/sensi-cy174/sensi-repo/sensi:latest .
docker push africa-south1-docker.pkg.dev/sensi-cy174/sensi-repo/sensi:latest
```
(Use `europe-west1` instead of `africa-south1` if that region isn't enabled
for Cloud Run/Cloud SQL yet — check `gcloud run regions list`.)

Screenshot the Artifact Registry vulnerability scan results for the pushed
image — that's a direct Task 3 "screenshots as required" item.

### 3.3 Cloud SQL (private IP only — no public IP)

```bash
gcloud compute networks create sensi-vpc --subnet-mode=auto

gcloud compute addresses create sensi-sql-range \
  --global --purpose=VPC_PEERING --prefix-length=16 --network=sensi-vpc

gcloud services vpc-peerings connect \
  --service=servicenetworking.googleapis.com \
  --ranges=sensi-sql-range --network=sensi-vpc

gcloud sql instances create sensi-db \
  --database-version=MYSQL_8_0 --tier=db-f1-micro \
  --region=africa-south1 --network=sensi-vpc --no-assign-ip

gcloud sql databases create sensi --instance=sensi-db
gcloud sql users create sensi_app --instance=sensi-db --password="<GENERATE_A_STRONG_PASSWORD>"
```

### 3.4 Serverless VPC Access connector (lets Cloud Run reach private Cloud SQL)

```bash
gcloud compute networks vpc-access connectors create sensi-connector \
  --region=africa-south1 --network=sensi-vpc --range=10.8.0.0/28
```

### 3.5 Secrets

```bash
echo -n "mysql://sensi_app:<PASSWORD>@<CLOUD_SQL_PRIVATE_IP>:3306/sensi" | \
  gcloud secrets create sensi-db-url --data-file=-

openssl rand -base64 48 | tr -d '\n' | gcloud secrets create sensi-jwt-secret --data-file=-
```

### 3.6 Service account with least privilege

```bash
gcloud iam service-accounts create sensi-run-sa --display-name="Sensi Cloud Run SA"

gcloud secrets add-iam-policy-binding sensi-db-url \
  --member="serviceAccount:sensi-run-sa@sensi-cy174.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
gcloud secrets add-iam-policy-binding sensi-jwt-secret \
  --member="serviceAccount:sensi-run-sa@sensi-cy174.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
gcloud projects add-iam-policy-binding sensi-cy174 \
  --member="serviceAccount:sensi-run-sa@sensi-cy174.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```
No Owner/Editor roles on this SA — screenshot the IAM page showing exactly
these two scoped roles for your Task 2/3 justification.

### 3.7 Deploy to Cloud Run

```bash
gcloud run deploy sensi \
  --image=africa-south1-docker.pkg.dev/sensi-cy174/sensi-repo/sensi:latest \
  --region=africa-south1 \
  --service-account=sensi-run-sa@sensi-cy174.iam.gserviceaccount.com \
  --vpc-connector=sensi-connector --vpc-egress=private-ranges-only \
  --set-secrets=DATABASE_URL=sensi-db-url:latest,JWT_SECRET=sensi-jwt-secret:latest \
  --set-env-vars=NODE_ENV=production,VITE_APP_ID=sensi-prod,OWNER_OPEN_ID=owner-prod \
  --no-allow-unauthenticated=false --port=3000 --min-instances=0 --max-instances=3
```

Run the Drizzle migration once against the DB (e.g. via Cloud SQL Auth
Proxy from your machine, using the same `sensi-db-url` secret value):

```bash
pnpm db:push
```

### 3.8 Front it with Cloud Armor

```bash
gcloud compute security-policies create sensi-armor-policy \
  --description="Sensi WAF policy"

gcloud compute security-policies rules create 1000 \
  --security-policy=sensi-armor-policy \
  --expression="evaluatePreconfiguredExpr('sqli-stable')" --action=deny-403

gcloud compute security-policies rules create 1001 \
  --security-policy=sensi-armor-policy \
  --expression="evaluatePreconfiguredExpr('xss-stable')" --action=deny-403

gcloud compute security-policies rules create 2000 \
  --security-policy=sensi-armor-policy \
  --src-ip-ranges="*" --action=throttle \
  --rate-limit-threshold-count=100 --rate-limit-threshold-interval-sec=60 \
  --conform-action=allow --exceed-action=deny-429 --enforce-on-key=IP
```

Cloud Armor attaches to a load balancer, not directly to Cloud Run, so put
a serverless NEG + external HTTPS load balancer in front:

```bash
gcloud compute network-endpoint-groups create sensi-neg \
  --region=africa-south1 --network-endpoint-type=serverless \
  --cloud-run-service=sensi

gcloud compute backend-services create sensi-backend \
  --global --load-balancing-scheme=EXTERNAL_MANAGED \
  --security-policy=sensi-armor-policy
gcloud compute backend-services add-backend sensi-backend \
  --global --network-endpoint-group=sensi-neg --network-endpoint-group-region=africa-south1

gcloud compute url-maps create sensi-lb --default-service=sensi-backend
gcloud compute target-https-proxies create sensi-https-proxy \
  --url-map=sensi-lb --ssl-certificates=<YOUR_MANAGED_CERT>
gcloud compute forwarding-rules create sensi-fr \
  --global --target-https-proxy=sensi-https-proxy --ports=443
```

## Task 4 — Testing, evaluation, video

Practical demos that map directly to the marking criteria ("clear evidence
of understanding... alarm-tool... capture malicious code/files"):

1. **SQLi blocked**: `curl` a request against a form field with
   `' OR '1'='1` — show Cloud Armor's 403 and the matching entry in
   Cloud Logging (Logs Explorer, filter `jsonPayload.enforcedSecurityPolicy`).
2. **Rate limiting / alarm behaviour**: hammer the login endpoint with a
   loop of `curl` requests, show the 429s kicking in and a Cloud Monitoring
   alert firing (create an alert policy on Cloud Armor `deny_count` metric —
   this is your "alarm-tool" example).
3. **Secrets not exposed**: show `docker inspect` / `gcloud run services
   describe sensi` — no plaintext `DATABASE_URL` or `JWT_SECRET`, only
   secret references.
4. **Least-privilege proof**: try (and fail) to have the `sensi-run-sa`
   perform an action outside its two granted roles, e.g.
   `gcloud sql instances delete sensi-db --account=sensi-run-sa@...` → permission denied.
5. **Vulnerability scanning**: Artifact Registry scan results screenshot,
   discuss any CVEs found and whether they're exploitable in this context.
6. **Security Command Center**: enable the free tier, show any findings
   (e.g. public bucket, missing MFA) and how you remediated them.

Record all of this as the required video, narrating what each control
defends against as you trigger it.

## Cost note

`db-f1-micro` + Cloud Run scale-to-zero + a single load balancer keeps this
in GCP's free trial credit range for a class project. Tear down
(`gcloud sql instances delete`, `gcloud run services delete`, delete the LB
components) once you've recorded the video and taken screenshots, so it
doesn't keep billing.
