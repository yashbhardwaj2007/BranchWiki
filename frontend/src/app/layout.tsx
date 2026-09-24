import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BranchWiki — Collaborative Documentation",
  description: "Collaborative documentation with Git-backed versioning",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
