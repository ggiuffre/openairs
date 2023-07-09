import path from "path";
import { Configuration, OpenAIApi } from "openai";
import { JSDOM } from "jsdom";
import {
  getCachedEmbeddings,
  getCachedText,
  getCachedUrls,
  storeCachedEmbeddings,
  storeCachedText,
  storeCachedUrls,
} from "./database";
import type { WordEmbedding } from "../types";
import { decode, encode } from "gpt-tokenizer";
import XXH from "xxhashjs";

/**
 * Get the text content of the body of a web page, either from a cache in the
 * filesystem or directly by crawling the web page.
 * @param page the web page to scrape
 */
export const scrape = async (page: string): Promise<string> => {
  console.log(`🚲 Start scraping: ${page}`);

  // return cached text if present, otherwise crawl page manually:
  const cachedText = await getCachedText(page);
  if (cachedText) {
    console.log("✅ Found cached scraped text.");
    return cachedText;
  }

  try {
    console.log("🚲 Scraping page manually...");

    // read the page and parse its content:
    const dom = await JSDOM.fromURL(page).catch(() => undefined);
    if (dom === undefined) {
      console.warn("⚠️ Problem getting DOM from URL. Returning empty string.");
      return "";
    }

    // scrape tex from the page:
    const text = getText(dom.window.document.body)
      ?.replace(/(\r\n|\r|\n)\s+/g, "\n")
      .replace(/\s\n/g, "\n")
      .trim();

    // cache and return scraped text:
    await storeCachedText(page, text.split("\n"));
    console.log(`✅ Returning scraped text ${text.substring(0, 18)}...`);
    return text;
  } catch {
    console.warn("⚠️ Exception was thrown. Returning empty string.");
    return "";
  }
};

/**
 * Texts that we want to ignore while scraping a web page.
 */
const ignoredTexts = [
  "back to top",
  "back to the top",
  "go to main content",
  "skip to main content",
];

/**
 * Get the text content of an HTML node.
 * @param node the HTML node
 */
const getText = (node: ChildNode): string => {
  if (["SCRIPT", "IFRAME"].includes(node.nodeName)) {
    return "";
  } else if (node.nodeType === 3) {
    if (
      node.textContent?.startsWith("<iframe") ||
      ignoredTexts.includes(node.textContent?.toLowerCase() ?? "")
    ) {
      return "";
    }
    return node.textContent ?? ""; // text node
  } else {
    return Array.from(node.childNodes)
      .map(getText)
      .filter((text) => text !== "")
      .join(" ");
  }
};

/**
 * Get a list of web pages recursively referenced from a base URL.
 * @param baseUrl the base URL
 */
export const getAllPagesFromBaseUrl = async (
  baseUrl: string
): Promise<string[]> => {
  const cachedUrls = await getCachedUrls(baseUrl);
  if (cachedUrls) {
    return cachedUrls;
  }

  const withTrailingSlash = (address: string) =>
    address[-1] === "/" ? address : address + "/";

  try {
    // parse the page:
    const dom = await JSDOM.fromURL(baseUrl).catch(() => undefined);
    if (dom === undefined) {
      return [];
    }

    // get URLs of pages down the tree:
    const hrefs = Array.from(dom.window.document.querySelectorAll("a"))
      .map((link) => link.href)
      .filter((href) => !href.endsWith(".pdf"))
      .filter((href) => !href.endsWith("rss/"))
      .filter((href) => !href.includes("/:"))
      .filter((href) => !href.includes("/login"))
      .map((href) => href.split("#")[0])
      .filter(
        (href) =>
          href.includes(baseUrl) &&
          withTrailingSlash(href) !== withTrailingSlash(baseUrl)
      );
    const directChildren = [...new Set(hrefs)];
    const descendants = await Promise.all(
      directChildren.map(getAllPagesFromBaseUrl)
    ).then((pages) => pages.flat());

    // cache and return unique URLs that are sub-pages of the base URL:
    const urls = [baseUrl, ...new Set(descendants)];
    await storeCachedUrls(baseUrl, urls);
    return urls;
  } catch {
    return [];
  }
};

/**
 * Get an array of token arrays from an arbitrarily long string, where each
 * token array is of a specified maximum length.
 * @param text an arbitrarily long string of text
 * @param maxSize the max amount of tokens that each element of the result should have
 */
export const getTokenChunks = (
  text: string,
  { maxSize = 500 }: { maxSize?: number } = {}
) => {
  const tokens = encode(text);
  const chunks = [];
  const delimiters = [".", "\n"].map((text) => encode(text)[0]);
  while (tokens.length > 0) {
    const lastSentenceEnd = tokens.findLastIndex(
      (token, index) => index <= maxSize && delimiters.includes(token)
    );
    chunks.push(
      tokens.splice(0, lastSentenceEnd > 0 ? lastSentenceEnd : maxSize)
    );
  }
  return chunks;
};

