"use client";

import React, { useState } from "react";
import styles from "./styles.module.css";
import {
  type CompareFunction,
  type Openair,
  type SortMethod,
  type MusicType,
  sortMethods,
  musicTypes,
} from "@/app/data/types";
import { ListView } from "../ListView";

interface Props {
  openairs: Openair[];
}

export const Filter: React.FC<Props> = ({ openairs }) => {
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
      <p>
        <label>
          sort by{" "}
          <select
            value={sortMethod}
            onChange={(e) => {
              const targetValue = e.target.value as SortMethod;
              setSortMethod(targetValue);
            }}
          >
            {sortMethods.map((sortMethod) => (
              <option key={sortMethod} value={sortMethod}>
                {sortMethod}
              </option>
            ))}
          </select>
        </label>
      </p>
      <p>
        include{" "}
        {musicTypes
          .map<React.ReactNode>((tag) => (
            <span
              key={tag}
              className="tag"
              style={{
                cursor: "pointer",
                opacity: selectedMusicTypes.has(tag) ? 1 : 0.3,
              }}
              onClick={() => {
                if (selectedMusicTypes.has(tag)) {
                  const newSet = selectedMusicTypes;
                  selectedMusicTypes.delete(tag);
                  setSelectedMusicTypes(new Set(newSet));
                } else {
                  setSelectedMusicTypes((tags) => new Set(tags.add(tag)));
                }
              }}
            >
              {tag}
            </span>
          ))
          .reduce((prev, curr) => [prev, " ", curr])}
      </p>
      <ListView
        sortMethod={sortMethod}
        openairs={openairs
          .filter((openair) => selectedMusicTypes.has(openair.musicTypes[0]))
          .sort(compareFunctions[sortMethod])}
      />
    </main>
  );
};
