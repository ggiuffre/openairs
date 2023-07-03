import { getOpenairs } from "@/app/data/getOpenairs";
import { answer, embeddingsFromText, scrape } from "@/app/data/scraping";
import {
  getCachedEmbeddings,
  storeCachedEmbeddings,
} from "@/app/data/scraping/database";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name"); // exact name of the festival
  const question = searchParams.get("q"); // question to be asked to the model

  const openairs = await getOpenairs();
  const openair =
    openairs.find((o) => o.name === name) ??
    (name ? openairs.find((o) => o.name.includes(name)) : undefined);
  if (openair) {
    const text = await scrape(openair.website);
    let embeddings = await getCachedEmbeddings(openair.website);
    if (embeddings === undefined) {
      embeddings = await embeddingsFromText(text);
      await storeCachedEmbeddings(openair.website, embeddings);
    }
    if (question) {
      const ans = await answer(question, embeddings);
      return NextResponse.json({ question, ans });
    }
    return NextResponse.json({ embeddings });
  }
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

const isTruthy = (param: string): boolean =>
  ["true", "1", "on", "yes"].includes(param.toLowerCase());
