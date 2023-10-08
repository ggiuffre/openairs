import { getWeek, nextDateFromPast } from "./dates";
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
});
