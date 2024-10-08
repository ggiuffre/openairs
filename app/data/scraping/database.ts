import { MongoClient } from "mongodb";
import type { ScrapedOpenairInfo, WordEmbedding } from "../types";

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

const cache = async <T>({
  collection,
  identifier,
  data,
}: {
  collection: string;
  identifier: string;
  data: T;
}) => {
  const client = getClient();

  try {
    const database = client.db("scraping_cache");
    const collectionRef = database.collection(collection);
    const document = { identifier, data };
    const result = await collectionRef.insertOne(document);
    console.log(
      `⚙️ Inserted document ${result.insertedId} into collection ${collection}`
    );
  } finally {
    // ensure that the client closes when the "try" block finishes/errors:
    await client.close();
  }
};

export const getCachedUrls = (website: string) =>
  getCached<string[]>({ collection: "urls", identifier: website });

export const storeCachedUrls = (website: string, urls: string[]) =>
  cache<string[]>({ collection: "urls", identifier: website, data: urls });

export const getCachedTexts = (website: string) =>
  getCached<string[]>({ collection: "texts", identifier: website });

export const storeCachedTexts = async (website: string, texts: string[]) =>
  cache<string[]>({ collection: "texts", identifier: website, data: texts });

export const getCachedEmbeddings = (website: string) =>
  getCached<WordEmbedding[]>({ collection: "embeddings", identifier: website });

export const storeCachedEmbeddings = async (
  website: string,
  embeddings: WordEmbedding[]
) =>
  cache<WordEmbedding[]>({
    collection: "embeddings",
    identifier: website,
    data: embeddings,
  });

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

export const getOpenairInfo = async (slug: string) =>
  getCached<ScrapedOpenairInfo>({
    collection: "openairs_info",
    identifier: slug,
  });
