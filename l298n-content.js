/* ============================================================
   L298N Motor Driver — teaching diagrams + interactive sims
   ------------------------------------------------------------
   Loaded after l1-content.js and before app.js. It:
     • adds L298N diagrams into the shared L1_DIAGRAMS registry so
       lesson note/step blocks of {type:"diagram", key:"..."} render them
     • defines a global SIMS registry of interactive widgets that the
       GuidedLesson "sim" step kind mounts into #gl-sim-root
   Everything is dependency-free and colour-matched to the app theme.
   ============================================================ */

/* ---------- shared little helpers ---------- */
function _esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;"); }

// A reusable spinning-motor visual. status: forward|backward|stop|brake|off
function motorViz(status, speed){
  speed = Math.max(0, Math.min(255, speed==null?255:speed));
  const spinning = (status==="forward"||status==="backward");
  const dur = spinning ? (0.25 + (255-speed)/255*1.6).toFixed(2) : 0;   // faster = smaller duration
  const cls = status==="forward" ? "motor-cw" : status==="backward" ? "motor-ccw" : "";
  const shake = status==="brake" ? "motor-brake" : "";
  const label = {forward:"➡️ Spinning FORWARD", backward:"⬅️ Spinning BACKWARD", stop:"⏸️ Stopped (coast)", brake:"🛑 BRAKING (hard stop)", off:"⚫ OFF (no power)"}[status] || "";
  const glow = {forward:"#00C853", backward:"#3AA0FF", brake:"#ff5252", stop:"#9e9e9e", off:"#555"}[status] || "#9e9e9e";
  return `
    <div class="motorviz">
      <svg viewBox="0 0 160 160" width="150" height="150" aria-label="motor">
        <circle cx="80" cy="80" r="60" fill="#1c2126" stroke="${glow}" stroke-width="4"/>
        <g class="${cls} ${shake}" style="${dur?`animation-duration:${dur}s;`:''}transform-origin:80px 80px;">
          <circle cx="80" cy="80" r="46" fill="#242a31"/>
          <rect x="76" y="24" width="8" height="56" rx="4" fill="${glow}"/>
          <rect x="76" y="80" width="8" height="30" rx="4" fill="#6f7a82"/>
          <circle cx="80" cy="80" r="9" fill="${glow}"/>
        </g>
        <circle cx="80" cy="80" r="60" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="1"/>
      </svg>
      <div class="motorviz-label" style="color:${glow}">${label}</div>
      ${spinning?`<div class="motorviz-speed">Speed: ${Math.round(speed/255*100)}%</div>`:""}
    </div>`;
}

// Work out motor behaviour from the L298N logic (the truth table).
function motorLogic(in1, in2, en){
  if(!en) return "off";
  if(in1 && in2) return "brake";
  if(in1 && !in2) return "forward";
  if(!in1 && in2) return "backward";
  return "stop";
}

/* ---------- accurate top-down L298N board (shared by 2 diagram keys) ----------
   viewBox 0 0 400 260. Coordinates here MUST match L298N_PARTS cx/cy below so
   the Label-the-Board flags land exactly on each part. */
