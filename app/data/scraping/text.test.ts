import { faker } from "@faker-js/faker";
import { longestCommonPrefix, withoutRepeatedPrefix } from "./text";

describe("longestCommonPrefix", () => {
  test("returns an empty string if passed an empty array", () => {
    expect(longestCommonPrefix([])).toStrictEqual("");
  });

  test("returns a known string if passed a singleton", () => {
    const onlyElement = faker.lorem.text();
    expect(longestCommonPrefix([onlyElement])).toStrictEqual(onlyElement);
  });

  test("returns an empty string if passed 2 strings with no common prefix", () => {
    const texts = ["a" + faker.lorem.text(), "b" + faker.lorem.text()];
    expect(longestCommonPrefix(texts)).toStrictEqual("");
  });

  test("returns a known string if passed 2 identical strings", () => {
    const onlyElement = faker.lorem.text();
    const texts = [onlyElement, onlyElement];
    expect(longestCommonPrefix(texts)).toStrictEqual(onlyElement);
  });

  test("returns an empty string if one of the elements is the empty string", () => {
    const texts = [faker.lorem.text(), "", faker.lorem.text()];
    expect(longestCommonPrefix(texts)).toStrictEqual("");
  });

  test("returns a known string if passed strings with a known prefix", () => {
    const prefix = faker.lorem.text() + "_-_-_";
    const texts = Array.from({ length: 4 }).map(
      (_) => prefix + faker.lorem.text()
    );
    expect(longestCommonPrefix(texts)).toStrictEqual(prefix);
  });
});

describe("withoutRepeatedPrefix", () => {
  test("returns an empty array if passed an empty array", () => {
    expect(withoutRepeatedPrefix([])).toStrictEqual([]);
  });

  test("returns the array itself if passed a singleton", () => {
    const onlyElement = faker.lorem.text();
    expect(withoutRepeatedPrefix([onlyElement])).toStrictEqual([onlyElement]);
  });

  test("returns an array of the same length as the one passed", () => {
    const prefix = faker.lorem.text() + "_-_-_";
    const texts = Array.from({ length: 7 }).map(
      (_) => prefix + faker.lorem.text()
    );
    expect(withoutRepeatedPrefix(texts).length).toBe(texts.length);
  });

  test("returns a known array if passed strings with a known prefix", () => {
    const prefix = faker.lorem.text() + "_-_-_";
    const originalTexts = Array.from({ length: 7 }).map(
      (_, index) => index.toString() + faker.lorem.text()
    );
    const texts = originalTexts.map((text) => prefix + text);
    expect(withoutRepeatedPrefix(texts)).toStrictEqual([
      texts[0],
      ...originalTexts.slice(1),
    ]);
  });
});
