# Sensi — Farmers & Buyers Platform

A marketplace platform connecting farmers and buyers directly, with role-based dashboards, authentication, and product listings.

## Stack

- **Frontend:** React 19, Vite, Wouter (routing), Tailwind CSS, Radix UI, TanStack Query
- **Backend:** Node.js, Express, tRPC
- **Database:** MySQL via Drizzle ORM
- **Auth:** JWT-based custom auth (email/password), bcrypt password hashing

## Features

- Landing page with role-based CTAs (Farmer / Buyer)
- Email/password signup and login
- Role selection and role-specific dashboards (Farmer, Buyer)
- Marketplace with search/filter and product inquiries
- User profile with activity history

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- MySQL database

### Setup

```bash
pnpm install
```

Create a `.env` file in the project root:

```
NODE_ENV=development
DATABASE_URL=mysql://user:password@host:port/dbname
JWT_SECRET=your-secret-here
VITE_APP_ID=sensi-agroconnect-dev
OWNER_OPEN_ID=owner-dev
```

Push the database schema:

```bash
pnpm db:push
```

### Development

```bash
pnpm dev
```

### Production build

```bash
pnpm build
pnpm start
```

### Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Run dev server with hot reload |
| `pnpm build` | Build client and server for production |
| `pnpm start` | Run production build |
| `pnpm check` | TypeScript type-check |
| `pnpm test` | Run tests (Vitest) |
| `pnpm db:push` | Generate and run Drizzle migrations |

## Deploying to Ubuntu

See [`deploy/`](deploy/) for a ready-to-use Nginx reverse proxy config and deploy script.

```bash
sudo apt update && sudo apt install -y nginx mysql-server
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
npm install -g pnpm pm2

git clone https://github.com/zalabee17-dotcom/sensi-farmers-and-buyers.git
cd sensi-farmers-and-buyers
cp deploy/.env.example .env   # fill in real DATABASE_URL / JWT_SECRET
bash deploy/deploy.sh

sudo cp deploy/nginx.conf /etc/nginx/sites-available/sensi
sudo ln -s /etc/nginx/sites-available/sensi /etc/nginx/sites-enabled/sensi
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d your-domain.com
```

Re-run `bash deploy/deploy.sh` to pull latest changes and redeploy.

## Project Structure

```
client/    React frontend (pages, components, hooks)
server/    Express + tRPC backend, auth, DB access
shared/    Types and constants shared between client and server
drizzle/   Database schema and migrations
```
