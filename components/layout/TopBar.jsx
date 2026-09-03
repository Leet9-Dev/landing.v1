"use client";
import { signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { NAV_ITEMS } from "@/lib/navigation";

function SearchDropdown({ onClose }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const search = useCallback((q) => {
    clearTimeout(debounceRef.current);
    if (q.length < 2) { setResults(null); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const json = await res.json();
        if (json.ok) setResults(json.data);
      } catch {}
      setLoading(false);
    }, 280);
  }, []);

  function handleChange(e) {
    setQuery(e.target.value);
    search(e.target.value);
  }

  function go(href) {
    onClose();
    router.push(href);
  }

  const hasResults = results && (results.players.length > 0 || results.games.length > 0);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(200,255,0,0.25)",
        borderRadius: 10, padding: "5px 12px",
        width: 220,
      }}>
        <span style={{ fontSize: 13, color: "rgba(241,243,249,0.4)", flexShrink: 0 }}>⌕</span>
        <input
          ref={inputRef}
          value={query}
          onChange={handleChange}
          onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
          placeholder="Players, games…"
          style={{
            flex: 1, background: "none", border: "none", outline: "none",
            fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 500,
            color: "#F1F3F9",
          }}
        />
        {loading && <span style={{ fontSize: 10, color: "rgba(241,243,249,0.3)", flexShrink: 0 }}>…</span>}
      </div>

      {(hasResults || (query.length >= 2 && !loading && results)) && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          width: 280, background: "#0D0F1A",
          border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12,
          boxShadow: "0 16px 40px rgba(0,0,0,0.5)", zIndex: 999,
          overflow: "hidden",
        }}>
          {!hasResults && (
            <div style={{ padding: "14px 16px", fontSize: 13, color: "rgba(241,243,249,0.3)", textAlign: "center" }}>
              No results for "{query}"
            </div>
          )}

          {results?.players.length > 0 && (
            <div>
              <div style={{ padding: "8px 14px 4px", fontSize: 10, fontWeight: 700, color: "rgba(241,243,249,0.3)", letterSpacing: "0.07em", textTransform: "uppercase" }}>
                Players
              </div>
              {results.players.map((p) => (
                <div
                  key={p.id}
                  onClick={() => go(`/app/profile/${p.id}`)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 14px", cursor: "pointer",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    background: "linear-gradient(135deg,#C8FF00,#7C3AED)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800, color: "#07080F", overflow: "hidden",
                  }}>
                    {p.avatarUrl
                      ? <img src={p.avatarUrl} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                      : p.initials}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#F1F3F9" }}>{p.name}</span>
                </div>
              ))}
            </div>
          )}

          {results?.games.length > 0 && (
            <div style={{ borderTop: results?.players.length > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <div style={{ padding: "8px 14px 4px", fontSize: 10, fontWeight: 700, color: "rgba(241,243,249,0.3)", letterSpacing: "0.07em", textTransform: "uppercase" }}>
                Games
              </div>
              {results.games.map((g) => (
                <div
                  key={g.id}
                  onClick={() => go(`/app/discovery/${g.id}`)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 14px", cursor: "pointer",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{
                    width: 28, height: 20, borderRadius: 4, flexShrink: 0,
                    background: g.coverImageUrl ? `url(${g.coverImageUrl}) center/cover no-repeat` : "linear-gradient(135deg,rgba(200,255,0,0.15),rgba(124,58,237,0.15))",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#F1F3F9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.title}</div>
                    {g.studio && <div style={{ fontSize: 11, color: "rgba(241,243,249,0.35)" }}>{g.studio}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TopBar({ user }) {
  const pathname = usePathname();
  const router = useRouter();
  const section = NAV_ITEMS.find(
    (n) => pathname === n.href || pathname.startsWith(n.href + "/")
  );
  const [totalPoints, setTotalPoints] = useState(null);
  const [liveDisplayName, setLiveDisplayName] = useState(null);
  const [liveAvatarUrl, setLiveAvatarUrl] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch("/api/me/gamification")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          setTotalPoints(json.data.totalPoints);
          if (json.data.displayName) setLiveDisplayName(json.data.displayName);
          if (json.data.avatarUrl) setLiveAvatarUrl(json.data.avatarUrl);
        }
      })
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((json) => { if (json.ok) setUnreadCount(json.data.unreadCount); })
      .catch(() => {});
  }, [pathname]);

  return (
    <header className="l9-topbar" style={{
      height: 56,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 28px",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
      background: "rgba(7,8,15,0.85)",
      backdropFilter: "blur(12px)",
      flexShrink: 0,
    }}>
      <style>{`
        @media (max-width: 639px) {
          .l9-topbar { padding: 0 16px !important; }
          .l9-topbar-right { gap: 10px !important; }
          .l9-topbar-name { display: none !important; }
          .l9-topbar-l9 { display: none !important; }
        }
      `}</style>

      {/* Section title */}
      <div style={{
        fontFamily: "'Outfit', sans-serif",
        fontSize: 15,
        fontWeight: 700,
        color: "#F1F3F9",
        letterSpacing: "-0.01em",
      }}>
        {section?.label || ""}
      </div>

      {/* Right: search + points + avatar + name + sign out */}
      <div className="l9-topbar-right" style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {searchOpen
          ? <SearchDropdown onClose={() => setSearchOpen(false)} />
          : (
            <button
              onClick={() => setSearchOpen(true)}
              title="Search"
              style={{
                width: 30, height: 30, borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.09)",
                background: "transparent",
                color: "rgba(241,243,249,0.45)",
                fontSize: 15, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s", flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(200,255,0,0.3)"; e.currentTarget.style.color = "#C8FF00"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.color = "rgba(241,243,249,0.45)"; }}
            >
              ⌕
            </button>
          )
        }
        {/* Notification bell */}
        <button
          onClick={() => { router.push("/app/challenges"); setUnreadCount(0); fetch("/api/notifications", { method: "PATCH" }).catch(() => {}); }}
          title="Challenges & Notifications"
          style={{
            position: "relative",
            width: 30, height: 30, borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.09)",
            background: "transparent",
            color: unreadCount > 0 ? "#C8FF00" : "rgba(241,243,249,0.45)",
            fontSize: 15, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s", flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(200,255,0,0.3)"; e.currentTarget.style.color = "#C8FF00"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.color = unreadCount > 0 ? "#C8FF00" : "rgba(241,243,249,0.45)"; }}
        >
          ⚡
          {unreadCount > 0 && (
            <span style={{
              position: "absolute", top: -3, right: -3,
              width: 14, height: 14, borderRadius: "50%",
              background: "#C8FF00", color: "#07080F",
              fontSize: 8, fontWeight: 900,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Outfit', sans-serif",
            }}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        <div className="l9-topbar-l9" style={{
          padding: "4px 12px",
          borderRadius: 99,
          background: "rgba(200,255,0,0.07)",
          border: "1px solid rgba(200,255,0,0.15)",
          fontFamily: "'Outfit', sans-serif",
          fontSize: 12,
          fontWeight: 700,
          color: "#C8FF00",
          letterSpacing: 0.3,
          whiteSpace: "nowrap",
        }}>
          {totalPoints !== null ? `${totalPoints.toLocaleString()} L9` : "— L9"}
        </div>

        <div
          onClick={() => router.push(`/app/profile/${user?.id}`)}
          style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
        >
          {(liveAvatarUrl || user?.image)
            ? <img
                src={liveAvatarUrl || user.image}
                alt={liveDisplayName || user?.name || ""}
                style={{ width: 30, height: 30, borderRadius: "50%", border: "1.5px solid rgba(200,255,0,0.3)", flexShrink: 0 }}
              />
            : <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "linear-gradient(135deg,#C8FF00,#7C3AED)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 800, color: "#000",
                fontFamily: "'Outfit', sans-serif", flexShrink: 0,
              }}>
                {(liveDisplayName || user?.name)?.[0]?.toUpperCase() || "?"}
              </div>
          }

          <span className="l9-topbar-name" style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 13,
            fontWeight: 600,
            color: "rgba(241,243,249,0.6)",
            whiteSpace: "nowrap",
          }}>
            {liveDisplayName || user?.name || "Gamer"}
          </span>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          style={{
            padding: "5px 12px",
            borderRadius: 7,
            border: "1px solid rgba(255,255,255,0.09)",
            background: "transparent",
            color: "rgba(241,243,249,0.35)",
            fontFamily: "'Outfit', sans-serif",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)";
            e.currentTarget.style.color = "rgba(241,243,249,0.75)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)";
            e.currentTarget.style.color = "rgba(241,243,249,0.35)";
          }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
