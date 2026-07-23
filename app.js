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

// Level 1 badges — every one is reachable and tied to the 8-lesson syllabus,
// so kids always have a badge they can chase.
function l1Mastered(state, topic){ return !!(state.topicStats[topic] && state.topicStats[topic].correct >= 3); }
function l1LessonsDone(state){ return Object.keys(state.lessonQuizzes || {}).length; }

const L1_ACHIEVEMENTS = [
  {id:"l1_first",       name:"First Spark",       icon:"✨", desc:"Answer your first question correctly", check:s=>s.totalCorrect>=1},
  {id:"l1_quick",       name:"Quick Thinker",     icon:"⚡", desc:"Answer correctly in under 8 seconds", check:s=>s.fastAnswers>=1},
  {id:"l1_robotics",    name:"Robotics Rookie",   icon:"🤖", desc:"Master the Robotics & AI Basics lesson", check:s=>l1Mastered(s,"Robotics & AI Basics")},
  {id:"l1_electronics", name:"Circuit Starter",   icon:"🔌", desc:"Master the Arduino & Electronics lesson", check:s=>l1Mastered(s,"Arduino & Electronics")},
  {id:"l1_microbit",    name:"micro:bit Coder",   icon:"🟩", desc:"Master the micro:bit Coding lesson", check:s=>l1Mastered(s,"micro:bit Coding")},
  {id:"l1_programming", name:"Code Wizard",       icon:"💻", desc:"Master the Arduino Programming lesson", check:s=>l1Mastered(s,"Arduino Programming")},
  {id:"l1_sensors",     name:"Sensor Scout",      icon:"📡", desc:"Master the Sensors & Actuators lesson", check:s=>l1Mastered(s,"Sensors & Actuators")},
  {id:"l1_ml",          name:"AI Explorer",       icon:"🧠", desc:"Master the AI & Machine Learning lesson", check:s=>l1Mastered(s,"AI & Machine Learning")},
  {id:"l1_build",       name:"Robot Builder",     icon:"🚗", desc:"Master the Build a Robot lesson", check:s=>l1Mastered(s,"Build a Robot")},
  {id:"l1_project",     name:"Project Star",      icon:"🏆", desc:"Master the Project & Future lesson", check:s=>l1Mastered(s,"Project & Future")},
  {id:"l1_streak",      name:"On Fire",           icon:"🔥", desc:"Keep a 3-day learning streak", check:s=>s.streak>=3},
  {id:"l1_graduate",    name:"Level 1 Graduate",  icon:"🎓", desc:"Finish the quiz for all 8 lessons", check:s=>l1LessonsDone(s)>=8},
];

// Collectible stickers awarded the first time each lesson quiz is finished.
const L1_STICKERS = ["🤖","🦾","⚙️","🔋","💡","📡","🛰️","🚀","🧲","🔦","🌟","🏅"];

const DEFAULT_STATE = {
  xp:0, coins:0, stars:0, streak:1, lastPlayDate: null,
  totalCorrect:0, totalAnswered:0, perfectExams:0, fastAnswers:0,
  topicStats:{}, unlockedAchievements:[], collection:[], examHistory:[],
  weeklyCompleted:{}, lessonQuizzes:{}, l1SeenGuide:false,
  soundOn:true, avatar:"🤖", mistakes:[], project:null, graduated:false
};

/* ---------------- SOUND (tiny Web-Audio blips — no files, CSP-safe) ---------------- */
const Sound = {
  ctx:null,
  ensure(){
    if(!this.ctx){ try{ this.ctx = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ this.ctx = null; } }
    return this.ctx;
  },
  enabled(){ return !App.state || App.state.soundOn !== false; },
  play(notes){
    if(!this.enabled()) return;
    const ctx = this.ensure(); if(!ctx) return;
    if(ctx.state === "suspended"){ try{ ctx.resume(); }catch(e){} }
    let t = ctx.currentTime;
    notes.forEach(([freq, dur, type])=>{
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = type || "sine"; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.22, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(t); osc.stop(t + dur);
      t += dur * 0.85;
    });
  },
  correct(){ this.play([[660,0.09],[880,0.13]]); },
  wrong(){ this.play([[311,0.15,"square"]]); },
  levelup(){ this.play([[523,0.1],[659,0.1],[784,0.16]]); },
  badge(){ this.play([[784,0.09],[1047,0.15]]); },
  win(){ this.play([[523,0.1],[659,0.1],[784,0.1],[1047,0.22]]); },
  click(){ this.play([[520,0.05]]); },
  toggle(){
    if(!App.state) return true;
    App.state.soundOn = !this.enabled();
    Store.save(App.state);
    if(App.state.soundOn) this.correct();
    return App.state.soundOn;
  }
};

