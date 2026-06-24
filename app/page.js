"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LoginModal from "@/components/LoginModal";

const T = {
  bg:"#06070A",card:"#12151F",border:"rgba(255,255,255,0.08)",borderHi:"rgba(255,255,255,0.14)",
  green:"#C8FF00",text:"#F0F2F8",textSec:"#7A8299",textMut:"#3A3F52",
};

function HexGrid() {
  const canvasRef=useRef(null),rafRef=useRef(null),tick=useRef(0),glowCells=useRef([]);
  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    const ctx=canvas.getContext("2d"),dpr=window.devicePixelRatio||1,SIZE=26,W3=Math.sqrt(3);
    function resize(){canvas.width=canvas.offsetWidth*dpr;canvas.height=canvas.offsetHeight*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}
    resize();const ro=new ResizeObserver(resize);ro.observe(canvas.parentElement);
    const cols=()=>Math.ceil(canvas.width/dpr/(SIZE*W3))+3;
    const rows=()=>Math.ceil(canvas.height/dpr/(SIZE*1.5))+3;
    const hexCenter=(c,r)=>({x:c*SIZE*W3+(r%2===0?0:SIZE*W3*0.5),y:r*SIZE*1.5});
    function drawHex(cx,cy,size,alpha,color){
      ctx.beginPath();
      for(let i=0;i<6;i++){const a=(Math.PI/3)*i-Math.PI/6;i===0?ctx.moveTo(cx+size*Math.cos(a),cy+size*Math.sin(a)):ctx.lineTo(cx+size*Math.cos(a),cy+size*Math.sin(a));}
      ctx.closePath();ctx.strokeStyle=color+Math.round(alpha*255).toString(16).padStart(2,"0");ctx.lineWidth=0.5;ctx.stroke();
    }
    function frame(){
      tick.current++;const t=tick.current,W=canvas.width/dpr,H=canvas.height/dpr;
      ctx.clearRect(0,0,W,H);const C=cols(),R=rows();
      for(let r=-1;r<R;r++)for(let c=-1;c<C;c++){const{x,y}=hexCenter(c,r);drawHex(x,y,SIZE-1,0.022+0.01*Math.sin(t*0.007+c*0.35+r*0.28),"#7799BB");}
      glowCells.current=glowCells.current.filter(cell=>{
        cell.life++;const p=cell.life/cell.maxLife,a=p<0.25?p/0.25:p<0.7?1:1-(p-0.7)/0.3;
        const{x,y}=hexCenter(cell.col,cell.row);drawHex(x,y,SIZE-1,a*0.55,cell.color);
        ctx.beginPath();for(let i=0;i<6;i++){const ang=(Math.PI/3)*i-Math.PI/6;i===0?ctx.moveTo(x+(SIZE-2)*Math.cos(ang),y+(SIZE-2)*Math.sin(ang)):ctx.lineTo(x+(SIZE-2)*Math.cos(ang),y+(SIZE-2)*Math.sin(ang));}
        ctx.closePath();ctx.fillStyle=cell.color+Math.round(a*0.07*255).toString(16).padStart(2,"0");ctx.fill();
        return cell.life<cell.maxLife;
      });
      if(t%16===0){const C2=cols(),R2=rows();glowCells.current.push({col:Math.floor(Math.random()*C2),row:Math.floor(Math.random()*R2),life:0,maxLife:70+Math.random()*90,color:Math.random()>0.55?"#C8FF00":"#6D28D9"});}
      rafRef.current=requestAnimationFrame(frame);
    }
    rafRef.current=requestAnimationFrame(frame);
    return()=>{cancelAnimationFrame(rafRef.current);ro.disconnect();};
  },[]);
  return <canvas ref={canvasRef} style={{position:"absolute",inset:0,width:"100%",height:"100%",display:"block",opacity:0.6,pointerEvents:"none"}}/>;
}

