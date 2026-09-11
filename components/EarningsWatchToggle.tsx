import { Button } from "@/components/ui/button";
import { setEarningsWatch } from "@/app/actions/stocks";

// Opt-in per stock: once watching, the daily cron looks up the next earnings
// date and any material news (lib/analysis.ts checkEarningsAndNews) and
// flags the stock for reanalysis when either is relevant — see
// app/api/cron/daily-refresh/route.ts.
export function EarningsWatchToggle({
  stockId,
  watching,
  nextEarningsDate,
  earningsCheckedAt,
}: {
  stockId: string;
  watching: boolean;
  nextEarningsDate: Date | null;
  earningsCheckedAt: Date | null;
}) {
  if (!watching) {
    return (
      <form action={setEarningsWatch}>
        <input type="hidden" name="id" value={stockId} />
        <input type="hidden" name="enabled" value="true" />
        <Button type="submit" variant="outline" size="sm">
          Watch for earnings & news
        </Button>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <span>
        Watching for earnings & news
        {nextEarningsDate
          ? ` · Next earnings: ${nextEarningsDate.toLocaleDateString()}`
          : earningsCheckedAt
            ? " · No confirmed earnings date found"
            : " · Checking…"}
      </span>
      <form action={setEarningsWatch}>
        <input type="hidden" name="id" value={stockId} />
        <input type="hidden" name="enabled" value="false" />
        <Button type="submit" variant="ghost" size="sm">
          Unwatch
        </Button>
      </form>
    </div>
  );
}
