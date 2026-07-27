import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function WatchlistPage() {
  const stocks = await prisma.stock.findMany({
    where: { status: "watchlist" },
    orderBy: { ticker: "asc" },
  });

  return (
    <main className="max-w-2xl mx-auto mt-16 px-4">
      <h1 className="text-2xl font-bold mb-6">Watchlist</h1>
      {stocks.length === 0 ? (
        <p className="text-neutral-500">No stocks in your watchlist yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticker</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>As of</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stocks.map((stock) => (
              <TableRow key={stock.id}>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </main>
  );
}
