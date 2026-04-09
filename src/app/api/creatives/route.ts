import { NextRequest, NextResponse } from "next/server";
import { getCreatives, createCreative } from "@/lib/supabaseAdmin";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/rateLimit";
import { handleRouteError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const clientId = getClientIdentifier(req.headers);
    const rateLimitResponse = checkRateLimit(`creatives:${clientId}`, RATE_LIMITS.general);
    if (rateLimitResponse) return rateLimitResponse;

    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: true, message: "User not identified", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const campaignId = req.nextUrl.searchParams.get("campaign_id") || undefined;
    const creatives = await getCreatives(userId, campaignId);
    return NextResponse.json({ creatives });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const clientId = getClientIdentifier(req.headers);
    const rateLimitResponse = checkRateLimit(`creatives:${clientId}`, RATE_LIMITS.adCreation);
    if (rateLimitResponse) return rateLimitResponse;

    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: true, message: "User not identified", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { content, platform, campaign_id, image_url } = await req.json();
    if (!content || !platform) {
      return NextResponse.json(
        { error: true, message: "Content and platform are required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const creative = await createCreative({
      user_id: userId,
      content,
      platform,
      campaign_id: campaign_id || undefined,
      image_url: image_url || undefined,
    });

    return NextResponse.json({ creative }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
