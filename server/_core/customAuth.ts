import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import * as db from "../db";
import type { Express, Request, Response } from "express";

export function registerCustomAuthRoutes(app: Express) {
  /**
   * Custom login: POST /api/auth/login
   * Accepts email + password, verifies credentials, creates a JWT session token
   * using the same mechanism as OAuth, and sets the app_session_id cookie.
   */
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      res.status(400).json({ error: "Invalid email address format" });
      return;
    }

    try {
      const user = await db.authenticateWithEmail(email, password); // sanitize happens in db
      if (!user) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      // Create a session token using the same JWT mechanism as OAuth
      const sessionToken = await sdk.signSession(
        {
          openId: user.openId ?? `user_${user.id}`,
          appId: process.env.VITE_APP_ID || "",
          name: user.name ?? "",
        },
        { expiresInMs: 30 * 24 * 60 * 60 * 1000 } // 30 days
      );

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });

      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error: any) {
      console.error("[CustomAuth] Login failed:", error);
      res.status(401).json({ error: error.message || "Login failed" });
    }
  });

  /**
   * Custom signup: POST /api/auth/signup
   * Creates a new user with email/password, stores hashed credentials,
   * and logs them in automatically.
   */
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    const { name, email, phone, location, password } = req.body;

    if (!name || !email || !phone || !location || !password) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      res.status(400).json({ error: "Invalid email address format" });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }

    try {
      const result = await db.createUserWithEmail({
        name,
        email,
        phone,
        location,
        password,
      });

      // Create session token and log in automatically
      const sessionToken = await sdk.signSession(
        {
          openId: result.openId,
          appId: process.env.VITE_APP_ID || "",
          name: result.name,
        },
        { expiresInMs: 30 * 24 * 60 * 60 * 1000 } // 30 days
      );

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });

      res.json({
        success: true,
        user: result,
      });
    } catch (error: any) {
      console.error("[CustomAuth] Signup failed:", error);
      res.status(400).json({ error: error.message || "Signup failed" });
    }
  });
}
