/* ============================================================
   Arduino Junior Certification Academy — Animation Engine
   Renders a small SVG teaching animation into the question stage
   based on the "animation" key stored on each question.
   ============================================================ */

// Map every specific animation key used in questions.json to a visual "family".
// This keeps the SVG code manageable while still giving each syllabus area
// its own distinct, purpose-built animation.
const ANIMATION_FAMILY = {
  // Circuits / electricity basics
  "current-flow-basic":"circuit", "circuit-open-close":"circuit-switch",
  "conductor-insulator-demo":"circuit", "battery-symbol-demo":"circuit",
  "voltage-pressure-analogy":"pressure", "resistance-friction-demo":"pressure",
  "ohms-law-seesaw":"seesaw", "ac-dc-waveform":"wave",

  // Ohm's law / calculations
  "ohms-law-calculator":"calc", "led-resistor-calculator":"calc",
  "series-resistor-demo":"calc", "resistor-overheat-demo":"calc",

  // Components
  "diode-current-flow":"diode", "capacitor-charge-discharge":"capacitor",
  "resistor-color-bands":"resistor", "transistor-switch-demo":"transistor",

  // Arduino / code
  "arduino-setup-loop":"loop", "arduino-pinmode-demo":"pin",
  "led-blink":"led", "arduino-ide-demo":"ide", "code-bug-highlight":"code",
  "digital-high-low":"digital", "digital-read-demo":"digital",
  "button-press":"button",

  // Analog
  "analog-value-demo":"gauge", "adc-conversion-demo":"gauge", "potentiometer-demo":"dial",

  // Serial
  "serial-monitor-scroll":"terminal", "serial-baud-mismatch":"terminal-error",

  // DHT / environment
  "dht-sensor-readout":"dht", "environmental-dashboard":"dashboard",

  // Motors
  "motor-spin":"motor", "motor-driver-demo":"motor", "flyback-diode-demo":"motor-diode",
  "h-bridge-diagram":"hbridge",

  // Servo
  "servo-rotate":"servo", "servo-pulse-diagram":"servo-pulse",

  // PWM
  "pwm-brightness":"pwm",

  // Buzzer
  "buzzer-sound-wave":"buzzer",

  // LCD
  "lcd-text-display":"lcd", "i2c-lcd-wiring":"lcd",

  // Ultrasonic
  "ultrasonic-wave":"ultrasonic",

  // IR
  "ir-remote-signal":"ir", "ir-line-follow":"irline",

  // Robotics
  "robot-move":"robot", "robot-feedback-loop":"robot-loop",
  "wheel-encoder-demo":"wheel", "wheel-rotation-diagram":"wheel",
  "obstacle-avoid":"obstacle",

  // Kinematics
  "robot-arm-forward-kinematics":"arm", "robot-arm-inverse-kinematics":"arm-target",
};

const SVG_NS = "http://www.w3.org/2000/svg";

function renderAnimation(key, stageEl, ctx){
  stageEl.innerHTML = "";
  const family = ANIMATION_FAMILY[key] || "circuit";
  const builder = BUILDERS[family] || BUILDERS["circuit"];
  const { svg, caption } = builder(ctx || {});
  stageEl.insertAdjacentHTML("beforeend", svg);
  if(caption){
    const cap = document.createElement("div");
    cap.className = "stage-caption";
    cap.textContent = caption;
    stageEl.appendChild(cap);
  }
}

