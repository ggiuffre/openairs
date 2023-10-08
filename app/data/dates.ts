import type { DateRange } from "./types";

const ONE_DAY = 86400000; // number of milliseconds in one day

const average = (array: number[]) =>
  array.reduce((a, b) => a + b) / array.length;

export const nextDateFromPast = (pastDates: DateRange[]): DateRange => {
  const averageDuration = Math.round(
    average(
      pastDates.map(
        (range) => (range.end.getTime() - range.start.getTime()) / ONE_DAY
      )
    )
  );

  const averageWeek = Math.round(
    average(pastDates.map((range) => getWeek(range.start)))
  );
  const mostRecentYear = Math.max(
    ...pastDates.map((range) => range.start.getFullYear())
  );
  const candidate = new Date(mostRecentYear + 1, 0, 1 + (averageWeek - 1) * 7);
  const start =
    candidate.getDay() < 2
      ? new Date(
          candidate.getFullYear(),
          candidate.getMonth(),
          candidate.getDate() - candidate.getDay() - 1
        )
      : new Date(
          candidate.getFullYear(),
          candidate.getMonth(),
          candidate.getDate() - candidate.getDay() - 1 + 7
        );

  return {
    start,
    end: new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() + averageDuration
    ),
    estimated: true,
  };
};

export const getWeek = (date: Date) => {
  const januaryFirst = new Date(date.getFullYear(), 0, 1);
  const difference = date.getTime() - januaryFirst.getTime();
  const dayOfYear = (difference + ONE_DAY) / ONE_DAY; // number of days since Jan. 1st
  return Math.ceil(dayOfYear / 7);
};
