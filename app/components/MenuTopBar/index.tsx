"use client";

import React from "react";
import styles from "./styles.module.css";
import dynamic from "next/dynamic";
import { Home } from "react-feather";
import Link from "next/link";

const ThemeSwitch = dynamic(
  () => import("../ThemeSwitch").then((mod) => mod.ThemeSwitch),
  { ssr: false }
);

export const MenuTopBar: React.FC = () => (
  <header className={styles.menuTopBar}>
    <Link href="/" className="tag iconTag" title="home page">
      <Home />
    </Link>
    <ThemeSwitch />
  </header>
);
