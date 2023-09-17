import React from "react";
import "./globals.css";
import { Inter } from "next/font/google";
import type { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "lineup.quest",
  authors: [{ name: "Giorgio Giuffrè", url: "https://ggiuffre.github.io/" }],
  description: "Openairs, festivals and music in Switzerland.",
};

interface Props {
  children: React.ReactNode;
}

const RootLayout: React.FC<Props> = ({ children }) => (
  <html lang="en">
    <body className={inter.className}>
      {children}
      <footer
        style={{
          marginTop: "10rem",
          padding: "2rem",
          width: "100%",
          backgroundColor: "rgba(var(--card-rgba))",
          textAlign: "center",
        }}
      >
        <p
          style={{
            maxWidth: "var(--max-width)",
            margin: "auto",
          }}
        >
          Created by{" "}
          <a
            href="https://ggiuffre.github.io/"
            style={{ textDecoration: "underline" }}
          >
            Giorgio Giuffrè
          </a>{" "}
          as a personal project.
        </p>
        <p
          style={{
            maxWidth: "var(--max-width)",
            margin: "0.8rem auto",
          }}
        >
          Source code available on{" "}
          <a
            href="https://github.com/ggiuffre/openairs"
            target="_blank"
            style={{ textDecoration: "underline" }}
            title="source code repository"
          >
            GitHub
          </a>
        </p>
      </footer>
    </body>
  </html>
);

export default RootLayout;
