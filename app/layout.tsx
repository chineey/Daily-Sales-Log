import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily Sales Log | Lagos Shopkeeper Operations",
  description: "Track daily sales, view running totals, and monitor shop revenue in real-time.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
