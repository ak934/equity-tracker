import { prisma } from "@/lib/prisma";
import { RunAnalysisButton } from "@/components/run-analysis-button";

export default async function StockPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;

  const analyses = await prisma.analysis.findMany({
    where: { ticker },
    orderBy: { date: "desc" },
  });

  const [latest, ...history] = analyses;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{ticker}</h1>
        <RunAnalysisButton ticker={ticker} />
      </div>

      {latest ? (
        <div className="mt-4 rounded border p-4">
          <p className="text-sm text-neutral-500">
            {latest.date.toLocaleDateString()}
          </p>
          <p>Action: {latest.action}</p>
          <p>
            Quality: {latest.qualityScore}/10 · Valuation:{" "}
            {latest.valuationScore}/10
          </p>
          <p className="mt-2 whitespace-pre-wrap">{latest.fullText}</p>
        </div>
      ) : (
        <p className="mt-4 text-neutral-500">No analysis yet.</p>
      )}

      {history.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-neutral-500">
            History ({history.length})
          </summary>
          {history.map((a) => (
            <div key={a.id} className="mt-2 rounded border p-3 text-sm">
              <p className="text-neutral-500">
                {a.date.toLocaleDateString()}
              </p>
              <p>
                {a.action} · Q{a.qualityScore} · V{a.valuationScore}
              </p>
            </div>
          ))}
        </details>
      )}
    </div>
  );
}