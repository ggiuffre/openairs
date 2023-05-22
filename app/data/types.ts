/// Data about an openair festival
export interface Openair {
  name: string;
  website: `https://${Lowercase<string>}`;
  place: string;
  canton: Canton;
  dates: DateRange[];
}

/// Date range
export interface DateRange {
  start: Date;
  end: Date;
}

/// Swiss Canton
type Canton =
  | "AG"
  | "AI"
  | "AR"
  | "BE"
  | "BL"
  | "BS"
  | "FR"
  | "GE"
  | "GL"
  | "GR"
  | "JU"
  | "LU"
  | "NE"
  | "NW"
  | "OW"
  | "SG"
  | "SH"
  | "SO"
  | "SZ"
  | "TG"
  | "TI"
  | "UR"
  | "VD"
  | "VS"
  | "ZG"
  | "ZH";

const sortMethods = ["name", "date"] as const;

/// Method of sorting items
export type SortMethod = (typeof sortMethods)[number];

export const isSortMethod = (value: unknown): value is SortMethod =>
  typeof value === "string" && value in sortMethods;

/// Function to compare two items with each other
export type CompareFunction<T> = (a: T, b: T) => number;
