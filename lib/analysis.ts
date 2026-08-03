import Anthropic from "@anthropic-ai/sdk";

let anthropic: Anthropic;
function getClient(): Anthropic {
  if (!anthropic) {
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropic;
}

export type AnalysisResult = {
  qualityScore: number;
  valuationScore: number;
  action: string;
  fullText: string;
};

const BUFFETT_SYSTEM_PROMPT = `You are Warren Buffett, the value investor from Omaha. You speak plainly, use folksy analogies (See's Candies, Coca-Cola, railroads), think in decades not quarters, and are deeply skeptical of hype. You always ask: "Would I be happy owning this for 10 years if the market closed tomorrow?"

Never use Wall Street jargon like "EBITDA" or "multiple expansion." Be honest about uncertainty, but give a clear opinion rather than hedging into mush.`;

function buildPrompt(ticker: string, price: number | null) {
  return `Analyze ${ticker} as an investment. ${
    price ? `Last known price in our system: $${price}.` : ""
  }

## Step 1 — Research primary sources first
Before forming an opinion, search for and read (in order): the latest 10-K (revenue breakdown, margins, risk factors, MD&A), the latest earnings call transcript (management tone, how they handle tough questions), and the latest proxy/DEF 14A (insider ownership, share pledging, related-party deals — don't score management without it). Then fill gaps with web searches for current price, market cap, revenue/earnings trend (3-5yr), profit margins, debt levels, industry growth CAGR (compare the company's growth to its industry, not just its own prior year), and recent news. Don't rely on memory for numbers — they change. Briefly note in Part A which sources you could and couldn't find.

## Step 2 — Evaluate the 5 criteria, each scored ✅ / ⚠️ / ❌
1. Understandability — can you explain how it makes money in a sentence?
2. Competitive Moat — brand, switching costs, network effects, cost advantages; how durable against tech change, regulation, new entrants?
3. Growth Potential — realistic path to ~2x earnings in 5 years (~15% CAGR)? Organic or debt/acquisition-fueled?
4. Management Quality — owner-minded capital allocation, insider ownership, red flags (dilution, comp, pledging)?
5. Fair Price — is today's price roughly half a reasonable 5-year value estimate (current EPS × expected P/E × projected growth)?

## Step 2A — Triple-Pass Discipline (mandatory, do this internally before answering)
Run three full passes on both the Quality score (criteria 1-4 composite) and the Valuation score (criteria 5) before finalizing — this is not optional, and the biggest errors get caught on passes 2-3, not pass 1:
- **Pass 1 (base case):** score naturally from the research above. Flag any pillar you're unsure of.
- **Pass 2 (steel-man):** argue the opposite lean on every pillar — if Pass 1 leaned bullish, steel-man the bear case (and vice versa). Check what you anchored on without sourcing, whether you compared to industry CAGR, and whether you actually used the proxy/MD&A/transcript. Re-score.
- **Pass 3 (devil's advocate, mandatory):** argue for the OPPOSITE action of wherever Pass 2 landed (if leaning BUY/WATCH, argue AVOID/PASS, and vice versa) to stress-test the weakest point in the current verdict. Re-score. The score after Pass 3 is final — not an average of the three passes.

## Step 3 — Deliver the output
**Part A** — 3 to 5 paragraphs in your voice (plain language, folksy analogies like See's Candies/Coca-Cola/railroads, decades-not-quarters framing), ending with a clear verdict: "I would own this business," "I'd sit this one out," or "I'd watch and wait for a better price." Note which sources you could/couldn't find. End with one line noting this is education, not financial advice.

**Part B** — a markdown scorecard table: the 5 criteria, their ✅/⚠️/❌ score, and a one-line reason each, plus an **Overall Verdict** of BUY, WATCH, or PASS.

**Part C** — a short delta block showing only the pass-1-to-final movement, not the full pass-by-pass history:
> **Quality Score: __/100** (v1: __ → final __; what moved: ____)
> **Valuation Score: __/100** (v1: __ → final __; what moved: ____)
> **Devil's advocate verdict:** one sentence on what the opposite-stance case argued and whether it changed the action.

After Part C, on its own line, output ONLY this fenced JSON block with no extra commentary:
\`\`\`json
{"qualityScore": <0-100, the final Quality Score from Part C>, "valuationScore": <0-100, the final Valuation Score from Part C>, "action": "<buy|hold|avoid>"}
\`\`\`
Map BUY→buy, WATCH→hold, PASS→avoid.`;
}

export async function generateAnalysis(
  ticker: string,
  price: number | null
): Promise<AnalysisResult> {
  const response = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 6000,
    system: BUFFETT_SYSTEM_PROMPT,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    messages: [{ role: "user", content: buildPrompt(ticker, price) }],
  });

  const fullOutput = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  const jsonMatch = fullOutput.match(/```json\s*([\s\S]*?)```/);
  if (!jsonMatch) {
    throw new Error("Model response did not include the expected JSON block");
  }

  const parsed = JSON.parse(jsonMatch[1]);
  const fullText = fullOutput.replace(jsonMatch[0], "").trim();

  return {
    qualityScore: parsed.qualityScore,
    valuationScore: parsed.valuationScore,
    action: parsed.action,
    fullText,
  };
}