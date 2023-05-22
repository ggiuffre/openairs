import { readFile } from "fs/promises";
import path from "path";
import type { Openair, DateRange } from "./types";

export const getOpenairs = async () => {
  const jsonDirectory = path.join(process.cwd(), "app/data/");
  const fileContents = await readFile(jsonDirectory + "openairs.json", "utf8");
  const data: Openair[] = JSON.parse(fileContents, (key, value) =>
    key === "dates"
      ? value.map((dateRange: DateRange) => ({
          start: new Date(dateRange.start),
          end: new Date(dateRange.end),
        }))
      : value
  );
  return data;
};
