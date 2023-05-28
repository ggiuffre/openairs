"use client";

import React from "react";
import styles from "./styles.module.css";
import dynamic from "next/dynamic";

const ThemeSwitch = dynamic(
  () => import("../ThemeSwitch").then((mod) => mod.ThemeSwitch),
  { ssr: false }
);

export const MenuTopBar: React.FC = () => (
  <header className={styles.menuTopBar}>
    <ThemeSwitch />
  </header>
);
