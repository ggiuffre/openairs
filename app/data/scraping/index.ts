import path from "path";
import { Configuration, OpenAIApi } from "openai";
import { JSDOM } from "jsdom";
import {
  getCachedEmbeddings,
  getCachedText,
  storeCachedEmbeddings,
  storeCachedText,
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
  // return cached text if present, otherwise crawl page manually:
  const cachedText = await getCachedText(page);
  if (cachedText) {
    return cachedText;
  }

  // declare texts that we want to ignore:
  const ignoredTexts = [
    "back to top",
    "back to the top",
    "go to main content",
    "skip to main content",
  ];

  // declare function to recursively get content of text nodes:
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

  // read the page and parse its content:
  let pageNotParseable = false;
  const dom = await JSDOM.fromURL(page, {
    runScripts: "dangerously",
    pretendToBeVisual: true,
  }).catch(() =>
    JSDOM.fromURL(page, { pretendToBeVisual: true }).catch(() => {
      pageNotParseable = true;
      return undefined;
    })
  );
  if (pageNotParseable || dom === undefined) {
    return "";
  }

  // scrape the page:
  const text = getText(dom.window.document.body);
  const strippedText = text
    ?.replace(/(\r\n|\r|\n)\s+/g, "\n")
    .replace(/\s\n/g, "\n")
    .trim();

  // cache the scraped text:
  await storeCachedText(page, strippedText.split("\n"));

  // return the scraped text:
  return strippedText ?? "";
};

/**
 * Get a list of web pages recursively referenced from a base URL.
 * @param baseUrl the base URL
 */
export const getAllPagesFromBaseUrl = async (
  baseUrl: string
): Promise<string[]> => {
  // parse the page:
  try {
    const dom = await JSDOM.fromURL(baseUrl, {
      runScripts: "dangerously",
      pretendToBeVisual: true,
    }).catch(() =>
      JSDOM.fromURL(baseUrl, { pretendToBeVisual: true }).catch(() => {
        return undefined;
      })
    );

    if (dom === undefined) {
      return [];
    }

    const withTrailingSlash = (address: string) =>
      address[-1] === "/" ? address : address + "/";

    const hrefs = Array.from(dom.window.document.querySelectorAll("a"))
      .map((link) => link.href)
      .filter((href) => !href.endsWith(".pdf"))
      .filter((href) => !href.endsWith("rss/"))
      .filter((href) => !href.includes("/:"))
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

    return [baseUrl, ...new Set(descendants)];
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
    console.log(lastSentenceEnd);
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
  const seed = 0xabcd;
  const hash = XXH.h32(text, seed).toString(16);

  const cachedEmbeddings = await getCachedEmbeddings(hash);
  if (cachedEmbeddings) {
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
    console.log(`creating embedding ${i}/${tokenChunks.length}...`);
    const vector = await api
      .createEmbedding({ model: "text-embedding-ada-002", input: tokens })
      .then((response) => response.data.data[0].embedding);
    embeddings.push({ vector, originalText: decode(tokens) });
    i++;
  }

  await storeCachedEmbeddings(hash, embeddings);
  return embeddings;
};

/**
 * Get the name of a cache file from a website to scrape information from.
 * @param website the website to scrape
 * @param extension the extension of the cache file
 */
export const cacheFileFromWebsite = (
  website: string,
  { extension }: { extension: "html" | "txt" | "json" }
) => {
  const jsonDirectory = path.join(process.cwd(), "app/data/scraping/.cache/");
  const fileName = website.slice(8).replaceAll("/", "_");
  return jsonDirectory + fileName + "." + extension;
};

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

/**
 * Get the answer to a question, given some context in the form of text chunks
 * and their corresponding embedding representation.
 * @param question the question to ask
 * @param embeddings the exmbeddings to use as a context
 * @param textChunks the text chunks from which each embedding is derived
 */
export const answer = async (question: string, embeddings: WordEmbedding[]) => {
  const api = new OpenAIApi(
    new Configuration({
      organization: process.env.OPENAI_ORG_ID,
      apiKey: process.env.OPENAI_API_KEY,
    })
  );

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
  console.log(question, context);
  // good prompts to get the line-up:
  // - What artists are mentioned in the program?
  // - What artists are mentioned?

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
