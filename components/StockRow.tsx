import Link from "next/link";
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

const actionBadgeStyles: Record<string, string> = {
    buy: "bg-green-100 text-green-800",
    hold: "bg-amber-100 text-amber-800",
    avoid: "bg-red-100 text-red-800",
};

export function StockRow({
    stock,
    latestAction,
}: {
    stock: Stock;
    latestAction: string | null;
}) {
    const zoneStatus = getBuyZoneStatus({
        price: stock.lastPrice,
        low: stock.buyZoneLow,
        high: stock.buyZoneHigh,
    });

    return (
        <TableRow className={rowStyles[zoneStatus]}>
            <TableCell className="font-medium">
                <Link href={`/stocks/${stock.ticker}`} className="hover:underline">
                    {stock.ticker}
                </Link>
            </TableCell>
            <TableCell>{stock.name}</TableCell>
            <TableCell>
                {latestAction ? (
                    <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-medium capitalize ${
                            actionBadgeStyles[latestAction] ?? "bg-neutral-100 text-neutral-600"
                        }`}
                    >
                        {latestAction}
                    </span>
                ) : (
                    <span className="text-xs text-neutral-400">No analysis</span>
                )}
            </TableCell>
            <TableCell className="capitalize">{zoneStatus}</TableCell>
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
                        Delete
                    </Button>
                </form>
            </TableCell>
        </TableRow>
    );
}