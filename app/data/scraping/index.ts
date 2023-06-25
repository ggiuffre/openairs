import { readFile, writeFile } from "fs/promises";
import path from "path";
import { Configuration, OpenAIApi } from "openai";
import { JSDOM } from "jsdom";

/**
 * Get the text content of the body of a web page, either from a cache in the
 * filesystem or directly by crawling the web page.
 * @param page the web page to scrape
 */
export const scrape = async (
  page: string,
  { recursive = true }: { recursive?: boolean } = {}
): Promise<string> => {
  // return cached text if present, otherwise crawl page manually:
  const cacheFile = cacheFileFromWebsite(page, { extension: "txt" });
  const pageContent = await readFile(cacheFile, "utf8")
    .catch(async () => {
      // declare function to recursively get content of text nodes:
      const getText = (node: ChildNode): string => {
        if (node.nodeName === "SCRIPT") {
          return "";
        } else if (node.nodeType === 3) {
          return node.textContent ?? ""; // text node
        } else {
          return Array.from(node.childNodes)
            .map(getText)
            .filter((text) => text !== "")
            .join(" ");
        }
      };

      // read the page and scrape its content:
      const dom = await JSDOM.fromURL(page, {
        runScripts: "dangerously",
        pretendToBeVisual: true,
      }).catch(() => JSDOM.fromURL(page, { pretendToBeVisual: true }));
      const text = getText(dom.window.document.body);
      const strippedText = text?.replace(/(\r\n|\r|\n)\s+/g, "\n");

      if (recursive) {
        const hrefs = Array.from(dom.window.document.querySelectorAll("a"))
          .map((link) => link.href)
          .filter((href) => !href.endsWith(".pdf"))
          .filter((href) => !href.includes("/:"))
          .map((href) => href.split("#")[0])
          .filter(
            (href) =>
              href.includes(page) &&
              withTrailingSlash(href) !== withTrailingSlash(page)
          );
        const uniqueHrefs = [...new Set(hrefs)];
        const additionalText = await Promise.all(
          uniqueHrefs.map((href) => scrape(href, { recursive: false }))
        ).then((pageContents) => pageContents.join("\n\n"));

        const totalText = (strippedText ?? "") + "\n\n" + additionalText;

        // cache the scraped text to a file:
        if (totalText) {
          const data = new Uint8Array(Buffer.from(totalText));
          await writeFile(cacheFile, data);
        }

        return totalText;
      }

      // return the scraped text:
      return strippedText ?? "";
    })
    .catch(() => "");

  return pageContent;
};

const withTrailingSlash = (address: string) =>
  address[-1] === "/" ? address : address + "/";

/**
 * Get an array of character arrays from an arbitrarily long string, where each
 * character array is of a specified maximum length.
 * @param text an arbitrarily long string of text
 * @param maxSize the max amount of text that will be transformed into an embedding
 */
export const getTextChunks = (
  text: string,
  { maxSize = 2000 }: { maxSize?: number } = {}
) => {
  const tokens = Array.from(text);
  const chunks = [];
  while (tokens.length > 0) {
    chunks.push(tokens.splice(0, maxSize));
  }
  return chunks;
};

/**
 * Get an array of embeddings of a certain maximum size from some arbitrarily
 * long text. Each resulting embedding is an array of numbers.
 * @param text an arbitrarily long string of text
 * @param maxSize the max amount of text that will be transformed into an embedding
 */
export const embeddingsFromText = async (
  text: string,
  { maxSize = 2000 }: { maxSize?: number } = {}
) => {
  const api = new OpenAIApi(
    new Configuration({
      organization: process.env.OPENAI_ORG_ID,
      apiKey: process.env.OPENAI_API_KEY,
    })
  );

  const tokenChunks = getTextChunks(text, { maxSize });
  const embeddings = [];
  for (const tokens of tokenChunks) {
    console.log(`creating embedding from chunk of size ${tokens.length}`);
    const embedding = await api
      .createEmbedding({ model: "text-embedding-ada-002", input: tokens })
      .then((response) => response.data.data[0].embedding);
    embeddings.push(embedding);
  }

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
    cosineDistance(questionEmbedding, embedding)
  );

  const context = getContext({
    textChunks,
    distances,
    maxLength: 4000,
  });
  console.log(`${question} Here is some context.\n\n###\n\n${context}`);

  try {
    const completion = await api.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `${question} Hier ist etwas Kontext.\n\n###\n\n${context}`,
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
