/* ============================================================
   Arduino Junior Certification Academy — App Logic
   ============================================================ */

const LEVELS = [
  {name:"Beginner", min:0}, {name:"Maker", min:200}, {name:"Inventor", min:500},
  {name:"Engineer", min:1000}, {name:"Robotics Expert", min:1800}, {name:"Arduino Master", min:3000}
];

const ACHIEVEMENTS = [
  {id:"first_correct", name:"First Correct", icon:"🥇", desc:"Answer your first question correctly", check:s=>s.totalCorrect>=1},
  {id:"ten_correct", name:"10 Correct", icon:"🔟", desc:"Answer 10 questions correctly", check:s=>s.totalCorrect>=10},
  {id:"hundred_correct", name:"100 Correct", icon:"💯", desc:"Answer 100 questions correctly", check:s=>s.totalCorrect>=100},
  {id:"perfect_score", name:"Perfect Score", icon:"🌟", desc:"Get 100% on an exam", check:s=>s.perfectExams>=1},
  {id:"fast_thinker", name:"Fast Thinker", icon:"⚡", desc:"Answer a question correctly in under 8 seconds", check:s=>s.fastAnswers>=1},
  {id:"electronics_genius", name:"Electronics Genius", icon:"🔋", desc:"Master Ohm's Law & Electricity topics", check:s=>topicMastered(s,["Ohm's Law","Electricity","Foundations of Electronics"])},
  {id:"robot_builder", name:"Robot Builder", icon:"🤖", desc:"Master Robotics & Navigation topics", check:s=>topicMastered(s,["Robotics","Robot Navigation","Obstacle Avoidance"])},
  {id:"pwm_master", name:"PWM Master", icon:"🌈", desc:"Master the PWM topic", check:s=>topicMastered(s,["PWM"])},
  {id:"sensor_king", name:"Sensor King", icon:"📡", desc:"Master sensor topics", check:s=>topicMastered(s,["Ultrasonic Sensors","IR Sensors","DHT Sensors"])},
  {id:"circuit_wizard", name:"Circuit Wizard", icon:"🧙", desc:"Master Electronic Components", check:s=>topicMastered(s,["Electronic Components"])},
];

function topicMastered(state, topics){
  return topics.every(t => (state.topicStats[t] && state.topicStats[t].correct >= 3));
}

const DEFAULT_STATE = {
  xp:0, coins:0, stars:0, streak:1, lastPlayDate: null,
  totalCorrect:0, totalAnswered:0, perfectExams:0, fastAnswers:0,
  topicStats:{}, unlockedAchievements:[], collection:[], examHistory:[]
};

/* ---------------- AUTH (Supabase) ---------------- */
const SUPABASE_URL = "https://skiydsovftoqvdgvdmsr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNraXlkc292ZnRvcXZkZ3ZkbXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4Mjg1MTMsImV4cCI6MjA5OTQwNDUxM30.yPhd7c70soxYAG7i7yQy9ll_uDn6O-0mDYwMrr8jifQ";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const STUDENTS = [
  {key:"sanula", name:"Sanula", email:"sanula@arduino-academy.local", role:"student"},
  {key:"himaru", name:"Himaru", email:"himaru@arduino-academy.local", role:"student"},
  {key:"navanjana", name:"Navanjana", email:"navanjana@arduino-academy.local", role:"student"},
  {key:"admin", name:"Admin", email:"admin@arduino-academy.local", role:"admin"},
];

