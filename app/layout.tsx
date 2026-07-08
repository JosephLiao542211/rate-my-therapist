import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { helveticaNeue } from "./fonts";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import Navbar from "@/components/Navbar";
import SessionProvider from "@/components/SessionProvider";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: {
    template: "%s | Rate My Therapist",
    default: "Rate My Therapist — Find & Review Therapists Near You",
  },
  description:
    "Read and write honest reviews for therapists and counselors. Find the right mental health professional by specialty, city, and rating.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "https://rate-my-therapist.com"),
  icons: {
    icon: "/favi.png",
  },
  openGraph: {
    siteName: "Rate My Therapist",
    type: "website",
  },
  other: {
    "google-adsense-account": "ca-pub-6765180234514532",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <html lang="en" className={`h-full ${helveticaNeue.variable}`}>
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6765180234514532"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#F7F7F7] text-[#151515]">
        <SessionProvider session={session}>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="bg-[#151515] text-white py-10">
            <div className="max-w-6xl mx-auto px-4 flex flex-col items-center gap-4">
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-400">
                <Link href="/tools" className="hover:text-white transition">Free Tools</Link>
                <Link href="/blog" className="hover:text-white transition">Blog</Link>
                <Link href="/feedback" className="hover:text-white transition">Help/Feedback</Link>
                <Link href="/add-therapist" className="hover:text-white transition">Add a Therapist</Link>
                <Link href="/guidelines" className="hover:text-white transition">Site Guidelines</Link>
                <Link href="/terms" className="hover:text-white transition">Terms &amp; Conditions</Link>
                <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="font-bold text-white tracking-tight text-xs border border-white px-1.5 py-0.5">RMT</span>
                <span>© {new Date().getFullYear()} Rate My Therapist. All Rights Reserved</span>
              </div>
            </div>
          </footer>
        </SessionProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
