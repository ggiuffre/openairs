import path from "path";
import OpenAI from "openai";
import { JSDOM } from "jsdom";
import {
  getCachedAnswer,
  getCachedEmbeddings,
  getCachedTexts,
  getCachedUrls,
  storeCachedAnswer,
  storeCachedEmbeddings,
  storeCachedTexts,
  storeCachedUrls,
} from "./database";
import type { ScrapedOpenairInfo, WordEmbedding } from "../types";
import { decode, encode } from "gpt-tokenizer";
import { longestCommonPrefix, withoutRepeatedPrefix } from "./text";
import { withTrailingSlash } from "../processing";

/**
 * Get the text content of the pages of a website, either from a cache or
 * directly by crawling all the web pages from a base URL
 * @param baseUrl the base URL under which some pages are found
 * @param cache whether to return cached texts if present
 * @param removePrefix whether to stripe the longest common prefix from page texts
 */
export const scrapeWebsite = async ({
  baseUrl,
  cache = true,
  removePrefix = false,
}: {
  baseUrl: string;
  cache?: boolean;
  removePrefix?: boolean;
}): Promise<string[]> => {
  console.log(`🚲 Scraping ${baseUrl}`);

  // returned cached text is present and if 'cache' argument is not false:
  const cachedTexts = cache ? await getCachedTexts(baseUrl) : undefined;
  if (cachedTexts) {
    console.log("✅ Found cached scraped texts.");
    return cachedTexts;
  }

  const pages = await getAllPagesFromBaseUrl({ baseUrl });
  const pagesAsText = await Promise.all(pages.map(scrape));

  const prefix =
    removePrefix && pagesAsText ? longestCommonPrefix(pagesAsText) : undefined;
  if (prefix !== undefined && pagesAsText.length > 0) {
    console.log(
      `🚲 Found prefix of length ${prefix.length} common to all pages: ${prefix}`
    );
    console.log("🚲 Removing prefix from all pages except first");
    const shortenedTexts = withoutRepeatedPrefix(pagesAsText);
    await storeCachedTexts(baseUrl, shortenedTexts);
    console.log("✅ Successfully scraped and cached website");
    return shortenedTexts;
  } else {
    await storeCachedTexts(baseUrl, pagesAsText);
    console.log("✅ Successfully scraped and cached website");
    return pagesAsText;
  }
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
  "go to the top",
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
  if (["SCRIPT", "IFRAME", "PAGES-CSS", "STYLE"].includes(node.nodeName)) {
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
const getAllPagesFromBaseUrl = async ({
  baseUrl,
  level = 0,
}: {
  baseUrl: string;
  level?: number;
}): Promise<string[]> => {
  // Don't scrape beyond a certain depth:
  const maxScrapingDepth = 5;
  if (level < maxScrapingDepth) {
    console.log(`🚲 Discovering pages under ${baseUrl}`);
  } else {
    console.log(`🚲 Reached maximum scraping depth`);
    return [];
  }

  // if a cached list of URLs is available, return it:
  if (level === 0) {
    const cachedUrls = await getCachedUrls(baseUrl);
    if (cachedUrls) {
      return cachedUrls;
    }
  }

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
      .filter((href) => !href.includes("/pictures/200"))
      .filter((href) => !href.includes("/pictures/201"))
      .map((href) => href.split("#")[0])
      .filter(
        (href) =>
          href.startsWith(baseUrl) &&
          withTrailingSlash(href) !== withTrailingSlash(baseUrl)
      );
    const directChildren = [...new Set(hrefs)];
    const descendants = await Promise.all(
      directChildren.map((child) =>
        getAllPagesFromBaseUrl({ baseUrl: child, level: level + 1 })
      )
    ).then((pages) => pages.flat());

    // cache and return unique URLs that are sub-pages of the base URL:
    const urls = [baseUrl, ...new Set(descendants)];
    if (level === 0) {
      await storeCachedUrls(baseUrl, urls);
    }
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
 * strings scraped from the pages of a website. Each string gives one or more
 * embeddings, and all embeddings get flattened onto a single array of
 * embeddings. Each resulting embedding is an array of numbers.
 * @param baseUrl the base URL root to some web pages
 * @param maxSize the max amount of tokens that will be transformed into an embedding
 * @param cache whether to return cached embeddings if present
 */
export const embeddingsFromPages = async ({
  baseUrl,
  maxSize = 500,
  cache = true,
}: {
  baseUrl: string;
  maxSize?: number;
  cache?: boolean;
}) => {
  console.log(`🚲 Starting to generate embeddings for ${baseUrl}`);

  // return cached embeddings if present and if 'cache' argument is not false:
  const cachedEmbeddings = cache
    ? await getCachedEmbeddings(baseUrl)
    : undefined;
  if (cachedEmbeddings) {
    console.log("✅ Found cached embeddings.");
    return cachedEmbeddings;
  }

  // scrape text from website:
  const maxPages = 100;
  const pages = await scrapeWebsite({ baseUrl, cache }).then((result) =>
    result.length > maxPages ? result.slice(0, maxPages) : result
  );

  // generate embeddings from text:
  let results: WordEmbedding[][] = [];
  let i = 1;
  for (const text of pages) {
    console.log(`🚲 Gathering embeddings for page ${i}/${pages.length}`);
    try {
      const result = await embeddingsFromText(text, { maxSize });
      results.push(result);
    } catch {
      console.warn(`⚠️ An exception was thrown. Skipping embedding ${i}.`);
    }
    i++;
  }
  const embeddings = results.flat();

  // cache and return newly created embeddings:
  console.log(`🚲 Caching ${embeddings.length} embeddings`);
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

  const api = new OpenAI({
    organization: process.env.OPENAI_ORG_ID,
    apiKey: process.env.OPENAI_API_KEY,
  });

  const tokenChunks = getTokenChunks(text, { maxSize });
  const embeddings = [];
  let i = 1;
  for (const tokens of tokenChunks) {
    console.log(`🚲 Creating embedding ${i}/${tokenChunks.length}...`);
    const vector = await api.embeddings
      .create({ model: "text-embedding-ada-002", input: tokens })
      .then((response) => response.data[0].embedding);
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
 * @param embeddings array of embeddings, each one w/ vector and original text
 * @param distances array of distances between text chunks and a question
 * @param maxLength maximum length of context to return, in tokens
 */
export const getContext = ({
  embeddings,
  distances,
  maxLength = 4000,
}: {
  embeddings: WordEmbedding[];
  distances: number[];
  maxLength?: number;
}) => {
  console.log(`🚲 Creating context out of ${embeddings.length} embeddings...`);

  // sort embeddings by distance to the question:
  embeddings.sort(
    (a, b) =>
      distances[embeddings.indexOf(a)] - distances[embeddings.indexOf(b)]
  );

  // add the most relevant text chunks to the context, until the maximum size is reached:
  let i = 0;
  let currentLength = 0;
  let mostRelevantEmbeddings: string[] = [];
  while (i < embeddings.length && currentLength < maxLength) {
    mostRelevantEmbeddings.push(embeddings[i].originalText);
    currentLength += embeddings[i].vector.length + 4;
    i++;
  }

  console.log(`✅ Returning context of size ${mostRelevantEmbeddings.length}`);
  return mostRelevantEmbeddings.join("\n\n###\n\n");
};

/**
 * Get the answer to a question, given some context in the form of text chunks
 * and their corresponding embedding representation.
 * @param question the question to ask
 * @param baseUrl a website that provides context to the question
 * @param cache whether to use cached answer or not
 */
export const answer = async ({
  question,
  baseUrl,
  cache = true,
}: {
  question: string;
  baseUrl: string;
  cache?: boolean;
}) => {
  console.log(`🚲 Asking question with cache=${cache}: "${question}"`);

  // return cached answer if present and if 'cache' argument is not false:
  const cachedAnswer = cache
    ? await getCachedAnswer(baseUrl, question)
    : undefined;
  if (cachedAnswer) {
    console.log("✅ Found cached answer.");
    return cachedAnswer;
  }

  // scrape information from website and create embeddings out of it:
  const embeddings = await embeddingsFromPages({ baseUrl, cache });

  // query OpenAI API:
  const api = new OpenAI({
    organization: process.env.OPENAI_ORG_ID,
    apiKey: process.env.OPENAI_API_KEY,
  });

  console.log("🚲 Tokenizing question and creating embedding...");
  const questionTokens = encode(question);
  const questionEmbedding = await api.embeddings
    .create({ model: "text-embedding-ada-002", input: questionTokens })
    .then((response) => response.data[0].embedding);
  const distances = embeddings.map((embedding) =>
    cosineDistance(questionEmbedding, embedding.vector)
  );

  const context = getContext({ embeddings, distances });

  if (context.length === 0) {
    console.warn("⚠️ Got context of size 0. Returning undefined.");
    return undefined;
  }

  try {
    console.log("🚲 Submitting question to OpenAI...");
    const completion = await api.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: `${question} Here is some context.\n\n###\n\n${context}`,
        },
      ],
    });

    const result = completion.choices[0].message?.content;
    if (result) {
      await storeCachedAnswer(baseUrl, question, result);
      console.log(`✅ Returning answer "${result?.substring(0, 14)}..."`);
      return result;
    } else {
      console.warn("⚠️ A problem occurred. Returning undefined.");
      return undefined;
    }
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
  // if the vectors are both null (hence identical), return a distance of zero:
  if (a.every((val) => val === 0) && b.every((val) => val === 0)) {
    return 0;
  }

  // otherwise calculate their similarity:
  const dotProduct = a.reduce((acc, val, index) => acc + val * b[index], 0);
  const mA = Math.sqrt(a.reduce((acc, val) => acc + val * val, 0));
  const mB = Math.sqrt(b.reduce((acc, val) => acc + val * val, 0));
  const similarity = dotProduct / (mA * mB);

  // return their distance, i.e. 1 minus their similarity:
  const distance = 1 - similarity;
  return distance;
};

/**
 * Get a JSON object from unstructured data containing information that can be
 * represented as JSON. This function calls the OpenAI API.
 * @param data a string containing the unstructured data
 * @param content type of content that the output should be made of
 */
export const jsonFromUnstructuredData = async ({
  data,
  content,
}: {
  data: string;
  content?: keyof ScrapedOpenairInfo;
}): Promise<object> => {
  console.log("🚲 Asking OpenAI to convert unstructured data to JSON...");

  const api = new OpenAI({
    organization: process.env.OPENAI_ORG_ID,
    apiKey: process.env.OPENAI_API_KEY,
  });

  const desiredFormat = content
    ? `RFC8259-compliant JSON format containing a field named ${content}`
    : "RFC8259-compliant JSON format";
  const question = `Please convert the following unstructured data into ${desiredFormat}:\n\n\`\`\`\n${data}\n\`\`\``;

  try {
    const completion = await api.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [{ role: "user", content: question }],
    });

    const result = completion.choices[0].message?.content;
    const jsonResult =
      result?.startsWith("{") && result.endsWith("}")
        ? result
        : result?.slice(result.indexOf("{"), result?.lastIndexOf("}") + 1);
    console.log(`🚲 Result of JSON transformation request was: ${jsonResult}`);
    if (jsonResult) {
      console.log(`✅ Returning JSON data`);
      return await JSON.parse(jsonResult);
    } else {
      console.warn("⚠️ A problem occurred. Returning empty object.");
      return {};
    }
  } catch {
    console.warn("⚠️ Exception was thrown. Returning empty object.");
    return {};
  }
};

