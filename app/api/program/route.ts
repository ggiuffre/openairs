import { getOpenairs } from "@/app/data/getOpenairs";
import { getSlug } from "@/app/data/processing";
import {
  answer,
  getArtistsFromUnstructuredData,
  getCampingInfoFromUnstructuredData,
  getPriceInfoFromUnstructuredData,
} from "@/app/data/scraping";
import {
  getOpenairInfo,
  updateOpenairInfo,
} from "@/app/data/scraping/database";
import type { ScrapedOpenairInfo } from "@/app/data/types";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // only expose this route on development:
  const environment = process.env.NODE_ENV;
  if (environment !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // parse query parameters:
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name"); // name of the festival
  const question = searchParams.get("q"); // question to be asked to the model
  const cache = isTruthy(searchParams.get("cache") ?? true); // whether to use cached info or not

  // find festival providing context to question:
  const openairs = await getOpenairs();
  const openair =
    openairs.find((o) => o.name === name) ??
    (name ? openairs.find((o) => o.name.includes(name)) : undefined);

  // answer question:
  if (openair && question) {
    console.log(`🚲 Selected ${openair.name}`);
    const baseUrl = openair.website;
    const slug = getSlug(openair.name);
    const ans = await answer({ question, baseUrl, cache });
    let jsonAnswer = await getOpenairInfo(slug);

    if (question.includes("artists") || question.includes("lineup")) {
      if (cache !== false && jsonAnswer?.artists !== undefined) {
        console.log(`✅ Found cached JSON answer`);
      } else {
        console.warn("🚲 Converting answer to JSON");
        const artists = ans
          ? await getArtistsFromUnstructuredData(ans)
          : undefined;
        if (artists !== undefined) {
          const newData: ScrapedOpenairInfo = {
            artists,
            isCampingPossible: jsonAnswer?.isCampingPossible,
            isFree: jsonAnswer?.isFree,
          };
          await updateOpenairInfo({ identifier: slug, data: newData });
          jsonAnswer = newData;
          console.log(`✅ JSON answer stored`);
        } else {
          console.warn("⚠️ Answer could not be converted to JSON");
        }
      }
    } else if (question.includes("camp") || question.includes("tent")) {
      if (
        cache !== false &&
        jsonAnswer?.isCampingPossible !== undefined &&
        jsonAnswer?.isCampingPossible !== null
      ) {
        console.log(`✅ Found cached JSON answer`);
      } else {
        console.warn("🚲 Converting answer to JSON");
        const isCampingPossible = ans
          ? await getCampingInfoFromUnstructuredData(ans)
          : undefined;
        if (isCampingPossible !== undefined) {
          const newData: ScrapedOpenairInfo = {
            artists: jsonAnswer?.artists,
            isCampingPossible,
            isFree: jsonAnswer?.isFree,
          };
          await updateOpenairInfo({ identifier: slug, data: newData });
          jsonAnswer = newData;
          console.log(`✅ JSON answer stored`);
        } else {
          console.warn("⚠️ Answer could not be converted to JSON");
        }
      }
    } else if (question.includes("price") || question.includes("free")) {
      if (
        cache !== false &&
        jsonAnswer?.isFree !== undefined &&
        jsonAnswer?.isFree !== null
      ) {
        console.log(`✅ Found cached JSON answer`);
      } else {
        console.warn("🚲 Converting answer to JSON");
        const isFree = ans
          ? await getPriceInfoFromUnstructuredData(ans)
          : undefined;
        if (isFree !== undefined) {
          const newData: ScrapedOpenairInfo = {
            artists: jsonAnswer?.artists,
            isCampingPossible: jsonAnswer?.isCampingPossible,
            isFree,
          };
          await updateOpenairInfo({ identifier: slug, data: newData });
          jsonAnswer = newData;
          console.log(`✅ JSON answer stored`);
        } else {
          console.warn("⚠️ Answer could not be converted to JSON");
        }
      }
    }
    return NextResponse.json({ question, ans, jsonAnswer });
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

const isTruthy = (param: string | boolean): boolean =>
  ["true", "1", "on", "yes"].includes(param.toString().toLowerCase());
