import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StockRow } from "@/components/StockRow";

type Stock = {
  id: string;
  ticker: string;
  name: string;
  status: string;
  lastPrice: number | null;
  priceAsOf: Date | null;
  targetPrice: number | null;
};

export function StockTable({
  stocks,
  latestActionByTicker,
}: {
  stocks: Stock[];
  latestActionByTicker: Map<string, string>;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ticker</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Target Price</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>As of</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {stocks.map((stock) => (
          <StockRow
            key={stock.id}
            stock={stock}
            latestAction={latestActionByTicker.get(stock.ticker) ?? null}
          />
        ))}
      </TableBody>
    </Table>
  );
}
