"use client";

import React, { useEffect, useState } from "react";
import styles from "./styles.module.css";
import { Moon, Sun } from "react-feather";

export const MenuTopBar: React.FC = () => {
  const defaultTheme = localStorage.getItem("theme") ?? "light";
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
    <header className={styles.menuTopBar}>
      <button
        className={styles.switch + " tag clickable"}
        onClick={toggleTheme}
      >
        {currentTheme === "dark" ? <Moon /> : <Sun />}
      </button>
    </header>
  );
};
