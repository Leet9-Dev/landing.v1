"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Platform Hub", href: "/app/settings/platforms" },
  { label: "Privacy & Data", href: "/app/settings/privacy" },
];

export function SettingsNav() {
  const pathname = usePathname();
  return (
    <div style={{ display: "flex", gap: 4, marginBottom: 28, borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: 0 }}>
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: active ? "#C8FF00" : "rgba(241,243,249,0.4)",
              textDecoration: "none",
              padding: "8px 16px",
              borderBottom: active ? "2px solid #C8FF00" : "2px solid transparent",
              marginBottom: -1,
              transition: "color 0.15s",
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
