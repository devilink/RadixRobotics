// Hands-on projects shown on the student profile (/profile), one set per level.
// Primary and intermediate projects live here; advanced ones are the capstone
// builds in app/projects/builds.ts, which already have full guides.
// Blueprint drawings use the same 800 × 460 space as BlueprintDiagram (nodes 170 × 64).

import { builds, type CapstoneBuild } from '@/app/projects/builds';

export type ProjectLevel = 'primary' | 'intermediate' | 'advanced';

export const LEVEL_INFO: Record<ProjectLevel, { label: string; classes: string; accent: string }> = {
  primary: { label: 'Explorer', classes: 'Class 1–5', accent: '#fb923c' },
  intermediate: { label: 'Builder', classes: 'Class 6–9', accent: '#38bdf8' },
  advanced: { label: 'Engineer', classes: 'Class 10+', accent: '#a78bfa' },
};

export interface ProjectStep {
  title: string;
  body: string;
  code?: string;
  check?: string;
}

export interface StudentProject {
  id: string;
  slug: string;
  title: string;
  level: ProjectLevel;
  grades: [number, number];
  duration: string;
  mission: string;
  summary: string;
  skills: string[];
  blueprint: CapstoneBuild['blueprint'];
  steps: ProjectStep[];
  /** Advanced builds link to their full guide page. */
  fullGuideHref?: string;
}

