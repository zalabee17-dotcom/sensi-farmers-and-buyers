import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import {
  Plus,
  Package,
  Edit,
  Trash2,
  Inbox,
  MapPin,
  DollarSign,
  Loader2,
  Check,
  X,
  Sprout,
  Wheat,
  MessageSquare,
  ShoppingCart,
  Truck,
  ClipboardCheck,
  Send,
} from "lucide-react";
import { toast } from "sonner";

export default function FarmerDashboard() {
  const { user, loading, isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const [, setLocation] = useLocation();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    cropName: "",
    quantity: "",
    price: "",
    location: "",
    description: "",
  });

  // Response dialog state
  const [responseInquiryId, setResponseInquiryId] = useState<number | null>(null);
  const [responseMessage, setResponseMessage] = useState("");

  // Create order dialog state
  const [orderInquiryId, setOrderInquiryId] = useState<number | null>(null);
  const [orderForm, setOrderForm] = useState({
    orderedQuantity: "",
    deliveryLocation: "",
    estimatedDelivery: "",
    notes: "",
  });

  // Chat dialog state
  const [chatInquiryId, setChatInquiryId] = useState<number | null>(null);
  const [chatMessage, setChatMessage] = useState("");

  useEffect(() => {
    if (!loading && isAuthenticated && user && user.role !== "farmer") {
      setLocation("/select-role");
    }
  }, [loading, isAuthenticated, user, setLocation]);

  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = trpc.products.myProducts.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "farmer",
  });

  const { data: inquiries, isLoading: inquiriesLoading, refetch: refetchInquiries } = trpc.inquiries.farmerInquiries.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "farmer",
  });

  const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = trpc.orders.farmerOrders.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "farmer",
  });

  const { data: chatMessages, refetch: refetchChatMessages } = trpc.messages.byInquiryId.useQuery(
    { inquiryId: chatInquiryId ?? 0 },
    { enabled: chatInquiryId !== null }
  );

  const utils = trpc.useUtils();

  const createProduct = trpc.products.create.useMutation({
    onSuccess: () => {
      toast.success("Product listing created!");
      setShowCreateDialog(false);
      resetForm();
      refetchProducts();
    },
    onError: (err) => toast.error(err.message || "Failed to create listing"),
  });

  const updateProduct = trpc.products.update.useMutation({
    onSuccess: () => {
      toast.success("Product listing updated!");
      setEditingProduct(null);
      resetForm();
      refetchProducts();
    },
    onError: (err) => toast.error(err.message || "Failed to update listing"),
  });

  const deleteProduct = trpc.products.delete.useMutation({
    onSuccess: () => {
      toast.success("Product listing deleted!");
      refetchProducts();
    },
    onError: (err) => toast.error(err.message || "Failed to delete listing"),
  });

  const updateInquiry = trpc.inquiries.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Inquiry status updated!");
      utils.inquiries.farmerInquiries.invalidate();
      refetchInquiries();
    },
    onError: (err) => toast.error(err.message || "Failed to update inquiry"),
  });

  const createOrder = trpc.orders.create.useMutation({
    onSuccess: () => {
      toast.success("Order created successfully!");
      setOrderInquiryId(null);
      setOrderForm({ orderedQuantity: "", deliveryLocation: "", estimatedDelivery: "", notes: "" });
      utils.inquiries.farmerInquiries.invalidate();
      utils.orders.farmerOrders.invalidate();
      refetchInquiries();
      refetchOrders();
    },
    onError: (err) => toast.error(err.message || "Failed to create order"),
  });

  const updateOrderStatus = trpc.orders.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Order status updated!");
      utils.orders.farmerOrders.invalidate();
      refetchOrders();
    },
    onError: (err) => toast.error(err.message || "Failed to update order"),
  });

  const sendMessage = trpc.messages.create.useMutation({
    onSuccess: () => {
      toast.success("Message sent!");
      setChatMessage("");
      refetchChatMessages();
    },
    onError: (err) => toast.error(err.message || "Failed to send message"),
  });

  const resetForm = () => {
    setFormData({ cropName: "", quantity: "", price: "", location: "", description: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct !== null) {
      updateProduct.mutate({ id: editingProduct, ...formData });
    } else {
      createProduct.mutate(formData);
    }
  };

  const startEdit = (product: NonNullable<typeof products>[0]) => {
    setEditingProduct(product.id);
    setFormData({
      cropName: product.cropName,
      quantity: product.quantity,
      price: product.price.toString(),
      location: product.location,
      description: product.description || "",
    });
  };

  const handleAcceptWithResponse = (inquiryId: number) => {
    updateInquiry.mutate({
      id: inquiryId,
      status: "accepted",
      responseMessage: responseMessage || undefined,
    });
    setResponseInquiryId(null);
    setResponseMessage("");
  };

  const handleCreateOrder = (inquiryId: number) => {
    const inquiry = inquiries?.find(i => i.id === inquiryId);
    if (!inquiry || !user) return;

    const product = products?.find(p => p.id === inquiry.productId);
    const pricePerUnit = product ? Number(product.price) : 0;

    // Parse quantity number from order form
    const qtyStr = orderForm.orderedQuantity.replace(/[^0-9.]/g, "");
    const qtyNum = parseFloat(qtyStr) || 1;
    const totalPrice = (pricePerUnit * qtyNum).toFixed(2);

    createOrder.mutate({
      inquiryId,
      orderedQuantity: orderForm.orderedQuantity,
      totalPrice,
      deliveryLocation: orderForm.deliveryLocation || undefined,
      estimatedDelivery: orderForm.estimatedDelivery || undefined,
      notes: orderForm.notes || undefined,
    });
  };

  const openChat = (inquiryId: number) => {
    setChatInquiryId(inquiryId);
    setChatMessage("");
    // Small delay to let the dialog open before fetching
    setTimeout(() => refetchChatMessages(), 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "farmer") {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Access Restricted
          </h2>
          <p className="text-muted-foreground mb-6">This dashboard is only available to Farmers.</p>
          <Button onClick={() => setLocation("/login")}>Sign in</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8">
      <div className="container max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
              Farmer Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Manage your listings, inquiries, and orders.</p>
          </div>
          <Dialog open={showCreateDialog || editingProduct !== null} onOpenChange={(open) => {
            if (!open) { setShowCreateDialog(false); setEditingProduct(null); resetForm(); }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => { setShowCreateDialog(true); resetForm(); }}>
                <Plus className="h-4 w-4 mr-2" />New Listing
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingProduct !== null ? "Edit Listing" : "Create New Listing"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Crop Name</label>
                  <Input value={formData.cropName} onChange={(e) => setFormData({ ...formData, cropName: e.target.value })} placeholder="e.g., Maize, Rice" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Quantity</label>
                    <Input value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} placeholder="e.g., 100 bags" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Price (USD)</label>
                    <Input value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} type="number" step="0.01" required />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Location</label>
                  <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} required />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Description</label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => { setShowCreateDialog(false); setEditingProduct(null); resetForm(); }}>Cancel</Button>
                  <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
                    {createProduct.isPending || updateProduct.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {editingProduct !== null ? "Update" : "Create"} Listing
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="listings">
          <TabsList className="mb-6">
            <TabsTrigger value="listings" className="gap-2"><Package className="h-4 w-4" />Listings</TabsTrigger>
            <TabsTrigger value="inquiries" className="gap-2"><Inbox className="h-4 w-4" />Inquiries</TabsTrigger>
            <TabsTrigger value="orders" className="gap-2"><ShoppingCart className="h-4 w-4" />Orders</TabsTrigger>
          </TabsList>

          {/* ===== LISTINGS TAB ===== */}
          <TabsContent value="listings">
            {productsLoading ? (
              <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => (<Card key={i}><CardContent className="p-6"><Skeleton className="h-6 w-32 mb-2" /><Skeleton className="h-4 w-full" /></CardContent></Card>))}</div>
            ) : !products || products.length === 0 ? (
              <Card><CardContent className="py-16 text-center">
                <Wheat className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No listings yet</h3>
                <p className="text-muted-foreground mb-6">Create your first product listing to start selling.</p>
                <Button onClick={() => { setShowCreateDialog(true); resetForm(); }}><Plus className="h-4 w-4 mr-2" />Create Listing</Button>
              </CardContent></Card>
            ) : (
              <div className="space-y-4">
                {products.map((product) => (
                  <Card key={product.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Package className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>{product.cropName}</h3>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{product.location}</span>
                              <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />${Number(product.price).toFixed(2)} / {product.quantity}</span>
                            </div>
                            {product.description && <p className="text-sm text-muted-foreground mt-2 max-w-xl line-clamp-2">{product.description}</p>}
                            <p className="text-xs text-muted-foreground mt-2">Listed {new Date(product.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button variant="ghost" size="sm" onClick={() => startEdit(product)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => { if (confirm("Delete this listing?")) deleteProduct.mutate({ id: product.id }); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
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
                <p className="text-muted-foreground">When buyers send inquiries, they'll appear here.</p>
              </CardContent></Card>
            ) : (
              <div className="space-y-4">
                {inquiries.map((inquiry) => (
                  <Card key={inquiry.id}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium">Inquiry about Product #{inquiry.productId}</h4>
                            <Badge variant={inquiry.status === "accepted" ? "default" : inquiry.status === "declined" ? "destructive" : "secondary"} className="text-xs">{inquiry.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{inquiry.message}</p>
                          {inquiry.responseMessage && (
                            <p className="text-sm bg-muted rounded-lg p-3 mb-3"><span className="font-medium">Your response:</span> {inquiry.responseMessage}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Received {new Date(inquiry.createdAt).toLocaleString()}</span>
                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => openChat(inquiry.id)}>
                              <MessageSquare className="h-3 w-3" />Messages
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          {inquiry.status === "pending" && (
                            <>
                              <Dialog open={responseInquiryId === inquiry.id} onOpenChange={(open) => !open && setResponseInquiryId(null)}>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="default" className="gap-1" onClick={() => setResponseInquiryId(inquiry.id)}><Check className="h-3 w-3" />Accept</Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader><DialogTitle>Accept Inquiry</DialogTitle><DialogDescription>Add an optional response message to the buyer.</DialogDescription></DialogHeader>
                                  <div className="space-y-4 pt-4">
                                    <Textarea placeholder="e.g., I can deliver 80 bags by Thursday." value={responseMessage} onChange={(e) => setResponseMessage(e.target.value)} rows={3} />
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setResponseInquiryId(null)}>Cancel</Button>
                                    <Button onClick={() => handleAcceptWithResponse(inquiry.id)}>Accept & Send Response</Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              <Button size="sm" variant="outline" className="gap-1 text-destructive hover:text-destructive" onClick={() => updateInquiry.mutate({ id: inquiry.id, status: "declined" })} disabled={updateInquiry.isPending}>
                                <X className="h-3 w-3" />Decline
                              </Button>
                            </>
                          )}
                          {inquiry.status === "accepted" && (
                            <Dialog open={orderInquiryId === inquiry.id} onOpenChange={(open) => !open && setOrderInquiryId(null)}>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="default" className="gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => { setOrderInquiryId(inquiry.id); setOrderForm({ orderedQuantity: "", deliveryLocation: "", estimatedDelivery: "", notes: "" }); }}>
                                  <ShoppingCart className="h-3 w-3" />Create Order
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Create Order</DialogTitle>
                                  <DialogDescription>Set the order details for this accepted inquiry.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                  <div className="grid grid-cols-2 gap-4 text-sm bg-muted/50 rounded-lg p-3">
                                    <div><span className="text-muted-foreground">Product:</span><p className="font-medium">{products?.find(p => p.id === inquiry.productId)?.cropName}</p></div>
                                    <div><span className="text-muted-foreground">Buyer ID:</span><p className="font-medium">#{inquiry.buyerId}</p></div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium mb-1 block">Ordered Quantity</label>
                                    <Input value={orderForm.orderedQuantity} onChange={(e) => setOrderForm({ ...orderForm, orderedQuantity: e.target.value })} placeholder="e.g., 80 bags" required />
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium mb-1 block">Delivery Location</label>
                                    <Input value={orderForm.deliveryLocation} onChange={(e) => setOrderForm({ ...orderForm, deliveryLocation: e.target.value })} placeholder="e.g., Tamale Market" />
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium mb-1 block">Estimated Delivery Date</label>
                                    <Input type="date" value={orderForm.estimatedDelivery} onChange={(e) => setOrderForm({ ...orderForm, estimatedDelivery: e.target.value })} />
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium mb-1 block">Notes</label>
                                    <Textarea value={orderForm.notes} onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })} rows={2} placeholder="Any additional notes..." />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setOrderInquiryId(null)}>Cancel</Button>
                                  <Button onClick={() => handleCreateOrder(inquiry.id)} disabled={!orderForm.orderedQuantity.trim()}>
                                    <ShoppingCart className="h-4 w-4 mr-2" />Create Order
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
                <p className="text-muted-foreground">Accept an inquiry and create an order to start fulfilling purchases.</p>
              </CardContent></Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
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
                  const product = products?.find(p => p.id === order.productId);

                  return (
                    <Card key={order.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
                                Order #{order.id}
                              </h4>
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
                            <p className="text-xs text-muted-foreground">Created {new Date(order.createdAt).toLocaleString()}</p>
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            {order.status === "confirmed" && (
                              <Button size="sm" variant="outline" className="gap-1" onClick={() => updateOrderStatus.mutate({ id: order.id, status: "in-transit" })} disabled={updateOrderStatus.isPending}>
                                <Truck className="h-3 w-3" />Mark In-Transit
                              </Button>
                            )}
                            {order.status === "in-transit" && (
                              <Button size="sm" variant="default" className="gap-1 bg-green-600 hover:bg-green-700" onClick={() => updateOrderStatus.mutate({ id: order.id, status: "delivered" })} disabled={updateOrderStatus.isPending}>
                                <Check className="h-3 w-3" />Mark Delivered
                              </Button>
                            )}
                            {(order.status === "confirmed" || order.status === "in-transit") && (
                              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive gap-1" onClick={() => updateOrderStatus.mutate({ id: order.id, status: "cancelled" })} disabled={updateOrderStatus.isPending}>
                                <X className="h-3 w-3" />Cancel
                              </Button>
                            )}
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
            <DialogDescription>Conversation with the buyer about this inquiry.</DialogDescription>
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
