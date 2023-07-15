import React from "react";
import styles from "./styles.module.css";
import type { DateRange, Openair } from "@/app/data/types";
import {
  dateStringFromRange,
  getSlug,
  isPastDateRange,
} from "@/app/data/processing";
import Link from "next/link";

interface Props {
  openair: Openair;
  expanded?: boolean;
}

export const ItemCard: React.FC<Props> = ({ openair, expanded = false }) => (
  <Link
    className={styles.itemCard}
    style={{ background: openair.gradient, cursor: "pointer" }}
    href={`/events/${getSlug(openair.name)}`}
  >
    <h2>{openair.name}</h2>
    <p>
      {openair.place}, {openair.canton}
    </p>
    {openair.dates.map(dateNodeFromRange)}
    {expanded && (
      <p>
        {openair.musicTypes.map((tag) => (
          <span className="tag" key={tag}>
            {tag}
          </span>
        ))}
      </p>
    )}
  </Link>
);

const dateNodeFromRange = (dateRange: DateRange): React.ReactNode => (
  <p
    style={{ opacity: isPastDateRange(dateRange) ? 0.35 : 1 }}
    key={dateStringFromRange(dateRange)}
  >
    {dateStringFromRange(dateRange)}
  </p>
);
