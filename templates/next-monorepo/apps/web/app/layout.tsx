import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";

import "./globals.css";

const loveSans = localFont({
  src: [
    {
      path: "../public/fonts/LoveSans-Light.woff",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/LoveSans-LightItalic.woff",
      weight: "300",
      style: "italic",
    },
    {
      path: "../public/fonts/LoveSans-Regular.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/LoveSans-RegularItalic.woff",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/LoveSans-Medium.woff",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/LoveSans-MediumItalic.woff",
      weight: "500",
      style: "italic",
    },
    {
      path: "../public/fonts/LoveSans-Semibold.woff",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/LoveSans-SemiboldItalic.woff",
      weight: "600",
      style: "italic",
    },
    {
      path: "../public/fonts/LoveSans-Bold.woff",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/LoveSans-BoldItalic.woff",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-love-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HonestUI Next.js Starter",
  description: "A Next.js starter preloaded with the HonestUI registry.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="light"
      data-style="modern"
      className={loveSans.variable}
    >
      <body>{children}</body>
    </html>
  );
}
