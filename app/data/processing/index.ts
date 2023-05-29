import type { DateRange, Openair } from "../types";

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
    yield accumulator;
  }
}

export const getInitialLetter = (openair: Openair): string =>
  openair.name.length > 0 ? openair.name[0].toUpperCase() : "";

export const getMonth = (openair: Openair): string => {
  const nextRecentOrUpcomingDaterange =
    openair.dates.find(isRecentOrUpcomingDateRange) ?? openair.dates[0];
  const month = monthNames[nextRecentOrUpcomingDaterange.start.getMonth()];
  const year = nextRecentOrUpcomingDaterange.start.getFullYear();
  if (year === today().getFullYear()) {
    return month;
  } else {
    return `${month} ${year}`;
  }
};

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

/**
 * Get whether a date range is valid (i.e. non-empty and in the recent past or
 * future).
 * @param dateRange a date range
 */
export const isValidDateRange = ({ start, end }: DateRange): boolean =>
  start.getFullYear() > 1900 && start <= end && end.getFullYear() < 2200;

/**
 * Get whether a date range is in the past and valid
 * @param dateRange a date range
 */
export const isPastDateRange = ({ start, end }: DateRange): boolean =>
  isValidDateRange({ start, end }) && end < today();

/**
 * Get whether a date range is recent (did not happen more than a week ago) or
 * upcoming (in the present or future).
 * @param dateRange a date range
 */
export const isRecentOrUpcomingDateRange = (dateRange: DateRange): boolean => {
  const includePastDays = 7; // n
  const reference = new Date(); // today
  reference.setDate(reference.getDate() - includePastDays); // n days ago
  return dateRange.end >= reference;
};

/**
 * Get today's date at the start (midnight), optionally in night-owl mode.
 * In night-owl mode, today is yesterday if now is before 8 AM. This makes
 * sense to night owls: any time before going to sleep is in the same day as
 * when the party started.
 * @param nightOwl whether to use night-owl mode
 */
export const today = ({ nightOwl = true } = {}) => {
  const now = new Date();
  if (nightOwl && now.getHours() < 8) {
    now.setDate(now.getDate() - 1);
  }
  now.setHours(0, 0, 0, 0);
  return now;
};
