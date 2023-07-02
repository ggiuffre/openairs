import { MongoClient } from "mongodb";

const getClient = () => {
  const username = process.env.MONGODB_USERNAME;
  const password = process.env.MONGODB_PASSWORD;
  const host = process.env.MONGODB_HOST;
  const uri = `mongodb+srv://${username}:${password}@${host}/?retryWrites=true&w=majority`;
  const client = new MongoClient(uri);
  return client;
};

interface CachedWebsiteText {
  website: string;
  lines: string[];
}

interface CachedWebsiteEmbeddingsList {
  website: string;
  embeddings: number[];
}

export const getCachedText = async (website: string) => {
  const client = getClient();
  try {
    const database = client.db("scraping_cache");
    const collection = database.collection("webpages_text");
    const query = { website };
    const document = await collection.findOne<CachedWebsiteText>(query);
    return document?.lines.join("\n");
  } finally {
    // ensure that the client closes when the "try" block finishes/errors:
    await client.close();
  }
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
