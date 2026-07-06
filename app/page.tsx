import { prisma } from "@/lib/prisma";
import { AddStockForm } from "@/components/AddStockForm";
import { StockRow } from "@/components/StockRow";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function Home() {
  const stocks = await prisma.stock.findMany({
    orderBy: { ticker: "asc" },
  });

  return (
    <main className="max-w-2xl mx-auto mt-16 px-4">
      <h1 className="text-2xl font-bold mb-6">Watchlist</h1>
      <AddStockForm />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticker</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stocks.map((stock) => (
            <StockRow key={stock.id} stock={stock} />
          ))}
        </TableBody>
      </Table>
    </main>
  );
}