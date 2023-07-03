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

interface WebsiteText {
  website: string;
  lines: string[];
}

interface WebsiteEmbeddings {
  website: string;
  embeddings: WordEmbedding[];
}

export const getCachedText = async (website: string) => {
  let document;
  const client = getClient();

  try {
    const database = client.db("scraping_cache");
    const collection = database.collection("webpages_text");
    const query = { website };
    document = await collection.findOne<WebsiteText>(query);
  } finally {
    // ensure that the client closes when the "try" block finishes/errors:
    await client.close();
  }

  return document?.lines.join("\n");
};

export const storeCachedText = async (website: string, lines: string[]) => {
  const client = getClient();

  try {
    const database = client.db("scraping_cache");
    const collection = database.collection("webpages_text");
    const document = { website, lines };
    const result = await collection.insertOne(document);
    console.log(`Inserted document with _id=${result.insertedId}`);
  } finally {
    // ensure that the client closes when the "try" block finishes/errors:
    await client.close();
  }
};

export const getCachedEmbeddings = async (website: string) => {
  let document;
  const client = getClient();

  try {
    const database = client.db("scraping_cache");
    const collection = database.collection("embeddings");
    const query = { website };
    document = await collection.findOne<WebsiteEmbeddings>(query);
  } finally {
    // ensure that the client closes when the "try" block finishes/errors:
    await client.close();
  }

  return document?.embeddings;
};

export const storeCachedEmbeddings = async (
  website: string,
  embeddings: WordEmbedding[]
) => {
  const client = getClient();

  try {
    const database = client.db("scraping_cache");
    const collection = database.collection("embeddings");
    const document = { website, embeddings };
    const result = await collection.insertOne(document);
    console.log(`Inserted document with _id=${result.insertedId}`);
  } finally {
    // ensure that the client closes when the "try" block finishes/errors:
    await client.close();
  }
};
