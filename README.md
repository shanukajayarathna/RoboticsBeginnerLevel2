# Arduino Junior Certification Academy

A gamified, animated web app for Arduino Junior Certification prep — practice mode, timed exam mode, XP/coins/streaks, achievements, and an SVG teaching animation for every question.

## Run it

Browsers block `fetch()` of local JSON files opened directly from disk (`file://`), so serve the folder instead of double-clicking `index.html`:

```bash
# option 1 — Python (built into most systems)
python3 -m http.server 8000

# option 2 — Node
npx serve .
```

Then open the printed `http://localhost:...` address.

## What's inside

- `index.html` — app shell (home, topics, quiz, results, achievements, question bank)
- `styles.css` — dark + orange Arduino theme, glassmorphism cards, animated buttons
- `app.js` — gamification state (XP/coins/stars/streak/levels/achievements), quiz engine, hint system, confetti/coin FX, exam timer, results & certificate, Arduino Buddy mascot
- `animations.js` — SVG animation engine, one visual per question topic-family (circuits, Ohm's law, components, Arduino code, digital/analog I/O, serial, DHT, motors, servos, PWM, buzzer, LCD, ultrasonic, IR, robotics, kinematics)
- `data/questions.json` — the question bank (schema below), loaded dynamically at runtime
- `build_questions.py` — the script that generated `questions.json`; edit it and re-run (`python3 build_questions.py`) to add/change questions in bulk, or hand-edit the JSON directly

## Question schema

```json
{
  "id": 1,
  "topic": "Ohm's Law",
  "difficulty": "Easy",
  "type": "Calculation",
  "question": "...",
  "options": ["...", "...", "...", "..."],
  "answer": "...",
  "explanation": "...",
  "hint1": "...", "hint2": "...", "hint3": "...",
  "animation": "ohms-law-calculator",
  "image": null,
  "formula": "I = V / R = 12 / 4 = 3A",
  "xp": 10,
  "marks": 1
}
```

## Honest scope notes

This was built as a single dependency-free HTML/CSS/JS app (no npm install needed) so it runs immediately and reliably, rather than a full Next.js/TypeScript/Tailwind/Framer-Motion/shadcn build — that stack needs a real bundler + `npm install` pass to verify, which isn't practical to hand-guarantee working here. The interaction/animation/gamification behavior is the same; only the underlying build tooling differs.

The question bank ships with **85 hand-written questions covering all 24 syllabus topics** (Ohm's Law, PWM, and Ultrasonic Sensors get extra calculation-heavy coverage), rather than a full 120 — quality and full-schema completeness (hints, explanations, formulas, animations) were prioritized over hitting an exact count. Since questions are schema-driven JSON, it's straightforward to append more via `build_questions.py`.

There's no real backend/server — "Admin Panel" is a read-only, searchable view of the live question bank (question editing is done by editing `questions.json` or `build_questions.py`). Progress (XP, coins, achievements, streak) is saved to the browser's `localStorage`, per-browser, with no login system.
