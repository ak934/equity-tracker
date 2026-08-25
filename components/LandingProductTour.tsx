"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Reveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
        className
      )}
    >
      {children}
    </div>
  );
}

function Step({
  index,
  title,
  description,
  children,
}: {
  index: number;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const reversed = index % 2 === 1;

  return (
    <Reveal
      className={cn(
        "flex flex-col items-center gap-8 md:flex-row md:gap-16",
        reversed && "md:flex-row-reverse"
      )}
    >
      <div className="flex-1 text-center md:text-left">
        <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary/10 font-mono text-sm font-semibold text-primary">
          {index + 1}
        </span>
        <h3 className="mt-3 text-xl font-semibold tracking-tight">{title}</h3>
        <p className="mt-2 text-muted-foreground">{description}</p>
      </div>
      <div className="w-full max-w-sm flex-1">{children}</div>
    </Reveal>
  );
}

export function LandingProductTour() {
  return (
    <section id="tour" className="border-t border-border bg-muted/20 px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <Reveal className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            How it works
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            From ticker to target price in four steps
          </h2>
          <p className="mt-2 text-muted-foreground">
            Here&apos;s what following DoorDash (DASH) looks like.
          </p>
        </Reveal>

        <div className="mt-16 space-y-20">
          <Step
            index={0}
            title="Search any ticker"
            description="Type a company name or symbol — DoorDash, Apple, whatever you're watching — and add it in one click."
          >
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex gap-2">
                <div className="flex h-8 flex-1 items-center rounded-lg border border-input px-2.5 text-sm text-muted-foreground">
                  doordash
                </div>
                <Button size="sm" disabled className="pointer-events-none">
                  Add
                </Button>
              </div>
              <div className="mt-1 overflow-hidden rounded-lg border border-border">
                <div className="flex items-center justify-between gap-3 bg-accent px-2.5 py-1.5 text-sm">
                  <span className="font-medium">DASH</span>
                  <span className="text-muted-foreground">DOORDASH</span>
                </div>
              </div>
            </div>
          </Step>

          <Step
            index={1}
            title="It lands on your dashboard"
            description="See the live price the moment you add it, and kick off an analysis whenever you're ready."
          >
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-[0.65rem] font-semibold text-secondary-foreground">
                    DASH
                  </span>
                  <div>
                    <p className="font-medium">DASH</p>
                    <p className="text-xs text-muted-foreground">DoorDash, Inc.</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono tabular-nums">$184.32</p>
                  <p className="text-xs text-muted-foreground">as of today</p>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <Button size="sm" disabled className="pointer-events-none">
                  Run Analysis
                </Button>
              </div>
            </div>
          </Step>

          <Step
            index={2}
            title="Get an AI-backed verdict"
            description="A buy/hold/avoid call backed by a quality and valuation score, with the reasoning spelled out."
          >
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="flex flex-wrap items-center gap-3 border-b border-border bg-muted/40 px-4 py-2.5">
                <Badge variant="positive" className="px-2.5 py-1 text-sm">
                  Buy
                </Badge>
                <span className="text-xs text-muted-foreground">Analyzed just now</span>
                <div className="ml-auto flex gap-3 text-xs">
                  <span className="text-muted-foreground">
                    Quality <span className="font-mono font-semibold text-foreground">82/100</span>
                  </span>
                  <span className="text-muted-foreground">
                    Valuation <span className="font-mono font-semibold text-foreground">76/100</span>
                  </span>
                </div>
              </div>
              <p className="px-4 py-3 text-sm text-muted-foreground">
                Order volume and ad revenue keep compounding, and margins are inflecting as it
                scales past groceries — growth still looks underpriced at current multiples.
              </p>
            </div>
          </Step>

          <Step
            index={3}
            title="Set a target price"
            description="Tell us what you'd pay, and we'll email you the moment it gets there."
          >
            <div className="space-y-3">
              <div className="rounded-lg border border-border px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Want to set a target price to buy this stock at?
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex h-8 w-28 items-center rounded-lg border border-input px-2.5 font-mono text-sm text-muted-foreground">
                    150.00
                  </div>
                  <Button size="sm" disabled className="pointer-events-none">
                    Set Alert
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
                <Bell className="size-4 shrink-0" />
                <span>
                  We&apos;ll email you when this hits <strong className="font-mono">$150.00</strong>.
                </span>
              </div>
            </div>
          </Step>
        </div>

        <p className="mt-16 text-center text-xs text-muted-foreground">
          Illustrative example — not live data or a real analysis.
        </p>
      </div>
    </section>
  );
}
