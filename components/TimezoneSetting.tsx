"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { setTimezone } from "@/app/actions/timezone";

const TIMEZONES =
  typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : ["UTC"];

// Analysis timestamps are rendered server-side, which otherwise silently
// uses the server's own timezone rather than the viewer's. Asks once (when
// no preference is stored yet) and stays available afterward to change it.
export function TimezoneSetting({ currentTimezone }: { currentTimezone: string | null }) {
  const [editing, setEditing] = useState(currentTimezone === null);
  const [selected, setSelected] = useState(currentTimezone ?? "UTC");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (currentTimezone !== null) return;
    // The server can't know the visitor's real timezone, so this has to
    // read it from the browser once mounted rather than during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, [currentTimezone]);

  const save = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("timezone", selected);
      await setTimezone(formData);
      setEditing(false);
      router.refresh();
    });
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setSelected(currentTimezone ?? "UTC");
          setEditing(true);
        }}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        🕐 {currentTimezone}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      {currentTimezone === null && (
        <span className="text-muted-foreground">
          What timezone are you in? So analysis times show correctly.
        </span>
      )}
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        disabled={isPending}
        className="rounded border border-input bg-transparent px-1.5 py-1 text-xs text-foreground"
      >
        {TIMEZONES.map((tz) => (
          <option key={tz} value={tz}>
            {tz}
          </option>
        ))}
      </select>
      <Button type="button" size="xs" onClick={save} disabled={isPending}>
        {isPending ? "Saving…" : "Save"}
      </Button>
      {currentTimezone !== null && (
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
