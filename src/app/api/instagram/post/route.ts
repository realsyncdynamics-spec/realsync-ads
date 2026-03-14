import { NextRequest, NextResponse } from "next/server";

const IG_USER_ID = process.env.INSTAGRAM_IG_USER_ID;
const IG_TOKEN = process.env.INSTAGRAM_LONG_LIVED_TOKEN;
const DEFAULT_IMAGE_URL = process.env.INSTAGRAM_DEFAULT_IMAGE_URL;

export async function POST(req: NextRequest) {
  try {
    const { caption, imageUrl } = await req.json();
    if (!caption) return NextResponse.json({ error: "caption fehlt" }, { status: 400 });
    if (!IG_USER_ID || !IG_TOKEN) return NextResponse.json({ error: "Instagram env vars missing" }, { status: 500 });

    const mediaUrl = imageUrl || DEFAULT_IMAGE_URL;
    if (!mediaUrl) return NextResponse.json({ error: "imageUrl fehlt" }, { status: 400 });

    const containerRes = await fetch(`https://graph.facebook.com/v20.0/${IG_USER_ID}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: mediaUrl, caption, access_token: IG_TOKEN }),
    });
    const containerData = await containerRes.json();
    if (!containerRes.ok || !containerData.id) {
      return NextResponse.json({ error: "Media-Container Fehler", details: containerData }, { status: 500 });
    }

    const publishRes = await fetch(`https://graph.facebook.com/v20.0/${IG_USER_ID}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: containerData.id, access_token: IG_TOKEN }),
    });
    const publishData = await publishRes.json();
    if (!publishRes.ok) {
      return NextResponse.json({ error: "Publish Fehler", details: publishData }, { status: 500 });
    }

    return NextResponse.json({ success: true, instagramPostId: publishData.id });
  } catch (error: any) {
    console.error("Instagram post error:", error);
    return NextResponse.json({ error: error.message || "Interner Fehler" }, { status: 500 });
  }
}
