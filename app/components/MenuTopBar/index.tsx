"use client";

import React from "react";
import styles from "./styles.module.css";
import dynamic from "next/dynamic";
import { ChevronLeft, Home } from "react-feather";
import Link from "next/link";

const ThemeSwitch = dynamic(
  () => import("../ThemeSwitch").then((mod) => mod.ThemeSwitch),
  { ssr: false }
);

interface Props {
  homeButton?: "home" | "back";
}

export const MenuTopBar: React.FC<Props> = ({ homeButton = "home" }) => (
  <header className={styles.menuTopBar}>
    <Link href="/" className="tag iconTag" title="home page">
      {homeButton === "home" ? <Home /> : <ChevronLeft />}
    </Link>
    <ThemeSwitch />
  </header>
);
