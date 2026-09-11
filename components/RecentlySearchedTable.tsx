import Link from "next/link";
import { Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StockWatchlistStatus } from "@/components/StockWatchlistStatus";
import { AddSearchResultToWatchlist } from "@/components/AddSearchResultToWatchlist";
import { StockLogo } from "@/components/StockLogo";
import { RunAnalysisButton } from "@/components/run-analysis-button";
import { AnalyzingIndicator } from "@/components/analyzing-indicator";
import { isAnalysisRunning } from "@/lib/analysis-status";
import { getLogoAvailability } from "@/lib/logos";
import { deleteRecentSearch } from "@/app/actions/stocks";

export type RecentSearchRow = {
  ticker: string;
  name: string;
  searchedAt: Date;
  stockId: string | null;
  memberIds: string[];
  analysisRunning: boolean;
  analysisStartedAt: Date | null;
  hasAnalysis: boolean;
};

export async function RecentlySearchedTable({
  rows,
  allWatchlists,
  timeZone,
}: {
  rows: RecentSearchRow[];
  allWatchlists: { id: string; name: string }[];
  timeZone: string;
}) {
  const domains = await getLogoAvailability(rows.map((r) => r.ticker));

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticker</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Searched</TableHead>
            <TableHead>Analysis</TableHead>
            <TableHead className="text-right">Watchlist</TableHead>
            <TableHead className="w-0" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.ticker}>
              <TableCell className="font-medium">
                <Link
                  href={`/stocks/${row.ticker}`}
                  className="flex items-center gap-2 hover:text-primary"
                >
                  <StockLogo ticker={row.ticker} hasLogo={domains.get(row.ticker) ?? false} size={20} />
                  {row.ticker}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{row.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {row.searchedAt.toLocaleDateString(undefined, { timeZone })}
              </TableCell>
              <TableCell>
                {row.stockId ? (
                  isAnalysisRunning({
                    analysisRunning: row.analysisRunning,
                    analysisStartedAt: row.analysisStartedAt,
                  }) ? (
                    <AnalyzingIndicator ticker={row.ticker} />
                  ) : (
                    <RunAnalysisButton ticker={row.ticker} hasExistingAnalysis={row.hasAnalysis} />
                  )
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {row.stockId ? (
                  <StockWatchlistStatus
                    stockId={row.stockId}
                    allWatchlists={allWatchlists}
                    memberIds={row.memberIds}
                  />
                ) : (
                  <AddSearchResultToWatchlist
                    ticker={row.ticker}
                    name={row.name}
                    allWatchlists={allWatchlists}
                  />
                )}
              </TableCell>
              <TableCell className="text-right">
                <form action={deleteRecentSearch}>
                  <input type="hidden" name="ticker" value={row.ticker} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${row.ticker}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </form>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
