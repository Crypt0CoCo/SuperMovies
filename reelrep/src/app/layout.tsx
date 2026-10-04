import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { signOut } from "@/app/actions/auth";
import { currentProfile } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReelRep",
  description: "Film reviews that earn REEL on Base Sepolia testnet",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await currentProfile();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b">
          <nav className="max-w-2xl mx-auto px-8 py-3 flex items-center gap-4 text-sm">
            <Link href="/" className="font-bold text-base">ReelRep</Link>
            <Link href="/search" className="hover:underline">Search</Link>
            <div className="ml-auto flex items-center gap-4">
              {profile ? (
                <>
                  {profile.isModerator && <Link href="/mod" className="hover:underline">Moderation</Link>}
                  <Link href={`/u/${profile.handle}`} className="hover:underline">@{profile.handle}</Link>
                  <form action={signOut}>
                    <button type="submit" className="text-gray-600 hover:underline">Sign out</button>
                  </form>
                </>
              ) : (
                <Link href="/login" className="hover:underline">Sign in</Link>
              )}
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
