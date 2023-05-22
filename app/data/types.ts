export interface Openair {
  name: string;
  website: `https://${Lowercase<string>}`;
  place: string;
  dates: DateRange[];
}

export interface DateRange {
  start: Date;
  end: Date;
}

const sortMethods = ["name", "date"] as const;
export type SortMethod = (typeof sortMethods)[number];

export const isSortMethod = (value: unknown): value is SortMethod =>
  typeof value === "string" && value in sortMethods;

export type CompareFunction<T> = (a: T, b: T) => number;