/**
 * Get a list of artists as strings from unstructured data via the OpenAI API.
 * @param data a string containing the unstructured data
 */
export const getArtistsFromUnstructuredData = async (
  data: string
): Promise<string[] | undefined> => {
  const unsafeJson = data
    ? await jsonFromUnstructuredData({ data, content: "artists" })
    : {};
  return "artists" in unsafeJson && Array.isArray(unsafeJson["artists"])
    ? unsafeJson["artists"]
    : Array.isArray(unsafeJson)
    ? unsafeJson
    : undefined;
};

/**
 * Get whether camping is available from unstructured data via the OpenAI API.
 * @param data a string containing the unstructured data
 */
export const getCampingInfoFromUnstructuredData = async (
  data: string
): Promise<boolean | undefined> => {
  const unsafeJson = data
    ? await jsonFromUnstructuredData({ data, content: "isCampingPossible" })
    : {};
  return "isCampingPossible" in unsafeJson &&
    typeof unsafeJson["isCampingPossible"] === "boolean"
    ? unsafeJson["isCampingPossible"]
    : typeof unsafeJson === "boolean"
    ? unsafeJson
    : undefined;
};

/**
 * Get whether a festival is free from unstructured data via the OpenAI API.
 * @param data a string containing the unstructured data
 */
export const getPriceInfoFromUnstructuredData = async (
  data: string
): Promise<boolean | undefined> => {
  const unsafeJson = data
    ? await jsonFromUnstructuredData({ data, content: "isFree" })
    : {};
  return "isFree" in unsafeJson && typeof unsafeJson["isFree"] === "boolean"
    ? unsafeJson["isFree"]
    : typeof unsafeJson === "boolean"
    ? unsafeJson
    : undefined;
};
