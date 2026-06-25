"use client";
import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const FRAGMENTS = [
  { text: "+420 L9",       type: "pts",  x: 8,  y: 15, dur: 18, delay: 0  },
  { text: "128,450",       type: "pts",  x: 88, y: 22, dur: 22, delay: 2  },
  { text: "Diamond II",    type: "rank", x: 5,  y: 55, dur: 20, delay: 4  },
  { text: "Top 7%",        type: "rank", x: 82, y: 48, dur: 24, delay: 1  },
  { text: "[NW9]",         type: "tag",  x: 15, y: 78, dur: 19, delay: 6  },
  { text: "Rank #128",     type: "stat", x: 78, y: 72, dur: 21, delay: 3  },
  { text: "+1,280 L9",     type: "pts",  x: 92, y: 62, dur: 17, delay: 5  },
  { text: "842h",          type: "stat", x: 3,  y: 38, dur: 23, delay: 2  },
  { text: "Rare unlock",   type: "tag",  x: 72, y: 85, dur: 20, delay: 7  },
  { text: "EA FC 25",      type: "game", x: 20, y: 88, dur: 25, delay: 1  },
  { text: "Rocket League", type: "game", x: 60, y: 12, dur: 22, delay: 4  },
  { text: "386 unlocks",   type: "stat", x: 88, y: 35, dur: 18, delay: 6  },
  { text: "Steam",         type: "plat", x: 10, y: 65, dur: 21, delay: 3  },
  { text: "PSN",           type: "plat", x: 50, y: 5,  dur: 19, delay: 5  },
  { text: "14 / 19",       type: "stat", x: 35, y: 82, dur: 20, delay: 2  },
  { text: "Elden Ring",    type: "game", x: 70, y: 92, dur: 24, delay: 0  },
  { text: "+250 L9",       type: "pts",  x: 45, y: 92, dur: 16, delay: 8  },
  { text: "Top 12%",       type: "rank", x: 25, y: 10, dur: 21, delay: 3  },
  { text: "Tribe",         type: "tag",  x: 93, y: 80, dur: 23, delay: 7  },
  { text: "Discovery",     type: "tag",  x: 2,  y: 92, dur: 18, delay: 4  },
  { text: "Specialist",    type: "rank", x: 55, y: 78, dur: 22, delay: 1  },
  { text: "Profile",       type: "tag",  x: 18, y: 30, dur: 20, delay: 9  },
];

const TYPE_STYLES = {
  pts:  { color: "#C8FF00", border: "rgba(200,255,0,0.25)",   bg: "rgba(200,255,0,0.07)"   },
  rank: { color: "#A78BFA", border: "rgba(167,139,250,0.3)",  bg: "rgba(124,58,237,0.08)"  },
  tag:  { color: "#93C5FD", border: "rgba(147,197,253,0.25)", bg: "rgba(59,130,246,0.07)"  },
  stat: { color: "#A0A8BF", border: "rgba(160,168,191,0.2)",  bg: "rgba(255,255,255,0.04)" },
  game: { color: "#CBD5E1", border: "rgba(203,213,225,0.18)", bg: "rgba(255,255,255,0.04)" },
  plat: { color: "#67C1F5", border: "rgba(103,193,245,0.25)", bg: "rgba(103,193,245,0.07)" },
};

function FloatingFragment({ text, type, x, y, dur, delay, energized }) {
  const s = TYPE_STYLES[type] || TYPE_STYLES.stat;
  return (
    <div style={{
      position: "absolute", left: `${x}%`, top: `${y}%`,
      padding: "4px 10px", borderRadius: 99,
      fontSize: 11, fontWeight: 600,
      fontFamily: "'Space Grotesk', monospace",
      letterSpacing: 0.3, whiteSpace: "nowrap",
      color: s.color, background: s.bg, border: `1px solid ${s.border}`,
      opacity: 0,
      animation: `fragFloat ${dur}s ease-in-out ${delay}s infinite`,
      pointerEvents: "none",
      filter: energized ? `drop-shadow(0 0 6px ${s.color}88)` : "none",
      transition: "filter 0.3s",
    }}>{text}</div>
  );
}

const NODES = [
  { x: 22, y: 28 }, { x: 75, y: 20 }, { x: 88, y: 55 },
  { x: 12, y: 70 }, { x: 60, y: 88 }, { x: 40, y: 15 },
];
const CONNECTIONS = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[1,3]];

