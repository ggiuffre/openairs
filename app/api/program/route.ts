import { getOpenairs } from "@/app/data/getOpenairs";
import {
  getLineupFromScrapedText,
  getOpenairWebsiteText,
} from "@/app/data/scraping";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  const openairs = await getOpenairs();
  const openair = openairs.find((o) => o.name === name);
  if (openair && openair.artists) {
    const minimumText = await getOpenairWebsiteText({ openair });
    if (minimumText) {
      const program = await getLineupFromScrapedText({
        text: minimumText,
        references: [
          openair.artists[0],
          openair.artists[1],
          openair.artists[10],
        ],
      });
      return NextResponse.json({ program });
    }

    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
