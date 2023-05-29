import { getInitialLetter, getMonth } from ".";
import { Factory } from "../factories";

describe("getInitialLetter", () => {
  test("returns the capitalized initial letter of an openair's name", () => {
    const openair = Factory.Openair({ name: "test openair" });
    expect(getInitialLetter(openair)).toBe("T");
  });

  test("returns the initial letter of an openair's name, if already capitalized", () => {
    const openair = Factory.Openair({ name: "Test Openair" });
    expect(getInitialLetter(openair)).toBe("T");
  });

  test("returns the openair's name, if made of 1 capital character", () => {
    const openair = Factory.Openair({ name: "T" });
    expect(getInitialLetter(openair)).toBe("T");
  });

  test("returns the capitalized openair's name, if made of 1 character", () => {
    const openair = Factory.Openair({ name: "t" });
    expect(getInitialLetter(openair)).toBe("T");
  });

  test("returns the empty string, if passed an openair with empty name", () => {
    const openair = Factory.Openair({ name: "" });
    expect(getInitialLetter(openair)).toBe("");
  });
});

describe("getMonth", () => {
  test("returns the month of the first starting date", () => {
    const now = new Date();
    const year = now.getFullYear();
    const openair = Factory.Openair({
      dates: [{ start: new Date(year, 0, 1), end: new Date(year, 1, 1) }],
    });
    expect(getMonth(openair)).toBe("January");
  });

  test("returns month and year of the first starting date, if not in current year", () => {
    const now = new Date();
    const year = now.getFullYear();
    const openair = Factory.Openair({
      dates: [
        { start: new Date(year + 1, 0, 1), end: new Date(year + 1, 1, 1) },
      ],
    });
    expect(getMonth(openair)).toBe(`January ${year + 1}`);
  });
});
