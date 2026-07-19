#!/usr/bin/env python3
"""
Builds data/l2/questions.json for Arduino Junior Certification Academy.
Run: python3 build_questions.py
"""
import json

Q = []
_id = 0
def add(topic, difficulty, qtype, question, options, answer, explanation,
        hint1, hint2, hint3, animation, image=None, formula=None, xp=None, marks=None):
    global _id
    _id += 1
    if xp is None:
        xp = {"Easy": 10, "Medium": 15, "Hard": 25}[difficulty]
    if marks is None:
        marks = {"Easy": 1, "Medium": 2, "Hard": 3}[difficulty]
    Q.append({
        "id": _id,
        "topic": topic,
        "difficulty": difficulty,
        "type": qtype,
        "question": question,
        "options": options,
        "answer": answer,
        "explanation": explanation,
        "hint1": hint1,
        "hint2": hint2,
        "hint3": hint3,
        "animation": animation,
        "image": image,
        "formula": formula,
        "xp": xp,
        "marks": marks
    })

# ---------------------------------------------------------------
# FOUNDATIONS OF ELECTRONICS
# ---------------------------------------------------------------
add("Foundations of Electronics", "Easy", "MCQ",
    "What is electric current measured in?",
    ["Volts", "Amperes", "Ohms", "Watts"], "Amperes",
    "Electric current is the flow of electric charge, measured in Amperes (A). Volts measure potential difference, Ohms measure resistance, and Watts measure power.",
    "Think of the unit that shares its name with 'Amp' in a guitar amplifier.",
    "It's named after André-Marie Ampère.",
    "The symbol for this unit is 'A'.",
    "current-flow-basic")

add("Foundations of Electronics", "Easy", "TrueFalse",
    "True or False: An electric circuit must be a closed loop for current to flow.",
    ["True", "False"], "True",
    "Current only flows in a complete (closed) circuit. If the loop is broken (open circuit), current cannot flow, just like water can't flow through a broken pipe.",
    "Think about turning off a light switch.",
    "A switch works by breaking the loop.",
    "Closed = connected all the way around.",
    "circuit-open-close")

add("Foundations of Electronics", "Easy", "MCQ",
    "Which of these is a conductor of electricity?",
    ["Rubber", "Copper", "Glass", "Plastic"], "Copper",
    "Copper is a metal with free electrons that move easily, making it an excellent conductor. Rubber, glass, and plastic are insulators that resist current flow, which is why they're used to coat wires.",
    "Metals generally conduct electricity well.",
    "This metal is used inside almost every wire.",
    "It has a reddish-orange color.",
    "conductor-insulator-demo")

add("Foundations of Electronics", "Medium", "MCQ",
    "In a circuit diagram, what does the symbol for a battery represent?",
    ["A source of resistance", "A source of electromotive force (voltage)", "A switch", "A sensor"], "A source of electromotive force (voltage)",
    "A battery symbol (long and short parallel lines) represents a voltage source that pushes current through the circuit, converting chemical energy into electrical energy.",
    "Batteries power circuits.",
    "It provides the 'push' for electrons.",
    "It is measured in Volts.",
    "battery-symbol-demo")

# ---------------------------------------------------------------
# ELECTRICITY
# ---------------------------------------------------------------
add("Electricity", "Easy", "MCQ",
    "What is voltage?",
    ["The rate of flow of charge", "The opposition to current flow", "The difference in electric potential between two points", "The power consumed by a device"], "The difference in electric potential between two points",
    "Voltage is the 'electrical pressure' that pushes electrons through a circuit — the potential difference between two points. Higher voltage means a stronger push for current to flow.",
    "Think of voltage like water pressure in a pipe.",
    "It's measured in Volts (V).",
    "It's the difference between two points, not a flow itself.",
    "voltage-pressure-analogy")

add("Electricity", "Easy", "MCQ",
    "Which term describes the opposition to current flow in a circuit?",
    ["Voltage", "Resistance", "Power", "Frequency"], "Resistance",
    "Resistance opposes the flow of current, converting some electrical energy into heat. It's measured in Ohms (Ω), and components like resistors are designed specifically to add resistance.",
    "Think about friction slowing down movement.",
    "Resistors are named after this property.",
    "Measured in Ohms (Ω).",
    "resistance-friction-demo")

add("Electricity", "Medium", "MCQ",
    "What happens to current in a circuit if resistance increases while voltage stays the same?",
    ["Current increases", "Current decreases", "Current stays the same", "Voltage decreases"], "Current decreases",
    "From Ohm's Law (I = V/R), if voltage (V) is constant and resistance (R) increases, current (I) must decrease — there's more opposition, so less charge flows per second.",
    "Recall Ohm's Law: I = V/R.",
    "R is in the denominator — bigger R means smaller result.",
    "More opposition = less flow.",
    "ohms-law-seesaw")

add("Electricity", "Medium", "MCQ",
    "AC and DC are two types of electrical current. What does Arduino primarily use internally?",
    ["AC - Alternating Current", "DC - Direct Current", "Both equally", "Neither"], "DC - Direct Current",
    "Arduino boards and most electronics run on DC (Direct Current), which flows in one constant direction — unlike AC (Alternating Current) from wall outlets, which reverses direction periodically.",
    "Batteries and USB power supply this type of current.",
    "It flows in only one direction.",
    "The opposite is AC, used in wall outlets.",
    "ac-dc-waveform")

# ---------------------------------------------------------------
# OHM'S LAW (calculation heavy)
# ---------------------------------------------------------------
add("Ohm's Law", "Easy", "Calculation",
    "A circuit has a voltage of 12V and a resistance of 4Ω. What is the current?",
    ["2A", "3A", "4A", "48A"], "3A",
    "Using Ohm's Law: I = V / R = 12V / 4Ω = 3A. Current is directly proportional to voltage and inversely proportional to resistance.",
    "Use the formula I = V / R.",
    "Divide 12 by 4.",
    "12 ÷ 4 = 3",
    "ohms-law-calculator",
    formula="I = V / R = 12 / 4 = 3A")

add("Ohm's Law", "Easy", "Calculation",
    "If current is 2A and resistance is 5Ω, what is the voltage?",
    ["2.5V", "7V", "10V", "3V"], "10V",
    "Using Ohm's Law: V = I × R = 2A × 5Ω = 10V. Voltage is the product of current and resistance.",
    "Use the formula V = I × R.",
    "Multiply 2 by 5.",
    "2 × 5 = 10",
    "ohms-law-calculator",
    formula="V = I × R = 2 × 5 = 10V")

add("Ohm's Law", "Medium", "Calculation",
    "A 9V battery is connected to a resistor, producing a current of 0.5A. What is the resistance?",
    ["4.5Ω", "18Ω", "9.5Ω", "0.5Ω"], "18Ω",
    "Using Ohm's Law: R = V / I = 9V / 0.5A = 18Ω. Rearranging the triangle formula gives resistance when voltage and current are known.",
    "Use the formula R = V / I.",
    "Divide 9 by 0.5.",
    "9 ÷ 0.5 = 18",
    "ohms-law-calculator",
    formula="R = V / I = 9 / 0.5 = 18Ω")

