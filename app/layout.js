import "./globals.css";
import { Outfit, Space_Grotesk } from "next/font/google";
import { SessionProviderWrapper } from "@/components/SessionProviderWrapper";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-outfit",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://leet9.com";

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Leet9 — Your gaming identity, finally visible.",
    template: "%s | Leet9",
  },
  description:
    "Discover games, earn L9 Points, compare with friends, and build the profile that proves how you play.",
  keywords: ["gaming", "gamer profile", "steam", "PSN", "achievements", "leaderboard", "l9 points"],
  authors: [{ name: "Leet9" }],
  creator: "Leet9",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "Leet9",
    title: "Leet9 — Your gaming identity, finally visible.",
    description:
      "Discover games, earn L9 Points, compare with friends, and build the profile that proves how you play.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Leet9 — Your gaming identity, finally visible.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Leet9 — Your gaming identity, finally visible.",
    description:
      "Discover games, earn L9 Points, compare with friends, and build the profile that proves how you play.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} ${spaceGrotesk.variable}`}>
      <body>
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  );
}
