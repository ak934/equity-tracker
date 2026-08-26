import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight, ChevronDown, LineChart } from "lucide-react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LandingProductTour } from "@/components/LandingProductTour";

export default async function Home() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <main className="flex flex-1 flex-col">
        <section className="flex min-h-[85vh] flex-col items-center justify-center px-4 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <LineChart className="size-7" />
          </span>
          <h1 className="mt-6 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            The app that tracks your finances and helps you make investment decisions.
          </h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Follow the stocks you care about, get AI-backed buy/hold/avoid analysis, and get
            notified the moment a price hits your target.
          </p>
          <div className="mt-8">
            <SignUpButton>
              <Button size="lg" className="gap-2 px-6">
                Get Started
                <ArrowRight className="size-4" />
              </Button>
            </SignUpButton>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Already have an account?{" "}
            <SignInButton>
              <button type="button" className="font-medium text-primary hover:underline">
                Sign in
              </button>
            </SignInButton>
          </p>
          <a
            href="#tour"
            className="mt-14 flex flex-col items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            See how it works
            <ChevronDown className="size-4 animate-bounce" />
          </a>
        </section>

        <LandingProductTour />

        <section className="border-t border-border px-4 py-16 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Ready to start tracking?</h2>
          <p className="mt-2 text-muted-foreground">
            It&apos;s free to try — takes less than a minute to add your first stock.
          </p>
          <div className="mt-6">
            <SignUpButton>
              <Button size="lg" className="gap-2 px-6">
                Get Started
                <ArrowRight className="size-4" />
              </Button>
            </SignUpButton>
          </div>
        </section>
      </main>
    );
  }

  redirect("/watchlist");
}