add("Ohm's Law", "Medium", "Calculation",
    "You want to power an LED that needs 20mA (0.02A) from a 5V Arduino pin. The LED drops 2V. What resistor value is needed?",
    ["100Ω", "150Ω", "250Ω", "300Ω"], "150Ω",
    "First find the voltage across the resistor: 5V - 2V (LED drop) = 3V. Then R = V/I = 3V / 0.02A = 150Ω. This is the classic LED current-limiting resistor calculation.",
    "Subtract the LED's voltage drop from the supply voltage first.",
    "Remaining voltage is 3V.",
    "R = 3V ÷ 0.02A",
    "led-resistor-calculator",
    formula="R = (Vsupply − VLED) / I = (5−2)/0.02 = 150Ω")

add("Ohm's Law", "Hard", "Calculation",
    "Two 100Ω resistors are connected in series across a 10V supply. What current flows through the circuit?",
    ["0.05A", "0.1A", "0.2A", "20A"], "0.05A",
    "In series, resistances add: 100Ω + 100Ω = 200Ω total. Then I = V/R = 10V / 200Ω = 0.05A. Series resistors always increase total resistance.",
    "Series resistances simply add together.",
    "Total resistance = 200Ω.",
    "I = 10 ÷ 200",
    "series-resistor-demo",
    formula="R_total = 100+100 = 200Ω, I = V/R = 10/200 = 0.05A")

add("Ohm's Law", "Hard", "Calculation",
    "A resistor rated for 0.25W is connected to a circuit carrying 50mA at 6V. Is the resistor safe to use?",
    ["Yes, power used is 0.3W which is under the rating", "No, power used is 0.3W which exceeds the rating", "Yes, power used is 0.15W which is under the rating", "No, it will draw 6A"], "No, power used is 0.3W which exceeds the rating",
    "Power P = V × I = 6V × 0.05A = 0.3W. Since 0.3W exceeds the resistor's 0.25W rating, it could overheat and fail — always choose a resistor rated above the expected power dissipation.",
    "Power formula: P = V × I.",
    "6 × 0.05 = 0.3",
    "Compare 0.3W to the 0.25W rating.",
    "resistor-overheat-demo",
    formula="P = V × I = 6 × 0.05 = 0.3W (exceeds 0.25W rating)")

# ---------------------------------------------------------------
# ELECTRONIC COMPONENTS
# ---------------------------------------------------------------
add("Electronic Components", "Easy", "IdentifyComponent",
    "Which component only allows current to flow in one direction?",
    ["Resistor", "Capacitor", "Diode", "Inductor"], "Diode",
    "A diode acts like a one-way valve for current — it allows flow in the forward direction but blocks it in reverse. LEDs are a special type of diode that also emits light.",
    "Think of a one-way street for electrons.",
    "LEDs are a special type of this component.",
    "It has an anode and a cathode.",
    "diode-current-flow")

add("Electronic Components", "Easy", "MatchComponent",
    "What is the main function of a capacitor in a circuit?",
    ["Amplify signals", "Store and release electrical energy", "Convert AC to DC only", "Increase resistance"], "Store and release electrical energy",
    "A capacitor stores electrical energy in an electric field between two plates and can release it quickly, often used for smoothing power or filtering noise.",
    "Think of it like a tiny rechargeable battery.",
    "It charges and discharges quickly.",
    "Often used to smooth voltage.",
    "capacitor-charge-discharge")

add("Electronic Components", "Easy", "MCQ",
    "What do the colored bands on a resistor indicate?",
    ["Its voltage rating", "Its resistance value and tolerance", "Its manufacturer", "Its current capacity"], "Its resistance value and tolerance",
    "Resistor color bands follow a standard code where each color represents a digit, multiplier, or tolerance percentage, allowing you to read the resistance value without a multimeter.",
    "Each color stands for a number.",
    "There's a standard 'color code' chart.",
    "The last band usually shows tolerance (gold/silver).",
    "resistor-color-bands")

add("Electronic Components", "Medium", "Calculation",
    "A resistor has color bands: Brown, Black, Red, Gold. What is its resistance value?",
    ["10Ω", "100Ω", "1000Ω (1kΩ)", "10,000Ω (10kΩ)"], "1000Ω (1kΩ)",
    "Brown=1, Black=0, Red=multiplier ×100. So 10 × 100 = 1000Ω = 1kΩ. Gold indicates ±5% tolerance. This is the standard 4-band resistor color code.",
    "Brown=1, Black=0 form the first two digits: '10'.",
    "Red as the third band means multiply by 100.",
    "10 × 100 = 1000",
    "resistor-color-bands",
    formula="10 × 100 = 1000Ω (1kΩ), ±5% tolerance")

add("Electronic Components", "Medium", "MCQ",
    "What is the purpose of a transistor in basic Arduino projects?",
    ["To store energy", "To act as an electronic switch or amplifier", "To measure temperature", "To reduce voltage only"], "To act as an electronic switch or amplifier",
    "Transistors act as electronic switches that let a small Arduino signal (like 5V from a pin) control a much larger current, such as powering a motor — they can also amplify signals.",
    "Arduino pins can't supply much current directly.",
    "Transistors let a small signal control a bigger load.",
    "Common uses: driving motors, relays, LEDs.",
    "transistor-switch-demo")

# ---------------------------------------------------------------
# ARDUINO BASICS
# ---------------------------------------------------------------
add("Arduino Basics", "Easy", "MCQ",
    "What function runs once when an Arduino sketch starts?",
    ["loop()", "setup()", "start()", "main()"], "setup()",
    "The setup() function runs exactly once when the Arduino powers on or resets — it's used for initializing pins, serial communication, and variables.",
    "It runs before the repeating part of the code.",
    "It's typically used for pinMode() calls.",
    "It only executes one time.",
    "arduino-setup-loop")

add("Arduino Basics", "Easy", "MCQ",
    "Which function runs repeatedly, forever, after setup()?",
    ["setup()", "loop()", "repeat()", "run()"], "loop()",
    "The loop() function runs continuously after setup() finishes, executing the main program logic over and over as long as the Arduino has power.",
    "Think of what keeps a program 'alive'.",
    "It never stops running (unless reset).",
    "It comes right after setup() in every sketch.",
    "arduino-setup-loop")

add("Arduino Basics", "Easy", "CodeReading",
    "What does pinMode(13, OUTPUT); do?",
    ["Reads a value from pin 13", "Configures pin 13 to send signals out", "Deletes pin 13", "Sets pin 13 to always be HIGH"], "Configures pin 13 to send signals out",
    "pinMode() configures whether a pin behaves as an INPUT (reading signals) or OUTPUT (sending signals). Here, pin 13 is set as OUTPUT, often used to control the onboard LED.",
    "pinMode configures the direction of data flow.",
    "OUTPUT means the Arduino will send a signal.",
    "Pin 13 has a built-in LED on most Arduino boards.",
    "arduino-pinmode-demo")

add("Arduino Basics", "Medium", "CodeReading",
    "What does this code do?\n\ndigitalWrite(8, HIGH);\ndelay(1000);\ndigitalWrite(8, LOW);\ndelay(1000);",
    ["Keeps pin 8 constantly HIGH", "Blinks a component on pin 8 on/off every second", "Reads a sensor on pin 8", "Turns off the Arduino"], "Blinks a component on pin 8 on/off every second",
    "This is the classic 'blink' pattern: it sets pin 8 HIGH (on) for 1000ms (1 second), then LOW (off) for another second — when repeated in loop(), it creates a blinking effect.",
    "HIGH turns something on, LOW turns it off.",
    "delay(1000) pauses for 1000 milliseconds = 1 second.",
    "This pattern repeats inside loop().",
    "led-blink")

