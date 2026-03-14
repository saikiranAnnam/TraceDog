import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "TraceDog",
  description: "AI agent traces",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav
          style={{
            padding: "12px 20px",
            borderBottom: "1px solid #30363d",
            display: "flex",
            gap: "20px",
          }}
        >
          <Link href="/">Home</Link>
          <Link href="/traces">Traces</Link>
          <Link href="/overview">Overview</Link>
        </nav>
        <main style={{ padding: "24px", maxWidth: 1100, margin: "0 auto" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
