import { auth } from "@clerk/nextjs/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { prisma } from "@/lib/prisma";
import { Badge, actionBadgeVariant } from "@/components/ui/badge";
import { AnalysisRunner } from "@/components/AnalysisRunner";
import { AnalyzingIndicator } from "@/components/analyzing-indicator";
import { isAnalysisRunning } from "@/lib/analysis-status";
import { formatAnalysisDate } from "@/lib/format-analysis-date";
import { getUserTimezone } from "@/lib/user-timezone";
import { TargetPricePrompt } from "@/components/TargetPricePrompt";
import { StockWatchlistStatus } from "@/components/StockWatchlistStatus";
import { StockLogo } from "@/components/StockLogo";
import { getLogoAvailability } from "@/lib/logos";

export default async function StockPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { userId } = await auth.protect();

  const { ticker } = await params;

  const [stock, analyses, timeZone, frameworks, watchlists, domains] = await Promise.all([
    prisma.stock.findUnique({
      where: { clerkUserId_ticker: { clerkUserId: userId, ticker } },
      include: { watchlists: { select: { id: true } } },
    }),
    prisma.analysis.findMany({
      where: { clerkUserId: userId, ticker },
      orderBy: { date: "desc" },
    }),
    getUserTimezone(),
    prisma.analysisFramework.findMany({
      where: { clerkUserId: userId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.watchlist.findMany({
      where: { clerkUserId: userId },
      orderBy: { createdAt: "asc" },
    }),
    getLogoAvailability([ticker]),
  ]);

  const allWatchlists = watchlists.map((w) => ({ id: w.id, name: w.name }));
  const memberIds = stock?.watchlists.map((w) => w.id) ?? [];

  const analyzing = stock ? isAnalysisRunning(stock) : false;
  const needsReanalysis = stock?.needsReanalysis ?? false;

  // A flagged stock is queued for a fresh take using current information —
  // showing the old write-up as "the" analysis would misrepresent it as
  // up to date. Demote it into History until a new one lands.
  const latest = needsReanalysis ? undefined : analyses[0];
  const history = needsReanalysis ? analyses : analyses.slice(1);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <StockLogo ticker={ticker} hasLogo={domains.get(ticker) ?? false} size={32} />
          <h1 className="text-2xl font-semibold tracking-tight">{ticker}</h1>
        </div>
        {needsReanalysis ? (
          analyzing ? (
            <AnalyzingIndicator ticker={ticker} />
          ) : (
            <AnalysisRunner
              ticker={ticker}
              initialAnalyzing={analyzing}
              frameworks={frameworks}
              hasExistingAnalysis={analyses.length > 0}
            />
          )
        ) : !latest ? (
          <AnalysisRunner ticker={ticker} initialAnalyzing={analyzing} frameworks={frameworks} />
        ) : null}
      </div>

      {stock && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Current Price
              </div>
              <div className="font-mono text-xl font-semibold text-foreground">
                {stock.lastPrice != null ? `$${stock.lastPrice.toFixed(2)}` : "—"}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Target Price
              </div>
              <div className="font-mono text-xl font-semibold text-foreground">
                {stock.targetPrice != null ? `$${stock.targetPrice.toFixed(2)}` : "—"}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StockWatchlistStatus stockId={stock.id} allWatchlists={allWatchlists} memberIds={memberIds} />
            <TargetPricePrompt stockId={stock.id} targetPrice={stock.targetPrice} />
          </div>
        </div>
      )}

      {needsReanalysis ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {analyzing
            ? "Generating a fresh analysis with the latest information — this can take a minute or two."
            : "This stock is flagged for reanalysis. Run analysis to generate a fresh take before relying on its old one below."}
        </p>
      ) : latest ? (
        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border-b border-border bg-muted/40 px-5 py-3">
            <Badge variant={actionBadgeVariant(latest.action)} className="px-2.5 py-1 text-sm">
              {latest.action}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Analyzed {formatAnalysisDate(latest.date, analyses.map((a) => a.date), timeZone)} ·{" "}
              {latest.frameworkName}
            </span>
            <div className="ml-auto flex gap-4 text-sm">
              <span className="text-muted-foreground">
                Quality <span className="font-mono font-semibold text-foreground">{latest.qualityScore}/100</span>
              </span>
              <span className="text-muted-foreground">
                Valuation <span className="font-mono font-semibold text-foreground">{latest.valuationScore}/100</span>
              </span>
            </div>
          </div>
          <div className="prose prose-neutral dark:prose-invert prose-sm sm:prose-base max-w-none px-5 py-5">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{latest.fullText}</ReactMarkdown>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">No analysis yet.</p>
      )}

      {history.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
            History ({history.length})
          </summary>
          <div className="mt-3 space-y-2">
            {history.map((a) => (
              <details key={a.id} className="rounded-lg border border-border text-sm">
                <summary className="flex flex-wrap items-center gap-3 cursor-pointer px-4 py-2.5">
                  <Badge variant={actionBadgeVariant(a.action)}>{a.action}</Badge>
                  <span className="text-muted-foreground">
                    {formatAnalysisDate(a.date, analyses.map((x) => x.date), timeZone)} ·{" "}
                    {a.frameworkName}
                  </span>
                  <span className="ml-auto font-mono text-muted-foreground">
                    Q{a.qualityScore} · V{a.valuationScore}
                  </span>
                </summary>
                <div className="prose prose-neutral dark:prose-invert prose-sm max-w-none border-t border-border px-4 py-4">
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