function l298nBoardSVG(labels){
  // tiny label helper — emits text only when `labels` is true (blank for the game)
  const T = (x,y,t,size,fill,anchor) =>
    labels ? `<text x="${x}" y="${y}" font-size="${size||8}" fill="${fill||'#e8eef4'}" text-anchor="${anchor||'middle'}" font-weight="600">${t}</text>` : "";
  return `
    <svg viewBox="0 0 400 260" role="img" aria-label="L298N motor driver module, top view">
      <!-- PCB -->
      <rect x="18" y="44" width="364" height="198" rx="12" fill="#15559e"/>
      <rect x="18" y="44" width="364" height="198" rx="12" fill="none" stroke="#0d3c78" stroke-width="3"/>
      <circle cx="36" cy="60" r="5" fill="#0d3c78"/><circle cx="364" cy="60" r="5" fill="#0d3c78"/>
      <circle cx="36" cy="226" r="5" fill="#0d3c78"/><circle cx="364" cy="226" r="5" fill="#0d3c78"/>

      <!-- top edge: 3 screw terminals -->
      <!-- Motor A (OUT1/OUT2) left -->
      <rect x="40" y="20" width="66" height="34" rx="4" fill="#0a2e5c"/>
      <circle cx="58" cy="37" r="8" fill="#c9d6e5"/><circle cx="58" cy="37" r="3.4" fill="#0a2e5c"/>
      <circle cx="88" cy="37" r="8" fill="#c9d6e5"/><circle cx="88" cy="37" r="3.4" fill="#0a2e5c"/>
      ${T(73,14,"OUT1  OUT2 · Motor A",7.5,"#8fd6ff")}
      <!-- Power (12V/GND/5V) center -->
      <rect x="150" y="20" width="100" height="34" rx="4" fill="#0a2e5c"/>
      ${[170,200,230].map(cx=>`<circle cx="${cx}" cy="37" r="8" fill="#c9d6e5"/><circle cx="${cx}" cy="37" r="3.4" fill="#0a2e5c"/>`).join("")}
      ${T(170,14,"12V",7,"#ffd54f")}${T(200,14,"GND",7,"#ffd54f")}${T(230,14,"5V",7,"#ffd54f")}
      <!-- Motor B (OUT3/OUT4) right -->
      <rect x="294" y="20" width="66" height="34" rx="4" fill="#0a2e5c"/>
      <circle cx="312" cy="37" r="8" fill="#c9d6e5"/><circle cx="312" cy="37" r="3.4" fill="#0a2e5c"/>
      <circle cx="342" cy="37" r="8" fill="#c9d6e5"/><circle cx="342" cy="37" r="3.4" fill="#0a2e5c"/>
      ${T(327,14,"OUT3  OUT4 · Motor B",7.5,"#8fd6ff")}

      <!-- 5V enable jumper -->
      <rect x="252" y="64" width="22" height="12" rx="3" fill="#ffca28"/>
      ${T(305,74,"5V jumper",8,"#ffe082","start")}

      <!-- electrolytic cap (realism) -->
      <circle cx="118" cy="120" r="16" fill="#1b1f24" stroke="#3a424a" stroke-width="2"/>
      <circle cx="118" cy="120" r="6" fill="#2a3038"/>

      <!-- heatsink over the IC -->
      <rect x="150" y="90" width="100" height="80" rx="4" fill="#1b1f24"/>
      ${[0,1,2,3,4,5].map(i=>`<rect x="${158+i*15}" y="94" width="8" height="72" rx="2" fill="#3a424a"/>`).join("")}
      <rect x="160" y="170" width="80" height="18" rx="2" fill="#0c0f12"/>
      ${T(290,118,"Heatsink",8,"#c9d6e5","start")}
      ${T(200,183,"L298N chip",7.5,"#00E676")}

      <!-- bottom header: ENA IN1 IN2 IN3 IN4 ENB -->
      <rect x="96" y="208" width="208" height="18" rx="3" fill="#0c0f12"/>
      ${["ENA","IN1","IN2","IN3","IN4","ENB"].map((p,i)=>{const x=112+i*35;return `<rect x="${x-5}" y="211" width="10" height="12" rx="1.5" fill="#caa64a"/>${T(x,240,p,7,"#e8eef4")}`;}).join("")}
      <rect x="105" y="209" width="14" height="8" rx="2" fill="#ffca28"/>
      <rect x="281" y="209" width="14" height="8" rx="2" fill="#ffca28"/>
      ${T(200,256,"IN1–IN4 = direction   ·   ENA / ENB = speed",8,"#a9b3ba")}
    </svg>`;
}

