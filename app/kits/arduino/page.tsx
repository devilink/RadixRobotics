import type { Metadata } from "next";
import { LabFrame } from "../LabFrame";

export const metadata: Metadata = {
  title: "Arduino Lab | Radix Robotics",
};

export default function ArduinoLabPage() {
  return <LabFrame active="arduino" src="/kits/arduino/content" title="Radix Arduino Lab" />;
}
