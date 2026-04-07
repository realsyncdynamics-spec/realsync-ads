import { NextRequest, NextResponse } from "next/server";
import { getCampaigns, createCampaign } from "@/lib/supabaseAdmin";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/rateLimit";
import { handleRouteError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const clientId = getClientIdentifier(req.headers);
    const rateLimitResponse = checkRateLimit(`campaigns:${clientId}`, RATE_LIMITS.general);
    if (rateLimitResponse) return rateLimitResponse;

    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: true, message: "User not identified", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const campaigns = await getCampaigns(userId);
    return NextResponse.json({ campaigns });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const clientId = getClientIdentifier(req.headers);
    const rateLimitResponse = checkRateLimit(`campaigns:${clientId}`, RATE_LIMITS.adCreation);
    if (rateLimitResponse) return rateLimitResponse;

    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: true, message: "User not identified", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { name, platform, budget, status } = await req.json();
    if (!name || !platform) {
      return NextResponse.json(
        { error: true, message: "Name and platform are required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const campaign = await createCampaign({
      user_id: userId,
      name,
      platform,
      budget: budget || 0,
      status: status || "draft",
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
