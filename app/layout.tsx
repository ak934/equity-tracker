import { ClerkProvider, Show } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AnalysisNotifications } from "@/components/analysis-notifications";
import { NavBar } from "@/components/NavBar";
import { THEME_STORAGE_KEY } from "@/components/ThemeToggle";
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

const noFlashThemeScript = `
(function () {
  try {
    var stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    var dark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {}
})();
`;

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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashThemeScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ClerkProvider appearance={{ theme: shadcn }}>
          <NavBar timezone={timezone} />
          <div className="flex-1">{children}</div>
          <Show when="signed-in">
            <AnalysisNotifications />
          </Show>
        </ClerkProvider>
      </body>
    </html>
  );
}