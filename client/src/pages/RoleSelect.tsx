import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, Sprout, Handshake } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function RoleSelect() {
  const { user, loading, isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const selectRole = trpc.profile.selectRole.useMutation({
    onSuccess: (data) => {
      if (data?.role === "farmer") {
        setLocation("/farmer/dashboard");
      } else {
        setLocation("/buyer/dashboard");
      }
      toast.success(`Welcome! You're now registered as a ${data?.role === "farmer" ? "Farmer" : "Buyer"}`);
    },
    onError: () => {
      toast.error("Failed to set role. Please try again.");
    },
  });

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      if (user.role === "farmer" || user.role === "buyer") {
        if (user.role === "farmer") setLocation("/farmer/dashboard");
        else setLocation("/buyer/dashboard");
      }
    }
  }, [loading, isAuthenticated, user, setLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  if (user.role === "farmer" || user.role === "buyer") {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            You're already set up!
          </h2>
          <p className="text-muted-foreground mb-6">
            You are registered as a {user.role === "farmer" ? "Farmer" : "Buyer"}.
          </p>
          <Button onClick={() => setLocation(user.role === "farmer" ? "/farmer/dashboard" : "/buyer/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12">
      <div className="container max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Choose Your Role
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Select how you'd like to participate in Sensi AgroConnect. You can always update this later.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <Card
            className={`group border-2 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-primary/10 ${
              selectRole.isPending ? "opacity-50" : ""
            }`}
            onClick={() => !selectRole.isPending && selectRole.mutate({ role: "farmer" })}
          >
            <CardContent className="p-8 text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/15 transition-colors">
                <Sprout className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                Farmer
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                List your produce, manage your inventory, and connect with buyers looking for quality crops.
              </p>
              <Button className="w-full" disabled={selectRole.isPending}>
                {selectRole.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Select Farmer
              </Button>
            </CardContent>
          </Card>

          <Card
            className={`group border-2 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-accent/10 ${
              selectRole.isPending ? "opacity-50" : ""
            }`}
            onClick={() => !selectRole.isPending && selectRole.mutate({ role: "buyer" })}
          >
            <CardContent className="p-8 text-center">
              <div className="h-16 w-16 rounded-2xl bg-accent/30 flex items-center justify-center mx-auto mb-6 group-hover:bg-accent/40 transition-colors">
                <Handshake className="h-8 w-8 text-accent-foreground" />
              </div>
              <h2 className="text-2xl font-semibold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                Buyer
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                Browse fresh produce listings, send inquiries to farmers, and source quality agricultural products.
              </p>
              <Button className="w-full" disabled={selectRole.isPending}>
                {selectRole.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Select Buyer
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
