/* ============================================================
   BUILDQUEST — Level 2 multiplayer voxel learning world
   ------------------------------------------------------------
   A bounded (NOT infinite) 3D voxel sandbox in the spirit of
   Minecraft that reuses the site's existing L2 Arduino question
   bank as the "unlock gate" for advanced building blocks: pass a
   quiz from a Certification module (see l2-cert.js CERT_MODULES)
   to unlock that module's block for crafting & building.

   Honest scope notes (this is a classroom feature, not a
   commercial MMO engine):
     • One shared, fixed-size island (48x32x48) — not infinite,
       no chunk streaming. Small enough to hold entirely in memory
       and re-mesh on every edit, which keeps this file simple.
     • Multiplayer is client-authoritative Supabase Realtime
       broadcast/presence (positions + block edits) — no dedicated
       game server, no anti-cheat. Fine for a trusted classroom.
     • Rendering uses one InstancedMesh per block type, instancing
       only "exposed" (surface-adjacent-to-air) voxels — not true
       greedy meshing, but keeps triangle counts low for 60fps.

   Loaded after app.js + l2-cert.js — uses their globals directly:
   App, Auth, sb, Router, Store, Sound, escHtml, ACHIEVEMENTS,
   CERT_MODULES, renderAnimation.
   ============================================================ */

const BQ_SIZE = 48;        // world footprint, X and Z
const BQ_HEIGHT = 32;      // world height, Y
const BQ_SEA = 12;         // sea level Y
const BQ_SEED = 1337;
const BQ_WORLD_ID = "l2-main";
const BQ_REACH = 6;        // block interaction distance, in blocks
const BQ_POPQUIZ_INTERVAL = 240; // seconds between unprompted "pop quiz" events (4 min)

/* ---------------- BLOCK REGISTRY ---------------- */
// Index in this array = the numeric id stored in the voxel grid. 0 = air.
const BQ_BLOCKS = [
  { key:"air" },
  { key:"grass",    name:"Grass Block",   color:0x5fb84c, hardness:0.4,  drop:"grass",   opaque:true,  collidable:true,  placeable:true },
  { key:"dirt",     name:"Dirt",          color:0x8a5a34, hardness:0.4,  drop:"dirt",    opaque:true,  collidable:true,  placeable:true },
  { key:"stone",    name:"Stone",         color:0x8b8f96, hardness:0.9,  drop:"stone",   opaque:true,  collidable:true,  placeable:true },
  { key:"sand",     name:"Sand",          color:0xdfd08a, hardness:0.35, drop:"sand",    opaque:true,  collidable:true,  placeable:true },
  { key:"water",    name:"Water",         color:0x2e86c9, hardness:0,    drop:null,      opaque:false, collidable:false, placeable:false },
  { key:"log",      name:"Wood Log",      color:0x6b4a2c, hardness:0.7,  drop:"log",     opaque:true,  collidable:true,  placeable:true },
  { key:"leaves",   name:"Leaves",        color:0x2f9e44, hardness:0.15, drop:null,      opaque:false, collidable:false, placeable:false },
  { key:"coal_ore", name:"Coal Ore",      color:0x3d3d3d, hardness:1.1,  drop:"coal",    opaque:true,  collidable:true,  placeable:false },
  { key:"iron_ore", name:"Iron Ore",      color:0xc9a988, hardness:1.4,  drop:"iron",    opaque:true,  collidable:true,  placeable:false },
  { key:"planks",   name:"Planks",        color:0xc19a5b, hardness:0.5,  drop:"planks",  opaque:true,  collidable:true,  placeable:true },
  { key:"torch",    name:"Torch",         color:0xffce54, hardness:0.1,  drop:"torch",   opaque:false, collidable:false, placeable:true, emissive:true },
  { key:"circuit",  name:"Circuit Block", color:0x3AA0FF, hardness:0.6,  drop:"circuit", opaque:true,  collidable:true,  placeable:true, module:"m1" },
  { key:"sensor",   name:"Sensor Block",  color:0x00C853, hardness:0.6,  drop:"sensor",  opaque:true,  collidable:true,  placeable:true, module:"m2" },
  { key:"motor",    name:"Motor Block",   color:0xFF9800, hardness:0.6,  drop:"motor",   opaque:true,  collidable:true,  placeable:true, module:"m3" },
  { key:"display",  name:"Display Block", color:0x00BCD4, hardness:0.6,  drop:"display", opaque:true,  collidable:true,  placeable:true, module:"m4" },
  { key:"robot",    name:"Robot Block",   color:0x9C4DFF, hardness:0.6,  drop:"robot",   opaque:true,  collidable:true,  placeable:true, module:"m5" },
  { key:"arm",      name:"Arm Block",     color:0xFF5FA2, hardness:0.6,  drop:"arm",     opaque:true,  collidable:true,  placeable:true, module:"m6" },
  { key:"chest",    name:"Treasure Chest",color:0xc9962c, hardness:0.5,  drop:null,      opaque:true,  collidable:true,  placeable:false },
];
const BQ_ID = {};
BQ_BLOCKS.forEach((b,i)=>{ b.id=i; if(b.key) BQ_ID[b.key]=i; });

// Pure inventory resources — never appear in the voxel grid.
const BQ_EXTRA_ITEMS = {
  coal:  { name:"Coal",  color:0x2b2b2b },
  iron:  { name:"Iron",  color:0xd7b98e },
  stick: { name:"Stick", color:0xa9772f },
};
function bqItemInfo(key){ return BQ_BLOCKS[BQ_ID[key]] || BQ_EXTRA_ITEMS[key] || { name:key, color:0xffffff }; }
function bqItemColor(key){ return "#" + bqItemInfo(key).color.toString(16).padStart(6,"0"); }

