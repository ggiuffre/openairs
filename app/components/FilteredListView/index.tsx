"use client";

import React, { useState } from "react";
import styles from "./styles.module.css";
import {
  type CompareFunction,
  type Openair,
  type SortMethod,
  type MusicType,
  musicTypes,
} from "@/app/data/types";
import { ListView } from "../ListView";
import { FilterControls } from "../FilterControls";

interface Props {
  openairs: Openair[];
}

export const FilteredListView: React.FC<Props> = ({ openairs }) => {
  const compareFunctions: Record<SortMethod, CompareFunction<Openair>> = {
    name: (a, b) => a.name.localeCompare(b.name),
    date: (a, b) => a.dates[0].start?.getTime() - b.dates[0].start?.getTime(),
  };
  const [sortMethod, setSortMethod] = useState<SortMethod>("name");
  const [selectedMusicTypes, setSelectedMusicTypes] = useState<Set<MusicType>>(
    new Set(musicTypes)
  );

  return (
    <main className={styles.main}>
      <FilterControls
        sortMethod={sortMethod}
        setSortMethod={setSortMethod}
        selectedMusicTypes={selectedMusicTypes}
        setSelectedMusicTypes={setSelectedMusicTypes}
      />
      <ListView
        sortMethod={sortMethod}
        openairs={openairs
          .filter((openair) => selectedMusicTypes.has(openair.musicTypes[0]))
          .sort(compareFunctions[sortMethod])}
      />
    </main>
  );
};
