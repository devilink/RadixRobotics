import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Leadership & Team",
  description: "Meet the engineers, educators, and visionaries dedicated to democratizing robotics education at Radix Robotics.",
  alternates: { canonical: "https://radixrobotics.com/team" },
};

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
