import "./globals.css";
import { SessionProviderWrapper } from "@/components/SessionProviderWrapper";

export const metadata = {
  title: "Leet9 — Your gaming identity, finally visible.",
  description: "Discover games, earn L9 Points, compare with friends, and build the profile that proves how you play.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  );
}
