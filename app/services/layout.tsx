import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Services & Lab Packages",
  description: "Explore our detailed STEM services, lab packages, AI arenas, and NEP 2020 curriculum for schools.",
  alternates: { canonical: "https://radixrobotics.com/services" },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
