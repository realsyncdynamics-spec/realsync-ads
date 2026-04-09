import { NextRequest, NextResponse } from "next/server";
import { getCampaignById, updateCampaign, deleteCampaign } from "@/lib/supabaseAdmin";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/rateLimit";
import { handleRouteError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const campaign = await getCampaignById(params.id, userId);
    if (!campaign) {
      return NextResponse.json(
        { error: true, message: "Campaign not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({ campaign });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const updates = await req.json();
    const campaign = await updateCampaign(params.id, userId, updates);
    return NextResponse.json({ campaign });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    await deleteCampaign(params.id, userId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