function Float({children,style={},delay=0,dur=6}){return <div style={{position:"absolute",animation:`floatCard ${dur}s ease-in-out ${delay}s infinite`,...style}}>{children}</div>;}
function Bar({pct,color=T.green,h=3}){return <div style={{height:h,background:"rgba(255,255,255,0.07)",borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${color},${color}88)`,borderRadius:99}}/></div>;}

function GamerCard(){return(
  <div style={{width:230,background:"linear-gradient(145deg,#0C0E1C,#111428 50%,#090E18)",border:"1px solid rgba(200,255,0,0.22)",borderRadius:16,padding:"18px 15px",boxShadow:"0 0 40px rgba(200,255,0,0.07), 0 24px 48px rgba(0,0,0,0.8)",fontFamily:"'Inter',sans-serif",position:"relative",overflow:"hidden"}}>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:13}}>
      <div style={{width:38,height:38,borderRadius:"50%",flexShrink:0,background:"linear-gradient(135deg,#C8FF00,#6D28D9)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:"#000",boxShadow:"0 0 0 2px #0C0E1C, 0 0 0 3.5px rgba(200,255,0,0.4)"}}>DF</div>
      <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:800,color:T.text,lineHeight:1}}>DeadFellaz</div><div style={{fontSize:10,color:T.textSec,marginTop:2}}>Diamond II · Lv 138</div></div>
      <div style={{fontSize:8,fontWeight:700,color:T.green,letterSpacing:1.5}}>LEET9</div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,marginBottom:11}}>
      {[["128,450","L9 Pts",T.green],["842h","Hours",T.text],["386","Ach.",T.text]].map(([v,l,c])=>(
        <div key={l} style={{textAlign:"center",padding:"6px 3px",background:"rgba(255,255,255,0.04)",borderRadius:8,border:"1px solid rgba(255,255,255,0.07)"}}>
          <div style={{fontSize:11,fontWeight:800,color:c,fontFamily:"'JetBrains Mono',monospace"}}>{v}</div>
          <div style={{fontSize:8,color:T.textSec,marginTop:1}}>{l}</div>
        </div>
      ))}
    </div>
    <div style={{background:"rgba(192,82,31,0.1)",border:"1px solid rgba(192,82,31,0.2)",borderRadius:8,padding:"7px 9px",marginBottom:9,display:"flex",alignItems:"center",gap:8}}>
      <div style={{width:22,height:22,borderRadius:5,background:"linear-gradient(145deg,#8B3A1A,#3D1A0A)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,flexShrink:0}}>🌄</div>
      <div style={{flex:1,minWidth:0}}><div style={{fontSize:8,color:T.textSec,letterSpacing:1,marginBottom:1}}>SIG. GAME</div><div style={{fontSize:10,fontWeight:700,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>Red Dead Redemption 2</div></div>
      <div style={{fontSize:11,fontWeight:800,color:"#C0521F",fontFamily:"'JetBrains Mono',monospace",flexShrink:0}}>78%</div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
      <div style={{background:"rgba(200,255,0,0.06)",border:"1px solid rgba(200,255,0,0.15)",borderRadius:8,padding:"6px 8px"}}><div style={{fontSize:8,color:T.textSec,letterSpacing:1,marginBottom:2}}>ARCHETYPE</div><div style={{fontSize:10,fontWeight:800,color:T.green}}>The Specialist</div></div>
      <div style={{background:"rgba(109,40,217,0.07)",border:"1px solid rgba(109,40,217,0.2)",borderRadius:8,padding:"6px 8px"}}><div style={{fontSize:8,color:T.textSec,letterSpacing:1,marginBottom:2}}>GLOBAL</div><div style={{fontSize:10,fontWeight:800,color:"#A78BFA"}}>Top 7%</div></div>
    </div>
  </div>
);}

function StatsPanel(){return(
  <div style={{width:188,background:T.card,border:`1px solid ${T.border}`,borderRadius:13,padding:"13px",boxShadow:"0 16px 48px rgba(0,0,0,0.75)",fontFamily:"'Inter',sans-serif"}}>
    <div style={{fontSize:8,fontWeight:700,color:T.textMut,letterSpacing:1.5,marginBottom:9}}>YOUR STATS</div>
    <div style={{fontSize:12,fontWeight:800,color:T.text,marginBottom:11,lineHeight:1.2}}>Red Dead Redemption 2</div>
    {[{l:"L9 Points",v:"23,987",c:T.green},{l:"Hours Played",v:"63h"},{l:"Achievements",v:"42 / 51"},{l:"Mastery",v:"78%",bar:78,bc:"#C0521F"}].map(s=>(
      <div key={s.l} style={{marginBottom:s.bar?6:7}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:s.bar?4:0}}><span style={{fontSize:10,color:T.textSec}}>{s.l}</span><span style={{fontSize:10,fontWeight:700,color:s.c||T.text,fontFamily:"'JetBrains Mono',monospace"}}>{s.v}</span></div>
        {s.bar&&<Bar pct={s.bar} color={s.bc||T.green}/>}
      </div>
    ))}
    <div style={{marginTop:10,padding:"6px 9px",background:"rgba(200,255,0,0.06)",border:"1px solid rgba(200,255,0,0.13)",borderRadius:7}}><div style={{fontSize:8,color:T.textSec}}>Rank among Leet9 players</div><div style={{fontSize:12,fontWeight:800,color:T.green,fontFamily:"'JetBrains Mono',monospace"}}>Top 8%</div></div>
  </div>
);}

function FriendsPanel(){
  const rows=[{n:"Marco",pts:"132,770",t:"↑"},{n:"You",pts:"128,450",t:"↑",me:true},{n:"Luca",pts:"119,200",t:"↓"},{n:"Sofia",pts:"101,880",t:"↑"}];
  return(
    <div style={{width:192,background:T.card,border:`1px solid ${T.border}`,borderRadius:13,padding:"13px",boxShadow:"0 16px 48px rgba(0,0,0,0.75)",fontFamily:"'Inter',sans-serif"}}>
      <div style={{fontSize:8,fontWeight:700,color:T.textMut,letterSpacing:1.5,marginBottom:10}}>YOU VS FRIENDS</div>
      {rows.map(f=>(
        <div key={f.n} style={{display:"flex",alignItems:"center",gap:7,padding:"6px 8px",borderRadius:7,marginBottom:4,background:f.me?"rgba(200,255,0,0.06)":"transparent",border:`1px solid ${f.me?"rgba(200,255,0,0.14)":"transparent"}`}}>
          <div style={{width:20,height:20,borderRadius:5,flexShrink:0,background:f.me?"linear-gradient(135deg,#C8FF00,#6D28D9)":"linear-gradient(135deg,#1E2135,#161828)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:800,color:f.me?"#000":T.textSec}}>{f.n.slice(0,2)}</div>
          <div style={{flex:1,fontSize:10,fontWeight:f.me?700:400,color:f.me?T.green:T.text}}>{f.me?"You":f.n}</div>
          <div style={{fontSize:9,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:f.me?T.green:T.textSec}}>{f.pts}</div>
          <div style={{fontSize:9,color:f.t==="↑"?T.green:"#EF4444"}}>{f.t}</div>
        </div>
      ))}
    </div>
  );
}

function DiscoveryPanel(){
  const games=[{n:"Valorant",g:"FPS",c:"#FF4655",i:"🎯"},{n:"Red Dead 2",g:"Adventure",c:"#C0521F",i:"🌄"},{n:"Rocket League",g:"Sports",c:"#2196F3",i:"🚀"},{n:"Elden Ring",g:"RPG",c:"#C8A020",i:"🗡"},{n:"Fortnite",g:"Battle Royale",c:"#9B59FF",i:"🪂"}];
  return(
    <div style={{width:188,background:T.card,border:`1px solid ${T.border}`,borderRadius:13,padding:"13px",boxShadow:"0 16px 48px rgba(0,0,0,0.75)",fontFamily:"'Inter',sans-serif"}}>
      <div style={{fontSize:8,fontWeight:700,color:T.textMut,letterSpacing:1.5,marginBottom:10}}>POPULAR ON LEET9</div>
      {games.map((g,i)=>(
        <div key={g.n} style={{display:"flex",alignItems:"center",gap:7,marginBottom:7}}>
          <div style={{fontSize:9,color:T.textMut,fontFamily:"'JetBrains Mono',monospace",width:12,flexShrink:0}}>#{i+1}</div>
          <div style={{width:22,height:22,borderRadius:5,flexShrink:0,background:`linear-gradient(135deg,${g.c}44,${g.c}18)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10}}>{g.i}</div>
          <div style={{flex:1,minWidth:0}}><div style={{fontSize:10,fontWeight:600,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.n}</div><div style={{fontSize:8,color:T.textSec}}>{g.g}</div></div>
        </div>
      ))}
    </div>
  );
}