add("Arduino Basics", "Medium", "MCQ",
    "What is the Arduino IDE used for?",
    ["Designing PCB layouts", "Writing, compiling, and uploading code to the board", "3D printing enclosures", "Only viewing sensor data"], "Writing, compiling, and uploading code to the board",
    "The Arduino IDE (Integrated Development Environment) is software used to write sketches (programs), compile them into machine code, and upload them to the Arduino board via USB.",
    "IDE stands for Integrated Development Environment.",
    "It's where you write and upload 'sketches'.",
    "It connects to the board via USB.",
    "arduino-ide-demo")

add("Arduino Basics", "Hard", "CodeReading",
    "What is wrong with this code if the intent is to blink an LED on pin 9?\n\nvoid setup() {\n  digitalWrite(9, OUTPUT);\n}\nvoid loop() {\n  pinMode(9, HIGH);\n  delay(500);\n}",
    ["Nothing is wrong", "pinMode() and digitalWrite() are swapped/misused", "delay() should be removed", "Pin 9 doesn't exist"], "pinMode() and digitalWrite() are swapped/misused",
    "pinMode() should configure direction (INPUT/OUTPUT) and belongs in setup(), while digitalWrite() should set the pin's state (HIGH/LOW) and belongs in loop(). This code has them reversed and misused — a common beginner bug.",
    "Compare pin configuration functions vs pin control functions.",
    "pinMode() takes INPUT/OUTPUT; digitalWrite() takes HIGH/LOW.",
    "The two function calls need to be swapped.",
    "code-bug-highlight")

# ---------------------------------------------------------------
# DIGITAL INPUTS & OUTPUTS
# ---------------------------------------------------------------
add("Digital Inputs & Outputs", "Easy", "MCQ",
    "A digital signal can only have which two values?",
    ["0 and 100", "HIGH and LOW", "Red and Green", "Fast and Slow"], "HIGH and LOW",
    "Digital signals are binary — they can only be HIGH (usually 5V or 3.3V) or LOW (0V), unlike analog signals which can be any value in a range.",
    "Digital means only two states.",
    "In code, these are written as HIGH/LOW or 1/0.",
    "There's no 'in-between' value.",
    "digital-high-low")

add("Digital Inputs & Outputs", "Easy", "MCQ",
    "Which Arduino function reads a HIGH or LOW value from a pin?",
    ["analogRead()", "digitalRead()", "digitalWrite()", "pinMode()"], "digitalRead()",
    "digitalRead() checks whether a digital input pin is currently HIGH or LOW — commonly used to check button states or digital sensor outputs.",
    "The name of the function hints at what it reads.",
    "It returns only HIGH or LOW.",
    "Used often for buttons and switches.",
    "digital-read-demo")

add("Digital Inputs & Outputs", "Medium", "MCQ",
    "Why is a pull-down or pull-up resistor typically used with a push button?",
    ["To make the button brighter", "To prevent the input pin from 'floating' between HIGH and LOW", "To increase button speed", "To reduce voltage to zero"], "To prevent the input pin from 'floating' between HIGH and LOW",
    "Without a pull-up/pull-down resistor, an unconnected digital input pin can 'float' and randomly read HIGH or LOW due to electrical noise. The resistor ensures a defined default state when the button isn't pressed.",
    "Unconnected pins can pick up random noise.",
    "The resistor gives the pin a stable default state.",
    "Common values are around 10kΩ.",
    "button-press")

add("Digital Inputs & Outputs", "Medium", "CodeReading",
    "if (digitalRead(2) == HIGH) {\n  digitalWrite(13, HIGH);\n}\n\nWhat does this code do?",
    ["Turns on pin 13's output when pin 2 reads HIGH (e.g. button pressed)", "Turns off pin 13 always", "Reads pin 13 and writes to pin 2", "Sets pin 2 to HIGH"], "Turns on pin 13's output when pin 2 reads HIGH (e.g. button pressed)",
    "This code checks if pin 2 (likely a button input) is HIGH, and if so, turns pin 13 (likely an LED) HIGH — a simple event-driven digital input/output pattern.",
    "digitalRead(2) checks the button's current state.",
    "The if-statement only runs the code inside when true.",
    "Pin 13 is being controlled based on pin 2's state.",
    "button-press")

add("Digital Inputs & Outputs", "Easy", "TrueFalse",
    "True or False: A digital OUTPUT pin set to LOW means it outputs approximately 0V.",
    ["True", "False"], "True",
    "LOW represents the absence of voltage — approximately 0V — while HIGH represents the pin's supply voltage (typically 5V or 3.3V depending on the board).",
    "LOW is the 'off' state.",
    "Think of it as no voltage present.",
    "It's the opposite of HIGH.",
    "digital-high-low")

# ---------------------------------------------------------------
# ANALOG INPUTS
# ---------------------------------------------------------------
add("Analog Inputs", "Easy", "MCQ",
    "Unlike digital pins, analog input pins can read what kind of range of values?",
    ["Only HIGH or LOW", "A continuous range of values", "Only prime numbers", "Only negative values"], "A continuous range of values",
    "Analog inputs measure a continuous range of voltage (converted into a number, typically 0-1023 on most Arduinos) rather than just two states — ideal for sensors like potentiometers and light sensors.",
    "Analog is the opposite of binary/digital.",
    "Think of a dimmer switch rather than an on/off switch.",
    "Standard Arduino Uno reads values from 0 to 1023.",
    "analog-value-demo")

add("Analog Inputs", "Medium", "Calculation",
    "An Arduino's ADC (Analog-to-Digital Converter) is 10-bit, giving values 0-1023. If the analogRead() returns 512 with a 5V reference, what is the approximate voltage?",
    ["1V", "2.5V", "5V", "10V"], "2.5V",
    "Voltage = (ADC value / 1023) × Reference Voltage = (512/1023) × 5V ≈ 2.5V. Since 512 is roughly the midpoint of 0-1023, the voltage is roughly half of 5V.",
    "512 is close to the halfway point of the 0-1023 range.",
    "Half of the max range should give half the reference voltage.",
    "(512/1023) × 5 ≈ 2.5",
    "adc-conversion-demo",
    formula="V = (ADC/1023) × Vref = (512/1023) × 5 ≈ 2.5V")

add("Analog Inputs", "Medium", "MCQ",
    "What Arduino function is used to read from an analog pin like A0?",
    ["digitalRead(A0)", "analogRead(A0)", "readAnalog(A0)", "getValue(A0)"], "analogRead(A0)",
    "analogRead() reads the voltage on an analog pin (A0-A5 on Uno) and returns a value between 0 and 1023 representing that voltage.",
    "Match the function name to 'analog'.",
    "It's the counterpart to digitalRead().",
    "It returns a number, not just HIGH/LOW.",
    "analog-value-demo")

add("Analog Inputs", "Hard", "Calculation",
    "A potentiometer connected to A0 returns analogRead() = 768. What percentage of its full rotation range does this represent?",
    ["50%", "62.5%", "75%", "80%"], "75%",
    "Percentage = (768/1023) × 100 ≈ 75%. This shows how raw ADC values are converted into a more meaningful percentage for display or control purposes.",
    "Divide the reading by the maximum possible value (1023).",
    "768/1023 ≈ 0.75",
    "0.75 × 100 = 75%",
    "potentiometer-demo",
    formula="(768/1023) × 100 ≈ 75%")

