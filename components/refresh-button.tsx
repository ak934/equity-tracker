"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { refreshPrices } from "@/app/actions/refresh-prices";

export function RefreshButton() {
  const [isPending, startTransition] = useTransition();
  const [failed, setFailed] = useState<string[]>([]);

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await refreshPrices();
            setFailed(result.failed);
          })
        }
      >
        {isPending ? "Refreshing…" : "Refresh prices"}
      </Button>
      {failed.length > 0 && (
        <p className="mt-1 text-sm text-destructive">
          Couldn&apos;t fetch prices for: {failed.join(", ")}
        </p>
      )}
    </div>
  );
}
