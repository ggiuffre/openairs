"use client";

import React, { useState } from "react";
import styles from "./styles.module.css";
import {
  type Canton,
  type CompareFunction,
  type MusicType,
  type Openair,
  type SortMethod,
  cantons,
  musicTypes,
} from "@/app/data/types";
import { ListView } from "../ListView";
import { Filter } from "../Filter";
import { isRecentOrUpcomingDateRange } from "@/app/data/processing";

interface Props {
  openairs: Openair[];
}

export const MainView: React.FC<Props> = ({ openairs }) => {
  const compareFunctions: Record<SortMethod, CompareFunction<Openair>> = {
    name: (a, b) => a.name.localeCompare(b.name),
    date: (a, b) =>
      (
        a.dates.find(isRecentOrUpcomingDateRange) ?? a.dates[0]
      ).start?.getTime() -
      (
        b.dates.find(isRecentOrUpcomingDateRange) ?? b.dates[0]
      ).start?.getTime(),
  };
  const [sortMethod, setSortMethod] = useState<SortMethod>("date");
  const [selectedMusicTypes, setSelectedMusicTypes] = useState<Set<MusicType>>(
    new Set(musicTypes)
  );
  const [selectedCantons, setSelectedCantons] = useState<Set<Canton>>(
    new Set(cantons)
  );

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1>Openairs, festivals and music in Switzerland.</h1>
      </header>
      <Filter
        sortMethod={sortMethod}
        setSortMethod={setSortMethod}
        selectedMusicTypes={selectedMusicTypes}
        setSelectedMusicTypes={setSelectedMusicTypes}
        selectedCantons={selectedCantons}
        setSelectedCantons={setSelectedCantons}
      />
      <ListView
        sortMethod={sortMethod}
        openairs={openairs
          .filter((openair) => selectedMusicTypes.has(openair.musicTypes[0]))
          .filter((openair) => selectedCantons.has(openair.canton))
          .sort(compareFunctions[sortMethod])}
      />
    </main>
  );
};
