"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { refreshPrices } from "@/app/actions/refresh-prices";

export function RefreshButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => refreshPrices())}
    >
      {isPending ? "Refreshing…" : "Refresh prices"}
    </Button>
  );
}
