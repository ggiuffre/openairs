import { getOpenairs } from "@/app/data/getOpenairs";
import {
  answer,
  embeddingsFromText,
  getAllPagesFromBaseUrl,
  scrape,
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
    console.log(`🚲 Discovering pages under ${openair.website}`);
    const pages = await getAllPagesFromBaseUrl(openair.website);
    console.log("🚲 Starting to scrape web pages...");
    const pagesAsText = await Promise.all(pages.map(scrape));
    console.log("🚲 Starting to generate embeddings...");
    const embeddings = await Promise.all(
      pagesAsText.map((text) => embeddingsFromText(text))
    ).then((result) => result.flat());
    if (question) {
      console.log("🚲 Asking question to OpenAI...");
      const ans = await answer(question, embeddings);
      console.log("✅ Returning response");
      return NextResponse.json({
        pages,
        pagesAsText,
        embeddings,
        question,
        ans,
      });
    }
    return NextResponse.json({ pages, pagesAsText, embeddings });
  }
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

const isTruthy = (param: string): boolean =>
  ["true", "1", "on", "yes"].includes(param.toLowerCase());
