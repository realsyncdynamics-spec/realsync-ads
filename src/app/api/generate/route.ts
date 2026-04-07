import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import OpenAI from "openai";
import { isSafeUrl } from "@/lib/urlValidation";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/rateLimit";
import { handleRouteError } from "@/lib/errors";
import { createCreative } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit: ad creation (10 req/min)
    const clientId = getClientIdentifier(req.headers);
    const rateLimitResponse = checkRateLimit(
      `generate:${clientId}`,
      RATE_LIMITS.adCreation
    );
    if (rateLimitResponse) return rateLimitResponse;

    const { url } = await req.json();
    if (!url) {
      return NextResponse.json(
        { error: true, message: "URL is required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // SSRF protection: validate URL before fetching
    if (!isSafeUrl(url)) {
      return NextResponse.json(
        { error: true, message: "Invalid or disallowed URL", code: "INVALID_URL" },
        { status: 400 }
      );
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);
    const title = $("title").text().trim() || "RealSync Dynamics";
    const desc = $('meta[name="description"]').attr("content") || "Automatisierte Werbung mit KI.";

    const prompt = `Erstelle 3 Social-Media-Posts auf Deutsch:\nTitel: ${title}\nBeschreibung: ${desc}\nFuer: Instagram, LinkedIn, X.\n- Max 280 Zeichen pro Post\n- 5-7 Hashtags\n- Call-to-Action\n- Bildvorschlag in Klammern`;

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Du bist ein professioneller Social-Media-Texter." },
        { role: "user", content: prompt },
      ],
      max_tokens: 500,
    });

    const posts = completion.choices[0]?.message?.content?.trim() || "Keine Posts generiert.";

    // Persist generated creative to Supabase if user is authenticated
    const userId = req.headers.get("x-user-id");
    if (userId) {
      try {
        await createCreative({
          user_id: userId,
          content: posts,
          platform: "multi",
        });
      } catch (dbErr) {
        // Log but don't fail the request if persistence fails
        console.error("Failed to persist creative:", dbErr);
      }
    }

    return NextResponse.json({ posts });
  } catch (err) {
    return handleRouteError(err);
  }
}
