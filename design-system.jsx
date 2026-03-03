import { useState } from "react";

const c = {
  bg:"#0D1117",surface:"#111827",surfaceUp:"#162032",surfaceHi:"#1E2D45",
  border:"#1E2D45",borderUp:"#2D4163",
  text:"#E2E8F0",sub:"#94A3B8",muted:"#475569",
  violet:"#7C3AED",violetMid:"#A78BFA",violetGlow:"rgba(124,58,237,0.22)",
  streak:"#EA580C",streakBg:"rgba(234,88,12,0.14)",
  green:"#10B981",greenBg:"rgba(16,185,129,0.1)",
  red:"#EF4444",redBg:"rgba(239,68,68,0.1)",
  amber:"#D97706",
};
const GM = "'Geist Mono', monospace";

const Divider = ({ label }) => (
  <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:28, marginTop:8 }}>
    <span style={{ fontFamily:GM, fontSize:10, color:c.violetMid, letterSpacing:"0.18em", fontWeight:600, whiteSpace:"nowrap" }}>{label}</span>
    <div style={{ flex:1, height:"1px", background:c.border }} />
  </div>
);

const Tag = ({ children, v="default" }) => {
  const m = {
    default:{ bg:c.surfaceHi, color:c.sub, border:c.border },
    violet: { bg:c.violetGlow, color:c.violetMid, border:"rgba(167,139,250,0.3)" },
    green:  { bg:c.greenBg, color:c.green, border:"rgba(16,185,129,0.25)" },
    red:    { bg:c.redBg, color:c.red, border:"rgba(239,68,68,0.25)" },
    streak: { bg:c.streakBg, color:c.streak, border:"rgba(234,88,12,0.3)" },
  };
  const s = m[v];
  return <span style={{ display:"inline-flex", alignItems:"center", padding:"3px 10px", borderRadius:4, background:s.bg, color:s.color, border:`1px solid ${s.border}`, fontFamily:GM, fontSize:11, fontWeight:500, letterSpacing:"0.04em" }}>{children}</span>;
};

