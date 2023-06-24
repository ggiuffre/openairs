import { getOpenairs } from "@/app/data/getOpenairs";
import { embeddingsFromText, scrape } from "@/app/data/scraping";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name"); // exact name of the festival
  const embed = searchParams.get("embed"); // whether to get embeddings instead of text

  const openairs = await getOpenairs();
  const openair =
    openairs.find((o) => o.name === name) ??
    (name ? openairs.find((o) => o.name.includes(name)) : undefined);
  console.log(openair);
  if (openair) {
    const text = await scrape(openair.website);
    if (embed && isTruthy(embed)) {
      const embeddings = await embeddingsFromText(text);
      return NextResponse.json({ embeddings });
    }
    return NextResponse.json({ text });
  }
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

const isTruthy = (param: string): boolean =>
  ["true", "1", "on", "yes"].includes(param.toLowerCase());
