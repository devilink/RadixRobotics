// Real Builds & Case Studies: card data, blueprints and build guides.
// Rendered by app/components/RealBuildsShowcase.tsx (cards) and app/projects/[slug] (detail).

export interface DiagramNode {
  id: string;
  label: string;
  sub?: string;
  x: number; // top-left, in the 800×460 drawing space
  y: number;
  w?: number;
  accent?: boolean;
}

export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
  power?: boolean;
}

export interface WiringRow { from: string; to: string; signal: string }
export interface BomRow { part: string; qty: number; spec: string }

export interface GuideStep {
  title: string;
  body: string[];
  code?: { lang: string; file?: string; code: string };
  check?: string; // how the student knows the step worked
}

export interface CapstoneBuild {
  id: string;
  slug: string;
  title: string;
  category: string;
  studentGrade: string;
  complexity: 'Intermediate' | 'Advanced' | 'Master';
  duration: string;
  bgColor: string;
  textColor: string;
  mutedColor: string;
  borderColor: string;
  shadowColor: string;
  description: string;
  techStack: string[];
  telemetryMetrics: { label: string; val: string }[];
  handwrittenNote: string;
  blueprint: {
    drawingNo: string;
    nodes: DiagramNode[];
    edges: DiagramEdge[];
    wiring: WiringRow[];
    bom: BomRow[];
  };
  guide: {
    prerequisites: string[];
    safety: string[];
    steps: GuideStep[];
  };
}

