import { NextRequest, NextResponse } from "next/server";
import { isSafeUrl } from "@/lib/urlValidation";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/rateLimit";
import { handleRouteError } from "@/lib/errors";
import { logAnalyticsEvent } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Rate limit: ad creation (10 req/min)
    const clientId = getClientIdentifier(req.headers);
    const rateLimitResponse = checkRateLimit(
      `instagram:${clientId}`,
      RATE_LIMITS.adCreation
    );
    if (rateLimitResponse) return rateLimitResponse;

    const IG_USER_ID = process.env.INSTAGRAM_IG_USER_ID;
    const IG_TOKEN = process.env.INSTAGRAM_LONG_LIVED_TOKEN;
    const DEFAULT_IMAGE_URL = process.env.INSTAGRAM_DEFAULT_IMAGE_URL;

    const { caption, imageUrl } = await req.json();
    if (!caption) {
      return NextResponse.json(
        { error: true, message: "Caption is required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }
    if (!IG_USER_ID || !IG_TOKEN) {
      return NextResponse.json(
        { error: true, message: "Instagram configuration missing", code: "SERVER_ERROR" },
        { status: 500 }
      );
    }

    const mediaUrl = imageUrl || DEFAULT_IMAGE_URL;
    if (!mediaUrl) {
      return NextResponse.json(
        { error: true, message: "Image URL is required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // SSRF protection: validate image URL
    if (!isSafeUrl(mediaUrl)) {
      return NextResponse.json(
        { error: true, message: "Invalid or disallowed image URL", code: "INVALID_URL" },
        { status: 400 }
      );
    }

    const containerRes = await fetch(`https://graph.facebook.com/v20.0/${IG_USER_ID}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: mediaUrl, caption, access_token: IG_TOKEN }),
    });
    const containerData = await containerRes.json();
    if (!containerRes.ok || !containerData.id) {
      return NextResponse.json(
        { error: true, message: "Failed to create media container", code: "INSTAGRAM_ERROR" },
        { status: 500 }
      );
    }

    const publishRes = await fetch(`https://graph.facebook.com/v20.0/${IG_USER_ID}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: containerData.id, access_token: IG_TOKEN }),
    });
    const publishData = await publishRes.json();
    if (!publishRes.ok) {
      return NextResponse.json(
        { error: true, message: "Failed to publish to Instagram", code: "INSTAGRAM_ERROR" },
        { status: 500 }
      );
    }

    // Log analytics event
    const userId = req.headers.get("x-user-id");
    if (userId) {
      try {
        await logAnalyticsEvent({
          user_id: userId,
          event_type: "instagram_post",
          metadata: { instagram_post_id: publishData.id },
        });
      } catch (dbErr) {
        console.error("Failed to log analytics event:", dbErr);
      }
    }

    return NextResponse.json({ success: true, instagramPostId: publishData.id });
  } catch (err) {
    return handleRouteError(err);
  }
}
