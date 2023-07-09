import { MongoClient } from "mongodb";
import type { WordEmbedding } from "../types";

const getClient = () => {
  const username = process.env.MONGODB_USERNAME;
  const password = process.env.MONGODB_PASSWORD;
  const host = process.env.MONGODB_HOST;
  const uri = `mongodb+srv://${username}:${password}@${host}/?retryWrites=true&w=majority`;
  const client = new MongoClient(uri);
  return client;
};

const getCached = async <T>(collectionName: string, identifier: string) => {
  let document;
  const client = getClient();

  try {
    const database = client.db("scraping_cache");
    const collection = database.collection(collectionName);
    const query = { identifier };
    document = await collection.findOne<{ data: T }>(query);
  } finally {
    // ensure that the client closes when the "try" block finishes/errors:
    await client.close();
  }

  if (document) {
    console.log(`⚙️ Returning cached data from collection ${collectionName}`);
    return document.data;
  } else {
    console.log(`⚙️ Coll. ${collectionName} has no data for ${identifier}`);
    return undefined;
  }
};

const cache = async <T>(
  collectionName: string,
  identifier: string,
  data: T
) => {
  const client = getClient();

  try {
    const database = client.db("scraping_cache");
    const collection = database.collection(collectionName);
    const document = { identifier, data };
    const result = await collection.insertOne(document);
    console.log(
      `⚙️ Inserted document ${result.insertedId} into collection ${collectionName}`
    );
  } finally {
    // ensure that the client closes when the "try" block finishes/errors:
    await client.close();
  }
};

export const getCachedUrls = (identifier: string) =>
  getCached<string[]>("urls", identifier);

export const storeCachedUrls = (identifier: string, data: string[]) =>
  cache<string[]>("urls", identifier, data);

export const getCachedText = (identifier: string) =>
  getCached<string[]>("texts", identifier);

export const storeCachedText = async (identifier: string, data: string[]) =>
  cache<string[]>("texts", identifier, data);

export const getCachedEmbeddings = (identifier: string) =>
  getCached<WordEmbedding[]>("embeddings", identifier);

export const storeCachedEmbeddings = async (
  identifier: string,
  data: WordEmbedding[]
) => cache<WordEmbedding[]>("embeddings", identifier, data);