// CERT_MODULES (from l2-cert.js) supplies the 6 quiz-unlock topic groups.
// Fallback keeps this file self-sufficient if load order ever changes.
const BQ_MODULES = (typeof CERT_MODULES !== "undefined") ? CERT_MODULES : [
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
function bqModule(id){ return BQ_MODULES.find(m=>m.id===id); }

const BQ_RECIPES = [
  { id:"planks",  name:"Planks",        out:"planks",  qty:4, need:{log:1} },
  { id:"stick",   name:"Stick",         out:"stick",   qty:4, need:{planks:2} },
  { id:"torch",   name:"Torch",         out:"torch",   qty:4, need:{stick:1, coal:1} },
  { id:"circuit", name:"Circuit Block", out:"circuit", qty:4, need:{planks:2, stone:1}, module:"m1" },
  { id:"sensor",  name:"Sensor Block",  out:"sensor",  qty:4, need:{planks:1, iron:1},  module:"m2" },
  { id:"motor",   name:"Motor Block",   out:"motor",   qty:2, need:{planks:2, iron:2},  module:"m3" },
  { id:"display", name:"Display Block", out:"display", qty:2, need:{planks:2, iron:1, stone:1}, module:"m4" },
  { id:"robot",   name:"Robot Block",   out:"robot",   qty:2, need:{iron:3, stone:2},   module:"m5" },
  { id:"arm",     name:"Arm Block",     out:"arm",     qty:2, need:{iron:2, planks:2, stick:2}, module:"m6" },
];
function bqRecipe(id){ return BQ_RECIPES.find(r=>r.id===id); }

function bqColorForId(id){
  const palette = [0x3AA0FF,0x00C853,0xFF9800,0x00BCD4,0x9C4DFF,0xFF5FA2,0xffca28,0x66bb6a];
  let h=0; for(let i=0;i<id.length;i++) h=(h*31 + id.charCodeAt(i)) >>> 0;
  return palette[h%palette.length];
}

/* ---------------- SEEDED WORLD-GEN NOISE (no external deps) ---------------- */
function bqHash(x, y, seed){
  let h = (x|0)*374761393 + (y|0)*668265263 + (seed|0)*2246822519;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = h ^ (h >>> 16);
  return ((h >>> 0) % 1000000) / 1000000; // 0..1
}
function bqSmooth(t){ return t*t*(3-2*t); }
function bqValueNoise2D(x, z, seed){
  const x0=Math.floor(x), z0=Math.floor(z), x1=x0+1, z1=z0+1;
  const sx=bqSmooth(x-x0), sz=bqSmooth(z-z0);
  const n00=bqHash(x0,z0,seed), n10=bqHash(x1,z0,seed), n01=bqHash(x0,z1,seed), n11=bqHash(x1,z1,seed);
  const ix0 = n00 + (n10-n00)*sx;
  const ix1 = n01 + (n11-n01)*sx;
  return ix0 + (ix1-ix0)*sz;
}
function bqFbm(x, z, seed, octaves){
  let total=0, amp=1, freq=1, maxAmp=0;
  for(let i=0;i<octaves;i++){
    total += bqValueNoise2D(x*freq, z*freq, seed+i*101) * amp;
    maxAmp += amp; amp*=0.5; freq*=2;
  }
  return total/maxAmp; // 0..1
}
function bqComputeHeight(x,z){
  const nx = x/BQ_SIZE - 0.5, nz = z/BQ_SIZE - 0.5;
  const dist = Math.sqrt(nx*nx+nz*nz) * 2.05;
  const falloff = Math.max(0, 1 - Math.pow(dist, 2.3)); // 1 at center, 0 near edges -> island shape
  const base = bqFbm(x*0.07, z*0.07, BQ_SEED, 4);
  const mountain = Math.pow(bqFbm(x*0.035, z*0.035, BQ_SEED+500, 3), 2.4);
  let h = 5 + base*9 + mountain*11;
  h = h*falloff - (1-falloff)*7;
  return Math.max(0, Math.min(BQ_HEIGHT-3, Math.round(h + BQ_SEA - 9)));
}
function bqBiome(x,z){ return bqFbm(x*0.02+500, z*0.02+500, BQ_SEED+900, 2); }

/* ---------------- L2 ACHIEVEMENTS (appended to the site's existing list) ---------------- */
(function bqRegisterAchievements(){
  if(typeof ACHIEVEMENTS === "undefined") return;
  if(ACHIEVEMENTS.some(a=>a.id==="bq_first_block")) return;
  ACHIEVEMENTS.push(
    {id:"bq_first_block", name:"First Build",    icon:"🧱", desc:"Place your first block in BuildQuest", check:s=>!!(s.game && s.game.blocksPlaced>=1)},
    {id:"bq_miner",       name:"Resourceful",    icon:"⛏️", desc:"Gather 50 resources in BuildQuest", check:s=>!!(s.game && s.game.blocksMined>=50)},
    {id:"bq_crafter",     name:"Craftsperson",   icon:"🛠️", desc:"Craft 10 items in BuildQuest", check:s=>!!(s.game && s.game.itemsCrafted>=10)},
    {id:"bq_engineer",    name:"Lab Unlocked",   icon:"🔬", desc:"Pass all 6 module challenges to unlock every engineering block",
      check:s=>!!(s.game && s.game.unlockedRecipes && BQ_RECIPES.filter(r=>r.module).every(r=>s.game.unlockedRecipes.includes(r.id)))},
    {id:"bq_architect",   name:"Master Builder", icon:"🏗️", desc:"Place 200 blocks in BuildQuest", check:s=>!!(s.game && s.game.blocksPlaced>=200)},
    {id:"bq_treasure",    name:"Treasure Hunter",icon:"🗝️", desc:"Find 3 hidden treasure chests in BuildQuest", check:s=>!!(s.game && s.game.chestsFound>=3)},
    {id:"bq_sharp",       name:"Sharp Mind",     icon:"🧠", desc:"Answer 5 BuildQuest pop quizzes correctly", check:s=>!!(s.game && s.game.popQuizCorrect>=5)}
  );
})();

/* ============================================================
   BuildQuest — main game object
   ============================================================ */
const BuildQuest = {
  active:false, _built:false,
  THREE:null, scene:null, camera:null, renderer:null, canvas:null, clock:null, dummy:null,
  meshGroup:null, _materials:null, _cubeGeo:null, _torchGeo:null, _torchMat:null, _waterGeo:null, _waterMat:null, _waterMesh:null,
  hemi:null, sun:null,
  rafId:null, dayTime:0.3,
  player:{ x:BQ_SIZE/2, y:BQ_HEIGHT, z:BQ_SIZE/2, vx:0,vy:0,vz:0, yaw:Math.PI, pitch:0, grounded:false, flying:false },
  keyState:{ w:false,a:false,s:false,d:false,space:false,shift:false },
  pointerLocked:false, leftDown:false, targeted:null, mining:null,
  panelOpen:null, chatOpen:false,
  inventory:{}, hotbar:["grass","dirt","stone","sand","log","planks","torch",null,null], selectedSlot:0, unlockedRecipes:[],
  _inputBound:false, _saveTimer:null,

  /* ---------------- lifecycle ---------------- */
  async enter(){
    if(this.active) return;
    this.active = true;
    this.leftDown = false;
    if(!this._built){
      this.buildDOM();
      this.showLoading(true, "Generating island…");
      try{
        await this.ensureThree();
        this.initScene();
        this.World.generate();
        await this.loadDiffsFromDB();
        this.spawnPlayer();
        this.buildAllMeshes();
        this.bindInputOnce();
        this._built = true;
      }catch(err){
        console.error("BuildQuest failed to start", err);
        this.showLoading(true, "⚠️ Couldn't load BuildQuest — check your connection and try again.");
        this.active = false;
        return;
      }
    } else {
      this.showLoading(true, "Syncing world…");
      await this.loadDiffsFromDB();
      this.spawnPlayer();
      this.buildAllMeshes();
    }
    this.loadPlayerState();
    this.showLoading(false);
    this.showPointerHint(true);
    this.onResize();
    this.startLoop();
    this.Net.join();
    this.renderPlayerList();
  },

  suspend(){
    if(!this.active) return;
    this.active = false;
    if(this.canvas && document.pointerLockElement===this.canvas) document.exitPointerLock();
    if(this.rafId){ cancelAnimationFrame(this.rafId); this.rafId=null; }
    this.Net.leave();
    clearTimeout(this._saveTimer);
    if(Auth.profile) Store.save(App.state);
    this.hideAllPanels();
    const qb = document.getElementById("bq-quiz-backdrop"); if(qb) qb.classList.remove("show");
    // Reset both quiz sub-modules' own state flags, not just the DOM — otherwise exiting
    // mid-quiz leaves PopQuiz.active/Quiz.recipe stuck truthy, which would permanently
    // pause player movement (via the loop's `paused` check) on the next re-entry.
    this.PopQuiz.active = false; this.PopQuiz.q = null;
    this.Quiz.recipe = null; this.Quiz.q = null;
    this.Chat.close();
    this.keyState = {w:false,a:false,s:false,d:false,space:false,shift:false};
    this.leftDown = false;
  },

  exit(){ App.enterHome(); },

  async ensureThree(){
    if(window.THREE_BQ){ this.THREE = window.THREE_BQ; return; }
    const mod = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js");
    window.THREE_BQ = mod;
    this.THREE = mod;
  },

  buildDOM(){
    const root = document.getElementById("bq-root");
    root.innerHTML = `
      <canvas id="bq-canvas"></canvas>
      <div class="bq-loading" id="bq-loading"><div class="bq-spinner"></div><div id="bq-loading-text">Loading BuildQuest…</div></div>
      <div class="bq-crosshair" id="bq-crosshair"></div>
      <div class="bq-mine-bar" id="bq-mine-bar"><div class="bq-mine-bar-fill" id="bq-mine-bar-fill"></div></div>
      <div class="bq-toast" id="bq-toast"></div>
      <div class="bq-hud-top">
        <button class="bq-exit-btn" onclick="BuildQuest.exit()">✕ Exit</button>
        <span class="bq-title">🧱 BuildQuest</span>
        <span class="bq-pill">⚡ <span id="bq-xp">0</span> XP</span>
        <span class="bq-pill">🪙 <span id="bq-coins">0</span></span>
        <button class="bq-pill" style="cursor:pointer;" onclick="BuildQuest.togglePanel('inventory')">🎒 Inventory (E)</button>
        <button class="bq-pill" style="cursor:pointer;" onclick="BuildQuest.toggleFly()">🪶 Fly (F): <span id="bq-fly-state">Off</span></button>
      </div>
      <div class="bq-players" id="bq-players"><h4>Online</h4><div id="bq-players-list"></div></div>
      <div class="bq-hotbar" id="bq-hotbar"></div>
      <div class="bq-chat" id="bq-chat">
        <div class="bq-chat-log" id="bq-chat-log"></div>
        <input class="bq-chat-input" id="bq-chat-input" maxlength="140" placeholder="Say something… (Enter to send, Esc to cancel)">
        <div class="bq-chat-hint">Press T to chat</div>
      </div>
      <div class="bq-pointer-hint" id="bq-pointer-hint" onclick="BuildQuest.lockPointer()">
        <div class="big">🖱️ Click to enter the world</div>
        <div class="keys">
          <span class="bq-key">WASD move</span><span class="bq-key">Mouse look</span><span class="bq-key">Space jump</span><span class="bq-key">Shift sprint</span>
          <span class="bq-key">Left-click mine</span><span class="bq-key">Right-click place</span>
          <span class="bq-key">1-9 hotbar</span><span class="bq-key">E inventory</span><span class="bq-key">F fly</span><span class="bq-key">T chat</span>
        </div>
      </div>
      <div class="bq-panel" id="bq-panel-inventory">
        <div class="bq-panel-head"><h2>🎒 Inventory &amp; Crafting</h2><button class="btn btn-ghost btn-sm" onclick="BuildQuest.togglePanel('inventory')">✕ Close</button></div>
        <h3 class="small muted" style="margin-bottom:8px;">Resources (click to select for building)</h3>
        <div class="bq-inv-grid" id="bq-inv-grid"></div>
        <h3 class="small muted" style="margin-bottom:8px;">Crafting</h3>
        <div class="bq-recipe-list" id="bq-recipe-list"></div>
      </div>
      <div class="bq-quiz-backdrop" id="bq-quiz-backdrop"><div class="bq-quiz-card" id="bq-quiz-card"></div></div>
    `;
    this.canvas = document.getElementById("bq-canvas");
  },

  showLoading(show, text){
    const el = document.getElementById("bq-loading");
    if(!el) return;
    el.style.display = show ? "flex" : "none";
    if(text){ const t=document.getElementById("bq-loading-text"); if(t) t.textContent = text; }
  },
  showPointerHint(show){
    const hint = document.getElementById("bq-pointer-hint");
    if(hint) hint.style.display = show ? "flex" : "none";
  },

  /* ---------------- scene / rendering ---------------- */
  initScene(){
    const T = this.THREE;
    this.scene = new T.Scene();
    this.scene.fog = new T.Fog(0x8fd0ee, 28, 96);
    this.camera = new T.PerspectiveCamera(70, window.innerWidth/Math.max(1,window.innerHeight), 0.05, 200);
    this.renderer = new T.WebGLRenderer({ canvas:this.canvas, antialias:true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    if(T.SRGBColorSpace) this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;

    this.hemi = new T.HemisphereLight(0xbfe3ff, 0x445533, 0.9);
    this.scene.add(this.hemi);
    this.sun = new T.DirectionalLight(0xfff2d6, 1.0);
    this.sun.position.set(40,60,20);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024,1024);
    this.sun.shadow.camera.left = -BQ_SIZE*0.72;
    this.sun.shadow.camera.right = BQ_SIZE*0.72;
    this.sun.shadow.camera.top = BQ_SIZE*0.72;
    this.sun.shadow.camera.bottom = -BQ_SIZE*0.72;
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 220;
    this.sun.shadow.bias = -0.0025;
    // Fixed at the island's center (not the world origin) so the shadow frustum
    // always covers the terrain regardless of where the sun orbits to.
    this.sun.target.position.set(BQ_SIZE/2, 0, BQ_SIZE/2);
    this.scene.add(this.sun.target);
    this.scene.add(this.sun);
    this.scene.add(new T.AmbientLight(0x404050, 0.35));

    this.dummy = new T.Object3D();
    this.clock = new T.Clock();
    this._skyRefresh = 0;
    this.updateDayNight(0); // paint the initial sky/fog before the first frame renders
    this.buildClouds();
  },

  // Flat drifting cloud slabs, Minecraft-style — cheap (a dozen unlit boxes, no shadows)
  // and one of the single most recognizable "looks like that game" visual cues.
  buildClouds(){
    const T = this.THREE;
    const cloudMat = new T.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:0.85, depthWrite:false, fog:false });
    this.cloudGroup = new T.Group();
    this._cloudBaseX = [];
    this._cloudRange = BQ_SIZE*2.4;
    this._cloudDrift = 0;
    const n = 14;
    for(let i=0;i<n;i++){
      const w = 6 + bqHash(i,1,555)*10, d = 4 + bqHash(i,2,555)*6;
      const mesh = new T.Mesh(new T.BoxGeometry(w,1.2,d), cloudMat);
      const bx = bqHash(i,3,555)*this._cloudRange;
      this._cloudBaseX.push(bx);
      mesh.position.set(bx-this._cloudRange/2, 46+bqHash(i,4,555)*8, bqHash(i,5,555)*BQ_SIZE*2.2 - BQ_SIZE*0.6);
      this.cloudGroup.add(mesh);
    }
    this.scene.add(this.cloudGroup);
  },
  updateClouds(dt){
    if(!this.cloudGroup) return;
    this._cloudDrift = (this._cloudDrift + dt*0.4) % this._cloudRange;
    this.cloudGroup.children.forEach((mesh,i)=>{
      mesh.position.x = ((this._cloudBaseX[i]+this._cloudDrift) % this._cloudRange) - this._cloudRange/2;
    });
  },

  // A handful of real, non-shadow-casting point lights follow the first N placed torches so
  // night builds actually glow — capped so torch spam can't blow up the light/shader budget.
  _ensureTorchLightPool(){
    if(this._torchLights && this._torchLights.length) return;
    const T = this.THREE;
    this._torchLights = [];
    for(let i=0;i<12;i++){
      const light = new T.PointLight(0xffb347, 0, 6.5, 2);
      this.scene.add(light);
      this._torchLights.push(light);
    }
  },

  spawnPlayer(){
    const saved = App.state.game && App.state.game.pos;
    let x, z;
    if(saved && saved.x>=0 && saved.x<BQ_SIZE && saved.z>=0 && saved.z<BQ_SIZE){ x=saved.x; z=saved.z; }
    else { x=BQ_SIZE/2; z=BQ_SIZE/2; }
    const h = this.World.heightAt(Math.floor(x), Math.floor(z));
    this.player.x=x; this.player.z=z;
    this.player.y = (saved && saved.y>h) ? saved.y : Math.max(h+1, BQ_SEA+1)+1;
    this.player.yaw = (saved && typeof saved.yaw==="number") ? saved.yaw : Math.PI;
    this.player.pitch = 0;
    this.player.vx=this.player.vy=this.player.vz=0;
    this.player.flying=false; this.player.grounded=false;
  },

  // Paints a 16x16 canvas for a block face: coarse 4x4 "blotches" (so it reads as a real
  // material pattern, not TV static) plus a finer per-pixel grain on top. Fully procedural —
  // no external image assets, and no real Minecraft texture data anywhere in this.
  _paintBlockCanvas(colorHex, seedA, seedB){
    const T = this.THREE;
    const size = 16;
    const canvas = document.createElement("canvas");
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext("2d");
    const base = new T.Color(colorHex);
    for(let y=0;y<size;y++){
      for(let x=0;x<size;x++){
        const macro = bqHash(Math.floor(x/4)+seedA*97+seedB*7, Math.floor(y/4)+seedA*131+seedB*11, 9001);
        const micro = bqHash(x+seedA*53+seedB*3, y+seedA*61+seedB*5, 4242);
        const shade = 0.80 + macro*0.28 + micro*0.10; // ~0.80..1.18
        const r = Math.min(255, Math.round(base.r*255*shade));
        const g = Math.min(255, Math.round(base.g*255*shade));
        const b = Math.min(255, Math.round(base.b*255*shade));
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x,y,1,1);
      }
    }
    return canvas;
  },
  _paintOreSpots(canvas, seed, spotColorHex, count){
    const ctx = canvas.getContext("2d");
    const c = new this.THREE.Color(spotColorHex);
    const cr=Math.round(c.r*255), cg=Math.round(c.g*255), cb=Math.round(c.b*255);
    ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
    for(let i=0;i<count;i++){
      const x = 1+Math.floor(bqHash(i,seed*3+1,111)*13);
      const y = 1+Math.floor(bqHash(i,seed*5+2,222)*13);
      ctx.fillRect(x,y,2,2);
    }
  },
  _wrapTex(canvas){
    const T = this.THREE;
    const tex = new T.CanvasTexture(canvas);
    tex.magFilter = T.NearestFilter;
    tex.minFilter = T.NearestFilter;
    if(T.SRGBColorSpace) tex.colorSpace = T.SRGBColorSpace;
    return tex;
  },
  _texFor(id){
    if(!this._textures) this._textures = {};
    if(this._textures[id]) return this._textures[id];
    const canvas = this._paintBlockCanvas(BQ_BLOCKS[id].color, id, 0);
    if(id===BQ_ID.coal_ore) this._paintOreSpots(canvas, id, 0x141414, 7);
    if(id===BQ_ID.iron_ore) this._paintOreSpots(canvas, id, 0xdba368, 7);
    if(id===BQ_ID.chest) this._paintOreSpots(canvas, id, 0xffe082, 4);
    const tex = this._wrapTex(canvas);
    this._textures[id] = tex;
    return tex;
  },
  _matFor(id){
    if(!this._materials) this._materials = {};
    if(this._materials[id]) return this._materials[id];
    const mat = new this.THREE.MeshStandardMaterial({ map: this._texFor(id), roughness:0.92, metalness:0.02 });
    this._materials[id] = mat;
    return mat;
  },
  // BoxGeometry always builds 6 face-groups in order [+x,-x,+y,-y,+z,-z] with materialIndex
  // 0-5 to match, whether or not you use a single material — so a 6-entry array here maps
  // straight onto [side,side,top,bottom,side,side] with no extra geometry work needed.
  _grassMaterials(){
    if(this._grassMats) return this._grassMats;
    const T = this.THREE;
    const topCanvas = this._paintBlockCanvas(BQ_BLOCKS[BQ_ID.grass].color, BQ_ID.grass, 1);
    const tctx = topCanvas.getContext("2d");
    tctx.fillStyle = "rgba(255,255,255,0.14)";
    for(let i=0;i<16;i++) tctx.fillRect(Math.floor(bqHash(i,1,701)*16), Math.floor(bqHash(i,2,701)*16), 1, 1);

    const dirtColor = BQ_BLOCKS[BQ_ID.dirt].color;
    const sideCanvas = this._paintBlockCanvas(dirtColor, BQ_ID.grass, 2);
    const sctx = sideCanvas.getContext("2d");
    const grassCol = new T.Color(BQ_BLOCKS[BQ_ID.grass].color);
    for(let x=0;x<16;x++){
      const h = 3 + Math.floor(bqHash(x,3,701)*2);
      for(let y=0;y<h;y++){
        const shade = 0.85 + bqHash(x,y+40,701)*0.3;
        sctx.fillStyle = `rgb(${Math.round(grassCol.r*255*shade)},${Math.round(grassCol.g*255*shade)},${Math.round(grassCol.b*255*shade)})`;
        sctx.fillRect(x,y,1,1);
      }
    }
    const bottomCanvas = this._paintBlockCanvas(dirtColor, BQ_ID.dirt, 0);
    const mk = canvas => new T.MeshStandardMaterial({ map:this._wrapTex(canvas), roughness:0.92, metalness:0.02 });
    const top=mk(topCanvas), side=mk(sideCanvas), bottom=mk(bottomCanvas);
    this._grassMats = [side, side, top, bottom, side, side];
    return this._grassMats;
  },
  _logMaterials(){
    if(this._logMats) return this._logMats;
    const T = this.THREE;
    const logColor = BQ_BLOCKS[BQ_ID.log].color;
    const sideCanvas = this._paintBlockCanvas(logColor, BQ_ID.log, 1);
    const sctx = sideCanvas.getContext("2d");
    const dark = new T.Color(logColor).multiplyScalar(0.7);
    const darkRgb = `rgb(${Math.round(dark.r*255)},${Math.round(dark.g*255)},${Math.round(dark.b*255)})`;
    for(let x=0;x<16;x+=2){
      if(bqHash(x,9,808) > 0.5) continue;
      sctx.fillStyle = darkRgb;
      sctx.fillRect(x,0,1,16);
    }
    const endCanvas = this._paintBlockCanvas(logColor, BQ_ID.log, 2);
    const ectx = endCanvas.getContext("2d");
    const ring = new T.Color(logColor).multiplyScalar(0.68);
    ectx.strokeStyle = `rgb(${Math.round(ring.r*255)},${Math.round(ring.g*255)},${Math.round(ring.b*255)})`;
    ectx.lineWidth = 1;
    for(let rad=2; rad<8; rad+=2.2){ ectx.beginPath(); ectx.arc(8,8,rad,0,Math.PI*2); ectx.stroke(); }
    const mk = canvas => new T.MeshStandardMaterial({ map:this._wrapTex(canvas), roughness:0.92, metalness:0.02 });
    const side=mk(sideCanvas), end=mk(endCanvas);
    this._logMats = [side, side, end, end, side, side];
    return this._logMats;
  },

  buildAllMeshes(){
    const T = this.THREE;
    if(this.meshGroup) this.scene.remove(this.meshGroup);
    this.meshGroup = new T.Group();
    const cubeGeo = this._cubeGeo || (this._cubeGeo = new T.BoxGeometry(1,1,1));

    const buckets = {};
    const torchCells = [];
    for(let x=0;x<BQ_SIZE;x++){
      for(let z=0;z<BQ_SIZE;z++){
        for(let y=0;y<BQ_HEIGHT;y++){
          const id = this.World.data[this.World.idx(x,y,z)];
          if(!id || id===BQ_ID.water) continue;
          if(id===BQ_ID.torch){ torchCells.push(x,y,z); continue; }
          const exposed =
            !this.World.isOpaqueForCulling(x+1,y,z) || !this.World.isOpaqueForCulling(x-1,y,z) ||
            !this.World.isOpaqueForCulling(x,y+1,z) || !this.World.isOpaqueForCulling(x,y-1,z) ||
            !this.World.isOpaqueForCulling(x,y,z+1) || !this.World.isOpaqueForCulling(x,y,z-1);
          if(!exposed) continue;
          (buckets[id] || (buckets[id]=[])).push(x,y,z);
        }
      }
    }

    const tintColor = this._tintColor || (this._tintColor = new T.Color());
    Object.keys(buckets).forEach(idStr=>{
      const id = +idStr;
      const cells = buckets[id];
      const count = cells.length/3;
      if(!count) return;
      const multiFace = (id===BQ_ID.grass) ? this._grassMaterials() : (id===BQ_ID.log) ? this._logMaterials() : null;
      const mesh = new T.InstancedMesh(cubeGeo, multiFace || this._matFor(id), count);
      for(let i=0;i<count;i++){
        const bx=cells[i*3], by=cells[i*3+1], bz=cells[i*3+2];
        this.dummy.position.set(bx+0.5, by+0.5, bz+0.5);
        this.dummy.updateMatrix();
        mesh.setMatrixAt(i, this.dummy.matrix);
        // subtle per-block brightness jitter on top of the texture noise, so large flat
        // areas of the same block type don't read as one uniform plastic-looking slab.
        // Skipped on multi-face blocks (grass/log) to keep the riskier multi-material +
        // per-instance-color combination out of the highest-traffic block types.
        if(!multiFace){
          const shade = 0.88 + bqHash(bx*11+bz*7, by*13+3, id*31+5)*0.24;
          mesh.setColorAt(i, tintColor.setScalar(shade));
        }
      }
      mesh.instanceMatrix.needsUpdate = true;
      if(mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.meshGroup.add(mesh);
    });

    this._ensureTorchLightPool();
    const maxLights = this._torchLights.length;
    if(torchCells.length){
      const torchGeo = this._torchGeo || (this._torchGeo = new T.BoxGeometry(0.15,0.6,0.15));
      const torchMat = this._torchMat || (this._torchMat = new T.MeshBasicMaterial({ color: BQ_BLOCKS[BQ_ID.torch].color }));
      const tCount = torchCells.length/3;
      const tMesh = new T.InstancedMesh(torchGeo, torchMat, tCount);
      for(let i=0;i<tCount;i++){
        const tx=torchCells[i*3], ty=torchCells[i*3+1], tz=torchCells[i*3+2];
        this.dummy.position.set(tx+0.5, ty+0.35, tz+0.5);
        this.dummy.updateMatrix();
        tMesh.setMatrixAt(i, this.dummy.matrix);
        if(i<maxLights) this._torchLights[i].position.set(tx+0.5, ty+0.65, tz+0.5);
      }
      tMesh.instanceMatrix.needsUpdate = true;
      this.meshGroup.add(tMesh);
      for(let i=0;i<maxLights;i++) this._torchLights[i].intensity = i<Math.min(tCount,maxLights) ? 1.1 : 0;
    } else {
      for(let i=0;i<maxLights;i++) this._torchLights[i].intensity = 0;
    }

    const waterCells = [];
    for(let x=0;x<BQ_SIZE;x++) for(let z=0;z<BQ_SIZE;z++){ if(this.World.heightAt(x,z) < BQ_SEA) waterCells.push(x,z); }
    if(waterCells.length){
      const waterGeo = this._waterGeo || (this._waterGeo = new T.BoxGeometry(1,0.15,1));
      const waterMat = this._waterMat || (this._waterMat = new T.MeshStandardMaterial({ color: BQ_BLOCKS[BQ_ID.water].color, transparent:true, opacity:0.72, roughness:0.15, metalness:0.05 }));
      const wCount = waterCells.length/2;
      const wMesh = new T.InstancedMesh(waterGeo, waterMat, wCount);
      for(let i=0;i<wCount;i++){
        this.dummy.position.set(waterCells[i*2]+0.5, BQ_SEA+0.92, waterCells[i*2+1]+0.5);
        this.dummy.updateMatrix();
        wMesh.setMatrixAt(i, this.dummy.matrix);
      }
      wMesh.instanceMatrix.needsUpdate = true;
      this.meshGroup.add(wMesh);
      this._waterMesh = wMesh;
    } else { this._waterMesh = null; }

    this.scene.add(this.meshGroup);
  },

  updateDayNight(dt){
    const T = this.THREE;
    this.dayTime = (this.dayTime + dt/300) % 1; // ~5 minute full cycle
    const angle = this.dayTime*Math.PI*2;
    const sunHeight = Math.sin(angle);
    this.sun.position.set(BQ_SIZE/2 + Math.cos(angle)*60, Math.max(sunHeight,0.05)*60+10, BQ_SIZE/2+30);
    const dayCol = new T.Color(0x8fd0ee), nightCol = new T.Color(0x0a1128), duskCol = new T.Color(0xff9d5c);
    let sky;
    if(sunHeight>0.25) sky = dayCol;
    else if(sunHeight>-0.05){ const k=(sunHeight+0.05)/0.3; sky = duskCol.clone().lerp(dayCol, Math.max(0,Math.min(1,k))); }
    else { const k=(sunHeight+0.15)/0.1; sky = nightCol.clone().lerp(duskCol, Math.max(0,Math.min(1,k))); }
    if(!this._skyColor) this._skyColor = new T.Color();
    this._skyColor.copy(sky);
    this._skyRefresh -= dt;
    if(this._skyRefresh<=0){ this._skyRefresh = 0.25; this.updateSkyTexture(sky); }
    this.scene.fog.color.copy(sky);
    this.sun.intensity = Math.max(0.08, sunHeight) + 0.15;
    this.hemi.intensity = Math.max(0.25, sunHeight*0.9+0.35);
  },

  // A simple vertical-gradient background (2px-wide canvas stretched by the GPU) — much
  // cheaper and lower-risk than a real sky dome/shader, but reads far better than a flat
  // fill color. Throttled to a few times a second since it changes slowly.
  updateSkyTexture(topColor){
    const T = this.THREE;
    if(!this._skyCanvas){
      this._skyCanvas = document.createElement("canvas");
      this._skyCanvas.width = 2; this._skyCanvas.height = 128;
      this._skyCtx = this._skyCanvas.getContext("2d");
      this._skyTex = new T.CanvasTexture(this._skyCanvas);
      this.scene.background = this._skyTex;
    }
    const horizon = topColor.clone().lerp(new T.Color(0xffffff), 0.35);
    const g = this._skyCtx.createLinearGradient(0,0,0,128);
    g.addColorStop(0, "#"+topColor.getHexString());
    g.addColorStop(0.7, "#"+horizon.getHexString());
    g.addColorStop(1, "#"+horizon.getHexString());
    this._skyCtx.fillStyle = g;
    this._skyCtx.fillRect(0,0,2,128);
    this._skyTex.needsUpdate = true;
  },

  onResize(){
    if(!this.renderer || !this.camera) return;
    this.camera.aspect = window.innerWidth/Math.max(1,window.innerHeight);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  },

  /* ---------------- game loop ---------------- */
  startLoop(){
    if(this.rafId) return;
    this.clock.start();
    const loop = ()=>{
      this.rafId = requestAnimationFrame(loop);
      const dt = Math.min(0.1, this.clock.getDelta());
      if(!this.active) return;
      const paused = !!(this.panelOpen || this.chatOpen || this.PopQuiz.active || this.Quiz.recipe);
      if(!paused) this.updatePlayer(dt);
      this.updateTargeted();
      if(!paused) this.updateMining(dt);
      this.updateDayNight(dt);
      this.updateClouds(dt);
      this.updateRemotes(dt);
      this._popQuizTimer = (this._popQuizTimer||0) + dt;
      if(!paused && this._popQuizTimer >= BQ_POPQUIZ_INTERVAL){ this._popQuizTimer = 0; this.PopQuiz.trigger(); }
      if(this._waterMesh) this._waterMesh.position.y = Math.sin(performance.now()*0.0008)*0.06;
      this.Net.sendMove();
      this.renderer.render(this.scene, this.camera);
      App.state.game.pos = { x:this.player.x, y:this.player.y, z:this.player.z, yaw:this.player.yaw };
    };
    this.rafId = requestAnimationFrame(loop);
  },

  /* ---------------- player movement / physics ---------------- */
  updatePlayer(dt){
    const p = this.player;
    const sprinting = this.keyState.shift && !p.flying;
    const speed = (sprinting?7.5:4.8) * (p.flying?1.6:1);
    let mx=0, mz=0;
    if(this.keyState.w) mz-=1; if(this.keyState.s) mz+=1;
    if(this.keyState.a) mx-=1; if(this.keyState.d) mx+=1;
    const len = Math.hypot(mx,mz) || 1;
    mx/=len; mz/=len;
    // Camera forward (yaw=0 looks down -Z) is (-sin(yaw), -cos(yaw)); right is (cos(yaw), -sin(yaw)).
    // World movement = mx*right + (-mz)*forward, expanded below. (Previous version had both
    // cross-terms sign-flipped, so it only matched the camera past ~yaw 0 and mirrored beyond it.)
    const sinY=Math.sin(p.yaw), cosY=Math.cos(p.yaw);
    p.vx = (mx*cosY + mz*sinY) * speed;
    p.vz = (mz*cosY - mx*sinY) * speed;

    if(p.flying){
      p.vy = (this.keyState.space?1:0)*speed - (this.keyState.shift?1:0)*speed;
    } else {
      p.vy -= 22*dt;
      if(this.keyState.space && p.grounded){ p.vy = 8.2; p.grounded=false; }
    }

    this.moveAxis("x", p.vx*dt);
    this.moveAxis("z", p.vz*dt);
    this.moveAxis("y", p.vy*dt);

    this.camera.position.set(p.x, p.y+1.6, p.z);
    this.camera.rotation.order = "YXZ";
    this.camera.rotation.y = p.yaw;
    this.camera.rotation.x = p.pitch;
  },
  moveAxis(axis, delta){
    if(!delta) return;
    const p = this.player, r = 0.28;
    if(axis==="x"){ const nx=p.x+delta; if(!this.collides(nx,p.y,p.z,r)) p.x=nx; }
    else if(axis==="z"){ const nz=p.z+delta; if(!this.collides(p.x,p.y,nz,r)) p.z=nz; }
    else {
      const ny = p.y+delta;
      if(this.collides(p.x,ny,p.z,r)){ if(delta<0) p.grounded=true; p.vy=0; }
      else { p.y=ny; if(delta<0) p.grounded=false; }
    }
  },
  collides(x,y,z,r){
    const pts = [
      [x-r,y,z-r],[x+r,y,z-r],[x-r,y,z+r],[x+r,y,z+r],
      [x-r,y+1.5,z-r],[x+r,y+1.5,z-r],[x-r,y+1.5,z+r],[x+r,y+1.5,z+r],
    ];
    for(const [px,py,pz] of pts){
      const id = this.World.getBlock(Math.floor(px), Math.floor(py), Math.floor(pz));
      if(id && BQ_BLOCKS[id].collidable) return true;
    }
    return false;
  },

  toggleFly(){
    this.player.flying = !this.player.flying;
    if(this.player.flying) this.player.vy = 0;
    const el = document.getElementById("bq-fly-state");
    if(el) el.textContent = this.player.flying ? "On" : "Off";
  },

  /* ---------------- raycasting / mining / placing ---------------- */
  raycastVoxel(origin, dir, maxDist){
    let x=Math.floor(origin.x), y=Math.floor(origin.y), z=Math.floor(origin.z);
    const stepX=dir.x>0?1:-1, stepY=dir.y>0?1:-1, stepZ=dir.z>0?1:-1;
    const tDeltaX = dir.x!==0?Math.abs(1/dir.x):Infinity;
    const tDeltaY = dir.y!==0?Math.abs(1/dir.y):Infinity;
    const tDeltaZ = dir.z!==0?Math.abs(1/dir.z):Infinity;
    const frac=v=>v-Math.floor(v);
    let tMaxX = dir.x>0 ? (1-frac(origin.x))*tDeltaX : frac(origin.x)*tDeltaX;
    let tMaxY = dir.y>0 ? (1-frac(origin.y))*tDeltaY : frac(origin.y)*tDeltaY;
    let tMaxZ = dir.z>0 ? (1-frac(origin.z))*tDeltaZ : frac(origin.z)*tDeltaZ;
    let normal={x:0,y:0,z:0}, dist=0;
    for(let i=0;i<160 && dist<maxDist;i++){
      const id = this.World.getBlock(x,y,z);
      if(id>0 && id!==BQ_ID.water){
        return { x,y,z,id, normal:{...normal}, place:{x:x+normal.x, y:y+normal.y, z:z+normal.z} };
      }
      if(tMaxX<tMaxY && tMaxX<tMaxZ){ x+=stepX; dist=tMaxX; tMaxX+=tDeltaX; normal={x:-stepX,y:0,z:0}; }
      else if(tMaxY<tMaxZ){ y+=stepY; dist=tMaxY; tMaxY+=tDeltaY; normal={x:0,y:-stepY,z:0}; }
      else { z+=stepZ; dist=tMaxZ; tMaxZ+=tDeltaZ; normal={x:0,y:0,z:-stepZ}; }
    }
    return null;
  },
  updateTargeted(){
    if(!this.pointerLocked){ this.targeted=null; return; }
    const dir = new this.THREE.Vector3();
    this.camera.getWorldDirection(dir);
    this.targeted = this.raycastVoxel({x:this.camera.position.x,y:this.camera.position.y,z:this.camera.position.z}, {x:dir.x,y:dir.y,z:dir.z}, BQ_REACH);
  },
  setMineBar(pct){
    const bar = document.getElementById("bq-mine-bar");
    const fill = document.getElementById("bq-mine-bar-fill");
    if(!bar) return;
    bar.style.display = pct>0 ? "block" : "none";
    if(fill) fill.style.width = pct+"%";
  },
  updateMining(dt){
    const cross = document.getElementById("bq-crosshair");
    if(!this.leftDown || !this.targeted){
      this.mining=null; this.setMineBar(0);
      if(cross) cross.classList.remove("mining");
      return;
    }
    const t = this.targeted;
    if(!this.mining || this.mining.x!==t.x || this.mining.y!==t.y || this.mining.z!==t.z){
      this.mining = { x:t.x, y:t.y, z:t.z, progress:0 };
    }
    const need = Math.max(0.05, BQ_BLOCKS[t.id].hardness||0.3);
    this.mining.progress += dt;
    this.setMineBar(Math.min(1, this.mining.progress/need)*100);
    if(cross) cross.classList.add("mining");
    if(this.mining.progress >= need){
      this.breakBlock(t.x,t.y,t.z);
      this.mining=null; this.setMineBar(0);
    }
  },
  breakBlock(x,y,z){
    const id = this.World.getBlock(x,y,z);
    if(!id) return;
    const def = BQ_BLOCKS[id];
    this.World.setBlock(x,y,z,0);
    if(id===BQ_ID.chest) this.openTreasure();
    else if(def.drop) this.addItem(def.drop,1);
    App.state.game.blocksMined = (App.state.game.blocksMined||0)+1;
    this.buildAllMeshes();
    this.renderHotbar();
    App.checkAchievements();
    this.persistBlock(x,y,z,0);
    this.Net.sendBlock(x,y,z,0);
    this.scheduleSave();
  },
  openTreasure(){
    const bundle = { stone:3, coal:2, iron:1, planks:2 };
    Object.keys(bundle).forEach(k=> this.addItem(k, bundle[k]));
    App.state.xp += 20; App.state.coins += 10;
    App.state.game.chestsFound = (App.state.game.chestsFound||0)+1;
    this.renderHUDStats();
    App.celebrate();
    Sound.badge();
    this.toast("🗝️ Treasure! +3 stone, +2 coal, +1 iron, +2 planks, +20 XP, +10 coins");
  },
  toast(msg){
    const el = document.getElementById("bq-toast");
    if(!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(()=> el.classList.remove("show"), 3400);
  },
  placeBlock(){
    if(!this.active || !this.pointerLocked || !this.targeted) return;
    const key = this.hotbar[this.selectedSlot];
    if(!key) return;
    const id = BQ_ID[key];
    if(id===undefined || !BQ_BLOCKS[id].placeable) return;
    if(!(this.inventory[key]>0)) return;
    const p = this.targeted.place;
    if(!this.World.inBounds(p.x,p.y,p.z)) return;
    if(this.World.getBlock(p.x,p.y,p.z)!==0) return;
    const feet = this.player;
    const overlapsPlayer = (p.x===Math.floor(feet.x) && p.z===Math.floor(feet.z) && (p.y===Math.floor(feet.y) || p.y===Math.floor(feet.y+1)));
    if(overlapsPlayer) return;
    this.World.setBlock(p.x,p.y,p.z,id);
    this.inventory[key]--;
    App.state.game.blocksPlaced = (App.state.game.blocksPlaced||0)+1;
    this.buildAllMeshes();
    this.renderHotbar();
    App.checkAchievements();
    this.persistBlock(p.x,p.y,p.z,id);
    this.Net.sendBlock(p.x,p.y,p.z,id);
    this.scheduleSave();
    Sound.click();
  },

  /* ---------------- world data ---------------- */
  World: {
    data:null,
    idx(x,y,z){ return (y*BQ_SIZE + z)*BQ_SIZE + x; },
    inBounds(x,y,z){ return x>=0&&x<BQ_SIZE && y>=0&&y<BQ_HEIGHT && z>=0&&z<BQ_SIZE; },
    getBlock(x,y,z){
      if(y<0) return BQ_ID.stone; // bedrock floor, always solid
      if(!this.inBounds(x,y,z)) return 0;
      return this.data[this.idx(x,y,z)];
    },
    setBlock(x,y,z,id){ if(this.inBounds(x,y,z)) this.data[this.idx(x,y,z)] = id; },
    isOpaqueForCulling(x,y,z){
      if(y<0) return true;
      if(!this.inBounds(x,y,z)) return false;
      const id = this.data[this.idx(x,y,z)];
      return id ? !!BQ_BLOCKS[id].opaque : false;
    },
    heightAt(x,z){
      x=Math.max(0,Math.min(BQ_SIZE-1,x)); z=Math.max(0,Math.min(BQ_SIZE-1,z));
      for(let y=BQ_HEIGHT-1;y>=0;y--){ const b=this.data[this.idx(x,y,z)]; if(b>0 && b!==BQ_ID.water) return y; }
      return 0;
    },
    generate(){
      this.data = new Uint8Array(BQ_SIZE*BQ_HEIGHT*BQ_SIZE);
      for(let x=0;x<BQ_SIZE;x++){
        for(let z=0;z<BQ_SIZE;z++){
          const h = bqComputeHeight(x,z);
          const desert = bqBiome(x,z) > 0.62;
          for(let y=0;y<BQ_HEIGHT;y++){
            let id = 0;
            if(y>h){ id = (y<=BQ_SEA) ? BQ_ID.water : 0; }
            else if(y===h){ id = (h<=BQ_SEA+1 || desert) ? BQ_ID.sand : BQ_ID.grass; }
            else if(y>h-3){ id = desert ? BQ_ID.sand : BQ_ID.dirt; }
            else {
              id = BQ_ID.stone;
              const depth = h-y;
              const r = bqHash(x*3+1, z*7+y*13, BQ_SEED+42);
              if(depth>4 && depth<10 && r<0.02) id = BQ_ID.coal_ore;
              else if(depth>=10 && r<0.012) id = BQ_ID.iron_ore;
            }
            if(id) this.data[this.idx(x,y,z)] = id;
          }
        }
      }
      for(let x=2;x<BQ_SIZE-2;x++){
        for(let z=2;z<BQ_SIZE-2;z++){
          const h = this.heightAt(x,z);
          if(h<=BQ_SEA+1 || h>=BQ_SEA+14) continue;
          if(this.data[this.idx(x,h,z)]!==BQ_ID.grass) continue;
          if(bqHash(x*17+3,z*23+9,BQ_SEED+777) < 0.025) this.placeTree(x,h+1,z);
        }
      }
      // Rare hidden treasure chests — an exploration incentive. Deliberately low density
      // (roughly a handful across the whole island) so finding one feels like a discovery.
      for(let x=1;x<BQ_SIZE-1;x++){
        for(let z=1;z<BQ_SIZE-1;z++){
          const h = this.heightAt(x,z);
          if(h<=BQ_SEA) continue;
          const top = this.data[this.idx(x,h,z)];
          if(top!==BQ_ID.grass && top!==BQ_ID.sand) continue;
          if(this.getBlock(x,h+1,z)!==0) continue; // don't overwrite a tree that landed here
          if(bqHash(x*29+11, z*31+17, BQ_SEED+4242) < 0.0035) this.setBlock(x,h+1,z, BQ_ID.chest);
        }
      }
    },
    placeTree(x,y,z){
      const height = 3 + Math.floor(bqHash(x,z,BQ_SEED+55)*2);
      for(let i=0;i<height;i++) this.setBlock(x,y+i,z,BQ_ID.log);
      for(let ly=-1;ly<=1;ly++){
        for(let lx=-2;lx<=2;lx++){
          for(let lz=-2;lz<=2;lz++){
            if(Math.abs(lx)===2 && Math.abs(lz)===2) continue;
            const yy=y+height-1+ly;
            if(this.getBlock(x+lx,yy,z+lz)===0) this.setBlock(x+lx,yy,z+lz,BQ_ID.leaves);
          }
        }
      }
      this.setBlock(x,y+height,z,BQ_ID.leaves);
    },
  },

  /* ---------------- persistence (shared world diffs) ---------------- */
  persistBlock(x,y,z,id){
    sb.from("game_blocks").upsert({
      world_id: BQ_WORLD_ID, x, y, z, block: BQ_BLOCKS[id] ? BQ_BLOCKS[id].key : "air",
      placed_by: Auth.profile ? Auth.profile.id : null, updated_at: new Date().toISOString()
    }, { onConflict:"world_id,x,y,z" }).then(({error})=>{ if(error) console.debug("buildquest block save skipped:", error.message); });
  },
  async loadDiffsFromDB(){
    try{
      const { data, error } = await sb.from("game_blocks").select("x,y,z,block").eq("world_id", BQ_WORLD_ID);
      if(error || !data) return;
      data.forEach(row=>{ this.World.setBlock(row.x,row.y,row.z, BQ_ID[row.block]||0); });
    }catch(e){ console.debug("buildquest world load skipped:", e); }
  },

  /* ---------------- player save state (App.state.game, via the site's existing Store) ---------------- */
  defaultGameState(){
    return { inventory:{}, hotbar:["grass","dirt","stone","sand","log","planks","torch",null,null], selectedSlot:0, unlockedRecipes:[], blocksPlaced:0, blocksMined:0, itemsCrafted:0, pos:null };
  },
  loadPlayerState(){
    const g = App.state.game = Object.assign(this.defaultGameState(), App.state.game||{});
    this.inventory = g.inventory || {};
    this.hotbar = (g.hotbar && g.hotbar.length===9) ? g.hotbar.slice() : this.defaultGameState().hotbar;
    this.selectedSlot = g.selectedSlot || 0;
    this.unlockedRecipes = g.unlockedRecipes || [];
    this.renderHotbar();
    this.renderHUDStats();
  },
  scheduleSave(){
    if(App.state.game){
      App.state.game.inventory = this.inventory;
      App.state.game.hotbar = this.hotbar;
      App.state.game.selectedSlot = this.selectedSlot;
      App.state.game.unlockedRecipes = this.unlockedRecipes;
    }
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(()=>{ if(Auth.profile) Store.save(App.state); }, 800);
  },
  renderHUDStats(){
    const xp = document.getElementById("bq-xp"); if(xp) xp.textContent = App.state.xp;
    const co = document.getElementById("bq-coins"); if(co) co.textContent = App.state.coins;
  },

  /* ---------------- inventory / hotbar / crafting ---------------- */
  addItem(key, n){ this.inventory[key] = (this.inventory[key]||0) + n; },
  hasItems(need){ return Object.keys(need).every(k => (this.inventory[k]||0) >= need[k]); },
  selectSlot(i){
    if(i<0||i>8) return;
    this.selectedSlot = i;
    this.renderHotbar();
    this.scheduleSave();
  },
  assignToSlot(itemKey){
    this.hotbar[this.selectedSlot] = itemKey;
    this.renderHotbar();
    this.scheduleSave();
  },
  renderHotbar(){
    const el = document.getElementById("bq-hotbar");
    if(!el) return;
    el.innerHTML = this.hotbar.map((key,i)=>{
      const active = i===this.selectedSlot ? " active" : "";
      if(!key) return `<div class="bq-slot${active}" onclick="BuildQuest.selectSlot(${i})"><span class="n">${i+1}</span></div>`;
      const info = bqItemInfo(key);
      const cnt = this.inventory[key]||0;
      return `<div class="bq-slot${active}" onclick="BuildQuest.selectSlot(${i})" title="${escHtml(info.name)}">
        <span class="n">${i+1}</span><div class="sw" style="background:${bqItemColor(key)}"></div><span class="cnt">${cnt}</span>
      </div>`;
    }).join("");
  },
  togglePanel(name){
    const wasOpen = this.panelOpen===name;
    this.hideAllPanels();
    if(wasOpen){ this.showPointerHint(!this.pointerLocked); return; }
    const el = document.getElementById("bq-panel-"+name);
    if(!el) return;
    el.classList.add("show");
    this.panelOpen = name;
    if(name==="inventory") this.renderInventoryPanel();
    if(this.canvas && document.pointerLockElement===this.canvas) document.exitPointerLock();
    this.showPointerHint(false);
  },
  hideAllPanels(){
    document.querySelectorAll(".bq-panel").forEach(p=>p.classList.remove("show"));
    this.panelOpen = null;
  },
  renderInventoryPanel(){
    const grid = document.getElementById("bq-inv-grid");
    const keys = Object.keys(this.inventory).filter(k=>this.inventory[k]>0);
    grid.innerHTML = keys.length ? keys.map(k=>{
      const info = bqItemInfo(k);
      return `<div class="bq-inv-item" onclick="BuildQuest.assignToSlot('${k}')" title="Select for hotbar">
        <div class="sw" style="background:${bqItemColor(k)}"></div>
        <div class="lbl">${escHtml(info.name)}</div>
        <div class="cnt">${this.inventory[k]}</div>
      </div>`;
    }).join("") : `<p class="small muted">Break blocks and trees to gather resources!</p>`;

    const list = document.getElementById("bq-recipe-list");
    list.innerHTML = BQ_RECIPES.map(r=>{
      const locked = !!(r.module && !this.unlockedRecipes.includes(r.id));
      const have = this.hasItems(r.need);
      const mod = r.module ? bqModule(r.module) : null;
      const needTxt = Object.keys(r.need).map(k=>`${r.need[k]}× ${bqItemInfo(k).name}`).join(", ");
      const badge = locked ? `<span class="cert-chip c-${mod.color}">🔒 ${escHtml(mod.icon)} ${escHtml(mod.name)}</span>` : "";
      const btnLabel = locked ? "Unlock" : "Craft";
      return `<div class="bq-recipe">
        <div class="sw" style="background:${bqItemColor(r.out)}"></div>
        <div class="info">
          <div class="nm">${escHtml(r.name)} ${badge}</div>
          <div class="need">Needs: ${needTxt} → +${r.qty}</div>
        </div>
        <button class="btn btn-sm ${locked?'btn-primary':'btn-green'}" ${!have?"disabled":""} onclick="BuildQuest.craft('${r.id}')">${btnLabel}</button>
      </div>`;
    }).join("");
  },
  craft(recipeId){
    const r = bqRecipe(recipeId);
    if(!r || !this.hasItems(r.need)) return;
    const locked = !!(r.module && !this.unlockedRecipes.includes(r.id));
    if(locked){ this.Quiz.open(r); return; }
    Object.keys(r.need).forEach(k=> this.inventory[k] -= r.need[k]);
    this.addItem(r.out, r.qty);
    App.state.game.itemsCrafted = (App.state.game.itemsCrafted||0)+1;
    App.checkAchievements();
    Sound.click();
    this.renderInventoryPanel();
    this.renderHotbar();
    this.scheduleSave();
  },

  /* ---------------- quiz gate (reuses the real L2 Arduino question bank) ---------------- */
  Quiz: {
    recipe:null, pool:[], q:null, displayOpts:[], correctIdx:-1,
    open(recipe){
      this.recipe = recipe;
      const mod = bqModule(recipe.module);
      const all = (App.classData.l2 && App.classData.l2.questions) || [];
      this.pool = all.filter(q=>mod && mod.topics.includes(q.topic));
      if(!this.pool.length) this.pool = all;
      if(BuildQuest.canvas && document.pointerLockElement===BuildQuest.canvas) document.exitPointerLock();
      BuildQuest.hideAllPanels();
      document.getElementById("bq-quiz-backdrop").classList.add("show");
      this.next();
    },
    next(){
      if(!this.pool.length){ this.close(); return; }
      this.q = this.pool[Math.floor(Math.random()*this.pool.length)];
      const opts = this.q.options.map(o=>({o, correct:o===this.q.answer})).sort(()=>Math.random()-0.5);
      this.displayOpts = opts;
      this.correctIdx = opts.findIndex(x=>x.correct);
      this.render();
    },
    render(){
      const mod = bqModule(this.recipe.module);
      const card = document.getElementById("bq-quiz-card");
      card.innerHTML = `
        <div class="bq-quiz-head">
          <h2>🔒 ${escHtml(mod.icon)} Unlock: ${escHtml(this.recipe.name)}</h2>
          <button class="btn btn-ghost btn-sm" onclick="BuildQuest.Quiz.close()">✕ Cancel</button>
        </div>
        <div class="cert-meta">
          <span class="cert-chip c-${mod.color}">${escHtml(mod.name)}</span>
          <span class="cert-chip">${escHtml(this.q.topic)}</span>
          <span class="cert-chip diff-${String(this.q.difficulty).toLowerCase()}">${escHtml(this.q.difficulty)}</span>
        </div>
        <div class="cert-body">
          <div class="cert-stage" id="bq-quiz-stage"></div>
          <div class="cert-qcol">
            <div class="cert-qtext ${this.q.type==='CodeReading'?'code':''}">${escHtml(this.q.question)}</div>
            ${this.q.formula?`<div class="cert-formula">🧮 ${escHtml(this.q.formula)}</div>`:""}
            <div class="cert-options" id="bq-quiz-options">
              ${this.displayOpts.map((x,i)=>`<button class="cert-opt" data-i="${i}" onclick="BuildQuest.Quiz.answer(${i})"><span class="cert-opt-k">${String.fromCharCode(65+i)}</span><span>${escHtml(x.o)}</span></button>`).join("")}
            </div>
            <div class="cert-explain" id="bq-quiz-explain"></div>
          </div>
        </div>`;
      const stage = document.getElementById("bq-quiz-stage");
      if(stage){
        if(typeof renderAnimation==="function"){ try{ renderAnimation(this.q.animation, stage, {}); }catch(e){ stage.innerHTML = `<div class="cert-stage-ph">🔬</div>`; } }
        else stage.innerHTML = `<div class="cert-stage-ph">🔬</div>`;
      }
    },
    answer(i){
      const correct = i===this.correctIdx;
      document.querySelectorAll("#bq-quiz-options .cert-opt").forEach((b,bi)=>{
        b.disabled = true;
        if(bi===this.correctIdx) b.classList.add("correct");
        else if(bi===i) b.classList.add("wrong");
      });
      const exp = document.getElementById("bq-quiz-explain");
      App.state.totalAnswered = (App.state.totalAnswered||0)+1;
      if(correct){
        Sound.correct();
        App.state.totalCorrect = (App.state.totalCorrect||0)+1;
        App.state.xp += 15; App.state.coins += 5;
        BuildQuest.unlockedRecipes.push(this.recipe.id);
        App.checkAchievements();
        App.celebrate();
        BuildQuest.renderHUDStats();
        exp.innerHTML = `<div class="cert-exp-card ok"><div class="cert-exp-head">✅ Correct! +15 XP, +5 coins — ${escHtml(this.recipe.name)} unlocked!</div>
          <div class="cert-exp-body">${escHtml(this.q.explanation||"")}</div>
          <button class="btn btn-primary cert-next" onclick="BuildQuest.Quiz.finish(true)">Craft it! →</button></div>`;
      } else {
        Sound.wrong();
        exp.innerHTML = `<div class="cert-exp-card no"><div class="cert-exp-head">❌ Not quite — the answer is <b>${escHtml(this.q.answer)}</b></div>
          <div class="cert-exp-body">${escHtml(this.q.explanation||"")}</div>
          <button class="btn btn-primary cert-next" onclick="BuildQuest.Quiz.next()">Try another question →</button></div>`;
      }
      BuildQuest.scheduleSave();
    },
    finish(unlocked){
      const r = this.recipe;
      this.close();
      if(unlocked) BuildQuest.craft(r.id);
    },
    close(){
      document.getElementById("bq-quiz-backdrop").classList.remove("show");
      this.recipe=null; this.q=null;
      if(!BuildQuest.pointerLocked && !BuildQuest.panelOpen) BuildQuest.showPointerHint(true);
    }
  },

  /* ---------------- pop quiz — unprompted, timed, syllabus-wide, stakes-bearing ----------------
     Fires automatically every BQ_POPQUIZ_INTERVAL seconds of active play, independent of
     crafting. Draws from the WHOLE L2 question bank (not one module), and unlike the
     crafting-unlock Quiz above, getting it wrong actually costs XP — the goal is spaced,
     low-effort recall practice across the whole syllabus, not just gating new content. */
  PopQuiz: {
    active:false, q:null, displayOpts:[], correctIdx:-1,
    trigger(){
      const all = (App.classData.l2 && App.classData.l2.questions) || [];
      if(!all.length) return;
      this.active = true;
      this.q = all[Math.floor(Math.random()*all.length)];
      const opts = this.q.options.map(o=>({o, correct:o===this.q.answer})).sort(()=>Math.random()-0.5);
      this.displayOpts = opts;
      this.correctIdx = opts.findIndex(x=>x.correct);
      if(BuildQuest.canvas && document.pointerLockElement===BuildQuest.canvas) document.exitPointerLock();
      BuildQuest.hideAllPanels();
      if(window.Sound && Sound.levelup) Sound.levelup();
      document.getElementById("bq-quiz-backdrop").classList.add("show");
      this.render();
    },
    render(){
      const card = document.getElementById("bq-quiz-card");
      card.innerHTML = `
        <div class="bq-quiz-head">
          <h2>🔔 Pop Quiz! — a quick syllabus check</h2>
        </div>
        <div class="cert-meta">
          <span class="cert-chip">${escHtml(this.q.topic)}</span>
          <span class="cert-chip diff-${String(this.q.difficulty).toLowerCase()}">${escHtml(this.q.difficulty)}</span>
        </div>
        <div class="cert-body">
          <div class="cert-stage" id="bq-quiz-stage"></div>
          <div class="cert-qcol">
            <div class="cert-qtext ${this.q.type==='CodeReading'?'code':''}">${escHtml(this.q.question)}</div>
            ${this.q.formula?`<div class="cert-formula">🧮 ${escHtml(this.q.formula)}</div>`:""}
            <div class="cert-options" id="bq-quiz-options">
              ${this.displayOpts.map((x,i)=>`<button class="cert-opt" data-i="${i}" onclick="BuildQuest.PopQuiz.answer(${i})"><span class="cert-opt-k">${String.fromCharCode(65+i)}</span><span>${escHtml(x.o)}</span></button>`).join("")}
            </div>
            <div class="cert-explain" id="bq-quiz-explain"></div>
          </div>
        </div>`;
      const stage = document.getElementById("bq-quiz-stage");
      if(stage){
        if(typeof renderAnimation==="function"){ try{ renderAnimation(this.q.animation, stage, {}); }catch(e){ stage.innerHTML = `<div class="cert-stage-ph">📘</div>`; } }
        else stage.innerHTML = `<div class="cert-stage-ph">📘</div>`;
      }
    },
    answer(i){
      const correct = i===this.correctIdx;
      document.querySelectorAll("#bq-quiz-options .cert-opt").forEach((b,bi)=>{
        b.disabled = true;
        if(bi===this.correctIdx) b.classList.add("correct");
        else if(bi===i) b.classList.add("wrong");
      });
      const exp = document.getElementById("bq-quiz-explain");
      App.state.totalAnswered = (App.state.totalAnswered||0)+1;
      if(correct){
        Sound.correct();
        App.state.totalCorrect = (App.state.totalCorrect||0)+1;
        App.state.xp += 10; App.state.coins += 3;
        App.state.game.popQuizCorrect = (App.state.game.popQuizCorrect||0)+1;
        App.checkAchievements();
        App.celebrate();
        BuildQuest.renderHUDStats();
        exp.innerHTML = `<div class="cert-exp-card ok"><div class="cert-exp-head">✅ Correct! +10 XP, +3 coins</div>
          <div class="cert-exp-body">${escHtml(this.q.explanation||"")}</div>
          <button class="btn btn-primary cert-next" onclick="BuildQuest.PopQuiz.close()">Back to building →</button></div>`;
      } else {
        Sound.wrong();
        App.state.xp = Math.max(0, App.state.xp - 5);
        App.state.game.popQuizWrong = (App.state.game.popQuizWrong||0)+1;
        BuildQuest.renderHUDStats();
        const lesson = this.q.hint1 || (this.q.explanation||"").split(". ")[0] || "Review this topic before the next pop quiz.";
        exp.innerHTML = `<div class="cert-exp-card no"><div class="cert-exp-head">❌ -5 XP — the answer is <b>${escHtml(this.q.answer)}</b></div>
          <div class="cert-exp-body">${escHtml(this.q.explanation||"")}</div>
          <div class="cert-exp-key">🔑 Remember this for next time: ${escHtml(lesson)}</div>
          <button class="btn btn-primary cert-next" onclick="BuildQuest.PopQuiz.close()">Back to building →</button></div>`;
      }
      BuildQuest.scheduleSave();
    },
    close(){
      document.getElementById("bq-quiz-backdrop").classList.remove("show");
      this.active=false; this.q=null;
      if(!BuildQuest.pointerLocked && !BuildQuest.panelOpen) BuildQuest.showPointerHint(true);
    }
  },

  /* ---------------- chat (ephemeral, broadcast-only) ---------------- */
  Chat: {
    open(){
      BuildQuest.chatOpen = true;
      const input = document.getElementById("bq-chat-input");
      if(!input) return;
      input.classList.add("show");
      input.value = "";
      input.focus();
      if(BuildQuest.canvas && document.pointerLockElement===BuildQuest.canvas) document.exitPointerLock();
      input.onkeydown = (e)=>{
        e.stopPropagation();
        if(e.key==="Enter") this.send();
        else if(e.key==="Escape") this.close();
      };
    },
    close(){
      BuildQuest.chatOpen = false;
      const input = document.getElementById("bq-chat-input");
      if(!input) return;
      input.classList.remove("show");
      input.blur();
    },
    send(){
      const input = document.getElementById("bq-chat-input");
      const text = input.value.trim().slice(0,140);
      if(text){
        this.append(Auth.profile?Auth.profile.name:"You", text);
        BuildQuest.Net.sendChat(text);
      }
      this.close();
    },
    receive(payload){
      if(Auth.profile && payload.from===Auth.profile.id) return;
      this.append(payload.name, payload.text);
    },
    append(name, text){
      const log = document.getElementById("bq-chat-log");
      if(!log) return;
      const line = document.createElement("div");
      line.className = "bq-chat-line";
      line.innerHTML = `<b>${escHtml(name)}:</b> ${escHtml(text)}`;
      log.appendChild(line);
      while(log.children.length>30) log.removeChild(log.firstChild);
      log.scrollTop = log.scrollHeight;
    }
  },

  /* ---------------- multiplayer (Supabase Realtime: presence + broadcast) ---------------- */
  Net: {
    channel:null, remotes:new Map(), lastSend:0,
    join(){
      if(this.channel || !Auth.profile) return;
      const ch = sb.channel("buildquest-"+BQ_WORLD_ID, { config: { presence: { key: Auth.profile.id } } });
      ch.on("presence", {event:"sync"}, ()=> this.syncPresence(ch));
      ch.on("presence", {event:"leave"}, ({key})=> this.removeRemote(key));
      ch.on("broadcast", {event:"move"}, ({payload})=> this.onRemoteMove(payload));
      ch.on("broadcast", {event:"block"}, ({payload})=> this.onRemoteBlock(payload));
      ch.on("broadcast", {event:"chat"}, ({payload})=> BuildQuest.Chat.receive(payload));
      ch.subscribe(async status=>{
        if(status==="SUBSCRIBED"){
          try{ await ch.track({ name:Auth.profile.name, color:bqColorForId(Auth.profile.id) }); }catch(e){}
        }
      });
      this.channel = ch;
    },
    leave(){
      if(!this.channel) return;
      try{ this.channel.untrack(); }catch(e){}
      try{ sb.removeChannel(this.channel); }catch(e){}
      this.channel = null;
      this.remotes.forEach(r=>{ if(BuildQuest.scene) BuildQuest.scene.remove(r.group); });
      this.remotes.clear();
      BuildQuest.renderPlayerList();
    },
    syncPresence(ch){
      const state = ch.presenceState();
      const seen = new Set();
      Object.keys(state).forEach(key=>{
        if(Auth.profile && key===Auth.profile.id) return;
        seen.add(key);
        if(!this.remotes.has(key)) BuildQuest.spawnRemote(key, state[key][0]);
      });
      Array.from(this.remotes.keys()).forEach(key=>{ if(!seen.has(key)) this.removeRemote(key); });
      BuildQuest.renderPlayerList();
    },
    removeRemote(key){
      const r = this.remotes.get(key);
      if(r && BuildQuest.scene) BuildQuest.scene.remove(r.group);
      this.remotes.delete(key);
      BuildQuest.renderPlayerList();
    },
    sendMove(){
      if(!this.channel || !Auth.profile) return;
      const now = performance.now();
      if(now-this.lastSend < 100) return;
      this.lastSend = now;
      const p = BuildQuest.player;
      this.channel.send({ type:"broadcast", event:"move", payload:{ from:Auth.profile.id, x:p.x, y:p.y, z:p.z, yaw:p.yaw } });
    },
    sendBlock(x,y,z,id){
      if(!this.channel || !Auth.profile) return;
      this.channel.send({ type:"broadcast", event:"block", payload:{ from:Auth.profile.id, x,y,z, block: BQ_BLOCKS[id]?BQ_BLOCKS[id].key:"air" } });
    },
    sendChat(text){
      if(!this.channel || !Auth.profile) return;
      this.channel.send({ type:"broadcast", event:"chat", payload:{ from:Auth.profile.id, name:Auth.profile.name, text } });
    },
    onRemoteMove(payload){
      const r = this.remotes.get(payload.from);
      if(!r) return;
      r.target.x=payload.x; r.target.y=payload.y; r.target.z=payload.z; r.target.yaw=payload.yaw;
    },
    onRemoteBlock(payload){
      BuildQuest.World.setBlock(payload.x,payload.y,payload.z, BQ_ID[payload.block]||0);
      BuildQuest.buildAllMeshes();
    },
  },

  spawnRemote(key, meta){
    const T = this.THREE;
    const color = (meta && meta.color) || 0x3AA0FF;
    const group = new T.Group();
    const body = new T.Mesh(new T.BoxGeometry(0.6,1.6,0.6), new T.MeshLambertMaterial({ color }));
    body.position.y = 0.8;
    group.add(body);
    const label = this.makeLabelSprite((meta&&meta.name)||"Player");
    label.position.y = 2.05;
    group.add(label);
    group.position.set(BQ_SIZE/2, BQ_SEA+2, BQ_SIZE/2);
    this.scene.add(group);
    this.Net.remotes.set(key, { group, target:{x:BQ_SIZE/2,y:BQ_SEA+2,z:BQ_SIZE/2,yaw:0}, name:(meta&&meta.name)||"Player" });
  },
  makeLabelSprite(text){
    const T = this.THREE;
    const canvas = document.createElement("canvas");
    canvas.width = 256; canvas.height = 64;
    const ctx = canvas.getContext("2d");
    ctx.font = "bold 30px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0,10,256,44);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(String(text).slice(0,16), 128, 42);
    const tex = new T.CanvasTexture(canvas);
    const sprite = new T.Sprite(new T.SpriteMaterial({ map:tex, depthTest:false }));
    sprite.scale.set(1.6,0.4,1);
    return sprite;
  },
  updateRemotes(dt){
    const k = Math.min(1, dt*8);
    this.Net.remotes.forEach(r=>{
      const g = r.group;
      g.position.x += (r.target.x - g.position.x)*k;
      g.position.y += (r.target.y - g.position.y)*k;
      g.position.z += (r.target.z - g.position.z)*k;
      g.rotation.y += (r.target.yaw - g.rotation.y)*k;
    });
  },
  renderPlayerList(){
    const el = document.getElementById("bq-players-list");
    if(!el) return;
    const rows = [`<div class="bq-player-row"><span class="bq-player-dot" style="background:#00e676"></span>${escHtml(Auth.profile?Auth.profile.name:"You")} (you)</div>`];
    this.Net.remotes.forEach(r=> rows.push(`<div class="bq-player-row"><span class="bq-player-dot" style="background:#3AA0FF"></span>${escHtml(r.name)}</div>`));
    el.innerHTML = rows.join("");
  },

  /* ---------------- input binding (attached once; guarded by this.active) ---------------- */
  bindInputOnce(){
    if(this._inputBound) return; this._inputBound = true;
    window.addEventListener("resize", ()=> this.onResize());
    document.addEventListener("keydown", e=> this.onKeyDown(e));
    document.addEventListener("keyup", e=> this.onKeyUp(e));
    document.addEventListener("pointerlockchange", ()=> this.onPointerLockChange());
    this.canvas.addEventListener("click", ()=>{ if(this.active && !this.pointerLocked && !this.panelOpen && !this.chatOpen) this.lockPointer(); });
    document.addEventListener("mousemove", e=> this.onMouseMove(e));
    this.canvas.addEventListener("mousedown", e=> this.onMouseDown(e));
    document.addEventListener("mouseup", e=> this.onMouseUp(e));
    this.canvas.addEventListener("contextmenu", e=> e.preventDefault());
    this.canvas.addEventListener("wheel", e=> this.onWheel(e), { passive:true });
  },
  lockPointer(){
    if(!this.active || this.panelOpen || this.chatOpen) return;
    this.canvas.requestPointerLock();
  },
  onPointerLockChange(){
    this.pointerLocked = (document.pointerLockElement === this.canvas);
    this.showPointerHint(!this.pointerLocked && this.active && !this.panelOpen);
    const cross = document.getElementById("bq-crosshair");
    if(cross) cross.style.display = this.pointerLocked ? "block" : "none";
    if(!this.pointerLocked){ this.leftDown=false; this.mining=null; this.setMineBar(0); this.keyState.w=this.keyState.a=this.keyState.s=this.keyState.d=false; }
  },
  onKeyDown(e){
    if(!this.active || this.chatOpen) return;
    switch(e.code){
      case "KeyW": this.keyState.w=true; break;
      case "KeyA": this.keyState.a=true; break;
      case "KeyS": this.keyState.s=true; break;
      case "KeyD": this.keyState.d=true; break;
      case "Space": this.keyState.space=true; e.preventDefault(); break;
      case "ShiftLeft": case "ShiftRight": this.keyState.shift=true; break;
      case "KeyF": this.toggleFly(); break;
      case "KeyE": this.togglePanel("inventory"); break;
      case "KeyT": this.Chat.open(); e.preventDefault(); break;
      case "Escape":
        // Esc always releases pointer lock first (the browser does this for us before
        // this even fires, in most browsers). If there's a panel open, close that. If
        // neither pointer lock nor a panel has anything left to back out of, treat a
        // further Esc as "leave the world" — the Exit button is always onscreen too.
        if(this.panelOpen) this.togglePanel(this.panelOpen);
        else if(!this.pointerLocked) this.exit();
        break;
    }
    if(/^Digit[1-9]$/.test(e.code)) this.selectSlot(parseInt(e.code.slice(5),10)-1);
  },
  onKeyUp(e){
    if(!this.active) return;
    switch(e.code){
      case "KeyW": this.keyState.w=false; break;
      case "KeyA": this.keyState.a=false; break;
      case "KeyS": this.keyState.s=false; break;
      case "KeyD": this.keyState.d=false; break;
      case "Space": this.keyState.space=false; break;
      case "ShiftLeft": case "ShiftRight": this.keyState.shift=false; break;
    }
  },
  onMouseMove(e){
    if(!this.active || !this.pointerLocked) return;
    const sens = 0.0022;
    this.player.yaw -= e.movementX*sens;
    this.player.pitch -= e.movementY*sens;
    const lim = Math.PI/2 - 0.01;
    this.player.pitch = Math.max(-lim, Math.min(lim, this.player.pitch));
  },
  onMouseDown(e){
    if(!this.active || !this.pointerLocked) return;
    if(e.button===0) this.leftDown = true;
    if(e.button===2) this.placeBlock();
  },
  onMouseUp(e){
    if(e.button===0){ this.leftDown=false; this.mining=null; this.setMineBar(0); }
  },
  onWheel(e){
    if(!this.active || !this.pointerLocked) return;
    this.selectSlot((this.selectedSlot + (e.deltaY>0?1:-1) + 9)%9);
  },
};

/* ---------------- hook into the site's existing screen router ---------------- */
(function bqHookRouter(){
  if(typeof Router === "undefined") return;
  const bqOrigGo = Router.go.bind(Router);
  Router.go = function(name){
    bqOrigGo(name);
    if(name === "game-l2") BuildQuest.enter();
    else if(BuildQuest.active) BuildQuest.suspend();
  };
})();
