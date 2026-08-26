import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge, actionBadgeVariant } from "@/components/ui/badge";
import { StockWatchlistMenu } from "@/components/StockWatchlistMenu";
import { flagForReanalysis } from "@/app/actions/stocks";
import { RunAnalysisButton } from "@/components/run-analysis-button";
import { AnalyzingIndicator } from "@/components/analyzing-indicator";
import { isAnalysisRunning } from "@/lib/analysis-status";
import { formatAnalysisDate } from "@/lib/format-analysis-date";
import type { WatchlistRow } from "@/lib/watchlist-rows";

export function WatchlistStockTable({
  rows,
  allWatchlists,
  timeZone,
  showManagementColumns = true,
}: {
  rows: WatchlistRow[];
  allWatchlists: { id: string; name: string }[];
  timeZone: string;
  showManagementColumns?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticker</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>As of</TableHead>
            <TableHead>Last Analyzed</TableHead>
            <TableHead>Q-Score</TableHead>
            <TableHead>V-Score</TableHead>
            {showManagementColumns && <TableHead className="text-right">Lists</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ stock, latestAnalysis, analysisDates, watchlistIds }) => (
            <TableRow key={stock.id}>
              <TableCell className="font-medium">
                <Link href={`/stocks/${stock.ticker}`} className="hover:text-primary">
                  {stock.ticker}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{stock.name}</TableCell>
              <TableCell>
                <div className="flex flex-col items-start gap-1">
                  {latestAnalysis ? (
                    <Badge variant={actionBadgeVariant(latestAnalysis.action)}>
                      {latestAnalysis.action}
                    </Badge>
                  ) : (
                    <RunAnalysisButton
                      ticker={stock.ticker}
                      initialAnalyzing={isAnalysisRunning(stock)}
                    />
                  )}
                  {latestAnalysis &&
                    (stock.needsReanalysis ? (
                      isAnalysisRunning(stock) ? (
                        <AnalyzingIndicator ticker={stock.ticker} />
                      ) : (
                        <span className="text-xs text-warning">Flagged for reanalysis</span>
                      )
                    ) : (
                      <form action={flagForReanalysis}>
                        <input type="hidden" name="id" value={stock.id} />
                        <Button type="submit" variant="outline" size="sm">
                          Flag for Reanalysis
                        </Button>
                      </form>
                    ))}
                </div>
              </TableCell>
              <TableCell className="font-mono tabular-nums">
                {stock.lastPrice != null ? `$${stock.lastPrice.toFixed(2)}` : "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {stock.priceAsOf ? stock.priceAsOf.toLocaleDateString() : "—"}
              </TableCell>
              <TableCell>
                {latestAnalysis ? (
                  <Link
                    href={`/stocks/${stock.ticker}`}
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    {formatAnalysisDate(latestAnalysis.date, analysisDates, timeZone)}
                  </Link>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="font-mono tabular-nums">
                {latestAnalysis ? `${latestAnalysis.qualityScore}/100` : "—"}
              </TableCell>
              <TableCell className="font-mono tabular-nums">
                {latestAnalysis ? `${latestAnalysis.valuationScore}/100` : "—"}
              </TableCell>
              {showManagementColumns && (
                <TableCell className="text-right">
                  <StockWatchlistMenu
                    stockId={stock.id}
                    allWatchlists={allWatchlists}
                    memberIds={watchlistIds}
                  />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
