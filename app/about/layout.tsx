import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about the mission, vision, and origin of Radix Robotics. We democratize robotics and STEM education across India.",
  alternates: { canonical: "https://www.radixrobotics.in/about" },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
