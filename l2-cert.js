/* ============================================================
   LEVEL 2 — Certification MCQ (gamified class-mode quiz)
   ------------------------------------------------------------
   Loaded after app.js. Locks the L2 dashboard to a focused,
   gamified multiple-choice challenge for a live class:
     • 6 modules (mapping the 24 syllabus topics) + a Full Exam
     • reuses the existing L2 question bank + renderAnimation()
     • points scale by difficulty, with a streak multiplier and a
       speed bonus, plus a mandatory "Got it! Next" explanation gate
   Flip CLASS_MODE_L2.enabled to false after class to restore the
   full L2 dashboard.
   ============================================================ */

const CLASS_MODE_L2 = {
  enabled: false,
  title: "Today's Certification Challenge",
  subtitle: "Pick a module and prove your Arduino skills! 🏆"
};

// The 6 modules — each maps to a set of topics in data/l2/questions.json.
const CERT_MODULES = [
  {id:"m1", name:"Foundations of Electronics & Arduino", icon:"⚡", color:"blue",
   topics:["Foundations of Electronics","Electricity","Ohm's Law","Electronic Components","Arduino Basics","Digital Inputs & Outputs"]},
  {id:"m2", name:"Sensors & Serial Communication", icon:"📡", color:"green",
   topics:["Analog Inputs","Serial Communication","DHT Sensors","Environmental Monitoring"]},
  {id:"m3", name:"Actuators", icon:"⚙️", color:"orange",
   topics:["DC Motors","Servo Motors","Motor Drivers","PWM","Piezo Buzzers"]},
  {id:"m4", name:"Advanced Sensors & Displays", icon:"📺", color:"teal",
   topics:["LCD Displays","Ultrasonic Sensors","IR Sensors"]},
  {id:"m5", name:"Robotics Foundations", icon:"🤖", color:"purple",
   topics:["Robotics","Robot Navigation","Obstacle Avoidance"]},
  {id:"m6", name:"Kinematics", icon:"📐", color:"pink",
   topics:["Forward Kinematics","Inverse Kinematics","Robotic Arm Control"]}
];

