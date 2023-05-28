import type { Gradient } from "./colors";

/// Data about an openair festival
export interface Openair {
  name: string;
  website: `https://${Lowercase<string>}`;
  place: string;
  canton: Canton;
  musicTypes: MusicType[];
  dates: DateRange[];
  gradient: Gradient;
}

/// Date range
export interface DateRange {
  start: Date;
  end: Date;
}

export const musicTypes = ["classical music", "eclectic", "techno"] as const;

export type MusicType = (typeof musicTypes)[number];

export const cantons = [
  "AG",
  "AI",
  "AR",
  "BE",
  "BL",
  "BS",
  "FR",
  "GE",
  "GL",
  "GR",
  "JU",
  "LU",
  "NE",
  "NW",
  "OW",
  "SG",
  "SH",
  "SO",
  "SZ",
  "TG",
  "TI",
  "UR",
  "VD",
  "VS",
  "ZG",
  "ZH",
] as const;

/// Swiss Canton
export type Canton = (typeof cantons)[number];

export const sortMethods = ["name", "date"] as const;

/// Method of sorting items
export type SortMethod = (typeof sortMethods)[number];

/// Function to compare two items with each other
export type CompareFunction<T> = (a: T, b: T) => number;
