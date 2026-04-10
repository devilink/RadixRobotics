export type Level = 'p' | 'i' | 'a';

export interface TopicPart {
  label: string;
  topics: string[];
}

export interface CurriculumData {
  cls: number;
  level: Level;
  parts: TopicPart[];
}

export const curriculumData: CurriculumData[] = [
  {cls:1,level:'p',parts:[
  {label:'Part 1 — Foundation & Curiosity (Sessions 1–10)',topics:['What is a machine?','Things that move and things that don\'t','Push and pull forces','Wheels and rollers','Levers and seesaws','Ramps and slopes','Parts of a machine','Machines at home','Machines in my village','My favourite machine']},
  {label:'Part 2 — Logic & Basic Systems (Sessions 11–20)',topics:['What is a sequence?','First, then, last','My morning routine algorithm','Directions: forward, backward, left, right','Patterns with shapes','Patterns with colours','Sorting and grouping','If this, then that','Robot walk game (unplugged)','Repeating instructions (loops)']},
  {label:'Part 3 — Mini Robotics Applications (Sessions 21–30)',topics:['Parts make a whole','Wind-up toys and stored energy','Paper robot assembly','Cause and effect in machines','Robots that help people','A robot for my village','My dream robot drawing','Robot story: the rice field helper','Build and share challenge','Class robot book creation']}
  ]},
  {cls:2,level:'p',parts:[
  {label:'Part 1 — Foundation & Curiosity (Sessions 1–10)',topics:['Forces that move things','Friction: rough vs. smooth','Gravity pulls things down','Magnets: attract and repel','Sorting with magnets','Electric motors: spin and move','What is energy?','Batteries store energy','How a fan works','Human-machine comparison']},
  {label:'Part 2 — Logic & Basic Systems (Sessions 11–20)',topics:['Electricity flows in a path','Parts of a circuit','Building my first circuit','Open and closed circuits','Switch: on and off','Conductors and insulators','My homemade switch','Circuit troubleshooting','Drawing a circuit diagram','Multi-bulb circuit challenge']},
  {label:'Part 3 — Mini Robotics Applications (Sessions 21–30)',topics:['Motor connected to battery','Cardboard motor bot build','Watching my bot move','Controlling direction manually','Obstacle path challenge','Energy to motion: the full story','Two motors vs. one motor','Design your helper robot','Village problem: what can a robot do?','Present my robot idea']}
  ]},
  {cls:3,level:'p',parts:[
  {label:'Part 1 — Foundation & Curiosity (Sessions 1–10)',topics:['What is an algorithm?','Precision in instructions','Debugging: finding mistakes','Loops: repeat this step','Conditions: if–then','Input and output thinking','Floor robot navigation game','Debugging a wrong path','Writing instructions for a friend','Algorithm relay challenge']},
  {label:'Part 2 — Logic & Basic Systems (Sessions 11–20)',topics:['Introduction to Scratch Jr.','Sprites and backgrounds','Move and turn blocks','Say and change colour blocks','When-clicked event','Repeat loop in Scratch','Animate my name','The dancing robot sprite','My village story animation','Share and feedback session']},
  {label:'Part 3 — Mini Robotics Applications (Sessions 21–30)',topics:['What is a programmable robot?','mBot introduction and parts','Connecting code to movement','Move forward and backward','Turn left and turn right','Speed and distance basics','mBot wakeup challenge','Robot maze navigator','Blinky: the signal bot','Reflection: code meets machine']}
  ]},
  {cls:4,level:'p',parts:[
  {label:'Part 1 — Foundation & Curiosity (Sessions 1–10)',topics:['What is a sensor?','Human senses vs. robot sensors','Sensor types overview','Input–process–output model','Automatic doors and streetlights','Clap switch demonstration','Designing a sensor robot','Sensors in agriculture','Sense map challenge','Local problem sensor brainstorm']},
  {label:'Part 2 — Logic & Basic Systems (Sessions 11–20)',topics:['If–then–else in Scratch','Variables: storing information','Events and triggers','Smart traffic light program','Flood alert simulator','Nested conditions','Score tracking with variables','Broadcasting between sprites','Quiz bot project','Test and debug session']},
  {label:'Part 3 — Mini Robotics Applications (Sessions 21–30)',topics:['Ultrasonic sensor introduction','Measuring distance with code','Obstacle stopper bot','Light sensor and threshold','Night light bot program','If object detected → turn','Line follower concept','Sensor calibration practice','Automatic streetlight project','Sensor integration challenge']}
  ]},
  {cls:5,level:'p',parts:[
  {label:'Part 1 — Foundation & Curiosity (Sessions 1–10)',topics:['Engineering design process: overview','Empathise: understanding user needs','Define: writing a problem statement','Ideate: brainstorming solutions','Sketch and prototype','Problem hunt walk','Design sprint: school bag bot','Empathy interview with a farmer','Team roles in engineering','Feedback and redesign']},
  {label:'Part 2 — Logic & Basic Systems (Sessions 11–20)',topics:['Multiple scenes in Scratch','Lists and multiple variables','Score and game logic','Broadcasting events','Simulation: modelling a real system','Flood warning system simulation','Smart farming dashboard','Interactive quiz game','Debugging complex programs','Peer code review session']},
  {label:'Part 3 — Mini Robotics Applications (Sessions 21–30)',topics:['Capstone project introduction','Planning: materials and roles','Smart plant watering system build','Flood alert rover build','Sensor + code integration','Testing and iteration','Refinement session','Preparing the presentation','Mini science fair demo day','Reflection and learning review']}
  ]},
  {cls:6,level:'i',parts:[
  {label:'Part 1 — Core Robotics & Electronics (Sessions 1–10)',topics:['Introduction to Arduino Uno','Components: resistor, LED, buzzer','Breadboard layout and prototyping','Digital I/O: HIGH and LOW','pinMode and digitalWrite','Blinking an LED: hello world','Delay and timing','Traffic light controller build','Push button input reading','Smart doorbell project']},
  {label:'Part 2 — Applied Robotics Systems (Sessions 11–20)',topics:['Analog vs. digital signals','analogRead and analogWrite','LDR light sensor','Threshold-based automation','Automatic night lamp project','HC-SR04 ultrasonic sensor','Measuring and displaying distance','Distance alert buzzer system','Water level indicator build','Multi-sensor integration challenge']}
  ]},
  {cls:7,level:'i',parts:[
  {label:'Part 1 — Core Robotics & Electronics (Sessions 1–10)',topics:['DC motor: speed and direction','PWM: controlling motor speed','L298N motor driver module','Assembling a 2WD chassis','First wheeled robot build','Forward, backward, left, right code','Speed controller with serial input','SG90 servo motor control','Pan-tilt mechanism build','Joystick-controlled servo demo']},
  {label:'Part 2 — Applied Robotics Systems (Sessions 11–20)',topics:['Autonomous vs. remote robots','Obstacle avoidance algorithm','Mounting ultrasonic on servo','Scan left, scan right, decide','Obstacle avoiding robot build','IR sensor: line detection','Two IR sensor line following','Line follower build and calibrate','State machine for robot behaviour','Flood patrol bot final project']}
  ]},
  {cls:8,level:'i',parts:[
  {label:'Part 1 — Core Robotics & Electronics (Sessions 1–10)',topics:['Serial communication basics','HC-05 Bluetooth module setup','Bluetooth terminal app control','Bluetooth controlled robot build','IR remote decoding','IR remote robot control','MIT App Inventor introduction','Custom app button layout','Bluetooth app controlled robot','WiFi module ESP8266 intro']},
  {label:'Part 2 — Applied Robotics Systems (Sessions 11–20)',topics:['DHT11: temperature and humidity','I2C LCD display interface','Reading and displaying sensor data','Soil moisture sensor','IoT platform: ThingSpeak setup','Uploading data to the cloud','Blynk app: live dashboard','Smart flood monitor station build','Tea garden climate monitor build','Color sensor object sorting bot']}
  ]},
  {cls:9,level:'i',parts:[
  {label:'Part 1 — Core Robotics & Electronics (Sessions 1–10)',topics:['What is artificial intelligence?','Types of AI: narrow, ML, deep learning','Supervised learning concept','Training a model with labeled data','Google Teachable Machine: image classifier','Training gesture recognition model','Gesture controlled robot build','Plant disease detector prototype','Web Speech API voice commands','Voice command robot integration']},
  {label:'Part 2 — Applied Robotics Systems (Sessions 11–20)',topics:['OpenCV introduction: capturing frames','Colour detection in video stream','Color tracking with camera','Camera + robot chassis integration','Color tracking robot build','Object detection for sorting','Servo gripper design and control','Automated sorting arm project','Sensor data + ML for prediction','AI flood risk mapper dashboard']}
  ]},
  {cls:10,level:'a',parts:[
  {label:'Phase 1 — Advanced Systems (Sessions 1–5)',topics:['PID control: theory and tuning','Advanced motor control with encoders','Multi-axis robotic arm build','Computer vision: object detection','Power management for competition bots']},
  {label:'Phase 2 — Competition Preparation (Sessions 6–10)',topics:['PID line follower: competition tuning','Obstacle avoider: strategy and speed','Sumo bot: chassis and power design','Maze solver: wall-following algorithm','Firefighter bot: detection and response']},
  {label:'Phase 3 — Problem-Solving Challenges (Sessions 11–15)',topics:['Challenge 1: flood rescue mission bot','Challenge 2: smart agriculture field node','Challenge 3: disaster supply drop simulation','Challenge 4: AI-powered intruder alert system','Challenge 5: wearable assistive glove controller']},
  {label:'Phase 4 — Mini Capstone Project (Sessions 16–20)',topics:['Capstone team formation and problem selection','Design sprint: prototype planning','Build session: hardware and code integration','Testing, iteration, and refinement','Innovation day: demo and presentation']}
  ]}
];

export const levelMeta = {
  p: { label: 'Primary Robotics',  badgeClass: 'module-badge-primary' },
  i: { label: 'Intermediate Robotics', badgeClass: 'module-badge-intermediate' },
  a: { label: 'Advanced Robotics', badgeClass: 'module-badge-advanced' }
};
