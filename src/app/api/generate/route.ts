import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(req: NextRequest) {
  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: "URL fehlt" }, { status: 400 });

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Fehler beim Laden: ${res.status}`);
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
    return NextResponse.json({ posts });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Interner Fehler" }, { status: 500 });
  }
}
