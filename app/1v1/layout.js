const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://leet9.com";

export const metadata = {
  title: "1 vs 1 — Compare Steam Profiles",
  description:
    "Compare two Steam profiles head-to-head. See who has more hours, more games, and claim your victory on Leet9.",
  openGraph: {
    title: "1 vs 1 Steam Battle — Leet9",
    description: "Compare two Steam profiles head-to-head on Leet9.",
    url: `${BASE_URL}/1v1`,
    images: [
      {
        url: "/api/og/1v1",
        width: 1200,
        height: 630,
        alt: "Leet9 1v1 Steam Battle",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "1 vs 1 Steam Battle — Leet9",
    description: "Compare two Steam profiles head-to-head on Leet9.",
    images: ["/api/og/1v1"],
  },
};

export default function Layout({ children }) {
  return children;
}
