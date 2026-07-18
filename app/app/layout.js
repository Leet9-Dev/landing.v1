import { AppLayoutClient } from "@/components/layout/AppLayoutClient";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AppLayout({ children }) {
  return <AppLayoutClient>{children}</AppLayoutClient>;
}
