import { NextRequest, NextResponse } from "next/server";
import { getAnalyticsEvents, logAnalyticsEvent } from "@/lib/supabaseAdmin";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/rateLimit";
import { handleRouteError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const clientId = getClientIdentifier(req.headers);
    const rateLimitResponse = checkRateLimit(`analytics:${clientId}`, RATE_LIMITS.analytics);
    if (rateLimitResponse) return rateLimitResponse;

    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: true, message: "User not identified", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const campaignId = req.nextUrl.searchParams.get("campaign_id") || undefined;
    const events = await getAnalyticsEvents(userId, campaignId);
    return NextResponse.json({ events });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const clientId = getClientIdentifier(req.headers);
    const rateLimitResponse = checkRateLimit(`analytics:${clientId}`, RATE_LIMITS.analytics);
    if (rateLimitResponse) return rateLimitResponse;

    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: true, message: "User not identified", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { event_type, campaign_id, metadata } = await req.json();
    if (!event_type) {
      return NextResponse.json(
        { error: true, message: "Event type is required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const event = await logAnalyticsEvent({
      user_id: userId,
      event_type,
      campaign_id: campaign_id || undefined,
      metadata: metadata || {},
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
