import { getOpenairs } from "@/app/data/getOpenairs";
import { getSlug } from "@/app/data/processing";
import {
  answer,
  embeddingsFromPages,
  jsonFromUnstructuredData,
  longestCommonPrefix,
  scrapeWebsite,
} from "@/app/data/scraping";
import { updateOpenairInfo } from "@/app/data/scraping/database";
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
    const pages = await scrapeWebsite(baseUrl);
    const prefix = longestCommonPrefix(pages);
    const embeddings = await embeddingsFromPages({ baseUrl, pages });
    if (question) {
      const ans = await answer(question, baseUrl, embeddings);
      const jsonAns = ans ? await jsonFromUnstructuredData(ans) : {};
      if ("artists" in jsonAns && Array.isArray(jsonAns["artists"])) {
        console.log(`✅ Answer converted to JSON`);
        const slug = getSlug(openair.name);
        const lineup: string[] = jsonAns["artists"];
        await updateOpenairInfo({ identifier: slug, data: { lineup } });
        console.log(`✅ JSON answer stored`);
      } else if (Array.isArray(jsonAns)) {
        console.log(`✅ Answer converted to JSON`);
        const slug = getSlug(openair.name);
        const lineup: string[] = jsonAns;
        await updateOpenairInfo({ identifier: slug, data: { lineup } });
        console.log(`✅ JSON answer stored`);
      } else {
        console.warn("⚠️ Answer could not be converted to JSON");
      }
      return NextResponse.json({
        pages,
        prefix,
        embeddings,
        question,
        ans,
        jsonAns,
      });
    }
    return NextResponse.json({ pages, prefix, embeddings });
  }
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

const isTruthy = (param: string): boolean =>
  ["true", "1", "on", "yes"].includes(param.toLowerCase());
