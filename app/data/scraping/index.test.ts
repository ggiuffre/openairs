import { faker } from "@faker-js/faker";
import { getTokenChunks } from ".";
import { encode } from "gpt-tokenizer";

describe("getTokenChunks", () => {
  test("returns an empty array if passed an empty string", () => {
    expect(getTokenChunks("")).toStrictEqual([]);
  });

  test("returns an array with 1 element, if given text under maxSize limit", () => {
    const sentences = ["Hello there."].concat(
      Array.from({ length: 4 }).map((_) => faker.lorem.sentence())
    );
    const text = sentences.join(" ");
    const encodedText = encode(text);
    const maxSize = encodedText.length + 1;
    const tokenChunks = getTokenChunks(text, { maxSize });
    expect(tokenChunks).toStrictEqual([encodedText]);
  });

  test("returns an array with 2 elements, if given text 1 unit above maxSize limit", () => {
    const sentences = Array.from({ length: 5 }).map((_) =>
      faker.lorem.sentence()
    );
    const text = sentences.join(" ");
    const lastSentenceStart = text.lastIndexOf(". ") + 1;
    const encodedText = encode(text);
    const maxSize = encodedText.length - 1;
    const tokenChunks = getTokenChunks(text, { maxSize });
    expect(tokenChunks).toStrictEqual([
      encode(text.substring(0, lastSentenceStart)),
      encode(text.substring(lastSentenceStart + 1)),
    ]);
  });

  test("returns an array whose flat version starts and ends like the encoding of the given text", () => {
    const sentences = Array.from({ length: 10 }).map((_) =>
      faker.lorem.sentence()
    );
    const text = sentences.join(" ");
    const encodedText = encode(text);
    const maxSize = Math.floor(encodedText.length / 3);
    const tokenChunks = getTokenChunks(text, { maxSize });
    const tokens = tokenChunks.flat();
    expect(tokens[0]).toBe(encodedText[0]);
    expect(tokens[tokens.length - 1]).toBe(encodedText[encodedText.length - 1]);
  });
});
