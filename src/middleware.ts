import { NextRequest, NextResponse } from "next/server";

/**
 * Next.js Edge Middleware for authentication and rate limiting on API routes.
 * Runs before route handlers.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only process API routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Public routes that skip auth
  if (
    pathname === "/api/health" ||
    pathname.startsWith("/api/auth/")
  ) {
    return NextResponse.next();
  }

  // --- JWT Authentication ---
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

  // Verify JWT using Web Crypto API (Edge Runtime compatible)
  try {
    const payload = await verifyJWT(token, secret);
    // Pass user info via headers to route handlers
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-id", payload.sub || "");
    requestHeaders.set("x-user-email", payload.email || "");
    requestHeaders.set("x-user-payload", JSON.stringify(payload));

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch {
    return NextResponse.json(
      { error: true, message: "Invalid or expired token", code: "INVALID_TOKEN" },
      { status: 401 }
    );
  }
}

/**
 * Verify a JWT token using the Web Crypto API (Edge Runtime compatible).
 * Supports HS256.
 */
async function verifyJWT(
  token: string,
  secret: string
): Promise<Record<string, string>> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid token format");

  const [headerB64, payloadB64, signatureB64] = parts;

  // Verify signature
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const data = encoder.encode(`${headerB64}.${payloadB64}`);
  const signature = base64UrlDecode(signatureB64);

  const valid = await crypto.subtle.verify("HMAC", key, signature, data);
  if (!valid) throw new Error("Invalid signature");

  // Decode payload
  const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadB64));
  const payload = JSON.parse(payloadJson);

  // Check expiration
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Token expired");
  }

  return payload;
}

function base64UrlDecode(str: string): Uint8Array {
  // Convert base64url to base64
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  // Pad with '='
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export const config = {
  matcher: "/api/:path*",
};
