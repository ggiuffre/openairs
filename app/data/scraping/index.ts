import OpenAI from "openai";
import { getOpenairInfo, updateOpenairInfo } from "./database";
import type { Openair, ScrapedOpenairInfo } from "../types";
import { getSlug } from "../processing";

export type Topic = keyof Omit<ScrapedOpenairInfo, "scrapingDate">;

export const validTopics = ["artists", "isCampingPossible", "isFree"];

export const isValidTopic = (
  value: string | undefined | Topic
): value is undefined | Topic =>
  value == undefined || validTopics.includes(value);

/**
 * Get the answer to a question about a festival
 * @param openair the festival which the question is about
 * @param topic topic that we want to know more about (e.g. "artists")
 * @param cache whether to use cached answer or not
 */
export const ask = async ({
  openair,
  topic = "artists",
  cache = true,
}: {
  openair: Openair;
  topic?: Topic;
  cache?: boolean;
}) => {
  console.log(
    `🚲 Asking question about ${openair.name} with cache=${cache} about topic "${topic}"`
  );

  // return cached answer if present and if 'cache' argument is not false:
  const slug = getSlug(openair.name);
  const cachedInfo = cache ? await getOpenairInfo(slug) : undefined;
  if (cachedInfo && cachedInfo[topic] != null) {
    console.log("✅ Found cached festival info.");
    return cachedInfo;
  }

  // craft question to ask:
  const year = openair.dates.at(-1)?.start.getFullYear();
  const location = `${openair.place}, Switzerland`;
  const questionsByTopic: Record<Topic, { text: string; schema: Object }> = {
    artists: {
      text: year
        ? `What is the lineup of artists playing at ${openair.name} in ${location} in ${year}?`
        : `What is the lineup of artists playing at ${openair.name} in ${location}?`,
      schema: { type: "array", items: { type: "string" } },
    },
    isCampingPossible: {
      text: `Is it possible to camp with a tent at ${openair.name} in ${location}?`,
      schema: { type: "boolean" },
    },
    isFree: {
      text: `I'm going to ${openair.name} in ${location}. Is this festival for free?`,
      schema: { type: "boolean" },
    },
  };
  const question = questionsByTopic[topic];

  // submit question:
  console.log(`🚲 Submitting following to OpenAI: ${question}`);
  const api = new OpenAI({
    organization: process.env.OPENAI_ORG_ID,
    apiKey: process.env.OPENAI_API_KEY,
  });
  try {
    const response = await api.responses.create({
      model: "gpt-4o",
      tools: [{ type: "web_search_preview" }],
      input: question.text,
      text: {
        format: {
          type: "json_schema",
          name: "research_paper_extraction",
          strict: true,
          schema: {
            type: "object",
            properties: { [topic]: question.schema },
            required: [topic],
            additionalProperties: false,
          },
        },
      },
    });

    // cache and return answer:
    const message = JSON.parse(response.output_text);
    await updateOpenairInfo({ identifier: slug, data: message });
    console.log(`✅ Returning JSON object: ${message}`);
    return message;
  } catch (e) {
    console.warn(e);
    return undefined;
  }
};
