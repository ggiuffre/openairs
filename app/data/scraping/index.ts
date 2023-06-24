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

export const embeddingsFromText = async (text: string) => {
  const api = new OpenAIApi(
    new Configuration({
      organization: process.env.OPENAI_ORG_ID,
      apiKey: process.env.OPENAI_API_KEY,
    })
  );

  const tokens = Array.from(text);
  const maxSize = 1000;
  const tokenChunks = [];
  while (tokens.length > 0) {
    tokenChunks.push(tokens.splice(0, maxSize));
  }

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

export const cosineDistance = async ({
  question,
  embedding,
}: {
  question: string;
  embedding: number[];
}) => {
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

  const similarity = cosineSimilarity(questionEmbedding, embedding);
  const distance = 1 - similarity;
  return distance;
};

// export const getContext = ({
//   questionEmbedding,
//   embeddings,
//   distances,
//   maxLength,
// }: {
//   questionEmbedding: number[];
//   embeddings: number[][];
//   distances: number[];
//   maxLength: number;
// }) => {
//   embeddings.sort((a, b) => distances.indexOf(a) - distances.indexOf(b));
//   // ...
// };

// export const getLineupFromScrapedText = async ({
//   text,
//   references,
// }: {
//   text: string;
//   references: string[];
// }) => {
//   const api = new OpenAIApi(
//     new Configuration({
//       organization: process.env.OPENAI_ORG_ID,
//       apiKey: process.env.OPENAI_API_KEY,
//     })
//   );

//   try {
//     const completion = await api.createChatCompletion({
//       model: "gpt-3.5-turbo",
//       messages: [
//         {
//           role: "user",
//           content: `Please tell me an item listed in the following text.\n${text}`,
//         },
//         {
//           role: "assistant",
//           content: references[0],
//         },
//         {
//           role: "user",
//           content: "Can you tell me another item?",
//         },
//         {
//           role: "assistant",
//           content: references[1],
//         },
//         {
//           role: "user",
//           content: "What about all the other items?",
//         },
//       ],
//     });

//     const result = completion.data.choices[0].message?.content;
//     return result;
//   } catch {
//     return undefined;
//   }
// };

function cosineSimilarity(A: number[], B: number[]) {
  let dotproduct = 0;
  let mA = 0;
  let mB = 0;

  for (let i = 0; i < A.length; i++) {
    dotproduct += A[i] * B[i];
    mA += A[i] * A[i];
    mB += B[i] * B[i];
  }

  mA = Math.sqrt(mA);
  mB = Math.sqrt(mB);
  const similarity = dotproduct / (mA * mB);
  return similarity;
}
