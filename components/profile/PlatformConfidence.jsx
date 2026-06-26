import { SectionLabel } from "@/components/profile/sectionPrimitives";

const CONFIDENCE_COLOR = {
  High: "#C8FF00",
  "Medium-high": "#a3e635",
  Medium: "#fbbf24",
  Partial: "#fb923c",
  Incomplete: "#f87171",
};

const PROVIDER_LABEL = { steam: "Steam", psn: "PSN", google: "Google" };

export function PlatformConfidence({ platformSplit, confidence, confidenceReason }) {
  if (!platformSplit?.length) return null;

  return (
    <div style={{ marginBottom: 28 }}>
      <SectionLabel badge={confidence}>Platform Confidence</SectionLabel>
      <div style={{
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(255,255,255,0.02)",
        padding: 18,
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {platformSplit.map((p) => {
            const connected = p.status === "connected";
            return (
              <div key={p.provider}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#F1F3F9" }}>
                      {PROVIDER_LABEL[p.provider] || p.provider}
                    </span>
                    <span style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: connected ? CONFIDENCE_COLOR[p.confidence] : "rgba(241,243,249,0.3)",
                    }}>
                      {connected ? p.confidence : "Not connected"}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(241,243,249,0.55)" }}>{p.pct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${p.pct}%`,
                    background: connected ? (CONFIDENCE_COLOR[p.confidence] || "#C8FF00") : "rgba(255,255,255,0.15)",
                    borderRadius: 99,
                  }} />
                </div>
                {p.summary && (
                  <div style={{ fontSize: 10, color: "rgba(241,243,249,0.3)", marginTop: 5 }}>{p.summary}</div>
                )}
              </div>
            );
          })}
        </div>

        {confidenceReason && (
          <div style={{
            marginTop: 16,
            paddingTop: 14,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            fontSize: 11,
            color: "rgba(241,243,249,0.4)",
            lineHeight: 1.6,
          }}>
            {confidenceReason}
          </div>
        )}
      </div>
    </div>
  );
}
