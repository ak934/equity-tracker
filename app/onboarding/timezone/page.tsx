import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { hasUserTimezone } from "@/lib/user-timezone";
import { OnboardingTimezoneForm } from "@/components/OnboardingTimezoneForm";

export default async function OnboardingTimezonePage() {
  await auth.protect();

  // Already set (e.g. returning user, or this ran once already) — don't
  // ask again, just continue on.
  if (await hasUserTimezone()) {
    redirect("/");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-10">
      <OnboardingTimezoneForm />
    </main>
  );
}
