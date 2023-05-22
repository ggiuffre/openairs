import React from "react";
import styles from "./styles.module.css";
import { randomGradient } from "@/app/data/colors";
import type { DateRange, Openair } from "@/app/data/types";
import { ExternalLink } from "react-feather";

interface Props {
  openair: Openair;
}

export const ItemCard: React.FC<Props> = ({ openair }) => (
  <article
    className={styles.itemCard}
    style={{ background: randomGradient({ min: 50, alpha: 0.2 }) }}
  >
    <h2>{openair.name}</h2>
    <a
      className={styles.website}
      href={openair.website}
      target="_blank"
      title="event website"
    >
      <ExternalLink />
    </a>
    <p>
      {openair.place}, {openair.canton}
    </p>
    {openair.dates.map(dateFromRange).map((dateRange) => (
      <p key={openair.website + dateRange}>{dateRange}</p>
    ))}
    <p>
      {openair.musicTypes.map((tag) => (
        <span className="tag" key={tag}>
          {tag}
        </span>
      ))}
    </p>
  </article>
);

const dateFromRange = (dateRange: DateRange): string =>
  dateRange.start?.getDate() === dateRange.end?.getDate()
    ? dateRange.start?.toLocaleDateString(["de-ch"])
    : `${dateRange.start?.toLocaleDateString([
        "de-ch",
      ])} - ${dateRange.end?.toLocaleDateString(["de-ch"])}`;
