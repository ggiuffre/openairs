import { getOpenairs } from "@/app/data/getOpenairs";
import { answer } from "@/app/data/scraping";
import { ScrapedOpenairInfo } from "@/app/data/types";
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
  const topic = searchParams.get("q") ?? undefined; // topic that we want to know more about (e.g. "artists")
  const cache = isTruthy(searchParams.get("cache") ?? true); // whether to use cached info or not

  // check that topic is one of a set of enums, if present:
  if (!isValidTopic(topic)) {
    console.warn(`⚠️ Got invalid topic ${topic}`);
    return NextResponse.json(
      {
        error: `Topic "${topic}" is not allowed. Allowed values are: ${validTopics.join(
          ", "
        )}`,
      },
      { status: 400 }
    );
  }

  // find festival providing context to question:
  const openairs = await getOpenairs();
  const openair =
    openairs.find((o) => o.name === name) ??
    (name ? openairs.find((o) => o.name.includes(name)) : undefined);

  // answer question:
  if (openair) {
    console.log(`🚲 Selected ${openair.name}`);
    const ans = await answer({ topic, openair, cache });
    return NextResponse.json({ topic, ans });
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

const isTruthy = (param: string | boolean): boolean =>
  ["true", "1", "on", "yes"].includes(param.toString().toLowerCase());

const validTopics = ["artists", "isCampingPossible", "isFree"];

const isValidTopic = (
  value: string | undefined | keyof ScrapedOpenairInfo
): value is undefined | keyof ScrapedOpenairInfo =>
  value == undefined || validTopics.includes(value);