# ---------------------------------------------------------------
# SERIAL COMMUNICATION
# ---------------------------------------------------------------
add("Serial Communication", "Easy", "MCQ",
    "Which function initializes serial communication at a set baud rate?",
    ["Serial.print()", "Serial.begin()", "Serial.read()", "Serial.start()"], "Serial.begin()",
    "Serial.begin(9600) (or another baud rate) initializes the serial port so the Arduino can send/receive data with the computer, usually placed in setup().",
    "This function is usually called once, in setup().",
    "It takes a baud rate as an argument, e.g. 9600.",
    "'Begin' suggests starting something.",
    "serial-monitor-scroll")

add("Serial Communication", "Easy", "CodeReading",
    "Serial.println(\"Hello Arduino!\");\n\nWhat will this do?",
    ["Print 'Hello Arduino!' followed by a new line to the Serial Monitor", "Delete the Serial Monitor content", "Read a message from the Serial Monitor", "Turn on an LED"], "Print 'Hello Arduino!' followed by a new line to the Serial Monitor",
    "Serial.println() sends text to the Serial Monitor and automatically adds a new line afterward, making each message appear on its own line — useful for debugging sensor values.",
    "'print' + 'ln' (line) suggests printing with a line break.",
    "It's commonly used for debugging output.",
    "You view the result in the Serial Monitor window.",
    "serial-monitor-scroll")

add("Serial Communication", "Medium", "MCQ",
    "Why is 'baud rate' important in serial communication?",
    ["It sets the color of text in the monitor", "It defines the speed of data transmission, and both devices must match", "It controls LED brightness", "It has no real function"], "It defines the speed of data transmission, and both devices must match",
    "Baud rate is the speed (bits per second) at which data is sent. Both the Arduino and the receiving device (like your computer's Serial Monitor) must be set to the same baud rate, or the data will appear as garbled characters.",
    "Both sender and receiver must agree on a speed.",
    "Common values are 9600 or 115200.",
    "Mismatched rates cause garbled text.",
    "serial-baud-mismatch")

# ---------------------------------------------------------------
# DHT SENSORS
# ---------------------------------------------------------------
add("DHT Sensors", "Easy", "MCQ",
    "What two environmental values does a DHT11/DHT22 sensor typically measure?",
    ["Light and sound", "Temperature and humidity", "Distance and speed", "Pressure and altitude"], "Temperature and humidity",
    "DHT sensors (DHT11 and DHT22) are digital sensors that measure both ambient temperature and relative humidity, commonly used in weather stations and environmental monitoring projects.",
    "DHT stands for Digital Humidity and Temperature.",
    "Think weather station readings.",
    "Two values come from a single sensor module.",
    "dht-sensor-readout")

add("DHT Sensors", "Medium", "MCQ",
    "Compared to the DHT11, the DHT22 sensor generally offers what advantage?",
    ["Lower cost only", "Higher accuracy and wider measurement range", "It measures sound instead", "It cannot measure humidity"], "Higher accuracy and wider measurement range",
    "The DHT22 is a more precise and capable version of the DHT11, offering better accuracy, a wider temperature/humidity range, and faster sampling, though at a higher price.",
    "Think 'upgraded version'.",
    "DHT22 has a wider range of measurable values.",
    "The DHT11 is the cheaper, less precise sibling.",
    "dht-sensor-readout")

add("DHT Sensors", "Medium", "CodeReading",
    "float temp = dht.readTemperature();\nfloat hum = dht.readHumidity();\n\nWhat do these two lines do?",
    ["Set the temperature and humidity manually", "Read the current temperature and humidity from the DHT sensor into variables", "Turn on a heater", "Print sensor data directly to an LED"], "Read the current temperature and humidity from the DHT sensor into variables",
    "These lines call the DHT library's built-in functions to fetch the latest temperature and humidity readings from the sensor and store them in the variables temp and hum for further use.",
    "readTemperature() and readHumidity() are library functions.",
    "The values are stored into variables for later use (like printing or logic).",
    "'float' means these can store decimal numbers.",
    "dht-sensor-readout")

# ---------------------------------------------------------------
# ENVIRONMENTAL MONITORING
# ---------------------------------------------------------------
add("Environmental Monitoring", "Easy", "MCQ",
    "In an environmental monitoring project, what is the purpose of logging sensor data over time?",
    ["To make the Arduino run faster", "To track trends and detect changes in conditions", "To reduce power consumption", "To disable sensors when not needed"], "To track trends and detect changes in conditions",
    "Logging data over time (temperature, humidity, air quality, etc.) lets you analyze trends, detect anomalies, and make informed decisions — such as watering plants or triggering alerts.",
    "Think about tracking weather patterns.",
    "A single reading doesn't show change over time.",
    "This helps with graphs and long-term analysis.",
    "environmental-dashboard")

add("Environmental Monitoring", "Medium", "MCQ",
    "Which combination of sensors would best build a basic 'smart greenhouse' monitor?",
    ["Only a buzzer", "DHT sensor for temp/humidity + soil moisture sensor + light sensor", "Only a servo motor", "Only an LED"], "DHT sensor for temp/humidity + soil moisture sensor + light sensor",
    "A smart greenhouse benefits from monitoring multiple environmental factors together — temperature, humidity, soil moisture, and light — to give a complete picture of plant growing conditions.",
    "Think about everything a plant needs to grow.",
    "Multiple sensors give a fuller picture than just one.",
    "Combine DHT + moisture + light sensors.",
    "environmental-dashboard")

# ---------------------------------------------------------------
# DC MOTORS
# ---------------------------------------------------------------
add("DC Motors", "Easy", "MCQ",
    "What happens to a simple DC motor's direction if you reverse the polarity of its power connections?",
    ["It spins faster", "It reverses direction", "It stops permanently", "Nothing changes"], "It reverses direction",
    "DC motors spin based on the direction of current flow through their coils. Reversing the + and - connections reverses the magnetic interaction, causing the motor to spin the opposite way.",
    "Think of swapping the battery terminals.",
    "Current direction determines spin direction.",
    "This is how motor drivers make robots go backward.",
    "motor-spin")

add("DC Motors", "Medium", "MCQ",
    "Why can't a DC motor typically be powered directly from an Arduino digital pin?",
    ["Motors don't need power", "Arduino pins can't supply enough current for most motors", "Motors only work with AC", "Arduino pins are digital only"], "Arduino pins can't supply enough current for most motors",
    "Arduino I/O pins can typically supply only about 20-40mA safely, while most DC motors need much more current to spin — this is why motor drivers or transistors are used as an intermediary.",
    "Compare a pin's rated current (~20-40mA) to a motor's needs.",
    "Motors often need hundreds of milliamps or more.",
    "This is why we use motor driver ICs like the L298N.",
    "motor-driver-demo")

