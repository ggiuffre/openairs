"use client";

import React from "react";
import styles from "./styles.module.css";
import dynamic from "next/dynamic";
import { GitHub } from "react-feather";

const ThemeSwitch = dynamic(
  () => import("../ThemeSwitch").then((mod) => mod.ThemeSwitch),
  { ssr: false }
);

export const MenuTopBar: React.FC = () => (
  <header className={styles.menuTopBar}>
    <a
      href="https://github.com/ggiuffre/openairs"
      className={styles.repoLink + " tag"}
      target="_blank"
      title="source code repository"
    >
      <GitHub />
    </a>{" "}
    <span className={styles.versionTag + " tag"}>version 0.1</span>
    <ThemeSwitch />
  </header>
);
