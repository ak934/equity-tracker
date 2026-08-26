"use client";

import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { LineChart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TimezoneSetting } from "@/components/TimezoneSetting";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/watchlist", label: "My Watchlists" },
  { href: "/queue", label: "Queue" },
  { href: "/analyses", label: "Analyses" },
  { href: "/frameworks", label: "Frameworks" },
  { href: "/alerts", label: "Alerts" },
];

export function NavBar({ timezone }: { timezone: string | null }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <LineChart className="size-4" />
            </span>
            <span className="hidden sm:inline">Equity Tracker</span>
          </Link>
          <Show when="signed-in">
            <nav className="flex items-center gap-1 text-sm font-medium">
              {NAV_LINKS.map((link) => {
                const active = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "rounded-md px-2.5 py-1.5 transition-colors",
                      active
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </Show>
        </div>
        <div className="flex items-center gap-3">
          <Show when="signed-in">
            <TimezoneSetting currentTimezone={timezone} />
          </Show>
          <Show when="signed-out">
            <div className="flex items-center gap-2">
              <SignInButton>
                <Button variant="ghost" size="sm">Sign in</Button>
              </SignInButton>
              <SignUpButton>
                <Button size="sm">Sign up</Button>
              </SignUpButton>
            </div>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>
    </header>
  );
}
