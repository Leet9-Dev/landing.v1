"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const T = {
  bg:"#06070A", card:"#12151F", border:"rgba(255,255,255,0.08)",
  green:"#C8FF00", text:"#F0F2F8", textSec:"#7A8299",
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div style={{ background:T.bg, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ width:8, height:8, borderRadius:"50%", background:T.green, animation:"pulse 1s ease infinite" }}/>
      </div>
    );
  }

  if (!session) return null;

  const provider = session.provider || "unknown";
  const providerLabel = { google:"Google", steam:"Steam" }[provider] || provider;

  return (
    <div style={{ background:T.bg, color:T.text, minHeight:"100vh", fontFamily:"'Inter',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:24 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@700&family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.3;}}
      `}</style>

      {/* Card */}
      <div style={{ width:360, background:T.card, border:`1px solid rgba(200,255,0,0.2)`, borderRadius:20, padding:"32px 28px", boxShadow:"0 0 60px rgba(200,255,0,0.05), 0 32px 80px rgba(0,0,0,0.8)", textAlign:"center" }}>
        {/* Avatar */}
        {session.user?.image
          ? <img src={session.user.image} alt="" style={{ width:64, height:64, borderRadius:"50%", border:`2px solid ${T.green}`, marginBottom:16 }}/>
          : <div style={{ width:64, height:64, borderRadius:"50%", background:"linear-gradient(135deg,#C8FF00,#6D28D9)", display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:24, fontWeight:900, color:"#000", fontFamily:"'Rajdhani',sans-serif", marginBottom:16 }}>
              {session.user?.name?.[0]?.toUpperCase() || "?"}
            </div>
        }

        <div style={{ fontSize:10, fontWeight:700, color:T.green, letterSpacing:1.5, marginBottom:8, fontFamily:"'Inter',sans-serif" }}>
          CONNECTED VIA {providerLabel.toUpperCase()}
        </div>
        <div style={{ fontSize:22, fontWeight:800, color:T.text, fontFamily:"'Rajdhani',sans-serif", marginBottom:4 }}>
          {session.user?.name || "Gamer"}
        </div>
        {session.user?.email && (
          <div style={{ fontSize:13, color:T.textSec, marginBottom:20 }}>{session.user.email}</div>
        )}

        <div style={{ background:"rgba(200,255,0,0.05)", border:"1px solid rgba(200,255,0,0.12)", borderRadius:10, padding:"12px 16px", marginBottom:20 }}>
          <div style={{ fontSize:11, color:T.textSec, marginBottom:4 }}>Your L9 Points</div>
          <div style={{ fontSize:28, fontWeight:800, color:T.green, fontFamily:"'JetBrains Mono',monospace" }}>0</div>
          <div style={{ fontSize:10, color:T.textSec, marginTop:2 }}>Start playing to earn points</div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          style={{ width:"100%", padding:"11px", borderRadius:9, background:"transparent", border:`1px solid ${T.border}`, color:T.textSec, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif", transition:"all 0.15s" }}
          onMouseEnter={e=>{ e.currentTarget.style.borderColor="rgba(255,255,255,0.2)"; e.currentTarget.style.color=T.text; }}
          onMouseLeave={e=>{ e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.textSec; }}
        >
          Sign out
        </button>
      </div>

      <div style={{ fontSize:11, color:T.textSec }}>
        Dashboard in costruzione — presto qui troverai il tuo profilo completo.
      </div>
    </div>
  );
}
