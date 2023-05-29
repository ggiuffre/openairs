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
};