const CertExam = {
  module:null, pool:[], index:0, score:0, correct:0, streak:0, bestStreak:0,
  answered:false, qStart:0, _speedT:null, displayOpts:[], correctIdx:0,

  classModeActive(){
    return !!(CLASS_MODE_L2.enabled && App.isL2Student && App.isL2Student() && !App.isAdmin());
  },
  esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;"); },
  shuffle(a){ return [...a].sort(()=>Math.random()-0.5); },

  questionsFor(mod){
    const all = (App.classData.l2 && App.classData.l2.questions) || [];
    if(!mod || mod.id==="full") return all.slice();
    return all.filter(q => mod.topics.includes(q.topic));
  },

  /* ---- dashboard lock ---- */
  applyClassMode(){
    const on = this.classModeActive();
    const screen = document.getElementById("screen-home");
    if(screen) screen.classList.toggle("cert-mode", on);
    const card = document.getElementById("l2-today-card");
    if(!card) return;
    card.style.display = on ? "" : "none";
    if(on){
      card.innerHTML = `
        <div class="l1-today-emoji">🏆</div>
        <div style="flex:1;">
          <span class="l1-today-tag">${this.esc(CLASS_MODE_L2.title)}</span>
          <h3>Arduino Certification MCQ</h3>
          <p>${this.esc(CLASS_MODE_L2.subtitle)}</p>
        </div>
        <button class="l1-daily-btn l1-today-btn" onclick="CertExam.open()">▶ Start</button>`;
    }
  },

  open(){ Router.go("cert"); this.renderSelect(); },

  /* ---- module select ---- */
  renderSelect(){
    clearInterval(this._speedT);
    const root = document.getElementById("cert-root");
    const cards = CERT_MODULES.map(m=>{
      const n = this.questionsFor(m).length;
      return `<button class="cert-mod c-${m.color}" onclick="CertExam.start('${m.id}')">
        <div class="cert-mod-ico">${m.icon}</div>
        <div class="cert-mod-name">${this.esc(m.name)}</div>
        <div class="cert-mod-n">${n} questions</div>
      </button>`;
    }).join("");
    const total = this.questionsFor(null).length;
    root.innerHTML = `
      <div class="cert-select">
        <div class="cert-top">
          <button class="btn btn-ghost btn-sm" onclick="App.enterHome()">✕ Exit</button>
          <h1 class="cert-title">🏆 Certification Challenge</h1>
          <span style="width:60px;"></span>
        </div>
        <p class="cert-intro">Pick a module to master — answer fast and keep your streak alive for bonus points! ⚡</p>
        <div class="cert-mod-grid">${cards}</div>
        <button class="cert-full" onclick="CertExam.start('full')">
          <div class="cert-mod-ico">🎓</div>
          <div style="text-align:left;">
            <div class="cert-mod-name">Full Certification Exam</div>
            <div class="cert-mod-n">A random mix of ${Math.min(20,total)} questions from all modules</div>
          </div>
        </button>
      </div>`;
  },

  /* ---- run a module ---- */
  start(id){
    const mod = id==="full"
      ? {id:"full", name:"Full Certification Exam", icon:"🎓", color:"blue"}
      : CERT_MODULES.find(m=>m.id===id);
    if(!mod) return;
    this.module = mod;
    const pool = this.shuffle(this.questionsFor(mod));
    const cap = id==="full" ? 20 : 12;
    this.pool = pool.slice(0, Math.min(cap, pool.length));
    this.index=0; this.score=0; this.correct=0; this.streak=0; this.bestStreak=0;
    if(!this.pool.length){ this.renderSelect(); return; }
    this.renderQuestion();
  },

  renderQuestion(){
    const q = this.pool[this.index];
    this.answered=false; this.qStart=Date.now();
    // shuffle options, remember which is correct
    const opts = this.shuffle(q.options.map(o=>({o, correct:o===q.answer})));
    this.displayOpts = opts;
    this.correctIdx = opts.findIndex(x=>x.correct);
    const modColor = (this.module&&this.module.color)||"blue";
    const root = document.getElementById("cert-root");
    root.innerHTML = `
      <div class="cert-quiz">
        <div class="cert-qtop">
          <button class="btn btn-ghost btn-sm" onclick="CertExam.exit()">✕ Exit</button>
          <div class="cert-qprogress"><div class="cert-qprogress-fill" style="width:${this.index/this.pool.length*100}%"></div></div>
          <div class="cert-scorebox">⭐ <span id="cert-score">${this.score}</span></div>
        </div>
        <div class="cert-meta">
          <span class="cert-chip c-${modColor}">${this.esc(q.topic)}</span>
          <span class="cert-chip diff-${String(q.difficulty).toLowerCase()}">${this.esc(q.difficulty)}</span>
          <span class="cert-chip">Q ${this.index+1}/${this.pool.length}</span>
          <span class="cert-streak ${this.streak>=3?'hot':''}" id="cert-streak">🔥 ${this.streak}</span>
        </div>
        <div class="cert-body">
          <div class="cert-stage" id="cert-stage"></div>
          <div class="cert-qcol">
            <div class="cert-speed"><div class="cert-speed-fill" id="cert-speed-fill"></div><span class="cert-speed-lbl">⚡ Speed bonus</span></div>
            <div class="cert-qtext ${q.type==='CodeReading'?'code':''}">${this.esc(q.question)}</div>
            ${q.formula ? `<div class="cert-formula">🧮 ${this.esc(q.formula)}</div>` : ""}
            <div class="cert-options" id="cert-options">
              ${opts.map((x,i)=>`<button class="cert-opt" data-i="${i}" onclick="CertExam.answer(${i})"><span class="cert-opt-k">${String.fromCharCode(65+i)}</span><span>${this.esc(x.o)}</span></button>`).join("")}
            </div>
            <div class="cert-explain" id="cert-explain"></div>
          </div>
        </div>
      </div>`;
    const stage = document.getElementById("cert-stage");
    if(stage && typeof renderAnimation==="function"){ try{ renderAnimation(q.animation, stage, {}); }catch(e){ stage.innerHTML = `<div class="cert-stage-ph">🤖</div>`; } }
    this.startSpeed();
  },

  startSpeed(){
    clearInterval(this._speedT);
    const fill = document.getElementById("cert-speed-fill");
    let pct = 100; if(fill) fill.style.width = "100%";
    this._speedT = setInterval(()=>{
      pct -= 1;                       // ~10s to empty (100 × 100ms)
      if(fill) fill.style.width = Math.max(0,pct)+"%";
      if(pct<=0) clearInterval(this._speedT);
    }, 100);
  },

  answer(i){
    if(this.answered) return; this.answered = true;
    clearInterval(this._speedT);
    const q = this.pool[this.index];
    const correct = i===this.correctIdx;
    const elapsed = (Date.now()-this.qStart)/1000;

    document.querySelectorAll("#cert-options .cert-opt").forEach((b,bi)=>{
      b.disabled = true;
      if(bi===this.correctIdx) b.classList.add("correct");
      else if(bi===i) b.classList.add("wrong");
    });

    const base = {easy:10, medium:20, hard:30}[String(q.difficulty).toLowerCase()] || 10;
    let gained=0, speedBonus=0, mult=1;
    if(correct){
      this.correct++; this.streak++; this.bestStreak = Math.max(this.bestStreak, this.streak);
      mult = this.streak>=5 ? 2 : this.streak>=3 ? 1.5 : 1;
      speedBonus = elapsed<=10 ? 5 : 0;
      gained = Math.round(base*mult) + speedBonus;
      this.score += gained;
      if(window.Sound && Sound.correct) Sound.correct();
      if(window.App){ App.state.xp += gained; App.state.stars += (q.difficulty==="Hard"?3:q.difficulty==="Medium"?2:1); }
      if(window.App && App.celebrate) App.celebrate();
    } else {
      this.streak = 0;
      if(window.Sound && Sound.wrong) Sound.wrong();
    }
    if(window.App){ App.state.totalAnswered++; if(correct) App.state.totalCorrect++; if(window.Store) Store.save(App.state); }

    const sc=document.getElementById("cert-score"); if(sc) sc.textContent=this.score;
    const st=document.getElementById("cert-streak"); if(st){ st.textContent=`🔥 ${this.streak}`; st.classList.toggle("hot", this.streak>=3); }

    const multTxt = (correct && mult>1) ? ` <b>×${mult} streak!</b>` : "";
    const bonusTxt = speedBonus ? ` <b>+${speedBonus} speed ⚡</b>` : "";
    const exp = document.getElementById("cert-explain");
    exp.innerHTML = `
      <div class="cert-exp-card ${correct?'ok':'no'}">
        <div class="cert-exp-head">${correct
          ? `✅ Correct! +${gained} pts${multTxt}${bonusTxt}`
          : `❌ Not quite — the answer is <b>${this.esc(q.answer)}</b>`}</div>
        <div class="cert-exp-body">${this.esc(q.explanation||"")}</div>
        ${q.formula ? `<div class="cert-exp-formula">🧮 ${this.esc(q.formula)}</div>` : ""}
        <div class="cert-exp-key">🔑 Key takeaway: ${this.esc(this.takeaway(q))}</div>
        <button class="btn btn-primary cert-next" onclick="CertExam.next()">Got it! Next →</button>
      </div>`;
    exp.scrollIntoView({behavior:"smooth", block:"nearest"});
  },

  takeaway(q){
    if(q.hint1) return q.hint1;
    if(q.explanation){ const s=q.explanation.split(". ")[0]; return s.length>4 ? s : q.explanation; }
    return "Keep practising — you've got this!";
  },

  next(){
    this.index++;
    if(this.index>=this.pool.length){ this.renderSummary(); return; }
    this.renderQuestion();
  },

  renderSummary(){
    clearInterval(this._speedT);
    const acc = this.pool.length ? Math.round(this.correct/this.pool.length*100) : 0;
    const badges=[];
    if(acc===100) badges.push({i:"🏆", n:"Perfect Score"});
    if(this.bestStreak>=5) badges.push({i:"🔥", n:"Streak Master"});
    if(acc>=70) badges.push({i:"🎓", n:`${this.module.name} Passed`});
    if(!badges.length) badges.push({i:"💪", n:"Keep Going"});
    if(window.App && App.celebrate) App.celebrate();
    const root=document.getElementById("cert-root");
    root.innerHTML = `
      <div class="cert-summary">
        <div class="gl-big-emoji">${acc>=70?"🎉":"💪"}</div>
        <h1>${acc>=70?"Module Complete!":"Good effort!"}</h1>
        <p class="cert-sum-sub">${this.esc(this.module.name)}</p>
        <div class="cert-sum-stats">
          <div class="cert-sum-stat"><div class="n">${this.score}</div><div class="l">Points</div></div>
          <div class="cert-sum-stat"><div class="n">${this.correct}/${this.pool.length}</div><div class="l">Correct</div></div>
          <div class="cert-sum-stat"><div class="n">${acc}%</div><div class="l">Accuracy</div></div>
          <div class="cert-sum-stat"><div class="n">${this.bestStreak} 🔥</div><div class="l">Best streak</div></div>
        </div>
        <div class="cert-badges">${badges.map(b=>`<div class="cert-badge"><div class="cert-badge-i">${b.i}</div><div>${this.esc(b.n)}</div></div>`).join("")}</div>
        <div class="cert-sum-btns">
          <button class="btn btn-primary" onclick="CertExam.renderSelect()">📚 Another module</button>
          <button class="btn btn-ghost" onclick="App.enterHome()">🏠 Dashboard</button>
        </div>
      </div>`;
  },

  exit(){
    Modal.show({icon:"🚪", title:"Leave the quiz?", message:"Your points so far are saved. You can start again any time.",
      confirmLabel:"Leave", onConfirm:()=>{ Modal.close(); clearInterval(this._speedT); App.enterHome(); }});
  }
};
