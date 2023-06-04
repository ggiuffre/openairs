import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  organization: process.env.OPENAI_ORG_ID,
  apiKey: process.env.OPENAI_API_KEY,
});

const api = new OpenAIApi(configuration);

const completion = await api.createChatCompletion({
  model: "gpt-3.5-turbo",
  messages: [
    {
      role: "user",
      content: "What was the line-up of the 2019 Zürich Openair Festival?",
    },
  ],
});

console.log(completion.data.choices[0].message);
