/* ============================================================
   Robotics & AI — Level 1 : teaching diagrams
   Small, colorful, labelled inline SVGs for the lesson notes.
   Referenced from data/l1/learn.json note blocks: {type:"diagram", key:"..."}
   Kept simple & friendly for ages 11–18 beginners.
   ============================================================ */

const L1_DIAGRAMS = {

  "robot-parts": () => `
    <svg viewBox="0 0 340 210" role="img" aria-label="The three main parts of a robot">
      <rect x="120" y="55" width="100" height="90" rx="14" fill="#7b2ff7"/>
      <circle cx="150" cy="90" r="9" fill="#fff"/><circle cx="190" cy="90" r="9" fill="#fff"/>
      <circle cx="150" cy="90" r="4" fill="#212121"/><circle cx="190" cy="90" r="4" fill="#212121"/>
      <rect x="150" y="115" width="40" height="8" rx="4" fill="#fff"/>
      <rect x="163" y="30" width="14" height="26" rx="4" fill="#9C4DFF"/><circle cx="170" cy="26" r="8" fill="#FFC53D"/>
      <text x="170" y="165" font-size="12" fill="#fff" text-anchor="middle" font-weight="700">BRAIN</text>
      <g>
        <rect x="20" y="80" width="70" height="40" rx="8" fill="#00BCD4"/>
        <text x="55" y="104" font-size="11" fill="#04240f" text-anchor="middle" font-weight="700">SENSORS</text>
        <text x="55" y="70" font-size="10" fill="#a9b3ba" text-anchor="middle">feel 👀</text>
      </g>
      <g>
        <rect x="250" y="80" width="70" height="40" rx="8" fill="#00C853"/>
        <text x="285" y="104" font-size="11" fill="#04240f" text-anchor="middle" font-weight="700">MOTORS</text>
        <text x="285" y="70" font-size="10" fill="#a9b3ba" text-anchor="middle">move 🦿</text>
      </g>
      <path d="M92 100 H118" stroke="#FFC53D" stroke-width="3" marker-end="url(#l1arrow)"/>
      <path d="M222 100 H248" stroke="#FFC53D" stroke-width="3" marker-end="url(#l1arrow)"/>
      <defs><marker id="l1arrow" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="#FFC53D"/></marker></defs>
    </svg>`,

  "simple-circuit": () => `
    <svg viewBox="0 0 320 190" role="img" aria-label="A simple electric circuit loop">
      <rect x="30" y="30" width="260" height="130" rx="14" fill="none" stroke="#3AA0FF" stroke-width="4"/>
      <rect x="30" y="80" width="20" height="34" fill="#15181c"/>
      <line x1="30" y1="86" x2="30" y2="108" stroke="#FFC53D" stroke-width="6"/>
      <line x1="40" y1="82" x2="40" y2="112" stroke="#FFC53D" stroke-width="3"/>
      <text x="15" y="140" font-size="11" fill="#FFC53D" font-weight="700">🔋</text>
      <circle cx="250" cy="30" r="12" fill="#FFC53D"/>
      <text x="250" y="15" font-size="11" fill="#a9b3ba" text-anchor="middle">💡 LED</text>
      <circle r="5" fill="#FF9800"><animateMotion dur="3s" repeatCount="indefinite" path="M30,97 L30,30 L250,30 L290,30 L290,160 L30,160 L30,97"/></circle>
      <text x="160" y="182" font-size="11" fill="#a9b3ba" text-anchor="middle">Electricity flows around the loop ➜ the LED lights up</text>
    </svg>`,

  "breadboard-led": () => `
    <svg viewBox="0 0 320 200" role="img" aria-label="An LED and resistor on a breadboard">
      <rect x="20" y="30" width="280" height="120" rx="10" fill="#eef1f4"/>
      ${Array.from({length:14}).map((_,c)=>Array.from({length:6}).map((_,r)=>`<circle cx="${40+c*18}" cy="${50+r*16}" r="2.4" fill="#c3ccd4"/>`).join("")).join("")}
      <line x1="90" y1="66" x2="140" y2="66" stroke="#8d6e63" stroke-width="4"/>
      <rect x="105" y="60" width="24" height="12" rx="3" fill="#00838f"/>
      <text x="117" y="52" font-size="9" fill="#607d8b" text-anchor="middle">resistor</text>
      <line x1="140" y1="66" x2="176" y2="66" stroke="#111" stroke-width="3"/>
      <circle cx="185" cy="66" r="9" fill="#FF5252"/>
      <text x="185" y="44" font-size="9" fill="#607d8b" text-anchor="middle">LED 💡</text>
      <line x1="40" y1="130" x2="40" y2="150" stroke="#d32f2f" stroke-width="3"/>
      <line x1="266" y1="130" x2="266" y2="150" stroke="#212121" stroke-width="3"/>
      <text x="40" y="170" font-size="10" fill="#d32f2f" text-anchor="middle">+ battery</text>
      <text x="266" y="170" font-size="10" fill="#455a64" text-anchor="middle">– battery</text>
      <text x="160" y="192" font-size="10" fill="#a9b3ba" text-anchor="middle">Build circuits by pushing parts into the holes — no soldering!</text>
    </svg>`,

  "arduino-board": () => `
    <svg viewBox="0 0 320 190" role="img" aria-label="An Arduino board with pins">
      <rect x="50" y="40" width="220" height="110" rx="12" fill="#00979D"/>
      ${Array.from({length:12}).map((_,i)=>`<rect x="${64+i*16}" y="46" width="8" height="10" fill="#0c1b1c"/>`).join("")}
      ${Array.from({length:12}).map((_,i)=>`<rect x="${64+i*16}" y="134" width="8" height="10" fill="#0c1b1c"/>`).join("")}
      <rect x="120" y="80" width="46" height="34" rx="4" fill="#212121"/>
      <text x="143" y="101" font-size="9" fill="#00E676" text-anchor="middle" font-weight="700">CHIP</text>
      <rect x="40" y="80" width="18" height="26" rx="3" fill="#9e9e9e"/>
      <text x="49" y="126" font-size="9" fill="#e0f2f1" text-anchor="middle">USB</text>
      <text x="160" y="30" font-size="12" fill="#a9b3ba" text-anchor="middle" font-weight="700">🔌 Arduino — the robot's brain</text>
      <text x="160" y="176" font-size="10" fill="#a9b3ba" text-anchor="middle">Pins let you plug in sensors (inputs) and motors/LEDs (outputs)</text>
    </svg>`,

  "microbit": () => `
    <svg viewBox="0 0 320 190" role="img" aria-label="A micro:bit board">
      <rect x="70" y="35" width="180" height="120" rx="14" fill="#00C853"/>
      ${Array.from({length:5}).map((_,r)=>Array.from({length:5}).map((_,c)=>`<rect x="${118+c*18}" y="${58+r*15}" width="10" height="10" rx="2" fill="${(r+c)%2? '#b9f6ca':'#d50000'}"/>`).join("")).join("")}
      <circle cx="92" cy="150" r="9" fill="#212121"/><text x="92" y="154" font-size="9" fill="#fff" text-anchor="middle">A</text>
      <circle cx="228" cy="150" r="9" fill="#212121"/><text x="228" y="154" font-size="9" fill="#fff" text-anchor="middle">B</text>
      <text x="160" y="28" font-size="12" fill="#a9b3ba" text-anchor="middle" font-weight="700">micro:bit</text>
      <text x="160" y="178" font-size="10" fill="#a9b3ba" text-anchor="middle">25 tiny LEDs + 2 buttons (A & B) you can program with blocks</text>
    </svg>`,

  "sensor-flow": () => `
    <svg viewBox="0 0 340 150" role="img" aria-label="Sensor to controller to actuator flow">
      <rect x="15" y="50" width="80" height="50" rx="10" fill="#00BCD4"/>
      <text x="55" y="72" font-size="11" fill="#04240f" text-anchor="middle" font-weight="700">SENSOR</text>
      <text x="55" y="88" font-size="9" fill="#04240f" text-anchor="middle">input 👀</text>
      <rect x="130" y="50" width="80" height="50" rx="10" fill="#9C4DFF"/>
      <text x="170" y="72" font-size="11" fill="#fff" text-anchor="middle" font-weight="700">ARDUINO</text>
      <text x="170" y="88" font-size="9" fill="#fff" text-anchor="middle">thinks 🧠</text>
      <rect x="245" y="50" width="80" height="50" rx="10" fill="#00C853"/>
      <text x="285" y="72" font-size="11" fill="#04240f" text-anchor="middle" font-weight="700">ACTUATOR</text>
      <text x="285" y="88" font-size="9" fill="#04240f" text-anchor="middle">output 🦿</text>
      <path d="M97 75 H128" stroke="#FFC53D" stroke-width="3" marker-end="url(#l1a2)"/>
      <path d="M212 75 H243" stroke="#FFC53D" stroke-width="3" marker-end="url(#l1a2)"/>
      <text x="170" y="128" font-size="10" fill="#a9b3ba" text-anchor="middle">Sense ➜ Think ➜ Act — how every robot works!</text>
      <defs><marker id="l1a2" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="#FFC53D"/></marker></defs>
    </svg>`,

  "ultrasonic": () => `
    <svg viewBox="0 0 320 170" role="img" aria-label="Ultrasonic sensor sending and receiving sound">
      <rect x="20" y="60" width="60" height="50" rx="8" fill="#3AA0FF"/>
      <circle cx="38" cy="85" r="12" fill="#0d47a1"/><circle cx="62" cy="85" r="12" fill="#0d47a1"/>
      <text x="50" y="130" font-size="9" fill="#a9b3ba" text-anchor="middle">ultrasonic</text>
      <path d="M85 78 q30 -12 60 0" stroke="#FFC53D" fill="none" stroke-width="2"/>
      <path d="M85 88 q30 -12 60 0" stroke="#FFC53D" fill="none" stroke-width="2"/>
      <path d="M215 92 q-30 12 -60 0" stroke="#00E676" fill="none" stroke-width="2"/>
      <rect x="230" y="45" width="24" height="80" rx="4" fill="#8d6e63"/>
      <text x="242" y="140" font-size="9" fill="#a9b3ba" text-anchor="middle">wall</text>
      <text x="160" y="160" font-size="10" fill="#a9b3ba" text-anchor="middle">Sends a sound 🔊 and times the echo to measure distance</text>
    </svg>`,

  "servo-motor": () => `
    <svg viewBox="0 0 300 170" role="img" aria-label="A servo motor turning to an angle">
      <rect x="90" y="70" width="70" height="55" rx="8" fill="#FF9800"/>
      <circle cx="125" cy="70" r="10" fill="#455a64"/>
      <line x1="125" y1="70" x2="180" y2="40" stroke="#212121" stroke-width="6" stroke-linecap="round"/>
      <path d="M150 70 A45 45 0 0 0 165 48" stroke="#00E676" fill="none" stroke-width="2"/>
      <text x="185" y="38" font-size="10" fill="#00E676">angle</text>
      <text x="125" y="150" font-size="10" fill="#a9b3ba" text-anchor="middle">Servo motor 🦾 — turns to an exact position (0°–180°)</text>
    </svg>`,

  "ai-teachable": () => `
    <svg viewBox="0 0 340 180" role="img" aria-label="Teachable Machine: examples train a model that predicts">
      <rect x="15" y="40" width="80" height="45" rx="8" fill="#00BCD4"/>
      <text x="55" y="60" font-size="10" fill="#04240f" text-anchor="middle" font-weight="700">EXAMPLES</text>
      <text x="55" y="75" font-size="9" fill="#04240f" text-anchor="middle">📷 photos</text>
      <rect x="130" y="40" width="80" height="45" rx="8" fill="#9C4DFF"/>
      <text x="170" y="60" font-size="10" fill="#fff" text-anchor="middle" font-weight="700">TRAIN</text>
      <text x="170" y="75" font-size="9" fill="#fff" text-anchor="middle">the model 🧠</text>
      <rect x="245" y="40" width="80" height="45" rx="8" fill="#00C853"/>
      <text x="285" y="60" font-size="10" fill="#04240f" text-anchor="middle" font-weight="700">PREDICT</text>
      <text x="285" y="75" font-size="9" fill="#04240f" text-anchor="middle">"It's a cat!"</text>
      <path d="M97 62 H128" stroke="#FFC53D" stroke-width="3" marker-end="url(#l1a3)"/>
      <path d="M212 62 H243" stroke="#FFC53D" stroke-width="3" marker-end="url(#l1a3)"/>
      <text x="170" y="120" font-size="10" fill="#a9b3ba" text-anchor="middle">AI learns from LOTS of examples — just like you learn from practice!</text>
      <text x="170" y="140" font-size="10" fill="#a9b3ba" text-anchor="middle">Google Teachable Machine lets you train one in your browser 🌐</text>
      <defs><marker id="l1a3" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="#FFC53D"/></marker></defs>
    </svg>`,

  "robot-car": () => `
    <svg viewBox="0 0 300 180" role="img" aria-label="An obstacle avoidance robot car">
      <rect x="80" y="70" width="140" height="50" rx="10" fill="#7b2ff7"/>
      <circle cx="105" cy="130" r="18" fill="#212121"/><circle cx="105" cy="130" r="7" fill="#9e9e9e"/>
      <circle cx="195" cy="130" r="18" fill="#212121"/><circle cx="195" cy="130" r="7" fill="#9e9e9e"/>
      <rect x="140" y="55" width="30" height="18" rx="4" fill="#3AA0FF"/>
      <circle cx="148" cy="64" r="4" fill="#0d47a1"/><circle cx="162" cy="64" r="4" fill="#0d47a1"/>
      <path d="M170 60 q26 -6 44 4" stroke="#FFC53D" fill="none" stroke-width="2"/>
      <rect x="232" y="48" width="14" height="80" rx="3" fill="#8d6e63"/>
      <text x="150" y="160" font-size="10" fill="#a9b3ba" text-anchor="middle">The robot 'sees' the wall with its sensor and turns away 🤖</text>
    </svg>`
};

function renderL1Diagram(key){
  const fn = L1_DIAGRAMS[key];
  return fn ? `<div class="l1-diagram">${fn()}</div>` : "";
}