export default function DS() {
  const [tab, setTab] = useState("colors");
  const tabs = ["colors","type","components","sample"];

  return (
    <div style={{ minHeight:"100vh", background:c.bg, fontFamily:GM, color:c.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@300;400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        button{cursor:pointer;}
        button:hover{opacity:0.8;}
        @keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .up{animation:up 0.35s ease forwards;}
        input::placeholder{color:#475569;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:#2D4163;border-radius:4px;}
      `}</style>

      {/* Header */}
      <div style={{ borderBottom:`1px solid ${c.border}`, background:`${c.surface}f0`, backdropFilter:"blur(12px)", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ maxWidth:860, margin:"0 auto", padding:"0 28px", height:52, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:28, height:28, borderRadius:7, background:`linear-gradient(135deg,${c.violet},${c.violetMid})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, boxShadow:`0 0 14px ${c.violetGlow}` }}>📚</div>
            <span style={{ fontWeight:800, fontSize:14, letterSpacing:"-0.02em" }}>StudyQuest</span>
            <span style={{ fontSize:10, color:c.muted, marginLeft:4 }}>/ design system</span>
          </div>
          <div style={{ display:"flex", gap:2, background:c.surfaceUp, borderRadius:8, padding:3, border:`1px solid ${c.border}` }}>
            {tabs.map(tb => (
              <button key={tb} onClick={() => setTab(tb)} style={{
                padding:"5px 16px", borderRadius:6, border:"none",
                background:tab===tb ? c.violetGlow : "transparent",
                color:tab===tb ? c.violetMid : c.muted,
                fontFamily:GM, fontSize:11, fontWeight:tab===tb?700:400,
                letterSpacing:"0.05em", boxShadow:tab===tb?`0 0 10px ${c.violetGlow}`:"none",
                transition:"all 0.15s"
              }}>{tb}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:860, margin:"0 auto", padding:"44px 28px" }} className="up">

        {/* ── COLORS ── */}
        {tab==="colors" && (
          <div>
            <div style={{ marginBottom:56 }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:c.violetGlow, border:`1px solid rgba(167,139,250,0.2)`, borderRadius:99, padding:"4px 14px", marginBottom:20 }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:c.violetMid, boxShadow:`0 0 6px ${c.violetMid}` }} />
                <span style={{ fontSize:10, color:c.violetMid, letterSpacing:"0.15em", fontWeight:600 }}>MIDNIGHT BLUE + VIOLET</span>
              </div>
              <div style={{ fontSize:52, fontWeight:900, letterSpacing:"-0.04em", lineHeight:1.05, marginBottom:8 }}>Study at night.</div>
              <div style={{ fontSize:52, fontWeight:300, letterSpacing:"-0.04em", lineHeight:1.05, color:c.muted, marginBottom:24 }}>Ship in the morning.</div>
              <p style={{ fontSize:13, color:c.sub, lineHeight:1.9, maxWidth:480 }}>Deep navy. Violet that glows when earned. Orange streaks cutting through the cool dark. One typeface. Every weight.</p>
            </div>

            <Divider label="BACKGROUNDS" />
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:40 }}>
              {[
                { bg:c.bg, name:"bg", hex:"#0D1117", note:"Page base" },
                { bg:c.surface, name:"surface", hex:"#111827", note:"Cards" },
                { bg:c.surfaceUp, name:"surface-up", hex:"#162032", note:"Elevated" },
                { bg:c.surfaceHi, name:"surface-hi", hex:"#1E2D45", note:"Highest / borders" },
              ].map(s => (
                <div key={s.name}>
                  <div style={{ height:56, background:s.bg, borderRadius:8, border:`1px solid ${c.borderUp}`, marginBottom:8 }} />
                  <div style={{ fontSize:11, fontWeight:600, color:c.text }}>{s.name}</div>
                  <div style={{ fontSize:10, color:c.muted, marginTop:2 }}>{s.hex}</div>
                  <div style={{ fontSize:10, color:c.muted }}>{s.note}</div>
                </div>
              ))}
            </div>

            <Divider label="ACCENT — VIOLET" />
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:40 }}>
              {[
                { bg:c.violet, name:"violet", hex:"#7C3AED", note:"Buttons, active states", glow:true },
                { bg:c.violetMid, name:"violet-mid", hex:"#A78BFA", note:"Labels, XP text, timer", glow:false },
                { bg:c.violetGlow, name:"violet-glow", hex:"rgba(124,58,237,0.22)", note:"Hover bg, tag bg", glow:false },
              ].map(s => (
                <div key={s.name}>
                  <div style={{ height:56, background:s.bg, borderRadius:8, border:`1px solid ${c.borderUp}`, marginBottom:8, boxShadow:s.glow?`0 0 24px ${c.violetGlow}`:"none" }} />
                  <div style={{ fontSize:11, fontWeight:600, color:c.text }}>{s.name}</div>
                  <div style={{ fontSize:10, color:c.muted, marginTop:2 }}>{s.hex}</div>
                  <div style={{ fontSize:10, color:c.muted }}>{s.note}</div>
                </div>
              ))}
            </div>

            <Divider label="FUNCTIONAL COLORS" />
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:40 }}>
              {[
                { bg:c.streak, name:"streak", hex:"#EA580C", note:"🔥 Streak only" },
                { bg:c.green, name:"success", hex:"#10B981", note:"Done, correct" },
                { bg:c.red, name:"danger", hex:"#EF4444", note:"Delete, error" },
                { bg:c.amber, name:"blitz", hex:"#D97706", note:"Blitz timer" },
              ].map(s => (
                <div key={s.name}>
                  <div style={{ height:56, background:s.bg, borderRadius:8, border:`1px solid ${c.borderUp}`, marginBottom:8 }} />
                  <div style={{ fontSize:11, fontWeight:600, color:c.text }}>{s.name}</div>
                  <div style={{ fontSize:10, color:c.muted, marginTop:2 }}>{s.hex}</div>
                  <div style={{ fontSize:10, color:c.muted }}>{s.note}</div>
                </div>
              ))}
            </div>

            <Divider label="TEXT RAMP" />
            <div style={{ background:c.surface, border:`1px solid ${c.border}`, borderRadius:12, padding:"24px 28px", display:"flex", flexDirection:"column", gap:14 }}>
              {[
                { color:c.text, label:"text", hex:"#E2E8F0", use:"Primary content" },
                { color:c.sub, label:"text-sub", hex:"#94A3B8", use:"Secondary info" },
                { color:c.muted, label:"text-muted", hex:"#475569", use:"Hints, timestamps" },
              ].map(t => (
                <div key={t.label} style={{ display:"flex", alignItems:"center", gap:20 }}>
                  <div style={{ width:32, height:32, borderRadius:6, background:t.color }} />
                  <div style={{ flex:1 }}>
                    <span style={{ fontSize:15, fontWeight:600, color:t.color }}>The quick brown fox — {t.label}</span>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:10, color:c.muted }}>{t.hex}</div>
                    <div style={{ fontSize:10, color:c.muted }}>{t.use}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TYPOGRAPHY ── */}
        {tab==="type" && (
          <div>
            <Divider label="GEIST MONO — ONE FONT, ALL WEIGHTS" />
            <div style={{ background:c.surface, border:`1px solid ${c.border}`, borderRadius:14, padding:"44px 48px", display:"flex", flexDirection:"column", gap:44 }}>
              {[
                { role:"HERO · 900 · 56px · −0.04em",    size:56, w:900, track:"-0.04em", color:c.text,     s:"Study smarter." },
                { role:"HEADING · 800 · 30px · −0.03em", size:30, w:800, track:"-0.03em", color:c.text,     s:"Cell Division" },
                { role:"SUBHEAD · 600 · 16px · −0.01em", size:16, w:600, track:"-0.01em", color:c.text,     s:"3 sessions · 47 minutes studied" },
                { role:"BODY · 400 · 13px · 0",          size:13, w:400, track:"0",       color:c.sub,      s:"Focus Mode · completed 2h ago · rated ⭐⭐⭐" },
                { role:"LABEL · 600 · 10px · +0.15em",   size:10, w:600, track:"0.15em",  color:c.muted,    s:"TOTAL TIME STUDIED" },
                { role:"TIMER · 800 · 52px · −0.04em",   size:52, w:800, track:"-0.04em", color:c.violetMid,s:"24:58" },
              ].map(row => (
                <div key={row.role}>
                  <div style={{ fontSize:9, color:c.muted, marginBottom:6, letterSpacing:"0.1em", fontWeight:500 }}>{row.role}</div>
                  <div style={{ fontFamily:GM, fontSize:row.size, fontWeight:row.w, color:row.color, letterSpacing:row.track, lineHeight:1.15 }}>{row.s}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:24, background:c.surface, border:`1px solid ${c.border}`, borderRadius:12, padding:"20px 24px" }}>
              <div style={{ fontSize:10, color:c.violetMid, letterSpacing:"0.12em", fontWeight:600, marginBottom:12 }}>NEXT.JS SETUP</div>
              <div style={{ background:c.bg, borderRadius:8, padding:"14px 18px", fontSize:12, color:c.green, lineHeight:1.8, border:`1px solid ${c.border}` }}>
                <span style={{ color:c.muted }}>// app/layout.tsx</span><br/>
                <span style={{ color:c.violetMid }}>import</span> {"{ Geist_Mono }"} <span style={{ color:c.violetMid }}>from</span> <span style={{ color:c.amber }}>'next/font/google'</span><br/>
                <br/>
                <span style={{ color:c.violetMid }}>const</span> geist = Geist_Mono({"{"}<br/>
                &nbsp;&nbsp;subsets: [<span style={{ color:c.amber }}>'latin'</span>],<br/>
                &nbsp;&nbsp;variable: <span style={{ color:c.amber }}>'--font-geist-mono'</span><br/>
                {"}"})<br/>
              </div>
            </div>
          </div>
        )}

        {/* ── COMPONENTS ── */}
        {tab==="components" && (
          <div style={{ display:"flex", flexDirection:"column", gap:48 }}>

            {/* Buttons */}
            <div>
              <Divider label="BUTTONS" />
              <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center", marginBottom:14 }}>
                {[
                  { label:"▶ Start Session", bg:c.violet, color:"#fff", border:c.violet, shadow:`0 0 16px ${c.violetGlow}` },
                  { label:"Add Topic", bg:c.surfaceUp, color:c.text, border:c.border, shadow:"none" },
                  { label:"Cancel", bg:"transparent", color:c.sub, border:"transparent", shadow:"none" },
                  { label:"Delete", bg:c.redBg, color:c.red, border:"rgba(239,68,68,0.3)", shadow:"none" },
                ].map(b => (
                  <button key={b.label} style={{ padding:"8px 18px", background:b.bg, color:b.color, border:`1px solid ${b.border}`, boxShadow:b.shadow, borderRadius:7, fontFamily:GM, fontSize:12, fontWeight:600, letterSpacing:"0.04em" }}>{b.label}</button>
                ))}
              </div>
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                {["sm","md","lg"].map((sz,i) => (
                  <button key={sz} style={{ padding:["5px 12px","8px 18px","12px 28px"][i], background:c.violet, color:"#fff", border:`1px solid ${c.violet}`, boxShadow:`0 0 14px ${c.violetGlow}`, borderRadius:7, fontFamily:GM, fontSize:[11,12,13][i], fontWeight:600, letterSpacing:"0.04em" }}>
                    {["+ New","▶ Start Session","Claim XP →"][i]}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <Divider label="TAGS & BADGES" />
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                <Tag v="default">3 topics</Tag>
                <Tag v="violet">+25 XP</Tag>
                <Tag v="green">✓ Studied today</Tag>
                <Tag v="red">Streak at risk</Tag>
                <Tag v="streak">🔥 7-day streak</Tag>
              </div>
            </div>

            {/* Inputs */}
            <div>
              <Divider label="INPUTS" />
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
                {[
                  { label:"SUBJECT NAME", ph:"e.g. Organic Chemistry", hint:null },
                  { label:"TOPIC", ph:"e.g. Aldol Condensation", hint:"Press enter to add" },
                ].map(inp => (
                  <div key={inp.label} style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    <label style={{ fontSize:10, color:c.sub, fontWeight:600, letterSpacing:"0.1em" }}>{inp.label}</label>
                    <input readOnly placeholder={inp.ph} style={{ padding:"9px 14px", background:c.surface, border:`1px solid ${c.border}`, borderRadius:7, color:c.text, fontFamily:GM, fontSize:13, outline:"none" }} />
                    {inp.hint && <span style={{ fontSize:10, color:c.muted }}>{inp.hint}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Streak */}
            <div>
              <Divider label="STREAK WIDGET" />
              <div style={{ maxWidth:440 }}>
                <div style={{ background:c.surface, border:`1px solid ${c.border}`, borderRadius:12, padding:"18px 20px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <span style={{ fontSize:24, filter:"drop-shadow(0 0 8px #EA580C)" }}>🔥</span>
                      <div>
                        <div style={{ fontSize:28, fontWeight:800, color:c.streak, letterSpacing:"-1.5px", lineHeight:1 }}>4</div>
                        <div style={{ fontSize:9, color:c.muted, letterSpacing:"0.15em", fontWeight:600, marginTop:2 }}>DAY STREAK</div>
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <Tag v="streak">3 days to milestone</Tag>
                      <div style={{ fontSize:10, color:c.green, marginTop:6 }}>✓ studied today</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    {["M","T","W","T","F","S","S"].map((d,i) => {
                      const done = i < 4;
                      return (
                        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
                          <div style={{ width:"100%", aspectRatio:"1", borderRadius:6, background:done?c.streak:c.surfaceHi, border:`1px solid ${done?c.streak:c.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"#fff", fontWeight:700, boxShadow:done?"0 0 8px rgba(234,88,12,0.4)":"none" }}>{done?"✓":""}</div>
                          <span style={{ fontSize:9, color:c.muted }}>{d}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* XP Bar */}
            <div>
              <Divider label="XP BAR" />
              <div style={{ maxWidth:440 }}>
                <div style={{ background:c.surface, border:`1px solid ${c.border}`, borderRadius:12, padding:"16px 18px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                    <span style={{ fontSize:12, color:c.violetMid, fontWeight:700 }}>LEVEL 3</span>
                    <span style={{ fontSize:11, color:c.muted }}>285 / 300 XP</span>
                  </div>
                  <div style={{ height:5, background:c.surfaceHi, borderRadius:99, overflow:"hidden", border:`1px solid ${c.border}` }}>
                    <div style={{ width:"95%", height:"100%", background:`linear-gradient(90deg,${c.violet},${c.violetMid})`, borderRadius:99, boxShadow:`0 0 10px ${c.violetGlow}` }} />
                  </div>
                  <div style={{ fontSize:10, color:c.muted, marginTop:8 }}>15 XP until Level 4</div>
                </div>
              </div>
            </div>

            {/* Timers */}
            <div>
              <Divider label="TIMER RINGS" />
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, maxWidth:560 }}>
                {[
                  { mode:"BLITZ ⚡", color:c.amber, time:"10:00", pct:0.55 },
                  { mode:"FOCUS 🎯", color:c.violetMid, time:"25:00", pct:0.65 },
                  { mode:"DEEP 🔬",  color:c.green, time:"50:00", pct:0.40 },
                ].map(tm => {
                  const r=44; const circ=2*Math.PI*r;
                  return (
                    <div key={tm.mode} style={{ background:c.surface, border:`1px solid ${c.border}`, borderRadius:14, padding:"22px 18px", display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
                      <span style={{ fontSize:9, color:c.muted, letterSpacing:"0.2em", fontWeight:600 }}>{tm.mode}</span>
                      <div style={{ position:"relative", width:104, height:104 }}>
                        <svg width={104} height={104} style={{ transform:"rotate(-90deg)" }}>
                          <circle cx={52} cy={52} r={r} fill="none" stroke={c.surfaceHi} strokeWidth={3} />
                          <circle cx={52} cy={52} r={r} fill="none" stroke={tm.color} strokeWidth={3} strokeDasharray={circ} strokeDashoffset={circ*(1-tm.pct)} strokeLinecap="round" style={{ filter:`drop-shadow(0 0 6px ${tm.color}99)` }} />
                        </svg>
                        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <span style={{ fontSize:20, fontWeight:800, color:c.text, letterSpacing:"-1px" }}>{tm.time}</span>
                        </div>
                      </div>
                      <span style={{ fontSize:9, color:tm.color, letterSpacing:"0.12em", fontWeight:600, filter:`drop-shadow(0 0 4px ${tm.color}99)` }}>FOCUS TIME</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── SAMPLE UI ── */}
        {tab==="sample" && (
          <div>
            <Divider label="FULL DASHBOARD PREVIEW" />
            <div style={{ background:c.surface, border:`1px solid ${c.border}`, borderRadius:16, overflow:"hidden", boxShadow:"0 24px 80px rgba(0,0,0,0.6)" }}>

              {/* App nav */}
              <div style={{ padding:"13px 22px", borderBottom:`1px solid ${c.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", background:`${c.surface}f0`, backdropFilter:"blur(10px)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:26, height:26, borderRadius:7, background:`linear-gradient(135deg,${c.violet},${c.violetMid})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, boxShadow:`0 0 12px ${c.violetGlow}` }}>📚</div>
                  <span style={{ fontSize:14, fontWeight:800, letterSpacing:"-0.02em" }}>StudyQuest</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, background:c.streakBg, border:`1px solid rgba(234,88,12,0.3)`, borderRadius:99, padding:"4px 12px" }}>
                    <span style={{ filter:"drop-shadow(0 0 4px #EA580C)" }}>🔥</span>
                    <span style={{ fontSize:13, fontWeight:800, color:c.streak }}>4</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:10, color:c.violetMid, fontWeight:700 }}>LVL 3</span>
                    <div style={{ width:88, height:4, background:c.surfaceHi, borderRadius:99 }}>
                      <div style={{ width:"75%", height:"100%", background:`linear-gradient(90deg,${c.violet},${c.violetMid})`, borderRadius:99, boxShadow:`0 0 8px ${c.violetGlow}` }} />
                    </div>
                    <span style={{ fontSize:10, color:c.muted }}>285 XP</span>
                  </div>
                </div>
              </div>

              <div style={{ padding:"20px 22px" }}>

                {/* Stats */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:14 }}>
                  {[
                    { label:"TOTAL TIME", val:"4h 12m", icon:"⏱", color:c.violetMid },
                    { label:"SESSIONS",   val:"11",     icon:"🎯", color:c.green },
                    { label:"TOTAL XP",   val:"285",    icon:"⚡", color:c.amber },
                  ].map(s => (
                    <div key={s.label} style={{ background:c.surfaceUp, border:`1px solid ${c.border}`, borderRadius:10, padding:"14px 16px" }}>
                      <div style={{ fontSize:16, marginBottom:6 }}>{s.icon}</div>
                      <div style={{ fontSize:22, fontWeight:800, color:s.color, letterSpacing:"-0.03em" }}>{s.val}</div>
                      <div style={{ fontSize:9, color:c.muted, letterSpacing:"0.12em", marginTop:4, fontWeight:600 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Streak mini */}
                <div style={{ background:c.surfaceUp, border:`1px solid ${c.border}`, borderRadius:10, padding:"14px 18px", marginBottom:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontSize:18, filter:"drop-shadow(0 0 6px #EA580C)" }}>🔥</span>
                      <span style={{ fontSize:20, fontWeight:800, color:c.streak, letterSpacing:"-1px" }}>4</span>
                      <span style={{ fontSize:9, color:c.muted, letterSpacing:"0.12em", fontWeight:600 }}>DAY STREAK</span>
                    </div>
                    <Tag v="streak">3 to next milestone</Tag>
                  </div>
                  <div style={{ display:"flex", gap:5 }}>
                    {["M","T","W","T","F","S","S"].map((d,i) => {
                      const done=i<4;
                      return (
                        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                          <div style={{ width:"100%", aspectRatio:"1", borderRadius:5, background:done?c.streak:c.surfaceHi, border:`1px solid ${done?c.streak:c.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, color:"#fff", fontWeight:700, boxShadow:done?"0 0 6px rgba(234,88,12,0.35)":"none" }}>{done?"✓":""}</div>
                          <span style={{ fontSize:8, color:c.muted }}>{d}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tab bar */}
                <div style={{ display:"flex", gap:3, background:c.bg, borderRadius:8, padding:3, border:`1px solid ${c.border}`, marginBottom:16 }}>
                  {["📂 SUBJECTS","📊 HISTORY"].map((tb,i) => (
                    <div key={tb} style={{ flex:1, padding:"7px 0", borderRadius:6, background:i===0?c.violetGlow:"transparent", color:i===0?c.violetMid:c.muted, fontSize:11, fontWeight:i===0?700:400, textAlign:"center", letterSpacing:"0.04em", boxShadow:i===0?`0 0 10px ${c.violetGlow}`:"none" }}>{tb}</div>
                  ))}
                </div>

                {/* Subjects */}
                <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:14 }}>
                  {/* Expanded */}
                  <div style={{ background:c.surfaceUp, border:`1px solid ${c.border}`, borderRadius:12, overflow:"hidden", borderLeft:`3px solid ${c.green}` }}>
                    <div style={{ padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:`1px solid ${c.border}` }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:7, height:7, borderRadius:"50%", background:c.green, boxShadow:`0 0 6px ${c.green}` }} />
                        <span style={{ fontSize:14, fontWeight:700, letterSpacing:"-0.01em" }}>Biology</span>
                        <Tag v="default">2 topics</Tag>
                      </div>
                      <span style={{ fontSize:10, color:c.muted }}>2h 30m ▲</span>
                    </div>
                    <div style={{ padding:"10px 12px", display:"flex", flexDirection:"column", gap:8 }}>
                      {[{name:"cell-division",s:2,p:72},{name:"photosynthesis",s:1,p:38}].map(tp => (
                        <div key={tp.name} style={{ background:c.surface, border:`1px solid ${c.border}`, borderRadius:8, padding:"10px 14px" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:7 }}>
                            <span style={{ fontSize:12, fontWeight:500 }}>{tp.name}</span>
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <span style={{ fontSize:10, color:c.muted }}>{tp.s} sessions</span>
                              <button style={{ padding:"3px 9px", borderRadius:5, background:c.violetGlow, border:`1px solid rgba(167,139,250,0.3)`, color:c.violetMid, fontFamily:GM, fontSize:10, fontWeight:700, letterSpacing:"0.06em" }}>▶ START</button>
                            </div>
                          </div>
                          <div style={{ height:2, background:c.surfaceHi, borderRadius:99 }}>
                            <div style={{ width:`${tp.p}%`, height:"100%", background:c.green, borderRadius:99, boxShadow:`0 0 5px ${c.green}88` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Collapsed */}
                  <div style={{ background:c.surfaceUp, border:`1px solid ${c.border}`, borderRadius:12, borderLeft:`3px solid ${c.violetMid}` }}>
                    <div style={{ padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:7, height:7, borderRadius:"50%", background:c.violetMid, boxShadow:`0 0 6px ${c.violetMid}` }} />
                        <span style={{ fontSize:14, fontWeight:700, letterSpacing:"-0.01em" }}>Calculus</span>
                        <Tag v="default">1 topic</Tag>
                      </div>
                      <span style={{ fontSize:10, color:c.muted }}>1h 45m ▼</span>
                    </div>
                  </div>
                </div>

                <button style={{ width:"100%", padding:"10px 0", borderRadius:8, background:"transparent", border:`1px dashed ${c.borderUp}`, color:c.muted, fontFamily:GM, fontSize:12, letterSpacing:"0.06em", fontWeight:500 }}>+ new subject</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}