/* ---------- DIAGRAMS (merged into L1_DIAGRAMS) ---------- */
(function(){
  if(typeof L1_DIAGRAMS === "undefined") return;
  Object.assign(L1_DIAGRAMS, {

  // The bodyguard analogy: Arduino (brain) → L298N (muscle) → motors
  "l298n-bodyguard": () => `
    <svg viewBox="0 0 360 170" role="img" aria-label="Arduino gives orders, L298N supplies the muscle">
      <rect x="12" y="55" width="80" height="60" rx="10" fill="#00979D"/>
      <text x="52" y="80" font-size="11" fill="#fff" text-anchor="middle" font-weight="700">ARDUINO</text>
      <text x="52" y="96" font-size="9" fill="#e0f2f1" text-anchor="middle">brain 🧠</text>
      <text x="52" y="140" font-size="8.5" fill="#a9b3ba" text-anchor="middle">tiny signals (~20mA)</text>
      <rect x="140" y="50" width="86" height="70" rx="10" fill="#7b2ff7"/>
      <text x="183" y="78" font-size="11" fill="#fff" text-anchor="middle" font-weight="700">L298N</text>
      <text x="183" y="94" font-size="9" fill="#eee" text-anchor="middle">muscle 💪</text>
      <text x="183" y="140" font-size="8.5" fill="#a9b3ba" text-anchor="middle">big power (Amps)</text>
      <g>
        <circle cx="305" cy="60" r="20" fill="#FF9800"/><text x="305" y="64" font-size="12" text-anchor="middle">⚙️</text>
        <circle cx="305" cy="110" r="20" fill="#FF9800"/><text x="305" y="114" font-size="12" text-anchor="middle">⚙️</text>
        <text x="305" y="145" font-size="8.5" fill="#a9b3ba" text-anchor="middle">motors</text>
      </g>
      <path d="M94 85 H138" stroke="#FFC53D" stroke-width="3" marker-end="url(#l2a)"/>
      <path d="M228 72 H283" stroke="#00E676" stroke-width="4" marker-end="url(#l2a)"/>
      <path d="M228 100 H283" stroke="#00E676" stroke-width="4" marker-end="url(#l2a)"/>
      <text x="116" y="78" font-size="8" fill="#FFC53D" text-anchor="middle">orders</text>
      <defs><marker id="l2a" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="#FFC53D"/></marker></defs>
    </svg>`,

  // Top-down board — accurate layout. Labelled + blank (for the game) share
  // one renderer so the flag hotspots always line up with the real parts.
  "l298n-board":       () => l298nBoardSVG(true),
  "l298n-board-blank": () => l298nBoardSVG(false),

  // The H-bridge: 4 switches in an H around the motor
  "h-bridge": () => `
    <svg viewBox="0 0 300 220" role="img" aria-label="H-Bridge of four switches around a motor">
      <text x="150" y="18" font-size="11" fill="#a9b3ba" text-anchor="middle" font-weight="700">The H-Bridge — 4 switches, 1 motor</text>
      <line x1="60" y1="40" x2="60" y2="180" stroke="#3a424a" stroke-width="3"/>
      <line x1="240" y1="40" x2="240" y2="180" stroke="#3a424a" stroke-width="3"/>
      <line x1="60" y1="40" x2="240" y2="40" stroke="#FFC53D" stroke-width="3"/>
      <line x1="60" y1="180" x2="240" y2="180" stroke="#607d8b" stroke-width="3"/>
      <text x="150" y="34" font-size="9" fill="#FFC53D" text-anchor="middle">+ power</text>
      <text x="150" y="196" font-size="9" fill="#607d8b" text-anchor="middle">– ground</text>
      ${[[60,70,"S1"],[240,70,"S2"],[60,150,"S3"],[240,150,"S4"]].map(([x,y,n])=>`
        <circle cx="${x}" cy="${y}" r="12" fill="#242a31" stroke="#00BCD4" stroke-width="2"/>
        <text x="${x}" y="${y+3}" font-size="8" fill="#00E5FF" text-anchor="middle">${n}</text>`).join("")}
      <circle cx="150" cy="110" r="26" fill="#1c2126" stroke="#FF9800" stroke-width="3"/>
      <text x="150" y="114" font-size="14" text-anchor="middle">⚙️</text>
      <line x1="60" y1="110" x2="124" y2="110" stroke="#78909c" stroke-width="2"/>
      <line x1="176" y1="110" x2="240" y2="110" stroke="#78909c" stroke-width="2"/>
      <text x="150" y="212" font-size="8.5" fill="#a9b3ba" text-anchor="middle">Close S1+S4 → one way · Close S2+S3 → the other way</text>
    </svg>`,

  // PWM speed bars
  "pwm-speed": () => `
    <svg viewBox="0 0 320 140" role="img" aria-label="PWM controls motor speed">
      <text x="160" y="16" font-size="10" fill="#a9b3ba" text-anchor="middle" font-weight="700">ENA / ENB = speed (PWM 0–255)</text>
      ${[["0","OFF",30,"#555"],["128","half",120,"#FF9800"],["255","full",250,"#00C853"]].map(([v,l,,c],i)=>`
        <rect x="${30+i*95}" y="${110-(i*0+ (i===0?6: i===1?42:80))}" width="60" height="${i===0?6:i===1?42:80}" rx="4" fill="${c}"/>
        <text x="${60+i*95}" y="126" font-size="9" fill="#e0f2f1" text-anchor="middle">${v} · ${l}</text>`).join("")}
    </svg>`,

  // Full wiring map
  "wiring-map": () => `
    <svg viewBox="0 0 400 260" role="img" aria-label="Wiring Arduino to L298N to motors and battery">
      <rect x="20" y="90" width="90" height="80" rx="8" fill="#00979D"/>
      <text x="65" y="126" font-size="10" fill="#fff" text-anchor="middle" font-weight="700">ARDUINO</text>
      <rect x="160" y="80" width="90" height="100" rx="8" fill="#1666c9"/>
      <text x="205" y="126" font-size="10" fill="#fff" text-anchor="middle" font-weight="700">L298N</text>
      <rect x="300" y="40" width="70" height="40" rx="8" fill="#FF9800"/>
      <text x="335" y="64" font-size="16" text-anchor="middle">⚙️</text>
      <rect x="300" y="150" width="70" height="40" rx="8" fill="#FF9800"/>
      <text x="335" y="174" font-size="16" text-anchor="middle">⚙️</text>
      <rect x="150" y="210" width="110" height="34" rx="6" fill="#c62828"/>
      <text x="205" y="232" font-size="10" fill="#fff" text-anchor="middle" font-weight="700">🔋 Battery 7–12V</text>
      <path d="M110 110 H160" stroke="#FFC53D" stroke-width="2.5" marker-end="url(#wm)"/>
      <text x="135" y="104" font-size="7.5" fill="#FFC53D" text-anchor="middle">IN/EN</text>
      <path d="M250 100 H300 V80" stroke="#00E676" stroke-width="2.5" marker-end="url(#wm)"/>
      <path d="M250 150 H300 V170" stroke="#00E676" stroke-width="2.5" marker-end="url(#wm)"/>
      <path d="M205 210 V180" stroke="#ff8a80" stroke-width="2.5"/>
      <path d="M180 210 Q120 200 65 170" stroke="#78909c" stroke-width="2.5" fill="none"/>
      <text x="120" y="200" font-size="7.5" fill="#78909c">shared GND!</text>
      <defs><marker id="wm" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="#00E676"/></marker></defs>
    </svg>`
  });
})();

