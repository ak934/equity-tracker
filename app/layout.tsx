import { ClerkProvider, Show } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AnalysisNotifications } from "@/components/analysis-notifications";
import { NavBar } from "@/components/NavBar";
import { getUserTimezone, hasUserTimezone } from "@/lib/user-timezone";
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
  title: "Equity Tracker",
  description: "Track stocks, watchlists, and AI-generated equity analysis.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const timezoneSet = await hasUserTimezone();
  const timezone = timezoneSet ? await getUserTimezone() : null;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ClerkProvider appearance={{ theme: shadcn }}>
          <NavBar timezone={timezone} />
          <div className="flex flex-1 flex-col">{children}</div>
          <Show when="signed-in">
            <AnalysisNotifications />
          </Show>
        </ClerkProvider>
      </body>
    </html>
  );
}