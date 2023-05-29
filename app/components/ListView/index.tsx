import React from "react";
import styles from "./styles.module.css";
import { ItemCard } from "../ItemCard";
import type { Openair, SortMethod } from "@/app/data/types";
import { binned, getInitialLetter, getMonth } from "@/app/data/processing";

interface Props {
  openairs: Openair[];
  sortMethod: SortMethod;
}

export const ListView: React.FC<Props> = ({ openairs, sortMethod }) => {
  const getBin = sortMethod === "name" ? getInitialLetter : getMonth;
  const binnedOpenairs = Array.from(binned(openairs, { getBin })).filter(
    (bin) => bin.length > 0
  );

  return binnedOpenairs.length > 0 ? (
    <>
      {binnedOpenairs.flatMap((bin) => [
        <p key={getBin(bin[0])} className={styles.sectionTitle}>
          {getBin(bin[0])}
        </p>,
        ...bin.map((openair) => (
          <ItemCard key={openair.name + openair.website} openair={openair} />
        )),
      ])}
    </>
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
