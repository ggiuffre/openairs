import { faker } from "@faker-js/faker";
import { cosineDistance, getTokenChunks } from ".";
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

describe("cosineDistance", () => {
  test("of a vector with itself is close to zero", () => {
    const length = Math.random() * 100;
    const a = Array.from({ length }).map((_) => (Math.random() - 0.5) * 10);
    expect(cosineDistance(a, a)).toBeCloseTo(0);
  });

  test("is commutative", () => {
    const length = Math.random() * 100;
    const a = Array.from({ length }).map((_) => (Math.random() - 0.5) * 10);
    const b = Array.from({ length }).map((_) => (Math.random() - 0.5) * 10);
    expect(cosineDistance(a, b)).toBe(cosineDistance(b, a));
  });

  test("is at least zero", () => {
    const length = Math.random() * 100;
    const a = Array.from({ length }).map((_) => (Math.random() - 0.5) * 10);
    const b = Array.from({ length }).map((_) => (Math.random() - 0.5) * 10);
    expect(cosineDistance(a, b)).toBeGreaterThanOrEqual(0);
  });

  test("is at most 2", () => {
    const length = Math.random() * 100;
    const a = Array.from({ length }).map((_) => (Math.random() - 0.5) * 10);
    const b = Array.from({ length }).map((_) => (Math.random() - 0.5) * 10);
    expect(cosineDistance(a, b)).toBeLessThanOrEqual(2);
  });

  test("does not depend on the magnitude of the vectors", () => {
    const length = Math.random() * 100;
    const k1 = Math.random() * 10;
    const k2 = Math.random() * 10;
    const a = Array.from({ length }).map((_) => (Math.random() - 0.5) * 10);
    const b = a.map((e) => e * k1);
    const c = a.map((e) => e * k2);
    expect(cosineDistance(a, b)).toBeCloseTo(cosineDistance(a, c));
  });
});