const starterProjects: StudentProject[] = [
  /* ---------------------------------------------------------------- Primary */
  {
    id: 'traffic-light',
    slug: 'traffic-light',
    title: 'Traffic Light Controller',
    level: 'primary',
    grades: [3, 5],
    duration: '2 sessions',
    mission: 'Keep the toy-car crossing safe!',
    summary: 'Wire three LEDs to an Arduino and program the green → yellow → red sequence that real junctions use.',
    skills: ['LEDs & resistors', 'digitalWrite', 'Timing with delay()'],
    blueprint: {
      drawingNo: 'RDX-TL-01',
      nodes: [
        { id: 'usb', label: 'USB Cable', sub: 'laptop · 5 V', x: 30, y: 200 },
        { id: 'uno', label: 'Arduino Uno', sub: 'the brain', x: 300, y: 200, w: 190, accent: true },
        { id: 'red', label: 'Red LED', sub: '+ 220 Ω', x: 600, y: 60 },
        { id: 'yellow', label: 'Yellow LED', sub: '+ 220 Ω', x: 600, y: 200 },
        { id: 'green', label: 'Green LED', sub: '+ 220 Ω', x: 600, y: 340 },
      ],
      edges: [
        { from: 'usb', to: 'uno', label: '5 V + code', power: true },
        { from: 'uno', to: 'red', label: 'D13' },
        { from: 'uno', to: 'yellow', label: 'D12' },
        { from: 'uno', to: 'green', label: 'D11' },
      ],
      wiring: [
        { from: 'Red LED long leg (+)', to: '220 Ω → Arduino D13', signal: 'Digital output' },
        { from: 'Yellow LED long leg (+)', to: '220 Ω → Arduino D12', signal: 'Digital output' },
        { from: 'Green LED long leg (+)', to: '220 Ω → Arduino D11', signal: 'Digital output' },
        { from: 'All short legs (−)', to: 'Breadboard blue rail → GND', signal: 'Common ground' },
      ],
      bom: [
        { part: 'Arduino Uno + USB cable', qty: 1, spec: 'Any Uno-compatible board' },
        { part: 'LED 5 mm', qty: 3, spec: 'Red, yellow, green' },
        { part: 'Resistor', qty: 3, spec: '220 Ω (red-red-brown)' },
        { part: 'Breadboard + jumper wires', qty: 1, spec: 'Half size, male-male' },
      ],
    },
    steps: [
      { title: 'Meet the parts', body: 'An LED has a long leg (+) and a short leg (−). The resistor stops too much current from burning the LED out.', check: 'You can point to the long leg of each LED.' },
      { title: 'Build the circuit', body: 'Push the three LEDs into the breadboard. Connect each long leg through a 220 Ω resistor to pins 13, 12 and 11. Join all short legs to GND.', check: 'Your board matches the blueprint above.' },
      {
        title: 'Write the program',
        body: 'Open the Arduino IDE, paste this sketch and press Upload.',
        code: `const int RED = 13, YELLOW = 12, GREEN = 11;

void setup() {
  pinMode(RED, OUTPUT);
  pinMode(YELLOW, OUTPUT);
  pinMode(GREEN, OUTPUT);
}

// Turn one light on for a while, then off again.
void light(int pin, int ms) {
  digitalWrite(pin, HIGH);
  delay(ms);
  digitalWrite(pin, LOW);
}

void loop() {
  light(GREEN, 5000);   // go
  light(YELLOW, 2000);  // get ready to stop
  light(RED, 5000);     // stop
}`,
        check: 'The lights change green → yellow → red and repeat.',
      },
      { title: 'Add a pedestrian beep', body: 'Challenge: add a buzzer on pin 8 and make it beep while the red light is on so people know it is safe to cross.', check: 'You hear beeps only during red.' },
      { title: 'Show and tell', body: 'Build a little crossing from cardboard and toy cars. Explain to a friend why yellow comes before red.' },
    ],
  },
  {
    id: 'night-lamp',
    slug: 'smart-night-lamp',
    title: 'Smart Night Lamp',
    level: 'primary',
    grades: [4, 5],
    duration: '2 sessions',
    mission: 'A lamp that knows when it is bedtime.',
    summary: 'A light sensor (LDR) tells the Arduino how bright the room is. When it gets dark, the lamp glows — brighter the darker it gets.',
    skills: ['Light sensors', 'analogRead', 'If / else decisions'],
    blueprint: {
      drawingNo: 'RDX-NL-01',
      nodes: [
        { id: 'ldr', label: 'LDR Sensor', sub: '+ 10 kΩ divider', x: 30, y: 60 },
        { id: 'usb', label: 'USB Cable', sub: '5 V', x: 30, y: 340 },
        { id: 'uno', label: 'Arduino Uno', sub: 'reads light 0–1023', x: 300, y: 200, w: 190, accent: true },
        { id: 'lamp', label: 'Bright LED', sub: '+ 220 Ω', x: 600, y: 200 },
      ],
      edges: [
        { from: 'ldr', to: 'uno', label: 'A0 · analog' },
        { from: 'usb', to: 'uno', label: '5 V', power: true },
        { from: 'uno', to: 'lamp', label: 'D9 · PWM' },
      ],
      wiring: [
        { from: 'LDR leg 1', to: 'Arduino 5 V', signal: 'Power for the divider' },
        { from: 'LDR leg 2', to: 'Arduino A0 and 10 kΩ → GND', signal: 'Voltage rises with more light' },
        { from: 'LED long leg (+)', to: '220 Ω → Arduino D9', signal: 'PWM brightness' },
        { from: 'LED short leg (−)', to: 'GND', signal: 'Ground' },
      ],
      bom: [
        { part: 'Arduino Uno + USB cable', qty: 1, spec: 'Any Uno-compatible board' },
        { part: 'LDR (photoresistor)', qty: 1, spec: '5 mm GL5528' },
        { part: 'Resistor', qty: 2, spec: '10 kΩ and 220 Ω' },
        { part: 'Bright white LED', qty: 1, spec: '5 mm' },
        { part: 'Breadboard + jumper wires', qty: 1, spec: 'Half size' },
      ],
    },
    steps: [
      { title: 'How an LDR works', body: 'An LDR changes its resistance with light. With the 10 kΩ resistor it makes a voltage the Arduino can read: low in the dark, high in bright light.' },
      { title: 'Build the sensor and lamp', body: 'Wire the LDR and 10 kΩ resistor to A0 as in the wiring table, then the LED through 220 Ω to pin 9.', check: 'Your board matches the blueprint.' },
      {
        title: 'Measure your room',
        body: 'Upload this sketch, open Tools → Serial Monitor, and cover the LDR with your hand. Note the numbers in light and dark, and set DARK between them.',
        code: `const int LDR = A0, LAMP = 9;
const int DARK = 300;   // change this after measuring your room

void setup() {
  pinMode(LAMP, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int light = analogRead(LDR);   // 0 = dark ... 1023 = bright
  Serial.println(light);

  if (light < DARK) {
    // Darker room -> brighter lamp
    analogWrite(LAMP, map(light, 0, DARK, 255, 40));
  } else {
    analogWrite(LAMP, 0);
  }
  delay(100);
}`,
        check: 'The LED turns on when you cover the sensor.',
      },
      { title: 'Make a lampshade', body: 'Put the LED inside a paper cup or a 3D-printed shade. Test it in a dark corner.' },
    ],
  },
  {
    id: 'doorbell',
    slug: 'musical-doorbell',
    title: 'Musical Doorbell',
    level: 'primary',
    grades: [2, 5],
    duration: '1–2 sessions',
    mission: 'Ding-dong! Compose your own chime.',
    summary: 'Press a button and the Arduino plays a tune on a buzzer while an LED flashes. Then change the notes to make your own song.',
    skills: ['Buttons as inputs', 'tone() and music', 'Arrays of notes'],
    blueprint: {
      drawingNo: 'RDX-DB-01',
      nodes: [
        { id: 'btn', label: 'Push Button', sub: 'INPUT_PULLUP', x: 30, y: 60 },
        { id: 'usb', label: 'USB Cable', sub: '5 V', x: 30, y: 340 },
        { id: 'uno', label: 'Arduino Uno', sub: 'plays the tune', x: 300, y: 200, w: 190, accent: true },
        { id: 'buzz', label: 'Piezo Buzzer', sub: 'passive', x: 600, y: 60 },
        { id: 'led', label: 'LED', sub: '+ 220 Ω', x: 600, y: 340 },
      ],
      edges: [
        { from: 'btn', to: 'uno', label: 'D2' },
        { from: 'usb', to: 'uno', label: '5 V', power: true },
        { from: 'uno', to: 'buzz', label: 'D8 · tone()' },
        { from: 'uno', to: 'led', label: 'D13' },
      ],
      wiring: [
        { from: 'Button leg 1', to: 'Arduino D2', signal: 'Reads LOW when pressed (internal pull-up)' },
        { from: 'Button leg 2 (diagonal)', to: 'GND', signal: 'Ground' },
        { from: 'Buzzer (+)', to: 'Arduino D8', signal: 'Square-wave tone' },
        { from: 'Buzzer (−)', to: 'GND', signal: 'Ground' },
        { from: 'LED (+)', to: '220 Ω → D13', signal: 'Flashes with the tune' },
      ],
      bom: [
        { part: 'Arduino Uno + USB cable', qty: 1, spec: 'Any Uno-compatible board' },
        { part: 'Tactile push button', qty: 1, spec: '12 mm' },
        { part: 'Passive piezo buzzer', qty: 1, spec: '5 V' },
        { part: 'LED + 220 Ω resistor', qty: 1, spec: 'Any colour' },
        { part: 'Breadboard + jumper wires', qty: 1, spec: 'Half size' },
      ],
    },
    steps: [
      { title: 'Wire the button', body: 'Place the button across the middle gap of the breadboard. One leg goes to D2, the diagonal leg to GND.' },
      { title: 'Add the buzzer and LED', body: 'Buzzer + to D8, LED through 220 Ω to D13, both minus legs to GND.', check: 'Your board matches the blueprint.' },
      {
        title: 'Program the chime',
        body: 'Each number in melody is a note frequency in hertz; 0 means a rest. beats says how long each note lasts.',
        code: `const int BUTTON = 2, BUZZER = 8, LED = 13;

int melody[] = {659, 523, 587, 392, 0, 392, 587, 659, 523};
int beats[]  = {400, 400, 400, 800, 200, 400, 400, 400, 800};

void setup() {
  pinMode(BUTTON, INPUT_PULLUP);  // pressed = LOW
  pinMode(LED, OUTPUT);
}

void loop() {
  if (digitalRead(BUTTON) == LOW) {
    for (int i = 0; i < 9; i++) {
      digitalWrite(LED, i % 2);   // flash along with the music
      if (melody[i] > 0) tone(BUZZER, melody[i], beats[i] * 9 / 10);
      delay(beats[i]);
    }
    digitalWrite(LED, LOW);
  }
}`,
        check: 'Pressing the button plays the chime once.',
      },
      { title: 'Compose your own', body: 'Change the numbers. C = 523, D = 587, E = 659, F = 698, G = 784. Can you play "Twinkle Twinkle"?' },
    ],
  },

  /* ----------------------------------------------------------- Intermediate */
  {
    id: 'line-follower',
    slug: 'line-following-robot',
    title: 'Line-Following Robot',
    level: 'intermediate',
    grades: [6, 8],
    duration: '4 sessions',
    mission: 'Race your robot around a black-tape track.',
    summary: 'Two infrared sensors look at the floor. The Arduino steers the motors to keep the black line between them — the same idea warehouse robots use.',
    skills: ['IR sensors', 'Motor drivers (L298N)', 'Feedback & steering logic'],
    blueprint: {
      drawingNo: 'RDX-LF-01',
      nodes: [
        { id: 'irl', label: 'IR Sensor L', sub: 'TCRT5000', x: 30, y: 40 },
        { id: 'irr', label: 'IR Sensor R', sub: 'TCRT5000', x: 30, y: 200 },
        { id: 'uno', label: 'Arduino Uno', sub: 'steering logic', x: 300, y: 120, w: 190, accent: true },
        { id: 'drv', label: 'L298N Driver', sub: 'dual H-bridge', x: 600, y: 120 },
        { id: 'mot', label: '2× BO Motors', sub: 'left + right wheel', x: 600, y: 340 },
        { id: 'batt', label: '2× 18650 Pack', sub: '7.4 V · L298N 5 V → Uno', x: 300, y: 340, w: 190 },
      ],
      edges: [
        { from: 'irl', to: 'uno', label: 'D2' },
        { from: 'irr', to: 'uno', label: 'D3' },
        { from: 'uno', to: 'drv', label: 'ENA/ENB + IN1–4' },
        { from: 'drv', to: 'mot', label: 'motor A / B' },
        { from: 'batt', to: 'drv', label: '7.4 V', power: true },
      ],
      wiring: [
        { from: 'IR left OUT', to: 'Arduino D2', signal: 'HIGH over black line' },
        { from: 'IR right OUT', to: 'Arduino D3', signal: 'HIGH over black line' },
        { from: 'L298N ENA / ENB', to: 'Arduino D5 / D6', signal: 'PWM speed (remove the jumpers)' },
        { from: 'L298N IN1 / IN2', to: 'Arduino D7 / D8', signal: 'Left motor direction' },
        { from: 'L298N IN3 / IN4', to: 'Arduino D9 / D10', signal: 'Right motor direction' },
        { from: 'Battery + (via switch)', to: 'L298N 12 V terminal', signal: '7.4 V motor supply' },
        { from: 'L298N 5 V', to: 'Arduino VIN', signal: 'Powers the Arduino; common GND everywhere' },
      ],
      bom: [
        { part: 'Arduino Uno', qty: 1, spec: 'Mounted on the chassis' },
        { part: 'L298N motor driver', qty: 1, spec: 'With onboard 5 V regulator' },
        { part: 'TCRT5000 IR sensor module', qty: 2, spec: 'Digital output with sensitivity pot' },
        { part: 'BO gear motor + wheel', qty: 2, spec: '3–6 V, 150–300 RPM' },
        { part: '2WD chassis + caster', qty: 1, spec: 'Acrylic or 3D printed' },
        { part: '18650 cells + holder + switch', qty: 1, spec: '2S, 7.4 V' },
        { part: 'Black electrical tape', qty: 1, spec: '18 mm, for the track' },
      ],
    },
    steps: [
      { title: 'Assemble the chassis', body: 'Mount the motors, wheels and caster. Fix the two IR sensors at the front, about 1 cm above the floor and 2–3 cm apart.' },
      { title: 'Wire the motor driver', body: 'Follow the wiring table. Remove the ENA/ENB jumpers so the Arduino can control speed. Connect every GND together.', check: 'Nothing gets warm when you switch on.' },
      { title: 'Tune the sensors', body: 'Hold the robot over white floor, then black tape. Turn each sensor\'s little screw until its LED changes exactly at the tape edge.', check: 'Sensor LEDs switch cleanly at the line.' },
      {
        title: 'Upload the steering code',
        body: 'Each sensor says whether it sees black. If the line drifts under one sensor, turn that way.',
        code: `const int IR_L = 2, IR_R = 3;
const int ENA = 5, IN1 = 7, IN2 = 8;    // left motor
const int ENB = 6, IN3 = 9, IN4 = 10;   // right motor
const int SPEED = 150;                  // 0-255

void drive(int left, int right) {
  digitalWrite(IN1, left > 0);  digitalWrite(IN2, left < 0);
  digitalWrite(IN3, right > 0); digitalWrite(IN4, right < 0);
  analogWrite(ENA, abs(left));  analogWrite(ENB, abs(right));
}

void setup() {
  int outs[] = {ENA, IN1, IN2, ENB, IN3, IN4};
  for (int p : outs) pinMode(p, OUTPUT);
  pinMode(IR_L, INPUT);
  pinMode(IR_R, INPUT);
}

void loop() {
  bool l = digitalRead(IR_L) == HIGH;   // HIGH = black line under sensor
  bool r = digitalRead(IR_R) == HIGH;

  if (!l && !r)      drive(SPEED, SPEED);        // line between sensors
  else if (l && !r)  drive(-SPEED / 2, SPEED);   // line went left: turn left
  else if (!l && r)  drive(SPEED, -SPEED / 2);   // line went right: turn right
  else               drive(0, 0);                // both black: finish line
}`,
        check: 'The robot follows a straight line of tape.',
      },
      { title: 'Build a race track', body: 'Make an oval with gentle curves. If the robot overshoots, lower SPEED. Time a lap and try to beat it.' },
      { title: 'Level up', body: 'Add a third sensor in the middle, or an HC-SR04 to stop for obstacles on the track.' },
    ],
  },
  {
    id: 'smart-dustbin',
    slug: 'smart-dustbin',
    title: 'Touch-Free Smart Dustbin',
    level: 'intermediate',
    grades: [6, 8],
    duration: '3 sessions',
    mission: 'Wave your hand — the lid opens by itself.',
    summary: 'An ultrasonic sensor measures how close your hand is, and a servo motor lifts the lid. A hygienic gadget for the classroom.',
    skills: ['Ultrasonic distance', 'Servo motors', 'Thresholds & timing'],
    blueprint: {
      drawingNo: 'RDX-SD-01',
      nodes: [
        { id: 'hc', label: 'HC-SR04', sub: 'ultrasonic 2–400 cm', x: 30, y: 120 },
        { id: 'uno', label: 'Arduino Uno', sub: 'open if < 25 cm', x: 300, y: 120, w: 190, accent: true },
        { id: 'servo', label: 'SG90 Servo', sub: '0° shut · 100° open', x: 600, y: 120 },
        { id: 'lid', label: 'Bin Lid', sub: 'hinged', x: 600, y: 320 },
        { id: 'pwr', label: '5 V Supply', sub: 'USB power bank', x: 300, y: 320, w: 190 },
      ],
      edges: [
        { from: 'hc', to: 'uno', label: 'TRIG D9 · ECHO D10' },
        { from: 'uno', to: 'servo', label: 'D6 · PWM' },
        { from: 'servo', to: 'lid', label: 'horn + wire link' },
        { from: 'pwr', to: 'uno', label: '5 V', power: true },
      ],
      wiring: [
        { from: 'HC-SR04 VCC / GND', to: 'Arduino 5 V / GND', signal: 'Power' },
        { from: 'HC-SR04 TRIG', to: 'Arduino D9', signal: '10 µs pulse starts a ping' },
        { from: 'HC-SR04 ECHO', to: 'Arduino D10', signal: 'Pulse width = echo time' },
        { from: 'Servo brown / red', to: 'GND / 5 V', signal: 'Power' },
        { from: 'Servo orange', to: 'Arduino D6', signal: 'Position signal' },
      ],
      bom: [
        { part: 'Arduino Uno', qty: 1, spec: 'Any Uno-compatible board' },
        { part: 'HC-SR04 ultrasonic sensor', qty: 1, spec: '5 V' },
        { part: 'SG90 micro servo', qty: 1, spec: 'With horns and screws' },
        { part: 'Dustbin with hinged lid', qty: 1, spec: 'Small, light lid' },
        { part: 'USB power bank', qty: 1, spec: '5 V, 1 A' },
        { part: 'Jumper wires + glue gun', qty: 1, spec: 'Female-male' },
      ],
    },
    steps: [
      { title: 'How ultrasound measures distance', body: 'The sensor sends a click too high for us to hear and times the echo. Sound takes about 58 µs to travel 1 cm there and back.' },
      { title: 'Wire the sensor and servo', body: 'Follow the wiring table. Test the servo alone first by sweeping it from 0° to 100°.', check: 'The servo horn moves smoothly.' },
      {
        title: 'Upload the program',
        body: 'The lid opens when something is closer than OPEN_CM and stays open for 3 seconds.',
        code: `#include <Servo.h>

const int TRIG = 9, ECHO = 10, SERVO_PIN = 6;
const int OPEN_CM = 25;
Servo lid;

long distanceCm() {
  digitalWrite(TRIG, LOW);  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG, LOW);
  long us = pulseIn(ECHO, HIGH, 30000);   // 0 when no echo in 30 ms
  return us == 0 ? 999 : us / 58;
}

void setup() {
  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);
  lid.attach(SERVO_PIN);
  lid.write(0);   // closed
}

void loop() {
  if (distanceCm() < OPEN_CM) {
    lid.write(100);   // open
    delay(3000);
  } else {
    lid.write(0);
  }
  delay(100);
}`,
        check: 'Waving your hand near the sensor moves the servo.',
      },
      { title: 'Mount it on the bin', body: 'Hot-glue the sensor to the front, facing outwards, and link the servo horn to the lid with stiff wire. Adjust 100° until the lid opens fully.' },
      { title: 'Improve it', body: 'Add a second sensor inside the lid that lights a red LED when the bin is full.' },
    ],
  },
  {
    id: 'weather-station',
    slug: 'iot-weather-station',
    title: 'IoT Weather Station',
    level: 'intermediate',
    grades: [8, 9],
    duration: '4 sessions',
    mission: 'Check your school\'s weather from any phone.',
    summary: 'An ESP32 reads temperature and humidity and hosts its own web page on the school Wi-Fi, so anyone on the network can see live readings.',
    skills: ['ESP32 & Wi-Fi', 'DHT22 sensor', 'Tiny web servers'],
    blueprint: {
      drawingNo: 'RDX-WS-01',
      nodes: [
        { id: 'dht', label: 'DHT22', sub: 'temp + humidity', x: 30, y: 60 },
        { id: 'usb', label: 'USB 5 V', sub: 'charger', x: 30, y: 320 },
        { id: 'esp', label: 'ESP32 DevKit', sub: 'web server :80', x: 300, y: 190, w: 190, accent: true },
        { id: 'wifi', label: 'Wi-Fi Router', sub: '2.4 GHz', x: 600, y: 60 },
        { id: 'phone', label: 'Phone / Laptop', sub: 'browser', x: 600, y: 320 },
      ],
      edges: [
        { from: 'dht', to: 'esp', label: 'GPIO4' },
        { from: 'usb', to: 'esp', label: '5 V', power: true },
        { from: 'esp', to: 'wifi', label: 'Wi-Fi' },
        { from: 'wifi', to: 'phone', label: 'HTTP page' },
      ],
      wiring: [
        { from: 'DHT22 pin 1 (VCC)', to: 'ESP32 3V3', signal: '3.3 V power' },
        { from: 'DHT22 pin 2 (DATA)', to: 'ESP32 GPIO4 + 10 kΩ to 3V3', signal: 'One-wire data with pull-up' },
        { from: 'DHT22 pin 4 (GND)', to: 'ESP32 GND', signal: 'Ground' },
      ],
      bom: [
        { part: 'ESP32 DevKit V1', qty: 1, spec: 'With USB cable' },
        { part: 'DHT22 (AM2302)', qty: 1, spec: 'Temperature ±0.5 °C, humidity ±2 %' },
        { part: 'Resistor', qty: 1, spec: '10 kΩ pull-up (not needed on 3-pin modules)' },
        { part: 'Breadboard + jumpers', qty: 1, spec: 'Half size' },
        { part: 'Weatherproof box', qty: 1, spec: 'With air vents, kept in shade' },
      ],
    },
    steps: [
      { title: 'Set up the ESP32', body: 'In the Arduino IDE add the ESP32 board package, then install the "DHT sensor library" by Adafruit from the Library Manager.' },
      { title: 'Wire the sensor', body: 'Follow the wiring table. Use 3V3, not 5 V, for the DHT22 on an ESP32.', check: 'Your board matches the blueprint.' },
      {
        title: 'Upload the web server',
        body: 'Put your Wi-Fi name and password in the sketch. After upload, the Serial Monitor (115200 baud) prints the address to open.',
        code: `#include <WiFi.h>
#include <WebServer.h>
#include <DHT.h>

const char* SSID = "your-wifi";
const char* PASS = "your-password";

DHT dht(4, DHT22);
WebServer server(80);

void handleRoot() {
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  String html =
    "<meta name=viewport content='width=device-width'>"
    "<meta http-equiv=refresh content=10>"
    "<h1>Radix Weather</h1>"
    "<p>Temperature: " + String(t, 1) + " &deg;C</p>"
    "<p>Humidity: " + String(h, 0) + " %</p>";
  server.send(200, "text/html", html);
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  WiFi.begin(SSID, PASS);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print('.'); }
  Serial.println();
  Serial.println(WiFi.localIP());   // open this address in a browser
  server.on("/", handleRoot);
  server.begin();
}

void loop() {
  server.handleClient();
}`,
        check: 'Opening the printed IP address shows live readings.',
      },
      { title: 'Install outdoors', body: 'Put the station in a vented box in the shade. Compare its readings with a weather app for a week.' },
      { title: 'Go further', body: 'Log readings every 10 minutes to a Google Sheet, or add a BMP280 for air pressure and predict rain.' },
    ],
  },
];

