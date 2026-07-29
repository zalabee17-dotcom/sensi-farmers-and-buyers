import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    signup: publicProcedure
      .input(z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Please enter a valid email"),
        phone: z.string().min(1, "Phone number is required"),
        location: z.string().min(2, "Location is required"),
        password: z.string().min(8, "Password must be at least 8 characters").max(128),
      }))
      .mutation(async ({ input }) => {
        return db.createUserWithEmail(input);
      }),
    login: publicProcedure
      .input(z.object({
        email: z.string().email("Please enter a valid email"),
        password: z.string().min(1, "Password is required"),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.authenticateWithEmail(input.email, input.password);

        // Set session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, JSON.stringify({ userId: user.id }), {
          ...cookieOptions,
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      }),
  }),

  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      return user ?? null;
    }),
    selectRole: protectedProcedure
      .input(z.object({ role: z.enum(["farmer", "buyer"]) }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }
        // Direct update since db helper doesn't have updateUserProfile
        return { ...user, role: input.role };
      }),
    update: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        bio: z.string().optional(),
        location: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.getUserById(ctx.user.id);
      }),
  }),

  products: router({
    list: publicProcedure.query(async () => {
      return db.getAllActiveProducts();
    }),
    search: publicProcedure
      .input(z.object({
        cropName: z.string().optional(),
        location: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const products = await db.getAllActiveProducts();
        let results = products;
        if (input.cropName) {
          const term = input.cropName.toLowerCase();
          results = results.filter(p => p.cropName.toLowerCase().includes(term));
        }
        if (input.location) {
          const term = input.location.toLowerCase();
          results = results.filter(p => p.location.toLowerCase().includes(term));
        }
        return results;
      }),
    myProducts: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "farmer") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only farmers can access their products" });
      }
      return db.getProductsByFarmer(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        cropName: z.string().min(1, "Crop name is required"),
        quantity: z.string().min(1, "Quantity is required"),
        price: z.string().min(1, "Price is required"),
        location: z.string().min(1, "Location is required"),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "farmer") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only farmers can create listings" });
        }
        return db.createProduct({
          ...input,
          farmerId: ctx.user.id,
          isActive: true,
        });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        cropName: z.string().optional(),
        quantity: z.string().optional(),
        price: z.string().optional(),
        location: z.string().optional(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "farmer") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only farmers can update listings" });
        }
        const { id, ...data } = input;
        return db.updateProduct(id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "farmer") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only farmers can delete listings" });
        }
        await db.deleteProduct(input.id);
        return { success: true };
      }),
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getProductById(input.id) ?? null;
      }),
  }),

  inquiries: router({
    buyerInquiries: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "buyer") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only buyers can view their inquiries" });
      }
      return db.getInquiriesByBuyer(ctx.user.id);
    }),
    farmerInquiries: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "farmer") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only farmers can view incoming inquiries" });
      }
      return db.getInquiriesByFarmer(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        farmerId: z.number(),
        productId: z.number(),
        message: z.string().min(1, "Message is required"),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "buyer") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only buyers can send inquiries" });
        }
        return db.createInquiry({
          buyerId: ctx.user.id,
          farmerId: input.farmerId,
          productId: input.productId,
          message: input.message,
          status: "pending",
        });
      }),
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["accepted", "declined"]),
        responseMessage: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "farmer") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only farmers can update inquiry status" });
        }
        return db.updateInquiryStatus(input.id, input.status, input.responseMessage);
      }),
  }),

  // --- Orders ---
  orders: router({
    farmerOrders: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "farmer") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only farmers can view their orders" });
      }
      return db.getOrdersByFarmer(ctx.user.id);
    }),
    buyerOrders: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "buyer") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only buyers can view their orders" });
      }
      return db.getOrdersByBuyer(ctx.user.id);
    }),
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getOrderById(input.id) ?? null;
      }),
    byInquiryId: publicProcedure
      .input(z.object({ inquiryId: z.number() }))
      .query(async ({ input }) => {
        return db.getOrderByInquiryId(input.inquiryId) ?? null;
      }),
    create: protectedProcedure
      .input(z.object({
        inquiryId: z.number(),
        orderedQuantity: z.string().min(1, "Order quantity is required"),
        totalPrice: z.string().min(1, "Total price is required"),
        deliveryLocation: z.string().optional(),
        estimatedDelivery: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "farmer") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only farmers can create orders" });
        }
        const inquiry = await db.getInquiryById(input.inquiryId);
        if (!inquiry || inquiry.farmerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Cannot create order for this inquiry" });
        }
        if (inquiry.status !== "accepted") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Can only create orders for accepted inquiries" });
        }
        const existing = await db.getOrderByInquiryId(input.inquiryId);
        if (existing) {
          return existing;
        }
        return db.createOrder({
          inquiryId: input.inquiryId,
          buyerId: inquiry.buyerId,
          farmerId: inquiry.farmerId,
          productId: inquiry.productId,
          orderedQuantity: input.orderedQuantity,
          totalPrice: input.totalPrice,
          deliveryLocation: input.deliveryLocation || null,
          estimatedDelivery: input.estimatedDelivery ? new Date(input.estimatedDelivery) : null,
          notes: input.notes || null,
          status: "confirmed",
        });
      }),
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["confirmed", "in-transit", "delivered", "cancelled"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const order = await db.getOrderById(input.id);
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        }
        if (ctx.user.role !== "farmer") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only farmers can update order status" });
        }
        if (order.farmerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Cannot update this order" });
        }
        return db.updateOrderStatus(input.id, input.status);
      }),
  }),

  // --- Messages ---
  messages: router({
    byInquiryId: publicProcedure
      .input(z.object({ inquiryId: z.number() }))
      .query(async ({ input }) => {
        return db.getMessagesByInquiry(input.inquiryId);
      }),
    create: protectedProcedure
      .input(z.object({
        inquiryId: z.number(),
        content: z.string().min(1, "Message content is required"),
      }))
      .mutation(async ({ ctx, input }) => {
        const inquiry = await db.getInquiryById(input.inquiryId);
        if (!inquiry) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Inquiry not found" });
        }
        if (ctx.user.id !== inquiry.buyerId && ctx.user.id !== inquiry.farmerId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to send messages on this inquiry" });
        }
        return db.createMessage({
          inquiryId: input.inquiryId,
          senderId: ctx.user.id,
          content: input.content,
        });
      }),
  }),

  // Utility to get a user by ID for display in inquiries
  users: router({
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getUserById(input.id) ?? null;
      }),
  }),
});

export type AppRouter = typeof appRouter;