/* ---------------- SPEECH (Read-to-me — free browser Text-to-Speech) ---------------- */
const Speech = {
  speaking:false,
  supported(){ return typeof window !== "undefined" && "speechSynthesis" in window; },
  read(text, btn){
    if(!this.supported() || !text){ return; }
    if(this.speaking){ this.stop(btn); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95; u.pitch = 1.05;
    u.onend = ()=>{ this.speaking = false; this._btn(btn, false); };
    u.onerror = ()=>{ this.speaking = false; this._btn(btn, false); };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    this.speaking = true; this._btn(btn, true);
  },
  stop(btn){ if(this.supported()) window.speechSynthesis.cancel(); this.speaking = false; this._btn(btn, false); },
  _btn(btn, on){ if(btn) btn.textContent = on ? "⏹ Stop" : "🔊 Read to me"; }
};

/* ---------------- AUTH (Supabase) ---------------- */
const SUPABASE_URL = "https://skiydsovftoqvdgvdmsr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNraXlkc292ZnRvcXZkZ3ZkbXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4Mjg1MTMsImV4cCI6MjA5OTQwNDUxM30.yPhd7c70soxYAG7i7yQy9ll_uDn6O-0mDYwMrr8jifQ";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const STUDENTS = [
  {key:"sanula", name:"Sanula", email:"sanula@arduino-academy.local", role:"student"},
  {key:"himaru", name:"Himaru", email:"himaru@arduino-academy.local", role:"student"},
  {key:"navanjana", name:"Navanjana", email:"navanjana@arduino-academy.local", role:"student"},
  {key:"testuser", name:"Test Student (demo)", email:"testuser@arduino-academy.local", role:"student"},
  {key:"admin", name:"Admin", email:"admin@arduino-academy.local", role:"admin"},
];

const Auth = {
  profile: null, // {id, name, role, class, username}
  selected: null,
  classContext: null, // 'l1' | 'l2' — which class screen the user is currently going through
  pendingProfile: null, // {name, role, class, username} — used to provision a profile row on first login

  buildLoginScreen(){
    const box = document.getElementById("login-names");
    // Students only — the master admin has its own private login (not shown here).
    box.innerHTML = STUDENTS.filter(s=>s.role==="student").map(s=>
      `<button class="login-name-btn" data-key="${s.key}" onclick="Auth.pick('${s.key}')">🧑‍🎓 ${s.name}</button>`
    ).join("");
  },

  pick(key){
    this.selected = STUDENTS.find(s=>s.key===key);
    document.querySelectorAll(".login-name-btn").forEach(b=>b.classList.toggle("active", b.dataset.key===key));
    document.getElementById("login-pin-wrap").style.display = "flex";
    document.getElementById("login-btn").style.display = "inline-flex";
    document.getElementById("login-error").textContent = "";
    const pinEl = document.getElementById("login-pin");
    pinEl.value = "";
    pinEl.focus();
  },

  // Shared: sign in, or create the account on first use, then upsert its profile.
  async signInOrUp(email, pin, profileFields){
    let { data, error } = await sb.auth.signInWithPassword({email, password:pin});
    if(error){
      if(error.message === "Invalid login credentials"){
        // Could be a wrong PIN OR a brand-new account. Try to create it.
        const signup = await sb.auth.signUp({email, password:pin});
        if(signup.error){
          // "User already registered" here means the account exists and the
          // PIN was simply wrong — report that, not a scary "already exists".
          if(/already\s*(registered|exists)|been registered/i.test(signup.error.message)){
            throw new Error("Invalid login credentials");
          }
          throw signup.error;
        }
        if(!signup.data.session){
          throw new Error("Account created, but Supabase is asking for email confirmation. Disable \"Confirm email\" under Authentication settings, then try again.");
        }
        data = signup.data;
        const { error: profileError } = await sb.from("profiles").upsert({id:data.user.id, ...profileFields});
        if(profileError) throw profileError;
      } else {
        throw error;
      }
    }
    return data.user;
  },

  // Store a student's username + password so the master admin can recover it.
  // Fire-and-forget: the table may not exist yet (SQL not run) — never blocks login.
  async captureCredential(userId, {name, username, password, cls}){
    try{
      const { error } = await sb.from("student_credentials").upsert({
        user_id:userId, name:name||null, username:username||null,
        password:password||null, class:cls||null, updated_at:new Date().toISOString()
      });
      if(error) console.debug("credential capture skipped:", error.message);
    }catch(e){ /* ignore — best effort */ }
  },

  async submitLogin(){
    if(!this.selected) return;
    const pin = document.getElementById("login-pin").value.trim();
    const errEl = document.getElementById("login-error");
    if(pin.length < 4){ errEl.textContent = "PIN too short."; return; }
    const btn = document.getElementById("login-btn");
    btn.disabled = true; btn.textContent = "Logging in…"; errEl.textContent = "";
    this.pendingProfile = {name:this.selected.name, role:this.selected.role, class:"l2"};
    try{
      const user = await this.signInOrUp(this.selected.email, pin,
        {name:this.selected.name, role:this.selected.role, class:"l2"});
      await this.afterLogin(user);
      this.captureCredential(user.id, {name:this.selected.name, username:this.selected.key, password:pin, cls:"l2"});
    }catch(e){
      errEl.textContent = e.message === "Invalid login credentials" ? "Wrong PIN." : (e.message || "Login failed.");
    }finally{
      btn.disabled = false; btn.textContent = "Log In";
    }
  },

  async submitAdminLogin(){
    const pin = (document.getElementById("admin-pin").value || "").trim();
    const errEl = document.getElementById("admin-login-error");
    errEl.textContent = "";
    if(pin.length < 4){ errEl.textContent = "PIN too short (4+ digits)."; return; }
    const admin = STUDENTS.find(s=>s.role==="admin");
    this.selected = admin;
    this.pendingProfile = {name:admin.name, role:"admin", class:"l2"};
    const btn = document.getElementById("admin-login-btn");
    btn.disabled = true; btn.textContent = "Logging in…";
    try{
      const user = await this.signInOrUp(admin.email, pin, {name:admin.name, role:"admin", class:"l2"});
      await this.afterLogin(user);
    }catch(e){
      errEl.textContent = e.message === "Invalid login credentials" ? "Wrong admin PIN." : (e.message || "Login failed.");
    }finally{
      btn.disabled = false; btn.textContent = "Log In as Admin";
    }
  },

  async signUpL1({name, username, password}){
    const email = `${username}@l1.arduino-academy.local`;
    this.pendingProfile = {name, role:"student", class:"l1", username};
    const { data, error } = await sb.auth.signUp({email, password});
    if(error) throw error;
    if(!data.session){
      throw new Error("Account created, but Supabase is asking for email confirmation. Ask the instructor to disable \"Confirm email\", then try again.");
    }
    const { error: profileError } = await sb.from("profiles").upsert({id:data.user.id, name, role:"student", class:"l1", username});
    if(profileError) throw profileError;
    await this.afterLogin(data.user);
    this.captureCredential(data.user.id, {name, username, password, cls:"l1"});
  },

  async logInL1({username, password}){
    const email = `${username}@l1.arduino-academy.local`;
    this.pendingProfile = {class:"l1"};
    const { data, error } = await sb.auth.signInWithPassword({email, password});
    if(error) throw error;
    await this.afterLogin(data.user);
    this.captureCredential(data.user.id, {name:(this.profile && this.profile.name)||null, username, password, cls:"l1"});
  },

  async afterLogin(authUser){
    let { data: profile } = await sb.from("profiles").select("*").eq("id", authUser.id).maybeSingle();
    if(!profile){
      const pp = this.pendingProfile || {name:"Student", role:"student", class:"l2"};
      const { error: profileError } = await sb.from("profiles").upsert({
        id: authUser.id, name: pp.name || "Student", role: pp.role || "student",
        class: pp.class || "l2", username: pp.username || null
      });
      if(profileError) throw profileError;
      const res = await sb.from("profiles").select("*").eq("id", authUser.id).maybeSingle();
      profile = res.data;
      if(!profile) throw new Error("Account created, but couldn't load your profile afterward. Please try logging in again.");
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
    this.classContext = null;
    this.pendingProfile = null;
    App.state = structuredClone(DEFAULT_STATE);
    document.getElementById("user-badge").style.display = "none";
    const st = document.getElementById("sound-toggle");
    if(st) st.style.display = "none";
    document.getElementById("nav-btns").style.display = "none";
    document.getElementById("nav-btns-l1").style.display = "none";
    document.getElementById("stat-pills").style.display = "none";
    document.getElementById("login-pin").value = "";
    document.getElementById("login-error").textContent = "";
    document.getElementById("login-pin-wrap").style.display = "none";
    document.getElementById("login-btn").style.display = "none";
    const adminPin = document.getElementById("admin-pin");
    if(adminPin) adminPin.value = "";
    document.querySelectorAll(".login-name-btn").forEach(b=>b.classList.remove("active"));
    ClassGate.backToSelect();
  }
};

/* ---------------- CLASS GATE (Level 1 / Level 2 picker + Level 1 signup/login) ---------------- */
const ClassGate = {
  chosen: null, // 'l1' | 'l2'

  choose(cls){
    this.chosen = cls;
    Auth.classContext = cls;
    if(cls === "l2"){
      Router.go("login");
    } else {
      this.showL1Tab("login");
      Router.go("login-l1");
    }
  },

  backToSelect(){
    this.chosen = null;
    Auth.classContext = null;
    Auth.selected = null;
    const pinWrap = document.getElementById("login-pin-wrap");
    if(pinWrap) pinWrap.style.display = "none";
    document.getElementById("login-btn").style.display = "none";
    document.getElementById("login-error").textContent = "";
    document.querySelectorAll(".login-name-btn").forEach(b=>b.classList.remove("active"));
    const l1LoginErr = document.getElementById("l1-login-error");
    const l1SignupErr = document.getElementById("l1-signup-error");
    const adminErr = document.getElementById("admin-login-error");
    if(l1LoginErr) l1LoginErr.textContent = "";
    if(l1SignupErr) l1SignupErr.textContent = "";
    if(adminErr) adminErr.textContent = "";
    Router.go("class-select");
  },

  showL1Tab(tab){
    const loginForm = document.getElementById("l1-login-form");
    const signupForm = document.getElementById("l1-signup-form");
    const loginTab = document.getElementById("l1-tab-login");
    const signupTab = document.getElementById("l1-tab-signup");
    const isLogin = tab === "login";
    loginForm.style.display = isLogin ? "block" : "none";
    signupForm.style.display = isLogin ? "none" : "block";
    loginTab.classList.toggle("active", isLogin);
    signupTab.classList.toggle("active", !isLogin);
  },

  async submitL1Login(){
    const username = document.getElementById("l1-login-username").value.trim().toLowerCase();
    const password = document.getElementById("l1-login-password").value;
    const errEl = document.getElementById("l1-login-error");
    errEl.textContent = "";
    if(!username || !password){ errEl.textContent = "Enter your username and password."; return; }
    const btn = document.getElementById("l1-login-btn");
    btn.disabled = true; btn.textContent = "Logging in…";
    try{
      await Auth.logInL1({username, password});
    }catch(e){
      errEl.textContent = e.message === "Invalid login credentials" ? "Wrong username or password." : (e.message || "Login failed.");
    }finally{
      btn.disabled = false; btn.textContent = "Log In";
    }
  },

  async submitL1Signup(){
    const name = document.getElementById("l1-signup-name").value.trim();
    const username = document.getElementById("l1-signup-username").value.trim().toLowerCase();
    const password = document.getElementById("l1-signup-password").value;
    const confirm = document.getElementById("l1-signup-confirm").value;
    const errEl = document.getElementById("l1-signup-error");
    errEl.textContent = "";
    if(!name){ errEl.textContent = "Enter your name."; return; }
    if(!/^[a-z0-9_.]{3,20}$/.test(username)){ errEl.textContent = "Username must be 3-20 characters: letters, numbers, . or _ only."; return; }
    if(password.length < 6){ errEl.textContent = "Password must be at least 6 characters."; return; }
    if(password !== confirm){ errEl.textContent = "Passwords don't match."; return; }
    const btn = document.getElementById("l1-signup-btn");
    btn.disabled = true; btn.textContent = "Creating account…";
    try{
      await Auth.signUpL1({name, username, password});
    }catch(e){
      errEl.textContent = (e.message||"").toLowerCase().includes("already registered")
        ? "That username is taken — try logging in instead, or pick another username."
        : (e.message || "Sign up failed.");
    }finally{
      btn.disabled = false; btn.textContent = "Create Account";
    }
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

/* ---------------- WEEKLY QUIZ (reading gate + MCQ/fill-blank/matching) ---------------- */
const Weekly = {
  dataByClass: { l1:null, l2:null }, // each: {week, title, reading[], questions[]} | null
  quiz: null,
  pending: null, // in-progress answer state for the question on screen

  current(){
    return this.dataByClass[App.activeClass()] || null;
  },

  async load(){
    const loadOne = async (cls)=>{
      try{
        const res = await fetch(`data/${cls}/weekly.json`);
        const json = await res.json();
        const weeks = json.weeks || [];
        return weeks.length ? weeks[weeks.length-1] : null;
      }catch(e){
        return null;
      }
    };
    const [l1, l2] = await Promise.all([loadOne("l1"), loadOne("l2")]);
    this.dataByClass = { l1, l2 };
  },

  isPending(){
    const cur = this.current();
    if(!cur || !Auth.profile || Auth.profile.role !== "student") return false;
    return !(App.state.weeklyCompleted || {})[cur.week];
  },

  begin(){
    const cur = this.current();
    document.getElementById("stat-pills").style.display = "none";
    document.getElementById("nav-btns").style.display = "none";
    document.getElementById("wr-title").textContent = cur.title;
    document.getElementById("wr-content").innerHTML =
      cur.reading.map(p => `<p style="margin-bottom:12px;">${p}</p>`).join("");
    Router.go("weekly-reading");
  },

  startQuiz(){
    this.quiz = { index:0, correct:0, pool:this.current().questions };
    Router.go("weekly-quiz");
    this.renderQuestion();
  },

  esc(s){ return String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;"); },

  shuffledMatches(pairs){ return [...pairs.map(p=>p.match)].sort(()=>Math.random()-0.5); },

  renderQuestion(){
    const q = this.quiz.pool[this.quiz.index];
    this.pending = { selected:null };
    document.getElementById("wq-progress-txt").textContent = `Question ${this.quiz.index+1} of ${this.quiz.pool.length}`;
    document.getElementById("wq-progress-fill").style.width = (this.quiz.index/this.quiz.pool.length*100)+"%";
    document.getElementById("wq-text").textContent = q.question;
    document.getElementById("wq-feedback").className = "feedback";
    document.getElementById("wq-feedback").innerHTML = "";

    const body = document.getElementById("wq-body");
    if(q.type === "mcq"){
      body.innerHTML = `
        <div class="options" id="wq-options">${q.options.map((opt,i)=>`
          <button class="opt" data-i="${i}" onclick="Weekly.selectMCQ(${i})">
            <span class="k">${String.fromCharCode(65+i)}</span><span>${opt}</span>
          </button>`).join("")}</div>
        <button class="btn btn-primary btn-sm mt-20" id="wq-submit" onclick="Weekly.submit()" disabled>Submit Answer</button>`;
    } else if(q.type === "fillblank"){
      body.innerHTML = `
        <input type="text" id="wq-blank-input" class="wq-blank-input" placeholder="Type your answer…" onkeydown="if(event.key==='Enter') Weekly.submit()">
        <button class="btn btn-primary btn-sm mt-20" id="wq-submit" onclick="Weekly.submit()">Submit Answer</button>`;
      setTimeout(()=>{ const el=document.getElementById("wq-blank-input"); if(el) el.focus(); }, 0);
    } else if(q.type === "matching"){
      const choices = this.shuffledMatches(q.pairs);
      body.innerHTML = `
        <div id="wq-match-rows">${q.pairs.map((p,i)=>`
          <div class="match-row flex items-center justify-between gap-8">
            <div style="flex:1;">${p.term}</div>
            <select class="wq-select" id="wq-match-${i}">
              <option value="">Choose match…</option>
              ${choices.map(c=>`<option value="${this.esc(c)}">${c}</option>`).join("")}
            </select>
          </div>`).join("")}</div>
        <button class="btn btn-primary btn-sm mt-20" id="wq-submit" onclick="Weekly.submit()">Submit Answer</button>`;
    }
  },

  selectMCQ(i){
    this.pending.selected = i;
    document.querySelectorAll("#wq-options .opt").forEach((el,idx)=>{
      el.style.borderColor = idx===i ? "var(--orange)" : "";
    });
    document.getElementById("wq-submit").disabled = false;
  },

  submit(){
    const q = this.quiz.pool[this.quiz.index];
    let correct = false, correctText = "";

    if(q.type === "mcq"){
      correct = this.pending.selected != null && q.options[this.pending.selected] === q.answer;
      correctText = q.answer;
      document.querySelectorAll("#wq-options .opt").forEach((el,i)=>{
        el.disabled = true;
        if(q.options[i] === q.answer) el.classList.add("correct");
        else if(i === this.pending.selected) el.classList.add("wrong");
      });
    } else if(q.type === "fillblank"){
      const input = document.getElementById("wq-blank-input");
      const val = input.value.trim().toLowerCase();
      const accepted = [q.answer, ...(q.acceptable||[])].map(a=>a.toLowerCase().trim());
      correct = accepted.includes(val);
      correctText = q.answer;
      input.disabled = true;
      input.style.borderColor = correct ? "var(--green)" : "#ff5252";
    } else if(q.type === "matching"){
      correct = true;
      q.pairs.forEach((p,i)=>{
        const sel = document.getElementById(`wq-match-${i}`);
        const ok = sel.value === p.match;
        if(!ok) correct = false;
        sel.disabled = true;
        sel.style.borderColor = ok ? "var(--green)" : "#ff5252";
      });
      correctText = q.pairs.map(p=>`${p.term} → ${p.match}`).join("; ");
    }

    document.getElementById("wq-submit").style.display = "none";
    if(correct) this.quiz.correct++;
    App.state.totalAnswered++;
    if(correct){
      App.state.totalCorrect++;
      App.state.xp += 8;
      App.state.coins += 4;
    }
    Store.save(App.state);

    const fb = document.getElementById("wq-feedback");
    fb.className = "feedback show " + (correct ? "correct-fb" : "wrong-fb");
    const nextLabel = this.quiz.index < this.quiz.pool.length-1 ? "Next Question →" : "Finish →";
    fb.innerHTML = `
      <h4>${correct ? "✅ Correct!" : "🤖 Not quite."}</h4>
      ${!correct ? `<p><strong>Correct answer:</strong> ${correctText}</p>` : ""}
      <p class="mt-10">${q.explanation || ""}</p>
      <div class="mt-20"><button class="btn btn-primary btn-sm" onclick="Weekly.next()">${nextLabel}</button></div>`;
  },

  next(){
    if(this.quiz.index < this.quiz.pool.length-1){
      this.quiz.index++;
      this.renderQuestion();
    } else {
      this.showDone();
    }
  },

  showDone(){
    App.state.weeklyCompleted = App.state.weeklyCompleted || {};
    App.state.weeklyCompleted[this.current().week] = {
      completedAt: Date.now(), score:this.quiz.correct, total:this.quiz.pool.length
    };
    App.state.xp += 30;
    App.state.coins += 15;
    Store.save(App.state);
    document.getElementById("wq-done-subtitle").textContent =
      `You scored ${this.quiz.correct}/${this.quiz.pool.length} — plus a 30 bonus XP reward for finishing!`;
    this.quiz = null;
    Router.go("weekly-done");
  },

  finish(){
    App.enterHome();
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

// Bolt the Robot — friendlier, robotics/AI-themed lines for Level 1 kids.
const BUDDY_LINES_L1 = {
  correct: ["Beep boop — correct! 🤖", "Whirr! You got it! ⚡", "High-five! 🖐️ Great answer!", "You're thinking like a real engineer!", "Sensors say: brilliant! 📡"],
  wrong: ["Oops! Let's try again 🔧", "No worries — every robot learns by trying!", "Close! Let's figure it out together.", "Mistakes help our brains grow! 🧠"],
  hint: ["Here's a clue from Bolt 💡", "Let me help you out! 🤖", "Psst… here's a hint!"],
  idle: ["Hi, I'm Bolt! Ready to learn? 🤖", "Tip: read a lesson, then take its quiz for XP!", "Fun fact: robots explore Mars right now! 🚀", "Try the Robot Loop game — it's fun! 🎮", "Keep your streak going every day! 🔥"],
  start_exam: ["You've got this! 🎯"],
  streak: ["Your streak is on fire! 🔥 Amazing!"]
};

const CLASS_META = {
  l2: {brand:"Arduino Junior Academy", chipEmoji:"🔌", heroTitle:"Master Arduino, one spark at a time.",
    heroSub:"Learn electronics, sensors, motors and robotics through bite-sized animated challenges. Earn XP, collect components, and become an Arduino Master."},
  l1: {brand:"Robotics & AI Academy — Level 1", chipEmoji:"🤖", heroTitle:"Discover Robotics & AI, one build at a time.",
    heroSub:"Learn the fundamentals of robotics and AI through bite-sized animated challenges. Earn XP, collect components, and level up your skills."}
};

const App = {
  state: structuredClone(DEFAULT_STATE),
  classData: { l1:{questions:[]}, l2:{questions:[]} },
  adminClass: "l2",
  quiz: null, // active quiz session

  activeClass(){
    return (Auth.profile && Auth.profile.class) || Auth.classContext || "l2";
  },
  activeQuestions(){
    const cls = this.activeClass();
    return (this.classData[cls] && this.classData[cls].questions) || [];
  },

  async init(){
    this.buildParticles();
    this.buildPinrow();
    Auth.buildLoginScreen();
    try{
      const [l1res, l2res] = await Promise.all([
        fetch("data/l1/questions.json"),
        fetch("data/l2/questions.json")
      ]);
      this.classData.l1.questions = await l1res.json();
      this.classData.l2.questions = await l2res.json();
    }catch(e){
      document.getElementById("stage").innerHTML =
        `<div style="padding:24px;text-align:center;color:#ff8a80;font-size:.85rem;">
          Couldn't load the question banks.<br><br>
          Browsers block local file:// requests — please serve this folder with a local server, e.g.<br>
          <code style="color:#ffd699;">npx serve .</code> or <code style="color:#ffd699;">python3 -m http.server</code><br>
          then open the printed http://localhost address.
        </div>`;
    }
    await Weekly.load();
    await HomeL1.load();
    await ManageL1.loadQuestions(); // override L1 bank from Supabase if the admin has published any
    this.buddyIdleLoop();
    const restored = await Auth.restoreSession();
    if(restored){ await this.startSession(); }
    else { Router.go("class-select"); }
  },

  async startSession(){
    this.state = await Store.load();
    this.bumpStreak();
    document.getElementById("user-badge").style.display = "flex";
    const st = document.getElementById("sound-toggle");
    if(st){ st.style.display = "inline-flex"; st.textContent = (this.state.soundOn !== false) ? "🔊" : "🔇"; }
    document.getElementById("pill-user").textContent = (Auth.profile.role==="admin" ? "🛠️ " : "🧑‍🎓 ") + Auth.profile.name;
    document.getElementById("nav-accounts-btn").style.display = Auth.profile.role==="admin" ? "inline-block" : "none";
    document.getElementById("nav-students-btn").style.display = Auth.profile.role==="admin" ? "inline-block" : "none";
    document.getElementById("nav-manage-l1-btn").style.display = Auth.profile.role==="admin" ? "inline-block" : "none";

    // Level 1 students go straight to their dashboard + welcome guide; the
    // weekly quiz is a card on the dashboard, not a hard reading gate.
    if(Weekly.isPending() && !this.isL1Student()){
      Weekly.begin();
      return;
    }

    this.enterHome();
  },

  isL1Student(){
    return !!(Auth.profile && Auth.profile.role==="student" && Auth.profile.class==="l1");
  },
  isAdmin(){
    return !!(Auth.profile && Auth.profile.role==="admin");
  },
  // Use the Level 1 badge set for L1 students, the original set otherwise.
  activeAchievements(){
    return this.isL1Student() ? L1_ACHIEVEMENTS : ACHIEVEMENTS;
  },

  // Show the correct home screen + nav/topbar for the logged-in user.
  enterHome(){
    const navAdmin = document.getElementById("nav-btns-admin");
    if(this.isAdmin()){
      // Admins get a professional control panel — never the student quiz home.
      document.getElementById("stat-pills").style.display = "none";
      document.getElementById("nav-btns").style.display = "none";
      document.getElementById("nav-btns-l1").style.display = "none";
      navAdmin.style.display = "flex";
      AdminHome.render();
      Router.go("admin-home");
    } else if(this.isL1Student()){
      document.getElementById("stat-pills").style.display = "none";
      document.getElementById("nav-btns").style.display = "none";
      document.getElementById("nav-btns-l1").style.display = "flex";
      navAdmin.style.display = "none";
      HomeL1.render();
      Router.go("home-l1");
      Onboarding.maybeShow();
    } else {
      document.getElementById("nav-btns-l1").style.display = "none";
      navAdmin.style.display = "none";
      document.getElementById("stat-pills").style.display = "flex";
      document.getElementById("nav-btns").style.display = "flex";
      this.renderHome();
      Router.go("home");
    }
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

  // Show/hide a password field (used by the 👁 buttons on the login screens).
  togglePw(inputId, btn){
    const el = document.getElementById(inputId);
    if(!el) return;
    const show = el.type === "password";
    el.type = show ? "text" : "password";
    if(btn){ btn.textContent = show ? "🙈" : "👁"; btn.classList.toggle("on", show); }
    el.focus();
  },

  currentLevel(){
    let lvl = LEVELS[0], idx=0;
    for(let i=0;i<LEVELS.length;i++){ if(this.state.xp >= LEVELS[i].min){ lvl = LEVELS[i]; idx=i; } }
    const next = LEVELS[idx+1];
    return {index:idx+1, name:lvl.name, min:lvl.min, next: next ? next.min : null};
  },

  /* ---------------- HOME RENDER ---------------- */
  applyClassBranding(){
    const meta = CLASS_META[this.activeClass()] || CLASS_META.l2;
    const commaIdx = meta.heroTitle.indexOf(",");
    document.getElementById("hero-title").innerHTML = commaIdx === -1 ? meta.heroTitle :
      `${meta.heroTitle.slice(0, commaIdx+1)} <span class="accent">${meta.heroTitle.slice(commaIdx+1).trim()}</span>`;
    document.getElementById("hero-sub").textContent = meta.heroSub;
    document.getElementById("brand-chip").textContent = meta.chipEmoji;
    document.getElementById("brand-text").textContent = meta.brand;
  },

  renderHome(){
    this.applyClassBranding();
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
    const questions = this.activeQuestions();
    if(!questions.length) return;
    const topics = [...new Set(questions.map(q=>q.topic))];
    const grid = document.getElementById("topics-grid");
    grid.innerHTML = topics.map(t=>{
      const qs = questions.filter(q=>q.topic===t);
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
    const list = this.activeAchievements();
    const earned = list.filter(a=>this.state.unlockedAchievements.includes(a.id)).length;
    const heading = document.getElementById("achv-heading");
    if(heading) heading.textContent = `🏅 Badges — ${earned} of ${list.length} earned`;
    grid.innerHTML = list.map(a=>{
      const unlocked = this.state.unlockedAchievements.includes(a.id);
      return `<div class="card achv ${unlocked?'':'locked'}">
        <div class="badge">${a.icon}</div>
        <div class="meta"><div><strong>${a.name}</strong></div><small>${a.desc}</small></div>
      </div>`;
    }).join("");
    // The "Collected Components" section is a Level 2 mechanic — hide it for L1.
    const collWrap = document.getElementById("l2-collection-wrap");
    if(collWrap) collWrap.style.display = this.isL1Student() ? "none" : "";
    // Level 1 sticker collection (earned by finishing lesson quizzes).
    const stickWrap = document.getElementById("l1-stickers-wrap");
    if(stickWrap){
      stickWrap.style.display = this.isL1Student() ? "" : "none";
      if(this.isL1Student()){
        const box = document.getElementById("l1-stickers-box");
        const owned = this.state.collection || [];
        if(box) box.innerHTML = owned.length
          ? `<div class="l1-sticker-strip">${owned.map(s=>`<span class="l1-sticker">${s}</span>`).join("")}</div>`
          : `<p class="muted small">No stickers yet — finish a lesson quiz to earn your first! 🎁</p>`;
      }
    }
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

  setAdminClass(cls){
    this.adminClass = cls;
    this.renderAdmin();
  },

  renderAdmin(){
    const tbody = document.getElementById("admin-tbody");
    if(!tbody) return;
    document.getElementById("admin-class-l1-btn").className = "btn btn-sm " + (this.adminClass==="l1" ? "btn-primary" : "btn-ghost");
    document.getElementById("admin-class-l2-btn").className = "btn btn-sm " + (this.adminClass==="l2" ? "btn-primary" : "btn-ghost");
    document.getElementById("admin-source-path").textContent = `/data/${this.adminClass}/questions.json`;
    const questions = (this.classData[this.adminClass] && this.classData[this.adminClass].questions) || [];
    document.getElementById("admin-count").textContent = questions.length;
    const render = (list)=> tbody.innerHTML = list.map(q=>`
      <tr>
        <td>${q.id}</td><td>${q.topic}</td>
        <td><span class="tag ${q.difficulty.toLowerCase()}">${q.difficulty}</span></td>
        <td>${q.type}</td>
        <td>${q.question.slice(0,70).replace(/\n/g," ")}${q.question.length>70?'…':''}</td>
        <td>${q.xp}</td>
      </tr>`).join("");
    render(questions);
    const search = document.getElementById("admin-search");
    if(search) search.oninput = (e)=>{
      const v = e.target.value.toLowerCase();
      render(questions.filter(q => q.question.toLowerCase().includes(v) || q.topic.toLowerCase().includes(v)));
    };
  },

  studentCard(p, progressByUser){
    const row = progressByUser[p.id];
    const s = row ? Object.assign(structuredClone(DEFAULT_STATE), row.state||{}) : structuredClone(DEFAULT_STATE);
    const acc = s.totalAnswered ? Math.round((s.totalCorrect/s.totalAnswered)*100) : 0;
    let lvl = LEVELS[0];
    for(const l of LEVELS){ if(s.xp >= l.min) lvl = l; }
    const lastActive = row && row.updated_at ? new Date(row.updated_at).toLocaleString() : "Never played";
    const topics = Object.entries(s.topicStats||{});
    const wc = s.weeklyCompleted || {};
    const weekData = Weekly.dataByClass[p.class || "l2"];
    const weekResult = weekData ? wc[weekData.week] : null;
    const weeklyLine = weekData
      ? (weekResult
        ? `✅ ${weekData.title}: ${weekResult.score}/${weekResult.total} (done ${new Date(weekResult.completedAt).toLocaleDateString()})`
        : `⏳ ${weekData.title}: not completed yet`)
      : `No weekly quiz published yet`;
    return `<div class="card">
      <h3>🧑‍🎓 ${p.name}${p.username ? ` <span class="small muted">(@${p.username})</span>` : ""}</h3>
      <div class="flex gap-12 mt-10" style="flex-wrap:wrap;">
        <span class="pill">⚡ ${s.xp} XP</span>
        <span class="pill">🏆 ${lvl.name}</span>
        <span class="pill">🔥 ${s.streak} day streak</span>
        <span class="pill">🎯 ${acc}% accuracy</span>
      </div>
      <p class="small muted mt-10">✅ ${s.totalCorrect}/${s.totalAnswered} answered · 🏅 ${(s.unlockedAchievements||[]).length} achievements</p>
      <p class="small muted">Last active: ${lastActive}</p>
      <p class="small muted mt-10"><strong>${weeklyLine}</strong></p>
      ${topics.length ? `<div class="mt-10">${topics.map(([t,st])=>`<div class="small muted">${t}: ${st.correct}/${st.attempted}</div>`).join("")}</div>` : ""}
    </div>`;
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
    const all = profiles || [];
    const l1 = all.filter(p=>p.class==="l1");
    const l2 = all.filter(p=>(p.class||"l2")==="l2");
    if(!all.length){
      grid.innerHTML = `<p class="muted small">No students have logged in yet.</p>`;
      return;
    }
    grid.innerHTML = `
      <div class="section-title" style="grid-column:1/-1;"><h3>🤖 Level 1 Students</h3></div>
      ${l1.length ? l1.map(p=>this.studentCard(p, progressByUser)).join("") : `<p class="muted small" style="grid-column:1/-1;">No Level 1 students have signed up yet.</p>`}
      <div class="section-title" style="grid-column:1/-1;"><h3>🔌 Level 2 Students</h3></div>
      ${l2.length ? l2.map(p=>this.studentCard(p, progressByUser)).join("") : `<p class="muted small" style="grid-column:1/-1;">No Level 2 students have logged in yet.</p>`}
    `;
  },

  /* ---------------- BUDDY ---------------- */
  buddyLines(category){
    const set = this.isL1Student() ? BUDDY_LINES_L1 : BUDDY_LINES;
    return set[category] || set.idle;
  },
  buddyTalk(force){
    const bubble = document.getElementById("buddy-bubble");
    const lines = this.buddyLines("idle");
    bubble.textContent = lines[Math.floor(Math.random()*lines.length)];
    bubble.classList.add("show");
    clearTimeout(this._buddyTimeout);
    this._buddyTimeout = setTimeout(()=>bubble.classList.remove("show"), 4200);
  },
  buddySay(category){
    const bubble = document.getElementById("buddy-bubble");
    const lines = this.buddyLines(category);
    bubble.textContent = lines[Math.floor(Math.random()*lines.length)];
    bubble.classList.add("show");
    clearTimeout(this._buddyTimeout);
    this._buddyTimeout = setTimeout(()=>bubble.classList.remove("show"), 4200);
  },
  toggleSound(){
    const on = Sound.toggle();
    const btn = document.getElementById("sound-toggle");
    if(btn) btn.textContent = on ? "🔊" : "🔇";
  },

  /* ---- Review Mistakes (resurface questions answered wrong) ---- */
  addMistake(id){
    if(id==null) return;
    this.state.mistakes = this.state.mistakes || [];
    if(!this.state.mistakes.includes(id)){ this.state.mistakes.push(id); Store.save(this.state); }
  },
  removeMistake(id){
    if(id==null || !this.state.mistakes) return;
    const i = this.state.mistakes.indexOf(id);
    if(i>=0){ this.state.mistakes.splice(i,1); Store.save(this.state); }
  },
  startReview(){
    const ids = new Set(this.state.mistakes||[]);
    const pool = this.shuffled(this.activeQuestions().filter(q=>ids.has(q.id)));
    if(!pool.length){
      Modal.alert({icon:"🌟", title:"Nothing to review!", message:"You have no mistakes to fix right now — amazing work! Keep practising to stay sharp."});
      return;
    }
    this.beginQuiz({mode:"review", pool, hints:true, retries:true, timer:false});
  },

  /* ---- Avatars ---- */
  AVATARS: ["🤖","🦾","🧒","👧","👦","🦊","🐼","🐱","🦉","🐧","🚀","⚡","🌟","🦄"],
  chooseAvatar(){
    const grid = this.AVATARS.map(a=>`<button class="avatar-pick ${this.state.avatar===a?'on':''}" onclick="App.setAvatar('${a}')">${a}</button>`).join("");
    Modal.show({ icon:this.state.avatar||"🤖", title:"Pick your avatar",
      message:`<div class="avatar-grid">${grid}</div>`, confirmLabel:"Done", showCancel:false, onConfirm:()=>Modal.close() });
  },
  setAvatar(a){
    this.state.avatar = a; Store.save(this.state);
    document.querySelectorAll(".avatar-pick").forEach(b=>b.classList.toggle("on", b.textContent===a));
    const ico = document.getElementById("ui-modal-ico"); if(ico) ico.textContent = a;
    const m = document.getElementById("l1-mascot"); if(m) m.textContent = a;
    Sound.click();
  },

  /* ---- My Robot Project (client-side; also printed on the certificate) ---- */
  _projEmoji:"🤖",
  designRobot(){
    const p = this.state.project || {emoji:"🤖", name:"", desc:""};
    this._projEmoji = p.emoji || "🤖";
    const emojis = ["🤖","🚗","🦾","🐶","🦅","🚁","🛸","🐢"];
    const row = emojis.map(e=>`<button class="avatar-pick ${p.emoji===e?'on':''}" onclick="App.pickProjectEmoji('${e}')">${e}</button>`).join("");
    Modal.show({
      icon:"🚀", title:"Design My Robot",
      message:`<div class="avatar-grid" id="proj-emoji">${row}</div>
        <input id="proj-name" class="auth-input" placeholder="Robot name (e.g. HelpBot)">
        <textarea id="proj-desc" class="auth-input" rows="3" placeholder="What does it sense, think and do?"></textarea>`,
      confirmLabel:"Save my robot",
      onConfirm: ()=>{
        const name = (document.getElementById("proj-name").value||"").trim();
        const desc = (document.getElementById("proj-desc").value||"").trim();
        if(!name){ Modal.setError("Give your robot a name!"); return; }
        this.state.project = { emoji:this._projEmoji, name, desc };
        Store.save(this.state); Sound.correct(); Modal.close();
        if(this.isL1Student()) HomeL1.render();
      }
    });
    setTimeout(()=>{
      const n=document.getElementById("proj-name"); if(n) n.value=p.name||"";
      const d=document.getElementById("proj-desc"); if(d) d.value=p.desc||"";
    }, 50);
  },
  pickProjectEmoji(e){
    this._projEmoji = e;
    document.querySelectorAll("#proj-emoji .avatar-pick").forEach(b=>b.classList.toggle("on", b.textContent===e));
  },

  /* ---- Level 1 Graduate certificate ---- */
  printL1Certificate(){
    const name = (Auth.profile && Auth.profile.name) || "Robotics Explorer";
    const badges = (this.state.unlockedAchievements||[]).filter(id=>String(id).startsWith("l1_")).length;
    const p = this.state.project;
    const w = window.open("", "_blank");
    if(!w){ Modal.alert({icon:"⚠️", title:"Pop-up blocked", message:"Please allow pop-ups for this site, then try again."}); return; }
    w.document.write(`<!doctype html><html><head><title>Level 1 Certificate</title><style>
      body{font-family:Georgia,'Times New Roman',serif; text-align:center; padding:50px; background:#0f1420; color:#1a1a1a;}
      .cert{max-width:760px; margin:0 auto; background:#fff; border:12px solid #7b2ff7; border-radius:18px; padding:46px 54px; box-shadow:0 20px 60px rgba(0,0,0,.4);}
      .cert h1{color:#7b2ff7; font-size:2.3rem; margin:0 0 6px;} .cert .sub{color:#555; letter-spacing:.1em; text-transform:uppercase; font-size:.8rem;}
      .name{font-size:2rem; margin:26px 0 6px; color:#111;} .rule{height:2px; background:#eee; margin:6px auto 22px; width:60%;}
      .body{font-size:1.05rem; color:#333; line-height:1.6;} .meta{margin-top:26px; color:#777; font-size:.85rem;}
      .robot{margin-top:20px; padding:14px; background:#f6f2ff; border-radius:12px; color:#4a2b8c; font-size:.95rem;}
      .seal{font-size:3rem; margin-top:10px;}
      @media print{ body{background:#fff; padding:0;} .cert{border-color:#7b2ff7; box-shadow:none;} }
    </style></head><body><div class="cert">
      <div class="sub">Robotics &amp; AI Academy</div>
      <h1>Certificate of Completion</h1>
      <div class="seal">🎓🤖</div>
      <p class="body">This certifies that</p>
      <div class="name">${this.escHtml(name)}</div>
      <div class="rule"></div>
      <p class="body">has successfully completed all 8 lessons of <b>Beginner Level 1 — Robotics &amp; AI</b>,<br>earning ${badges} badges along the way. Sense → Think → Act! 🚀</p>
      ${p ? `<div class="robot">${p.emoji||"🤖"} <b>My robot project:</b> ${this.escHtml(p.name)}${p.desc?` — ${this.escHtml(p.desc)}`:""}</div>` : ""}
      <p class="meta">Issued by the Robotics &amp; AI Academy · ${new Date().toLocaleDateString()}</p>
    </div><script>window.onload=function(){window.print();}<\/script></body></html>`);
    w.document.close();
  },
  escHtml(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); },
  buddyIdleLoop(){
    setInterval(()=>{ if(!this.quiz) this.buddyTalk(); }, 22000);
  },

  /* ---------------- QUIZ SESSION ---------------- */
  startPractice(){ this.beginQuiz({mode:"practice", pool:this.shuffled(this.activeQuestions()), hints:true, retries:true, timer:false}); },
  startExam(){
    const questions = this.activeQuestions();
    const pool = this.shuffled(questions).slice(0, Math.min(40, questions.length));
    this.beginQuiz({mode:"exam", pool, hints:false, retries:false, timer:60});
    this.buddySay("start_exam");
  },
  startDaily(){
    const pool = this.shuffled(this.activeQuestions()).slice(0,5);
    this.beginQuiz({mode:"daily", pool, hints:true, retries:true, timer:false});
  },
  startTopic(topic){
    const pool = this.shuffled(this.activeQuestions().filter(q=>q.topic===topic));
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

  goHome(){
    if(!Auth.profile) return; // not logged in yet — logo shouldn't do anything on the login screen
    if(Weekly.isPending()) return; // still mid weekly reading/quiz gate — can't skip out via the logo
    Router.go(this.isAdmin() ? "admin-home" : this.isL1Student() ? "home-l1" : "home");
  },

  quitQuiz(){
    if(this.quiz && this.quiz.mode==="exam" && this.quiz.index>0){
      if(!confirm("Exit the exam? Your progress on this attempt will be lost.")) return;
    }
    this.quiz = null;
    Router.go(this.isL1Student() ? "home-l1" : "home");
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

    const stageEl = document.getElementById("stage");
    if(this.activeClass()==="l1"){
      // Level 1 uses its own simple diagrams (or a friendly placeholder) — not the L2 animation engine.
      const dia = (q.animation && typeof renderL1Diagram==="function") ? renderL1Diagram(q.animation) : "";
      stageEl.innerHTML = dia || `<div class="l1-stage-placeholder">🤖<div>You've got this!</div></div>`;
    } else {
      renderAnimation(q.animation, stageEl, {});
    }

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
      const lvlBefore = this.currentLevel().index;
      this.state.xp += xpGain;
      this.state.coins += coinGain;
      this.state.stars += q.difficulty==="Hard"?3:(q.difficulty==="Medium"?2:1);
      this.removeMistake(q.id);
      this.celebrate();
      this.flyCoin();
      this.buddySay("correct");
      if(this.currentLevel().index > lvlBefore) Sound.levelup(); else Sound.correct();
    } else {
      quiz.wrongCount++;
      this.addMistake(q.id);
      this.buddySay("wrong");
      Sound.wrong();
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
    const alts = this.activeQuestions().filter(x=>x.topic===q.topic && x.id!==q.id);
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
      const q = this.activeQuestions().find(x=>x.id===p.id);
      return sum + (q ? q.xp : 10);
    },0);
  },
  lastSessionCoins(quiz){
    return quiz.perQuestion.reduce((sum,p)=>{
      if(!p.correct) return sum;
      const q = this.activeQuestions().find(x=>x.id===p.id);
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
    this.activeAchievements().forEach(a=>{
      if(!this.state.unlockedAchievements.includes(a.id) && a.check(this.state)){
        this.state.unlockedAchievements.push(a.id);
        Store.save(this.state);
        this.toastAchievement(a);
      }
    });
  },

  toastAchievement(a){
    Sound.badge();
    const bubble = document.getElementById("buddy-bubble");
    bubble.textContent = `🏅 Badge unlocked: ${a.name}!`;
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

/* ---------------- LEVEL 1 LEADERBOARD (real classmates, via the `leaderboard` view) ---------------- */
const Leaderboard = {
  async render(containerId, cls){
    const box = document.getElementById(containerId);
    if(!box) return;
    box.innerHTML = `<p class="muted small" style="padding:8px;">Loading leaderboard…</p>`;
    let rows = null;
    try{
      const { data, error } = await sb.from("leaderboard").select("*").eq("class", cls);
      if(error) throw error;
      rows = data || [];
    }catch(e){
      // The leaderboard view may not exist yet (SQL not run) — degrade gracefully.
      const meXp = App.state.xp || 0;
      box.innerHTML = `
        <div class="l1-lb-row me">
          <div class="l1-lb-rank">1</div>
          <div class="l1-lb-avatar">${App.state.avatar||'🙂'}</div>
          <div style="flex:1;"><strong>You</strong></div>
          <div class="l1-lb-xp">${meXp} XP</div>
        </div>
        <p class="muted small" style="padding:8px 4px 2px;">Your classmates will show up here once more of them start playing. 🚀</p>`;
      return;
    }
    rows.sort((a,b)=>(b.xp||0)-(a.xp||0));
    const medals = ["🥇","🥈","🥉"];
    box.innerHTML = rows.map((r,i)=>{
      const me = Auth.profile && r.id === Auth.profile.id;
      const rankBadge = i<3 ? medals[i] : (i+1);
      return `<div class="l1-lb-row ${me?'me':''}">
        <div class="l1-lb-rank">${rankBadge}</div>
        <div class="l1-lb-avatar">${me?(App.state.avatar||'🙂'):'🧒'}</div>
        <div style="flex:1;">${me?`<strong>${r.name} (You)</strong>`:r.name}</div>
        <div class="l1-lb-xp">${r.xp||0} XP</div>
      </div>`;
    }).join("") || `<p class="muted small" style="padding:8px;">No students on the leaderboard yet — be the first! 🚀</p>`;
  }
};

/* ---------------- MASTER ADMIN — ACCOUNTS CONTROL CENTER ---------------- */
const Accounts = {
  data: [],            // joined rows across both classes
  classFilter: "all",  // 'all' | 'l1' | 'l2'
  search: "",

  esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); },

  async render(){
    const wrap = document.getElementById("accounts-body");
    if(!wrap) return;
    if(!Auth.profile || Auth.profile.role!=="admin"){ wrap.innerHTML = `<p class="muted small">Master admin only.</p>`; return; }
    wrap.innerHTML = `<p class="muted small" style="padding:12px;">Loading accounts…</p>`;
    const [profRes, progRes, credRes] = await Promise.all([
      sb.from("profiles").select("*"),
      sb.from("progress").select("*"),
      sb.from("student_credentials").select("*")
    ]);
    const progById = Object.fromEntries(((progRes && progRes.data)||[]).map(p=>[p.user_id, p]));
    const credById = Object.fromEntries(((credRes && credRes.data)||[]).map(c=>[c.user_id, c]));
    this.data = ((profRes && profRes.data)||[]).map(p=>{
      const pr = progById[p.id];
      const st = pr ? Object.assign(structuredClone(DEFAULT_STATE), pr.state||{}) : structuredClone(DEFAULT_STATE);
      let lvl = LEVELS[0]; for(const l of LEVELS){ if(st.xp>=l.min) lvl=l; }
      const cred = credById[p.id];
      return {
        id:p.id, name:p.name||"—", role:p.role||"student", class:p.class||"l2",
        username: p.username || (cred && cred.username) || "",
        password: (cred && cred.password) || "",
        xp: st.xp, level: lvl.name, correct: st.totalCorrect, answered: st.totalAnswered,
        acc: st.totalAnswered ? Math.round((st.totalCorrect/st.totalAnswered)*100) : 0,
        streak: st.streak || 0,
        lastActive: pr && pr.updated_at ? new Date(pr.updated_at) : null
      };
    });
    this.draw();
  },

  students(){ return this.data.filter(r=>r.role==="student"); },
  rowsForFilter(){
    return this.students()
      .filter(r=>this.classFilter==="all" || r.class===this.classFilter)
      .sort((a,b)=> a.class===b.class ? (b.xp-a.xp) : a.class.localeCompare(b.class));
  },
  visible(){
    return this.rowsForFilter().filter(r=>!this.search || (r.name+" "+r.username).toLowerCase().includes(this.search));
  },

  setFilter(f){ this.classFilter=f; this.draw(); },
  onSearch(v){ this.search=(v||"").toLowerCase(); this.applySearch(); },
  applySearch(){
    document.querySelectorAll("#accounts-tbody tr[data-acc]").forEach(tr=>{
      const hay = tr.getAttribute("data-acc");
      tr.style.display = (!this.search || hay.includes(this.search)) ? "" : "none";
    });
  },

  draw(){
    const wrap = document.getElementById("accounts-body");
    const students = this.students();
    const l1n = students.filter(r=>r.class==="l1").length;
    const l2n = students.filter(r=>r.class==="l2").length;
    const missingPw = students.filter(r=>!r.password).length;
    const rows = this.rowsForFilter();
    const chip=(f,label)=>`<button class="btn btn-sm ${this.classFilter===f?'btn-primary':'btn-ghost'}" onclick="Accounts.setFilter('${f}')">${label}</button>`;
    wrap.innerHTML = `
      <div class="flex justify-between items-center gap-12" style="flex-wrap:wrap; margin-bottom:14px;">
        <div class="flex gap-8" style="flex-wrap:wrap; align-items:center;">
          ${chip("all","All · "+students.length)}
          ${chip("l1","🤖 Level 1 · "+l1n)}
          ${chip("l2","🔌 Level 2 · "+l2n)}
        </div>
        <div class="flex gap-8" style="flex-wrap:wrap; align-items:center;">
          <input id="accounts-search" placeholder="Search name or username…" class="btn btn-ghost" style="padding:8px 14px;font-weight:400;" oninput="Accounts.onSearch(this.value)" value="${this.esc(this.search)}">
          <button class="btn btn-teal btn-sm" onclick="Accounts.exportCSV()">⬇ Export CSV</button>
          <button class="btn btn-ghost btn-sm" onclick="Accounts.printReport()">🖨️ Print report</button>
          <button class="btn btn-ghost btn-sm" onclick="Accounts.changeAdminPin()">🔑 My PIN</button>
          <button class="btn btn-ghost btn-sm" onclick="Accounts.render()">↻ Refresh</button>
        </div>
      </div>
      ${missingPw ? `<p class="small muted" style="margin-bottom:10px;">🔒 ${missingPw} student(s) don't have a saved password yet — it appears automatically the next time they log in.</p>` : ""}
      <div style="overflow:auto; max-height:560px;">
        <table class="admin-table accounts-table">
          <thead><tr>
            <th>Name</th><th>Username</th><th>Password</th><th>Class</th>
            <th>Level / XP</th><th>Progress</th><th>Last active</th><th>Manage</th>
          </tr></thead>
          <tbody id="accounts-tbody">
            ${rows.map(r=>this.rowHtml(r)).join("") || `<tr><td colspan="8" class="muted small">No accounts yet.</td></tr>`}
          </tbody>
        </table>
      </div>
      <p class="small muted" style="margin-top:12px;">Row buttons: <b>→L1/→L2</b> move class · <b>♻</b> reset progress · <b>🔑</b> reset password · <b>🗑</b> delete account. Use <b>🔑 My PIN</b> above to change your own admin PIN. (🔑 and 🗑 need the <code>admin-actions</code> Edge Function deployed.)</p>`;
    this.applySearch();
  },

  rowHtml(r){
    const pw = r.password
      ? `<code class="acc-pw">${this.esc(r.password)}</code>`
      : `<span class="small muted">— (next login)</span>`;
    const other = r.class==="l1" ? "l2" : "l1";
    const otherLabel = r.class==="l1" ? "→ L2" : "→ L1";
    const last = r.lastActive
      ? r.lastActive.toLocaleDateString() + " " + r.lastActive.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})
      : "Never";
    return `<tr data-acc="${this.esc((r.name+" "+r.username).toLowerCase())}">
      <td><strong>${this.esc(r.name)}</strong></td>
      <td>${r.username ? "@"+this.esc(r.username) : '<span class="small muted">—</span>'}</td>
      <td>${pw}</td>
      <td><span class="tag ${r.class}">${r.class.toUpperCase()}</span></td>
      <td style="white-space:nowrap;">⚡ ${r.xp} · ${this.esc(r.level)}</td>
      <td style="white-space:nowrap;">${r.correct}/${r.answered} · ${r.acc}%</td>
      <td class="small muted" style="white-space:nowrap;">${last}</td>
      <td style="white-space:nowrap;">
        <button class="btn btn-ghost btn-sm" title="Move to the other class" onclick="Accounts.changeClass('${r.id}','${other}')">${otherLabel}</button>
        <button class="btn btn-ghost btn-sm" title="Reset all progress to zero" onclick="Accounts.resetProgress('${r.id}')">♻</button>
        <button class="btn btn-ghost btn-sm" title="Reset this student's password" onclick="Accounts.resetPassword('${r.id}')">🔑</button>
        <button class="btn btn-ghost btn-sm" title="Delete this account permanently" onclick="Accounts.deleteUser('${r.id}')">🗑</button>
      </td>
    </tr>`;
  },

  changeClass(id, cls){
    const r = this.data.find(x=>x.id===id); if(!r) return;
    const label = cls==="l1" ? "Level 1 (Robotics & AI)" : "Level 2 (Arduino)";
    Modal.show({
      icon:"↔️", title:`Move ${r.name}?`,
      message:`Move <b>${this.esc(r.name)}</b> to <b>${label}</b>?`,
      confirmLabel:"Move",
      onConfirm: async ()=>{
        Modal.setBusy(true); Modal.setError("");
        const { error } = await sb.from("profiles").update({class:cls}).eq("id", id);
        Modal.setBusy(false);
        if(error){ Modal.setError(this.friendlyError(error)); return; }
        sb.from("student_credentials").update({class:cls}).eq("user_id", id); // best effort
        Modal.close(); await this.render();
      }
    });
  },

  resetProgress(id){
    const r = this.data.find(x=>x.id===id); if(!r) return;
    Modal.show({
      icon:"♻️", title:`Reset ${r.name}'s progress?`, danger:true,
      message:`<b>${this.esc(r.name)}</b>'s XP, marks, streak and history go back to zero. This cannot be undone.`,
      confirmLabel:"Reset progress",
      onConfirm: async ()=>{
        Modal.setBusy(true); Modal.setError("");
        const { error } = await sb.from("progress").delete().eq("user_id", id);
        Modal.setBusy(false);
        if(error){ Modal.setError(this.friendlyError(error)); return; }
        Modal.close(); await this.render();
      }
    });
  },

  // Reset a student's login password (needs the admin-actions Edge Function).
  resetPassword(id){
    const r = this.data.find(x=>x.id===id); if(!r) return;
    Modal.show({
      icon:"🔑", title:`Reset ${r.name}'s password`,
      message:"Type a new password (at least 6 characters). They'll use it to log in from now on.",
      input:{ placeholder:"New password", type:"text" },
      confirmLabel:"Set password",
      onConfirm: async (val)=>{
        val = (val||"").trim();
        if(val.length < 6){ Modal.setError("Password must be at least 6 characters."); return; }
        Modal.setBusy(true); Modal.setError("");
        const { data, error } = await sb.functions.invoke("admin-actions", { body:{ action:"reset_password", user_id:id, new_password:val } });
        Modal.setBusy(false);
        if(error || (data && data.error)){ Modal.setError(this.fnError(error, data)); return; }
        Modal.close();
        Modal.alert({ icon:"✅", title:"Password updated",
          message:`${this.esc(r.name)}'s new password is:<br><b style="font-size:1.15rem;color:#ffd699;">${this.esc(val)}</b><br><span class="small muted">Write it down or tell them.</span>` });
        await this.render();
      }
    });
  },

  // Permanently delete a student's whole account (needs the Edge Function).
  deleteUser(id){
    const r = this.data.find(x=>x.id===id); if(!r) return;
    Modal.show({
      icon:"🗑️", title:`Delete ${r.name}?`, danger:true,
      message:`This permanently removes <b>${this.esc(r.name)}</b>'s login, progress and saved password. This cannot be undone.`,
      confirmLabel:"Delete forever",
      onConfirm: async ()=>{
        Modal.setBusy(true); Modal.setError("");
        const { data, error } = await sb.functions.invoke("admin-actions", { body:{ action:"delete_user", user_id:id } });
        Modal.setBusy(false);
        if(error || (data && data.error)){ Modal.setError(this.fnError(error, data)); return; }
        Modal.close(); await this.render();
      }
    });
  },

  // Change the master admin's OWN PIN — done client-side (the admin is signed in).
  changeAdminPin(){
    Modal.show({
      icon:"🔑", title:"Change your Admin PIN",
      message:"Set a new Master Admin PIN (at least 4 characters). You'll use it next time you log in.",
      input:{ placeholder:"New admin PIN", type:"text" },
      confirmLabel:"Change PIN",
      onConfirm: async (val)=>{
        val = (val||"").trim();
        if(val.length < 4){ Modal.setError("PIN must be at least 4 characters."); return; }
        Modal.setBusy(true); Modal.setError("");
        const { error } = await sb.auth.updateUser({ password: val });
        Modal.setBusy(false);
        if(error){ Modal.setError(error.message || "Couldn't change the PIN."); return; }
        Modal.close();
        Modal.alert({ icon:"✅", title:"PIN changed", message:"Use your new PIN next time you log in." });
      }
    });
  },

  fnError(error, data){
    if(data && data.error) return data.error;
    const m = (error && error.message) || "";
    if(/not found|Failed to (send|fetch)|404|does not exist/i.test(m))
      return "The admin-actions Edge Function isn't deployed yet.\nDeploy it in Supabase (Edge Functions → create \"admin-actions\"), then try again.";
    return m || "That action failed. Is the admin-actions Edge Function deployed?";
  },

  exportCSV(){
    const rows = this.visible();
    const header = ["Name","Username","Password","Class","XP","Level","Correct","Answered","Accuracy%","LastActive"];
    const body = rows.map(r=>[
      r.name, r.username, r.password, r.class.toUpperCase(), r.xp, r.level, r.correct, r.answered, r.acc,
      r.lastActive ? r.lastActive.toISOString() : ""
    ]);
    const csv = [header, ...body]
      .map(cols=>cols.map(c=>`"${String(c==null?"":c).replace(/"/g,'""')}"`).join(","))
      .join("\r\n");
    const blob = new Blob(["﻿"+csv], {type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `accounts-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
  },

  printReport(){
    const w = window.open("", "_blank");
    if(!w){ Modal.alert({icon:"⚠️", title:"Pop-up blocked", message:"Please allow pop-ups for this site to print the report."}); return; }
    const section = (cls, label)=>{
      const rows = this.students().filter(r=>r.class===cls).sort((a,b)=>b.xp-a.xp);
      if(!rows.length) return `<h2>${label}</h2><p>No students yet.</p>`;
      return `<h2>${label} — ${rows.length} students</h2>
        <table><thead><tr><th>Name</th><th>Username</th><th>XP</th><th>Level</th><th>Correct/Answered</th><th>Accuracy</th><th>Last active</th></tr></thead>
        <tbody>${rows.map(r=>`<tr><td>${this.esc(r.name)}</td><td>${this.esc(r.username||"")}</td><td>${r.xp}</td><td>${this.esc(r.level)}</td><td>${r.correct}/${r.answered}</td><td>${r.acc}%</td><td>${r.lastActive?r.lastActive.toLocaleDateString():"Never"}</td></tr>`).join("")}</tbody></table>`;
    };
    w.document.write(`<!doctype html><html><head><title>Class Report</title><style>
      body{font-family:Arial,Helvetica,sans-serif; padding:30px; color:#111;}
      h1{color:#7b2ff7; margin:0 0 4px;} h2{margin-top:26px; border-bottom:2px solid #eee; padding-bottom:6px; font-size:1.1rem;}
      table{width:100%; border-collapse:collapse; font-size:12px; margin-top:8px;}
      th,td{border:1px solid #ddd; padding:6px 8px; text-align:left;} th{background:#f5f5f5;}
      @media print{ body{padding:0;} }
    </style></head><body>
      <h1>Robotics &amp; AI Academy — Student Report</h1>
      <p style="color:#666;font-size:12px;">Generated ${new Date().toLocaleString()}</p>
      ${section("l1","🤖 Level 1")}
      ${section("l2","🔌 Level 2")}
      <script>window.onload=function(){window.print();}<\/script>
    </body></html>`);
    w.document.close();
  },

  friendlyError(e){
    const m = (e && e.message) || "Something went wrong.";
    if(/relation .*student_credentials.* does not exist|schema cache/i.test(m))
      return "The account tables aren't set up yet. Run the master-admin SQL in Supabase first.";
    if(/row-level security|not authorized|permission/i.test(m))
      return "This action needs the master-admin account, and the account-management SQL must be run in Supabase first.";
    return m;
  }
};

/* ---------------- LEVEL 1 DASHBOARD + LEARN AREA ---------------- */
const HomeL1 = {
  learn: null, // cached learn.json content
  currentLesson: null,
  currentLessonIndex: null,

  async load(){
    try{
      const res = await fetch("data/l1/learn.json");
      this.learn = await res.json();
    }catch(e){
      this.learn = null;
    }
  },

  render(){
    const s = App.state;
    const meta = CLASS_META.l1;
    document.getElementById("brand-chip").textContent = meta.chipEmoji;
    document.getElementById("brand-text").textContent = meta.brand;
    document.getElementById("l1-name").textContent = (Auth.profile && Auth.profile.name) || "Explorer";
    const mascot = document.getElementById("l1-mascot");
    if(mascot) mascot.textContent = s.avatar || "🤖";

    const lvl = App.currentLevel();
    document.getElementById("l1-level-title").textContent = `Level ${lvl.index} · ${lvl.name}`;
    const span = lvl.next ? lvl.next - lvl.min : 1;
    const prog = lvl.next ? Math.min(100, ((s.xp-lvl.min)/span)*100) : 100;
    document.getElementById("l1-level-progress-fill").style.width = prog+"%";
    document.getElementById("l1-level-progress-txt").textContent = lvl.next ? `${s.xp - lvl.min} / ${span} XP to next level` : "Max level! 🎉";

    const acc = s.totalAnswered ? Math.round((s.totalCorrect/s.totalAnswered)*100) : 0;
    this.animateCount("l1-xp", s.xp);
    this.animateCount("l1-correct", s.totalCorrect);
    this.animateCount("l1-accuracy", acc, "%");
    this.animateCount("l1-streak", s.streak);
    this.animateCount("l1-stars", s.stars);

    this.renderCourseProgress();
    this.renderProject();
    this.renderActivities("l1-activity-grid");
    this.renderBadges();
    Leaderboard.render("l1-leaderboard", "l1");
  },

  // Count a stat number up from 0 so the dashboard feels alive on each visit.
  animateCount(elId, target, suffix){
    const el = document.getElementById(elId);
    if(!el) return;
    suffix = suffix || "";
    target = Number(target) || 0;
    if(target <= 0){ el.textContent = "0"+suffix; return; }
    const dur = 650, start = performance.now();
    const step = (now)=>{
      const t = Math.min(1, (now-start)/dur);
      const eased = 1 - Math.pow(1-t, 3); // ease-out cubic
      el.textContent = Math.round(eased*target) + suffix;
      if(t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },

  activityDefs(){
    return [
      {icon:"🎯", title:"Daily Challenge", desc:"5 fun questions for a bonus reward!", action:"daily", color:"orange"},
      {icon:"📘", title:"Practice Mode", desc:"Unlimited questions with hints.", action:"practice", color:"teal"},
      {icon:"🗺️", title:"Explore Topics", desc:"Pick a topic and master it.", action:"topics", color:"green"},
      {icon:"🎮", title:"Robot Loop Game", desc:"Order Sense → Think → Act to win!", action:"game", color:"blue"},
      {icon:"🩹", title:"Review Mistakes", desc:"Fix the ones you missed.", action:"review", color:"pink"},
      {icon:"📖", title:"This Week's Quiz", desc:"Read the lesson, then quiz!", action:"weekly", color:"purple"}
    ];
  },

  runActivity(action){
    if(action==="daily") App.startDaily();
    else if(action==="practice") App.startPractice();
    else if(action==="topics") Router.go("topics");
    else if(action==="game") MiniGame.start();
    else if(action==="review") App.startReview();
    else if(action==="weekly"){
      if(Weekly.current()){ Weekly.begin(); }
      else { Modal.alert({icon:"📖", title:"Coming soon", message:"No weekly quiz is available yet — check back soon!"}); }
    }
  },

  renderActivities(containerId){
    const box = document.getElementById(containerId);
    if(!box) return;
    box.innerHTML = this.activityDefs().map(a=>`
      <div class="l1-activity c-${a.color}" onclick="HomeL1.runActivity('${a.action}')">
        <div class="l1-activity-ico">${a.icon}</div>
        <h3>${a.title}</h3>
        <p>${a.desc}</p>
      </div>`).join("");
  },

  renderBadges(){
    const box = document.getElementById("l1-badges");
    if(!box) return;
    // Show earned badges first so the dashboard feels rewarding.
    const sorted = [...L1_ACHIEVEMENTS].sort((a,b)=>{
      const ua = App.state.unlockedAchievements.includes(a.id) ? 0 : 1;
      const ub = App.state.unlockedAchievements.includes(b.id) ? 0 : 1;
      return ua - ub;
    });
    box.innerHTML = sorted.slice(0,6).map(a=>{
      const unlocked = App.state.unlockedAchievements.includes(a.id);
      return `<div class="l1-badge ${unlocked?'':'locked'}" title="${a.desc}">
        <div class="l1-badge-ico">${a.icon}</div>
        <div class="l1-badge-name">${a.name}</div>
      </div>`;
    }).join("");
  },

  // ---- Course progress (lessons whose quiz has been completed) ----
  completedLessons(){
    const lq = App.state.lessonQuizzes || {};
    return this.lessons().filter(l=>lq[this.lessonKey(l)]);
  },
  nextIncompleteIndex(){
    const lq = App.state.lessonQuizzes || {};
    const ls = this.lessons();
    for(let i=0;i<ls.length;i++){ if(!lq[this.lessonKey(ls[i])]) return i; }
    return -1;
  },
  continueLearning(){
    const i = this.nextIncompleteIndex();
    if(i>=0) this.openLesson(i);
    else Router.go("learn-l1");
  },
  renderCourseProgress(){
    const ring = document.getElementById("l1-course-ring");
    if(!ring) return;
    const total = this.lessons().length || 8;
    const done = this.completedLessons().length;
    const pct = total ? Math.round(done/total*100) : 0;
    const r = 34, circ = 2*Math.PI*r, off = circ*(1 - pct/100);
    ring.innerHTML = `
      <svg viewBox="0 0 80 80" width="84" height="84" aria-hidden="true">
        <circle cx="40" cy="40" r="${r}" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="8"/>
        <circle cx="40" cy="40" r="${r}" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round"
          stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 40 40)"/>
        <text x="40" y="46" text-anchor="middle" font-size="17" font-weight="800" fill="#fff">${pct}%</text>
      </svg>`;
    const allDone = done>=total;
    document.getElementById("l1-course-text").textContent = allDone
      ? `All ${total} lessons complete — you're a Level 1 Graduate! 🎓`
      : `${done} of ${total} lessons complete — keep going!`;
    const btn = document.getElementById("l1-course-btn");
    if(btn){
      if(allDone){ btn.textContent = "🎓 Get Certificate"; btn.onclick = ()=>App.printL1Certificate(); }
      else { btn.textContent = done>0 ? "Continue Learning →" : "Start Lesson 1 →"; btn.onclick = ()=>this.continueLearning(); }
    }
  },

  readLesson(btn){ Speech.read(this._lessonText, btn); },

  // "My Robot" project card on the dashboard (client-side, printed on the certificate).
  renderProject(){
    const box = document.getElementById("l1-project-card");
    if(!box) return;
    const p = App.state.project;
    if(p){
      box.innerHTML = `
        <div class="l1-project-emoji">${p.emoji||"🤖"}</div>
        <div style="flex:1;">
          <h3>${HomeL1.escText(p.name)}</h3>
          <p>${p.desc ? HomeL1.escText(p.desc) : "Your robot idea — sense, think, act!"}</p>
        </div>
        <button class="l1-daily-btn" onclick="App.designRobot()">Edit ✏️</button>`;
    } else {
      box.innerHTML = `
        <div class="l1-project-emoji">🚀</div>
        <div style="flex:1;">
          <h3>Design My Robot</h3>
          <p>Dream up your own robot — give it a name and say what it does!</p>
        </div>
        <button class="l1-daily-btn" onclick="App.designRobot()">Create ✨</button>`;
    }
  },
  escText(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); },

  lessons(){ return (this.learn && this.learn.lessons) || []; },

  renderLearn(){
    const c = this.learn;
    const intro = document.getElementById("l1-learn-intro");
    const lessonGrid = document.getElementById("l1-lesson-grid");
    if(!c){
      if(intro) intro.textContent = "Learning content is loading… if this stays, refresh the page.";
      if(lessonGrid) lessonGrid.innerHTML = "";
      return;
    }
    if(intro) intro.textContent = c.intro || "";

    const lq = App.state.lessonQuizzes || {};
    const nextIdx = this.nextIncompleteIndex();
    const doneCount = this.completedLessons().length;
    const total = this.lessons().length;
    const progEl = document.getElementById("l1-learn-progress");
    if(progEl){
      const p = total ? Math.round(doneCount/total*100) : 0;
      progEl.innerHTML = `
        <div class="flex justify-between items-center" style="margin-bottom:6px;">
          <strong>${doneCount} of ${total} lessons complete</strong><span class="small muted">${p}%</span>
        </div>
        <div class="l1-progress-track" style="background:rgba(255,255,255,.12);"><div class="l1-progress-fill" style="width:${p}%"></div></div>`;
    }

    lessonGrid.innerHTML = this.lessons().map((lsn,i)=>{
      const rec = lq[this.lessonKey(lsn)];
      const done = !!rec;
      const isNext = i===nextIdx;
      const tag = done
        ? `<span class="l1-lesson-badge done">✓ Done${rec && rec.total ? ` · ${rec.score}/${rec.total}` : ""}</span>`
        : isNext ? `<span class="l1-lesson-badge start">⭐ Start here</span>` : "";
      return `
      <div class="l1-lesson ${done?'is-done':''} ${isNext?'is-next':''}" onclick="HomeL1.openLesson(${i})">
        <div class="l1-lesson-head">
          <div class="l1-lesson-ico">${lsn.icon||"📖"}</div>
          <div style="flex:1;">
            <h3>${lsn.title||""} ${tag}</h3>
            <p class="l1-lesson-summary">${lsn.summary||""}</p>
          </div>
          <div class="l1-lesson-go">${done?'Review →':'Open →'}</div>
        </div>
      </div>`;
    }).join("");
    // Activities row on the learn screen
    const learnActs = document.getElementById("l1-learn-activity-grid");
    if(learnActs){
      const acts = (c.activities && c.activities.length) ? c.activities : this.activityDefs();
      learnActs.innerHTML = acts.map(a=>`
        <div class="l1-activity c-${a.color||'teal'}" onclick="HomeL1.runActivity('${a.action}')">
          <div class="l1-activity-ico">${a.icon||"🎮"}</div>
          <h3>${a.title||""}</h3>
          <p>${a.desc||""}</p>
        </div>`).join("");
    }
  },

  openLesson(i){
    const lsn = this.lessons()[i];
    if(!lsn) return;
    this.currentLessonIndex = i;
    this.currentLesson = lsn;
    document.getElementById("l1-lesson-detail-title").textContent = lsn.title || "Lesson";
    const notesBox = document.getElementById("l1-lesson-notes");
    notesBox.innerHTML = (lsn.notes||[]).map(block=>this.renderNoteBlock(block)).join("");

    // Build a plain-text version of the notes for the "Read to me" button.
    const strip = s => String(s||"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
    this._lessonText = ((lsn.title? lsn.title+". " : "") + (lsn.notes||[]).map(b=>
      (["text","heading","tip","callout","activity"].includes(b.type)) ? strip(b.text) : ""
    ).filter(Boolean).join(". "));
    const readBtn = document.getElementById("l1-read-btn");
    if(readBtn){
      Speech.stop(readBtn);
      readBtn.style.display = Speech.supported() ? "inline-flex" : "none";
    }

    // Quiz call-to-action: prefer the lesson's own mixed-type quiz, fall back to the topic bank.
    const hasLessonQuiz = Array.isArray(lsn.quiz) && lsn.quiz.length > 0;
    const topic = lsn.topic;
    const hasTopicQs = App.activeQuestions().some(q=>q.topic===topic);
    const done = (App.state.lessonQuizzes||{})[this.lessonKey(lsn)];
    const btn = document.getElementById("l1-lesson-quiz-btn");
    const titleEl = document.getElementById("l1-lesson-quiz-title");
    if(hasLessonQuiz || hasTopicQs){
      titleEl.textContent = done
        ? `⭐ You scored ${done.score}/${done.total} on this quiz — try again to beat it?`
        : `Ready for the ${lsn.title||"lesson"} quiz?`;
      btn.style.display = "inline-flex";
      btn.textContent = done ? "🔁 Retake the Lesson Quiz" : "📝 Take the Lesson Quiz";
      btn.onclick = hasLessonQuiz ? ()=>LessonQuiz.start(lsn) : ()=>App.startTopic(topic);
    } else {
      titleEl.textContent = "More questions for this lesson are coming soon!";
      btn.style.display = "none";
    }
    Router.go("lesson-l1");
  },

  lessonKey(lsn){ return lsn.id || lsn.topic || lsn.title || ""; },

  // Render one note block. Supported types: text (default), diagram, activity,
  // video (YouTube), image, tip/callout, heading.
  renderNoteBlock(block){
    if(!block) return "";
    switch(block.type){
      case "diagram":
        return (typeof renderL1Diagram === "function") ? renderL1Diagram(block.key) : "";
      case "activity":
        return `<div class="l1-activity-box">${block.text||""}</div>`;
      case "video":
        return this.videoBlockHtml(block);
      case "image":
        return this.imageBlockHtml(block);
      case "tip":
      case "callout":
        return `<div class="l1-tip"><span class="l1-tip-ico">${block.icon||"💡"}</span><div>${block.text||""}</div></div>`;
      case "heading":
        return `<h3 class="l1-note-heading">${block.text||""}</h3>`;
      default:
        return `<p class="l1-note-p">${block.text||""}</p>`;
    }
  },

  // Pull the 11-char video id out of any common YouTube URL form (watch?v=, youtu.be/, embed/, shorts/).
  youtubeId(url){
    if(!url) return "";
    const m = String(url).match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([A-Za-z0-9_-]{11})/);
    if(m) return m[1];
    const bare = String(url).match(/^[A-Za-z0-9_-]{11}$/); // allow a bare id
    return bare ? bare[0] : "";
  },

  videoBlockHtml(block){
    const id = this.youtubeId(block.url);
    const title = block.title || "Watch & learn";
    if(!id){
      // No URL yet — show a friendly placeholder so it's obvious where a video goes.
      return `<div class="l1-video-empty">
        <div class="l1-video-empty-ico">🎬</div>
        <div><strong>${title}</strong><br><span class="small muted">Video coming soon — an instructor will add it here.</span></div>
      </div>`;
    }
    return `<figure class="l1-video">
      <div class="l1-video-frame">
        <iframe src="https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1"
          title="${this.escAttr(title)}" loading="lazy" allowfullscreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
      </div>
      <figcaption>🎬 ${title}</figcaption>
    </figure>`;
  },

  imageBlockHtml(block){
    if(!block.src){
      return `<div class="l1-video-empty">
        <div class="l1-video-empty-ico">🖼️</div>
        <div><strong>${block.caption||"Picture"}</strong><br><span class="small muted">Image coming soon — an instructor will add it here.</span></div>
      </div>`;
    }
    return `<figure class="l1-image">
      <img src="${this.escAttr(block.src)}" alt="${this.escAttr(block.alt||block.caption||"Lesson picture")}" loading="lazy">
      ${block.caption ? `<figcaption>${block.caption}</figcaption>` : ""}
    </figure>`;
  },

  escAttr(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;"); }
};

/* ---------------- LESSON QUIZ (per-lesson mixed quiz: MCQ / fill-blank / matching) ---------------- */
const LessonQuiz = {
  lesson:null, pool:[], index:0, correct:0, pending:null,

  start(lesson){
    if(!lesson || !Array.isArray(lesson.quiz) || !lesson.quiz.length){ return; }
    this.lesson = lesson;
    this.pool = lesson.quiz.slice();
    this.index = 0; this.correct = 0;
    document.getElementById("lq-title").textContent = `${lesson.icon||"📝"} ${lesson.title||"Lesson"} — Quiz`;
    Router.go("lesson-quiz");
    this.renderQuestion();
  },

  esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;"); },
  shuffle(arr){ return [...arr].sort(()=>Math.random()-0.5); },

  // Normalise true/false questions into a 2-option MCQ shape.
  optionsFor(q){
    if(q.type === "truefalse") return ["True","False"];
    return q.options || [];
  },
  answerFor(q){
    if(q.type === "truefalse") return (q.answer===true||/^true$/i.test(String(q.answer))) ? "True" : "False";
    return q.answer;
  },

  renderQuestion(){
    const q = this.pool[this.index];
    this.pending = { selected:null };
    const total = this.pool.length;
    document.getElementById("lq-progress-txt").textContent = `Question ${this.index+1} of ${total}`;
    document.getElementById("lq-progress-fill").style.width = (this.index/total*100)+"%";

    const type = (q.type==="truefalse") ? "mcq" : q.type;
    let body = "";
    if(type === "mcq"){
      const opts = this.optionsFor(q);
      body = `<div class="options" id="lq-options">${opts.map((opt,i)=>`
        <button class="opt" data-i="${i}" onclick="LessonQuiz.selectMCQ(${i})">
          <span class="k">${String.fromCharCode(65+i)}</span><span>${this.esc(opt)}</span>
        </button>`).join("")}</div>
        <button class="btn btn-primary btn-sm mt-20" id="lq-submit" onclick="LessonQuiz.submit()" disabled>Submit Answer</button>`;
    } else if(type === "fillblank"){
      body = `<input type="text" id="lq-blank-input" class="wq-blank-input" placeholder="Type your answer…" onkeydown="if(event.key==='Enter') LessonQuiz.submit()">
        <button class="btn btn-primary btn-sm mt-20" id="lq-submit" onclick="LessonQuiz.submit()">Submit Answer</button>`;
      setTimeout(()=>{ const el=document.getElementById("lq-blank-input"); if(el) el.focus(); }, 0);
    } else if(type === "matching"){
      const choices = this.shuffle(q.pairs.map(p=>p.match));
      body = `<div id="lq-match-rows">${q.pairs.map((p,i)=>`
        <div class="match-row flex items-center justify-between gap-8">
          <div style="flex:1;">${this.esc(p.term)}</div>
          <select class="wq-select" id="lq-match-${i}">
            <option value="">Choose match…</option>
            ${choices.map(c=>`<option value="${this.esc(c)}">${this.esc(c)}</option>`).join("")}
          </select>
        </div>`).join("")}</div>
        <button class="btn btn-primary btn-sm mt-20" id="lq-submit" onclick="LessonQuiz.submit()">Submit Answer</button>`;
    }

    document.getElementById("lq-root").innerHTML = `
      <div class="q-text">${this.esc(q.question)}</div>
      <div id="lq-body">${body}</div>
      <div class="feedback" id="lq-feedback"></div>`;
  },

  selectMCQ(i){
    this.pending.selected = i;
    document.querySelectorAll("#lq-options .opt").forEach((el,idx)=>{
      el.style.borderColor = idx===i ? "var(--orange)" : "";
    });
    document.getElementById("lq-submit").disabled = false;
  },

  submit(){
    const q = this.pool[this.index];
    const type = (q.type==="truefalse") ? "mcq" : q.type;
    let correct = false, correctText = "";

    if(type === "mcq"){
      const opts = this.optionsFor(q), ans = this.answerFor(q);
      correct = this.pending.selected != null && opts[this.pending.selected] === ans;
      correctText = ans;
      document.querySelectorAll("#lq-options .opt").forEach((el,i)=>{
        el.disabled = true;
        if(opts[i] === ans) el.classList.add("correct");
        else if(i === this.pending.selected) el.classList.add("wrong");
      });
    } else if(type === "fillblank"){
      const input = document.getElementById("lq-blank-input");
      const val = input.value.trim().toLowerCase();
      const accepted = [q.answer, ...(q.acceptable||[])].map(a=>String(a).toLowerCase().trim());
      correct = accepted.includes(val);
      correctText = q.answer;
      input.disabled = true;
      input.style.borderColor = correct ? "var(--green)" : "#ff5252";
    } else if(type === "matching"){
      correct = true;
      q.pairs.forEach((p,i)=>{
        const sel = document.getElementById(`lq-match-${i}`);
        const ok = sel.value === p.match;
        if(!ok) correct = false;
        sel.disabled = true;
        sel.style.borderColor = ok ? "var(--green)" : "#ff5252";
      });
      correctText = q.pairs.map(p=>`${p.term} → ${p.match}`).join("; ");
    }

    const submitBtn = document.getElementById("lq-submit");
    if(submitBtn) submitBtn.style.display = "none";

    // Scoring — mirrors the weekly quiz rewards and feeds the same progress stats.
    if(correct) this.correct++;
    App.state.totalAnswered++;
    const ts = App.state.topicStats[this.lesson.topic] = App.state.topicStats[this.lesson.topic] || {correct:0, attempted:0};
    ts.attempted++;
    if(correct){
      App.state.totalCorrect++;
      ts.correct++;
      App.state.xp += 8;
      App.state.coins += 4;
      App.state.stars += 1;
      App.celebrate();
      Sound.correct();
    } else {
      Sound.wrong();
    }
    Store.save(App.state);
    App.checkAchievements();

    const fb = document.getElementById("lq-feedback");
    fb.className = "feedback show " + (correct ? "correct-fb" : "wrong-fb");
    const nextLabel = this.index < this.pool.length-1 ? "Next Question →" : "Finish →";
    fb.innerHTML = `
      <h4>${correct ? "✅ Correct! +8 XP" : "🤖 Not quite."}</h4>
      ${!correct ? `<p><strong>Correct answer:</strong> ${this.esc(correctText)}</p>` : ""}
      ${q.explanation ? `<p class="mt-10">${q.explanation}</p>` : ""}
      <div class="mt-20"><button class="btn btn-primary btn-sm" onclick="LessonQuiz.next()">${nextLabel}</button></div>`;
  },

  next(){
    if(this.index < this.pool.length-1){
      this.index++;
      this.renderQuestion();
    } else {
      this.finish();
    }
  },

  finish(){
    const total = this.pool.length;
    const key = HomeL1.lessonKey(this.lesson);
    App.state.lessonQuizzes = App.state.lessonQuizzes || {};
    const prev = App.state.lessonQuizzes[key];
    let sticker = "";
    if(!prev){
      App.state.xp += 20; App.state.coins += 10;
      App.state.collection = App.state.collection || [];
      const fresh = L1_STICKERS.filter(s=>!App.state.collection.includes(s));
      const src = fresh.length ? fresh : L1_STICKERS;
      sticker = src[Math.floor(Math.random()*src.length)];
      if(!App.state.collection.includes(sticker)) App.state.collection.push(sticker);
    }
    if(!prev || this.correct > prev.score){
      App.state.lessonQuizzes[key] = { score:this.correct, total, completedAt:Date.now() };
    }
    const justGraduated = l1LessonsDone(App.state) >= 8 && !App.state.graduated;
    if(justGraduated) App.state.graduated = true;
    Store.save(App.state);
    App.checkAchievements();
    Sound.win();
    if(justGraduated){ App.celebrate(); setTimeout(()=>App.celebrate(), 400); }

    const pct = Math.round((this.correct/total)*100);
    const msg = pct>=80 ? "Amazing work! 🌟" : pct>=50 ? "Nice job! 💪" : "Good try — review the lesson and go again! 🔧";
    const gradBlock = justGraduated ? `
      <div class="lq-grad">🎓 You finished all 8 lessons — you're a <b>Level 1 Graduate!</b><br>
        <button class="btn btn-primary btn-sm mt-10" onclick="App.printL1Certificate()">🎓 Get your certificate</button>
      </div>` : "";
    document.getElementById("lq-root").innerHTML = `
      <div style="text-align:center; padding:10px 0;">
        <div style="font-size:3.4rem;">${pct>=80?"🎉":pct>=50?"👍":"📚"}</div>
        <h2 style="margin:8px 0;">${msg}</h2>
        <p class="muted">You scored <strong>${this.correct}/${total}</strong> (${pct}%)${!prev?" — plus a 20 XP bonus!":""}</p>
        ${sticker?`<div class="lq-sticker">🎁 New sticker earned: <span style="font-size:1.7rem;vertical-align:middle;">${sticker}</span></div>`:""}
        ${gradBlock}
        <div class="flex justify-center gap-8 mt-20" style="flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="LessonQuiz.start(LessonQuiz.lesson)">🔁 Try Again</button>
          <button class="btn btn-teal" onclick="HomeL1.openLesson(HomeL1.currentLessonIndex)">← Back to Lesson</button>
          <button class="btn btn-green" onclick="App.enterHome()">🏠 Dashboard</button>
        </div>
      </div>`;
    document.getElementById("lq-progress-fill").style.width = "100%";
    document.getElementById("lq-progress-txt").textContent = `Done — ${this.correct}/${total}`;
  },

  quit(){
    if(HomeL1.currentLessonIndex != null){ HomeL1.openLesson(HomeL1.currentLessonIndex); }
    else { App.enterHome(); }
  }
};

/* ---------------- ONBOARDING GUIDE (first-login walkthrough for Level 1 kids) ---------------- */
const Onboarding = {
  index:0,
  slides:[
    {ico:"👋", title:"Welcome to the Academy!", text:"Hi there, explorer! This quick guide shows how everything works. It only takes 20 seconds — then you're off to build robots and train AI! 🤖"},
    {ico:"📚", title:"Read & Watch Lessons", text:"Tap <b>📚 Learn</b> to open your lessons. Each one has friendly notes, colourful pictures, and videos you can play right on the page. Go through them in order."},
    {ico:"📝", title:"Take the Lesson Quiz", text:"After reading, take the lesson quiz. Questions can be <b>multiple choice</b>, <b>fill-in-the-blank</b>, or <b>matching</b>. Every answer comes with an explanation, so you always learn something!"},
    {ico:"⚡", title:"Earn XP, Marks & Stars", text:"Right answers earn <b>⚡ XP</b> that levels you up: Beginner → Maker → Inventor → and beyond! Your <b>🎯 Marks</b> show your accuracy, and <b>⭐ Stars</b> pile up as you go."},
    {ico:"🔥", title:"Keep Your Streak", text:"Play a little <b>every day</b> to grow your <b>🔥 day streak</b>. Try the <b>🎯 Daily Challenge</b>, <b>📘 Practice Mode</b>, and <b>🗺️ Explore Topics</b> for extra fun and rewards."},
    {ico:"🏅", title:"Badges & Leaderboard", text:"Unlock shiny <b>🏅 badges</b> for reaching goals, and climb the <b>🏆 class leaderboard</b> against your friends. Ready? Let's start with Lesson 1! 🚀"}
  ],

  maybeShow(){
    if(!App.isL1Student()) return;
    if(App.state.l1SeenGuide) return;
    this.open();
  },

  open(){ this.index = 0; document.getElementById("l1-onboarding").classList.add("show"); this.render(); },

  render(){
    const s = this.slides[this.index];
    const last = this.index === this.slides.length-1;
    document.getElementById("l1-ob-ico").textContent = s.ico;
    document.getElementById("l1-ob-title").textContent = s.title;
    document.getElementById("l1-ob-text").innerHTML = s.text;
    document.getElementById("l1-ob-dots").innerHTML = this.slides.map((_,i)=>
      `<span class="l1-ob-dot ${i===this.index?'on':''}"></span>`).join("");
    document.getElementById("l1-ob-back").style.visibility = this.index===0 ? "hidden" : "visible";
    document.getElementById("l1-ob-next").textContent = last ? "Let's Go! 🚀" : "Next →";
  },

  next(){
    if(this.index < this.slides.length-1){ this.index++; this.render(); }
    else { this.finish(); }
  },
  prev(){ if(this.index>0){ this.index--; this.render(); } },

  finish(){
    if(!App.state.l1SeenGuide){ App.state.l1SeenGuide = true; Store.save(App.state); }
    this.close();
  },
  close(){ document.getElementById("l1-onboarding").classList.remove("show"); }
};

/* ---------------- ROBOT LOOP MINI-GAME (Sense → Think → Act, on-syllabus) ---------------- */
const MiniGame = {
  rounds: [
    { sense:"Ultrasonic sensor sees a wall ahead", think:"Arduino decides to turn away", act:"Motors turn the wheels" },
    { sense:"Light sensor feels it's dark", think:"Program decides: turn the light on", act:"LED lights up 💡" },
    { sense:"Button A is pressed", think:"micro:bit checks which button", act:"Show a heart ❤️ on the LEDs" },
    { sense:"Temperature sensor feels heat", think:"Decide it is too hot", act:"Buzzer beeps a warning 🔊" },
    { sense:"Camera sees a photo of a cat", think:"AI model recognises 'cat'", act:"Show the word CAT" },
  ],
  order:["sense","think","act"],
  labels:{sense:"👀 SENSE", think:"🧠 THINK", act:"🦿 ACT"},
  index:0, correctCount:0, picked:[],

  esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;"); },

  start(){
    this.index = 0; this.correctCount = 0;
    Router.go("minigame");
    this.renderRound();
  },

  renderRound(){
    const r = this.rounds[this.index];
    this.picked = [];
    const cards = this.order.map(k=>({k, text:r[k]}));
    for(let i=cards.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [cards[i],cards[j]]=[cards[j],cards[i]]; }
    document.getElementById("mg-progress").textContent = `Round ${this.index+1} of ${this.rounds.length}`;
    document.getElementById("mg-root").innerHTML = `
      <p class="mg-instruct">Tap the steps in the right order: <b>Sense → Think → Act</b></p>
      <div class="mg-slots">
        <div class="mg-slot" data-n="1">1</div>
        <div class="mg-slot" data-n="2">2</div>
        <div class="mg-slot" data-n="3">3</div>
      </div>
      <div class="mg-cards" id="mg-cards">
        ${cards.map(c=>`<button class="mg-card" data-k="${c.k}" onclick="MiniGame.pick('${c.k}', this)">${this.esc(c.text)}</button>`).join("")}
      </div>
      <div class="feedback" id="mg-feedback"></div>`;
  },

  pick(k, el){
    if(el.classList.contains("used")) return;
    el.classList.add("used");
    this.picked.push(k);
    const slot = document.querySelector(`.mg-slot[data-n="${this.picked.length}"]`);
    if(slot){ slot.textContent = this.labels[k]; slot.classList.add("filled"); }
    Sound.click();
    if(this.picked.length === 3) this.check();
  },

  check(){
    const correct = this.picked.join(",") === this.order.join(",");
    if(correct){ this.correctCount++; App.state.xp += 5; App.state.coins += 3; Store.save(App.state); App.celebrate(); Sound.correct(); }
    else Sound.wrong();
    document.querySelectorAll("#mg-cards .mg-card").forEach(b=>b.classList.add("used"));
    const last = this.index >= this.rounds.length-1;
    const fb = document.getElementById("mg-feedback");
    fb.className = "feedback show " + (correct ? "correct-fb" : "wrong-fb");
    fb.innerHTML = `<h4>${correct ? "✅ Perfect! Sense → Think → Act (+5 XP)" : "🤖 Not quite — it's always Sense → Think → Act."}</h4>
      <div class="mt-20"><button class="btn btn-primary btn-sm" onclick="MiniGame.next()">${last?"Finish →":"Next →"}</button></div>`;
  },

  next(){
    if(this.index < this.rounds.length-1){ this.index++; this.renderRound(); }
    else this.finish();
  },

  finish(){
    App.checkAchievements();
    Sound.win();
    document.getElementById("mg-progress").textContent = `Done — ${this.correctCount}/${this.rounds.length}`;
    document.getElementById("mg-root").innerHTML = `
      <div style="text-align:center; padding:14px 0;">
        <div style="font-size:3.2rem;">🎮</div>
        <h2 style="margin:8px 0;">Great playing!</h2>
        <p class="muted">You got ${this.correctCount} of ${this.rounds.length} robot loops right.</p>
        <div class="flex justify-center gap-8 mt-20" style="flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="MiniGame.start()">🔁 Play Again</button>
          <button class="btn btn-green" onclick="App.enterHome()">🏠 Dashboard</button>
        </div>
      </div>`;
  }
};

/* ---------------- MANAGE LEVEL 1 (admin live question editor, Supabase-backed) ---------------- */
const ManageL1 = {
  source: "bundled",   // "bundled" (using built-in JSON) | "supabase" (admin-published rows)
  bundled: [],         // the built-in starter questions from data/l1/questions.json
  rows: [],            // raw Supabase rows
  editing: null,       // question being edited (row) or null when adding

  rowToQuestion(r){
    return { id:r.id, topic:r.topic, difficulty:r.difficulty, type:r.type, question:r.question,
      options:r.options||[], answer:r.answer, explanation:r.explanation||"",
      hint1:r.hint1||"", hint2:r.hint2||"", hint3:r.hint3||"",
      animation:r.animation||null, image:null, formula:null, xp:r.xp||10, marks:r.marks||1 };
  },

  // Called once at startup: if the admin has published rows, they become the live L1 bank.
  async loadQuestions(){
    this.bundled = (App.classData.l1.questions || []).slice();
    try{
      const { data, error } = await sb.from("l1_questions").select("*").order("sort").order("created_at");
      if(error) throw error;
      if(data && data.length){
        this.rows = data;
        this.source = "supabase";
        App.classData.l1.questions = data.map(r=>this.rowToQuestion(r));
      } else {
        this.rows = []; this.source = "bundled";
      }
    }catch(e){
      // Table may not exist yet (SQL not run) — keep the bundled JSON. No crash.
      this.rows = []; this.source = "bundled";
    }
  },

  async refresh(){
    await this.loadQuestions();
    this.render();
  },

  topicList(){
    const fromLessons = (HomeL1.lessons()||[]).map(l=>l.topic).filter(Boolean);
    const fromQs = (App.classData.l1.questions||[]).map(q=>q.topic);
    return [...new Set([...fromLessons, ...fromQs])];
  },

  render(){
    const info = document.getElementById("ml1-info");
    const tbody = document.getElementById("ml1-tbody");
    if(!info || !tbody) return;
    const live = App.classData.l1.questions || [];
    const editable = this.source === "supabase";

    info.innerHTML = `
      <div class="flex justify-between items-center gap-12" style="flex-wrap:wrap;">
        <div class="flex gap-8" style="flex-wrap:wrap; align-items:center;">
          <span class="pill">${live.length} questions live</span>
          <span class="pill">${editable ? "✅ editable (saved in database)" : "📦 using built-in starter set"}</span>
        </div>
        <div class="flex gap-8" style="flex-wrap:wrap;">
          ${editable
            ? `<button class="btn btn-primary btn-sm" onclick="ManageL1.startAdd()">+ Add Question</button>`
            : `<button class="btn btn-primary btn-sm" onclick="ManageL1.importStarter()">⬇ Import starter questions to edit</button>`}
        </div>
      </div>
      ${editable ? "" : `<p class="small muted mt-10">Right now students see the 40 built-in Level 1 questions. Click <b>Import starter questions</b> once to copy them into the database so you can add, edit, and delete them here.</p>`}`;

    tbody.innerHTML = live.map((q,i)=>`
      <tr>
        <td>${q.topic}</td>
        <td><span class="tag ${(q.difficulty||'easy').toLowerCase()}">${q.difficulty||''}</span></td>
        <td>${q.type||''}</td>
        <td>${(q.question||'').slice(0,64).replace(/</g,'&lt;')}${(q.question||'').length>64?'…':''}</td>
        <td style="white-space:nowrap;">
          ${editable
            ? `<button class="btn btn-ghost btn-sm" onclick="ManageL1.startEdit('${q.id}')">✏️ Edit</button>
               <button class="btn btn-ghost btn-sm" onclick="ManageL1.remove('${q.id}')">🗑️</button>`
            : `<span class="small muted">read-only</span>`}
        </td>
      </tr>`).join("") || `<tr><td colspan="5" class="muted small">No questions yet.</td></tr>`;

    this.renderNotesPreview();
    // keep any open form hidden after a re-render
    document.getElementById("ml1-form").style.display = "none";
  },

  renderNotesPreview(){
    const box = document.getElementById("ml1-notes-preview");
    if(!box) return;
    const lessons = HomeL1.lessons();
    box.innerHTML = lessons.length
      ? lessons.map(l=>`<div style="padding:8px 0; border-bottom:1px solid var(--card-border);">
          <strong>${l.icon||""} ${l.title||""}</strong>
          <div class="small muted">${l.summary||""}</div>
        </div>`).join("")
      : `<p class="small muted">No lessons loaded.</p>`;
  },

  startAdd(){ this.editing = null; this.showForm({difficulty:"Easy", type:"MCQ", options:["","","",""], answer:""}); },
  startEdit(id){
    const row = this.rows.find(r=>String(r.id)===String(id));
    if(!row) return;
    this.editing = row;
    this.showForm(this.rowToQuestion(row));
  },

  showForm(q){
    const wrap = document.getElementById("ml1-form");
    const diagramKeys = (typeof L1_DIAGRAMS !== "undefined") ? Object.keys(L1_DIAGRAMS) : [];
    const isTF = q.type === "TrueFalse";
    const opts = isTF ? ["True","False"] : (q.options && q.options.length ? q.options.concat(["","","",""]).slice(0,4) : ["","","",""]);
    wrap.innerHTML = `
      <div class="card ml1-form-card">
        <h3 style="margin:0 0 12px;">${this.editing ? "✏️ Edit question" : "➕ New question"}</h3>
        <div class="ml1-field"><label>Topic</label>
          <input id="mf-topic" list="mf-topics" value="${this.esc(q.topic||"")}" placeholder="e.g. Sensors & Actuators">
          <datalist id="mf-topics">${this.topicList().map(t=>`<option value="${this.esc(t)}">`).join("")}</datalist>
        </div>
        <div class="flex gap-12" style="flex-wrap:wrap;">
          <div class="ml1-field" style="flex:1; min-width:150px;"><label>Difficulty</label>
            <select id="mf-diff">${["Easy","Medium","Hard"].map(d=>`<option ${q.difficulty===d?"selected":""}>${d}</option>`).join("")}</select>
          </div>
          <div class="ml1-field" style="flex:1; min-width:150px;"><label>Type</label>
            <select id="mf-type" onchange="ManageL1.onTypeChange()">
              <option value="MCQ" ${q.type==="MCQ"?"selected":""}>Multiple choice</option>
              <option value="TrueFalse" ${q.type==="TrueFalse"?"selected":""}>True / False</option>
            </select>
          </div>
        </div>
        <div class="ml1-field"><label>Question</label>
          <textarea id="mf-question" rows="2" placeholder="Type the question…">${this.esc(q.question||"")}</textarea>
        </div>
        <div class="ml1-field"><label>Answers <span class="small muted">(tick the correct one)</span></label>
          <div id="mf-options">${this.optionsHtml(opts, q.answer, isTF)}</div>
        </div>
        <div class="ml1-field"><label>Explanation <span class="small muted">(shown after they answer)</span></label>
          <textarea id="mf-explanation" rows="2" placeholder="Explain the answer in a friendly way…">${this.esc(q.explanation||"")}</textarea>
        </div>
        <div class="ml1-field"><label>Picture / diagram <span class="small muted">(optional)</span></label>
          <select id="mf-animation">
            <option value="">None</option>
            ${diagramKeys.map(k=>`<option value="${k}" ${q.animation===k?"selected":""}>${k}</option>`).join("")}
          </select>
        </div>
        <div id="mf-error" class="small" style="color:#ff5252; min-height:18px;"></div>
        <div class="flex gap-8" style="margin-top:6px;">
          <button class="btn btn-primary btn-sm" onclick="ManageL1.save()">💾 Save</button>
          <button class="btn btn-ghost btn-sm" onclick="ManageL1.cancelForm()">Cancel</button>
        </div>
      </div>`;
    wrap.style.display = "block";
    wrap.scrollIntoView({behavior:"smooth", block:"start"});
  },

  optionsHtml(opts, answer, isTF){
    if(isTF){
      return ["True","False"].map(v=>`
        <label class="ml1-opt"><input type="radio" name="mf-correct" value="${v}" ${answer===v?"checked":""}> ${v}</label>`).join("");
    }
    return opts.map((o,i)=>`
      <div class="ml1-opt-row">
        <input type="radio" name="mf-correct" value="opt${i}" ${(answer && answer===o)?"checked":""} title="Mark as correct">
        <input type="text" class="mf-opt-text" data-i="${i}" value="${this.esc(o||"")}" placeholder="Answer ${i+1}">
      </div>`).join("");
  },

  onTypeChange(){
    const type = document.getElementById("mf-type").value;
    const box = document.getElementById("mf-options");
    box.innerHTML = this.optionsHtml(type==="TrueFalse"?["True","False"]:["","","",""], "", type==="TrueFalse");
  },

  cancelForm(){ document.getElementById("ml1-form").style.display = "none"; this.editing = null; },

  esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); },

  collectForm(){
    const type = document.getElementById("mf-type").value;
    const topic = document.getElementById("mf-topic").value.trim();
    const difficulty = document.getElementById("mf-diff").value;
    const question = document.getElementById("mf-question").value.trim();
    const explanation = document.getElementById("mf-explanation").value.trim();
    const animation = document.getElementById("mf-animation").value || null;
    let options, answer;
    const correct = document.querySelector('input[name="mf-correct"]:checked');
    if(type==="TrueFalse"){
      options = ["True","False"];
      answer = correct ? correct.value : "";
    } else {
      options = Array.from(document.querySelectorAll(".mf-opt-text")).map(el=>el.value.trim()).filter(v=>v);
      // rebuild full 4-slot list to map the radio choice
      const allTexts = Array.from(document.querySelectorAll(".mf-opt-text")).map(el=>el.value.trim());
      if(correct){ const idx = parseInt(correct.value.replace("opt",""),10); answer = allTexts[idx] || ""; }
      else answer = "";
    }
    const xpMap = {Easy:10, Medium:15, Hard:25}, markMap = {Easy:1, Medium:2, Hard:3};
    return { topic, difficulty, type, question, options, answer, explanation, animation,
      xp:xpMap[difficulty], marks:markMap[difficulty] };
  },

  validate(f){
    if(!f.topic) return "Please enter a topic.";
    if(!f.question) return "Please enter the question text.";
    if(f.type==="MCQ" && f.options.length < 2) return "Please add at least two answers.";
    if(!f.answer) return "Please tick which answer is correct.";
    if(f.type==="MCQ" && !f.options.includes(f.answer)) return "The correct answer must be one of the typed answers.";
    return null;
  },

  async save(){
    const f = this.collectForm();
    const err = this.validate(f);
    const errEl = document.getElementById("mf-error");
    if(err){ errEl.textContent = err; return; }
    errEl.textContent = "Saving…";
    try{
      if(this.editing){
        const { error } = await sb.from("l1_questions").update({ ...f, updated_at:new Date().toISOString() }).eq("id", this.editing.id);
        if(error) throw error;
      } else {
        const { error } = await sb.from("l1_questions").insert({ ...f, sort:(this.rows.length+1) });
        if(error) throw error;
      }
      this.editing = null;
      await this.refresh();
    }catch(e){
      errEl.textContent = this.friendlyError(e);
    }
  },

  async remove(id){
    if(!confirm("Delete this question? This cannot be undone.")) return;
    try{
      const { error } = await sb.from("l1_questions").delete().eq("id", id);
      if(error) throw error;
      await this.refresh();
    }catch(e){
      alert(this.friendlyError(e));
    }
  },

  async importStarter(){
    if(!confirm("Copy the 40 built-in Level 1 questions into the database so you can edit them?")) return;
    const info = document.getElementById("ml1-info");
    if(info) info.insertAdjacentHTML("beforeend", `<p class="small muted" id="ml1-importing">Importing…</p>`);
    try{
      const payload = (this.bundled||[]).map((q,i)=>({
        topic:q.topic, difficulty:q.difficulty||"Easy", type:q.type||"MCQ", question:q.question,
        options:q.options||[], answer:q.answer, explanation:q.explanation||"",
        hint1:q.hint1||"", hint2:q.hint2||"", hint3:q.hint3||"",
        animation:q.animation||null, xp:q.xp||10, marks:q.marks||1, sort:i+1
      }));
      const { error } = await sb.from("l1_questions").insert(payload);
      if(error) throw error;
      await this.refresh();
    }catch(e){
      alert(this.friendlyError(e));
      const el = document.getElementById("ml1-importing"); if(el) el.remove();
    }
  },

  friendlyError(e){
    const m = (e && e.message) || "Something went wrong.";
    if(/row-level security|not authorized|permission/i.test(m))
      return "You need to be logged in as the Admin to change questions.";
    if(/relation .*l1_questions.* does not exist|schema cache/i.test(m))
      return "The question database isn't set up yet. Run the l1_questions setup SQL in Supabase first.";
    return m;
  }
};

/* ---------------- ADMIN HOME (professional master-admin panel) ---------------- */
const AdminHome = {
  esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); },

  async render(){
    // Brand the top bar for the admin.
    document.getElementById("brand-chip").textContent = "👑";
    document.getElementById("brand-text").textContent = "Master Admin";
    document.getElementById("admin-hello").textContent = (Auth.profile && Auth.profile.name) || "Admin";

    const [profRes, progRes] = await Promise.all([
      sb.from("profiles").select("*"),
      sb.from("progress").select("user_id,state,updated_at")
    ]);
    const profiles = (profRes && profRes.data) || [];
    const progById = Object.fromEntries(((progRes && progRes.data)||[]).map(p=>[p.user_id, p]));
    const students = profiles.filter(p=>p.role==="student");
    const inClass = cls => students.filter(s=>(s.class||"l2")===cls);
    const xpOf = s => { const pr=progById[s.id]; return (pr && pr.state && pr.state.xp) || 0; };
    const today = new Date().toDateString();
    const activeToday = ((progRes && progRes.data)||[]).filter(p=>p.updated_at && new Date(p.updated_at).toDateString()===today).length;
    const l1q = (App.classData.l1.questions||[]).length;
    const l2q = (App.classData.l2.questions||[]).length;

    document.getElementById("admin-stat-grid").innerHTML = [
      {ico:"👥", num:students.length, lbl:"Total Students", c:"purple"},
      {ico:"🤖", num:inClass("l1").length, lbl:"Level 1", c:"green"},
      {ico:"🔌", num:inClass("l2").length, lbl:"Level 2", c:"teal"},
      {ico:"⚡", num:activeToday, lbl:"Active Today", c:"orange"},
      {ico:"❓", num:l1q+l2q, lbl:"Questions", c:"blue"}
    ].map(s=>`<div class="admin-stat c-${s.c}">
        <div class="admin-stat-ico">${s.ico}</div>
        <div class="admin-stat-num">${s.num}</div>
        <div class="admin-stat-lbl">${s.lbl}</div>
      </div>`).join("");

    document.getElementById("admin-tools-grid").innerHTML = [
      {ico:"👑", t:"Accounts", d:"Usernames, passwords, class. Reset or delete accounts.", nav:"accounts", c:"purple"},
      {ico:"📊", t:"Student Progress", d:"XP, accuracy and weekly-quiz status per student.", nav:"students", c:"green"},
      {ico:"🗃️", t:"Question Bank", d:"Browse every Level 1 & Level 2 question.", nav:"admin", c:"teal"},
      {ico:"🛠️", t:"Manage L1 Questions", d:"Add, edit or delete Level 1 questions live.", nav:"manage-l1", c:"orange"}
    ].map(x=>`<div class="admin-tool" onclick="Router.go('${x.nav}')">
        <div class="admin-tool-ico c-${x.c}">${x.ico}</div>
        <div style="flex:1;"><h3>${x.t}</h3><p>${x.d}</p></div>
        <span class="admin-tool-go">Open →</span>
      </div>`).join("");

    this.summarize("l1", "admin-l1-summary", inClass, xpOf, progById);
    this.summarize("l2", "admin-l2-summary", inClass, xpOf, progById);
  },

  summarize(cls, elId, inClass, xpOf, progById){
    const el = document.getElementById(elId);
    if(!el) return;
    const list = inClass(cls);
    if(!list.length){ el.innerHTML = `<p class="small muted mt-10">No students in this class yet.</p>`; return; }
    const totalXp = list.reduce((a,s)=>a+xpOf(s), 0);
    const avg = Math.round(totalXp/list.length);
    const top = list.map(s=>({name:s.name, xp:xpOf(s)})).sort((a,b)=>b.xp-a.xp).slice(0,3);
    const medals = ["🥇","🥈","🥉"];
    el.innerHTML = `
      <div class="flex gap-8 mt-10" style="flex-wrap:wrap;">
        <span class="pill">👥 ${list.length} students</span>
        <span class="pill">⚡ ${avg} avg XP</span>
      </div>
      <div class="mt-10">
        ${top.map((t,i)=>`<div class="small muted">${medals[i]} ${this.esc(t.name)} — ${t.xp} XP</div>`).join("")}
      </div>`;
  }
};

/* ---------------- REUSABLE MODAL (prompt / confirm / alert) ---------------- */
const Modal = {
  _opts: null,

  show(opts){
    this._opts = opts || {};
    document.getElementById("ui-modal-ico").textContent = opts.icon || "❓";
    document.getElementById("ui-modal-title").textContent = opts.title || "";
    const msg = document.getElementById("ui-modal-msg");
    msg.innerHTML = opts.message || "";
    msg.style.display = opts.message ? "block" : "none";
    const field = document.getElementById("ui-modal-field");
    const input = document.getElementById("ui-modal-input");
    if(opts.input){
      field.style.display = "block";
      input.type = opts.input.type || "text";
      input.placeholder = opts.input.placeholder || "";
      input.value = opts.input.value || "";
      setTimeout(()=>{ input.focus(); input.select(); }, 40);
    } else {
      field.style.display = "none"; input.value = "";
    }
    this.setError("");
    const confirmBtn = document.getElementById("ui-modal-confirm");
    confirmBtn.disabled = false;
    confirmBtn.textContent = opts.confirmLabel || "Confirm";
    confirmBtn.className = "btn btn-sm " + (opts.danger ? "btn-danger" : "btn-primary");
    const cancelBtn = document.getElementById("ui-modal-cancel");
    cancelBtn.disabled = false;
    cancelBtn.style.display = opts.showCancel === false ? "none" : "inline-flex";
    document.getElementById("ui-modal").classList.add("show");
  },

  close(){ document.getElementById("ui-modal").classList.remove("show"); this._opts = null; },
  setError(m){ document.getElementById("ui-modal-error").textContent = m || ""; },
  setBusy(b){
    const c = document.getElementById("ui-modal-confirm");
    const x = document.getElementById("ui-modal-cancel");
    c.disabled = b; x.disabled = b;
    c.textContent = b ? "Working…" : ((this._opts && this._opts.confirmLabel) || "Confirm");
  },

  async doConfirm(){
    if(!this._opts) return;
    const val = document.getElementById("ui-modal-input").value;
    if(this._opts.onConfirm){ await this._opts.onConfirm(val); }
    else this.close();
  },

  alert(opts){
    this.show({ ...opts, input:null, showCancel:false, confirmLabel: opts.confirmLabel || "OK", onConfirm: ()=>this.close() });
  }
};

/* ---------------- ROUTER ---------------- */
const Router = {
  go(name){
    if(typeof Speech !== "undefined" && Speech.speaking) Speech.stop();
    document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
    const el = document.getElementById("screen-"+name);
    if(el) el.classList.add("active");
    document.querySelectorAll(".nav-btns button").forEach(b=>b.classList.toggle("active", b.dataset.nav===name));
    window.scrollTo({top:0, behavior:"smooth"});
    if(name==="home") App.renderHome();
    if(name==="admin-home") AdminHome.render();
    if(name==="home-l1") HomeL1.render();
    if(name==="learn-l1") HomeL1.renderLearn();
    // "lesson-l1" is populated by HomeL1.openLesson() before navigation — no re-render needed.
    if(name==="achievements") App.renderAchievements();
    if(name==="admin") App.renderAdmin();
    if(name==="accounts") Accounts.render();
    if(name==="students") App.renderStudents();
    if(name==="manage-l1") ManageL1.render();
  }
};

document.addEventListener("DOMContentLoaded", ()=>App.init());