/* ---------- L298N board parts (for the Label game) ---------- */
// cx/cy are in the board diagram's 400×300 viewBox coordinate space.
// cx/cy are in the board's 400×260 viewBox — must match l298nBoardSVG() above.
const L298N_PARTS = [
  {key:"power",    name:"12V / GND / 5V power terminal", cx:200, cy:37},
  {key:"outA",     name:"OUT1 / OUT2 — Motor A",         cx:73,  cy:37},
  {key:"outB",     name:"OUT3 / OUT4 — Motor B",         cx:327, cy:37},
  {key:"jumper",   name:"5V enable jumper",              cx:263, cy:70},
  {key:"heatsink", name:"Heatsink (cools the chip)",     cx:200, cy:120},
  {key:"ic",       name:"L298N chip (IC)",               cx:200, cy:179},
  {key:"in",       name:"IN1–IN4 — direction pins",      cx:200, cy:217},
  {key:"ena",      name:"ENA / ENB — speed pins",        cx:112, cy:217}
];

/* ============================================================
   SIMS — interactive widgets mounted by GuidedLesson
   Each sim: start(rootId, step) renders + wires itself.
   Call GuidedLesson.allowNext() to unlock the Next button.
   ============================================================ */
const SIMS = {

  /* ---- Traffic Cop Simulator: toggle IN1/IN2 + speed, watch the motor ---- */
  trafficCop: {
    in1:0, in2:0, en:200,
    start(rootId){
      this.in1=1; this.in2=0; this.en=200;
      this.root = document.getElementById(rootId);
      this.render();
      if(window.GuidedLesson) GuidedLesson.allowNext();  // free explore
    },
    render(){
      if(!this.root) return;
      const status = motorLogic(this.in1, this.in2, this.en);
      this.root.innerHTML = `
        <div class="sim-trafficcop">
          ${motorViz(status, this.en)}
          <div class="sim-controls">
            <div class="sim-toggle-row">
              <span class="sim-pin">IN1</span>
              <button class="sim-switch ${this.in1?'on':''}" onclick="SIMS.trafficCop.flip('in1')">${this.in1?'HIGH':'LOW'}</button>
            </div>
            <div class="sim-toggle-row">
              <span class="sim-pin">IN2</span>
              <button class="sim-switch ${this.in2?'on':''}" onclick="SIMS.trafficCop.flip('in2')">${this.in2?'HIGH':'LOW'}</button>
            </div>
            <div class="sim-slider-row">
              <span class="sim-pin">ENA</span>
              <input type="range" min="0" max="255" value="${this.en}" oninput="SIMS.trafficCop.setEn(this.value)">
              <span class="sim-en-val">${this.en}</span>
            </div>
            <div class="sim-hint">Try every combination — what makes it brake? 🤔</div>
          </div>
        </div>`;
    },
    flip(p){ this[p] = this[p]?0:1; if(window.Sound) Sound.click&&Sound.click(); this.render(); },
    setEn(v){ this.en = parseInt(v,10)||0; this.render(); }
  },

  /* ---- Label the Board: highlight a part, pick its name ---- */
  labelBoard: {
    start(rootId){
      this.root = document.getElementById(rootId);
      this.order = [...L298N_PARTS].sort(()=>Math.random()-0.5);
      this.i = 0; this.score = 0; this.lives = 3; this.done=false;
      this.render();
    },
    render(){
      if(!this.root) return;
      if(this.done){ this.renderDone(); return; }
      const part = this.order[this.i];
      // 4 choices incl. the correct one
      const others = L298N_PARTS.filter(p=>p.key!==part.key).sort(()=>Math.random()-0.5).slice(0,3);
      const choices = [part, ...others].sort(()=>Math.random()-0.5);
      const fx = (part.cx/400*100).toFixed(1), fy = (part.cy/260*100).toFixed(1);
      this.root.innerHTML = `
        <div class="sim-label">
          <div class="sim-label-top">
            <span class="sim-pill">🔧 Part ${this.i+1} of ${this.order.length}</span>
            <span class="sim-pill">❤️ ${this.lives}</span>
            <span class="sim-pill">⭐ ${this.score}</span>
          </div>
          <div class="sim-board-wrap">
            ${renderL1Diagram("l298n-board-blank")}
            <div class="sim-flag" style="left:${fx}%;top:${fy}%;">?</div>
          </div>
          <p class="sim-q">What is the highlighted part?</p>
          <div class="sim-choices">
            ${choices.map(c=>`<button class="sim-choice" onclick="SIMS.labelBoard.pick('${c.key}')">${_esc(c.name)}</button>`).join("")}
          </div>
          <div class="sim-fb" id="sim-label-fb"></div>
        </div>`;
    },
    pick(key){
      const part = this.order[this.i];
      const fb = document.getElementById("sim-label-fb");
      const btns = this.root.querySelectorAll(".sim-choice");
      btns.forEach(b=>b.disabled=true);
      if(key===part.key){
        this.score++;
        if(window.Sound) Sound.correct&&Sound.correct();
        if(fb) fb.innerHTML = `<div class="gl-fb ok">✅ Yes! That's the <b>${_esc(part.name)}</b>.</div>`;
      } else {
        this.lives--;
        if(window.Sound) Sound.wrong&&Sound.wrong();
        if(fb) fb.innerHTML = `<div class="gl-fb no">Not quite — it's the <b>${_esc(part.name)}</b>.</div>`;
      }
      setTimeout(()=>{
        this.i++;
        if(this.i>=this.order.length || this.lives<=0){ this.done=true; }
        this.render();
      }, 1100);
    },
    renderDone(){
      const win = this.score >= Math.ceil(this.order.length*0.6);
      if(window.GuidedLesson) GuidedLesson.allowNext();
      if(win && window.App) { App.state.xp += 10; Store.save(App.state); }
      this.root.innerHTML = `
        <div class="sim-done">
          <div class="gl-big-emoji">${win?"🏅":"💪"}</div>
          <h3>${win?"Board Namer unlocked!":"Good effort!"}</h3>
          <p>You got <b>${this.score}/${this.order.length}</b> parts right.</p>
          <button class="btn btn-ghost btn-sm" onclick="SIMS.labelBoard.start('${this.root.id}')">🔁 Play again</button>
        </div>`;
    }
  },

  /* ---- Predict the Motor: read IN1/IN2, beat the timer ---- */
  predictMotor: {
    start(rootId){
      this.root = document.getElementById(rootId);
      this.round=0; this.total=6; this.score=0; this.streak=0; this.done=false;
      this.next();
    },
    next(){
      if(this.round>=this.total){ this.finish(); return; }
      this.round++;
      // random valid combo
      const combos = [[1,0,"forward"],[0,1,"backward"],[0,0,"stop"],[1,1,"brake"]];
      this.cur = combos[Math.floor(Math.random()*combos.length)];
      this.answered=false;
      this.render();
      this.startTimer();
    },
    render(){
      const [in1,in2] = this.cur;
      this.root.innerHTML = `
        <div class="sim-predict">
          <div class="sim-label-top">
            <span class="sim-pill">🎯 Round ${this.round}/${this.total}</span>
            <span class="sim-pill">🔥 Streak ${this.streak}</span>
            <span class="sim-pill">⭐ ${this.score}</span>
          </div>
          <div class="sim-combo">IN1 = <b class="${in1?'hi':'lo'}">${in1?'HIGH':'LOW'}</b> &nbsp; IN2 = <b class="${in2?'hi':'lo'}">${in2?'HIGH':'LOW'}</b></div>
          <div class="sim-timer"><div class="sim-timer-fill" id="sim-timer-fill"></div></div>
          <div class="sim-choices sim-choices-grid">
            ${[["forward","➡️ Forward"],["backward","⬅️ Backward"],["stop","⏸️ Stop"],["brake","🛑 Brake"]].map(([k,l])=>
              `<button class="sim-choice" onclick="SIMS.predictMotor.pick('${k}')">${l}</button>`).join("")}
          </div>
          <div class="sim-fb" id="sim-predict-fb"></div>
        </div>`;
    },
    startTimer(){
      clearInterval(this._t);
      const fill = document.getElementById("sim-timer-fill");
      let pct=100; if(fill) fill.style.width="100%";
      this._t = setInterval(()=>{
        pct -= 2.5;
        if(fill) fill.style.width = Math.max(0,pct)+"%";
        if(pct<=0){ clearInterval(this._t); if(!this.answered) this.pick(null); }
      }, 100);
    },
    pick(k){
      if(this.answered) return; this.answered=true; clearInterval(this._t);
      const correct = this.cur[2];
      const fb = document.getElementById("sim-predict-fb");
      this.root.querySelectorAll(".sim-choice").forEach(b=>b.disabled=true);
      if(k===correct){
        this.score++; this.streak++;
        if(this.streak>=3) this.score++; // streak bonus
        if(window.Sound) Sound.correct&&Sound.correct();
        if(fb) fb.innerHTML = `<div class="gl-fb ok">✅ Correct!${this.streak>=3?" 🔥 Streak bonus!":""}</div>`;
      } else {
        this.streak=0;
        if(window.Sound) Sound.wrong&&Sound.wrong();
        if(fb) fb.innerHTML = `<div class="gl-fb no">${k?"Nope":"⏰ Time!"} — the answer was <b>${correct}</b>.</div>`;
      }
      setTimeout(()=>this.next(), 1100);
    },
    finish(){
      this.done=true;
      if(window.GuidedLesson) GuidedLesson.allowNext();
      if(window.App){ App.state.xp += this.score; Store.save(App.state); }
      this.root.innerHTML = `
        <div class="sim-done">
          <div class="gl-big-emoji">🎯</div>
          <h3>Nice reflexes!</h3>
          <p>You scored <b>${this.score}</b> points.</p>
          <button class="btn btn-ghost btn-sm" onclick="SIMS.predictMotor.start('${this.root.id}')">🔁 Play again</button>
        </div>`;
    }
  },

  /* ---- Build-a-Sequence: block-code a virtual car ---- */
  buildSequence: {
    start(rootId, step){
      this.root = document.getElementById(rootId);
      this.seq = [];
      this.challenge = (step && step.challenge) || "Make the car go forward, then reverse, then stop.";
      this.render();
    },
    blocks(){ return [
      {k:"forward", label:"▶ Forward", c:"green"},
      {k:"backward", label:"◀ Reverse", c:"blue"},
      {k:"left", label:"↰ Turn Left", c:"purple"},
      {k:"right", label:"↱ Turn Right", c:"purple"},
      {k:"fast", label:"⚡ Full Speed", c:"orange"},
      {k:"slow", label:"🐢 Slow Speed", c:"orange"},
      {k:"stop", label:"⏹ Stop", c:"pink"}
    ];},
    render(){
      this.root.innerHTML = `
        <div class="sim-seq">
          <div class="sim-challenge">🎯 Challenge: ${_esc(this.challenge)}</div>
          <div class="sim-road"><div class="sim-car" id="sim-car">🚗</div></div>
          <div class="sim-palette">
            ${this.blocks().map(b=>`<button class="sim-block c-${b.c}" onclick="SIMS.buildSequence.add('${b.k}')">${b.label}</button>`).join("")}
          </div>
          <div class="sim-program" id="sim-program">
            ${this.seq.length? this.seq.map((s,i)=>{const b=this.blocks().find(x=>x.k===s);return `<span class="sim-chip c-${b.c}" onclick="SIMS.buildSequence.remove(${i})">${b.label} ✕</span>`;}).join("") : `<span class="sim-empty">Tap blocks above to build your program…</span>`}
          </div>
          <div class="sim-seq-btns">
            <button class="btn btn-primary btn-sm" onclick="SIMS.buildSequence.run()">▶ Run</button>
            <button class="btn btn-ghost btn-sm" onclick="SIMS.buildSequence.clear()">🗑 Clear</button>
          </div>
          <div class="sim-fb" id="sim-seq-fb"></div>
        </div>`;
    },
    add(k){ this.seq.push(k); if(window.Sound) Sound.click&&Sound.click(); this.render(); },
    remove(i){ this.seq.splice(i,1); this.render(); },
    clear(){ this.seq=[]; this.render(); },
    run(){
      if(!this.seq.length) return;
      const car = document.getElementById("sim-car");
      const fb = document.getElementById("sim-seq-fb");
      let step=0, speed=1;
      const play = ()=>{
        if(step>=this.seq.length){
          if(fb) fb.innerHTML = `<div class="gl-fb ok">✅ Program finished! Great sequencing. 🎉</div>`;
          if(window.GuidedLesson) GuidedLesson.allowNext();
          if(window.App){ App.state.xp += 5; Store.save(App.state); }
          return;
        }
        const s = this.seq[step];
        if(car){
          car.className = "sim-car";
          if(s==="forward"){ car.style.transform = `translateX(${40+step*4}px)`; car.textContent="🚗"; }
          else if(s==="backward"){ car.style.transform = `translateX(-10px)`; car.classList.add("flip"); }
          else if(s==="left"){ car.classList.add("turn-l"); }
          else if(s==="right"){ car.classList.add("turn-r"); }
          else if(s==="fast"){ speed=0.5; car.classList.add("zoom"); }
          else if(s==="slow"){ speed=1.6; }
          else if(s==="stop"){ car.textContent="🅿️"; }
        }
        step++;
        setTimeout(play, 600*speed);
      };
      if(fb) fb.innerHTML = `<div class="gl-fb">🏁 Running your program…</div>`;
      play();
    }
  }
};

/* Registry lookup used by GuidedLesson for {kind:"sim", sim:"..."} steps. */
function renderSim(){ /* placeholder — sims mount themselves via SIMS[...].start */ }
