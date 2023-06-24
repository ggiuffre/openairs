import { getOpenairs } from "@/app/data/getOpenairs";
import {
  answer,
  cacheFileFromWebsite,
  embeddingsFromText,
  getTextChunks,
  scrape,
} from "@/app/data/scraping";
import { readFile } from "fs/promises";
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
    const cacheFile = cacheFileFromWebsite(openair.website, {
      extension: "json",
    });
    const textChunks = getTextChunks(text).map((chunk) => chunk.join(""));
    const embeddings: number[][] = await readFile(cacheFile, "utf8")
      .then(JSON.parse)
      .then((data) => data.embeddings)
      .catch(() => embeddingsFromText(text));
    if (question) {
      const ans = await answer(question, { embeddings, textChunks });
      return NextResponse.json({ ans });
    }
    return NextResponse.json({ embeddings });
  }
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

const isTruthy = (param: string): boolean =>
  ["true", "1", "on", "yes"].includes(param.toLowerCase());
