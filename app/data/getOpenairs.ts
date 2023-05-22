import { readFile } from "fs/promises";
import path from "path";
import type { Openair, DateRange } from "./types";
import { randomGradient } from "./colors";

export const getOpenairs = async () => {
  const jsonDirectory = path.join(process.cwd(), "app/data/");
  const fileContents = await readFile(jsonDirectory + "openairs.json", "utf8");
  const data: Openair[] = JSON.parse(fileContents, (key, value) => {
    if (key === "dates") {
      return value.map((dateRange: DateRange) => ({
        start: new Date(dateRange.start),
        end: new Date(dateRange.end),
      }));
    } else {
      return value;
    }
  });
  data.forEach(
    (openair) => (openair["gradient"] = randomGradient({ min: 50, alpha: 0.2 }))
  );
  return data;
};
