import React from "react";
import styles from "./styles.module.css";
import { ItemCard } from "../ItemCard";
import type { Openair, SortMethod } from "@/app/data/types";

interface Props {
  openairs: Openair[];
  sortMethod: SortMethod;
}

export const ListView: React.FC<Props> = ({ openairs, sortMethod }) => {
  const getBin = sortMethod === "name" ? getInitialLetter : getMonth;

  function* binned(openairs: Openair[]) {
    let i = 0;
    let currentBin = getBin(openairs[i]);
    let accumulator: Openair[] = [];
    while (i < openairs.length) {
      if (getBin(openairs[i]) === currentBin) {
        accumulator.push(openairs[i]);
      } else {
        yield accumulator;
        accumulator = [];
        currentBin = getBin(openairs[i]);
      }
      i++;
    }
  }

  return (
    <>
      {Array.from(binned(openairs))
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

const getInitialLetter = (openair: Openair): string => openair.name[0];

const getMonth = (openair: Openair): string =>
  monthNames[openair.dates[0].start.getMonth()];

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
