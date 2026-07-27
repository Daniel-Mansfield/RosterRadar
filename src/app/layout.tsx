import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { StrictMode, type ReactElement, type ReactNode } from "react";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RosterRadar",
  description:
    "Role-aware NBA scouting dossiers for roster decisions — verdict first, evidence second.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): ReactElement {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <StrictMode>{children}</StrictMode>
      </body>
    </html>
  );
}
