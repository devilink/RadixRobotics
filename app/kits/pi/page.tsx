import type { Metadata } from "next";
import { LabFrame } from "../LabFrame";

export const metadata: Metadata = {
  title: "Raspberry Pi Lab | Radix Robotics",
};

export default function PiLabPage() {
  return <LabFrame active="pi" src="/kits/pi/content" title="Radix Raspberry Pi Lab" />;
}
