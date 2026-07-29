import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { Search, MapPin, Package, Send, Loader2, Wheat } from "lucide-react";
import { toast } from "sonner";

export default function Marketplace() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Enforce role selection for authenticated users without a role
  if (isAuthenticated && user && user.role !== "farmer" && user.role !== "buyer" && user.role !== "admin") {
    setTimeout(() => setLocation("/select-role"), 0);
    return null;
  }
  const [searchCrop, setSearchCrop] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [inquiryMessage, setInquiryMessage] = useState("");

  const { data: allProducts, isLoading } = trpc.products.list.useQuery();

  const filteredProducts = useMemo(() => {
    if (!allProducts) return [];
    return allProducts.filter((p) => {
      const matchCrop = searchCrop ? p.cropName.toLowerCase().includes(searchCrop.toLowerCase()) : true;
      const matchLocation = searchLocation ? p.location.toLowerCase().includes(searchLocation.toLowerCase()) : true;
      return matchCrop && matchLocation;
    });
  }, [allProducts, searchCrop, searchLocation]);

  const createInquiry = trpc.inquiries.create.useMutation({
    onSuccess: () => {
      toast.success("Inquiry sent successfully!");
      setInquiryMessage("");
      setSelectedProduct(null);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to send inquiry");
    },
  });

  const handleSendInquiry = (productId: number, farmerId: number) => {
    if (!isAuthenticated || !user) {
      setLocation("/login");
      return;
    }
    if (user.role !== "buyer") {
      toast.error("Only buyers can send inquiries");
      return;
    }
    if (!inquiryMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }
    createInquiry.mutate({ productId, farmerId, message: inquiryMessage.trim() });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12">
      <div className="container">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            Marketplace
          </h1>
          <p className="text-muted-foreground text-lg">
            Browse fresh produce from farmers across Ghana.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by crop name..."
              value={searchCrop}
              onChange={(e) => setSearchCrop(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by location..."
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              className="pl-10"
            />
          </div>
          {(searchCrop || searchLocation) && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchCrop("");
                setSearchLocation("");
              }}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Results count */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading..." : `${filteredProducts.length} listing${filteredProducts.length !== 1 ? "s" : ""} found`}
          </p>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-32 mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <Wheat className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No listings found</h3>
            <p className="text-muted-foreground">
              {searchCrop || searchLocation
                ? "Try adjusting your search filters."
                : "Farmers haven't posted any listings yet."}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="group hover:shadow-lg transition-all duration-300 border-border/60 hover:border-primary/30"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                          {product.cropName}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {product.location}
                        </div>
                      </div>
                    </div>
                  </div>

                  {product.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-border/40">
                    <div>
                      <span className="text-2xl font-bold text-primary">
                        ${Number(product.price).toFixed(2)}
                      </span>
                      <span className="text-sm text-muted-foreground ml-1">/ {product.quantity}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Available
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter className="px-6 pb-6 pt-0">
                  <Dialog open={selectedProduct === product.id} onOpenChange={(open) => !open && setSelectedProduct(null)}>
                    <DialogTrigger asChild>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => {
                          setSelectedProduct(product.id);
                          setInquiryMessage("");
                        }}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send Inquiry
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Inquire About {product.cropName}</DialogTitle>
                        <DialogDescription>
                          Send a message to the farmer about this listing. They'll respond to your inquiry.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Quantity:</span>
                            <p className="font-medium">{product.quantity}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Price:</span>
                            <p className="font-medium">${Number(product.price).toFixed(2)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Location:</span>
                            <p className="font-medium">{product.location}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Listed:</span>
                            <p className="font-medium">{new Date(product.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <Textarea
                          placeholder="Write your inquiry message to the farmer..."
                          value={inquiryMessage}
                          onChange={(e) => setInquiryMessage(e.target.value)}
                          rows={4}
                        />
                        <div className="flex justify-end gap-3">
                          <Button variant="outline" onClick={() => setSelectedProduct(null)}>
                            Cancel
                          </Button>
                          <Button
                            onClick={() => handleSendInquiry(product.id, product.farmerId)}
                            disabled={createInquiry.isPending || !inquiryMessage.trim()}
                          >
                            {createInquiry.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Send className="h-4 w-4 mr-2" />
                            )}
                            Send Inquiry
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
