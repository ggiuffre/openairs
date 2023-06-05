import { readFile } from "fs/promises";
import path from "path";
import { Configuration, OpenAIApi } from "openai";
import { JSDOM } from "jsdom";

const jsonDirectory = path.join(process.cwd(), "app/data/");
const fileContents = await readFile(jsonDirectory + "openairs.json", "utf8");
const openairs = JSON.parse(fileContents);
const greenfieldFestival = openairs.find(
  (openair) => openair.name === "Greenfield"
);

const dom = await JSDOM.fromURL("https://openair.wiki/");
const results = [];
let pageContent = dom.window.document
  .querySelector("body")
  .querySelectorAll("*:not(script,svg,img)")
  .forEach((node) => results.push(node));
console.log(results);
pageContent = results
  .map((a) => a.textContent)
  .join(" ")
  .replace(/\s+/g, " ");

// const openaiConfig = new Configuration({
//   organization: process.env.OPENAI_ORG_ID,
//   apiKey: process.env.OPENAI_API_KEY,
// });

// const api = new OpenAIApi(openaiConfig);

// const completion = await api.createChatCompletion({
//   model: "gpt-3.5-turbo",
//   messages: [
//     {
//       role: "user",
//       content: `Please tell me the items listed in the following HTML code.\n${pageContent}`,
//     },
//   ],
// });

// console.log(completion.data.choices[0].message);