export const builds: CapstoneBuild[] = [
  /* ------------------------------------------------------------------ */
  {
    id: 'ros-rover',
    slug: 'ros2-lidar-rover',
    title: 'ROS 2 Autonomous LiDAR Rover',
    category: 'Autonomous Systems & SLAM',
    studentGrade: 'Grade 10–12',
    complexity: 'Master',
    duration: '8–10 weeks',
    bgColor: 'bg-[#111]',
    textColor: 'text-[#f8f7ef]',
    mutedColor: 'text-[#a1a1aa]',
    borderColor: 'border-[#111]',
    shadowColor: 'shadow-[8px_8px_0px_#ff5400]',
    description:
      'Full-stack autonomous mobile robot utilizing 360° LiDAR and SLAM algorithms to map unknown environments and navigate with obstacle avoidance.',
    techStack: ['ROS 2 Humble', 'Python 3.11', 'Cartographer SLAM', 'Nav2'],
    telemetryMetrics: [
      { label: 'SLAM Precision', val: '±2 mm' },
      { label: 'Lidar Range', val: '12 m' },
      { label: 'Loop Rate', val: '50 Hz' },
    ],
    handwrittenNote: 'Maps rooms autonomously!',
    blueprint: {
      drawingNo: 'RDX-ROV-01',
      nodes: [
        { id: 'lidar', label: 'RPLIDAR A1', sub: '360° · 12 m', x: 30, y: 40 },
        { id: 'pi', label: 'Raspberry Pi 4', sub: 'Ubuntu 22.04 · ROS 2', x: 300, y: 40, w: 190, accent: true },
        { id: 'laptop', label: 'Laptop', sub: 'RViz2 · teleop', x: 600, y: 40 },
        { id: 'imu', label: 'BNO055 IMU', sub: '9-DOF', x: 600, y: 200 },
        { id: 'esp', label: 'ESP32', sub: 'PID · odometry', x: 310, y: 200, w: 170 },
        { id: 'batt', label: '3S LiPo 11.1 V', sub: '+ 5 V/5 A buck', x: 30, y: 360 },
        { id: 'drv', label: 'MDD10A Driver', sub: 'dual 10 A', x: 310, y: 360, w: 170 },
        { id: 'mot', label: '2× Gear Motors', sub: 'with encoders', x: 600, y: 360 },
      ],
      edges: [
        { from: 'lidar', to: 'pi', label: 'USB · /scan' },
        { from: 'pi', to: 'laptop', label: 'Wi-Fi · DDS' },
        { from: 'pi', to: 'esp', label: 'USB serial · cmd_vel / odom' },
        { from: 'imu', to: 'esp', label: 'I²C' },
        { from: 'esp', to: 'drv', label: 'PWM + DIR' },
        { from: 'drv', to: 'mot', label: '12 V PWM' },
        { from: 'mot', to: 'esp', label: 'encoder A/B' },
        { from: 'batt', to: 'drv', label: '11.1 V', power: true },
        { from: 'batt', to: 'pi', label: '5 V', power: true },
      ],
      wiring: [
        { from: 'RPLIDAR A1 (USB adapter)', to: 'Pi USB 3.0 port', signal: 'Serial 115200 baud → /dev/rplidar (udev rule)' },
        { from: 'ESP32 USB', to: 'Pi USB 2.0 port', signal: 'Serial 115200 baud: velocity in, odometry out' },
        { from: 'BNO055 SDA / SCL', to: 'ESP32 GPIO21 / GPIO22', signal: 'I²C @ 400 kHz, 3.3 V' },
        { from: 'MDD10A PWM1 / DIR1', to: 'ESP32 GPIO25 / GPIO26', signal: 'Left motor, 20 kHz PWM' },
        { from: 'MDD10A PWM2 / DIR2', to: 'ESP32 GPIO32 / GPIO33', signal: 'Right motor, 20 kHz PWM' },
        { from: 'Left encoder A / B', to: 'ESP32 GPIO34 / GPIO35', signal: 'Quadrature, input-only pins' },
        { from: 'Right encoder A / B', to: 'ESP32 GPIO36 / GPIO39', signal: 'Quadrature, input-only pins' },
        { from: 'Buck 5 V out', to: 'Pi USB-C', signal: '5.1 V, 3 A minimum' },
        { from: 'LiPo (via 20 A fuse + switch)', to: 'MDD10A VB+ / buck in', signal: '11.1 V nominal, common GND' },
      ],
      bom: [
        { part: 'Raspberry Pi 4 Model B', qty: 1, spec: '4 GB or 8 GB, 32 GB A2 microSD' },
        { part: 'Slamtec RPLIDAR A1M8', qty: 1, spec: '360°, 12 m range, 8 k samples/s' },
        { part: 'ESP32 DevKitC', qty: 1, spec: 'Motor PID + encoder counting' },
        { part: 'Cytron MDD10A', qty: 1, spec: 'Dual-channel 10 A motor driver' },
        { part: 'JGB37-520 gear motor with encoder', qty: 2, spec: '12 V, ~110 RPM' },
        { part: 'Bosch BNO055 breakout', qty: 1, spec: '9-DOF absolute orientation IMU' },
        { part: '3S LiPo battery', qty: 1, spec: '11.1 V, 2200–3300 mAh + LiPo alarm' },
        { part: 'Buck converter', qty: 1, spec: '5 V, 5 A output' },
        { part: 'Chassis plate + caster wheel', qty: 1, spec: '2-wheel differential drive, 250 mm' },
        { part: 'Blade fuse + rocker switch', qty: 1, spec: '20 A, main power cut-off' },
      ],
    },
    guide: {
      prerequisites: [
        'Comfortable with the Linux terminal and Python',
        'A laptop running Ubuntu 22.04 (or a VM) on the same Wi-Fi as the robot',
        'Basic soldering for the motor and encoder leads',
      ],
      safety: [
        'Charge LiPo packs on a balance charger inside a LiPo bag, never unattended.',
        'Put the rover on a stand (wheels off the ground) whenever you test new motor code.',
        'Keep the main switch within reach during every autonomous run.',
      ],
      steps: [
        {
          title: 'Install ROS 2 Humble on the Pi',
          body: [
            'Flash Ubuntu Server 22.04 (64-bit) to the microSD card with Raspberry Pi Imager, enabling SSH and Wi-Fi in the advanced options.',
            'SSH in and install the ROS 2 base packages. Do the same with the desktop variant (ros-humble-desktop) on your laptop so you get RViz2.',
          ],
          code: {
            lang: 'bash',
            code: `sudo apt update && sudo apt install -y software-properties-common curl
sudo add-apt-repository universe
sudo curl -sSL https://raw.githubusercontent.com/ros/rosdistro/master/ros.key \\
  -o /usr/share/keyrings/ros-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/ros-archive-keyring.gpg] \\
  http://packages.ros.org/ros2/ubuntu $(. /etc/os-release && echo $UBUNTU_CODENAME) main" \\
  | sudo tee /etc/apt/sources.list.d/ros2.list > /dev/null
sudo apt update && sudo apt install -y ros-humble-ros-base python3-colcon-common-extensions
echo "source /opt/ros/humble/setup.bash" >> ~/.bashrc
echo "export ROS_DOMAIN_ID=7" >> ~/.bashrc   # same number on the laptop`,
          },
          check: 'Run `ros2 run demo_nodes_py talker` on the Pi and `ros2 topic echo /chatter` on the laptop: messages appear on both.',
        },
        {
          title: 'Bring up the LiDAR',
          body: [
            'Install the Slamtec driver and give the sensor a stable device name so it does not swap with the ESP32 after a reboot.',
          ],
          code: {
            lang: 'bash',
            code: `sudo apt install -y ros-humble-rplidar-ros
# CP2102 adapter on the A1 → /dev/rplidar
echo 'KERNEL=="ttyUSB*", ATTRS{idVendor}=="10c4", ATTRS{idProduct}=="ea60", MODE:="0666", SYMLINK+="rplidar"' \\
  | sudo tee /etc/udev/rules.d/rplidar.rules
sudo udevadm control --reload-rules && sudo udevadm trigger

ros2 launch rplidar_ros rplidar_a1_launch.py serial_port:=/dev/rplidar frame_id:=laser`,
          },
          check: 'In RViz2 on the laptop, set Fixed Frame to `laser` and add a LaserScan display on /scan: you see the outline of the room.',
        },
        {
          title: 'Motor controller firmware (ESP32)',
          body: [
            'The ESP32 closes the speed loop: it counts encoder ticks, runs a PID per wheel, and accepts target wheel speeds over serial. Keeping this on the microcontroller gives a steady 50 Hz loop that Linux scheduling cannot disturb.',
            'The Pi sends `V <left_mps> <right_mps>` lines; the ESP32 replies with `O <left_ticks> <right_ticks>` every 20 ms.',
          ],
          code: {
            lang: 'cpp',
            file: 'rover_base.ino',
            code: `const int PWM_L = 25, DIR_L = 26, PWM_R = 32, DIR_R = 33;
const int ENC_LA = 34, ENC_LB = 35, ENC_RA = 36, ENC_RB = 39;
const float TICKS_PER_M = 2750.0;   // measure: push 1 m, read the ticks
volatile long ticksL = 0, ticksR = 0;
float targetL = 0, targetR = 0, iL = 0, iR = 0;
const float KP = 180, KI = 900;

void IRAM_ATTR encL() { ticksL += digitalRead(ENC_LB) ? -1 : 1; }
void IRAM_ATTR encR() { ticksR += digitalRead(ENC_RB) ? 1 : -1; }

void drive(int pwmPin, int dirPin, float u) {
  digitalWrite(dirPin, u >= 0);
  ledcWrite(pwmPin, constrain(abs(u), 0, 255));
}

void setup() {
  Serial.begin(115200);
  pinMode(DIR_L, OUTPUT); pinMode(DIR_R, OUTPUT);
  ledcAttach(PWM_L, 20000, 8); ledcAttach(PWM_R, 20000, 8);   // ESP32 core 3.x
  attachInterrupt(ENC_LA, encL, RISING);
  attachInterrupt(ENC_RA, encR, RISING);
}

void loop() {
  static long lastL = 0, lastR = 0;
  static uint32_t t = 0;
  if (Serial.available() && Serial.read() == 'V') {
    targetL = Serial.parseFloat(); targetR = Serial.parseFloat();
  }
  if (millis() - t < 20) return;          // 50 Hz control loop
  t = millis();
  long l = ticksL, r = ticksR;
  float vL = (l - lastL) / TICKS_PER_M / 0.02, vR = (r - lastR) / TICKS_PER_M / 0.02;
  lastL = l; lastR = r;
  float eL = targetL - vL, eR = targetR - vR;
  iL = constrain(iL + eL * 0.02, -0.3, 0.3); iR = constrain(iR + eR * 0.02, -0.3, 0.3);
  drive(PWM_L, DIR_L, KP * eL + KI * iL);
  drive(PWM_R, DIR_R, KP * eR + KI * iR);
  Serial.printf("O %ld %ld\\n", l, r);
}`,
          },
          check: 'With the wheels off the ground, send `V 0.2 0.2` from the Arduino serial monitor: both wheels spin forward at the same speed.',
        },
        {
          title: 'Base node: cmd_vel in, odometry out',
          body: [
            'A small Python node turns /cmd_vel (linear + angular velocity) into wheel speeds using differential-drive kinematics, and integrates encoder ticks into /odom plus the odom → base_link transform.',
          ],
          code: {
            lang: 'python',
            file: 'rover_base/base_node.py',
            code: `import math, serial, rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist, TransformStamped
from nav_msgs.msg import Odometry
from tf2_ros import TransformBroadcaster

WHEEL_BASE = 0.21        # metres between wheel centres
TICKS_PER_M = 2750.0

class Base(Node):
    def __init__(self):
        super().__init__('rover_base')
        self.port = serial.Serial('/dev/ttyUSB1', 115200, timeout=0.05)  # the ESP32: check ls /dev/ttyUSB*
        self.x = self.y = self.th = 0.0
        self.last = None
        self.odom_pub = self.create_publisher(Odometry, 'odom', 10)
        self.tf = TransformBroadcaster(self)
        self.create_subscription(Twist, 'cmd_vel', self.on_cmd, 10)
        self.create_timer(0.02, self.poll)

    def on_cmd(self, msg):
        v, w = msg.linear.x, msg.angular.z
        left, right = v - w * WHEEL_BASE / 2, v + w * WHEEL_BASE / 2
        self.port.write(f'V {left:.3f} {right:.3f}\\n'.encode())

    def poll(self):
        line = self.port.readline().decode(errors='ignore').split()
        if len(line) != 3 or line[0] != 'O':
            return
        l, r = int(line[1]), int(line[2])
        if self.last:
            dl = (l - self.last[0]) / TICKS_PER_M
            dr = (r - self.last[1]) / TICKS_PER_M
            d, dth = (dl + dr) / 2, (dr - dl) / WHEEL_BASE
            self.x += d * math.cos(self.th + dth / 2)
            self.y += d * math.sin(self.th + dth / 2)
            self.th += dth
            self.publish()
        self.last = (l, r)

    def publish(self):
        now = self.get_clock().now().to_msg()
        q = (0.0, 0.0, math.sin(self.th / 2), math.cos(self.th / 2))
        t = TransformStamped()
        t.header.stamp, t.header.frame_id, t.child_frame_id = now, 'odom', 'base_link'
        t.transform.translation.x, t.transform.translation.y = self.x, self.y
        (t.transform.rotation.x, t.transform.rotation.y,
         t.transform.rotation.z, t.transform.rotation.w) = q
        self.tf.sendTransform(t)
        o = Odometry()
        o.header, o.child_frame_id = t.header, 'base_link'
        o.pose.pose.position.x, o.pose.pose.position.y = self.x, self.y
        (o.pose.pose.orientation.x, o.pose.pose.orientation.y,
         o.pose.pose.orientation.z, o.pose.pose.orientation.w) = q
        self.odom_pub.publish(o)

def main():
    rclpy.init(); rclpy.spin(Base())`,
          },
          check: 'Drive with `ros2 run teleop_twist_keyboard teleop_twist_keyboard`; in RViz2 (Fixed Frame `odom`) the base_link axes move the way the rover does.',
        },
        {
          title: 'Tell ROS where the LiDAR is mounted',
          body: [
            'SLAM needs the exact offset from the centre of the wheel axle (base_link) to the LiDAR (laser). Measure it with a ruler and publish it as a static transform.',
          ],
          code: {
            lang: 'bash',
            code: `# LiDAR 8 cm in front of the axle and 15 cm up
ros2 run tf2_ros static_transform_publisher \\
  --x 0.08 --y 0 --z 0.15 --frame-id base_link --child-frame-id laser`,
          },
          check: '`ros2 run tf2_tools view_frames` produces a tree: odom → base_link → laser.',
        },
        {
          title: 'Map the room with Cartographer',
          body: [
            'Cartographer matches each LiDAR scan against the map it is building, correcting the drift in wheel odometry. Create the configuration below, launch it, then drive slowly around the room, closing at least one loop.',
          ],
          code: {
            lang: 'lua',
            file: 'config/rover_2d.lua',
            code: `include "map_builder.lua"
include "trajectory_builder.lua"

options = {
  map_builder = MAP_BUILDER,
  trajectory_builder = TRAJECTORY_BUILDER,
  map_frame = "map",
  tracking_frame = "base_link",
  published_frame = "odom",
  odom_frame = "odom",
  provide_odom_frame = false,
  publish_frame_projected_to_2d = true,
  use_odometry = true,
  use_nav_sat = false,
  use_landmarks = false,
  num_laser_scans = 1,
  num_multi_echo_laser_scans = 0,
  num_subdivisions_per_laser_scan = 1,
  num_point_clouds = 0,
  lookup_transform_timeout_sec = 0.2,
  submap_publish_period_sec = 0.3,
  pose_publish_period_sec = 5e-3,
  trajectory_publish_period_sec = 30e-3,
  rangefinder_sampling_ratio = 1.,
  odometry_sampling_ratio = 1.,
  fixed_frame_pose_sampling_ratio = 1.,
  imu_sampling_ratio = 1.,
  landmarks_sampling_ratio = 1.,
}

MAP_BUILDER.use_trajectory_builder_2d = true
TRAJECTORY_BUILDER_2D.use_imu_data = false
TRAJECTORY_BUILDER_2D.min_range = 0.15
TRAJECTORY_BUILDER_2D.max_range = 12.0
TRAJECTORY_BUILDER_2D.use_online_correlative_scan_matching = true
POSE_GRAPH.optimize_every_n_nodes = 30

return options`,
          },
        },
        {
          title: 'Run Cartographer and save the map',
          body: [
            'Start the SLAM node and the occupancy-grid node, drive the rover with teleop, then save the finished map. You get lab.pgm (the image) and lab.yaml (resolution and origin).',
          ],
          code: {
            lang: 'bash',
            code: `sudo apt install -y ros-humble-cartographer-ros ros-humble-nav2-map-server
ros2 run cartographer_ros cartographer_node \\
  -configuration_directory ~/rover_ws/src/rover_base/config \\
  -configuration_basename rover_2d.lua &
ros2 run cartographer_ros cartographer_occupancy_grid_node -resolution 0.05 &

ros2 run teleop_twist_keyboard teleop_twist_keyboard   # drive slowly, ~0.15 m/s
ros2 run nav2_map_server map_saver_cli -f ~/maps/lab`,
          },
          check: 'The /map display in RViz2 shows crisp, straight walls with no doubled outlines; ~/maps/lab.pgm opens as a clean floor plan.',
        },
        {
          title: 'Autonomous navigation with Nav2',
          body: [
            'Nav2 localises the rover on the saved map (AMCL), plans a global path, and runs a local controller that steers around obstacles the LiDAR sees that are not on the map, such as a student stepping in front of it.',
            'In RViz2, click 2D Pose Estimate and drag where the rover really is, then click Nav2 Goal and pick a destination.',
          ],
          code: {
            lang: 'bash',
            code: `sudo apt install -y ros-humble-navigation2 ros-humble-nav2-bringup
ros2 launch nav2_bringup bringup_launch.py \\
  map:=$HOME/maps/lab.yaml use_sim_time:=false

# Laptop
ros2 launch nav2_bringup rviz_launch.py`,
          },
          check: 'Send a goal across the room and place a box in the path: the rover replans around it and stops within 10 cm of the goal.',
        },
      ],
    },
  },

  /* ------------------------------------------------------------------ */
  {
    id: 'drone-telemetry',
    slug: 'aerial-survey-drone',
    title: 'Autonomous Aerial Survey Drone',
    category: 'Aero & Autonomous Flight',
    studentGrade: 'Grade 9–11',
    complexity: 'Advanced',
    duration: '6–8 weeks',
    bgColor: 'bg-[#ff5400]',
    textColor: 'text-white',
    mutedColor: 'text-white/80',
    borderColor: 'border-[#111]',
    shadowColor: 'shadow-[8px_8px_0px_#111]',
    description:
      'Custom carbon-fiber drone with ArduPilot flight controllers, real-time GPS telemetry, geofence fail-safe, and autonomous agricultural survey logging.',
    techStack: ['ArduPilot', 'Mission Planner', 'MAVLink', 'Optical Flow'],
    telemetryMetrics: [
      { label: 'Range', val: '3.5 km' },
      { label: 'Stability', val: '±0.5 m' },
      { label: 'Payload', val: '750 g' },
    ],
    handwrittenNote: 'Full autonomous waypoint flight',
    blueprint: {
      drawingNo: 'RDX-UAV-02',
      nodes: [
        { id: 'gps', label: 'M10 GPS + Compass', sub: 'mast-mounted', x: 30, y: 40 },
        { id: 'fc', label: 'Pixhawk 6C', sub: 'ArduCopter 4.x', x: 310, y: 170, w: 180, accent: true },
        { id: 'rx', label: 'RC Receiver', sub: 'iBUS / SBUS', x: 600, y: 40 },
        { id: 'flow', label: 'Optical Flow', sub: '+ rangefinder', x: 30, y: 200 },
        { id: 'tele', label: 'SiK Telemetry', sub: 'MAVLink radio', x: 600, y: 200 },
        { id: 'batt', label: '4S LiPo 14.8 V', sub: '5200 mAh', x: 30, y: 360 },
        { id: 'pm', label: 'Power Module', sub: 'V/I sensing', x: 310, y: 360, w: 180 },
        { id: 'esc', label: '4× ESC + Motors', sub: '30 A · 920 KV', x: 600, y: 360 },
      ],
      edges: [
        { from: 'gps', to: 'fc', label: 'GPS1 · UART + I²C' },
        { from: 'rx', to: 'fc', label: 'RCIN' },
        { from: 'flow', to: 'fc', label: 'I²C / UART' },
        { from: 'tele', to: 'fc', label: 'TELEM1 · 57600' },
        { from: 'fc', to: 'esc', label: 'MAIN OUT 1–4 · PWM' },
        { from: 'pm', to: 'fc', label: 'POWER1 · 5.3 V + sense', power: true },
        { from: 'batt', to: 'pm', label: '14.8 V', power: true },
        { from: 'pm', to: 'esc', label: 'PDB 14.8 V', power: true },
      ],
      wiring: [
        { from: 'GPS/compass connector', to: 'Pixhawk GPS1', signal: 'UART (GPS) + I²C (compass), arrow facing forward' },
        { from: 'RC receiver iBUS/SBUS', to: 'Pixhawk RCIN', signal: 'Single-wire serial RC input' },
        { from: 'SiK air radio', to: 'Pixhawk TELEM1', signal: 'MAVLink 2 @ 57600 baud' },
        { from: 'Optical flow + rangefinder', to: 'Pixhawk I²C / TELEM2', signal: 'Position hold without GPS (indoors / low altitude)' },
        { from: 'Power module', to: 'Pixhawk POWER1', signal: '5.3 V supply + battery voltage/current sense' },
        { from: 'ESC 1–4 signal', to: 'Pixhawk MAIN OUT 1–4', signal: 'Motor 1 front-right, 2 rear-left, 3 front-left, 4 rear-right' },
        { from: 'Battery XT60', to: 'Power module → PDB', signal: '14.8 V to all four ESCs' },
      ],
      bom: [
        { part: '450 mm quad frame', qty: 1, spec: 'Carbon-fibre arms, integrated PDB' },
        { part: 'Pixhawk 6C flight controller', qty: 1, spec: 'ArduCopter 4.x, with power module' },
        { part: 'M10 GPS with compass', qty: 1, spec: 'On a folding mast, away from power wires' },
        { part: '2212 brushless motors', qty: 4, spec: '920 KV, 2× CW + 2× CCW' },
        { part: 'ESCs', qty: 4, spec: '30 A, BLHeli, 4S rated' },
        { part: 'Propellers', qty: 8, spec: '1045 (10×4.5), 2 sets of CW/CCW pairs' },
        { part: '4S LiPo battery', qty: 2, spec: '14.8 V, 5200 mAh, XT60' },
        { part: 'RC transmitter + receiver', qty: 1, spec: '6+ channels, iBUS/SBUS output' },
        { part: 'SiK telemetry radio pair', qty: 1, spec: 'Use a band licensed for your region' },
        { part: 'Optical flow + lidar rangefinder', qty: 1, spec: 'e.g. Matek 3901-L0X' },
      ],
    },
    guide: {
      prerequisites: [
        'Windows laptop for Mission Planner (or QGroundControl on macOS/Linux)',
        'Soldering iron with a fine tip for motor and ESC leads',
        'An open, legal flying field. In India, check the Digital Sky airspace map (green zone) and the Drone Rules, 2021 before every flight.',
      ],
      safety: [
        'Remove all propellers for every bench test, firmware flash and calibration.',
        'Always fly with a second student as spotter, and keep the RC transmitter as the primary failsafe.',
        'Retire any LiPo that is puffed, damaged or below 3.0 V per cell.',
      ],
      steps: [
        {
          title: 'Assemble the frame and set motor directions',
          body: [
            'Mount the motors and solder the ESCs to the frame PDB. ArduPilot Quad-X numbering is: Motor 1 front-right (CCW), Motor 2 rear-left (CCW), Motor 3 front-left (CW), Motor 4 rear-right (CW).',
            'Mount the Pixhawk at the centre of gravity on vibration-damping pads, arrow facing forward, and put the GPS mast as far from power wiring as possible.',
          ],
          check: 'The frame balances level when lifted by the centre plate with the battery installed.',
        },
        {
          title: 'Flash ArduCopter and set the frame type',
          body: [
            'Connect the Pixhawk over USB, open Mission Planner → Setup → Install Firmware and choose the Quad image. Then set the frame parameters in Config → Full Parameter List.',
          ],
          code: {
            lang: 'text',
            file: 'Parameters',
            code: `FRAME_CLASS   1    # Quad
FRAME_TYPE    1    # X
SERIAL1_BAUD  57   # TELEM1 at 57600 for the SiK radio
SERIAL1_PROTOCOL 2 # MAVLink 2`,
          },
        },
        {
          title: 'Mandatory hardware calibration',
          body: [
            'Work through Setup → Mandatory Hardware in order: Accel Calibration (six orientations), Compass (rotate the drone on all axes until the bars fill), Radio Calibration (move every stick and switch to its limits), ESC Calibration, and Flight Modes.',
            'Recommended 3-position flight-mode switch: Stabilize, Loiter, RTL. Put Auto on a separate switch.',
          ],
          check: 'In the HUD, tilting the drone tilts the artificial horizon the same way, and the heading matches a phone compass within 10°.',
        },
        {
          title: 'Failsafes and geofence',
          body: [
            'These parameters make the drone return home or land on its own if the radio link drops, the battery runs low, or it drifts outside a safe cylinder around the launch point.',
          ],
          code: {
            lang: 'text',
            file: 'Parameters',
            code: `FS_THR_ENABLE     1     # RC loss → RTL
FS_GCS_ENABLE     1     # telemetry loss in Auto → RTL
BATT_MONITOR      4     # analog voltage + current
BATT_LOW_VOLT     14.0  # 3.5 V/cell
BATT_FS_LOW_ACT   2     # → RTL
BATT_CRT_VOLT     13.6  # 3.4 V/cell
BATT_FS_CRT_ACT   1     # → Land
FENCE_ENABLE      1
FENCE_TYPE        7     # max altitude + circle + polygon
FENCE_ALT_MAX     60    # metres
FENCE_RADIUS      150   # metres
FENCE_ACTION      1     # RTL or Land
RTL_ALT           2500  # cm`,
          },
          check: 'With props off and the drone armed, switching the transmitter off makes Mission Planner report "Radio failsafe" and the mode changes to RTL.',
        },
        {
          title: 'Motor test and first hover',
          body: [
            'With props off, use Setup → Optional Hardware → Motor Test: motors must spin in the order A, B, C, D (front-right, then clockwise around) and in the right direction. Swap any two ESC wires to reverse a motor.',
            'Fit props, take off in Stabilize to about 2 m, then switch to Loiter. The drone should hold position. Run AutoTune (flight mode 15) on a calm day for crisp, stable control.',
          ],
          check: 'In Loiter, the drone holds within about ±0.5 m with hands off the sticks for 30 seconds.',
        },
        {
          title: 'Plan an autonomous survey mission',
          body: [
            'In the Plan tab, draw a polygon around the field (right-click → Draw Polygon), then right-click → Auto WP → Survey (Grid). Set altitude 40 m, speed 5 m/s and 70 % front / 60 % side overlap for mapping photos.',
            'Write the waypoints to the drone, take off in Loiter, then switch to Auto. It flies the lawn-mower pattern and returns home.',
          ],
          check: 'The flown path in the Mission Planner map overlays the planned grid, and RTL lands within 2 m of the launch point.',
        },
        {
          title: 'Log live telemetry with Python and MAVLink',
          body: [
            'Plug the ground SiK radio into a laptop. This script reads position and battery data from the MAVLink stream and writes a CSV log of the flight, ready for plotting.',
          ],
          code: {
            lang: 'python',
            file: 'telemetry_log.py',
            code: `import csv, time
from pymavlink import mavutil   # pip install pymavlink

link = mavutil.mavlink_connection('/dev/ttyUSB0', baud=57600)  # COM5 on Windows
link.wait_heartbeat()
print('Connected to system', link.target_system)

with open(f'flight_{int(time.time())}.csv', 'w', newline='') as f:
    log = csv.writer(f)
    log.writerow(['t', 'lat', 'lon', 'alt_m', 'volts', 'amps'])
    volts = amps = 0.0
    while True:
        msg = link.recv_match(type=['GLOBAL_POSITION_INT', 'SYS_STATUS'], blocking=True)
        if msg.get_type() == 'SYS_STATUS':
            volts, amps = msg.voltage_battery / 1000, msg.current_battery / 100
        else:
            log.writerow([time.time(), msg.lat / 1e7, msg.lon / 1e7,
                          msg.relative_alt / 1000, volts, amps])`,
          },
          check: 'The CSV fills at several rows per second during flight; plotting lat/lon reproduces the survey grid.',
        },
      ],
    },
  },

  /* ------------------------------------------------------------------ */
  {
    id: 'gesture-arm',
    slug: 'vision-robotic-arm',
    title: '6-DOF Vision Robotic Arm',
    category: 'Manipulators & Kinematics',
    studentGrade: 'Grade 9–12',
    complexity: 'Advanced',
    duration: '5–7 weeks',
    bgColor: 'bg-white',
    textColor: 'text-[#111]',
    mutedColor: 'text-[#646a73]',
    borderColor: 'border-[#111]',
    shadowColor: 'shadow-[8px_8px_0px_#111]',
    description:
      'Real-time hand-pose tracking through HD camera translating finger joint coordinates into inverse kinematics for a 6-axis robotic arm.',
    techStack: ['OpenCV', 'MediaPipe AI', 'IK Kinematics', 'ESP-NOW'],
    telemetryMetrics: [
      { label: 'Freedom', val: '6-Axis' },
      { label: 'Latency', val: '< 18 ms' },
      { label: 'Payload', val: '1.2 kg' },
    ],
    handwrittenNote: 'Hand gestures control the arm!',
    blueprint: {
      drawingNo: 'RDX-ARM-03',
      nodes: [
        { id: 'cam', label: 'HD Webcam', sub: '1080p · 30 fps', x: 30, y: 40 },
        { id: 'pc', label: 'Laptop', sub: 'MediaPipe · IK', x: 310, y: 40, w: 180, accent: true },
        { id: 'tx', label: 'ESP32 Bridge', sub: 'USB → ESP-NOW', x: 600, y: 40 },
        { id: 'rx', label: 'ESP32 Arm', sub: 'ESP-NOW receiver', x: 600, y: 200 },
        { id: 'pca', label: 'PCA9685', sub: '16-ch PWM', x: 310, y: 200, w: 180 },
        { id: 'servo', label: '6× Servos', sub: '3× MG996R · 3× MG90S', x: 30, y: 200 },
        { id: 'psu', label: '6 V 10 A PSU', sub: 'servo power', x: 310, y: 360, w: 180 },
      ],
      edges: [
        { from: 'cam', to: 'pc', label: 'USB video' },
        { from: 'pc', to: 'tx', label: 'USB · 6 angles' },
        { from: 'tx', to: 'rx', label: 'ESP-NOW 2.4 GHz' },
        { from: 'rx', to: 'pca', label: 'I²C' },
        { from: 'pca', to: 'servo', label: '50 Hz PWM × 6' },
        { from: 'psu', to: 'pca', label: '6 V V+', power: true },
      ],
      wiring: [
        { from: 'ESP32 (arm) GPIO21 / GPIO22', to: 'PCA9685 SDA / SCL', signal: 'I²C, PCA9685 VCC from ESP32 3.3 V' },
        { from: '6 V 10 A supply', to: 'PCA9685 V+ terminal', signal: 'Servo power only; never through the ESP32' },
        { from: 'Supply GND', to: 'PCA9685 GND + ESP32 GND', signal: 'Common ground is mandatory' },
        { from: 'PCA9685 ch 0–2', to: 'Base, shoulder, elbow servos', signal: 'MG996R (high-torque joints)' },
        { from: 'PCA9685 ch 3–5', to: 'Wrist pitch, wrist roll, gripper', signal: 'MG90S (light joints)' },
        { from: 'ESP32 bridge USB', to: 'Laptop', signal: 'Serial 115200 baud, 8-byte frames' },
      ],
      bom: [
        { part: '6-DOF aluminium arm kit', qty: 1, spec: 'Brackets, base bearing, gripper' },
        { part: 'MG996R servo', qty: 3, spec: '~10 kg·cm at 6 V, metal gears' },
        { part: 'MG90S servo', qty: 3, spec: '~2 kg·cm, metal gears' },
        { part: 'PCA9685 servo driver', qty: 1, spec: '16-channel, 12-bit PWM over I²C' },
        { part: 'ESP32 DevKitC', qty: 2, spec: 'One USB bridge, one on the arm' },
        { part: 'DC power supply', qty: 1, spec: '6 V, 10 A, with 1000 µF capacitor on V+' },
        { part: 'USB webcam', qty: 1, spec: '1080p, 30 fps' },
      ],
    },
    guide: {
      prerequisites: [
        'Python 3.10–3.12 on a laptop with a webcam',
        'Arduino IDE with the ESP32 board package (core 3.x) and the Adafruit PWM Servo Driver library',
        'Know how sine, cosine and atan2 work (the inverse kinematics uses them)',
      ],
      safety: [
        'Keep fingers out of the arm\'s reach while it is powered: MG996R joints pinch hard.',
        'Clamp the base to the desk; a fast shoulder move can tip an unclamped arm.',
        'Always power the servos from the external supply, never from USB.',
      ],
      steps: [
        {
          title: 'Centre every servo before assembly',
          body: [
            'Servos only turn about 180°, so each one must sit at 90° (mid-travel) when its joint is in the neutral pose. Otherwise a joint hits its end stop halfway through a move.',
            'Wire one servo at a time to PCA9685 channel 0, run the sketch below, then attach the horn so the joint points in its neutral direction.',
          ],
          code: {
            lang: 'cpp',
            file: 'center_servos.ino',
            code: `#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>
Adafruit_PWMServoDriver pca;

// 50 Hz → 4096 ticks per 20 ms; 0.5 ms = 102, 2.5 ms = 512
uint16_t angleToTicks(float deg) { return 102 + (uint16_t)(deg / 180.0 * 410); }

void setup() {
  pca.begin();
  pca.setPWMFreq(50);
  for (int ch = 0; ch < 6; ch++) pca.setPWM(ch, 0, angleToTicks(90));
}
void loop() {}`,
          },
          check: 'With the arm assembled and powered, it stands straight up with the gripper half open.',
        },
        {
          title: 'Track the hand with MediaPipe',
          body: [
            'MediaPipe\'s Hand Landmarker returns 21 points per hand, normalised to the image (0–1). Landmark 0 is the wrist, 4 the thumb tip and 8 the index fingertip.',
            'Download the model file `hand_landmarker.task` from the MediaPipe Hand Landmarker page into the project folder.',
          ],
          code: {
            lang: 'python',
            file: 'hand_track.py',
            code: `# pip install mediapipe opencv-python pyserial
import time, cv2, mediapipe as mp
from mediapipe.tasks.python import BaseOptions, vision

landmarker = vision.HandLandmarker.create_from_options(vision.HandLandmarkerOptions(
    base_options=BaseOptions(model_asset_path='hand_landmarker.task'),
    running_mode=vision.RunningMode.VIDEO, num_hands=1))

cap = cv2.VideoCapture(0)
while cap.isOpened():
    ok, frame = cap.read()
    if not ok:
        break
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = landmarker.detect_for_video(
        mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb), int(time.monotonic() * 1000))
    if result.hand_landmarks:
        wrist = result.hand_landmarks[0][0]
        cv2.circle(frame, (int(wrist.x * frame.shape[1]), int(wrist.y * frame.shape[0])),
                   10, (0, 84, 255), -1)
    cv2.imshow('hand', frame)
    if cv2.waitKey(1) == 27:   # Esc quits
        break`,
          },
          check: 'An orange dot follows your wrist smoothly on screen.',
        },
        {
          title: 'Inverse kinematics: target point → joint angles',
          body: [
            'Map the wrist position in the image to a target point in front of the arm, then solve for the joint angles. The base rotates toward the target (atan2), and the shoulder and elbow form a two-link planar arm solved with the law of cosines.',
            'A single webcam has no true depth, so the apparent hand size (wrist to middle-finger knuckle) stands in for distance. The pinch distance between thumb tip (4) and index tip (8) opens and closes the gripper.',
            'IK angles are geometric. Convert each one to a servo angle by adding that joint’s mounting offset (noted when you centred the servos), and use 180 − angle for any servo mounted mirrored.',
          ],
          code: {
            lang: 'python',
            file: 'ik.py',
            code: `import math

L1, L2 = 0.105, 0.098   # shoulder→elbow, elbow→wrist (metres): measure your arm

def solve(x, y, z):
    """Target in metres, arm base at origin, z up. Returns degrees (base, shoulder, elbow)."""
    base = math.atan2(y, x)
    r = math.hypot(x, y)
    d = (r * r + z * z - L1 * L1 - L2 * L2) / (2 * L1 * L2)
    d = max(-1.0, min(1.0, d))          # clamp unreachable targets to the edge of reach
    elbow = math.acos(d)
    shoulder = math.atan2(z, r) + math.atan2(L2 * math.sin(elbow), L1 + L2 * math.cos(elbow))
    return math.degrees(base), math.degrees(shoulder), math.degrees(elbow)

def hand_to_target(lm):
    """Normalised MediaPipe landmarks → target point and gripper angle."""
    size = math.dist((lm[0].x, lm[0].y), (lm[9].x, lm[9].y))   # bigger = closer to camera
    x = 0.08 + min(size / 0.3, 1) * 0.10     # hand closer → reach further
    y = (0.5 - lm[0].x) * 0.20               # left/right
    z = 0.02 + (1 - lm[0].y) * 0.15          # hand higher → wrist higher
    pinch = math.dist((lm[4].x, lm[4].y), (lm[8].x, lm[8].y))
    gripper = 30 + min(pinch / 0.15, 1) * 60
    return (x, y, z), gripper`,
          },
          check: '`solve(0.15, 0, 0.05)` returns a base angle of 0° and shoulder/elbow angles that, set by hand on the arm, put the wrist at that point.',
        },
        {
          title: 'Send the angles to the arm',
          body: [
            'Each frame, the laptop sends an 8-byte frame to the bridge ESP32: header 0xAA, six angles (0–180) and a checksum. Smoothing with an exponential moving average removes camera jitter without adding noticeable lag.',
          ],
          code: {
            lang: 'python',
            file: 'send.py',
            code: `import serial, struct
port = serial.Serial('/dev/ttyUSB0', 115200)   # COM port on Windows
smooth = [90.0] * 6
ALPHA = 0.35                                   # 0 = frozen, 1 = no smoothing

def send(angles):
    for i, a in enumerate(angles):
        smooth[i] += ALPHA * (max(0, min(180, a)) - smooth[i])
    body = bytes(int(a) for a in smooth)
    port.write(struct.pack('B', 0xAA) + body + struct.pack('B', sum(body) & 0xFF))`,
          },
        },
        {
          title: 'ESP-NOW bridge and arm firmware',
          body: [
            'The bridge forwards each frame over ESP-NOW, a direct radio link that needs no Wi-Fi router and delivers packets in a few milliseconds. Flash the receiver first and note the MAC address it prints, then paste it into the bridge sketch.',
          ],
          code: {
            lang: 'cpp',
            file: 'arm_receiver.ino',
            code: `#include <WiFi.h>
#include <esp_now.h>
#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>
Adafruit_PWMServoDriver pca;

uint16_t angleToTicks(uint8_t deg) { return 102 + deg * 410 / 180; }

// ESP32 Arduino core 3.x callback signature
void onRecv(const esp_now_recv_info_t *info, const uint8_t *d, int len) {
  if (len != 8 || d[0] != 0xAA) return;
  uint8_t sum = 0;
  for (int i = 1; i < 7; i++) sum += d[i];
  if (sum != d[7]) return;                       // corrupted frame
  for (int ch = 0; ch < 6; ch++) pca.setPWM(ch, 0, angleToTicks(d[ch + 1]));
}

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);
  Serial.println(WiFi.macAddress());             // copy into the bridge sketch
  pca.begin(); pca.setPWMFreq(50);
  esp_now_init();
  esp_now_register_recv_cb(onRecv);
}
void loop() {}

/* --- bridge.ino (second ESP32, plugged into the laptop) ---
uint8_t ARM_MAC[] = {0x24, 0x6F, 0x28, 0x00, 0x00, 0x00};   // from the receiver
void setup() {
  Serial.begin(115200); WiFi.mode(WIFI_STA); esp_now_init();
  esp_now_peer_info_t p = {}; memcpy(p.peer_addr, ARM_MAC, 6); esp_now_add_peer(&p);
}
void loop() {
  static uint8_t buf[8]; static int n = 0;
  while (Serial.available()) {
    uint8_t b = Serial.read();
    if (n == 0 && b != 0xAA) continue;
    buf[n++] = b;
    if (n == 8) { esp_now_send(ARM_MAC, buf, 8); n = 0; }
  }
}
*/`,
          },
          check: 'Move your hand left and right in front of the webcam: the base follows; pinch your fingers and the gripper closes.',
        },
        {
          title: 'Measure latency and tune',
          body: [
            'Film the screen and the arm together with a phone at 240 fps slow motion and count frames between your hand moving and the arm moving. Tune ALPHA: lower is smoother, higher is more responsive.',
            'Add soft limits per joint in `send()` (for example, keep the shoulder between 20° and 160°) so the arm can never drive into the table.',
          ],
          check: 'End-to-end delay is under a few camera frames and the arm never collides with its own base.',
        },
      ],
    },
  },

  /* ------------------------------------------------------------------ */
  {
    id: 'smart-agro',
    slug: 'lorawan-agro-hub',
    title: 'LoRaWAN Smart Agro Hub',
    category: 'Industrial IoT & Nodes',
    studentGrade: 'Grade 8–10',
    complexity: 'Intermediate',
    duration: '4–6 weeks',
    bgColor: 'bg-[#111]',
    textColor: 'text-[#f8f7ef]',
    mutedColor: 'text-[#a1a1aa]',
    borderColor: 'border-[#111]',
    shadowColor: 'shadow-[8px_8px_0px_white]',
    description:
      'Solar-powered environmental monitoring network broadcasting soil moisture, NPK indices, and humidity over a 10 km LoRaWAN link with automated micro-drip irrigation.',
    techStack: ['LoRaWAN', 'MicroPython', 'MQTT', 'Grafana'],
    telemetryMetrics: [
      { label: 'Link Range', val: '10+ km' },
      { label: 'Autonomy', val: '24/7' },
      { label: 'Savings', val: '42%' },
    ],
    handwrittenNote: 'Data viz dashboard included',
    blueprint: {
      drawingNo: 'RDX-AGR-04',
      nodes: [
        { id: 'sens', label: 'Field Sensors', sub: 'soil · NPK · SHT31', x: 30, y: 40 },
        { id: 'node', label: 'ESP32 Node', sub: 'MicroPython', x: 30, y: 200, accent: true },
        { id: 'lora', label: 'RAK3172', sub: 'LoRaWAN IN865', x: 310, y: 200, w: 180 },
        { id: 'gw', label: 'Gateway', sub: 'Pi + concentrator', x: 600, y: 200 },
        { id: 'cs', label: 'ChirpStack', sub: 'network server', x: 600, y: 40 },
        { id: 'graf', label: 'InfluxDB + Grafana', sub: 'dashboard', x: 310, y: 40, w: 180 },
        { id: 'solar', label: 'Solar 6 V + 18650', sub: 'CN3791 charger', x: 30, y: 360 },
        { id: 'valve', label: 'Drip Valve', sub: '12 V solenoid', x: 310, y: 360, w: 180 },
      ],
      edges: [
        { from: 'sens', to: 'node', label: 'ADC · RS485 · I²C' },
        { from: 'node', to: 'lora', label: 'UART AT' },
        { from: 'lora', to: 'gw', label: '865 MHz radio' },
        { from: 'gw', to: 'cs', label: 'UDP / MQTT' },
        { from: 'cs', to: 'graf', label: 'InfluxDB' },
        { from: 'node', to: 'valve', label: 'GPIO → MOSFET' },
        { from: 'solar', to: 'node', label: '3.7 V → 3.3 V', power: true },
      ],
      wiring: [
        { from: 'Capacitive soil sensor AOUT', to: 'ESP32 GPIO34 (ADC1)', signal: 'Analog 0–3.3 V; ADC1 still works with radio on' },
        { from: 'SHT31 SDA / SCL', to: 'ESP32 GPIO21 / GPIO22', signal: 'I²C temperature + humidity' },
        { from: 'MAX485 RO / DI', to: 'ESP32 GPIO16 / GPIO17', signal: 'UART2, 9600 baud Modbus RTU' },
        { from: 'MAX485 DE + RE', to: 'ESP32 GPIO4', signal: 'High = transmit, low = receive' },
        { from: 'MAX485 A / B', to: 'NPK sensor A / B', signal: 'RS485 pair (sensor powered from 12 V)' },
        { from: 'RAK3172 TX / RX', to: 'ESP32 GPIO26 / GPIO25', signal: 'UART1, 115200 baud AT commands' },
        { from: 'ESP32 GPIO27', to: 'Logic-level MOSFET gate', signal: 'Switches the 12 V drip solenoid; 10 kΩ gate pull-down keeps it shut in deep sleep, flyback diode across coil' },
      ],
      bom: [
        { part: 'ESP32-WROOM module board', qty: 1, spec: 'Low-quiescent board for deep sleep' },
        { part: 'RAK3172 LoRaWAN module', qty: 1, spec: 'STM32WLE5, IN865 band, RUI3 AT firmware' },
        { part: 'Capacitive soil moisture sensor v2.0', qty: 1, spec: 'Corrosion-resistant, analog output' },
        { part: 'RS485 soil NPK sensor', qty: 1, spec: 'Modbus RTU, 9600 baud' },
        { part: 'MAX485 module', qty: 1, spec: 'RS485 ↔ UART transceiver' },
        { part: 'SHT31 sensor', qty: 1, spec: 'Temperature + humidity, I²C' },
        { part: 'Solar panel + CN3791 charger', qty: 1, spec: '6 V 3 W panel, MPPT Li-ion charger' },
        { part: '18650 Li-ion cells', qty: 2, spec: '3000 mAh, in parallel with protection' },
        { part: '12 V drip solenoid valve + MOSFET', qty: 1, spec: 'Normally closed, IRLZ44N + 1N4007' },
        { part: 'LoRaWAN gateway', qty: 1, spec: 'Raspberry Pi 4 + RAK5146 / SX1302 concentrator' },
        { part: 'IP65 enclosure', qty: 1, spec: 'With cable glands for sensor leads' },
      ],
    },
    guide: {
      prerequisites: [
        'Thonny IDE and MicroPython firmware for the ESP32',
        'A Raspberry Pi 4 with Docker installed for the gateway and server',
        'Basic electronics: multimeter, breadboard, crimping',
      ],
      safety: [
        'Keep all mains-powered equipment (pump controllers) out of student builds: this project uses 12 V only.',
        'Seal every outdoor connection: moisture inside the enclosure corrodes boards within weeks.',
        'Use only the IN865 band (865–867 MHz) in India; other bands are not licence-exempt.',
      ],
      steps: [
        {
          title: 'Set up the gateway and ChirpStack',
          body: [
            'LoRaWAN is a star-of-stars network: every node talks to one or more gateways, which forward packets to a network server. ChirpStack is a free, open-source network server that runs in Docker on the same Raspberry Pi as the gateway.',
            'After cloning, edit configuration/chirpstack/chirpstack.toml so enabled_regions includes "in865", and point the gateway bridge at the in865 region. Then open http://<pi-ip>:8080 (default login admin / admin, change it immediately).',
          ],
          code: {
            lang: 'bash',
            code: `git clone https://github.com/chirpstack/chirpstack-docker.git
cd chirpstack-docker
docker compose up -d`,
          },
          check: 'The gateway appears in ChirpStack with a green "last seen" time under Gateways.',
        },
        {
          title: 'Register the node',
          body: [
            'In ChirpStack, create a Device Profile (Region IN865, LoRaWAN 1.0.3, OTAA, Class A), an Application, and a Device. Copy the module\'s DevEUI (printed by `AT+DEVEUI=?`), generate an AppKey, and paste both into ChirpStack.',
          ],
        },
        {
          title: 'Wire and test the sensors',
          body: [
            'Wire the node as in the blueprint. The NPK sensor speaks Modbus RTU: you send an 8-byte request and it answers with the register value. The CRC is computed in code so you can read any register.',
          ],
          code: {
            lang: 'python',
            file: 'sensors.py',
            code: `from machine import ADC, Pin, UART, I2C
import time

soil = ADC(Pin(34)); soil.atten(ADC.ATTN_11DB)
DRY, WET = 3200, 1300           # calibrate: reading in dry air vs. in a glass of water
rs485 = UART(2, 9600, tx=17, rx=16)
de = Pin(4, Pin.OUT, value=0)
i2c = I2C(0, scl=Pin(22), sda=Pin(21))

def crc16(buf):
    crc = 0xFFFF
    for b in buf:
        crc ^= b
        for _ in range(8):
            crc = (crc >> 1) ^ 0xA001 if crc & 1 else crc >> 1
    return bytes([crc & 0xFF, crc >> 8])

def modbus_read(reg):
    req = bytes([0x01, 0x03, reg >> 8, reg & 0xFF, 0x00, 0x01])
    de.value(1); rs485.write(req + crc16(req)); time.sleep_ms(10); de.value(0)
    time.sleep_ms(100)
    resp = rs485.read()
    return (resp[3] << 8 | resp[4]) if resp and len(resp) >= 7 else 0

def soil_percent():
    raw = sum(soil.read() for _ in range(16)) // 16
    return max(0, min(100, (DRY - raw) * 100 // (DRY - WET)))

def sht31():
    i2c.writeto(0x44, b'\\x24\\x00'); time.sleep_ms(20)
    d = i2c.readfrom(0x44, 6)
    t = -45 + 175 * (d[0] << 8 | d[1]) / 65535
    h = 100 * (d[3] << 8 | d[4]) / 65535
    return t, h

def read_all():
    t, h = sht31()
    n, p, k = modbus_read(0x1E), modbus_read(0x1F), modbus_read(0x20)  # mg/kg
    return soil_percent(), t, h, n, p, k`,
          },
          check: 'In the Thonny shell, `read_all()` returns moisture near 0 % in air and near 100 % in water, plus plausible N, P, K values in potting soil.',
        },
        {
          title: 'Join the network and send readings',
          body: [
            'The RAK3172 handles the whole LoRaWAN stack; MicroPython just sends AT commands over UART. Readings are packed into 12 bytes. Small payloads mean shorter airtime, longer battery life and better range.',
            'Between readings the ESP32 enters deep sleep, drawing microamps, and wakes every 10 minutes. The RAK3172 remembers its session, so it does not need to re-join after each wake.',
          ],
          code: {
            lang: 'python',
            file: 'main.py',
            code: `import machine, struct, time
from machine import UART, Pin
from sensors import read_all

lora = UART(1, 115200, tx=26, rx=25)
valve = Pin(27, Pin.OUT, value=0)

def at(cmd, wait=500):
    lora.write(cmd + '\\r\\n'); time.sleep_ms(wait)
    return (lora.read() or b'').decode()

if machine.reset_cause() != machine.DEEPSLEEP_RESET:      # first boot only
    at('AT+NWM=1'); at('AT+NJM=1'); at('AT+BAND=3')          # LoRaWAN, OTAA, IN865
    at('AT+APPEUI=0000000000000000')
    at('AT+APPKEY=YOUR_32_HEX_CHAR_APPKEY')
    at('AT+JOIN=1:0:10:8', wait=10000)

m, t, h, n, p, k = read_all()
payload = struct.pack('>HhHHHH', int(m * 10), int(t * 100), int(h * 10), n, p, k)
reply = at('AT+SEND=2:' + payload.hex(), wait=6000)       # Class A: downlink arrives here

for line in reply.splitlines():                           # +EVT:RX_1:<rssi>:<snr>:UNICAST:10:0078
    if line.startswith('+EVT:RX_'):
        seconds = int(line.split(':')[-1][:4], 16)
        valve.value(1); time.sleep(seconds); valve.value(0)

machine.deepsleep(10 * 60 * 1000)`,
          },
          check: 'The device\'s Events tab in ChirpStack shows a "join" followed by an "up" every 10 minutes.',
        },
        {
          title: 'Decode the payload in ChirpStack',
          body: [
            'Add this JavaScript codec to the Device Profile (Codec → JavaScript functions). ChirpStack then publishes human-readable values instead of raw bytes.',
          ],
          code: {
            lang: 'javascript',
            file: 'codec.js',
            code: `function decodeUplink(input) {
  var b = input.bytes;
  function u16(i) { return (b[i] << 8) | b[i + 1]; }
  function s16(i) { var v = u16(i); return v > 0x7fff ? v - 0x10000 : v; }
  return {
    data: {
      moisture: u16(0) / 10,
      temperature: s16(2) / 100,
      humidity: u16(4) / 10,
      nitrogen: u16(6),
      phosphorus: u16(8),
      potassium: u16(10)
    }
  };
}`,
          },
        },
        {
          title: 'Automate irrigation',
          body: [
            'A small Python service listens for uplinks over MQTT and, when soil moisture falls below 30 %, queues a downlink telling the node how many seconds to open the valve. The node receives it right after its next uplink.',
            'The thresholds include hysteresis (open below 30 %, stop once above 45 %) so the valve does not chatter around a single value. Over a season, watering only when the soil needs it is where the water savings come from.',
          ],
          code: {
            lang: 'python',
            file: 'irrigate.py',
            code: `# pip install paho-mqtt
import base64, json
import paho.mqtt.client as mqtt

APP_ID = 'your-application-uuid'
OPEN_BELOW, STOP_ABOVE, SECONDS = 30, 45, 120
watering = set()

def on_message(client, _, msg):
    up = json.loads(msg.payload)
    eui, moisture = up['deviceInfo']['devEui'], up['object']['moisture']
    if moisture < OPEN_BELOW or (eui in watering and moisture < STOP_ABOVE):
        watering.add(eui)
        client.publish(f'application/{APP_ID}/device/{eui}/command/down', json.dumps({
            'devEui': eui, 'confirmed': False, 'fPort': 10,
            'data': base64.b64encode(SECONDS.to_bytes(2, 'big')).decode()}))
    else:
        watering.discard(eui)

client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
client.on_message = on_message
client.connect('localhost', 1883)
client.subscribe(f'application/{APP_ID}/device/+/event/up')
client.loop_forever()`,
          },
          check: 'Pull a node\'s sensor out of the soil: within two uplinks the valve clicks open for two minutes.',
        },
        {
          title: 'Dashboard in Grafana',
          body: [
            'In ChirpStack, add the InfluxDB integration to the application so every decoded uplink is stored. In Grafana, add InfluxDB as a data source and build panels for moisture, temperature, humidity and NPK per device.',
            'Add an alert rule on battery voltage or "no data for 1 hour" so a dead node is noticed the same day.',
          ],
          check: 'The dashboard shows a day of readings per node, and watering events are visible as moisture jumps.',
        },
      ],
    },
  },
];

export function getBuild(slug: string) {
  return builds.find((b) => b.slug === slug);
}
