import type { Metadata } from "next";
import { LabFrame } from "./LabFrame";

export const metadata: Metadata = {
  title: "Starter Kit Projects | Radix Robotics",
};

export default function KitsPage() {
  return <LabFrame active="kit" src="/kits/content" title="Radix Starter Kit Projects" />;
}
