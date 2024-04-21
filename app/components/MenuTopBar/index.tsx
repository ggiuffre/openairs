import React from "react";
import styles from "./styles.module.css";
import { ChevronLeft, Home } from "react-feather";
import Link from "next/link";
import { ThemeSwitch } from "../ThemeSwitch";

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
