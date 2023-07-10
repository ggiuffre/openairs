import path from "path";
import { Configuration, OpenAIApi } from "openai";
import { JSDOM } from "jsdom";
import {
  getCachedEmbeddings,
  getCachedTexts,
  getCachedUrls,
  storeCachedEmbeddings,
  storeCachedTexts,
  storeCachedUrls,
} from "./database";
import type { WordEmbedding } from "../types";
import { decode, encode } from "gpt-tokenizer";
import XXH from "xxhashjs";

/**
 * Get the text content of the pages of a website, either from a cache or
 * directly by crawling all the web pages.
 * @param pages a list of web page URLs to scrape
 */
export const scrapeWebsite = async (pages: string[]): Promise<string[]> => {
  const baseUrl = longestCommonPrefix(pages);
  console.log(`🚲 Starting to scrape web pages under ${baseUrl}`);

  const cachedTexts = await getCachedTexts(baseUrl);
  if (cachedTexts) {
    console.log("✅ Found cached scraped texts.");
    return cachedTexts;
  }

  const pagesAsText = await Promise.all(pages.map(scrape));
  await storeCachedTexts(baseUrl, pagesAsText);
  console.log("✅ Successfully scraped and cached website.");
  return pagesAsText;
};

/**
 * Get the text content of the body of a web page.
 * @param page URL of the web page to scrape
 */
const scrape = async (page: string): Promise<string> => {
  console.log(`🚲 Start scraping: ${page}`);

  try {
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

    // return scraped text:
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
  "skip to content",
  "direkt zum inhalt",
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
 * @param isRoot whether this is the root of the website
 */
export const getAllPagesFromBaseUrl = async ({
  baseUrl,
  isRoot = true,
}: {
  baseUrl: string;
  isRoot?: boolean;
}): Promise<string[]> => {
  console.log(`🚲 Discovering pages under ${baseUrl}`);
  if (isRoot) {
    const cachedUrls = await getCachedUrls(baseUrl);
    if (cachedUrls) {
      return cachedUrls;
    }
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
          href.startsWith(baseUrl) &&
          withTrailingSlash(href) !== withTrailingSlash(baseUrl)
      );
    const directChildren = [...new Set(hrefs)];
    const descendants = await Promise.all(
      directChildren.map((child) =>
        getAllPagesFromBaseUrl({ baseUrl: child, isRoot: false })
      )
    ).then((pages) => pages.flat());

    // cache and return unique URLs that are sub-pages of the base URL:
    const urls = [baseUrl, ...new Set(descendants)];
    if (isRoot) {
      await storeCachedUrls(baseUrl, urls);
    }
    return urls;
  } catch {
    return [];
  }
};

/**
 * Get the longest prefix common to a list of strings.
 * @param strings the strings to be compared
 */
export const longestCommonPrefix = (strings: string[]): string => {
  console.log("🚲 Calculating longest common prefix among pages...");

  const sortedStrings = strings.sort((a, b) => (a < b ? -1 : 1));

  let output = [];
  const firstString = sortedStrings[0];
  const lastString = sortedStrings[sortedStrings.length - 1];
  for (let i = 0; i < firstString.length; i++) {
    if (firstString[i] === lastString[i]) {
      output.push(firstString[i]);
    } else {
      break;
    }
  }

  return output.join("");
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
  if (maxSize < 0) {
    throw new Error(`getTokenChunks got invalid argument maxSize=${maxSize}`);
  }

  const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) ?? [];
  const chunks: number[][] = [];

  let i = 0;
  let currentText = "";
  let currentChunk: number[] = [];

  while (i < sentences.length) {
    const sentence = sentences[i].trim();
    if (sentences[i]) {
      const candidateText = (currentText + " " + sentence).trim();
      const candidateChunk = encode(candidateText);
      const isLastSentence = i === sentences.length - 1;
      if (candidateChunk.length > maxSize) {
        chunks.push(currentChunk);
        currentText = sentence;
        currentChunk = encode(sentence);
      } else {
        currentText = candidateText;
        currentChunk = candidateChunk;
      }

      if (isLastSentence) {
        chunks.push(currentChunk);
      }
    }
    i++;
  }

  return chunks;
};

/**
 * Get an array of embeddings of a certain maximum size from an array of
 * strings. Each string gives one or more embeddings, and all embeddings get
 * flattened onto a single array of embeddings. Each resulting embedding is an
 * array of numbers.
 * @param pagesAsText an array of strings
 * @param maxSize the max amount of tokens that will be transformed into an embedding
 */
export const embeddingsFromPages = async ({
  baseUrl,
  pagesAsText,
  maxSize = 500,
}: {
  baseUrl: string;
  pagesAsText: string[];
  maxSize?: number;
}) => {
  console.log(`🚲 Starting to generate embeddings for ${baseUrl}`);

  // return cached embeddings if present, otherwise create them manually:
  const cachedEmbeddings = await getCachedEmbeddings(baseUrl);
  if (cachedEmbeddings) {
    console.log("✅ Found cached embeddings.");
    return cachedEmbeddings;
  }

  const embeddings = await Promise.all(
    pagesAsText.map((text) => embeddingsFromText(text, { maxSize }))
  ).then((result) => result.flat());

  // cache and return newly created embeddings:
  await storeCachedEmbeddings(baseUrl, embeddings);
  return embeddings;
};

/**
 * Get an array of embeddings of a certain maximum size from some arbitrarily
 * long text. Each resulting embedding is an array of numbers.
 * @param text an arbitrarily long string of text
 * @param maxSize the max amount of tokens that will be transformed into an embedding
 */
const embeddingsFromText = async (
  text: string,
  { maxSize = 500 }: { maxSize?: number } = {}
): Promise<WordEmbedding[]> => {
  console.log(`🚲 Start create embeddings from "${text.substring(0, 10)}..."`);

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
      distances[textChunks.indexOf(a)] - distances[textChunks.indexOf(b)]
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
  console.log(`🚲 Asking question "${question}"`);

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
