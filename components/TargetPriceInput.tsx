"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateTargetPrice } from "@/app/actions/stocks";

export function TargetPriceInput({
  stockId,
  targetPrice,
}: {
  stockId: string;
  targetPrice: number | null;
}) {
  const [value, setValue] = useState(targetPrice != null ? String(targetPrice) : "");
  const [isEditing, setIsEditing] = useState(targetPrice == null);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", stockId);
      formData.set("targetPrice", value);
      await updateTargetPrice(formData);
      setIsEditing(false);
    });
  };

  if (!isEditing) {
    const displayValue = value.trim() ? Number(value) : null;
    return (
      <div className="flex items-center gap-2">
        <span>{displayValue != null && !Number.isNaN(displayValue) ? `$${displayValue.toFixed(2)}` : "—"}</span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setIsEditing(true)}
        >
          Edit
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="—"
        className="w-24"
        disabled={isPending}
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={save}
        disabled={isPending}
      >
        {isPending ? "…" : "Save"}
      </Button>
    </div>
  );
}
