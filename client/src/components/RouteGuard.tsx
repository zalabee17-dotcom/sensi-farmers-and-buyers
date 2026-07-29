import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";

/**
 * RouteGuard enforces that authenticated users must have a role (Farmer/Buyer)
 * before accessing protected routes. Users without a role are redirected to
 * the role selection page.
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  const publicRoutes = ["/", "/marketplace", "/select-role", "/404", "/login", "/signup"];
  const isPublicRoute = publicRoutes.some(
    (route) => location === route || location.startsWith(route + "/")
  );

  useEffect(() => {
    if (!loading && isAuthenticated && user && !isPublicRoute) {
      if (user.role !== "farmer" && user.role !== "buyer" && user.role !== "admin") {
        setLocation("/select-role");
      }
    }
  }, [loading, isAuthenticated, user, location, setLocation, isPublicRoute]);

  return <>{children}</>;
}
