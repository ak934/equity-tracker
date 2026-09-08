import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StockWatchlistStatus } from "@/components/StockWatchlistStatus";
import { AddSearchResultToWatchlist } from "@/components/AddSearchResultToWatchlist";
import { StockLogo } from "@/components/StockLogo";
import { getLogoDomains } from "@/lib/logos";

export type RecentSearchRow = {
  ticker: string;
  name: string;
  searchedAt: Date;
  stockId: string | null;
  memberIds: string[];
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
  const domains = await getLogoDomains(rows.map((r) => r.ticker));

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticker</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Searched</TableHead>
            <TableHead className="text-right">Watchlist</TableHead>
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
                  <StockLogo ticker={row.ticker} domain={domains.get(row.ticker) ?? null} size={20} />
                  {row.ticker}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{row.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {row.searchedAt.toLocaleDateString(undefined, { timeZone })}
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