add("DC Motors", "Medium", "Calculation",
    "A DC motor is controlled by PWM at 50% duty cycle. If its max speed is 200 RPM, what is its approximate speed?",
    ["50 RPM", "100 RPM", "150 RPM", "200 RPM"], "100 RPM",
    "At 50% duty cycle, the motor receives power roughly half the time, resulting in approximately half its maximum speed: 200 RPM × 0.5 = 100 RPM (a simplified linear approximation used at beginner level).",
    "Duty cycle percentage roughly scales the motor's effective speed.",
    "50% of the maximum speed.",
    "200 × 0.5 = 100",
    "motor-spin",
    formula="Speed ≈ MaxSpeed × DutyCycle = 200 × 0.5 = 100 RPM")

add("DC Motors", "Hard", "MCQ",
    "What role does a flyback diode play when controlling a DC motor with a transistor?",
    ["It increases motor speed", "It protects the transistor from voltage spikes when the motor turns off", "It measures motor current", "It reverses motor direction"], "It protects the transistor from voltage spikes when the motor turns off",
    "When a motor (an inductive load) is suddenly switched off, it generates a voltage spike (back-EMF) that can damage the transistor. A flyback diode provides a safe path for this energy to dissipate, protecting the circuit.",
    "Motors are 'inductive loads' that resist sudden current changes.",
    "Turning off an inductor releases a stored energy spike.",
    "The diode gives that spike somewhere safe to go.",
    "flyback-diode-demo")

# ---------------------------------------------------------------
# SERVO MOTORS
# ---------------------------------------------------------------
add("Servo Motors", "Easy", "MCQ",
    "Unlike a DC motor, a standard hobby servo motor typically:",
    ["Spins continuously in one direction forever", "Rotates to a specific angle (usually 0-180°) and holds it", "Only works with AC power", "Cannot be controlled by Arduino"], "Rotates to a specific angle (usually 0-180°) and holds it",
    "A standard servo motor moves to and holds a specific angular position (commonly 0-180°) based on the control signal it receives, unlike a DC motor which just spins continuously.",
    "Think about precise positioning, like a robot arm joint.",
    "It has a limited rotation range, not continuous spinning.",
    "Controlled using the Servo library's write() function.",
    "servo-rotate")

add("Servo Motors", "Medium", "MCQ",
    "What type of signal does a servo motor use to determine its target angle?",
    ["A simple HIGH/LOW digital signal", "A Pulse Width Modulation (PWM) control signal", "An analog voltage only", "A serial data packet"], "A Pulse Width Modulation (PWM) control signal",
    "Servos read the width (duration) of pulses sent to their control wire, typically every 20ms, to determine the target angle — this is a specific application of PWM.",
    "The signal has pulses of different lengths.",
    "It's a specialized form of PWM.",
    "Pulse width (not amplitude) tells the servo where to go.",
    "servo-rotate")

add("Servo Motors", "Medium", "CodeReading",
    "myServo.write(90);\n\nWhat does this line do?",
    ["Sets the servo motor to its 90° (usually middle) position", "Spins the servo continuously", "Turns the servo off", "Sets servo speed to 90%"], "Sets the servo motor to its 90° (usually middle) position",
    "The write() function of the Servo library moves the servo shaft to the specified angle in degrees — here, 90° which for most servos is the center/neutral position.",
    "The number represents an angle.",
    "90° is typically the middle of the 0-180° range.",
    "This uses the Arduino Servo library.",
    "servo-rotate")

add("Servo Motors", "Hard", "Calculation",
    "A servo's control pulse is 1.5ms wide within a 20ms period. Approximately what angle does this correspond to on a standard 0-180° servo?",
    ["0°", "90° (center)", "180°", "270°"], "90° (center)",
    "For a standard hobby servo, a 1.5ms pulse typically corresponds to the center (90°) position, while 1ms corresponds to 0° and 2ms corresponds to 180°. This linear pulse-to-angle mapping is fundamental to servo control.",
    "Standard servo range: 1ms = 0°, 2ms = 180°.",
    "1.5ms sits right in the middle of that range.",
    "Middle of 1ms-2ms range = 90°.",
    "servo-pulse-diagram",
    formula="1ms→0°, 1.5ms→90°, 2ms→180°")

# ---------------------------------------------------------------
# MOTOR DRIVERS
# ---------------------------------------------------------------
add("Motor Drivers", "Easy", "MCQ",
    "What is the main purpose of a motor driver IC like the L298N?",
    ["To measure temperature", "To allow low-power Arduino signals to control higher-power motors safely", "To connect to WiFi", "To display text"], "To allow low-power Arduino signals to control higher-power motors safely",
    "Motor driver ICs act as an interface between the low-current Arduino pins and the higher current/voltage needs of motors, using internal transistors (often an H-Bridge) to safely control speed and direction.",
    "Arduino pins alone can't power most motors directly.",
    "The driver acts as a 'middleman' amplifying control signals.",
    "L298N is a very common example used in robotics kits.",
    "motor-driver-demo")

add("Motor Drivers", "Medium", "MCQ",
    "What does an 'H-Bridge' circuit inside a motor driver allow you to do?",
    ["Only turn the motor on/off", "Control both the speed and the direction (forward/reverse) of a DC motor", "Only measure motor current", "Convert AC to DC"], "Control both the speed and the direction (forward/reverse) of a DC motor",
    "An H-Bridge uses four switches (transistors) arranged in an 'H' shape to reverse the current direction through a motor, enabling both forward and reverse rotation, plus PWM speed control.",
    "The circuit's shape resembles the letter it's named after.",
    "It can reverse current direction through the motor.",
    "This is how robots move backward and forward.",
    "h-bridge-diagram")

add("Motor Drivers", "Medium", "MCQ",
    "In a typical two-motor robot car using an L298N driver, how many DC motors can it usually control independently?",
    ["1", "2", "4", "8"], "2",
    "The common L298N dual H-bridge module can independently control two DC motors' speed and direction — perfect for a two-wheel-drive robot chassis.",
    "The 'dual' in 'dual H-bridge' is a hint.",
    "Think of a typical 2-wheel-drive robot car.",
    "Each H-bridge channel drives one motor.",
    "robot-move")

# ---------------------------------------------------------------
# PWM (calculation heavy)
# ---------------------------------------------------------------
add("PWM", "Easy", "MCQ",
    "What does PWM stand for?",
    ["Power Wave Modulation", "Pulse Width Modulation", "Positive Wire Method", "Program Write Mode"], "Pulse Width Modulation",
    "PWM (Pulse Width Modulation) rapidly switches a digital pin on and off, varying the proportion of 'on' time to simulate an analog output — used for LED dimming and motor speed control.",
    "The name describes what's being changed: the width of pulses.",
    "It simulates analog behavior using digital signals.",
    "Commonly used with analogWrite().",
    "pwm-brightness")

add("PWM", "Easy", "Calculation",
    "What is the duty cycle percentage for a PWM value of 128 (out of 255)?",
    ["25%", "50%", "75%", "100%"], "50%",
    "Duty Cycle % = (PWM value / 255) × 100 = (128/255) × 100 ≈ 50%. A value of 128 is roughly half of the max 255, giving roughly half-power output.",
    "128 is very close to half of 255.",
    "(128/255) × 100 ≈ ?",
    "≈ 50%",
    "pwm-brightness",
    formula="(128/255) × 100 ≈ 50%")

