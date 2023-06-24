import { getOpenairs } from "@/app/data/getOpenairs";
import {
  cacheFileFromWebsite,
  cosineDistance,
  embeddingsFromText,
  scrape,
} from "@/app/data/scraping";
import { readFile } from "fs/promises";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name"); // exact name of the festival
  const embed = searchParams.get("embed"); // whether to get embeddings instead of text
  const question = searchParams.get("q"); // question to be asked to the model

  const openairs = await getOpenairs();
  const openair =
    openairs.find((o) => o.name === name) ??
    (name ? openairs.find((o) => o.name.includes(name)) : undefined);
  if (openair) {
    const text = await scrape(openair.website);
    if (embed && isTruthy(embed)) {
      const cacheFile = cacheFileFromWebsite(openair.website, {
        extension: "json",
      });
      const embeddings: number[][] = await readFile(cacheFile, "utf8")
        .then(JSON.parse)
        .then((data) => data.embeddings)
        .catch(() => embeddingsFromText(text));
      if (question) {
        const distances = await Promise.all(
          embeddings.map((embedding) => cosineDistance({ question, embedding }))
        );
        return NextResponse.json({ distances });
      }
      return NextResponse.json({ embeddings });
    }
    return NextResponse.json({ text });
  }
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

const isTruthy = (param: string): boolean =>
  ["true", "1", "on", "yes"].includes(param.toLowerCase());
