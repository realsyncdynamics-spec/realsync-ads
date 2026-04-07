import { NextResponse } from "next/server";

export interface ErrorResponse {
  error: true;
  message: string;
  code: string;
}

/**
 * Create a structured error response.
 */
export function errorResponse(
  message: string,
  code: string,
  status: number
): NextResponse<ErrorResponse> {
  return NextResponse.json({ error: true, message, code }, { status });
}

/**
 * Handle unknown errors and return a structured JSON response.
 * Prevents leaking internal error details to clients.
 */
export function handleRouteError(err: unknown): NextResponse<ErrorResponse> {
  console.error("Unhandled route error:", err);

  if (err instanceof SyntaxError) {
    return errorResponse("Invalid JSON in request body", "INVALID_JSON", 400);
  }

  return errorResponse(
    "An internal server error occurred",
    "INTERNAL_ERROR",
    500
  );
}
