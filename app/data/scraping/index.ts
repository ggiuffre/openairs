import { readFile, writeFile } from "fs/promises";
import path from "path";
import { Configuration, OpenAIApi } from "openai";
import { JSDOM } from "jsdom";

/**
 * Get the text content of the body of a website, either from a cache in the
 * filesystem or directly by crawling the website.
 * @param website the website to scrape
 */
export const scrape = async (website: string): Promise<string> => {
  // return cached text if present, otherwise crawl website manually:
  const cacheFile = cacheFileFromWebsite(website, { extension: "txt" });
  const websiteContent = await readFile(cacheFile, "utf8").catch(async () => {
    // declare function to recursively get content of text nodes:
    function getText(node: ChildNode) {
      if (node.nodeName === "SCRIPT") {
        return "";
      } else if (node.nodeType === 3) {
        return node.textContent; // text node
      } else {
        let text = "";
        for (const child of node.childNodes) {
          text += getText(child);
        }
        return text;
      }
    }

    // read the website and scrape its content:
    const dom = await JSDOM.fromURL(website);
    const text = getText(dom.window.document.body);
    const strippedText = text?.replace(/(\r\n|\r|\n)\s+/g, "\n");

    // cache the scraped text to a file:
    if (strippedText) {
      const data = new Uint8Array(Buffer.from(strippedText));
      await writeFile(cacheFile, data);
    }

    // return the scraped text:
    return strippedText ?? "";
  });
  return websiteContent;
};

export const getTextChunks = (text: string) => {
  const tokens = Array.from(text);
  const maxSize = 1000;
  const chunks = [];
  while (tokens.length > 0) {
    chunks.push(tokens.splice(0, maxSize));
  }
  return chunks;
};

export const embeddingsFromText = async (text: string) => {
  const api = new OpenAIApi(
    new Configuration({
      organization: process.env.OPENAI_ORG_ID,
      apiKey: process.env.OPENAI_API_KEY,
    })
  );

  const tokenChunks = getTextChunks(text);
  const embeddings = Promise.all(
    tokenChunks.map((tokens) =>
      api
        .createEmbedding({ model: "text-embedding-ada-002", input: tokens })
        .then((response) => response.data.data[0].embedding)
    )
  );

  return embeddings;
};

/**
 * Get the name of a cache file from a website to scrape information from.
 * @param website the website to scrape
 */
export const cacheFileFromWebsite = (
  website: string,
  { extension = "txt" }: { extension: "txt" | "json" }
) => {
  const jsonDirectory = path.join(process.cwd(), "app/data/scraping/.cache/");
  const fileName = website.slice(8).replaceAll("/", "_");
  return jsonDirectory + fileName + "." + extension;
};

export const cosineDistance = ({
  questionEmbedding,
  embedding,
}: {
  questionEmbedding: number[];
  embedding: number[];
}) => 1 - cosineSimilarity(questionEmbedding, embedding);

export const getContext = ({
  textChunks,
  distances,
  maxLength,
}: {
  textChunks: string[];
  distances: number[];
  maxLength: number;
}) => {
  // sort text chunks by distance to the question:
  textChunks.sort(
    (a, b) =>
      distances[textChunks.indexOf(b)] - distances[textChunks.indexOf(a)]
  );

  // add the most relevant text chunks to the context, until the maximum size is reached:
  let i = 0;
  let currentLength = 0;
  let mostRelevantEmbeddings: string[] = [];
  while (i < textChunks.length && currentLength < maxLength) {
    mostRelevantEmbeddings.push(textChunks[i]);
    currentLength += textChunks[i].length + 4;
    i++;
  }

  return mostRelevantEmbeddings.join("\n\n###\n\n");
};

export const answer = async (
  question: string,
  { embeddings, textChunks }: { embeddings: number[][]; textChunks: string[] }
) => {
  const api = new OpenAIApi(
    new Configuration({
      organization: process.env.OPENAI_ORG_ID,
      apiKey: process.env.OPENAI_API_KEY,
    })
  );

  const questionTokens = Array.from(question);
  const questionEmbedding = await api
    .createEmbedding({ model: "text-embedding-ada-002", input: questionTokens })
    .then((response) => response.data.data[0].embedding);

  const distances = embeddings.map((embedding) =>
    cosineDistance({ questionEmbedding, embedding })
  );

  const context = getContext({
    textChunks,
    distances,
    maxLength: 2000,
  });
  console.log(`${question} Here is some context.\n\n###\n\n${context}`);

  try {
    const completion = await api.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `${question} Here is some context.\n\n###\n\n${context}`,
        },
      ],
    });

    const result = completion.data.choices[0].message?.content;
    return result;
  } catch {
    return undefined;
  }
};

function cosineSimilarity(a: number[], b: number[]) {
  let dotproduct = 0;
  let mA = 0;
  let mB = 0;

  for (let i = 0; i < a.length; i++) {
    dotproduct += a[i] * b[i];
    mA += a[i] * a[i];
    mB += b[i] * b[i];
  }

  mA = Math.sqrt(mA);
  mB = Math.sqrt(mB);
  const similarity = dotproduct / (mA * mB);
  return similarity;
}
