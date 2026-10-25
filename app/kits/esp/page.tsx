import type { Metadata } from "next";
import { LabFrame } from "../LabFrame";

export const metadata: Metadata = {
  title: "ESP Lab | Radix Robotics",
};

export default function EspLabPage() {
  return <LabFrame active="esp" src="/kits/esp/content" title="Radix ESP Lab" />;
}
