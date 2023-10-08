import type { Openair } from "./types";

export const Factory = {
  Openair: ({
    name,
    website,
    place,
    canton,
    musicTypes,
    dates,
    gradient,
  }: Partial<Openair> = {}): Openair => ({
    name: name ?? "Test Openair",
    website: website ?? "https://example.com",
    place: place ?? "Zürich",
    canton: canton ?? "ZH",
    musicTypes: musicTypes ?? [],
    dates: dates ?? [
      { start: new Date(2023, 0, 1), end: new Date(2023, 1, 1) },
    ],
    gradient:
      gradient ??
      "linear-gradient(0deg, rgba(100, 100, 100, 0.5), rgba(100, 100, 100, 0.5))",
  }),
  Date: ({
    year,
    monthIndex,
    day,
  }: {
    year?: number;
    monthIndex?: number;
    day?: number;
  } = {}) =>
    new Date(
      year ?? 2000 + Math.floor(Math.random() * 30),
      monthIndex ?? Math.floor(Math.random() * 12),
      day ?? Math.ceil(Math.random() * 31)
    ),
  Range: ({ duration }: { duration?: number } = {}) => {
    const rangeDuration =
      duration ??
      Math.round(Math.random() > 0.7 ? Math.random() * 120 : Math.random() * 5);
    const start = Factory.Date();
    const end = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() + rangeDuration,
    );
    return { start, end };
  },
};