add("PWM", "Medium", "Calculation",
    "What is the duty cycle percentage for a PWM value of 64 (out of 255)?",
    ["10%", "25%", "50%", "64%"], "25%",
    "Duty Cycle % = (64/255) × 100 ≈ 25%. This means the signal is 'on' about a quarter of the time, resulting in dimmer LED brightness or slower motor speed.",
    "64 is about a quarter of 255.",
    "(64/255) × 100 ≈ ?",
    "≈ 25%",
    "pwm-brightness",
    formula="(64/255) × 100 ≈ 25%")

add("PWM", "Medium", "Calculation",
    "A PWM value of 255 is used for an LED. What is the resulting duty cycle and brightness?",
    ["0% duty cycle, LED off", "50% duty cycle, half brightness", "100% duty cycle, full brightness", "It's undefined"], "100% duty cycle, full brightness",
    "255 is the maximum PWM value on most Arduino boards (8-bit resolution: 0-255), representing a 100% duty cycle where the pin is continuously HIGH — full brightness for an LED.",
    "255 is the maximum value in 8-bit PWM (0-255).",
    "Max value means always 'on'.",
    "(255/255) × 100 = 100%",
    "pwm-brightness",
    formula="(255/255) × 100 = 100%")

add("PWM", "Hard", "CodeReading",
    "analogWrite(9, 200);\n\nAssuming pin 9 controls an LED, roughly how bright will it be compared to maximum?",
    ["About 20% brightness", "About 50% brightness", "About 78% brightness", "About 100% brightness"], "About 78% brightness",
    "Brightness % ≈ (200/255) × 100 ≈ 78%. analogWrite() sets the duty cycle out of 255 max, so 200 gives a fairly bright but not maximum output.",
    "Divide 200 by the max value 255.",
    "200/255 ≈ 0.78",
    "0.78 × 100 ≈ 78%",
    "pwm-brightness",
    formula="(200/255) × 100 ≈ 78%")

# ---------------------------------------------------------------
# PIEZO BUZZERS
# ---------------------------------------------------------------
add("Piezo Buzzers", "Easy", "MCQ",
    "How does a piezo buzzer typically produce sound?",
    ["By spinning a small motor", "By vibrating a piezoelectric material at a set frequency", "By heating a wire", "By flashing light rapidly"], "By vibrating a piezoelectric material at a set frequency",
    "Piezo buzzers use a piezoelectric ceramic disc that vibrates rapidly when voltage is applied, and the frequency of vibration determines the pitch of the sound produced.",
    "The name 'piezo' relates to a special material property.",
    "It vibrates rather than spins or heats up.",
    "Vibration frequency = pitch of the sound.",
    "buzzer-sound-wave")

add("Piezo Buzzers", "Medium", "MCQ",
    "Which Arduino function is most commonly used to play a specific musical tone on a piezo buzzer?",
    ["digitalWrite()", "tone()", "analogRead()", "Serial.print()"], "tone()",
    "The tone() function generates a square wave of a specified frequency on a pin, which is exactly what's needed to make a piezo buzzer produce a specific musical note.",
    "This built-in function name is very literal.",
    "It takes a pin and a frequency (Hz) as arguments.",
    "There's also a matching noTone() to stop it.",
    "buzzer-sound-wave")

# ---------------------------------------------------------------
# LCD DISPLAYS
# ---------------------------------------------------------------
add("LCD Displays", "Easy", "MCQ",
    "What does a 16x2 LCD display refer to?",
    ["16 pins and 2 wires", "16 characters per row across 2 rows", "16 colors and 2 brightness levels", "16 volts and 2 amps"], "16 characters per row across 2 rows",
    "A '16x2' LCD (Liquid Crystal Display) has 2 rows, each capable of displaying up to 16 characters — a very common display size in beginner Arduino projects.",
    "Think of it as a small text grid.",
    "The first number is characters per line.",
    "The second number is the number of lines.",
    "lcd-text-display")

add("LCD Displays", "Medium", "CodeReading",
    "lcd.setCursor(0, 1);\nlcd.print(\"Hello!\");\n\nWhat does this do?",
    ["Prints 'Hello!' starting at column 0, row 1 (the second row)", "Clears the entire display", "Prints 'Hello!' on row 0 only", "Turns off the LCD backlight"], "Prints 'Hello!' starting at column 0, row 1 (the second row)",
    "setCursor(column, row) positions where text will appear next. Since rows are zero-indexed, row 1 is the second line of the display, and column 0 is the leftmost position.",
    "setCursor takes (column, row) as arguments.",
    "Rows are counted starting from 0.",
    "Row 1 means the second line, not the first.",
    "lcd-text-display")

add("LCD Displays", "Medium", "MCQ",
    "What is the purpose of the I2C module often attached to LCD displays in Arduino projects?",
    ["To increase display brightness only", "To reduce the number of wires needed to connect the LCD", "To make the display wireless", "To add color to the display"], "To reduce the number of wires needed to connect the LCD",
    "A standard LCD needs many wires (often 6+ data/control pins), but an I2C backpack module converts this to just 2 data wires (SDA/SCL) plus power, greatly simplifying wiring.",
    "Standard LCDs need many connection wires.",
    "I2C is known for simplifying communication.",
    "It typically reduces wiring down to just 2 signal wires.",
    "i2c-lcd-wiring")

# ---------------------------------------------------------------
# ULTRASONIC SENSORS (calculation heavy)
# ---------------------------------------------------------------
add("Ultrasonic Sensors", "Easy", "MCQ",
    "How does an ultrasonic sensor (like the HC-SR04) measure distance?",
    ["By measuring light reflection", "By sending a sound pulse and timing how long it takes to bounce back", "By measuring temperature changes", "By counting rotations"], "By sending a sound pulse and timing how long it takes to bounce back",
    "Ultrasonic sensors emit a high-frequency sound pulse (inaudible to humans) and measure the time it takes for the echo to return after bouncing off an object, then calculate distance using the speed of sound.",
    "Think of how bats navigate using sound (echolocation).",
    "It measures a time delay, not light.",
    "The formula involves the speed of sound.",
    "ultrasonic-wave")

add("Ultrasonic Sensors", "Medium", "Calculation",
    "An ultrasonic sensor measures an echo time of 580 microseconds (µs). Using the approximation Distance(cm) = time(µs) / 58, what is the distance?",
    ["5cm", "10cm", "58cm", "100cm"], "10cm",
    "Distance = time / 58 = 580 / 58 = 10cm. This formula accounts for the round trip of the sound wave (there and back), using the speed of sound in air.",
    "Use the formula: Distance = time ÷ 58.",
    "580 divided by 58.",
    "580 ÷ 58 = 10",
    "ultrasonic-wave",
    formula="Distance = time / 58 = 580 / 58 = 10cm")

add("Ultrasonic Sensors", "Medium", "Calculation",
    "An HC-SR04 sensor measures an echo time of 1160 microseconds. What is the approximate distance to the object?",
    ["10cm", "20cm", "40cm", "58cm"], "20cm",
    "Distance = time / 58 = 1160 / 58 = 20cm. As the echo time doubles from the previous example (580µs → 1160µs), the calculated distance also doubles (10cm → 20cm).",
    "Use the same formula: Distance = time ÷ 58.",
    "1160 divided by 58.",
    "1160 ÷ 58 = 20",
    "ultrasonic-wave",
    formula="Distance = time / 58 = 1160 / 58 = 20cm")

