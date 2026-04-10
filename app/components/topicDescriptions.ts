// Smart topic description generator
// Creates contextually relevant lesson overviews with bullet points based on topic titles

interface TopicDescription {
  summary: string;
  points: string[];
}

// Keyword-to-content mapping for intelligent bullet point generation
const keywordMap: Record<string, string[]> = {
  'machine': ['Identify different types of machines in daily life', 'Understand how machines reduce human effort', 'Classify simple vs complex machines'],
  'force': ['Explore forces like push, pull, gravity, and friction', 'Observe how forces affect motion and direction', 'Conduct simple force experiments'],
  'push|pull': ['Differentiate between push and pull actions', 'Relate forces to everyday activities', 'Predict the effect of applying force to objects'],
  'wheel|roller': ['Understand how wheels reduce friction', 'Explore axle-and-wheel mechanisms', 'Design a simple wheeled prototype'],
  'lever|seesaw': ['Learn the three classes of levers', 'Identify the fulcrum, effort, and load', 'Build a working lever model'],
  'ramp|slope': ['Understand inclined planes and their advantage', 'Experiment with ramp angles and friction', 'Relate ramps to real-world structures'],
  'sequence': ['Learn what sequential order means in logic', 'Practice arranging steps correctly', 'Connect sequencing to coding fundamentals'],
  'algorithm': ['Define what an algorithm is and why it matters', 'Write step-by-step instructions for tasks', 'Identify common algorithm patterns'],
  'pattern': ['Recognize repeating patterns in data and design', 'Create patterns using shapes, colors, or numbers', 'Apply pattern thinking to problem-solving'],
  'loop': ['Understand what repetition means in code', 'Write loops to avoid redundant instructions', 'Differentiate between fixed and conditional loops'],
  'robot': ['Explore the anatomy of a basic robot', 'Understand sensors, actuators, and controllers', 'Discuss real-world robot applications'],
  'sensor': ['Learn how sensors detect environmental changes', 'Compare human senses to electronic sensors', 'Experiment with light, sound, and distance sensors'],
  'circuit': ['Understand how electricity flows in a circuit', 'Build series and parallel circuits', 'Troubleshoot broken circuit connections'],
  'motor': ['Learn how electric motors convert energy to motion', 'Compare DC motors, servo motors, and stepper motors', 'Control motor speed and direction programmatically'],
  'battery|energy': ['Explore different sources of stored energy', 'Understand voltage, current, and power basics', 'Practice safe battery handling and wiring'],
  'led|blink': ['Wire an LED to a microcontroller', 'Write code to control LED timing', 'Explore brightness modulation with PWM'],
  'arduino': ['Set up the Arduino IDE and board connection', 'Understand digital pins, analog pins, and power', 'Upload and test your first sketch'],
  'scratch': ['Navigate the Scratch programming environment', 'Use blocks to control sprites and events', 'Create interactive animations and games'],
  'bluetooth': ['Set up Bluetooth module communication', 'Pair a mobile device with the robot', 'Send commands wirelessly to control actuators'],
  'wifi|esp': ['Configure WiFi module for network connectivity', 'Send and receive data over HTTP', 'Connect to cloud IoT platforms'],
  'iot|thingspeak|blynk|cloud': ['Understand the Internet of Things architecture', 'Upload sensor data to cloud dashboards', 'Monitor systems remotely in real-time'],
  'ai|artificial intelligence|machine learning': ['Understand the basics of AI and machine learning', 'Train a simple model using labeled data', 'Deploy an AI model on hardware'],
  'opencv|vision|camera|image': ['Capture and process video frames', 'Detect colors, shapes, or objects in real-time', 'Integrate computer vision with robotics'],
  'pid': ['Understand proportional, integral, and derivative control', 'Tune PID parameters for stable performance', 'Apply PID to line followers and balancing bots'],
  'obstacle': ['Detect obstacles using ultrasonic or IR sensors', 'Implement avoidance logic with conditional statements', 'Test robot navigation in obstacle courses'],
  'line follow': ['Calibrate IR sensors for line detection', 'Implement following logic using two or more sensors', 'Optimize speed and turning for smooth tracking'],
  'servo': ['Control angular position with servo motors', 'Build pan-tilt or gripper mechanisms', 'Program smooth servo sweeps and holds'],
  'ultrasonic': ['Measure distance using sound wave echoes', 'Wire and read the HC-SR04 sensor', 'Build proximity-based alert systems'],
  'sort|sorting': ['Understand classification criteria for objects', 'Implement sorting logic with sensors', 'Build automated sorting mechanisms'],
  'flood': ['Model flood detection scenarios', 'Use water level or moisture sensors', 'Design alert and response systems'],
  'design|prototype|build': ['Follow the engineering design process', 'Sketch ideas before building', 'Iterate on prototypes based on testing'],
  'capstone|project': ['Plan and scope a multi-session project', 'Integrate hardware, software, and design skills', 'Present and demonstrate working solutions'],
  'competition|sumo|maze': ['Understand competition rules and constraints', 'Optimize robot design for speed and reliability', 'Develop strategy for competitive challenges'],
  'debug|troubleshoot': ['Identify and isolate errors in code or wiring', 'Use systematic testing to pinpoint issues', 'Apply fixes and verify corrections'],
  'variable': ['Store and retrieve data using named variables', 'Track scores, counts, and measurements', 'Use variables in conditional and loop logic'],
  'condition|if': ['Write conditional statements for decision-making', 'Handle multiple conditions with if-else chains', 'Combine conditions with logical operators'],
  'voice|speech': ['Implement voice recognition interfaces', 'Convert speech to actionable commands', 'Integrate voice control with robotic systems'],
  'gripper|arm': ['Design and build robotic grippers', 'Control gripper position with servo motors', 'Automate pick-and-place operations'],
  'ir|infrared': ['Understand infrared signal transmission', 'Decode IR remote control signals', 'Use IR sensors for proximity and line detection'],
  'lcd|display': ['Interface LCD screens with microcontrollers', 'Display real-time sensor readouts', 'Format and update screen output dynamically'],
  'soil|plant|agriculture|farming|garden': ['Monitor soil moisture and environmental data', 'Automate irrigation based on sensor thresholds', 'Apply technology to real agricultural problems'],
  'weather|temperature|humidity|climate|dht': ['Read temperature and humidity with DHT sensors', 'Log environmental data over time', 'Visualize climate trends on dashboards'],
  'power|voltage': ['Understand power distribution in robot circuits', 'Select appropriate power supplies', 'Manage battery life for autonomous operation'],
  'game|quiz': ['Design interactive game mechanics', 'Implement scoring and feedback logic', 'Test and refine gameplay experience'],
  'story|animation|animate': ['Create narrative-driven animations', 'Sequence frames and transitions', 'Add sound and visual effects for engagement'],
  'team|peer|share|present|demo|fair': ['Collaborate effectively in engineering teams', 'Practice technical communication and presentation', 'Give and receive constructive feedback'],
  'wearable|glove': ['Explore wearable technology concepts', 'Interface sensors with body-worn devices', 'Design assistive or interactive wearable systems'],
  'encoder': ['Measure wheel rotation with encoders', 'Calculate distance and speed from encoder data', 'Implement closed-loop motor control'],
  'remote|joystick': ['Map joystick axes to robot movements', 'Build responsive remote control interfaces', 'Balance sensitivity with precision in control'],
  'rescue|disaster|supply': ['Design robots for emergency response scenarios', 'Navigate unstable terrain autonomously', 'Deliver payloads to target locations'],
  'intruder|alert|security': ['Detect motion and presence using sensors', 'Trigger alerts based on detection events', 'Build integrated security monitoring systems'],
};

export function getTopicDescription(topicTitle: string): TopicDescription {
  const titleLower = topicTitle.toLowerCase();
  const matchedPoints: string[] = [];

  // Find matching keywords and collect their bullet points
  for (const [pattern, points] of Object.entries(keywordMap)) {
    const keywords = pattern.split('|');
    if (keywords.some(kw => titleLower.includes(kw))) {
      matchedPoints.push(...points);
    }
  }

  // Deduplicate and limit to 3-4 points
  const uniquePoints = [...new Set(matchedPoints)].slice(0, 4);

  // If no keyword matched, generate generic but useful points
  if (uniquePoints.length === 0) {
    uniquePoints.push(
      `Understand the core concepts behind "${topicTitle}"`,
      'Apply hands-on experimentation and observation',
      'Connect the lesson to real-world robotics applications',
    );
  }

  // Generate a smart summary sentence
  const summary = `This lesson introduces the key concepts of "${topicTitle}". By the end, you will understand its role in robotics and be able to apply the knowledge in practical projects.`;

  return { summary, points: uniquePoints };
}