function AchieveBadge(){return(
  <div style={{width:178,background:"linear-gradient(145deg,#18130A,#1F1A07)",border:"1px solid rgba(255,215,0,0.28)",borderRadius:13,padding:"13px 14px",boxShadow:"0 0 28px rgba(255,215,0,0.07), 0 16px 40px rgba(0,0,0,0.75)",fontFamily:"'Inter',sans-serif"}}>
    <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:9}}>
      <div style={{width:32,height:32,borderRadius:9,flexShrink:0,background:"linear-gradient(135deg,rgba(255,215,0,0.2),rgba(184,134,11,0.08))",border:"1px solid rgba(255,215,0,0.22)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🏆</div>
      <div><div style={{fontSize:8,fontWeight:700,color:"rgba(255,215,0,0.5)",letterSpacing:1.5,marginBottom:2}}>LEGENDARY</div><div style={{fontSize:11,fontWeight:800,color:T.text,lineHeight:1.1}}>Legend of the West</div></div>
    </div>
    <div style={{display:"flex",justifyContent:"space-between",paddingTop:8,borderTop:"1px solid rgba(255,215,0,0.1)"}}><div style={{fontSize:9,fontWeight:700,color:"rgba(255,215,0,0.65)"}}>Only 2.4% unlocked</div><div style={{fontSize:10,fontWeight:800,color:T.green,fontFamily:"'JetBrains Mono',monospace"}}>+1,200</div></div>
  </div>
);}

