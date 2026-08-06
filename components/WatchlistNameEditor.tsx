"use client";

import { Pencil } from "lucide-react";
import { useState, useTransition } from "react";
import { renameWatchlist } from "@/app/actions/watchlists";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function WatchlistNameEditor({ id, name }: { id: string; name: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [isPending, startTransition] = useTransition();

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setValue(name);
          setEditing(true);
        }}
        className="group flex items-center gap-2"
      >
        <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
        <Pencil className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-9 max-w-xs text-base font-semibold"
        disabled={isPending}
        autoFocus
      />
      <Button
        size="sm"
        disabled={isPending || !value.trim()}
        onClick={() => {
          const formData = new FormData();
          formData.set("id", id);
          formData.set("name", value);
          startTransition(async () => {
            await renameWatchlist(formData);
            setEditing(false);
          });
        }}
      >
        {isPending ? "Saving…" : "Save"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setEditing(false)}
        disabled={isPending}
      >
        Cancel
      </Button>
    </div>
  );
}
