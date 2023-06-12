import { getOpenairs } from "@/app/data/getOpenairs";
import { scrape } from "@/app/data/scraping";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name"); // exact name of the festival

  const openairs = await getOpenairs();
  const openair =
    openairs.find((o) => o.name === name) ??
    (name ? openairs.find((o) => o.name.includes(name)) : undefined);
  console.log(openair);
  if (openair) {
    console.log(">>>");
    const text = await scrape(openair.website);
    // const text = await scrape("https://openair.wiki");
    return NextResponse.json({ text });
  }
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

const isTruthy = (param: string): boolean =>
  ["true", "1", "on", "yes"].includes(param.toLowerCase());