function ConnectionLines({ energized }) {
  return (
    <svg style={{ position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none" }}
      viewBox="0 0 100 100" preserveAspectRatio="none">
      {CONNECTIONS.map(([a,b],i) => (
        <line key={i}
          x1={NODES[a].x} y1={NODES[a].y} x2={NODES[b].x} y2={NODES[b].y}
          stroke={energized ? "rgba(200,255,0,0.12)" : "rgba(255,255,255,0.04)"}
          strokeWidth="0.15" strokeDasharray="0.8 1.2"
          style={{ animation:`linePulse ${6+i}s ease-in-out ${i*0.7}s infinite`, transition:"stroke 0.4s" }}
        />
      ))}
      {NODES.map((n,i) => (
        <circle key={i} cx={n.x} cy={n.y} r="0.4"
          fill={energized ? "rgba(200,255,0,0.5)" : "rgba(255,255,255,0.15)"}
          style={{ animation:`nodePulse ${4+i*0.5}s ease-in-out ${i*0.4}s infinite`, transition:"fill 0.4s" }}
        />
      ))}
    </svg>
  );
}

function PortalPulse({ active }) {
  if (!active) return null;
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:50, pointerEvents:"none",
      background:"radial-gradient(ellipse at center, rgba(200,255,0,0.15) 0%, transparent 70%)",
      animation:"portalPulse 0.6s ease-out forwards",
    }}/>
  );
}

