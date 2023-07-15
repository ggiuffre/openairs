import { getOpenairs } from "@/app/data/getOpenairs";
import { getSlug } from "@/app/data/processing";
import { answer, jsonFromUnstructuredData } from "@/app/data/scraping";
import {
  getOpenairInfo,
  updateOpenairInfo,
} from "@/app/data/scraping/database";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name"); // name of the festival
  const question = searchParams.get("q"); // question to be asked to the model
  const cache = isTruthy(searchParams.get("cache") ?? true); // whether to use cached answer or not

  const openairs = await getOpenairs();
  const openair =
    openairs.find((o) => o.name === name) ??
    (name ? openairs.find((o) => o.name.includes(name)) : undefined);
  if (openair && question) {
    console.log(`🚲 Selected ${openair.name}`);
    const baseUrl = openair.website;
    const slug = getSlug(openair.name);
    const ans = await answer({ question, baseUrl, cache });
    let jsonAnswer = cache ? await getOpenairInfo(slug) : undefined;
    if (jsonAnswer !== undefined) {
      console.log(`✅ Found cached JSON answer`);
    } else {
      console.warn("🚲 Converting answer to JSON");
      const unsafeJson = ans
        ? await jsonFromUnstructuredData({
            data: ans,
            content: question.includes("artists") ? "artists" : undefined,
          })
        : {};
      if ("artists" in unsafeJson && Array.isArray(unsafeJson["artists"])) {
        console.log(`✅ Answer converted to JSON`);
        const lineup: string[] = unsafeJson["artists"];
        await updateOpenairInfo({ identifier: slug, data: { lineup } });
        jsonAnswer = { lineup };
        console.log(`✅ JSON answer stored`);
      } else if (Array.isArray(unsafeJson)) {
        console.log(`✅ Answer converted to JSON`);
        const lineup: string[] = unsafeJson;
        await updateOpenairInfo({ identifier: slug, data: { lineup } });
        jsonAnswer = { lineup };
        console.log(`✅ JSON answer stored`);
      } else {
        console.warn("⚠️ Answer could not be converted to JSON");
      }
    }
    return NextResponse.json({ question, ans, jsonAnswer });
  }
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

const isTruthy = (param: string | boolean): boolean =>
  ["true", "1", "on", "yes"].includes(param.toString().toLowerCase());
