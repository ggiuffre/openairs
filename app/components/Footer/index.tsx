import React from "react";
import styles from "./styles.module.css";

export const Footer: React.FC = () => (
  <footer className={styles.footer}>
    <p>
      Created by <a href="https://ggiuffre.github.io/">Giorgio Giuffrè</a> as a
      personal project.
    </p>
    <p>
      Source code available on{" "}
      <a
        href="https://github.com/ggiuffre/openairs"
        target="_blank"
        title="source code repository"
      >
        GitHub
      </a>
    </p>
  </footer>
);