/** Capstone builds become the advanced projects; their full guide stays on /projects/[slug]. */
const advancedProjects: StudentProject[] = builds.map((b) => ({
  id: b.id,
  slug: b.slug,
  title: b.title,
  level: 'advanced',
  grades: [10, 12],
  duration: b.duration,
  mission: b.handwrittenNote,
  summary: b.description,
  skills: b.techStack,
  blueprint: b.blueprint,
  steps: b.guide.steps.map((s) => ({ title: s.title, body: s.body.join(' '), code: s.code?.code, check: s.check })),
  fullGuideHref: `/projects/${b.slug}`,
}));

export const PROJECTS: StudentProject[] = [...starterProjects, ...advancedProjects];
export const PROJECT_BY_SLUG = new Map(PROJECTS.map((p) => [p.slug, p]));

/** Class number → the level to recommend. */
export function levelForClass(cls: number | null): ProjectLevel | null {
  if (cls === null) return null;
  if (cls <= 5) return 'primary';
  if (cls <= 9) return 'intermediate';
  return 'advanced';
}

const ROMAN: Record<string, number> = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10, xi: 11, xii: 12 };

/** "Class 7 B", "Grade 7", "7th", "Class VII" … → 7. Null when no class number is found. */
export function parseClassNumber(...labels: (string | null | undefined)[]): number | null {
  for (const raw of labels) {
    if (!raw) continue;
    const s = raw.toLowerCase();
    const n = s.match(/\b(\d{1,2})(?:st|nd|rd|th)?\b/);
    if (n) {
      const v = Number(n[1]);
      if (v >= 1 && v <= 12) return v;
    }
    const r = s.match(/\b(?:class|grade|std)\s+(xii|xi|ix|x|viii|vii|vi|iv|v|iii|ii|i)\b/);
    if (r) return ROMAN[r[1]];
  }
  return null;
}

export const projectTopicId = (slug: string) => `project:${slug}`;
