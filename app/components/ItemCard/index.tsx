"use client";

import React from "react";
import styles from "./styles.module.css";
import type { DateRange, Openair } from "@/app/data/types";
import { ExternalLink } from "react-feather";
import {
  dateStringFromRange,
  getSlug,
  isPastDateRange,
} from "@/app/data/processing";
import { useRouter } from "next/navigation";

interface Props {
  openair: Openair;
  expanded?: boolean;
}

export const ItemCard: React.FC<Props> = ({ openair, expanded = false }) => {
  const { push } = useRouter();
  return (
    <article
      className={styles.itemCard}
      style={{ background: openair.gradient, cursor: "pointer" }}
      onClick={() => push(`/events/${getSlug(openair.name)}`)}
    >
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
      {expanded && (
        <p>
          {openair.musicTypes.map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </p>
      )}
    </article>
  );
};

const dateNodeFromRange = (dateRange: DateRange): React.ReactNode => (
  <p
    style={{ opacity: isPastDateRange(dateRange) ? 0.35 : 1 }}
    key={dateStringFromRange(dateRange)}
  >
    {dateStringFromRange(dateRange)}
  </p>
);
