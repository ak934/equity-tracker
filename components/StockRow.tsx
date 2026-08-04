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
                <Link href={`/stocks/${stock.ticker}`} className="hover:underline">
                    {stock.ticker}
                </Link>
            </TableCell>
            <TableCell>{stock.name}</TableCell>
            <TableCell>
                {stock.lastPrice != null ? `$${stock.lastPrice.toFixed(2)}` : "—"}
            </TableCell>
            <TableCell>
                {stock.priceAsOf ? stock.priceAsOf.toLocaleDateString() : "—"}
            </TableCell>
            <TableCell className="space-x-2 whitespace-nowrap">
                {stock.status === "watchlist" ? (
                    <span className="text-xs text-neutral-400">In Watchlist</span>
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
