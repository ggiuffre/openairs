import { getOpenairs } from "@/app/data/getOpenairs";
import {
  ask,
  cacheStrategies,
  isValidCacheStrategy,
} from "@/app/data/scraping";
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
  const topic = searchParams.get("q") ?? undefined; // topic that we want to know more about (e.g. "artists")
  const cache = searchParams.get("cache") ?? "embeddings"; // what cache to use

  // check that cache strategy is one of a set of enums, if present:
  if (!isValidCacheStrategy(cache)) {
    console.warn(`⚠️ Got invalid cache strategy ${cache}`);
    const allowedValuesString = cacheStrategies.join(", ");
    const error = `Unknown cache strategy "${cache}". Allowed values: ${allowedValuesString}`;
    return NextResponse.json({ error }, { status: 400 });
  }

  // check that topic is one of a set of enums, if present:
  if (!isValidTopic(topic)) {
    console.warn(`⚠️ Got invalid topic ${topic}`);
    const allowedValuesString = validTopics.join(", ");
    const error = `Unknown topic "${topic}". Allowed values: ${allowedValuesString}`;
    return NextResponse.json({ error }, { status: 400 });
  }

  // find festival providing context to question:
  const openairs = await getOpenairs();
  const openair =
    openairs.find((o) => o.name === name) ??
    (name ? openairs.find((o) => o.name.includes(name)) : undefined);

  // check that festival is known:
  if (!openair) {
    console.warn(`⚠️ Couldn't find festival from name ${name}`);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // answer question:
  const answer = await ask({ openair, topic, cache });
  return NextResponse.json({ answer });
}

const validTopics = ["artists", "isCampingPossible", "isFree"];

const isValidTopic = (
  value: string | undefined | keyof ScrapedOpenairInfo
): value is undefined | keyof ScrapedOpenairInfo =>
  value == undefined || validTopics.includes(value);
