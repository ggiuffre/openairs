import React from "react";
import "./globals.css";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import { Footer } from "./components/Footer";

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
      <Footer />
    </body>
  </html>
);

export default RootLayout;
