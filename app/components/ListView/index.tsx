import React from "react";
import styles from "./styles.module.css";
import { ItemCard } from "../ItemCard";
import type { Openair, SortMethod } from "@/app/data/types";
import {
  binned,
  getInitialLetter,
  getMonth,
  isRecentOrUpcomingOpenair,
} from "@/app/data/processing";

interface Props {
  openairs: Openair[];
  sortMethod: SortMethod;
}

export const ListView: React.FC<Props> = ({ openairs, sortMethod }) => {
  openairs = openairs.filter(isRecentOrUpcomingOpenair);
  const getBin = sortMethod === "name" ? getInitialLetter : getMonth;
  const binnedOpenairs = Array.from(binned(openairs, { getBin })).filter(
    (bin) => bin.length > 0
  );

  return binnedOpenairs.length > 0 ? (
    <ul className={styles.list}>
      {binnedOpenairs.flatMap((bin) => [
        <li key={getBin(bin[0])} className={styles.sectionTitle}>
          {getBin(bin[0])}
        </li>,
        ...bin.map((openair) => (
          <li key={openair.name + openair.website}>
            <ItemCard openair={openair} />
          </li>
        )),
      ])}
    </ul>
  ) : (
    <NoResults />
  );
};

const NoResults: React.FC = () => (
  <div className={styles.noResults}>
    No results. Do you want to add an event to this list? Please{" "}
    <a href="https://github.com/ggiuffre/openairs/issues">create a new issue</a>{" "}
    on our GitHub repo.
  </div>
);
