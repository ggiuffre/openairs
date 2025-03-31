import { MongoClient } from "mongodb";
import type { ScrapedOpenairInfo } from "../types";

const getClient = () => {
  const username = process.env.MONGODB_USERNAME;
  const password = process.env.MONGODB_PASSWORD;
  const host = process.env.MONGODB_HOST;
  const uri = `mongodb+srv://${username}:${password}@${host}/?retryWrites=true&w=majority`;
  const client = new MongoClient(uri);
  return client;
};

const getCached = async <T>({
  collection,
  identifier,
}: {
  collection: string;
  identifier: string;
}) => {
  let document;
  const client = getClient();

  try {
    const database = client.db("scraping_cache");
    const collectionRef = database.collection(collection);
    const query = { identifier };
    document = await collectionRef.findOne<{ data: T }>(query);
  } finally {
    // ensure that the client closes when the "try" block finishes/errors:
    await client.close();
  }

  if (document) {
    console.log(`⚙️ Returning cached data from collection ${collection}`);
    return document.data;
  } else {
    console.log(`⚙️ Coll. ${collection} has no data for ${identifier}`);
    return undefined;
  }
};

export const updateOpenairInfo = async ({
  identifier,
  data,
}: {
  identifier: string;
  data: ScrapedOpenairInfo;
}) => {
  const client = getClient();

  const newInfo: Partial<ScrapedOpenairInfo> = {};
  if (data.scrapingDate) {
    newInfo["scrapingDate"] = data.scrapingDate;
  }
  if (data.artists) {
    newInfo["artists"] = data.artists;
  }
  if (data.isCampingPossible) {
    newInfo["isCampingPossible"] = data.isCampingPossible;
  }
  if (data.isFree) {
    newInfo["isFree"] = data.isFree;
  }

  try {
    const database = client.db("scraping_cache");
    const collection = "openairs_info";
    const collectionRef = database.collection(collection);
    const filter = { identifier };
    const update = { $set: { data: newInfo } };
    const options = { upsert: true };
    const result = await collectionRef.updateOne(filter, update, options);
    console.log(
      result.upsertedId
        ? `⚙️ Inserted document ${result.upsertedId} into collection ${collection}`
        : `⚙️ Updated existing document of collection ${collection}`
    );
  } finally {
    // ensure that the client closes when the "try" block finishes/errors:
    await client.close();
  }
};

export const getOpenairInfo = async (slug: string) => {
  const cached = await getCached<ScrapedOpenairInfo>({
    collection: "openairs_info",
    identifier: slug,
  });

  if (cached?.scrapingDate) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    if (cached.scrapingDate < sixMonthsAgo) {
      console.log(`⚙️ Cached data is stale. Returning undefined.`);
      return undefined;
    } else {
      return cached;
    }
  }
  return undefined;
};