/* Each builder returns { svg: "<svg>...</svg>", caption: "text" } */
const BUILDERS = {
  circuit(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <rect x="20" y="20" width="260" height="140" rx="16" fill="none" stroke="#3a424a" stroke-width="3"/>
      <rect x="120" y="10" width="60" height="24" rx="4" fill="#FF9800"/>
      <text x="150" y="27" font-size="11" fill="#212121" text-anchor="middle" font-weight="700">BATTERY</text>
      <rect x="120" y="146" width="60" height="24" rx="4" fill="#00979D"/>
      <text x="150" y="163" font-size="10" fill="#fff" text-anchor="middle" font-weight="700">RESISTOR</text>
      <circle r="6" fill="#FF9800">
        <animateMotion dur="2.4s" repeatCount="indefinite"
          path="M 150,34 L 278,34 L 278,160 L 180,160" />
      </circle>
      <circle r="6" fill="#00C853">
        <animateMotion dur="2.4s" repeatCount="indefinite"
          path="M 120,160 L 22,160 L 22,34 L 120,34" />
      </circle>
    </svg>`, caption:"Current flows around the closed loop" };
  },
  "circuit-switch"(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <rect x="20" y="70" width="260" height="10" fill="none"/>
      <line x1="30" y1="75" x2="120" y2="75" stroke="#3a424a" stroke-width="4"/>
      <line x1="180" y1="75" x2="270" y2="75" stroke="#3a424a" stroke-width="4"/>
      <g>
        <line x1="120" y1="75" x2="175" y2="45" stroke="#FF9800" stroke-width="4" stroke-linecap="round">
          <animate attributeName="x2" values="175;180;175" dur="2.2s" repeatCount="indefinite"/>
          <animate attributeName="y2" values="45;75;45" dur="2.2s" repeatCount="indefinite"/>
        </line>
      </g>
      <circle cx="120" cy="75" r="4" fill="#fff"/>
      <circle cx="180" cy="75" r="4" fill="#fff"/>
      <circle r="5" fill="#00C853" opacity="0.9">
        <animateMotion dur="2.2s" repeatCount="indefinite" path="M 30,75 L 270,75"/>
      </circle>
    </svg>`, caption:"Open switch breaks the loop — closed switch lets current flow" };
  },
  pressure(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <rect x="40" y="20" width="60" height="140" rx="10" fill="#1a2226" stroke="#3a424a" stroke-width="2"/>
      <rect x="46" y="60" width="48" height="94" rx="6" fill="#00979D">
        <animate attributeName="height" values="94;60;94" dur="2.4s" repeatCount="indefinite"/>
        <animate attributeName="y" values="60;94;60" dur="2.4s" repeatCount="indefinite"/>
      </rect>
      <rect x="200" y="20" width="60" height="140" rx="10" fill="#1a2226" stroke="#3a424a" stroke-width="2"/>
      <rect x="206" y="90" width="48" height="64" rx="6" fill="#FF9800">
        <animate attributeName="height" values="64;100;64" dur="2.4s" repeatCount="indefinite"/>
        <animate attributeName="y" values="90;54;90" dur="2.4s" repeatCount="indefinite"/>
      </rect>
      <text x="70" y="175" font-size="10" fill="#a9b3ba" text-anchor="middle">HIGH V</text>
      <text x="230" y="175" font-size="10" fill="#a9b3ba" text-anchor="middle">LOW V</text>
    </svg>`, caption:"Voltage is like water pressure pushing current through a pipe" };
  },
  seesaw(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <polygon points="150,60 130,150 170,150" fill="#3a424a"/>
      <g>
        <animateTransform attributeName="transform" type="rotate" values="8 150 70;-8 150 70;8 150 70" dur="2.6s" repeatCount="indefinite" additive="sum"/>
        <line x1="60" y1="70" x2="240" y2="70" stroke="#FF9800" stroke-width="8" stroke-linecap="round"/>
        <circle cx="75" cy="70" r="16" fill="#00979D"/>
        <text x="75" y="74" font-size="11" fill="#fff" text-anchor="middle" font-weight="700">R</text>
        <circle cx="225" cy="70" r="16" fill="#00C853"/>
        <text x="225" y="74" font-size="11" fill="#fff" text-anchor="middle" font-weight="700">I</text>
      </g>
    </svg>`, caption:"I = V / R — as resistance rises, current falls" };
  },
  wave(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <line x1="20" y1="90" x2="280" y2="90" stroke="#3a424a" stroke-width="2"/>
      <path d="M20,90 Q45,30 70,90 T120,90 T170,90 T220,90 T270,90" fill="none" stroke="#00979D" stroke-width="4">
        <animate attributeName="d"
          values="M20,90 Q45,30 70,90 T120,90 T170,90 T220,90 T270,90;
                   M20,90 Q45,150 70,90 T120,90 T170,90 T220,90 T270,90;
                   M20,90 Q45,30 70,90 T120,90 T170,90 T220,90 T270,90"
          dur="2s" repeatCount="indefinite"/>
      </path>
      <path d="M20,120 L60,120 L60,60 L100,60 L100,120 L140,120 L140,60 L180,60 L180,120 L220,120 L220,60 L260,60"
        fill="none" stroke="#FF9800" stroke-width="3" opacity="0.85"/>
      <text x="70" y="150" font-size="10" fill="#a9b3ba" text-anchor="middle">AC (wavy)</text>
      <text x="200" y="150" font-size="10" fill="#a9b3ba" text-anchor="middle">DC (steady/step)</text>
    </svg>`, caption:"AC alternates direction, DC stays constant — Arduino runs on DC" };
  },
  calc(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <rect x="30" y="35" width="240" height="110" rx="18" fill="#0e1113" stroke="#3a424a" stroke-width="2"/>
      <text x="150" y="80" font-size="28" fill="#FF9800" text-anchor="middle" font-family="monospace" font-weight="700">I = V / R</text>
      <text x="150" y="112" font-size="13" fill="#7fe8ff" text-anchor="middle" font-family="monospace">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1.8s" repeatCount="indefinite"/>
        calculating...
      </text>
      <circle cx="60" cy="52" r="4" fill="#00C853"><animate attributeName="opacity" values="1;0.2;1" dur="1.4s" repeatCount="indefinite"/></circle>
      <circle cx="240" cy="52" r="4" fill="#00C853"><animate attributeName="opacity" values="0.2;1;0.2" dur="1.4s" repeatCount="indefinite"/></circle>
    </svg>`, caption:"Ohm's Law triangle: V = I×R, I = V/R, R = V/I" };
  },
  diode(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <line x1="20" y1="90" x2="120" y2="90" stroke="#3a424a" stroke-width="4"/>
      <polygon points="120,65 120,115 175,90" fill="#FF9800"/>
      <line x1="175" y1="65" x2="175" y2="115" stroke="#FF9800" stroke-width="6"/>
      <line x1="175" y1="90" x2="280" y2="90" stroke="#3a424a" stroke-width="4"/>
      <circle r="6" fill="#00C853">
        <animateMotion dur="1.6s" repeatCount="indefinite" path="M 20,90 L 270,90"/>
        <animate attributeName="opacity" values="1;1;0" dur="1.6s" repeatCount="indefinite"/>
      </circle>
      <text x="150" y="145" font-size="11" fill="#a9b3ba" text-anchor="middle">Current flows only left → right</text>
    </svg>`, caption:"A diode blocks reverse current, like a one-way valve" };
  },
  capacitor(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <line x1="130" y1="40" x2="130" y2="140" stroke="#00979D" stroke-width="6"/>
      <line x1="170" y1="40" x2="170" y2="140" stroke="#00979D" stroke-width="6"/>
      <line x1="20" y1="90" x2="130" y2="90" stroke="#3a424a" stroke-width="4"/>
      <line x1="170" y1="90" x2="280" y2="90" stroke="#3a424a" stroke-width="4"/>
      <rect x="132" y="42" width="36" height="96" fill="#FF9800">
        <animate attributeName="width" values="0;36;0" dur="3s" repeatCount="indefinite"/>
        <animate attributeName="x" values="150;132;150" dur="3s" repeatCount="indefinite"/>
      </rect>
      <text x="150" y="160" font-size="11" fill="#a9b3ba" text-anchor="middle">Charging ⇄ discharging</text>
    </svg>`, caption:"A capacitor stores energy like a tiny rechargeable battery" };
  },
  resistor(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <line x1="10" y1="90" x2="70" y2="90" stroke="#c9ced1" stroke-width="4"/>
      <line x1="230" y1="90" x2="290" y2="90" stroke="#c9ced1" stroke-width="4"/>
      <rect x="70" y="65" width="160" height="50" rx="10" fill="#d9c9a3"/>
      <rect x="95" y="65" width="12" height="50" fill="#8a5a2b"/>
      <rect x="120" y="65" width="12" height="50" fill="#1a1a1a"/>
      <rect x="145" y="65" width="12" height="50" fill="#c0392b"/>
      <rect x="200" y="65" width="12" height="50" fill="#d4af37"/>
      <g font-size="9" fill="#212121" text-anchor="middle">
        <animate attributeName="opacity" values="1;0.4;1" dur="2.4s" repeatCount="indefinite"/>
      </g>
      <text x="150" y="150" font-size="11" fill="#a9b3ba" text-anchor="middle">Brown-Black-Red-Gold = 1kΩ ±5%</text>
    </svg>`, caption:"Each color band encodes a digit, multiplier, or tolerance" };
  },
  transistor(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <circle cx="150" cy="90" r="45" fill="none" stroke="#3a424a" stroke-width="2"/>
      <line x1="150" y1="55" x2="150" y2="125" stroke="#FF9800" stroke-width="5"/>
      <line x1="105" y1="90" x2="150" y2="90" stroke="#00979D" stroke-width="4"/>
      <line x1="150" y1="70" x2="200" y2="45" stroke="#00C853" stroke-width="4">
        <animate attributeName="opacity" values="0.2;1;0.2" dur="1.5s" repeatCount="indefinite"/>
      </line>
      <line x1="150" y1="110" x2="200" y2="135" stroke="#00C853" stroke-width="4"/>
      <text x="90" y="85" font-size="10" fill="#a9b3ba">Base</text>
      <text x="205" y="42" font-size="10" fill="#a9b3ba">Collector</text>
      <text x="205" y="145" font-size="10" fill="#a9b3ba">Emitter</text>
    </svg>`, caption:"A small base signal switches a much larger current" };
  },
  loop(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <rect x="30" y="25" width="100" height="50" rx="10" fill="#00979D"/>
      <text x="80" y="55" font-size="13" fill="#fff" text-anchor="middle" font-weight="700">setup()</text>
      <rect x="170" y="105" width="100" height="50" rx="10" fill="#FF9800">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="1.6s" repeatCount="indefinite"/>
      </rect>
      <text x="220" y="135" font-size="13" fill="#fff" text-anchor="middle" font-weight="700">loop()</text>
      <path d="M270,105 C 300,80 300,50 260,50 L 130,50" fill="none" stroke="#6f7a82" stroke-width="2" marker-end="url(#arrow)"/>
      <path d="M170,130 C 60,150 30,120 60,90 L 30,75" fill="none" stroke="#6f7a82" stroke-width="2" marker-end="url(#arrow)"/>
      <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#6f7a82"/></marker></defs>
      <text x="150" y="20" font-size="10" fill="#a9b3ba" text-anchor="middle">runs once</text>
    </svg>`, caption:"setup() runs once — loop() repeats forever" };
  },
  pin(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <rect x="60" y="60" width="180" height="60" rx="10" fill="#212121" stroke="#3a424a" stroke-width="2"/>
      <text x="150" y="95" font-size="13" fill="#00C853" text-anchor="middle" font-family="monospace">pinMode(13, OUTPUT)</text>
      <circle cx="255" cy="90" r="14" fill="#FF9800">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite"/>
      </circle>
      <line x1="240" y1="90" x2="255" y2="90" stroke="#FF9800" stroke-width="3"/>
      <text x="255" y="130" font-size="10" fill="#a9b3ba" text-anchor="middle">pin 13</text>
    </svg>`, caption:"pinMode() sets whether a pin sends (OUTPUT) or reads (INPUT)" };
  },
  led(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <line x1="150" y1="120" x2="150" y2="160" stroke="#6f7a82" stroke-width="4"/>
      <path d="M120,120 Q150,50 180,120 Z" fill="#FF9800">
        <animate attributeName="opacity" values="1;1;0.15;0.15" dur="2s" repeatCount="indefinite"/>
      </path>
      <circle cx="150" cy="95" r="55" fill="#FF9800" opacity="0.25">
        <animate attributeName="opacity" values="0.35;0.35;0;0" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="r" values="40;60;40;40" dur="2s" repeatCount="indefinite"/>
      </circle>
      <text x="150" y="15" font-size="10" fill="#a9b3ba" text-anchor="middle">digitalWrite HIGH / LOW</text>
    </svg>`, caption:"HIGH turns the LED on, LOW turns it off" };
  },
  ide(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <rect x="20" y="20" width="260" height="140" rx="10" fill="#0e1113" stroke="#3a424a" stroke-width="2"/>
      <circle cx="35" cy="34" r="4" fill="#ff5f56"/><circle cx="48" cy="34" r="4" fill="#ffbd2e"/><circle cx="61" cy="34" r="4" fill="#27c93f"/>
      <text x="30" y="65" font-size="10" fill="#7fe8ff" font-family="monospace">void setup() {</text>
      <text x="40" y="80" font-size="10" fill="#ffb74d" font-family="monospace">Serial.begin(9600);</text>
      <text x="30" y="95" font-size="10" fill="#7fe8ff" font-family="monospace">}</text>
      <rect x="150" y="115" width="90" height="26" rx="6" fill="#00979D">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="1.6s" repeatCount="indefinite"/>
      </rect>
      <text x="195" y="132" font-size="10" fill="#fff" text-anchor="middle" font-weight="700">Upload ⇢ Board</text>
    </svg>`, caption:"The IDE compiles your sketch and uploads it over USB" };
  },
  code(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <rect x="20" y="30" width="260" height="120" rx="10" fill="#0e1113" stroke="#3a424a" stroke-width="2"/>
      <text x="35" y="60" font-size="10" fill="#7fe8ff" font-family="monospace">digitalWrite(9, OUTPUT);</text>
      <rect x="30" y="48" width="200" height="16" fill="#ff5252" opacity="0.25">
        <animate attributeName="opacity" values="0.1;0.4;0.1" dur="1.2s" repeatCount="indefinite"/>
      </rect>
      <text x="35" y="85" font-size="10" fill="#7fe8ff" font-family="monospace">pinMode(9, HIGH);</text>
      <rect x="30" y="73" width="150" height="16" fill="#ff5252" opacity="0.25">
        <animate attributeName="opacity" values="0.4;0.1;0.4" dur="1.2s" repeatCount="indefinite"/>
      </rect>
      <text x="150" y="130" font-size="10" fill="#ff8a80" text-anchor="middle">⚠ functions used incorrectly</text>
    </svg>`, caption:"Spot the bug: pinMode() and digitalWrite() are swapped" };
  },
  digital(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <line x1="20" y1="140" x2="280" y2="140" stroke="#3a424a" stroke-width="1"/>
      <path d="M20,140 L20,60 L90,60 L90,140 L160,140 L160,60 L230,60 L230,140 L280,140"
        fill="none" stroke="#00C853" stroke-width="4">
      </path>
      <text x="20" y="55" font-size="10" fill="#00C853">HIGH</text>
      <text x="20" y="155" font-size="10" fill="#ff8a80">LOW</text>
      <circle r="6" fill="#FF9800">
        <animateMotion dur="2.6s" repeatCount="indefinite" path="M20,140 L20,60 L90,60 L90,140 L160,140 L160,60 L230,60 L230,140 L280,140"/>
      </circle>
    </svg>`, caption:"Digital signals only ever sit at HIGH or LOW" };
  },
  button(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <rect x="110" y="100" width="80" height="24" rx="4" fill="#3a424a"/>
      <circle cx="150" cy="90" r="26" fill="#FF9800">
        <animate attributeName="cy" values="90;100;90" dur="1.6s" repeatCount="indefinite"/>
      </circle>
      <text x="150" y="150" font-size="11" fill="#a9b3ba" text-anchor="middle">press ⇢ digitalRead() sees HIGH/LOW</text>
      <circle r="5" fill="#00C853" opacity="0">
        <animate attributeName="opacity" values="0;0;1;0" dur="1.6s" repeatCount="indefinite"/>
        <animateMotion dur="1.6s" repeatCount="indefinite" path="M150,105 L150,40 L250,40"/>
      </circle>
    </svg>`, caption:"A button press changes the digital pin's state" };
  },
  gauge(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <path d="M50,140 A100,100 0 0 1 250,140" fill="none" stroke="#3a424a" stroke-width="14"/>
      <path d="M50,140 A100,100 0 0 1 250,140" fill="none" stroke="#FF9800" stroke-width="14" stroke-dasharray="314" >
        <animate attributeName="stroke-dashoffset" values="314;80;314" dur="2.6s" repeatCount="indefinite"/>
      </path>
      <line x1="150" y1="140" x2="150" y2="60" stroke="#fff" stroke-width="4">
        <animateTransform attributeName="transform" type="rotate" values="-70 150 140; 70 150 140; -70 150 140" dur="2.6s" repeatCount="indefinite"/>
      </line>
      <circle cx="150" cy="140" r="8" fill="#fff"/>
      <text x="150" y="165" font-size="11" fill="#a9b3ba" text-anchor="middle">analogRead() → 0 – 1023</text>
    </svg>`, caption:"Analog pins measure a continuous range, not just on/off" };
  },
  dial(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <circle cx="150" cy="90" r="55" fill="none" stroke="#3a424a" stroke-width="10"/>
      <line x1="150" y1="90" x2="150" y2="45" stroke="#00979D" stroke-width="6">
        <animateTransform attributeName="transform" type="rotate" values="0 150 90;300 150 90;0 150 90" dur="3s" repeatCount="indefinite"/>
      </line>
      <circle cx="150" cy="90" r="6" fill="#fff"/>
      <text x="150" y="160" font-size="11" fill="#a9b3ba" text-anchor="middle">Potentiometer wiper position</text>
    </svg>`, caption:"Turning the potentiometer changes the analog voltage read" };
  },
  terminal(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <rect x="20" y="20" width="260" height="140" rx="10" fill="#0b0e0f" stroke="#3a424a" stroke-width="2"/>
      <text x="34" y="45" font-size="10" fill="#00C853" font-family="monospace">Hello Arduino!</text>
      <text x="34" y="65" font-size="10" fill="#00C853" font-family="monospace">Temp: 24.5 C</text>
      <text x="34" y="85" font-size="10" fill="#00C853" font-family="monospace">Humidity: 61%</text>
      <text x="34" y="105" font-size="10" fill="#00C853" font-family="monospace" opacity="0">
        <animate attributeName="opacity" values="0;1;1" dur="2.4s" repeatCount="indefinite"/>
        Distance: 12cm
      </text>
      <rect x="34" y="108" width="6" height="12" fill="#00C853">
        <animate attributeName="opacity" values="1;0;1" dur="0.8s" repeatCount="indefinite"/>
      </rect>
    </svg>`, caption:"Serial.println() streams live data to the Serial Monitor" };
  },
  "terminal-error"(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <rect x="20" y="20" width="260" height="140" rx="10" fill="#0b0e0f" stroke="#3a424a" stroke-width="2"/>
      <text x="34" y="60" font-size="10" fill="#ff5252" font-family="monospace">%&amp;#@!!??%%$#garbled</text>
      <text x="34" y="80" font-size="10" fill="#ff5252" font-family="monospace">##@%!!&amp;*text*&amp;^%</text>
      <text x="150" y="125" font-size="10" fill="#ffb74d" text-anchor="middle">baud rate mismatch</text>
    </svg>`, caption:"Sender and receiver must agree on the same baud rate" };
  },
  dht(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <rect x="110" y="30" width="80" height="50" rx="8" fill="#00979D"/>
      <text x="150" y="60" font-size="10" fill="#fff" text-anchor="middle" font-weight="700">DHT22</text>
      <text x="80" y="130" font-size="20" fill="#FF9800" text-anchor="middle" font-weight="700">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite"/>
        24.5°C
      </text>
      <text x="220" y="130" font-size="20" fill="#00979D" text-anchor="middle" font-weight="700">
        <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite"/>
        61% RH
      </text>
      <line x1="150" y1="80" x2="80" y2="105" stroke="#3a424a" stroke-width="2"/>
      <line x1="150" y1="80" x2="220" y2="105" stroke="#3a424a" stroke-width="2"/>
    </svg>`, caption:"DHT sensors read both temperature and humidity" };
  },
  dashboard(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <rect x="20" y="20" width="120" height="60" rx="10" fill="#1a2226" stroke="#3a424a"/>
      <text x="80" y="45" font-size="10" fill="#a9b3ba" text-anchor="middle">Temp</text>
      <text x="80" y="68" font-size="16" fill="#FF9800" text-anchor="middle" font-weight="700">26°C</text>
      <rect x="160" y="20" width="120" height="60" rx="10" fill="#1a2226" stroke="#3a424a"/>
      <text x="220" y="45" font-size="10" fill="#a9b3ba" text-anchor="middle">Soil</text>
      <text x="220" y="68" font-size="16" fill="#00C853" text-anchor="middle" font-weight="700">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.8s" repeatCount="indefinite"/>
        Moist
      </text>
      <rect x="90" y="100" width="120" height="60" rx="10" fill="#1a2226" stroke="#3a424a"/>
      <text x="150" y="125" font-size="10" fill="#a9b3ba" text-anchor="middle">Light</text>
      <text x="150" y="148" font-size="16" fill="#7fe8ff" text-anchor="middle" font-weight="700">780 lux</text>
    </svg>`, caption:"Multiple sensors together build a full environmental picture" };
  },
  motor(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <circle cx="150" cy="90" r="45" fill="#212121" stroke="#3a424a" stroke-width="4"/>
      <g>
        <animateTransform attributeName="transform" type="rotate" from="0 150 90" to="360 150 90" dur="1.2s" repeatCount="indefinite"/>
        <rect x="146" y="50" width="8" height="80" fill="#FF9800"/>
        <rect x="110" y="86" width="80" height="8" fill="#FF9800"/>
      </g>
      <circle cx="150" cy="90" r="8" fill="#6f7a82"/>
      <text x="150" y="160" font-size="11" fill="#a9b3ba" text-anchor="middle">DC motor spinning</text>
    </svg>`, caption:"A motor driver amplifies Arduino's signal to spin the motor" };
  },
  "motor-diode"(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <circle cx="90" cy="90" r="35" fill="#212121" stroke="#3a424a" stroke-width="3"/>
      <g><animateTransform attributeName="transform" type="rotate" from="0 90 90" to="360 90 90" dur="1s" repeatCount="indefinite"/>
        <rect x="86" y="60" width="8" height="60" fill="#FF9800"/></g>
      <line x1="125" y1="90" x2="200" y2="90" stroke="#3a424a" stroke-width="3"/>
      <polygon points="200,72 200,108 230,90" fill="#00C853"/>
      <line x1="230" y1="72" x2="230" y2="108" stroke="#00C853" stroke-width="5"/>
      <text x="200" y="140" font-size="10" fill="#a9b3ba" text-anchor="middle">flyback diode protects the switch</text>
    </svg>`, caption:"The diode gives voltage spikes a safe path when the motor switches off" };
  },
  hbridge(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <rect x="40" y="30" width="20" height="120" fill="#3a424a"/>
      <rect x="240" y="30" width="20" height="120" fill="#3a424a"/>
      <rect x="60" y="30" width="180" height="12" fill="#00979D"/>
      <rect x="60" y="138" width="180" height="12" fill="#00979D"/>
      <circle cx="150" cy="90" r="26" fill="#212121" stroke="#FF9800" stroke-width="3">
        <animateTransform attributeName="transform" type="rotate" values="0 150 90;360 150 90" dur="1.4s" repeatCount="indefinite"/>
      </circle>
      <text x="150" y="20" font-size="10" fill="#a9b3ba" text-anchor="middle">H-Bridge reverses current direction</text>
    </svg>`, caption:"Four switches in an 'H' shape let the motor spin either way" };
  },
  servo(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <path d="M60,140 A100,100 0 0 1 240,140" fill="none" stroke="#3a424a" stroke-width="4"/>
      <line x1="150" y1="140" x2="150" y2="55" stroke="#FF9800" stroke-width="6" stroke-linecap="round">
        <animateTransform attributeName="transform" type="rotate" values="0 150 140;80 150 140;0 150 140;-80 150 140;0 150 140" dur="4s" repeatCount="indefinite"/>
      </line>
      <circle cx="150" cy="140" r="10" fill="#00979D"/>
      <text x="150" y="165" font-size="11" fill="#a9b3ba" text-anchor="middle">servo.write(angle)</text>
    </svg>`, caption:"A servo rotates to and holds a specific commanded angle" };
  },
  "servo-pulse"(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <line x1="20" y1="140" x2="280" y2="140" stroke="#3a424a"/>
      <path d="M20,140 L20,60 L45,60 L45,140 L200,140 L200,60 L225,60 L225,140 L280,140" fill="none" stroke="#00C853" stroke-width="3"/>
      <text x="32" y="55" font-size="9" fill="#a9b3ba" text-anchor="middle">1.5ms</text>
      <text x="150" y="160" font-size="10" fill="#a9b3ba" text-anchor="middle">pulse width every 20ms defines the angle</text>
    </svg>`, caption:"1ms ≈ 0°, 1.5ms ≈ 90°, 2ms ≈ 180°" };
  },
  pwm(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <line x1="20" y1="150" x2="280" y2="150" stroke="#3a424a"/>
      <path d="M20,150 L20,60 L60,60 L60,150 L100,150 L100,60 L140,60 L140,150 L180,150 L180,60 L220,60 L220,150 L260,150 L260,60 L280,60"
        fill="none" stroke="#FF9800" stroke-width="3"/>
      <circle cx="150" cy="30" r="18" fill="#FF9800">
        <animate attributeName="opacity" values="0.2;1;0.2" dur="1.4s" repeatCount="indefinite"/>
      </circle>
      <text x="150" y="170" font-size="10" fill="#a9b3ba" text-anchor="middle">duty cycle = % of time the pulse is HIGH</text>
    </svg>`, caption:"analogWrite() varies duty cycle to simulate an analog level" };
  },
  buzzer(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <circle cx="150" cy="90" r="20" fill="#FF9800"/>
      <circle cx="150" cy="90" r="35" fill="none" stroke="#FF9800" stroke-width="2">
        <animate attributeName="r" values="30;70" dur="1.4s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.8;0" dur="1.4s" repeatCount="indefinite"/>
      </circle>
      <circle cx="150" cy="90" r="35" fill="none" stroke="#FF9800" stroke-width="2">
        <animate attributeName="r" values="30;70" begin="0.5s" dur="1.4s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.8;0" begin="0.5s" dur="1.4s" repeatCount="indefinite"/>
      </circle>
      <text x="150" y="150" font-size="11" fill="#a9b3ba" text-anchor="middle">tone(pin, frequency)</text>
    </svg>`, caption:"Piezo buzzers vibrate at a set frequency to make sound" };
  },
  lcd(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <rect x="30" y="40" width="240" height="100" rx="8" fill="#0d3b2e" stroke="#3a424a" stroke-width="4"/>
      <text x="45" y="80" font-size="13" fill="#8ef7c1" font-family="monospace">
        <animate attributeName="opacity" values="0;1" dur="1.5s" begin="0s" fill="freeze"/>
        Hello!
      </text>
      <text x="45" y="110" font-size="13" fill="#8ef7c1" font-family="monospace">
        <animate attributeName="opacity" values="0;0;1" dur="2.6s" repeatCount="indefinite"/>
        16 x 2 LCD
      </text>
    </svg>`, caption:"lcd.setCursor(col, row) positions text on the 16x2 grid" };
  },
  ultrasonic(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <rect x="30" y="75" width="40" height="30" rx="4" fill="#212121"/>
      <circle cx="50" cy="90" r="18" fill="none" stroke="#00979D" stroke-width="2">
        <animate attributeName="r" values="10;90" dur="1.8s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.9;0" dur="1.8s" repeatCount="indefinite"/>
      </circle>
      <rect x="240" y="60" width="16" height="60" fill="#6f7a82"/>
      <text x="150" y="160" font-size="11" fill="#a9b3ba" text-anchor="middle">distance = time / 58 (cm)</text>
    </svg>`, caption:"Sound pulses out, bounces off the object, and echoes back" };
  },
  ir(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <rect x="30" y="70" width="60" height="24" rx="6" fill="#212121"/>
      <circle cx="90" cy="82" r="6" fill="#ff5252"/>
      <line x1="100" y1="82" x2="240" y2="82" stroke="#ff5252" stroke-width="3" stroke-dasharray="8 6">
        <animate attributeName="stroke-dashoffset" values="0;28" dur="1s" repeatCount="indefinite"/>
      </line>
      <rect x="240" y="65" width="30" height="34" rx="6" fill="#00979D"/>
      <text x="150" y="140" font-size="11" fill="#a9b3ba" text-anchor="middle">Invisible infrared light carries the code</text>
    </svg>`, caption:"An IR remote sends pulses of infrared light the receiver decodes" };
  },
  irline(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <rect x="20" y="120" width="260" height="10" fill="#111"/>
      <rect x="120" y="118" width="14" height="14" fill="#111"/>
      <rect x="20" y="60" width="60" height="30" rx="6" fill="#FF9800">
        <animateMotion dur="2.4s" repeatCount="indefinite" path="M0,0 L120,0 L120,20 L 0,20"/>
      </rect>
      <text x="150" y="160" font-size="11" fill="#a9b3ba" text-anchor="middle">IR sensors detect dark line vs light floor</text>
    </svg>`, caption:"Dark surfaces absorb IR light, light surfaces reflect it back" };
  },
  robot(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <rect x="0" y="150" width="300" height="4" fill="#3a424a"/>
      <g>
        <animateTransform attributeName="transform" type="translate" values="0,0;180,0;0,0" dur="4s" repeatCount="indefinite"/>
        <rect x="30" y="100" width="70" height="40" rx="10" fill="#00979D"/>
        <circle cx="45" cy="145" r="10" fill="#212121"><animateTransform attributeName="transform" type="rotate" from="0 45 145" to="360 45 145" dur="0.6s" repeatCount="indefinite"/></circle>
        <circle cx="85" cy="145" r="10" fill="#212121"><animateTransform attributeName="transform" type="rotate" from="0 85 145" to="360 85 145" dur="0.6s" repeatCount="indefinite"/></circle>
        <circle cx="90" cy="110" r="6" fill="#FF9800"/>
      </g>
    </svg>`, caption:"The robot senses, decides, and acts as it moves" };
  },
  "robot-loop"(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <circle cx="80" cy="90" r="30" fill="#00979D"/><text x="80" y="94" font-size="10" fill="#fff" text-anchor="middle">Sense</text>
      <circle cx="150" cy="40" r="30" fill="#FF9800"/><text x="150" y="44" font-size="10" fill="#fff" text-anchor="middle">Decide</text>
      <circle cx="220" cy="90" r="30" fill="#00C853"/><text x="220" y="94" font-size="10" fill="#04240f" text-anchor="middle">Act</text>
      <path d="M105,75 L125,55" stroke="#6f7a82" stroke-width="2" marker-end="url(#a1)"/>
      <path d="M175,55 L195,75" stroke="#6f7a82" stroke-width="2" marker-end="url(#a1)"/>
      <path d="M205,115 Q150,150 95,115" stroke="#6f7a82" stroke-width="2" fill="none" marker-end="url(#a1)"/>
      <defs><marker id="a1" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#6f7a82"/></marker></defs>
    </svg>`, caption:"Feedback lets the robot continually adjust to real conditions" };
  },
  wheel(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <circle cx="150" cy="90" r="50" fill="none" stroke="#3a424a" stroke-width="10"/>
      <g>
        <animateTransform attributeName="transform" type="rotate" from="0 150 90" to="360 150 90" dur="1.4s" repeatCount="indefinite"/>
        <line x1="150" y1="90" x2="150" y2="40" stroke="#FF9800" stroke-width="4"/>
        <line x1="150" y1="90" x2="190" y2="90" stroke="#FF9800" stroke-width="4"/>
        <circle cx="150" cy="40" r="5" fill="#00C853"/>
      </g>
      <text x="150" y="160" font-size="11" fill="#a9b3ba" text-anchor="middle">encoder counts each rotation</text>
    </svg>`, caption:"Distance = π × diameter × number of rotations" };
  },
  obstacle(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <rect x="0" y="150" width="300" height="4" fill="#3a424a"/>
      <rect x="220" y="90" width="20" height="60" fill="#ff5252"/>
      <g>
        <animateTransform attributeName="transform" type="translate" values="0,0;140,0;140,0;60,-40" dur="4s" repeatCount="indefinite"/>
        <rect x="30" y="110" width="60" height="34" rx="8" fill="#00979D"/>
        <circle cx="42" cy="146" r="8" fill="#212121"/><circle cx="78" cy="146" r="8" fill="#212121"/>
      </g>
      <text x="150" y="170" font-size="11" fill="#a9b3ba" text-anchor="middle">stop → check → turn away from obstacle</text>
    </svg>`, caption:"The robot halts and reroutes when something blocks its path" };
  },
  arm(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <circle cx="60" cy="150" r="10" fill="#3a424a"/>
      <line x1="60" y1="150" x2="150" y2="150" stroke="#FF9800" stroke-width="10" stroke-linecap="round">
        <animateTransform attributeName="transform" type="rotate" values="0 60 150;-40 60 150;0 60 150" dur="3.2s" repeatCount="indefinite"/>
      </line>
      <line x1="150" y1="150" x2="230" y2="150" stroke="#00979D" stroke-width="10" stroke-linecap="round">
        <animateTransform attributeName="transform" type="rotate" values="0 150 150;60 150 150;0 150 150" dur="3.2s" repeatCount="indefinite"/>
      </line>
      <circle cx="230" cy="150" r="7" fill="#00C853"/>
      <text x="150" y="30" font-size="10" fill="#a9b3ba" text-anchor="middle">joint angles → end-effector position</text>
    </svg>`, caption:"Forward kinematics: known angles → resulting arm position" };
  },
  "arm-target"(){
    return { svg:`
    <svg viewBox="0 0 300 180">
      <circle cx="60" cy="150" r="10" fill="#3a424a"/>
      <line x1="60" y1="150" x2="140" y2="110" stroke="#FF9800" stroke-width="10" stroke-linecap="round"/>
      <line x1="140" y1="110" x2="210" y2="70" stroke="#00979D" stroke-width="10" stroke-linecap="round"/>
      <circle cx="230" cy="55" r="10" fill="none" stroke="#00C853" stroke-width="3" stroke-dasharray="4 4">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" repeatCount="indefinite"/>
      </circle>
      <text x="150" y="20" font-size="10" fill="#a9b3ba" text-anchor="middle">target position → solve for joint angles</text>
    </svg>`, caption:"Inverse kinematics: desired position → required angles" };
  },
};

window.renderAnimation = renderAnimation;
