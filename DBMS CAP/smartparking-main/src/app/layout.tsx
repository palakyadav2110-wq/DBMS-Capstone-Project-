import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartPark — Parking, made simple",
  description: "A full-stack parking reservation and management application.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
