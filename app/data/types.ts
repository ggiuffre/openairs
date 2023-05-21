export interface Openair {
  name: string;
  website: `https://${Lowercase<string>}`;
  place: string;
  dates: DateRange[];
}

interface DateRange {
  start: Date;
  end: Date;
}
