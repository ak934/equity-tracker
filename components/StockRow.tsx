import { TableCell, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { deleteStock, updateStockStatus } from "@/app/actions/stocks";
import { getBuyZoneStatus, type BuyZoneStatus } from "@/lib/buy-zone";

type Stock = {
    id: string;
    ticker: string;
    name: string;
    status: string;
    lastPrice: number | null;
    priceAsOf: Date | null;
    buyZoneLow: number | null;
    buyZoneHigh: number | null;
};

const rowStyles: Record<BuyZoneStatus, string> = {
    in: "bg-green-50",
    above: "",
    below: "bg-amber-50",
    unknown: "",
};

export function StockRow({ stock }: { stock: Stock }) {
    const nextStatus = stock.status == "watchlist" ? "portfolio" : "watchlist";

    const zoneStatus = getBuyZoneStatus({
        price: stock.lastPrice,
        low: stock.buyZoneLow,
        high: stock.buyZoneHigh,
    });

    return (
        <TableRow className={rowStyles[zoneStatus]}>
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
            <TableCell className="capitalize">{zoneStatus}</TableCell>
            <TableCell>
                {stock.lastPrice != null ? `$${stock.lastPrice.toFixed(2)}` : "—"}
            </TableCell>
            <TableCell>
                {stock.priceAsOf ? stock.priceAsOf.toLocaleDateString() : "—"}
            </TableCell>
            <TableCell>
                <form action={deleteStock}>
                    <input type="hidden" name="id" value={stock.id} />
                    <Button type="submit" variant="destructive" size="sm">
                        Delete
                    </Button>
                </form>
            </TableCell>
        </TableRow>
    );
}