"use client";

import React, { useState } from "react";
import styles from "./styles.module.css";
import { ItemCard } from "../ItemCard";
import {
  type CompareFunction,
  type Openair,
  type SortMethod,
  isSortMethod,
} from "@/app/data/types";

interface Props {
  openairs: Openair[];
}

export const ItemList: React.FC<Props> = ({ openairs }) => {
  const sortMethods: Record<SortMethod, CompareFunction<Openair>> = {
    name: (a, b) => a.name.localeCompare(b.name),
    date: (a, b) => a.dates[0].start?.getTime() - b.dates[0].start?.getTime(),
  };
  const [sortMethod, setSortMethod] = useState<SortMethod>("name");
  return (
    <main className={styles.main}>
      <label>
        Sort by:{" "}
        <select
          value={sortMethod}
          onChange={(e) => {
            const targetValue = e.target.value as SortMethod;
            setSortMethod(targetValue);
          }}
        >
          {Object.keys(sortMethods).map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
      </label>
      {openairs.sort(sortMethods[sortMethod]).map((openair) => (
        <ItemCard key={openair.name + openair.website} openair={openair} />
      ))}
    </main>
  );
};
