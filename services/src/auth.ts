import { jwtVerify, SignJWT } from "jose";
import { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "crispy_chips_ultra_secure_jwt_signing_secret_key_32bytes_long";
const key = new TextEncoder().encode(JWT_SECRET);

export interface AuthUserPayload {
  userId: string;
  email: string;
  role: "customer";
}

export interface AuthAdminPayload {
  role: "admin";
}

export async function signAdminToken(): Promise<string> {
  return await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(key);
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function signUserToken(userId: string, email: string): Promise<string> {
  return await new SignJWT({ role: "customer", userId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(key);
}

export async function verifyUserToken(token: string): Promise<AuthUserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key);
    if (payload.role === "customer" && payload.userId && payload.email) {
      return { userId: payload.userId as string, email: payload.email as string, role: "customer" };
    }
    return null;
  } catch {
    return null;
  }
}

export async function getAuthUser(req: Request): Promise<AuthUserPayload | null> {
  const authHeader = (req.headers.authorization || req.headers["x-access-token"]) as string;
  let bearerToken: string | null = null;
  if (authHeader) {
    if (authHeader.startsWith("Bearer ")) {
      bearerToken = authHeader.slice(7).trim().replace(/^["']|["']$/g, "");
    } else {
      bearerToken = authHeader.trim().replace(/^["']|["']$/g, "");
    }
  }
  const cookieToken = req.cookies?.user_token || null;

  if (bearerToken) {
    const verified = await verifyUserToken(bearerToken);
    if (verified) return verified;
  }

  if (cookieToken) {
    return await verifyUserToken(cookieToken);
  }

  return null;
}

export async function getIsAdmin(req: Request): Promise<boolean> {
  const authHeader = (req.headers.authorization || req.headers["x-access-token"]) as string;
  let bearerToken: string | null = null;
  if (authHeader) {
    if (authHeader.startsWith("Bearer ")) {
      bearerToken = authHeader.slice(7).trim().replace(/^["']|["']$/g, "");
    } else {
      bearerToken = authHeader.trim().replace(/^["']|["']$/g, "");
    }
  }
  const cookieToken = req.cookies?.admin_token || null;

  if (bearerToken) {
    const valid = await verifyAdminToken(bearerToken);
    if (valid) return true;
  }

  if (cookieToken) {
    return await verifyAdminToken(cookieToken);
  }

  return false;
}

// Middleware to protect Customer routes
export async function requireUserMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ success: false, error: "Unauthenticated. Please log in." });
    return;
  }
  (req as any).user = user;
  next();
}

// Middleware to protect Admin routes
export async function requireAdminMiddleware(req: Request, res: Response, next: NextFunction) {
  const isAdmin = await getIsAdmin(req);
  if (!isAdmin) {
    res.status(401).json({ success: false, error: "Unauthorized. Admin access required." });
    return;
  }
  next();
}
