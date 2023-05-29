import React from "react";
import styles from "./styles.module.css";
import type { DateRange, Openair } from "@/app/data/types";
import { ExternalLink } from "react-feather";
import { isPastDateRange } from "@/app/data/processing";

interface Props {
  openair: Openair;
}

export const ItemCard: React.FC<Props> = ({ openair }) => (
  <article className={styles.itemCard} style={{ background: openair.gradient }}>
    <h2>{openair.name}</h2>
    <a
      className={styles.website + " tag clickable"}
      href={openair.website}
      target="_blank"
      title="event website"
    >
      <ExternalLink />
    </a>
    <p>
      {openair.place}, {openair.canton}
    </p>
    {openair.dates.map(dateNodeFromRange)}
    <p>
      {openair.musicTypes.map((tag) => (
        <span className="tag" key={tag}>
          {tag}
        </span>
      ))}
    </p>
  </article>
);

const dateStringFromRange = (dateRange: DateRange): string =>
  dateRange.start?.getDate() === dateRange.end?.getDate()
    ? dateRange.start?.toLocaleDateString(["de-ch"])
    : `${dateRange.start?.toLocaleDateString([
        "de-ch",
      ])} - ${dateRange.end?.toLocaleDateString(["de-ch"])}`;

const dateNodeFromRange = (dateRange: DateRange): React.ReactNode => (
  <p
    style={{ opacity: isPastDateRange(dateRange) ? 0.35 : 1 }}
    key={dateStringFromRange(dateRange)}
  >
    {dateStringFromRange(dateRange)}
  </p>
);
