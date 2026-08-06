import Link from "next/link";
import { TableCell, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { deleteStock, updateStockStatus } from "@/app/actions/stocks";

type Stock = {
    id: string;
    ticker: string;
    name: string;
    status: string;
    lastPrice: number | null;
    priceAsOf: Date | null;
};

export function StockRow({
    stock,
}: {
    stock: Stock;
}) {
    return (
        <TableRow>
            <TableCell className="font-medium">
                <Link href={`/stocks/${stock.ticker}`} className="flex items-center gap-2.5 hover:text-primary">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary text-[0.65rem] font-semibold tracking-tight text-secondary-foreground">
                        {stock.ticker.slice(0, 4)}
                    </span>
                    {stock.ticker}
                </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">{stock.name}</TableCell>
            <TableCell className="font-mono tabular-nums">
                {stock.lastPrice != null ? `$${stock.lastPrice.toFixed(2)}` : "—"}
            </TableCell>
            <TableCell className="text-muted-foreground">
                {stock.priceAsOf ? stock.priceAsOf.toLocaleDateString() : "—"}
            </TableCell>
            <TableCell className="space-x-2 whitespace-nowrap text-right">
                {stock.status === "watchlist" ? (
                    <span className="text-xs text-muted-foreground">In Watchlist</span>
                ) : (
                    <form action={updateStockStatus} className="inline">
                        <input type="hidden" name="id" value={stock.id} />
                        <input type="hidden" name="status" value="watchlist" />
                        <Button type="submit" variant="secondary" size="sm">
                            Add to Watchlist
                        </Button>
                    </form>
                )}
                <form action={deleteStock} className="inline">
                    <input type="hidden" name="id" value={stock.id} />
                    <Button type="submit" variant="destructive" size="sm">
                        {stock.status === "watchlist" ? "Remove from Dashboard" : "Delete"}
                    </Button>
                </form>
            </TableCell>
        </TableRow>
    );
}
