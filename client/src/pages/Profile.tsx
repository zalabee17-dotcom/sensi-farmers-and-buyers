import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import {
  Loader2,
  User,
  Mail,
  MapPin,
  Sprout,
  Handshake,
  Shield,
  Calendar,
  Save,
  Package,
  Inbox,
  Send,
} from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const { user, loading, isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", bio: "", location: "" });

  // Enforce role selection for authenticated users without a role
  if (isAuthenticated && user && user.role !== "farmer" && user.role !== "buyer" && user.role !== "admin") {
    setTimeout(() => setLocation("/select-role"), 0);
    return null;
  }

  const { data: profile, isLoading: profileLoading } = trpc.profile.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: products } = trpc.products.myProducts.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "farmer",
  });

  const { data: inquiries } = trpc.inquiries.buyerInquiries.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "buyer",
  });

  const { data: farmerInquiries } = trpc.inquiries.farmerInquiries.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "farmer",
  });

  const { data: allProducts } = trpc.products.list.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "buyer",
  });

  const utils = trpc.useUtils();
  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      setIsEditing(false);
      utils.profile.get.invalidate();
    },
    onError: () => toast.error("Failed to update profile"),
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Sign in to view your profile
          </h2>
          <Button onClick={() => setLocation("/login")}>Sign in</Button>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    updateProfile.mutate(editForm);
  };

  const startEdit = () => {
    setEditForm({
      name: profile?.name || "",
      bio: profile?.bio || "",
      location: profile?.location || "",
    });
    setIsEditing(true);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12">
      <div className="container max-w-4xl">
        <h1 className="text-3xl font-bold mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
          Profile
        </h1>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Left column: Account info */}
          <div className="md:col-span-1">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <User className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {profile?.name || "Anonymous"}
                </h2>
                <p className="text-sm text-muted-foreground mb-4">{profile?.email || "No email"}</p>

                <Badge
                  variant={profile?.role === "farmer" ? "default" : profile?.role === "buyer" ? "secondary" : "outline"}
                  className="mb-4 text-sm px-4 py-1"
                >
                  {profile?.role === "farmer" ? (
                    <>
                      <Sprout className="h-3 w-3 mr-1" />
                      Farmer
                    </>
                  ) : profile?.role === "buyer" ? (
                    <>
                      <Handshake className="h-3 w-3 mr-1" />
                      Buyer
                    </>
                  ) : (
                    <>
                      <Shield className="h-3 w-3 mr-1" />
                      {profile?.role}
                    </>
                  )}
                </Badge>

                <div className="space-y-3 text-sm text-left mt-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span>{profile?.email || "No email set"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>{profile?.location || "No location set"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span>Joined {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "N/A"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {!isEditing && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={startEdit}
              >
                <Save className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>

          {/* Right column: Details and activity */}
          <div className="md:col-span-2 space-y-6">
            {/* Editable section */}
            {isEditing ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Edit Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Name</label>
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Location</label>
                    <Input
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      placeholder="e.g., Kumasi, Ashanti Region"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Bio</label>
                    <Textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      placeholder="Tell others about yourself..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleSave} disabled={updateProfile.isPending}>
                      {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                    About
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {profile?.bio ? (
                    <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
                  ) : (
                    <p className="text-muted-foreground italic">No bio yet. Edit your profile to add one.</p>
                  )}
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Activity section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Activity History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user?.role === "farmer" ? (
                  <div className="space-y-3">
                    {/* Product listings */}
                    {products && products.length > 0 ? (
                      products
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .slice(0, 5)
                        .map((product) => (
                          <div key={`product-${product.id}`} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                              <Package className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                Listed "<span className="text-primary">{product.cropName}</span>"
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {product.quantity} at ${Number(product.price).toFixed(2)} in {product.location}
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {new Date(product.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))
                    ) : (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        No listings yet
                      </div>
                    )}
                    {/* Inquiries received */}
                    {farmerInquiries && farmerInquiries.length > 0 ? (
                      farmerInquiries
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .slice(0, 5)
                        .map((inquiry) => (
                          <div key={`inquiry-${inquiry.id}`} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="h-8 w-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                              <Inbox className="h-4 w-4 text-accent-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate">Inquiry for Product #{inquiry.productId}</p>
                                <Badge
                                  variant={
                                    inquiry.status === "accepted" ? "default" :
                                    inquiry.status === "declined" ? "destructive" : "secondary"
                                  }
                                  className="text-[10px] px-1.5 py-0"
                                >
                                  {inquiry.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                "{inquiry.message}"
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {new Date(inquiry.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))
                    ) : (
                      <div className="text-center py-2 text-sm text-muted-foreground">
                        No inquiries received yet
                      </div>
                    )}
                  </div>
                ) : user?.role === "buyer" ? (
                  <div className="space-y-3">
                    {inquiries && inquiries.length > 0 ? (
                      inquiries
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .slice(0, 10)
                        .map((inquiry) => {
                          const product = (allProducts as any[])?.find((p: any) => p.id === inquiry.productId);
                          return (
                            <div key={`inquiry-${inquiry.id}`} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                              <div className="h-8 w-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                                <Send className="h-4 w-4 text-accent-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium truncate">
                                    Inquiry about "{product?.cropName || "Product"}"
                                  </p>
                                  <Badge
                                    variant={
                                      inquiry.status === "accepted" ? "default" :
                                      inquiry.status === "declined" ? "destructive" : "secondary"
                                    }
                                    className="text-[10px] px-1.5 py-0"
                                  >
                                    {inquiry.status}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  "{inquiry.message}"
                                </p>
                              </div>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {new Date(inquiry.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          );
                        })
                    ) : (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        No inquiries sent yet
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">
                      Select a role to start your journey on Sensi AgroConnect.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setLocation("/select-role")}
                    >
                      Select Role
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
