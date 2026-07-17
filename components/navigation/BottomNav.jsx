"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/navigation";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="l9-bottom-nav" style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      height: 60,
      background: "#0A0C14",
      borderTop: "1px solid rgba(255,255,255,0.07)",
      display: "none", // overridden by CSS to flex on mobile
      alignItems: "center",
      justifyContent: "space-around",
      zIndex: 40,
      paddingBottom: "env(safe-area-inset-bottom)",
    }}>
      {NAV_ITEMS.filter((item) => !item.divider).map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.id}
            href={item.href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              padding: "6px 20px",
              borderRadius: 10,
              textDecoration: "none",
              color: isActive ? "#C8FF00" : "rgba(241,243,249,0.35)",
              fontFamily: "'Outfit', sans-serif",
              transition: "color 0.15s",
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>{item.icon}</span>
            <span style={{
              fontSize: 10,
              fontWeight: isActive ? 700 : 500,
              letterSpacing: 0.3,
              textTransform: "uppercase",
            }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