add("Ultrasonic Sensors", "Hard", "Calculation",
    "Sound travels at approximately 343 m/s in air. If an ultrasonic pulse takes 2ms (0.002s) to travel to an object and back, how far away is the object?",
    ["34.3cm", "68.6cm", "17.15cm", "343cm"], "34.3cm",
    "Total distance traveled by sound = speed × time = 343 m/s × 0.002s = 0.686m = 68.6cm round trip. Since this is there-AND-back, divide by 2: 68.6cm / 2 = 34.3cm to the object.",
    "Remember the sound travels to the object AND back.",
    "Total path = speed × time, then divide by 2.",
    "343 × 0.002 = 0.686m round trip, ÷2 = 0.343m",
    "ultrasonic-wave",
    formula="d = (speed × time) / 2 = (343 × 0.002)/2 = 0.343m = 34.3cm")

# ---------------------------------------------------------------
# IR SENSORS
# ---------------------------------------------------------------
add("IR Sensors", "Easy", "MCQ",
    "What type of light does an IR (infrared) sensor typically use, which is invisible to the human eye?",
    ["Ultraviolet light", "Infrared light", "Visible white light", "Laser light only"], "Infrared light",
    "IR sensors emit and/or detect infrared light, a wavelength just beyond the visible spectrum that humans cannot see but many sensors and remote controls use for communication.",
    "The name of the sensor gives away the light type.",
    "It's just beyond the red end of the visible spectrum.",
    "TV remote controls commonly use this light type.",
    "ir-remote-signal")

add("IR Sensors", "Medium", "MCQ",
    "In a line-following robot, how are IR sensors typically used?",
    ["To measure temperature of the line", "To detect the contrast between a dark line and a light surface (or vice versa)", "To play music", "To measure distance only"], "To detect the contrast between a dark line and a light surface (or vice versa)",
    "IR sensors detect differences in reflected infrared light — dark surfaces absorb more IR light while light surfaces reflect more, letting the robot 'see' and follow a line on the floor.",
    "Think about how much light different colors reflect.",
    "Dark colors absorb more light; light colors reflect more.",
    "This reflection difference tells the robot where the line is.",
    "ir-line-follow")

add("IR Sensors", "Medium", "MCQ",
    "What is a common application of an IR receiver module paired with an IR remote control?",
    ["Measuring humidity", "Wirelessly controlling an Arduino project (e.g. changing modes, adjusting settings)", "Detecting sound levels", "Measuring voltage"], "Wirelessly controlling an Arduino project (e.g. changing modes, adjusting settings)",
    "An IR receiver can decode signals sent by a standard remote control, letting users wirelessly send commands to an Arduino — a popular, low-cost way to add remote control to a project.",
    "Think about how a TV remote works with a TV.",
    "The receiver decodes a pattern of infrared pulses.",
    "Great for wireless project control without WiFi/Bluetooth.",
    "ir-remote-signal")

# ---------------------------------------------------------------
# ROBOTICS
# ---------------------------------------------------------------
add("Robotics", "Easy", "MCQ",
    "In basic robotics, what are the three fundamental building blocks of any robot?",
    ["Sensors, Processor (brain), Actuators", "Wheels, Paint, Screws", "Battery, Wires, Stickers", "Camera, Speaker, Microphone only"], "Sensors, Processor (brain), Actuators",
    "Every robot fundamentally needs sensors (to perceive the environment), a processor/brain (like Arduino, to make decisions), and actuators (motors, servos, etc. to act on the world).",
    "Think: sense, think, act.",
    "One part perceives, one part decides, one part moves.",
    "Arduino usually plays the 'brain' role.",
    "robot-move")

add("Robotics", "Medium", "MCQ",
    "What does 'autonomous' mean in the context of a robot?",
    ["Remote-controlled by a human at all times", "Able to make decisions and act without constant human control", "Powered only by solar energy", "Unable to move"], "Able to make decisions and act without constant human control",
    "An autonomous robot uses its own sensors and programming to make decisions and navigate its environment independently, without requiring continuous human input — like an obstacle-avoiding robot car.",
    "The word shares a root with 'automatic'.",
    "Think of self-driving cars as an example.",
    "It doesn't need a human joystick operator.",
    "robot-move")

add("Robotics", "Medium", "MCQ",
    "Why is feedback (e.g. from sensors) important in a robotic system?",
    ["It's not important", "It lets the robot adjust its actions based on real-world conditions", "It only makes the robot louder", "It replaces the need for a processor"], "It lets the robot adjust its actions based on real-world conditions",
    "Feedback lets a robot compare its actual state (from sensors) to its desired state, and adjust its behavior accordingly — essential for tasks like maintaining a straight path or avoiding obstacles.",
    "Think about how you adjust your walking when you feel an obstacle.",
    "Feedback creates a 'loop' of sense-decide-act-sense again.",
    "Without it, the robot would act 'blindly'.",
    "robot-feedback-loop")

# ---------------------------------------------------------------
# ROBOT NAVIGATION
# ---------------------------------------------------------------
add("Robot Navigation", "Easy", "MCQ",
    "What does 'dead reckoning' navigation rely on for a robot?",
    ["GPS satellites only", "Estimating position based on known speed, direction, and time traveled", "Random movement", "Human remote control"], "Estimating position based on known speed, direction, and time traveled",
    "Dead reckoning estimates a robot's current position by using its previous known position plus its speed, heading, and elapsed time — without needing external references like GPS, though errors accumulate over time.",
    "Think about estimating distance from speed × time.",
    "It doesn't require external signals like GPS.",
    "Small errors can add up ('drift') over long distances.",
    "robot-move")

add("Robot Navigation", "Medium", "MCQ",
    "How can a robot use two wheel encoders to help navigate more precisely?",
    ["They measure temperature of each wheel", "They count wheel rotations to estimate distance traveled and turning", "They measure battery voltage", "They control the robot's color"], "They count wheel rotations to estimate distance traveled and turning",
    "Wheel encoders count rotations (or partial rotations) of each wheel, allowing the robot to estimate how far it has traveled and, by comparing the two wheels, how much it has turned.",
    "Encoders 'count' something related to wheel movement.",
    "Comparing left vs right wheel rotation reveals turning.",
    "This data feeds into dead reckoning calculations.",
    "wheel-encoder-demo")

add("Robot Navigation", "Medium", "Calculation",
    "A robot's wheel has a diameter of 6.4cm. If the wheel completes 5 full rotations, approximately how far has the robot traveled? (circumference = π × diameter, use π≈3.14)",
    ["10cm", "32cm", "64cm", "100.5cm"], "100.5cm",
    "Circumference = π × diameter = 3.14 × 6.4 ≈ 20.1cm per rotation. Over 5 rotations: 20.1 × 5 ≈ 100.5cm. This is basic forward kinematics for wheeled robots.",
    "First find the circumference of one wheel rotation.",
    "Circumference ≈ 3.14 × 6.4 ≈ 20.1cm",
    "Multiply circumference by number of rotations (5).",
    "wheel-rotation-diagram",
    formula="Distance = π × diameter × rotations = 3.14 × 6.4 × 5 ≈ 100.5cm")

