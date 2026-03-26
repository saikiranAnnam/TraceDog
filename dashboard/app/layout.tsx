import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TraceDog",
  description: "Observability and reliability for AI agents",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className="td-body">{children}</body>
    </html>
  );
}