function ProviderBtn({ icon, label, onClick, disabled, comingSoon }) {
  const [h, setH] = useState(false);
  const inactive = disabled || comingSoon;
  return (
    <button
      onClick={inactive ? undefined : onClick}
      onMouseEnter={() => !inactive && setH(true)}
      onMouseLeave={() => setH(false)}
      disabled={inactive}
      style={{
        display:"flex", alignItems:"center", gap:14,
        width:"100%", padding:"14px 20px",
        background: inactive ? "rgba(255,255,255,0.02)" : h ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
        border:`1px solid ${inactive ? "rgba(255,255,255,0.05)" : h ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.1)"}`,
        borderRadius:12, cursor: inactive ? "not-allowed" : "pointer",
        color: inactive ? "rgba(255,255,255,0.25)" : "#F1F3F9",
        fontFamily:"'Outfit', sans-serif",
        fontSize:15, fontWeight:600, letterSpacing:0.2,
        transition:"all 0.18s",
        transform: h && !inactive ? "translateY(-1px)" : "none",
        boxShadow: h && !inactive ? "0 8px 24px rgba(0,0,0,0.4)" : "none",
      }}>
      <span style={{ fontSize:20, width:28, textAlign:"center", flexShrink:0, opacity: inactive ? 0.3 : 1 }}>{icon}</span>
      <span style={{ flex:1, textAlign:"left" }}>{label}</span>
      {comingSoon && (
        <span style={{ fontSize:10, padding:"2px 8px", borderRadius:99, background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.25)", letterSpacing:"0.05em" }}>
          soon
        </span>
      )}
    </button>
  );
}

export default function LandingPage() {
  const [phase, setPhase] = useState("initial");
  const [energized, setEnergized] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [logoVisible, setLogoVisible] = useState(false);
  const [phraseVisible, setPhraseVisible] = useState(false);
  const [btnVisible, setBtnVisible] = useState(false);
  const [hoverBtn, setHoverBtn] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState(null);

  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.push("/dashboard");
  }, [status, router]);

  useEffect(() => {
    const t1 = setTimeout(() => setLogoVisible(true), 200);
    const t2 = setTimeout(() => setPhraseVisible(true), 700);
    const t3 = setTimeout(() => setBtnVisible(true), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (phase === "initial" && e.key === "Enter") handleEnter();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  function handleEnter() {
    if (phase !== "initial") return;
    setPulse(true);
    setTimeout(() => setPulse(false), 700);
    setPhase("entering");
    setTimeout(() => setPhase("login"), 600);
  }

  async function handleSignIn(provider) {
    setLoadingProvider(provider);
    await signIn(provider, { callbackUrl: "/dashboard" });
  }

  if (status === "loading") {
    return (
      <div style={{ background:"#07080F", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ width:8, height:8, borderRadius:"50%", background:"#C8FF00", animation:"pulse 1s ease infinite" }}/>
        <style>{`@keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.3;}}`}</style>
      </div>
    );
  }

  const isLogin = phase === "login";

  return (
    <div style={{
      position:"fixed", inset:0,
      background:"#07080F",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      fontFamily:"'Outfit', sans-serif",
      overflow:"hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap');

        @keyframes fragFloat {
          0%   { opacity:0; transform:translateY(0px) scale(0.95); }
          10%  { opacity:0.55; }
          45%  { opacity:0.7; transform:translateY(-18px) scale(1); }
          55%  { opacity:0.7; transform:translateY(-22px) scale(1); }
          90%  { opacity:0.45; }
          100% { opacity:0; transform:translateY(-42px) scale(0.95); }
        }
        @keyframes linePulse  { 0%,100%{opacity:0.4;} 50%{opacity:1;} }
        @keyframes nodePulse  { 0%,100%{opacity:0.3;transform:scale(1);} 50%{opacity:0.9;transform:scale(1.6);} }
        @keyframes glowPulse  { 0%,100%{opacity:0.5;transform:scale(1);} 50%{opacity:0.8;transform:scale(1.06);} }
        @keyframes btnPulse   {
          0%,100%{box-shadow:0 0 20px rgba(200,255,0,0.3),0 0 40px rgba(200,255,0,0.1);}
          50%    {box-shadow:0 0 30px rgba(200,255,0,0.5),0 0 60px rgba(200,255,0,0.15);}
        }
        @keyframes portalPulse { 0%{opacity:0;transform:scale(0.8);} 40%{opacity:1;transform:scale(1.1);} 100%{opacity:0;transform:scale(1.6);} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }
        @keyframes slideUp { from{opacity:0;transform:translateY(32px);} to{opacity:1;transform:translateY(0);} }
        @keyframes gridDrift { 0%{transform:translateY(0);} 100%{transform:translateY(40px);} }
        @keyframes spin { to{transform:rotate(360deg);} }
        @media (prefers-reduced-motion:reduce) { *{animation-duration:0.01ms!important;animation-iteration-count:1!important;} }
      `}</style>

      {/* Background: radial glow */}
      <div style={{
        position:"absolute",inset:0,pointerEvents:"none",
        background:`
          radial-gradient(ellipse 70% 60% at 50% 50%, rgba(124,58,237,0.12) 0%, transparent 65%),
          radial-gradient(ellipse 40% 30% at 50% 50%, rgba(200,255,0,0.06) 0%, transparent 60%),
          radial-gradient(ellipse 100% 80% at 50% 100%, rgba(59,130,246,0.07) 0%, transparent 60%)
        `,
        animation:"glowPulse 6s ease-in-out infinite",
      }}/>

      {/* Background: grid */}
      <div style={{
        position:"absolute",inset:0,pointerEvents:"none",
        backgroundImage:`
          linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
        `,
        backgroundSize:"60px 60px",
        animation:"gridDrift 20s linear infinite",
        opacity:0.6,
      }}/>

      {/* Background: scanlines */}
      <div style={{
        position:"absolute",inset:0,pointerEvents:"none",
        backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.15) 2px,rgba(0,0,0,0.15) 4px)",
        opacity:0.4,
      }}/>

      {/* Connection lines */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none"}}>
        <ConnectionLines energized={energized || hoverBtn}/>
      </div>

      {/* Floating fragments */}
      <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>
        {FRAGMENTS.map((f,i) => <FloatingFragment key={i} {...f} energized={energized || hoverBtn}/>)}
      </div>

      {/* Hover glow */}
      {(hoverBtn || isLogin) && (
        <div style={{
          position:"absolute",inset:0,pointerEvents:"none",
          background:"radial-gradient(ellipse 50% 40% at 50% 50%, rgba(200,255,0,0.08) 0%, transparent 70%)",
          transition:"opacity 0.3s",
        }}/>
      )}

      <PortalPulse active={pulse}/>

      {/* Content */}
      <div style={{
        position:"relative",zIndex:10,
        display:"flex",flexDirection:"column",
        alignItems:"center",justifyContent:"center",
        width:"100%",maxWidth:480,
        padding:"0 24px",
        textAlign:"center",
      }}>

        {/* Logo */}
        <div style={{
          marginBottom: isLogin ? 20 : 32,
          opacity: logoVisible ? 1 : 0,
          transform: isLogin ? "scale(0.75) translateY(-8px)" : "scale(1)",
          transition:"opacity 0.8s ease, transform 0.6s ease, margin 0.5s ease",
        }}>
          <img
            src="/logo.png"
            alt="Leet9"
            style={{
              width: isLogin ? 140 : 220,
              maxWidth:"80vw",
              height:"auto",
              objectFit:"contain",
              filter:"invert(1) hue-rotate(180deg) drop-shadow(0 0 20px rgba(124,58,237,0.5))",
              mixBlendMode:"screen",
              transition:"width 0.5s ease",
            }}
          />
        </div>

        {/* Tagline */}
        {!isLogin && (
          <div style={{
            marginBottom:48,
            opacity: phraseVisible ? 1 : 0,
            transform: phraseVisible ? "translateY(0)" : "translateY(12px)",
            transition:"opacity 0.8s ease, transform 0.8s ease",
          }}>
            <h1 style={{
              fontSize:"clamp(22px,5vw,36px)",
              fontWeight:800,
              color:"#F1F3F9",
              letterSpacing:"-0.02em",
              lineHeight:1.15,
              margin:0,
              textShadow:"0 0 40px rgba(200,255,0,0.15), 0 0 80px rgba(124,58,237,0.1)",
            }}>
              You played.<br/>Leet9 remembers.
            </h1>
          </div>
        )}

        {/* ENTER button */}
        {!isLogin && (
          <div style={{
            opacity: btnVisible ? 1 : 0,
            transform: btnVisible ? "translateY(0)" : "translateY(12px)",
            transition:"opacity 0.8s ease, transform 0.8s ease",
          }}>
            <button
              onClick={handleEnter}
              onMouseEnter={() => { setHoverBtn(true); setEnergized(true); }}
              onMouseLeave={() => { setHoverBtn(false); setEnergized(false); }}
              style={{
                padding:"16px 56px",
                fontSize:16, fontWeight:800,
                fontFamily:"'Outfit',sans-serif",
                letterSpacing:"0.2em", textTransform:"uppercase",
                color:"#000",
                background: hoverBtn
                  ? "linear-gradient(135deg,#DEFF33,#C8FF00)"
                  : "linear-gradient(135deg,#C8FF00,#AAEE00)",
                border:"none", borderRadius:14, cursor:"pointer",
                animation:"btnPulse 2.5s ease-in-out infinite",
                transform: hoverBtn ? "translateY(-3px) scale(1.03)" : "translateY(0) scale(1)",
                transition:"transform 0.18s ease, background 0.18s ease",
                boxShadow: hoverBtn
                  ? "0 0 40px rgba(200,255,0,0.55), 0 0 80px rgba(200,255,0,0.2), 0 8px 24px rgba(0,0,0,0.5)"
                  : "0 0 24px rgba(200,255,0,0.35), 0 0 48px rgba(200,255,0,0.1)",
              }}>
              ENTER
            </button>
            {hoverBtn && (
              <div style={{
                marginTop:10, fontSize:11,
                color:"rgba(255,255,255,0.35)",
                letterSpacing:"0.1em",
                animation:"fadeUp 0.2s ease",
              }}>Press Enter ↵</div>
            )}
          </div>
        )}

        {/* Login panel */}
        {isLogin && (
          <div style={{ width:"100%", animation:"slideUp 0.5s ease forwards" }}>
            <div style={{
              marginBottom:20, fontSize:12, fontWeight:700,
              color:"rgba(255,255,255,0.35)",
              letterSpacing:"0.15em", textTransform:"uppercase",
            }}>Choose your entry point</div>

            <div style={{
              display:"flex", flexDirection:"column", gap:10,
              background:"rgba(255,255,255,0.025)",
              border:"1px solid rgba(255,255,255,0.08)",
              borderRadius:18, padding:16,
              backdropFilter:"blur(12px)",
            }}>
              <ProviderBtn
                icon={loadingProvider === "google"
                  ? <span style={{ width:20,height:20,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite" }}/>
                  : "G"}
                label="Continue with Google"
                onClick={() => handleSignIn("google")}
                disabled={!!loadingProvider}
              />
              <ProviderBtn
                icon={loadingProvider === "steam"
                  ? <span style={{ width:20,height:20,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite" }}/>
                  : "S"}
                label="Continue with Steam"
                onClick={() => handleSignIn("steam")}
                disabled={!!loadingProvider}
                comingSoon={true}
              />
            </div>

            <div style={{
              marginTop:14, fontSize:11,
              color:"rgba(255,255,255,0.22)",
              letterSpacing:"0.05em",
            }}>No spam. No noise. Just your gaming identity.</div>

            <button
              onClick={() => { setPhase("initial"); setLoadingProvider(null); }}
              style={{
                marginTop:18, background:"none", border:"none",
                color:"rgba(255,255,255,0.25)", fontSize:12,
                cursor:"pointer", fontFamily:"'Outfit',sans-serif",
              }}
              onMouseEnter={e => e.currentTarget.style.color="rgba(255,255,255,0.5)"}
              onMouseLeave={e => e.currentTarget.style.color="rgba(255,255,255,0.25)"}
            >← Back</button>
          </div>
        )}
      </div>
    </div>
  );
}
