/// Data about an openair festival
export interface Openair {
  name: string;
  website: `https://${Lowercase<string>}`;
  place: string;
  canton: Canton;
  musicTypes: MusicType[];
  dates: NonEmptyArray<DateRange>;
  since?: {
    year: number;
    source?: "website" | "wikipedia";
  };
  gradient: Gradient;
}

export type RgbaColor = `rgba(${number}, ${number}, ${number}, ${number})`;

export type Gradient =
  `linear-gradient(${number}deg, ${RgbaColor}, ${RgbaColor})`;

export type SerializedOpenair = Omit<Openair, "dates" | "gradient"> & {
  dates: SerializedDateRange[];
};

export interface SerializedDateRange {
  start: string;
  end: string;
  last?: boolean;
}

export interface ScrapedOpenairInfo {
  scrapingDate?: Date;
  artists?: string[];
  isCampingPossible?: boolean;
  isFree?: boolean;
}

type NonEmptyArray<T> = [T, ...T[]];

/// Date range
export interface DateRange {
  start: Date;
  end: Date;
  estimated?: boolean;
  last?: boolean;
}

export const musicTypes = [
  "classical music",
  "all",
  "techno",
  "metal",
] as const;

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
