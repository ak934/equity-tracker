import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticker</TableHead>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stocks.map((stock) => (
            <TableRow key={stock.id}>
              <TableCell className="font-medium">{stock.ticker}</TableCell>
              <TableCell>{stock.name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </main>
  );
}