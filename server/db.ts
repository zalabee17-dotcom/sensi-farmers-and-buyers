import { eq, or, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import bcrypt from "bcryptjs";
import { InsertUser, users, products, inquiries, orders, messages, authCredentials, type InsertProduct, type InsertInquiry, type InsertOrder, type InsertMessage, type InsertAuthCredential } from "../drizzle/schema";
import { ENV } from './_core/env';

const SALT_ROUNDS = 12;

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      (values as any)[field] = value;
      (updateSet as any)[field] = value;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ===== CUSTOM AUTH: Email/Password =====

export async function createUserWithEmail(data: {
  name: string;
  email: string;
  phone: string;
  location: string;
  password: string;
}) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Sanitize and normalize inputs
  const email = data.email.trim().toLowerCase();
  const name = data.name.trim();
  const phone = data.phone.trim();
  const location = data.location.trim();

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email address format");
  }

  // Validate required fields
  if (!name || !phone || !location) {
    throw new Error("All fields are required");
  }

  // Check if email already exists
  const existing = await db.select().from(authCredentials).where(eq(authCredentials.email, email)).limit(1);
  if (existing.length > 0) {
    throw new Error("An account with this email already exists");
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  // Use a deterministic openId based on email so it can be looked up later
  const openId = `email_${Buffer.from(email).toString('base64url').slice(0, 32)}`;

  // Create user
  const insertResult = await db.insert(users).values({
    openId,
    name,
    email,
    phone,
    location,
    loginMethod: "email",
    role: "user",
    lastSignedIn: new Date(),
  });

  const insertMeta = insertResult[0];
  const userId = (insertMeta as any)?.insertId ?? (insertMeta as any)?.id;
  if (!userId) {
    throw new Error("Failed to create user");
  }

  // Store credentials
  await db.insert(authCredentials).values({
    userId: userId,
    email,
    passwordHash,
  });

  return { id: userId, name, email, role: "user", openId };
}

export async function authenticateWithEmail(email: string, password: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Find credentials (sanitize email)
  const normalizedEmail = email.trim().toLowerCase();
  const [creds] = await db.select().from(authCredentials).where(eq(authCredentials.email, normalizedEmail)).limit(1);
  if (!creds) {
    throw new Error("Invalid email or password");
  }

  // Verify password
  const valid = await bcrypt.compare(password, creds.passwordHash);
  if (!valid) {
    throw new Error("Invalid email or password");
  }

  // Get user
  const [user] = await db.select().from(users).where(eq(users.id, creds.userId)).limit(1);
  if (!user) {
    throw new Error("User not found");
  }

  // Update last sign in
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));

  return user;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    return undefined;
  }
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ===== PRODUCTS =====

export async function createProduct(product: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(products).values(product);
  return result;
}

export async function getProductsByFarmer(farmerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(eq(products.farmerId, farmerId));
}

export async function getAllActiveProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(eq(products.isActive, true));
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateProduct(id: number, data: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, unknown> = {};
  if (data.cropName !== undefined) updateData.cropName = data.cropName;
  if (data.quantity !== undefined) updateData.quantity = data.quantity;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.location !== undefined) updateData.location = data.location;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  await db.update(products).set(updateData).where(eq(products.id, id));
  return getProductById(id);
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(products).set({ isActive: false }).where(eq(products.id, id));
  return true;
}

// ===== INQUIRIES =====

export async function createInquiry(inquiry: InsertInquiry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(inquiries).values(inquiry);
  return result;
}

export async function getInquiryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(inquiries).where(eq(inquiries.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getInquiriesByFarmer(farmerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inquiries).where(eq(inquiries.farmerId, farmerId));
}

export async function getInquiriesByBuyer(buyerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inquiries).where(eq(inquiries.buyerId, buyerId));
}

export async function updateInquiryStatus(id: number, status: "accepted" | "declined", responseMessage?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, unknown> = { status };
  if (responseMessage !== undefined) updateData.responseMessage = responseMessage;
  await db.update(inquiries).set(updateData).where(eq(inquiries.id, id));
  return getInquiryById(id);
}

// ===== ORDERS =====

export async function createOrder(order: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(orders).values(order);
  return result;
}

export async function getOrderByInquiryId(inquiryId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.inquiryId, inquiryId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOrdersByFarmer(farmerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.farmerId, farmerId));
}

export async function getOrdersByBuyer(buyerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.buyerId, buyerId));
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateOrderStatus(id: number, status: "confirmed" | "in-transit" | "delivered" | "cancelled") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orders).set({ status }).where(eq(orders.id, id));
  return getOrderById(id);
}

// ===== MESSAGES =====

export async function createMessage(message: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(messages).values(message);
  return result;
}

export async function getMessagesByInquiry(inquiryId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(eq(messages.inquiryId, inquiryId));
}
