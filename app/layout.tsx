import type { Metadata } from "next";
import "./globals.css";



export const metadata: Metadata = {
  title: "RADIX Robotics — Composite Labs for Schools",
  description: "RADIX Robotics installs world-class composite skill laboratories inside schools — empowering students with robotics, AI, and advanced tech education.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Orbitron:wght@500;600;700;800;900&family=DM+Sans:wght@300;400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
