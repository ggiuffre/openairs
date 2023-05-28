import type { Openair } from "../types";

export function* binned(
  openairs: Openair[],
  { getBin }: { getBin: (openair: Openair) => string }
) {
  let i = 0;
  if (openairs.length > 0) {
    let currentBin = getBin(openairs[i]);
    let accumulator: Openair[] = [];
    while (i < openairs.length) {
      const openair = openairs[i];
      const elementBin = getBin(openair);
      if (elementBin === currentBin) {
        accumulator.push(openair);
      } else {
        yield accumulator;
        accumulator = [openair];
        currentBin = elementBin;
      }
      i++;
    }
  }
}

export const getInitialLetter = (openair: Openair): string =>
  openair.name[0].toUpperCase();

export const getMonth = (openair: Openair): string =>
  monthNames[openair.dates[0].start.getMonth()];

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
