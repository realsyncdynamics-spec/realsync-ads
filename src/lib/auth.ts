import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export interface AuthUser {
  sub: string;
  email?: string;
  [key: string]: unknown;
}

/**
 * Verify JWT from the Authorization: Bearer header.
 * Returns the decoded payload on success, or a 401 NextResponse on failure.
 */
export function verifyAuth(req: NextRequest): AuthUser | NextResponse {
  const header = req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return NextResponse.json(
      { error: true, message: "Authentication required", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("JWT_SECRET environment variable is not set");
    return NextResponse.json(
      { error: true, message: "Server configuration error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }

  try {
    const decoded = jwt.verify(token, secret) as AuthUser;
    return decoded;
  } catch {
    return NextResponse.json(
      { error: true, message: "Invalid or expired token", code: "INVALID_TOKEN" },
      { status: 401 }
    );
  }
}

/**
 * Check if a request path is exempt from authentication.
 */
export function isPublicRoute(pathname: string): boolean {
  if (pathname === "/api/health") return true;
  if (pathname.startsWith("/api/auth/")) return true;
  return false;
}
