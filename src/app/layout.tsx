import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aura | Premium Real-time Chat",
  description: "Experience the next level of messaging with high-fidelity UI, real-time gaming, and professional-grade security.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Aura Chat",
  },
  openGraph: {
    title: "Aura | Premium Real-time Chat",
    description: "A professional messaging application with real-time multiplayer gaming and glassmorphic UI.",
    url: "https://my-chat-eta-ten.vercel.app/",
    siteName: "Aura",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 1200,
        alt: "Aura Premium Chat Preview",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aura | Premium Real-time Chat",
    description: "Experience the next level of messaging with Aura.",
    creator: "@aura_chat",
    images: ["/og-image.png"],
  },
  formatDetection: {
    telephone: false,
  },
  themeColor: "#0f172a",
};

import { ThemeProvider } from "@/components/ThemeProvider";
import PWAHandler from "@/components/PWAHandler";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <PWAHandler />
            {children}
          </ThemeProvider>
      </body>
    </html>
  );
}
