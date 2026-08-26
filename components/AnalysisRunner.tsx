"use client";

import { useState } from "react";
import { RunAnalysisButton } from "@/components/run-analysis-button";

export function AnalysisRunner({
  ticker,
  initialAnalyzing,
  navigateAfter,
  frameworks,
}: {
  ticker: string;
  initialAnalyzing?: boolean;
  navigateAfter?: string;
  frameworks: { id: string; name: string }[];
}) {
  const [frameworkId, setFrameworkId] = useState("");

  return (
    <div className="flex items-center gap-2">
      {frameworks.length > 0 && (
        <select
          value={frameworkId}
          onChange={(e) => setFrameworkId(e.target.value)}
          aria-label="Analysis framework"
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm text-foreground"
        >
          <option value="">Buffett (default)</option>
          {frameworks.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      )}
      <RunAnalysisButton
        ticker={ticker}
        initialAnalyzing={initialAnalyzing}
        navigateAfter={navigateAfter}
        frameworkId={frameworkId || undefined}
      />
    </div>
  );
}
