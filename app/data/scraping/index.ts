import OpenAI from "openai";
import { getOpenairInfo, updateOpenairInfo } from "./database";
import type { Openair, ScrapedOpenairInfo } from "../types";
import { getSlug } from "../processing";

/**
 * Get the answer to a question about a festival
 * @param openair the festival which the question is about
 * @param topic topic that we want to know more about (e.g. "artists")
 * @param cache whether to use cached answer or not
 */
export const ask = async ({
  openair,
  topic,
  cache = true,
}: {
  openair: Openair;
  topic?: keyof Omit<ScrapedOpenairInfo, "scrapingDate">;
  cache?: boolean;
}) => {
  console.log(
    `🚲 Asking question about ${openair.name} with cache=${cache} about topic "${topic}"`
  );

  // return cached answer if present and if 'cache' argument is not false:
  const slug = getSlug(openair.name);
  const cachedInfo = cache ? await getOpenairInfo(slug) : undefined;
  if (cachedInfo && (topic == null || (topic && cachedInfo[topic] != null))) {
    console.log("✅ Found cached festival info.");
    return cachedInfo;
  }

  // Get client for OpenAI API:
  const api = new OpenAI({
    organization: process.env.OPENAI_ORG_ID,
    apiKey: process.env.OPENAI_API_KEY,
  });

  // craft question to ask:
  console.log("🚲 Crafting question to ask...");
  const year = openair.dates.at(-1)?.start.getFullYear();
  const location = `${openair.place}, Switzerland`;
  const questionsByTopic: Record<
    keyof Omit<ScrapedOpenairInfo, "scrapingDate">,
    { text: string; schema: Object }
  > = {
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
  const question = questionsByTopic[topic ?? "artists"];
  console.log("🚲 Will ask following question:");
  console.log("=====================================");
  console.log(question);
  console.log("=====================================");

  // submit question:
  try {
    console.log("🚲 Submitting question to OpenAI...");
    const response = await api.responses.create({
      model: "gpt-4o",
      tools: [{ type: "web_search_preview" }],
      input: question.text,
      text: {
        format: {
          type: "json_schema",
          name: "research_paper_extraction",
          schema: {
            type: "object",
            properties: { [topic ?? "artists"]: question.schema },
            required: [topic ?? "artists"],
            additionalProperties: false,
          },
          strict: true,
        },
      },
    });

    // cache and return answer:
    try {
      const message = JSON.parse(response.output_text);
      const scrapingDate = new Date();
      await updateOpenairInfo({
        identifier: slug,
        data: { ...message, scrapingDate },
      });
      console.log(`✅ Returning JSON object: ${message}`);
      return message;
    } catch (e) {
      console.warn(`⚠️ A problem occurred; returning undefined: ${e}`);
      return undefined;
    }
  } catch (e) {
    console.warn("⚠️ Exception was thrown. Returning undefined.");
    console.warn(e);
    return undefined;
  }
};
