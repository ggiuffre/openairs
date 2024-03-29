"use client";

import React, { useEffect, useState } from "react";
import styles from "./styles.module.css";
import { Moon, Sun } from "react-feather";

export const ThemeSwitch: React.FC = () => {
  // const osTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
  //   ? "dark"
  //   : "light";
  const defaultTheme = localStorage.getItem("theme") ?? "light"; // until we fix SSR flash
  const [currentTheme, setCurrentTheme] = useState(defaultTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", currentTheme);
  }, [currentTheme]);

  const toggleTheme = () => {
    const targetTheme = currentTheme === "dark" ? "light" : "dark";
    setCurrentTheme(targetTheme);
    localStorage.setItem("theme", targetTheme);
  };

  return (
    <button
      className={styles.switch + " tag"}
      title={currentTheme === "dark" ? "use bright mode" : "use dark mode"}
      onClick={toggleTheme}
    >
      {currentTheme === "dark" ? <Moon /> : <Sun />}
    </button>
  );
};
