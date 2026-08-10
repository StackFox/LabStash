import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LabStash — Share without the overhead",
  description: "Fast, private file sharing for people who make things.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
