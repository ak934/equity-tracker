import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { RunAnalysisButton } from "@/components/run-analysis-button";
import { AnalyzingIndicator } from "@/components/analyzing-indicator";
import { isAnalysisRunning } from "@/lib/analysis-status";

const actionBadgeStyles: Record<string, string> = {
  buy: "bg-green-100 text-green-800",
  hold: "bg-amber-100 text-amber-800",
  avoid: "bg-red-100 text-red-800",
};

export default async function StockPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  await auth.protect();

  const { ticker } = await params;

  const [stock, analyses] = await Promise.all([
    prisma.stock.findUnique({ where: { ticker } }),
    prisma.analysis.findMany({ where: { ticker }, orderBy: { date: "desc" } }),
  ]);

  const analyzing = stock ? isAnalysisRunning(stock) : false;
  const needsReanalysis = stock?.needsReanalysis ?? false;

  // A flagged stock is queued for a fresh take using current information —
  // showing the old write-up as "the" analysis would misrepresent it as
  // up to date. Demote it into History until a new one lands.
  const latest = needsReanalysis ? undefined : analyses[0];
  const history = needsReanalysis ? analyses : analyses.slice(1);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{ticker}</h1>
        {needsReanalysis ? (
          analyzing ? (
            <AnalyzingIndicator ticker={ticker} />
          ) : (
            <RunAnalysisButton ticker={ticker} initialAnalyzing={analyzing} />
          )
        ) : latest ? (
          <Button asChild variant="outline">
            <Link href="/queue">Go back to Queue</Link>
          </Button>
        ) : (
          <RunAnalysisButton ticker={ticker} initialAnalyzing={analyzing} />
        )}
      </div>

      {needsReanalysis ? (
        <p className="mt-4 text-neutral-500">
          {analyzing
            ? "Generating a fresh analysis with the latest information — this can take a minute or two."
            : "This stock is flagged for reanalysis. Run analysis to generate a fresh take before relying on its old one below."}
        </p>
      ) : latest ? (
        <div className="mt-6 rounded-lg border">
          <div className="flex flex-wrap items-center gap-3 border-b bg-neutral-50 px-5 py-3">
            <span
              className={`inline-block rounded px-2.5 py-1 text-sm font-medium capitalize ${
                actionBadgeStyles[latest.action] ?? "bg-neutral-100 text-neutral-600"
              }`}
            >
              {latest.action}
            </span>
            <span className="text-sm text-neutral-500">
              Analyzed {latest.date.toLocaleDateString()}
            </span>
            <div className="ml-auto flex gap-4 text-sm">
              <span>
                Quality <span className="font-semibold">{latest.qualityScore}/100</span>
              </span>
              <span>
                Valuation <span className="font-semibold">{latest.valuationScore}/100</span>
              </span>
            </div>
          </div>
          <div className="prose prose-neutral prose-sm sm:prose-base max-w-none px-5 py-5">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{latest.fullText}</ReactMarkdown>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-neutral-500">No analysis yet.</p>
      )}

      {history.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm font-medium text-neutral-500">
            History ({history.length})
          </summary>
          <div className="mt-3 space-y-2">
            {history.map((a) => (
              <details key={a.id} className="rounded border text-sm">
                <summary className="flex flex-wrap items-center gap-3 cursor-pointer px-4 py-2.5">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium capitalize ${
                      actionBadgeStyles[a.action] ?? "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {a.action}
                  </span>
                  <span className="text-neutral-500">{a.date.toLocaleDateString()}</span>
                  <span className="ml-auto text-neutral-500">
                    Q{a.qualityScore} · V{a.valuationScore}
                  </span>
                </summary>
                <div className="prose prose-neutral prose-sm max-w-none border-t px-4 py-4">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{a.fullText}</ReactMarkdown>
                </div>
              </details>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
