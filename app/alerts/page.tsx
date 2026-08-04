import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { setTargetPrice } from "@/app/actions/stocks";
import { hasHitTargetPrice } from "@/lib/target-price";
import { RefreshButton } from "@/components/refresh-button";

export default async function AlertsPage() {
  await auth.protect();

  const stocks = await prisma.stock.findMany({
    where: { targetPrice: { not: null } },
    orderBy: { ticker: "asc" },
  });

  return (
    <main className="max-w-3xl mx-auto mt-16 px-4">
      <h1 className="text-2xl font-bold mb-6">Alerts</h1>
      {stocks.length > 0 && (
        <div className="mb-4">
          <RefreshButton />
        </div>
      )}
      {stocks.length === 0 ? (
        <p className="text-neutral-500">
          No target prices set yet. Set one from a stock&apos;s analysis page and it&apos;ll show up here.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticker</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stocks.map((stock) => {
              const hit = hasHitTargetPrice({
                price: stock.lastPrice,
                targetPrice: stock.targetPrice,
              });

              return (
                <TableRow key={stock.id} className={hit ? "bg-green-50" : ""}>
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
                    {stock.targetPrice != null ? `$${stock.targetPrice.toFixed(2)}` : "—"}
                  </TableCell>
                  <TableCell>
                    {hit ? (
                      <span className="inline-block rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        🎯 Hit — buy now!
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-400">Watching</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <form action={setTargetPrice}>
                      <input type="hidden" name="id" value={stock.id} />
                      <input type="hidden" name="targetPrice" value="" />
                      <Button type="submit" variant="ghost" size="sm">
                        Clear
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </main>
  );
}