function Micro({children,c=T.green,bg,bd}){return <div style={{display:"inline-flex",alignItems:"center",gap:5,padding:"5px 11px",borderRadius:99,fontSize:11,fontWeight:700,color:c,background:bg||`${c}14`,border:`1px solid ${bd||c+"33"}`,fontFamily:"'Inter',sans-serif",whiteSpace:"nowrap",boxShadow:`0 0 14px ${c}14`}}>{children}</div>;}

function EnterBtn({onClick}){
  const[h,setH]=useState(false),[a,setA]=useState(false);
  return(
    <button onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>{setH(false);setA(false);}} onMouseDown={()=>setA(true)} onMouseUp={()=>setA(false)}
      style={{display:"inline-flex",alignItems:"center",gap:10,padding:"15px 38px",borderRadius:13,border:`1.5px solid ${h?"rgba(200,255,0,0.6)":"rgba(200,255,0,0.3)"}`,background:h?"rgba(200,255,0,0.1)":"rgba(200,255,0,0.05)",color:T.green,fontSize:16,fontWeight:700,fontFamily:"'Rajdhani',sans-serif",letterSpacing:"0.07em",textTransform:"uppercase",cursor:"pointer",transform:a?"scale(0.97)":h?"scale(1.02)":"scale(1)",transition:"all 0.18s ease",animation:"pulseCTA 3s ease-in-out infinite"}}>
      <span style={{width:22,height:22,borderRadius:"50%",flexShrink:0,background:h?T.green:"rgba(200,255,0,0.18)",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.18s"}}>
        <span style={{display:"block",width:0,height:0,borderTop:"4px solid transparent",borderBottom:"4px solid transparent",borderLeft:`7px solid ${h?"#000":T.green}`,marginLeft:2}}/>
      </span>
      Enter Leet9
    </button>
  );
}

export default function Home(){
  const{data:session}=useSession();
  const router=useRouter();
  const[showLogin,setShowLogin]=useState(false);

  useEffect(()=>{if(session)router.push("/dashboard");},[session,router]);
  const openLogin=useCallback(()=>setShowLogin(true),[]);
  useEffect(()=>{const fn=e=>{if(e.key==="Enter")openLogin();};window.addEventListener("keydown",fn);return()=>window.removeEventListener("keydown",fn);},[openLogin]);

  return(
    <div style={{background:T.bg,color:T.text,minHeight:"100vh",fontFamily:"'Inter',sans-serif",overflowX:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:#1E2235;border-radius:99px;}
        @keyframes floatCard{0%,100%{transform:translateY(0px) rotate(0deg);}50%{transform:translateY(-9px) rotate(0.4deg);}}
        @keyframes pulseCTA{0%,100%{box-shadow:0 0 22px rgba(200,255,0,0.07);}50%{box-shadow:0 0 36px rgba(200,255,0,0.14);}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:translateY(0);}}
        @keyframes pulseGreen{0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.5;transform:scale(0.85);}}
        @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important;}}
      `}</style>

      {showLogin&&<LoginModal onClose={()=>setShowLogin(false)}/>}

      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 28px",height:52,background:"rgba(6,7,10,0.75)",backdropFilter:"blur(14px)",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:28,height:28,borderRadius:6,background:T.green,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:"#000",fontFamily:"'Rajdhani',sans-serif"}}>L9</div>
          <span style={{fontSize:15,fontWeight:700,color:T.text,fontFamily:"'Rajdhani',sans-serif",letterSpacing:"0.06em"}}>LEET9</span>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <button onClick={openLogin} style={{fontSize:12,color:T.textSec,background:"none",border:"none",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontWeight:600}}>Log in</button>
          <button onClick={openLogin} style={{fontSize:11,fontWeight:700,color:"#000",background:T.green,border:"none",borderRadius:7,padding:"6px 14px",cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>Early Access</button>
        </div>
      </nav>

      <section style={{position:"relative",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
        <HexGrid/>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 65% 55% at 50% 50%,rgba(109,40,217,0.07),transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 45% 35% at 50% 45%,rgba(200,255,0,0.04),transparent 65%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:1,backgroundImage:"repeating-linear-gradient(0deg,rgba(0,0,0,0.025) 0px,rgba(0,0,0,0.025) 1px,transparent 1px,transparent 4px)"}}/>
        <Float delay={0} dur={6.5} style={{left:"4%",top:"50%",transform:"translateY(-50%)",zIndex:6,opacity:0.93}}><GamerCard/></Float>
        <Float delay={1.3} dur={7} style={{right:"4%",top:"13%",zIndex:6,opacity:0.88}}><StatsPanel/></Float>
        <Float delay={2.1} dur={5.8} style={{right:"4%",bottom:"11%",zIndex:6,opacity:0.88}}><FriendsPanel/></Float>
        <Float delay={0.8} dur={6.2} style={{left:"3%",bottom:"9%",zIndex:5,opacity:0.76}}><DiscoveryPanel/></Float>
        <Float delay={1.6} dur={7.5} style={{left:"6%",top:"9%",zIndex:5,opacity:0.82}}><AchieveBadge/></Float>
        <Float delay={0.4} dur={5.5} style={{right:"22%",top:"10%",zIndex:5}}><Micro c={T.green}>⚡ Top 7%</Micro></Float>
        <Float delay={2.6} dur={6.8} style={{right:"17%",bottom:"20%",zIndex:5}}><Micro c="#A78BFA" bg="rgba(109,40,217,0.1)" bd="rgba(109,40,217,0.28)">L9 Rank Up ↑</Micro></Float>
        <Float delay={1.1} dur={6} style={{left:"25%",top:"7%",zIndex:5}}><Micro c={T.green}>+8,420 this month</Micro></Float>
        <Float delay={3.1} dur={6.4} style={{left:"21%",bottom:"12%",zIndex:5}}><Micro c="#60A5FA" bg="rgba(59,130,246,0.09)" bd="rgba(59,130,246,0.24)">Diamond II</Micro></Float>
        <div style={{position:"relative",zIndex:10,textAlign:"center",padding:"80px 20px 40px",maxWidth:580,animation:"fadeUp 0.85s ease both"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:7,marginBottom:22,padding:"5px 14px",borderRadius:99,background:"rgba(200,255,0,0.06)",border:"1px solid rgba(200,255,0,0.17)"}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:T.green,display:"inline-block",animation:"pulseGreen 2s ease infinite"}}/>
            <span style={{fontSize:10,fontWeight:700,color:T.green,letterSpacing:1.5,fontFamily:"'Inter',sans-serif"}}>GAMING IDENTITY PLATFORM</span>
          </div>
          <h1 style={{fontSize:"clamp(34px,5.5vw,66px)",fontWeight:700,color:"#fff",lineHeight:1.06,letterSpacing:"-0.01em",marginBottom:18,fontFamily:"'Rajdhani',sans-serif"}}>
            Your gaming identity,<br/><span style={{color:T.green,textShadow:`0 0 50px ${T.green}44`}}>finally visible.</span>
          </h1>
          <p style={{fontSize:"clamp(13px,1.5vw,16px)",color:T.textSec,lineHeight:1.7,margin:"0 auto 32px",maxWidth:420,fontFamily:"'Inter',sans-serif"}}>Discover games, earn L9 Points, compare with friends, and build the profile that proves how you play.</p>
          <div style={{marginBottom:12}}><EnterBtn onClick={openLogin}/></div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:14,fontSize:11,color:T.textMut,fontFamily:"'Inter',sans-serif",flexWrap:"wrap"}}>
            <span>No account needed to explore.</span><span>·</span>
            <kbd style={{fontSize:10,padding:"2px 7px",borderRadius:5,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",color:T.textSec,fontFamily:"'JetBrains Mono',monospace"}}>↵ Enter</kbd>
          </div>
        </div>
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:140,background:`linear-gradient(to bottom,transparent,${T.bg})`,pointerEvents:"none",zIndex:8}}/>
      </section>

      <section style={{padding:"72px 28px 96px",maxWidth:900,margin:"0 auto"}}>
        <h2 style={{fontSize:"clamp(20px,3vw,32px)",fontWeight:700,color:T.text,fontFamily:"'Rajdhani',sans-serif",letterSpacing:"-0.01em",textAlign:"center",marginBottom:44}}>One profile. Built from the games you play.</h2>
        <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
          {[{i:"🔍",t:"Discover",c:"#3B82F6",d:"Find games, trailers, live activity, and the communities around them."},{i:"⚡",t:"Earn",c:T.green,d:"Turn hours, achievements, and mastery into L9 Points."},{i:"↗",t:"Share",c:"#A78BFA",d:"Build a Gamer Card that shows your rank, gamer type, and rarest flexes."}].map(p=>(
            <div key={p.t} style={{flex:1,minWidth:220,background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:"22px 20px"}}>
              <div style={{width:38,height:38,borderRadius:10,background:`${p.c}12`,border:`1px solid ${p.c}2E`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,marginBottom:13}}>{p.i}</div>
              <div style={{fontSize:16,fontWeight:700,color:T.text,fontFamily:"'Rajdhani',sans-serif",letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:8}}>{p.t}</div>
              <div style={{fontSize:13,color:T.textSec,lineHeight:1.65,fontFamily:"'Inter',sans-serif"}}>{p.d}</div>
            </div>
          ))}
        </div>
        <div style={{textAlign:"center",marginTop:52}}><EnterBtn onClick={openLogin}/></div>
      </section>

      <footer style={{borderTop:"1px solid rgba(255,255,255,0.05)",padding:"20px 28px",maxWidth:900,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <div style={{width:20,height:20,borderRadius:4,background:T.green,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:900,color:"#000",fontFamily:"'Rajdhani',sans-serif"}}>L9</div>
          <span style={{fontSize:11,color:T.textMut,fontFamily:"'Inter',sans-serif"}}>© 2026 Leet9. Your gaming identity, finally visible.</span>
        </div>
        <span style={{fontSize:11,color:T.textMut,fontFamily:"'Inter',sans-serif"}}>leet9.gg</span>
      </footer>
    </div>
  );
}