const Auth = {
  profile: null, // {id, name, role}
  selected: null,

  buildLoginScreen(){
    const box = document.getElementById("login-names");
    box.innerHTML = STUDENTS.map(s=>
      `<button class="login-name-btn" data-key="${s.key}" onclick="Auth.pick('${s.key}')">${s.role==='admin'?'🛠️':'🧑‍🎓'} ${s.name}</button>`
    ).join("");
  },

  pick(key){
    this.selected = STUDENTS.find(s=>s.key===key);
    document.querySelectorAll(".login-name-btn").forEach(b=>b.classList.toggle("active", b.dataset.key===key));
    document.getElementById("login-pin").style.display = "block";
    document.getElementById("login-btn").style.display = "inline-flex";
    document.getElementById("login-error").textContent = "";
    const pinEl = document.getElementById("login-pin");
    pinEl.value = "";
    pinEl.focus();
  },

  async submitLogin(){
    if(!this.selected) return;
    const pin = document.getElementById("login-pin").value.trim();
    const errEl = document.getElementById("login-error");
    if(pin.length < 4){ errEl.textContent = "PIN too short."; return; }
    const btn = document.getElementById("login-btn");
    btn.disabled = true; btn.textContent = "Logging in…"; errEl.textContent = "";
    try{
      let { data, error } = await sb.auth.signInWithPassword({email:this.selected.email, password:pin});
      if(error){
        const signup = await sb.auth.signUp({email:this.selected.email, password:pin});
        if(signup.error) throw signup.error;
        if(!signup.data.session){
          throw new Error("Account created, but Supabase is asking for email confirmation. Disable \"Confirm email\" under Authentication settings, then try again.");
        }
        data = signup.data;
        await sb.from("profiles").upsert({id:data.user.id, name:this.selected.name, role:this.selected.role});
      }
      await this.afterLogin(data.user);
    }catch(e){
      errEl.textContent = e.message === "Invalid login credentials" ? "Wrong PIN." : (e.message || "Login failed.");
    }finally{
      btn.disabled = false; btn.textContent = "Log In";
    }
  },

  async afterLogin(authUser){
    let { data: profile } = await sb.from("profiles").select("*").eq("id", authUser.id).maybeSingle();
    if(!profile){
      await sb.from("profiles").upsert({
        id: authUser.id,
        name: this.selected ? this.selected.name : "Student",
        role: this.selected ? this.selected.role : "student"
      });
      const res = await sb.from("profiles").select("*").eq("id", authUser.id).maybeSingle();
      profile = res.data;
    }
    this.profile = profile;
    await App.startSession();
  },

  async restoreSession(){
    const { data:{ session } } = await sb.auth.getSession();
    if(!session) return false;
    const { data: profile } = await sb.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
    if(!profile) return false;
    this.profile = profile;
    return true;
  },

  async logout(){
    await sb.auth.signOut();
    this.profile = null;
    this.selected = null;
    App.state = structuredClone(DEFAULT_STATE);
    document.getElementById("user-badge").style.display = "none";
    document.getElementById("nav-btns").style.display = "none";
    document.getElementById("stat-pills").style.display = "none";
    document.getElementById("login-pin").value = "";
    document.getElementById("login-error").textContent = "";
    document.getElementById("login-pin").style.display = "none";
    document.getElementById("login-btn").style.display = "none";
    document.querySelectorAll(".login-name-btn").forEach(b=>b.classList.remove("active"));
    Router.go("login");
  }
};

const Store = {
  async load(){
    if(!Auth.profile) return structuredClone(DEFAULT_STATE);
    const { data } = await sb.from("progress").select("state").eq("user_id", Auth.profile.id).maybeSingle();
    if(!data) return structuredClone(DEFAULT_STATE);
    return Object.assign(structuredClone(DEFAULT_STATE), data.state || {});
  },
  save(state){
    if(!Auth.profile) return;
    sb.from("progress")
      .upsert({user_id:Auth.profile.id, state, updated_at:new Date().toISOString()})
      .then(({error})=>{ if(error) console.error("progress save failed", error); });
  }
};

const BUDDY_LINES = {
  correct: ["Nice work! ⚡", "You're sparking with genius!", "Circuit complete — correct!", "Boom! Nailed it.", "That's the current path to mastery!"],
  wrong: ["Almost! Let's learn 🔧", "No worries — even Edison needed retries!", "Close one! Let's break it down.", "That's a common mix-up — let's fix it."],
  hint: ["Here's a little spark of help 💡", "Let me power up a clue for you.", "Sending a hint through the wire…"],
  idle: ["Ready to build something amazing? 🤖", "Pssst — try the Daily Challenge!", "Fun fact: Arduino boards are named after a bar in Italy!", "Why did the resistor break up with the capacitor? No spark left! 😄", "You're doing great — keep the current flowing!"],
  start_exam: ["Exam mode: no hints, no retries — you've got this! 🎯"],
  streak: ["Your streak is on fire! 🔥 Keep it up!"]
};

