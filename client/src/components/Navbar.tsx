import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Sprout } from "lucide-react";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const isDashboard = location.startsWith("/farmer") || location.startsWith("/buyer");
  const isAuthPage = location === "/login" || location === "/signup";

  if (isDashboard) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation("/")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sprout className="h-5 w-5 text-primary" />
              </div>
              <span className="text-lg font-semibold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                Sensi AgroConnect
              </span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.role === "farmer" ? "Farmer" : user?.role === "buyer" ? "Buyer" : ""} Dashboard
            </span>
            <Button variant="outline" size="sm" onClick={() => setLocation("/profile")}>
              Profile
            </Button>
            <Button variant="ghost" size="sm" onClick={() => logout()}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sprout className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-semibold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            Sensi AgroConnect
          </span>
        </button>
        <nav className="hidden md:flex items-center gap-6">
          <button
            onClick={() => setLocation("/")}
            className={`text-sm font-medium transition-colors hover:text-primary ${location === "/" ? "text-primary" : "text-muted-foreground"}`}
          >
            Home
          </button>
          <button
            onClick={() => setLocation("/marketplace")}
            className={`text-sm font-medium transition-colors hover:text-primary ${location === "/marketplace" ? "text-primary" : "text-muted-foreground"}`}
          >
            Marketplace
          </button>
          {isAuthenticated && (
            <button
              onClick={() => setLocation("/profile")}
              className={`text-sm font-medium transition-colors hover:text-primary ${location === "/profile" ? "text-primary" : "text-muted-foreground"}`}
            >
              Profile
            </button>
          )}
        </nav>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  if (user?.role === "farmer") setLocation("/farmer/dashboard");
                  else if (user?.role === "buyer") setLocation("/buyer/dashboard");
                  else setLocation("/select-role");
                }}
              >
                Dashboard
              </Button>
              <Button variant="ghost" size="sm" onClick={() => logout()}>
                Sign out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/login")}
              >
                Sign in
              </Button>
              <Button size="sm" onClick={() => setLocation("/signup")}>
                Sign up
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
