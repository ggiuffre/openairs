import { readFile } from "fs/promises";
import path from "path";
import { Configuration, OpenAIApi } from "openai";
import { JSDOM } from "jsdom";

const allEqual = (arr) => arr.every((v) => v === arr[0]);

const jsonFile = path.join(process.cwd(), "app/data/openairs.json");
const openairs = await readFile(jsonFile, "utf8").then(JSON.parse);
const openairName = "Greenfield";
const referenceOpenair = openairs.find((o) => o.name === openairName);

const dom = await JSDOM.fromURL(referenceOpenair.website);
const results = Array.from(
  dom.window.document
    .querySelector("body")
    .querySelectorAll("*:not(script,svg,img)")
);
const references = [
  referenceOpenair.artists[0],
  referenceOpenair.artists[1],
  referenceOpenair.artists[10],
];
const referenceNodes = references.map((reference) =>
  results.find((node) => node.textContent === reference)
);
let relativeDegree = 0;
let referenceParents = referenceNodes;
let found = false;
while (!found && relativeDegree < 10) {
  if (allEqual(referenceParents.map((ref) => ref.textContent))) {
    found = true;
  } else {
    referenceParents = referenceParents.map((ref) => ref.parentNode);
    relativeDegree += 1;
  }
}

if (found) {
  const minimumText = referenceParents[0].textContent;

  const api = new OpenAIApi(
    new Configuration({
      organization: process.env.OPENAI_ORG_ID,
      apiKey: process.env.OPENAI_API_KEY,
    })
  );

  const completion = await api.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "user",
        content: `Please tell me an item listed in the following text.\n${minimumText}`,
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

  console.log(completion.data.choices[0].message);
} else {
  console.log("Couldn't parse website properly.");
}
