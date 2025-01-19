import {
  getInitialLetter,
  getMonth,
  isPastDateRange,
  isValidDateRange,
} from ".";
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
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  test("returns the month of the first starting date", () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const openair = Factory.Openair({
      dates: [
        { start: new Date(year, month, 1), end: new Date(year, month + 1, 1) },
      ],
    });
    expect(getMonth(openair)).toBe(monthNames[month]);
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

  // // Not sure what this test was about:
  //   test("returns current month if openair is happening now but started in the past", () => {
  //     const now = new Date();
  //     const year = now.getFullYear();
  //     const month = now.getMonth();
  //     const openair = Factory.Openair({
  //       dates: [
  //         {
  //           start: new Date(year, month - 2, 1),
  //           end: new Date(year, month + 1, 1),
  //         },
  //       ],
  //     });
  //     expect(getMonth(openair)).toBe(monthNames[month]);
  //   });
});

describe("isValidDateRange", () => {
  test("returns false if end is before start in same year", () => {
    const start = new Date(2000, 3, 1);
    const end = new Date(2000, 2, 31);
    expect(isValidDateRange({ start, end })).toBe(false);
  });

  test("returns true if start is before end in same year", () => {
    const start = new Date(2000, 2, 31);
    const end = new Date(2000, 3, 1);
    expect(isValidDateRange({ start, end })).toBe(true);
  });

  test("returns false if end is before start across years", () => {
    const start = new Date(2001, 0, 10);
    const end = new Date(2000, 11, 28);
    expect(isValidDateRange({ start, end })).toBe(false);
  });

  test("returns true if start is before end across years", () => {
    const start = new Date(2000, 11, 28);
    const end = new Date(2001, 0, 10);
    expect(isValidDateRange({ start, end })).toBe(true);
  });

  test("returns true if start is end", () => {
    const start = new Date(2000, 2, 31);
    const end = start;
    expect(isValidDateRange({ start, end })).toBe(true);
  });
});

describe("isPastDateRange", () => {
  test("returns true if end is before today", () => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const start = new Date(year, month - 2, 1);
    const end = new Date(year, month - 1, 1);
    expect(isPastDateRange({ start, end })).toBe(true);
  });

  test("returns false if end is today", () => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const start = new Date(year, month - 1, 1);
    const end = now;
    expect(isPastDateRange({ start, end })).toBe(false);
  });

  test("returns false if end is after today", () => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 1);
    expect(isPastDateRange({ start, end })).toBe(false);
  });
});
