import { NextRequest, NextResponse } from "next/server";
import { handleRouteError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: true, message: "Email and password are required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: true, message: "Password must be at least 8 characters", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Register via Supabase Auth
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: true, message: "Auth service not configured", code: "SERVER_ERROR" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      return NextResponse.json(
        { error: true, message: error.message, code: "REGISTRATION_ERROR" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Registration successful",
      user: { id: data.user?.id, email: data.user?.email },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
