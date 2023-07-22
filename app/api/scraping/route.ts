import { getOpenairs } from "@/app/data/getOpenairs";
import { getCachedTexts } from "@/app/data/scraping/database";
import {
  longestCommonPrefix,
  withoutRepeatedPrefix,
} from "@/app/data/scraping/text";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // only expose this route on development:
  const environment = process.env.NODE_ENV;
  if (environment !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // parse query parameters:
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name"); // name of the festival

  // find festival providing context to question:
  const openairs = await getOpenairs();
  const openair =
    openairs.find((o) => o.name === name) ??
    (name ? openairs.find((o) => o.name.includes(name)) : undefined);

  if (openair) {
    console.log(`🚲 Selected ${openair.name}`);
    const texts = await getCachedTexts(openair.website);
    const prefix = texts ? longestCommonPrefix(texts) : undefined;
    const shortenedTexts = texts ? withoutRepeatedPrefix(texts) : undefined;
    return NextResponse.json({
      name: openair.name,
      prefix,
      texts,
      shortenedTexts,
    });
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
