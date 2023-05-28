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
  return (
    <>
      {Array.from(binned(openairs, { getBin }))
        .filter((bin) => bin.length > 0)
        .flatMap((bin) => [
          <p key={getBin(bin[0])} className={styles.sectionTitle}>
            {getBin(bin[0])}
          </p>,
          ...bin.map((openair) => (
            <ItemCard key={openair.name + openair.website} openair={openair} />
          )),
        ])}
    </>
  );
};