/**
 * Get an array of embeddings of a certain maximum size from some arbitrarily
 * long text. Each resulting embedding is an array of numbers.
 * @param text an arbitrarily long string of text
 * @param maxSize the max amount of tokens that will be transformed into an embedding
 */
export const embeddingsFromText = async (
  text: string,
  { maxSize = 500 }: { maxSize?: number } = {}
): Promise<WordEmbedding[]> => {
  console.log(`🚲 Start create embeddings from "${text.substring(0, 10)}..."`);

  const seed = 0xabcd;
  const hash = XXH.h32(text, seed).toString(16);

  // return cached embeddings if present, otherwise create them manually:
  const cachedEmbeddings = await getCachedEmbeddings(hash);
  if (cachedEmbeddings) {
    console.log("✅ Found cached embeddings.");
    return cachedEmbeddings;
  }

  const api = new OpenAIApi(
    new Configuration({
      organization: process.env.OPENAI_ORG_ID,
      apiKey: process.env.OPENAI_API_KEY,
    })
  );

  const tokenChunks = getTokenChunks(text, { maxSize });
  const embeddings = [];
  let i = 1;
  for (const tokens of tokenChunks) {
    console.log(`🚲 Creating embedding ${i}/${tokenChunks.length}...`);
    const vector = await api
      .createEmbedding({ model: "text-embedding-ada-002", input: tokens })
      .then((response) => response.data.data[0].embedding);
    embeddings.push({ vector, originalText: decode(tokens) });
    i++;
  }

  // cache and return newly created embeddings:
  await storeCachedEmbeddings(hash, embeddings);
  console.log(`✅ Returning ${i} embeddings.`);
  return embeddings;
};

/**
 * Get the name of a cache file from a website to scrape information from.
 * @param website the website to scrape
 * @param extension the extension of the cache file
 */
export const getCacheFileName = (
  website: string,
  { extension }: { extension: "html" | "txt" | "json" }
) => {
  const jsonDirectory = path.join(process.cwd(), "app/data/scraping/.cache/");
  const fileName = website.slice(8).replaceAll("/", "_");
  return jsonDirectory + fileName + "." + extension;
};

/**
 * Get a string of maximally-relevant text chunks from an arbitrary amount of
 * text chunks that each have a distance between their embedding representation
 * and the embedding of a question string.
 * @param textChunks array of strings, each one usually one or more sentences
 * @param distances array of distances between text chunks and a question
 * @param maxLength maximum length of text that should be returned
 */
export const getContext = ({
  textChunks,
  distances,
  maxLength,
}: {
  textChunks: string[];
  distances: number[];
  maxLength: number;
}) => {
  console.log(`🚲 Creating context out of ${textChunks.length} strings...`);

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

  console.log(`✅ Returning context of size ${mostRelevantEmbeddings.length}.`);
  return mostRelevantEmbeddings.join("\n\n###\n\n");
};

/**
 * Get the answer to a question, given some context in the form of text chunks
 * and their corresponding embedding representation.
 * @param question the question to ask
 * @param embeddings the exmbeddings to use as a context
 * @param textChunks the text chunks from which each embedding is derived
 */
export const answer = async (question: string, embeddings: WordEmbedding[]) => {
  console.log(`🚲 Start answering question "${question}"`);

  const api = new OpenAIApi(
    new Configuration({
      organization: process.env.OPENAI_ORG_ID,
      apiKey: process.env.OPENAI_API_KEY,
    })
  );

  console.log("🚲 Tokenizing question and creating embedding...");
  const questionTokens = encode(question);
  const questionEmbedding = await api
    .createEmbedding({ model: "text-embedding-ada-002", input: questionTokens })
    .then((response) => response.data.data[0].embedding);

  const distances = embeddings.map((embedding) =>
    cosineDistance(questionEmbedding, embedding.vector)
  );

  const textChunks = embeddings.map((embedding) => embedding.originalText);
  const context = getContext({
    textChunks,
    distances,
    maxLength: 4500,
  });

  try {
    console.log("🚲 Submitting question to OpenAI...");
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
    console.log(`✅ Returning answer "${result?.substring(0, 14)}..."`);
    return result;
  } catch {
    console.warn("⚠️ Exception was thrown. Returning undefined.");
    return undefined;
  }
};

/**
 * Get the cosine distance between two arrays of numbers `a` and `b`.
 * @param a the first array
 * @param b the second array
 */
export const cosineDistance = (a: number[], b: number[]) => {
  const dotProduct = a.reduce((acc, val, index) => acc + val * b[index], 0);
  const mA = Math.sqrt(a.reduce((acc, val) => acc + val * val, 0));
  const mB = Math.sqrt(b.reduce((acc, val) => acc + val * val, 0));
  const similarity = dotProduct / (mA * mB);
  const distance = 1 - similarity;
  return distance;
};
