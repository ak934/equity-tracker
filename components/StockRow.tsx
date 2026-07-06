import { TableCell, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { deleteStock, updateStockStatus } from "@/app/actions/stocks";

type Stock = {
    id: string;
    ticker: string;
    name: string;
    status: string;
    lastPrice: number | null;
    lastPriceAt: Date | null;
};

export function StockRow({ stock }: { stock: Stock}) {
    const nextStatus = stock.status == "watchlist" ? "portfolio" : "watchlist";

    return (
        <TableRow>
            <TableCell className="font-medium">{stock.ticker}</TableCell>
            <TableCell>{stock.name}</TableCell>
            <TableCell>
                <form action={updateStockStatus}>
                    <input type="hidden" name="id" value={stock.id} />
                    <input type="hidden" name="status" value={nextStatus} />
                    <Button type="submit" variant="secondary" size="sm">
                        {stock.status === "watchlist" ? "Watchlist" : "Portfolio"}
                    </Button>
                </form>
            </TableCell>
            <TableCell>
                {stock.lastPrice != null ? `$${stock.lastPrice.toFixed(2)}` : "—"}
            </TableCell>
            <TableCell>
                {stock.lastPriceAt ? stock.lastPriceAt.toLocaleDateString() : "—"}
            </TableCell>
            <TableCell>
                <form action = {deleteStock}>
                    <input type="hidden" name="id" value={stock.id} />
                    <Button type="submit" variant="destructive" size="sm">
                        Delete
                    </Button>
                </form>
            </TableCell>
        </TableRow>
    );
}