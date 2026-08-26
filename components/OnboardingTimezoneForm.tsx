"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { setTimezone } from "@/app/actions/timezone";

const TIMEZONES =
  typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : ["UTC"];

export function OnboardingTimezoneForm() {
  const [selected, setSelected] = useState("UTC");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  const save = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("timezone", selected);
      await setTimezone(formData);
      router.push("/");
    });
  };

  return (
    <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm">
      <h1 className="text-lg font-semibold tracking-tight">What timezone are you in?</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        So analysis times and price updates show correctly for you.
      </p>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        disabled={isPending}
        className="mt-4 w-full rounded border border-input bg-transparent px-2.5 py-1.5 text-sm text-foreground"
      >
        {TIMEZONES.map((tz) => (
          <option key={tz} value={tz}>
            {tz}
          </option>
        ))}
      </select>
      <Button type="button" onClick={save} disabled={isPending} className="mt-4 w-full">
        {isPending ? "Saving…" : "Continue"}
      </Button>
    </div>
  );
}