const App = {
  state: structuredClone(DEFAULT_STATE),
  questions: [],
  quiz: null, // active quiz session

  async init(){
    this.buildParticles();
    this.buildPinrow();
    Auth.buildLoginScreen();
    try{
      const res = await fetch("data/questions.json");
      this.questions = await res.json();
    }catch(e){
      document.getElementById("stage").innerHTML =
        `<div style="padding:24px;text-align:center;color:#ff8a80;font-size:.85rem;">
          Couldn't load data/questions.json.<br><br>
          Browsers block local file:// requests — please serve this folder with a local server, e.g.<br>
          <code style="color:#ffd699;">npx serve .</code> or <code style="color:#ffd699;">python3 -m http.server</code><br>
          then open the printed http://localhost address.
        </div>`;
    }
    this.buddyIdleLoop();
    const restored = await Auth.restoreSession();
    if(restored){ await this.startSession(); }
    else { Router.go("login"); }
  },

  async startSession(){
    this.state = await Store.load();
    this.bumpStreak();
    document.getElementById("stat-pills").style.display = "flex";
    document.getElementById("nav-btns").style.display = "flex";
    document.getElementById("user-badge").style.display = "flex";
    document.getElementById("pill-user").textContent = (Auth.profile.role==="admin" ? "🛠️ " : "🧑‍🎓 ") + Auth.profile.name;
    document.getElementById("nav-students-btn").style.display = Auth.profile.role==="admin" ? "inline-block" : "none";
    this.renderHome();
    Router.go("home");
  },

  bumpStreak(){
    const today = new Date().toDateString();
    if(this.state.lastPlayDate === today) return;
    const y = new Date(); y.setDate(y.getDate()-1);
    if(this.state.lastPlayDate === y.toDateString()){ this.state.streak++; }
    else if(this.state.lastPlayDate){ this.state.streak = 1; }
    this.state.lastPlayDate = today;
    Store.save(this.state);
  },

  buildParticles(){
    const box = document.getElementById("particles");
    let html = "";
    for(let i=0;i<22;i++){
      const top = Math.random()*100, left = Math.random()*100, delay = Math.random()*8;
      html += `<span style="top:${top}%;left:${left}%;animation-delay:${delay}s;"></span>`;
    }
    box.innerHTML = html;
  },
  buildPinrow(){
    document.getElementById("pinrow").innerHTML = Array.from({length:14}).map(()=>"<span></span>").join("");
  },

  currentLevel(){
    let lvl = LEVELS[0], idx=0;
    for(let i=0;i<LEVELS.length;i++){ if(this.state.xp >= LEVELS[i].min){ lvl = LEVELS[i]; idx=i; } }
    const next = LEVELS[idx+1];
    return {index:idx+1, name:lvl.name, min:lvl.min, next: next ? next.min : null};
  },

  /* ---------------- HOME RENDER ---------------- */
  renderHome(){
    const s = this.state;
    document.getElementById("pill-xp").textContent = `${s.xp} XP`;
    document.getElementById("pill-coins").textContent = s.coins;
    document.getElementById("pill-streak").textContent = `${s.streak} day streak`;
    const lvl = this.currentLevel();
    document.getElementById("pill-level").textContent = `Lvl ${lvl.index} · ${lvl.name}`;
    document.getElementById("level-title").textContent = `Level ${lvl.index} · ${lvl.name}`;

    const span = lvl.next ? lvl.next - lvl.min : 1;
    const prog = lvl.next ? Math.min(100, ((s.xp-lvl.min)/span)*100) : 100;
    document.getElementById("level-progress-fill").style.width = prog+"%";
    document.getElementById("level-progress-txt").textContent = lvl.next ? `${s.xp - lvl.min} / ${span} XP to next level` : "Max level reached!";

    document.getElementById("stat-stars").textContent = s.stars;
    document.getElementById("stat-correct").textContent = s.totalCorrect;
    const acc = s.totalAnswered ? Math.round((s.totalCorrect/s.totalAnswered)*100) : 0;
    document.getElementById("stat-accuracy").textContent = acc+"%";

    // achievements preview (first 3 unlocked, else first 3 locked)
    const box = document.getElementById("home-achv-preview");
    const list = ACHIEVEMENTS.slice(0,3);
    box.innerHTML = list.map(a=>{
      const unlocked = s.unlockedAchievements.includes(a.id);
      return `<div class="card achv ${unlocked?'':'locked'}">
        <div class="badge">${a.icon}</div>
        <div class="meta"><div>${a.name}</div><small>${a.desc}</small></div>
      </div>`;
    }).join("");

    // dummy leaderboard, "You" placed based on xp
    const dummies = [
      {name:"Nadia_Codes", xp: 4200}, {name:"RoboRick", xp: 3120}, {name:"CircuitSam", xp: 2650},
      {name:"PixelPri", xp: 1420}, {name:"WireWes", xp: 860}
    ];
    const all = [...dummies, {name:"You", xp:s.xp, me:true}].sort((a,b)=>b.xp-a.xp);
    document.getElementById("leaderboard-box").innerHTML = all.map((p,i)=>`
      <div class="lb-row ${p.me?'me':''}">
        <div class="lb-rank">${i+1}</div>
        <div class="lb-avatar">${p.me?'🙂':'🤖'}</div>
        <div style="flex:1;">${p.me?'<strong>You</strong>':p.name}</div>
        <div class="small muted">${p.xp} XP</div>
      </div>`).join("");

    this.renderTopics();
    this.renderAchievements();
    this.renderAdmin();
  },

  renderTopics(){
    if(!this.questions.length) return;
    const topics = [...new Set(this.questions.map(q=>q.topic))];
    const grid = document.getElementById("topics-grid");
    grid.innerHTML = topics.map(t=>{
      const qs = this.questions.filter(q=>q.topic===t);
      const stat = this.state.topicStats[t] || {correct:0, attempted:0};
      const pct = qs.length ? Math.round((stat.correct/qs.length)*100) : 0;
      return `<div class="card mode-card card-hover">
        <div class="emoji">🔧</div>
        <h3>${t}</h3>
        <p>${qs.length} questions · ${pct}% mastered</p>
        <div class="progress-track" style="margin-bottom:14px;"><div class="progress-fill green" style="width:${Math.min(100,pct)}%"></div></div>
        <button class="btn btn-teal btn-sm" onclick="App.startTopic('${t.replace(/'/g,"\\'")}')">Practice Topic</button>
      </div>`;
    }).join("");
  },

  renderAchievements(){
    const grid = document.getElementById("achv-grid");
    if(!grid) return;
    grid.innerHTML = ACHIEVEMENTS.map(a=>{
      const unlocked = this.state.unlockedAchievements.includes(a.id);
      return `<div class="card achv ${unlocked?'':'locked'}">
        <div class="badge">${a.icon}</div>
        <div class="meta"><div><strong>${a.name}</strong></div><small>${a.desc}</small></div>
      </div>`;
    }).join("");
    const coll = document.getElementById("collection-box");
    if(coll){
      if(!this.state.collection.length){
        coll.innerHTML = `<p class="muted small">No components collected yet — earn them from Mystery Boxes and Spin Wheel rewards after quizzes!</p>`;
      } else {
        coll.innerHTML = `<div class="flex gap-12" style="flex-wrap:wrap;">` +
          this.state.collection.map(c=>`<span class="pill">${c}</span>`).join("") + `</div>`;
      }
    }
  },

  renderAdmin(){
    const tbody = document.getElementById("admin-tbody");
    if(!tbody) return;
    document.getElementById("admin-count").textContent = this.questions.length;
    const render = (list)=> tbody.innerHTML = list.map(q=>`
      <tr>
        <td>${q.id}</td><td>${q.topic}</td>
        <td><span class="tag ${q.difficulty.toLowerCase()}">${q.difficulty}</span></td>
        <td>${q.type}</td>
        <td>${q.question.slice(0,70).replace(/\n/g," ")}${q.question.length>70?'…':''}</td>
        <td>${q.xp}</td>
      </tr>`).join("");
    render(this.questions);
    const search = document.getElementById("admin-search");
    if(search) search.oninput = (e)=>{
      const v = e.target.value.toLowerCase();
      render(this.questions.filter(q => q.question.toLowerCase().includes(v) || q.topic.toLowerCase().includes(v)));
    };
  },

  async renderStudents(){
    const grid = document.getElementById("students-grid");
    if(!grid || !Auth.profile || Auth.profile.role!=="admin") return;
    grid.innerHTML = `<p class="muted small">Loading…</p>`;
    const [{ data: profiles }, { data: progressRows }] = await Promise.all([
      sb.from("profiles").select("*").eq("role","student"),
      sb.from("progress").select("*")
    ]);
    const progressByUser = Object.fromEntries((progressRows||[]).map(r=>[r.user_id, r]));
    grid.innerHTML = (profiles||[]).map(p=>{
      const row = progressByUser[p.id];
      const s = row ? Object.assign(structuredClone(DEFAULT_STATE), row.state||{}) : structuredClone(DEFAULT_STATE);
      const acc = s.totalAnswered ? Math.round((s.totalCorrect/s.totalAnswered)*100) : 0;
      let lvl = LEVELS[0];
      for(const l of LEVELS){ if(s.xp >= l.min) lvl = l; }
      const lastActive = row && row.updated_at ? new Date(row.updated_at).toLocaleString() : "Never played";
      const topics = Object.entries(s.topicStats||{});
      return `<div class="card">
        <h3>🧑‍🎓 ${p.name}</h3>
        <div class="flex gap-12 mt-10" style="flex-wrap:wrap;">
          <span class="pill">⚡ ${s.xp} XP</span>
          <span class="pill">🏆 ${lvl.name}</span>
          <span class="pill">🔥 ${s.streak} day streak</span>
          <span class="pill">🎯 ${acc}% accuracy</span>
        </div>
        <p class="small muted mt-10">✅ ${s.totalCorrect}/${s.totalAnswered} answered · 🏅 ${(s.unlockedAchievements||[]).length} achievements</p>
        <p class="small muted">Last active: ${lastActive}</p>
        ${topics.length ? `<div class="mt-10">${topics.map(([t,st])=>`<div class="small muted">${t}: ${st.correct}/${st.attempted}</div>`).join("")}</div>` : ""}
      </div>`;
    }).join("") || `<p class="muted small">No students have logged in yet.</p>`;
  },

  /* ---------------- BUDDY ---------------- */
  buddyTalk(force){
    const bubble = document.getElementById("buddy-bubble");
    const lines = BUDDY_LINES.idle;
    bubble.textContent = lines[Math.floor(Math.random()*lines.length)];
    bubble.classList.add("show");
    clearTimeout(this._buddyTimeout);
    this._buddyTimeout = setTimeout(()=>bubble.classList.remove("show"), 4200);
  },
  buddySay(category){
    const bubble = document.getElementById("buddy-bubble");
    const lines = BUDDY_LINES[category] || BUDDY_LINES.idle;
    bubble.textContent = lines[Math.floor(Math.random()*lines.length)];
    bubble.classList.add("show");
    clearTimeout(this._buddyTimeout);
    this._buddyTimeout = setTimeout(()=>bubble.classList.remove("show"), 4200);
  },
  buddyIdleLoop(){
    setInterval(()=>{ if(!this.quiz) this.buddyTalk(); }, 22000);
  },

  /* ---------------- QUIZ SESSION ---------------- */
  startPractice(){ this.beginQuiz({mode:"practice", pool:this.shuffled(this.questions), hints:true, retries:true, timer:false}); },
  startExam(){
    const pool = this.shuffled(this.questions).slice(0, Math.min(40, this.questions.length));
    this.beginQuiz({mode:"exam", pool, hints:false, retries:false, timer:60});
    this.buddySay("start_exam");
  },
  startDaily(){
    const pool = this.shuffled(this.questions).slice(0,5);
    this.beginQuiz({mode:"daily", pool, hints:true, retries:true, timer:false});
  },
  startTopic(topic){
    const pool = this.shuffled(this.questions.filter(q=>q.topic===topic));
    this.beginQuiz({mode:"topic", pool, hints:true, retries:true, timer:false, topic});
  },

  shuffled(arr){ return [...arr].sort(()=>Math.random()-0.5); },

  beginQuiz(cfg){
    if(!cfg.pool.length){ alert("No questions available yet."); return; }
    this.quiz = {
      ...cfg, index:0, correctCount:0, wrongCount:0, startTime:Date.now(),
      perQuestion:[], hintUsed:0, answered:false, selectedIndex:null,
      topicScores:{}
    };
    Router.go("quiz");
    this.renderQuestion();
  },

  quitQuiz(){
    if(this.quiz && this.quiz.mode==="exam" && this.quiz.index>0){
      if(!confirm("Exit the exam? Your progress on this attempt will be lost.")) return;
    }
    this.quiz = null;
    Router.go("home");
  },

  currentQuestion(){ return this.quiz.pool[this.quiz.index]; },

  renderQuestion(){
    const q = this.currentQuestion();
    const quiz = this.quiz;
    quiz.answered = false; quiz.selectedIndex = null; quiz.qHintCount = 0; quiz.qStart = Date.now();

    document.getElementById("quiz-mode-tag").textContent = quiz.mode.toUpperCase();
    document.getElementById("quiz-progress-txt").textContent = `Question ${quiz.index+1} of ${quiz.pool.length}`;
    const diffTag = document.getElementById("quiz-difficulty-tag");
    diffTag.textContent = q.difficulty; diffTag.className = "tag " + q.difficulty.toLowerCase();
    document.getElementById("quiz-progress-fill").style.width = ((quiz.index)/quiz.pool.length*100)+"%";
    document.getElementById("quiz-topic-label").textContent = q.topic;
    document.getElementById("quiz-xp-label").textContent = `+${q.xp} XP`;

    const qTextEl = document.getElementById("q-text");
    qTextEl.textContent = q.question;
    qTextEl.className = "q-text" + (q.type==="CodeReading" ? " code" : "");

    renderAnimation(q.animation, document.getElementById("stage"), {});

    const optWrap = document.getElementById("q-options");
    optWrap.innerHTML = q.options.map((opt,i)=>`
      <button class="opt" data-i="${i}" onclick="App.selectOption(${i})">
        <span class="k">${String.fromCharCode(65+i)}</span><span>${opt}</span>
      </button>`).join("");

    // hints
    const hintRow = document.getElementById("hint-row");
    const hintBox = document.getElementById("hint-box");
    hintBox.classList.remove("show"); hintBox.textContent = "";
    if(quiz.hints){
      hintRow.style.display="flex";
      hintRow.innerHTML = [1,2,3].map(n=>`<button class="hint-btn" id="hint-btn-${n}" onclick="App.useHint(${n})" title="Hint ${n}">${n}</button>`).join("");
    } else {
      hintRow.innerHTML = `<span class="small muted">Hints disabled in ${quiz.mode} mode</span>`;
    }

    document.getElementById("feedback").className = "feedback";
    document.getElementById("feedback").innerHTML = "";
    document.getElementById("submit-btn").disabled = true;
    document.getElementById("submit-btn").textContent = "Submit Answer";
    document.getElementById("submit-btn").onclick = ()=>App.submitAnswer();

    // timer (exam mode: 60s per question)
    clearInterval(this._timerInt);
    const timerEl = document.getElementById("quiz-timer");
    if(quiz.timer){
      timerEl.style.display="inline-block";
      let remaining = quiz.timer;
      timerEl.textContent = this.fmtTime(remaining);
      timerEl.classList.remove("low");
      this._timerInt = setInterval(()=>{
        remaining--;
        timerEl.textContent = this.fmtTime(remaining);
        if(remaining<=10) timerEl.classList.add("low");
        if(remaining<=0){
          clearInterval(this._timerInt);
          if(!quiz.answered) App.forceTimeout();
        }
      },1000);
    } else {
      timerEl.style.display="none";
    }
  },

  fmtTime(sec){ sec=Math.max(0,sec); const m=String(Math.floor(sec/60)).padStart(2,"0"); const s=String(sec%60).padStart(2,"0"); return `${m}:${s}`; },

  selectOption(i){
    if(this.quiz.answered) return;
    document.querySelectorAll(".opt").forEach(el=>el.classList.remove("selected"));
    const el = document.querySelector(`.opt[data-i="${i}"]`);
    el.style.borderColor = "var(--orange)";
    document.querySelectorAll(".opt").forEach(o=>{ if(o!==el) o.style.borderColor=""; });
    this.quiz.selectedIndex = i;
    document.getElementById("submit-btn").disabled = false;
  },

  useHint(n){
    const quiz = this.quiz;
    if(!quiz.hints || quiz.answered) return;
    const q = this.currentQuestion();
    quiz.qHintCount = Math.max(quiz.qHintCount, n);
    for(let i=1;i<=n;i++){ const b=document.getElementById(`hint-btn-${i}`); if(b) b.classList.add("used"); }
    const hintBox = document.getElementById("hint-box");
    const key = "hint"+Math.min(n,3);
    hintBox.textContent = "💡 " + (q[key] || q.hint3 || "Think carefully about the concept.");
    hintBox.classList.add("show");
    this.buddySay("hint");
  },

  forceTimeout(){
    this.quiz.selectedIndex = -1;
    this.submitAnswer(true);
  },

  submitAnswer(timedOut){
    const quiz = this.quiz;
    if(quiz.answered) return;
    quiz.answered = true;
    clearInterval(this._timerInt);
    const q = this.currentQuestion();
    const isCorrect = quiz.selectedIndex!==-1 && q.options[quiz.selectedIndex] === q.answer;
    const timeTaken = (Date.now()-quiz.qStart)/1000;

    document.querySelectorAll(".opt").forEach((el,i)=>{
      el.disabled = true;
      if(q.options[i]===q.answer) el.classList.add("correct");
      else if(i===quiz.selectedIndex) el.classList.add("wrong");
    });

    // update topic stats
    const ts = this.state.topicStats[q.topic] = this.state.topicStats[q.topic] || {correct:0, attempted:0};
    ts.attempted++;
    this.state.totalAnswered++;

    let xpGain = 0, coinGain = 0;
    if(isCorrect){
      quiz.correctCount++;
      ts.correct++;
      this.state.totalCorrect++;
      xpGain = Math.max(2, q.xp - quiz.qHintCount*3);
      coinGain = q.marks*2;
      if(timeTaken < 8) { this.state.fastAnswers++; }
      this.state.xp += xpGain;
      this.state.coins += coinGain;
      this.state.stars += q.difficulty==="Hard"?3:(q.difficulty==="Medium"?2:1);
      this.celebrate();
      this.flyCoin();
      this.buddySay("correct");
    } else {
      quiz.wrongCount++;
      this.buddySay("wrong");
    }
    quiz.perQuestion.push({id:q.id, topic:q.topic, correct:isCorrect});
    quiz.topicScores[q.topic] = quiz.topicScores[q.topic] || {correct:0,total:0};
    quiz.topicScores[q.topic].total++;
    if(isCorrect) quiz.topicScores[q.topic].correct++;

    Store.save(this.state);
    this.checkAchievements();
    this.showFeedback(isCorrect, q, timedOut, xpGain, coinGain, quiz.retries);
    this.renderHome();
  },

  showFeedback(isCorrect, q, timedOut, xpGain, coinGain, retries){
    const fb = document.getElementById("feedback");
    fb.className = "feedback show " + (isCorrect ? "correct-fb" : "wrong-fb");
    const nextLabel = this.quiz.index < this.quiz.pool.length-1 ? "Next Question →" : "See Results →";
    if(isCorrect){
      fb.innerHTML = `
        <h4>✅ Correct! +${xpGain} XP, +${coinGain} coins</h4>
        <p>${q.explanation}</p>
        <div class="concept-box"><strong>30-second recap:</strong> ${this.conceptRecap(q)}</div>
        <div class="mt-20"><button class="btn btn-primary btn-sm" onclick="App.nextQuestion()">${nextLabel}</button></div>`;
    } else {
      const canRetry = retries && !timedOut;
      fb.innerHTML = `
        <h4>${timedOut ? "⏱️ Time's up!" : "🤖 Almost! Let's learn."}</h4>
        <p><strong>Correct answer:</strong> ${q.answer}</p>
        <p class="mt-10">${q.explanation}</p>
        <div class="concept-box"><strong>30-second recap:</strong> ${this.conceptRecap(q)}</div>
        <div class="mt-20 flex gap-8">
          ${canRetry ? `<button class="btn btn-teal btn-sm" onclick="App.retryQuestion()">↻ Try a similar one</button>` : ""}
          <button class="btn btn-primary btn-sm" onclick="App.nextQuestion()">${nextLabel}</button>
        </div>`;
    }
  },

  conceptRecap(q){
    const memoryTricks = {
      "Ohm's Law":"Memory trick: 'V is Very Important' — cover V in the triangle V/IR to see I×R.",
      "PWM":"Memory trick: think of PWM like blinking a light faster than your eye can see — more 'on' time = brighter.",
      "Ultrasonic Sensors":"Memory trick: sound bounces there-and-back, so always divide by 2 for one-way distance.",
      "Servo Motors":"Memory trick: servos 'aim', DC motors 'spin' — servo = position, DC = rotation.",
    };
    return (q.formula ? `Formula: <code>${q.formula}</code>. ` : "") + (memoryTricks[q.topic] || "Real-life example: this concept shows up constantly in everyday electronics and robots.");
  },

  retryQuestion(){
    // Serve a different question from the same topic if available, else re-show same one.
    const q = this.currentQuestion();
    const alts = this.questions.filter(x=>x.topic===q.topic && x.id!==q.id);
    if(alts.length){
      const pick = alts[Math.floor(Math.random()*alts.length)];
      this.quiz.pool[this.quiz.index] = pick;
    }
    this.renderQuestion();
  },

  nextQuestion(){
    if(this.quiz.index < this.quiz.pool.length-1){
      this.quiz.index++;
      this.renderQuestion();
    } else {
      this.finishQuiz();
    }
  },

  finishQuiz(){
    const quiz = this.quiz;
    const total = quiz.pool.length;
    const pct = Math.round((quiz.correctCount/total)*100);
    const timeMs = Date.now()-quiz.startTime;

    if(quiz.mode==="exam"){
      if(pct===100) this.state.perfectExams++;
      this.state.examHistory.push({date:Date.now(), pct, total});
      // mystery box / spin wheel reward
      const rewardItems = ["Extra Servo Shield","WiFi Shield Unlock","Ultrasonic Sensor Pack","Robot Pet Hat","Golden Resistor Badge"];
      if(pct>=60){
        const item = rewardItems[Math.floor(Math.random()*rewardItems.length)];
        if(!this.state.collection.includes(item)) this.state.collection.push(item);
      }
    }
    Store.save(this.state);
    this.checkAchievements();
    this.renderResults(quiz, pct, timeMs);
    this.quiz = null;
    Router.go("results");
  },

  renderResults(quiz, pct, timeMs){
    const grade = pct>=90?"A+":pct>=80?"A":pct>=70?"B":pct>=60?"C":pct>=50?"D":"F";
    document.getElementById("grade-badge").textContent = grade;
    document.getElementById("result-title").textContent =
      pct>=80 ? "Outstanding work! 🎉" : pct>=60 ? "Solid effort! 💪" : "Keep practicing — you'll get there! 🔧";
    document.getElementById("result-subtitle").textContent = `You scored ${pct}% in ${quiz.mode} mode`;
    document.getElementById("res-score").textContent = `${quiz.correctCount}/${quiz.pool.length}`;
    document.getElementById("res-percent").textContent = pct+"%";
    const xpEarned = quiz.perQuestion.filter(p=>p.correct).length; // rough display; real xp already applied
    document.getElementById("res-xp").textContent = "+"+this.lastSessionXP(quiz);
    document.getElementById("res-coins").textContent = "+"+this.lastSessionCoins(quiz);
    document.getElementById("res-time").textContent = this.fmtTime(Math.round(timeMs/1000));

    document.getElementById("cert-btn").style.display = (pct>80 && quiz.mode==="exam") ? "inline-flex" : "none";

    // topic breakdown
    const tb = document.getElementById("topic-breakdown");
    const entries = Object.entries(quiz.topicScores);
    tb.innerHTML = entries.map(([topic,sc])=>{
      const p = Math.round((sc.correct/sc.total)*100);
      const color = p>=70 ? "var(--green)" : p>=40 ? "var(--orange)" : "#ff5252";
      return `<div class="topic-bar-row">
        <div class="name">${topic}</div>
        <div class="topic-bar-track"><div class="topic-bar-fill" style="width:${p}%; background:${color};"></div></div>
        <div style="width:40px; text-align:right;">${p}%</div>
      </div>`;
    }).join("") || `<p class="muted small">No topic data for this session.</p>`;

    // recommendations
    const weak = entries.filter(([,sc])=>sc.correct/sc.total < 0.6).map(([t])=>t);
    const strong = entries.filter(([,sc])=>sc.correct/sc.total >= 0.8).map(([t])=>t);
    const rec = document.getElementById("recommendations");
    rec.innerHTML = `
      <p><strong>Strong areas:</strong> ${strong.length ? strong.join(", ") : "Keep practicing to build your strengths!"}</p>
      <p class="mt-10"><strong>Weak areas:</strong> ${weak.length ? weak.join(", ") : "No major weak spots — great job!"}</p>
      <p class="mt-10">${weak.length ? `Focus your next session on <strong>${weak[0]}</strong> using Topic Explorer.` : "Try Exam Mode again to push your score even higher!"}</p>`;
  },

  lastSessionXP(quiz){
    return quiz.perQuestion.reduce((sum,p)=>{
      if(!p.correct) return sum;
      const q = this.questions.find(x=>x.id===p.id);
      return sum + (q ? q.xp : 10);
    },0);
  },
  lastSessionCoins(quiz){
    return quiz.perQuestion.reduce((sum,p)=>{
      if(!p.correct) return sum;
      const q = this.questions.find(x=>x.id===p.id);
      return sum + (q ? q.marks*2 : 2);
    },0);
  },

  printCertificate(){
    const name = prompt("Enter your name for the certificate:", "Arduino Student") || "Arduino Student";
    const pct = document.getElementById("res-percent").textContent;
    const w = window.open("", "_blank");
    w.document.write(`
      <html><head><title>Certificate</title><style>
        body{font-family:Georgia,serif; text-align:center; padding:60px; background:#fffaf0;}
        .cert{border:10px double #FF9800; padding:60px; border-radius:20px;}
        h1{color:#00979D; font-size:2.4rem;} h2{color:#212121;} .score{font-size:1.4rem; color:#FF9800; font-weight:bold;}
      </style></head><body>
      <div class="cert">
        <h1>🔌 Arduino Junior Certification</h1>
        <p style="font-size:1.1rem; margin:30px 0;">This certifies that</p>
        <h2>${name}</h2>
        <p style="font-size:1.1rem; margin:30px 0;">has successfully completed the Arduino Junior Certification Exam with a score of</p>
        <div class="score">${pct}</div>
        <p style="margin-top:50px; color:#666;">Issued by Arduino Junior Certification Academy — ${new Date().toLocaleDateString()}</p>
      </div>
      <script>window.print();</script>
      </body></html>`);
  },

  checkAchievements(){
    ACHIEVEMENTS.forEach(a=>{
      if(!this.state.unlockedAchievements.includes(a.id) && a.check(this.state)){
        this.state.unlockedAchievements.push(a.id);
        Store.save(this.state);
        this.toastAchievement(a);
      }
    });
  },

  toastAchievement(a){
    const bubble = document.getElementById("buddy-bubble");
    bubble.textContent = `🏅 Achievement unlocked: ${a.name}!`;
    bubble.classList.add("show");
    clearTimeout(this._buddyTimeout);
    this._buddyTimeout = setTimeout(()=>bubble.classList.remove("show"), 5000);
  },

  /* ---------------- CELEBRATION FX ---------------- */
  celebrate(){
    const colors = ["#FF9800","#00979D","#00C853","#ffd54f","#ff5252"];
    for(let i=0;i<26;i++){
      const p = document.createElement("div");
      p.className = "confetti-piece";
      p.style.left = Math.random()*100+"vw";
      p.style.background = colors[Math.floor(Math.random()*colors.length)];
      p.style.animationDelay = (Math.random()*0.4)+"s";
      p.style.animationDuration = (1.8+Math.random()*1)+"s";
      document.body.appendChild(p);
      setTimeout(()=>p.remove(), 3000);
    }
  },
  flyCoin(){
    const startEl = document.getElementById("submit-btn");
    const endEl = document.querySelector(".pill.coins");
    if(!startEl || !endEl) return;
    const startRect = startEl.getBoundingClientRect();
    const endRect = endEl.getBoundingClientRect();
    for(let i=0;i<4;i++){
      const c = document.createElement("div");
      c.className = "coin-fly";
      c.textContent = "🪙";
      c.style.left = startRect.left+"px";
      c.style.top = startRect.top+"px";
      c.style.setProperty("--dx", (endRect.left-startRect.left)+"px");
      c.style.setProperty("--dy", (endRect.top-startRect.top)+"px");
      c.style.animationDelay = (i*0.08)+"s";
      document.body.appendChild(c);
      setTimeout(()=>c.remove(), 1200+i*80);
    }
  },
};

/* ---------------- ROUTER ---------------- */
const Router = {
  go(name){
    document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
    const el = document.getElementById("screen-"+name);
    if(el) el.classList.add("active");
    document.querySelectorAll(".nav-btns button").forEach(b=>b.classList.toggle("active", b.dataset.nav===name));
    window.scrollTo({top:0, behavior:"smooth"});
    if(name==="home") App.renderHome();
    if(name==="achievements") App.renderAchievements();
    if(name==="admin") App.renderAdmin();
    if(name==="students") App.renderStudents();
  }
};

document.addEventListener("DOMContentLoaded", ()=>App.init());