# ---------------------------------------------------------------
# OBSTACLE AVOIDANCE
# ---------------------------------------------------------------
add("Obstacle Avoidance", "Easy", "MCQ",
    "In a basic obstacle-avoidance robot, which sensor is most commonly used to detect obstacles ahead?",
    ["DHT temperature sensor", "Ultrasonic distance sensor", "Piezo buzzer", "LCD display"], "Ultrasonic distance sensor",
    "Ultrasonic sensors (like the HC-SR04) are ideal for obstacle avoidance because they measure distance to objects in front of the robot in real time, letting it stop or turn before colliding.",
    "This sensor uses sound waves to measure distance.",
    "It's the same sensor used for the 'echo time' calculations.",
    "It gives a live distance reading to obstacles.",
    "obstacle-avoid")

add("Obstacle Avoidance", "Medium", "MCQ",
    "What is a typical robot behavior when its ultrasonic sensor detects an obstacle closer than a set threshold (e.g. 15cm)?",
    ["Continue moving forward at full speed", "Stop, then turn to find a clear path", "Immediately turn off completely", "Increase speed to push through"], "Stop, then turn to find a clear path",
    "A common obstacle-avoidance algorithm stops the robot when an obstacle is detected within a threshold distance, then turns (often checking left/right) to find a clear direction before continuing.",
    "Think of what you'd do if you saw a wall ahead while walking.",
    "The robot needs to change its plan, not crash.",
    "Common sequence: stop → check directions → turn → continue.",
    "obstacle-avoid")

add("Obstacle Avoidance", "Medium", "CodeReading",
    "if (distance < 15) {\n  stopMotors();\n  turnRight();\n} else {\n  moveForward();\n}\n\nWhat behavior does this code create?",
    ["The robot always moves forward regardless of obstacles", "The robot stops and turns right when an obstacle is within 15cm, otherwise moves forward", "The robot only turns left", "The robot measures temperature"], "The robot stops and turns right when an obstacle is within 15cm, otherwise moves forward",
    "This is a basic obstacle-avoidance conditional: if the measured distance is less than 15cm (too close), the robot stops and turns right; otherwise, it's safe to continue moving forward.",
    "The if-condition checks a distance threshold.",
    "'distance < 15' means an obstacle is close.",
    "The else branch handles the 'all clear' case.",
    "obstacle-avoid")

# ---------------------------------------------------------------
# FORWARD KINEMATICS
# ---------------------------------------------------------------
add("Forward Kinematics", "Medium", "MCQ",
    "What does 'forward kinematics' calculate for a robotic arm?",
    ["The required joint angles to reach a target position", "The position of the arm's end (end-effector) given known joint angles", "The robot's battery life", "The color of the robot"], "The position of the arm's end (end-effector) given known joint angles",
    "Forward kinematics answers: 'Given these joint angles, where does the end-effector (like a gripper) end up?' It works forward from known angles to an unknown final position — the reverse of inverse kinematics.",
    "The word 'forward' suggests working from cause to effect.",
    "Input: joint angles. Output: final position.",
    "This is the opposite of inverse kinematics.",
    "robot-arm-forward-kinematics")

add("Forward Kinematics", "Hard", "Calculation",
    "A simple 2-segment robot arm has segment lengths of 10cm each. If both joints are set to point straight (0° bend), what is the total reach (end-effector distance from the base)?",
    ["5cm", "10cm", "20cm", "100cm"], "20cm",
    "When both arm segments are fully extended in a straight line, the total reach is simply the sum of the segment lengths: 10cm + 10cm = 20cm. This is the simplest forward kinematics case.",
    "Think about what happens when the arm is fully straight.",
    "No bending means the lengths simply add together.",
    "10 + 10 = 20",
    "robot-arm-forward-kinematics",
    formula="Reach = L1 + L2 = 10 + 10 = 20cm (fully extended)")

# ---------------------------------------------------------------
# INVERSE KINEMATICS
# ---------------------------------------------------------------
add("Inverse Kinematics", "Medium", "MCQ",
    "What does 'inverse kinematics' calculate for a robotic arm?",
    ["The required joint angles needed to reach a desired end-effector position", "The final position from known angles", "The robot's power consumption", "The material the arm is made of"], "The required joint angles needed to reach a desired end-effector position",
    "Inverse kinematics works backward from a desired target position to figure out what joint angles are needed to get there — essential for tasks like 'move the gripper to this exact point.'",
    "The word 'inverse' suggests the reverse of forward kinematics.",
    "Input: target position. Output: required joint angles.",
    "This is harder to calculate and can have multiple solutions.",
    "robot-arm-inverse-kinematics")

add("Inverse Kinematics", "Hard", "MCQ",
    "Why can inverse kinematics problems sometimes have multiple valid solutions?",
    ["Because robots are unpredictable", "Because the same end position can often be reached with different joint angle combinations (e.g. 'elbow up' vs 'elbow down')", "Because sensors are inaccurate", "Because it never has any solution"], "Because the same end position can often be reached with different joint angle combinations (e.g. 'elbow up' vs 'elbow down')",
    "Just like your own arm can reach the same point with your elbow bent up or down in some cases, robotic arms with multiple joints often have several valid joint-angle combinations that all place the end-effector at the same target point.",
    "Think about how your own elbow can bend different ways to touch the same spot.",
    "More joints generally mean more possible configurations.",
    "This is often called 'elbow up' vs 'elbow down' solutions.",
    "robot-arm-inverse-kinematics")

# ---------------------------------------------------------------
# ROBOTIC ARM CONTROL
# ---------------------------------------------------------------
add("Robotic Arm Control", "Medium", "MCQ",
    "What is typically used to control each joint of a simple beginner-level robotic arm?",
    ["DHT sensors", "Servo motors", "Piezo buzzers", "Ultrasonic sensors"], "Servo motors",
    "Servo motors are ideal for robotic arm joints because they can be commanded to precise angles (0-180°) and hold that position, making them perfect for controlling elbow, shoulder, and wrist joints.",
    "Think about which motor type holds a precise angle.",
    "It's the same component used for precise positioning elsewhere.",
    "Each joint typically gets its own one of these.",
    "robot-arm-forward-kinematics")

add("Robotic Arm Control", "Hard", "CodeReading",
    "baseServo.write(45);\nelbowServo.write(90);\ngripperServo.write(0);\n\nWhat is this code sequence likely doing?",
    ["Reading sensor values from three sensors", "Positioning a 3-joint robotic arm: base rotation, elbow bend, and gripper state", "Playing three musical tones", "Measuring three distances"], "Positioning a 3-joint robotic arm: base rotation, elbow bend, and gripper state",
    "This code commands three separate servos — likely controlling the arm's base rotation (45°), elbow joint (90°), and gripper (0°, perhaps 'closed' or 'open') — a typical multi-joint arm control sequence.",
    "Each variable name hints at which joint it controls.",
    "Multiple servo.write() calls together position a whole arm.",
    "The gripper servo often controls an open/close claw.",
    "robot-arm-forward-kinematics")

# ---------------------------------------------------------------
# Save
# ---------------------------------------------------------------
with open("data/l2/questions.json", "w", encoding="utf-8") as f:
    json.dump(Q, f, indent=2, ensure_ascii=False)

print(f"Wrote {len(Q)} questions to data/l2/questions.json")

# quick topic/difficulty breakdown
from collections import Counter
topics = Counter(q["topic"] for q in Q)
diffs = Counter(q["difficulty"] for q in Q)
print("Topics:", dict(topics))
print("Difficulty:", dict(diffs))
