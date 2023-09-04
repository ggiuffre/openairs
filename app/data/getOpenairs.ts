import type { Openair, DateRange } from "./types";
import { randomGradient } from "./colors";

interface SerializedDateRange {
  start: string;
  end: string;
}

type SerializedOpenair = Omit<Openair, "dates" | "gradient"> & {
  dates: SerializedDateRange[];
};

export const getOpenairs = async () => {
  // Get data about openairs, revalidated every 6 hours:
  const serializedOpenairs: SerializedOpenair[] = await fetch(
    `https://${websiteDomain}/openairs.json`,
    { next: { revalidate: 21600 } }
  ).then((res) => res.json());

  // Deserialize data:
  const openairs: Openair[] = serializedOpenairs.map((element) => ({
    name: element.name,
    website: element.website,
    place: element.place,
    canton: element.canton,
    musicTypes: element.musicTypes,
    dates: [
      deserializeDateRange(element.dates[0]),
      ...element.dates.slice(1).map(deserializeDateRange),
    ],
    gradient: randomGradient({ min: 50, alpha: 0.2 }),
  }));

  // return deserialized data:
  return openairs;
};

const websiteDomain = "lineup.quest";

const deserializeDateRange = (dateRange: SerializedDateRange): DateRange => ({
  start: new Date(dateRange.start),
  end: new Date(dateRange.end),
});
