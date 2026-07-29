import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table for custom authentication.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }).unique(),
  phone: varchar("phone", { length: 32 }),
  loginMethod: varchar("loginMethod", { length: 64 }).default("email").notNull(),
  role: mysqlEnum("role", ["user", "admin", "farmer", "buyer"]).default("user").notNull(),
  roleSelectedAt: timestamp("roleSelectedAt"),
  bio: text("bio"),
  location: varchar("location", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Stored credentials for email/password authentication.
 */
export const authCredentials = mysqlTable("authCredentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AuthCredential = typeof authCredentials.$inferSelect;
export type InsertAuthCredential = typeof authCredentials.$inferInsert;

/**
 * Product listings posted by farmers.
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  farmerId: int("farmerId").notNull(),
  cropName: varchar("cropName", { length: 128 }).notNull(),
  quantity: varchar("quantity", { length: 64 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Inquiries from buyers to farmers about specific listings.
 */
export const inquiries = mysqlTable("inquiries", {
  id: int("id").autoincrement().primaryKey(),
  buyerId: int("buyerId").notNull(),
  farmerId: int("farmerId").notNull(),
  productId: int("productId").notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "declined"]).default("pending").notNull(),
  responseMessage: text("responseMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = typeof inquiries.$inferInsert;

/**
 * Formal orders created when a farmer accepts a buyer's inquiry.
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  inquiryId: int("inquiryId").notNull().unique(),
  buyerId: int("buyerId").notNull(),
  farmerId: int("farmerId").notNull(),
  productId: int("productId").notNull(),
  orderedQuantity: varchar("orderedQuantity", { length: 64 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  deliveryLocation: varchar("deliveryLocation", { length: 255 }),
  estimatedDelivery: timestamp("estimatedDelivery"),
  status: mysqlEnum("status", ["confirmed", "in-transit", "delivered", "cancelled"]).default("confirmed").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Messages exchanged between buyer and farmer on a specific inquiry.
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  inquiryId: int("inquiryId").notNull(),
  senderId: int("senderId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
