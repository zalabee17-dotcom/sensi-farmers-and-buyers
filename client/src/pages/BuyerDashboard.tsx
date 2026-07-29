import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

import { useLocation } from "wouter";
import { useEffect, useState, useMemo } from "react";
import {
  Search,
  MapPin,
  Package,
  Send,
  Loader2,
  Sprout,
  Inbox,
  DollarSign,
  MessageSquare,
  ShoppingCart,
  Truck,
  ClipboardCheck,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";

export default function BuyerDashboard() {
  const { user, loading, isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const [, setLocation] = useLocation();
  const [searchCrop, setSearchCrop] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [inquiryMessage, setInquiryMessage] = useState("");

  // Chat dialog state
  const [chatInquiryId, setChatInquiryId] = useState<number | null>(null);
  const [chatMessage, setChatMessage] = useState("");

  useEffect(() => {
    if (!loading && isAuthenticated && user && user.role !== "buyer") {
      setLocation("/select-role");
    }
  }, [loading, isAuthenticated, user, setLocation]);

  const { data: allProducts, isLoading: productsLoading } = trpc.products.list.useQuery();
  const { data: inquiries, isLoading: inquiriesLoading, refetch: refetchInquiries } = trpc.inquiries.buyerInquiries.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "buyer",
  });
  const { data: orders, isLoading: ordersLoading } = trpc.orders.buyerOrders.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "buyer",
  });
  const { data: chatMessages, refetch: refetchChatMessages } = trpc.messages.byInquiryId.useQuery(
    { inquiryId: chatInquiryId ?? 0 },
    { enabled: chatInquiryId !== null }
  );

  const createInquiry = trpc.inquiries.create.useMutation({
    onSuccess: () => {
      toast.success("Inquiry sent successfully!");
      setInquiryMessage("");
      setSelectedProduct(null);
      refetchInquiries();
    },
    onError: (err) => toast.error(err.message || "Failed to send inquiry"),
  });

  const sendMessage = trpc.messages.create.useMutation({
    onSuccess: () => {
      toast.success("Message sent!");
      setChatMessage("");
      refetchChatMessages();
    },
    onError: (err) => toast.error(err.message || "Failed to send message"),
  });

  const filteredProducts = useMemo(() => {
    if (!allProducts) return [];
    return allProducts.filter((p) => {
      const matchCrop = searchCrop ? p.cropName.toLowerCase().includes(searchCrop.toLowerCase()) : true;
      const matchLocation = searchLocation ? p.location.toLowerCase().includes(searchLocation.toLowerCase()) : true;
      return matchCrop && matchLocation;
    });
  }, [allProducts, searchCrop, searchLocation]);

  const handleSendInquiry = (productId: number, farmerId: number) => {
    if (!inquiryMessage.trim()) { toast.error("Please enter a message"); return; }
    createInquiry.mutate({ productId, farmerId, message: inquiryMessage.trim() });
  };

  const openChat = (inquiryId: number) => {
    setChatInquiryId(inquiryId);
    setChatMessage("");
    setTimeout(() => refetchChatMessages(), 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "buyer") {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Access Restricted</h2>
          <p className="text-muted-foreground mb-6">This dashboard is only available to Buyers.</p>
          <Button onClick={() => setLocation("/login")}>Sign in</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8">
      <div className="container max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Buyer Dashboard</h1>
          <p className="text-muted-foreground mt-1">Browse listings, send inquiries, and track your orders.</p>
        </div>

        <Tabs defaultValue="browse">
          <TabsList className="mb-6">
            <TabsTrigger value="browse" className="gap-2"><Sprout className="h-4 w-4" />Browse Listings</TabsTrigger>
            <TabsTrigger value="inquiries" className="gap-2"><Inbox className="h-4 w-4" />My Inquiries</TabsTrigger>
            <TabsTrigger value="orders" className="gap-2"><ShoppingCart className="h-4 w-4" />My Orders</TabsTrigger>
          </TabsList>

          {/* ===== BROWSE TAB ===== */}
          <TabsContent value="browse">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by crop name..." value={searchCrop} onChange={(e) => setSearchCrop(e.target.value)} className="pl-10" />
              </div>
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Filter by location..." value={searchLocation} onChange={(e) => setSearchLocation(e.target.value)} className="pl-10" />
              </div>
            </div>

            {productsLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{Array.from({ length: 6 }).map((_, i) => (<Card key={i}><CardContent className="p-6"><Skeleton className="h-6 w-32 mb-3" /><Skeleton className="h-4 w-full mb-2" /><Skeleton className="h-4 w-3/4" /></CardContent></Card>))}</div>
            ) : filteredProducts.length === 0 ? (
              <Card><CardContent className="py-16 text-center">
                <Package className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No listings found</h3>
                <p className="text-muted-foreground">{searchCrop || searchLocation ? "Try adjusting your search." : "No produce listings available."}</p>
              </CardContent></Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 border-border/60 hover:border-primary/30">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>{product.cropName}</h3>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{product.location}</div>
                        </div>
                      </div>
                      {product.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>}
                      <div className="flex items-center justify-between pt-3 border-t border-border/40">
                        <div>
                          <span className="text-xl font-bold text-primary">${Number(product.price).toFixed(2)}</span>
                          <span className="text-xs text-muted-foreground ml-1">/ {product.quantity}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">Available</Badge>
                      </div>
                    </CardContent>
                    <CardFooter className="px-6 pb-6 pt-0">
                      <Dialog open={selectedProduct === product.id} onOpenChange={(open) => !open && setSelectedProduct(null)}>
                        <DialogTrigger asChild>
                          <Button className="w-full" variant="outline" onClick={() => { setSelectedProduct(product.id); setInquiryMessage(""); }}>
                            <Send className="h-4 w-4 mr-2" />Send Inquiry
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Inquire About {product.cropName}</DialogTitle><DialogDescription>Send a message to the farmer about this listing.</DialogDescription></DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div className="grid grid-cols-2 gap-4 text-sm bg-muted/50 rounded-lg p-4">
                              <div><span className="text-muted-foreground">Quantity:</span><p className="font-medium">{product.quantity}</p></div>
                              <div><span className="text-muted-foreground">Price:</span><p className="font-medium">${Number(product.price).toFixed(2)}</p></div>
                              <div><span className="text-muted-foreground">Location:</span><p className="font-medium">{product.location}</p></div>
                              <div><span className="text-muted-foreground">Listed:</span><p className="font-medium">{new Date(product.createdAt).toLocaleDateString()}</p></div>
                            </div>
                            <Textarea placeholder="Write your inquiry message..." value={inquiryMessage} onChange={(e) => setInquiryMessage(e.target.value)} rows={4} />
                            <div className="flex justify-end gap-3">
                              <Button variant="outline" onClick={() => setSelectedProduct(null)}>Cancel</Button>
                              <Button onClick={() => handleSendInquiry(product.id, product.farmerId)} disabled={createInquiry.isPending || !inquiryMessage.trim()}>
                                {createInquiry.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}Send
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
          </TabsContent>

          {/* ===== INQUIRIES TAB ===== */}
          <TabsContent value="inquiries">
            {inquiriesLoading ? (
              <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => (<Card key={i}><CardContent className="p-6"><Skeleton className="h-6 w-32 mb-2" /><Skeleton className="h-4 w-full" /></CardContent></Card>))}</div>
            ) : !inquiries || inquiries.length === 0 ? (
              <Card><CardContent className="py-16 text-center">
                <Inbox className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No inquiries yet</h3>
                <p className="text-muted-foreground">Browse listings and send inquiries to start buying.</p>
              </CardContent></Card>
            ) : (
              <div className="space-y-4">
                {inquiries.map((inquiry) => {
                  const product = allProducts?.find(p => p.id === inquiry.productId);
                  return (
                    <Card key={inquiry.id}>
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Package className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>{product?.cropName || "Product"}</h4>
                              <Badge variant={inquiry.status === "accepted" ? "default" : inquiry.status === "declined" ? "destructive" : "secondary"} className="text-xs">{inquiry.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{inquiry.message}</p>
                            {inquiry.responseMessage && (
                              <p className="text-sm bg-muted rounded-lg p-3 mb-2"><span className="font-medium">Farmer's response:</span> {inquiry.responseMessage}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{product ? `$${Number(product.price).toFixed(2)} / ${product.quantity}` : ""}</span>
                              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{product?.location || ""}</span>
                              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => openChat(inquiry.id)}>
                                <MessageSquare className="h-3 w-3" />Messages
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ===== ORDERS TAB ===== */}
          <TabsContent value="orders">
            {ordersLoading ? (
              <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => (<Card key={i}><CardContent className="p-6"><Skeleton className="h-6 w-32 mb-2" /><Skeleton className="h-4 w-full" /></CardContent></Card>))}</div>
            ) : !orders || orders.length === 0 ? (
              <Card><CardContent className="py-16 text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No orders yet</h3>
                <p className="text-muted-foreground">When a farmer accepts your inquiry and creates an order, it will appear here.</p>
              </CardContent></Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const product = allProducts?.find(p => p.id === order.productId);
                  const statusColors: Record<string, string> = {
                    confirmed: "bg-blue-100 text-blue-800",
                    "in-transit": "bg-amber-100 text-amber-800",
                    delivered: "bg-green-100 text-green-800",
                    cancelled: "bg-red-100 text-red-800",
                  };
                  const statusIcons: Record<string, React.ReactNode> = {
                    confirmed: <ClipboardCheck className="h-5 w-5 text-blue-600" />,
                    "in-transit": <Truck className="h-5 w-5 text-amber-600" />,
                    delivered: <Check className="h-5 w-5 text-green-600" />,
                    cancelled: <X className="h-5 w-5 text-red-600" />,
                  };

                  return (
                    <Card key={order.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            {statusIcons[order.status] || <ShoppingCart className="h-6 w-6 text-primary" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>Order #{order.id}</h4>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                                {order.status}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-3">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Package className="h-3.5 w-3.5" />
                                <span>{product?.cropName || "Product"} — {order.orderedQuantity}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <DollarSign className="h-3.5 w-3.5" />
                                <span className="font-medium text-foreground">${Number(order.totalPrice).toFixed(2)}</span>
                              </div>
                              {order.deliveryLocation && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <MapPin className="h-3.5 w-3.5" />
                                  <span>{order.deliveryLocation}</span>
                                </div>
                              )}
                              {order.estimatedDelivery && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Truck className="h-3.5 w-3.5" />
                                  <span>Delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                            {order.notes && (
                              <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-2 mb-3">
                                <span className="font-medium">Notes:</span> {order.notes}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">Order placed {new Date(order.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ===== CHAT DIALOG ===== */}
      <Dialog open={chatInquiryId !== null} onOpenChange={(open) => !open && setChatInquiryId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />Messages
            </DialogTitle>
            <DialogDescription>Conversation with the farmer about this inquiry.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {chatMessages && chatMessages.length > 0 ? (
              chatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.senderId === user?.id ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${msg.senderId === user?.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <p>{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${msg.senderId === user?.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No messages yet. Start the conversation!</p>
            )}
          </div>
          <Separator />
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && chatMessage.trim() && chatInquiryId !== null) {
                  sendMessage.mutate({ inquiryId: chatInquiryId, content: chatMessage.trim() });
                }
              }}
            />
            <Button
              onClick={() => chatInquiryId !== null && sendMessage.mutate({ inquiryId: chatInquiryId, content: chatMessage.trim() })}
              disabled={!chatMessage.trim() || sendMessage.isPending}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
