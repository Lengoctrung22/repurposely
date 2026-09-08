import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

const SECRET = process.env.AUTH_SECRET || "repurposely-ai-super-secret-key-min-32-chars-length";
const COOKIE_NAME = "repurposely_token";
const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
}

interface TokenPayload extends SessionUser {
  exp: number;
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str).toString("base64url");
}

function base64UrlDecode(str: string): string {
  return Buffer.from(str, "base64url").toString("utf-8");
}

function signPayload(payloadStr: string): string {
  return crypto.createHmac("sha256", SECRET).update(payloadStr).digest("base64url");
}

/**
 * Creates a cryptographically signed HMAC-SHA256 session token.
 */
export function createSessionToken(user: {
  id: string;
  email: string;
  name: string;
  role?: string;
}): string {
  const payload: TokenPayload = {
    id: user.id,
    email: user.email.toLowerCase().trim(),
    name: user.name,
    role: (user.role === "admin" ? "admin" : "user") as "user" | "admin",
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };

  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(payloadEncoded);
  return `${payloadEncoded}.${signature}`;
}

/**
 * Verifies and parses an HMAC-SHA256 session token with constant-time signature comparison.
 */
export function verifySessionToken(token: string): SessionUser | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payloadEncoded, signature] = parts;
    const expectedSignature = signPayload(payloadEncoded);

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payload: TokenPayload = JSON.parse(base64UrlDecode(payloadEncoded));

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

/**
 * Sets the session cookie on a NextResponse object.
 */
export function attachSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_TTL_SECONDS,
  });
}

/**
 * Clears the session cookie on a NextResponse object.
 */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Extracts the authenticated user from cookies, authorization headers, or dev mode fallback.
 */
export function getAuthenticatedUser(req: NextRequest): SessionUser | null {
  // 1. Check HTTP-Only Cookie
  const cookieToken = req.cookies.get(COOKIE_NAME)?.value;
  if (cookieToken) {
    const user = verifySessionToken(cookieToken);
    if (user) return user;
  }

  // 2. Check Authorization: Bearer <token>
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const bearerToken = authHeader.substring(7).trim();
    const user = verifySessionToken(bearerToken);
    if (user) return user;
  }

  // 3. Dev / Demo Mode Fallback for local development
  const demoRole = req.headers.get("x-demo-role");
  const demoEmail = req.headers.get("x-demo-email");
  if (process.env.NODE_ENV !== "production" && (demoRole || demoEmail)) {
    return {
      id: "demo-user-id",
      email: demoEmail || "demo@repurposely.ai",
      name: "Creator Demo",
      role: demoRole === "admin" ? "admin" : "user",
    };
  }

  // In local development, if no auth is provided at all, allow admin role for convenience
  // only when explicit development flag or localhost testing
  if (process.env.NODE_ENV !== "production" && req.headers.get("x-bypass-admin") === "true") {
    return {
      id: "dev-admin-id",
      email: "admin@repurposely.ai",
      name: "Dev Administrator",
      role: "admin",
    };
  }

  return null;
}

/**
 * Guard: Requires user to be authenticated.
 */
export function requireAuth(req: NextRequest): { user: SessionUser } | { errorResponse: NextResponse } {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return {
      errorResponse: NextResponse.json(
        { error: "Yêu cầu đăng nhập để thực hiện thao tác này" },
        { status: 401 }
      ),
    };
  }
  return { user };
}

/**
 * Guard: Requires user to be authenticated and possess "admin" role.
 */
export function requireAdmin(req: NextRequest): { user: SessionUser } | { errorResponse: NextResponse } {
  const user = getAuthenticatedUser(req);
  if (!user) {
    // In local non-production environment, allow fallback to admin if no header forbids it
    if (process.env.NODE_ENV !== "production") {
      return {
        user: {
          id: "dev-admin-id",
          email: "admin@repurposely.ai",
          name: "System Admin",
          role: "admin",
        },
      };
    }
    return {
      errorResponse: NextResponse.json(
        { error: "Yêu cầu đăng nhập tài khoản Quản trị viên" },
        { status: 401 }
      ),
    };
  }

  if (user.role !== "admin") {
    return {
      errorResponse: NextResponse.json(
        { error: "Truy cập bị từ chối: Bạn không có quyền Quản trị viên (Admin)" },
        { status: 403 }
      ),
    };
  }

  return { user };
}
