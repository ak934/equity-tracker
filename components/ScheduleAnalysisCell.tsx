"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { setNextAnalysisDate } from "@/app/actions/stocks";

// Answers "when would you like to schedule your next analysis of the
// company" per stock — the daily cron flags the stock for reanalysis once
// this date arrives (see computeDueScheduledAnalyses in lib/digest.ts).
export function ScheduleAnalysisCell({
  stockId,
  nextAnalysisDate,
}: {
  stockId: string;
  nextAnalysisDate: Date | null;
}) {
  const toDateInputValue = (d: Date | null) => (d ? d.toISOString().split("T")[0] : "");

  const [value, setValue] = useState(toDateInputValue(nextAnalysisDate));
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", stockId);
      formData.set("nextAnalysisDate", value);
      await setNextAnalysisDate(formData);
      setIsEditing(false);
    });
  };

  const clear = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", stockId);
      formData.set("nextAnalysisDate", "");
      await setNextAnalysisDate(formData);
      setValue("");
      setIsEditing(false);
    });
  };

  if (nextAnalysisDate && !isEditing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{nextAnalysisDate.toLocaleDateString()}</span>
        <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
          Edit
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={clear} disabled={isPending}>
          Clear
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="date"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-36"
        disabled={isPending}
      />
      <Button type="button" size="sm" onClick={save} disabled={isPending || !value}>
        {isPending ? "Saving…" : "Schedule"}
      </Button>
    </div>
  );
}
