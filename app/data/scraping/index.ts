import { Configuration, OpenAIApi } from "openai";
import { JSDOM } from "jsdom";
import type { Openair } from "../types";

const allEqual = <T>(arr: T[]) => arr.every((v) => v === arr[0]);

export const getOpenairWebsiteText = async ({
  openair,
}: {
  openair: Openair;
}) => {
  if (openair.artists === undefined) {
    return "";
  }

  const dom = await JSDOM.fromURL(openair.website);
  const results = Array.from(
    dom.window.document
      .querySelector("body")
      ?.querySelectorAll("*:not(script,svg,img)") ?? []
  );
  const references = [
    openair.artists[0],
    openair.artists[1],
    openair.artists[10],
  ];
  const referenceNodes = references.map((reference) =>
    results.find((node) => node.textContent === reference)
  );
  let relativeDegree = 0;
  let referenceParents: (ParentNode | null | undefined)[] = referenceNodes;
  let found = false;
  while (!found && relativeDegree < 10) {
    if (allEqual(referenceParents.map((ref) => ref?.textContent))) {
      found = true;
    } else {
      referenceParents = referenceParents.map((ref) => ref?.parentNode);
      relativeDegree += 1;
    }
  }

  if (found && referenceParents[0] && referenceParents[0].textContent) {
    const minimumText = referenceParents[0].textContent;
    const strippedText = minimumText.replace(/(\r\n|\r|\n)\s+/g, "\n");
    return strippedText;
  } else {
    const minimumText = dom.window.document.querySelector("body")?.textContent;
    return minimumText === null ? undefined : minimumText;
  }
};

export const getLineupFromScrapedText = async ({
  text,
  references,
}: {
  text: string;
  references: string[];
}) => {
  const api = new OpenAIApi(
    new Configuration({
      organization: process.env.OPENAI_ORG_ID,
      apiKey: process.env.OPENAI_API_KEY,
    })
  );

  try {
    const completion = await api.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `Please tell me an item listed in the following text.\n${text}`,
        },
        {
          role: "assistant",
          content: references[0],
        },
        {
          role: "user",
          content: "Can you tell me another item?",
        },
        {
          role: "assistant",
          content: references[1],
        },
        {
          role: "user",
          content: "What about all the other items?",
        },
      ],
    });

    const result = completion.data.choices[0].message?.content;
    return result;
  } catch {
    return undefined;
  }
};
