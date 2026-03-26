import { Inter, JetBrains_Mono } from "next/font/google";

/** Marketing-only: Stripe-adjacent sans + mono for UI chrome. */
export const marketingSans = Inter({
  subsets: ["latin"],
  variable: "--font-marketing-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const marketingMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-marketing-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});
