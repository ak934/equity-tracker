"use client";

import { useRef, useState } from "react";
import { createWatchlist } from "@/app/actions/watchlists";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateWatchlistForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [value, setValue] = useState("");

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        const name = String(formData.get("name") ?? "").trim();
        if (!name) return;
        await createWatchlist(formData);
        formRef.current?.reset();
        setValue("");
      }}
      className="flex gap-2"
    >
      <Input
        name="name"
        placeholder="Watchlist name"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        required
        className="max-w-xs"
      />
      <Button type="submit">New Watchlist</Button>
    </form>
  );
}
