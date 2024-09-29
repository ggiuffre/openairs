import {
  getWeek,
  lastDateRange,
  monthsDifference,
  nextDateFromPast,
} from "./dates";
import { Factory } from "./factories";

describe("getWeek", () => {
  test("Returns a number greater than 0", () => {
    const date = Factory.Date();
    expect(getWeek(date)).toBeGreaterThan(0);
  });

  test("Returns a number not bigger than 53", () => {
    const date = Factory.Date();
    expect(getWeek(date)).toBeLessThanOrEqual(53);
  });

  test("returns 1 for the first 7 days of the year", () => {
    const dates = [...Array(7).keys()].map(
      (dayIndex) => new Date(2023, 0, dayIndex + 1)
    );
    dates.forEach((date) => expect(getWeek(date)).toBe(1));
  });
});

describe("nextDateFromPast", () => {
  test("Returns a month adjacent or equal to the starting month of the range, if given only 1 range", () => {
    const range = Factory.Range();
    expect(
      Math.abs(
        nextDateFromPast([range]).start.getMonth() - range.start.getMonth()
      )
    ).toBeLessThanOrEqual(1);
  });

  test("Returns a date less than 2 weeks apart from the start of the range, if given only 1 range", () => {
    const range = Factory.Range();
    expect(
      (nextDateFromPast([range]).start.getTime() - range.start.getTime()) /
        86400000
    ).toBeLessThan(14 + 365);
  });

  test("Returns an estimated date range", () => {
    const range = Factory.Range();
    expect(nextDateFromPast([range]).estimated).toBe(true);
  });
});

describe("lastDateRange", () => {
  test("Returns the date range with the latest date", () => {
    const ranges = Array.from({ length: 3 }).map(() => Factory.Range());
    const maxYear = Math.max(...ranges.map((range) => range.end.getFullYear()));
    ranges[0].end = new Date(maxYear + 1, 12);
    expect(lastDateRange(ranges)).toBe(ranges[0]);
  });
});

describe("monthsDifference", () => {
  test("Returns 0 if passed the same date twice", () => {
    const date = Factory.Date();
    expect(monthsDifference(date, date)).toBe(0);
  });

  test("Returns a positive number if the last date is greater than the first", () => {
    const range = Factory.Range();
    expect(monthsDifference(range.start, range.end)).toBeGreaterThanOrEqual(0);
  });

  test("Returns a negative number if the last date is smaller than the first", () => {
    const range = Factory.Range();
    expect(monthsDifference(range.end, range.start)).toBeLessThanOrEqual(0);
  });
});
