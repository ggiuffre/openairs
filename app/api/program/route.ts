import { getOpenairs } from "@/app/data/getOpenairs";
import {
  answer,
  embeddingsFromPages,
  getAllPagesFromBaseUrl,
  longestCommonPrefix,
  scrapeWebsite,
} from "@/app/data/scraping";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name"); // name of the festival
  const question = searchParams.get("q"); // question to be asked to the model

  const openairs = await getOpenairs();
  const openair =
    openairs.find((o) => o.name === name) ??
    (name ? openairs.find((o) => o.name.includes(name)) : undefined);
  if (openair) {
    console.log(`✅ Selected ${openair.name}`);
    const baseUrl = openair.website;
    const pages = await getAllPagesFromBaseUrl({ baseUrl });
    const pagesAsText = await scrapeWebsite(pages);
    const prefix = longestCommonPrefix(pagesAsText);
    console.log("🚲 Starting to generate embeddings...");
    const embeddings = await embeddingsFromPages({ baseUrl, pagesAsText });
    if (question) {
      const ans = await answer(question, embeddings);
      console.log("✅ Returning response");
      return NextResponse.json({
        pages,
        pagesAsText,
        prefix,
        embeddings,
        question,
        ans,
      });
    }
    return NextResponse.json({ pages, pagesAsText, prefix, embeddings });
  }
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

const isTruthy = (param: string): boolean =>
  ["true", "1", "on", "yes"].includes(param.toLowerCase());
