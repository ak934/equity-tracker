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
import { Badge } from "@/components/ui/badge";
import { setTargetPrice } from "@/app/actions/stocks";
import { hasHitTargetPrice } from "@/lib/target-price";

export default async function AlertsPage() {
  await auth.protect();

  const stocks = await prisma.stock.findMany({
    where: { targetPrice: { not: null } },
    orderBy: { ticker: "asc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Alerts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We&apos;ll email you when a stock hits its target price.
        </p>
      </div>
      {stocks.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No target prices set yet. Set one from a stock&apos;s analysis page and it&apos;ll show up here.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticker</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stocks.map((stock) => {
              const hit = hasHitTargetPrice({
                price: stock.lastPrice,
                targetPrice: stock.targetPrice,
              });

              return (
                <TableRow key={stock.id} className={hit ? "bg-positive/5" : ""}>
                  <TableCell className="font-medium">
                    <Link href={`/stocks/${stock.ticker}`} className="hover:text-primary">
                      {stock.ticker}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{stock.name}</TableCell>
                  <TableCell className="font-mono tabular-nums">
                    {stock.lastPrice != null ? `$${stock.lastPrice.toFixed(2)}` : "—"}
                  </TableCell>
                  <TableCell className="font-mono tabular-nums">
                    {stock.targetPrice != null ? `$${stock.targetPrice.toFixed(2)}` : "—"}
                  </TableCell>
                  <TableCell>
                    {hit ? (
                      <Badge variant="positive">🎯 Hit — buy now!</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Watching</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
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
        </div>
      )}
    </main>
  );
}
