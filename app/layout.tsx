import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, Anton, Condiment, Caveat, Plus_Jakarta_Sans, Silkscreen, Instrument_Serif } from "next/font/google";
import "./globals.css";
import "./styles/fonts.css";
import "./styles/theme.css";
import "./radix-landing.css";
import "./styles/loader.css";
import NavbarWrapper from "@/app/components/NavbarWrapper";
import RouteProgress from "@/app/components/RouteProgress";
import StructuredData from "@/app/components/StructuredData";
import SiteLoader from "@/app/components/SiteLoader";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: '--font-inter' });
// Landing page fonts: self-hosted and preloaded so the hero never waits on a third-party stylesheet.
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], display: 'swap', variable: '--font-jakarta' });
const silkscreen = Silkscreen({ subsets: ["latin"], weight: '700', display: 'swap', variable: '--font-pixel' });
// Fonts used only on inner pages are not preloaded, so they don't compete with the landing page.
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], display: 'swap', variable: '--font-space-grotesk', preload: false });
const anton = Anton({ subsets: ["latin"], weight: '400', display: 'swap', variable: '--font-grotesk', preload: false });
const condiment = Condiment({ subsets: ["latin"], weight: '400', display: 'swap', variable: '--font-condiment', preload: false });
const caveat = Caveat({ subsets: ["latin"], display: 'swap', variable: '--font-caveat', preload: false });
const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: '400', style: ['normal', 'italic'], display: 'swap', variable: '--font-instrument', preload: false });

export const metadata: Metadata = {
  metadataBase: new URL("https://radixrobotics.in"),
  title: {
    default: "RADIX Robotics | Turnkey Composite Skill Labs for Schools",
    template: "%s | RADIX Robotics",
  },
  description:
    "RADIX Robotics provides turnkey composite skill labs for schools. Empower students with robotics, AI, hardware, and advanced STEM education aligned with NEP.",
  keywords: [
    "robotics education",
    "STEM labs India",
    "composite skill labs",
    "school robotics",
    "AI education",
    "NEP 2020",
    "Atal Tinkering Lab",
    "RADIX Robotics",
  ],
  authors: [{ name: "RADIX Robotics", url: "https://radixrobotics.in" }],
  creator: "RADIX Robotics",
  publisher: "RADIX Robotics",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://radixrobotics.in",
    siteName: "RADIX Robotics",
    title: "RADIX Robotics — Composite Skill Labs for Schools",
    description:
      "Turnkey robotics, AI, and drone labs for Indian schools. NEP 2020 compliant. 300+ lesson plans. Resident engineer support.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "RADIX Robotics — Building India's Next Generation of Tech Leaders",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RADIX Robotics — Composite Skill Labs for Schools",
    description:
      "Turnkey robotics, AI, and drone labs for Indian schools. NEP 2020 compliant.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  appleWebApp: {
    capable: true,
    title: "RADIX",
    statusBarStyle: "default",
  },
  alternates: {
    canonical: "https://radixrobotics.in",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets the page extend under the iPhone notch / home indicator; padding uses env(safe-area-inset-*).
  viewportFit: "cover",
  themeColor: "#f1f2f4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} ${inter.variable} ${jakarta.variable} ${silkscreen.variable} ${instrumentSerif.variable} ${spaceGrotesk.variable} ${anton.variable} ${condiment.variable} ${caveat.variable} overflow-x-clip`} suppressHydrationWarning>
        <StructuredData />
        <SiteLoader />
        <RouteProgress />
        <NavbarWrapper />
        {children}
      </body>
    </html>
  );
}
