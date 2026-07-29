import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import {
  Sprout,
  Users,
  Shield,
  Leaf,
  TrendingUp,
  Globe,
  ArrowRight,
  Wheat,
  Handshake,
  BarChart3,
} from "lucide-react";

const features = [
  {
    icon: Wheat,
    title: "Smart Marketplace",
    description: "Browse fresh produce listings from verified farmers across Ghana. Find quality crops at fair prices with transparent sourcing.",
  },
  {
    icon: Handshake,
    title: "Direct Trade",
    description: "Connect directly with farmers and buyers. Send inquiries, negotiate terms, and build lasting agricultural partnerships.",
  },
  {
    icon: Shield,
    title: "Secure Platform",
    description: "Enterprise-grade security protecting your data and transactions. Cloud-native architecture with end-to-end encryption.",
  },
  {
    icon: BarChart3,
    title: "Market Insights",
    description: "Access real-time pricing data and market trends to make informed decisions about your agricultural investments.",
  },
  {
    icon: Leaf,
    title: "Sustainable Farming",
    description: "Support sustainable agricultural practices. Our platform promotes eco-friendly farming and fair trade principles.",
  },
  {
    icon: Globe,
    title: "Community Network",
    description: "Join a growing community of farmers and buyers working together to transform agriculture in West Africa.",
  },
];

const stats = [
  { value: "500+", label: "Active Farmers" },
  { value: "200+", label: "Registered Buyers" },
  { value: "50+", label: "Crop Varieties" },
  { value: "10+", label: "Regions Covered" },
];

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 hero-gradient opacity-[0.06]" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

        <div className="container relative pt-20 pb-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 mb-8">
              <Sprout className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Connecting Ghana's Agricultural Future</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-gradient">
              Where Farmers Meet Buyers
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Sensi AgroConnect is a premium digital marketplace that bridges smallholder farmers
              with buyers across Ghana, enabling transparent trade and sustainable growth.
            </p>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              {!isAuthenticated ? (
                <>
                  <Button
                    size="lg"
                    className="text-base px-8 py-6 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                    onClick={() => setLocation("/signup")}
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-base px-8 py-6"
                    onClick={() => setLocation("/marketplace")}
                  >
                    Browse Marketplace
                  </Button>
                </>
              ) : (
                <Button
                  size="lg"
                  className="text-base px-8 py-6 shadow-lg shadow-primary/20 transition-all"
                  onClick={() => {
                    if (user?.role === "farmer") setLocation("/farmer/dashboard");
                    else if (user?.role === "buyer") setLocation("/buyer/dashboard");
                    else setLocation("/select-role");
                  }}
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="container">
          <div className="relative -mt-16 rounded-2xl border border-border/40 bg-background/60 backdrop-blur-xl p-8 shadow-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl font-bold text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Built for Agricultural Excellence
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage your agricultural business, from listing produce to closing deals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="border-border/60 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get started in three simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "1", title: "Create Account", desc: "Sign up as a Farmer or Buyer with your details" },
              { step: "2", title: "Connect", desc: "Farmers list produce, Buyers browse and send inquiries" },
              { step: "3", title: "Trade", desc: "Negotiate, confirm orders, and grow your business" },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            {!isAuthenticated && (
              <Button
                size="lg"
                className="shadow-lg shadow-primary/20"
                onClick={() => setLocation("/signup")}
              >
                Join Sensi AgroConnect
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Role Selection CTA */}
      {!isAuthenticated && (
        <section className="py-24">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                Choose Your Path
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Whether you grow or source, Sensi AgroConnect has the tools you need.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              <Card className="group border-border/60 hover:border-primary/60 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-14 w-14 rounded-2xl bg-primary/30 flex items-center justify-center">
                      <Wheat className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Farmer
                      </h3>
                      <p className="text-sm text-muted-foreground">Sell your produce</p>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4 text-primary shrink-0" />
                      List your crops and set your prices
                    </li>
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4 text-primary shrink-0" />
                      Receive inquiries from verified buyers
                    </li>
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Leaf className="h-4 w-4 text-primary shrink-0" />
                      Manage your agricultural business
                    </li>
                  </ul>
                  <Button
                    className="w-full"
                    onClick={() => setLocation("/signup")}
                  >
                    Sign up as Farmer
                  </Button>
                </CardContent>
              </Card>

              <Card className="group border-border/60 hover:border-accent/60 transition-all duration-300 hover:shadow-xl hover:shadow-accent/10 overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-14 w-14 rounded-2xl bg-accent/30 flex items-center justify-center">
                      <Handshake className="h-7 w-7 text-accent-foreground" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Buyer
                      </h3>
                      <p className="text-sm text-muted-foreground">Source quality produce</p>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4 text-accent-foreground shrink-0" />
                      Browse fresh listings from farmers
                    </li>
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4 text-accent-foreground shrink-0" />
                      Send direct inquiries to farmers
                    </li>
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Leaf className="h-4 w-4 text-accent-foreground shrink-0" />
                      Track all your purchase inquiries
                    </li>
                  </ul>
                  <Button
                    className="w-full"
                    onClick={() => setLocation("/signup")}
                  >
                    Sign up as Buyer
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sprout className="h-5 w-5 text-primary" />
              <span className="font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
                Sensi AgroConnect
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Empowering Ghana's agricultural community through technology.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
