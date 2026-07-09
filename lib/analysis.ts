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
  } Search the web for current price, market cap, revenue, earnings, P/E, profit margins, debt levels, and any major recent news before forming your opinion — don't rely on memory for numbers.

Evaluate these 5 criteria, each scored ✅ / ⚠️ / ❌:
1. Understandability — can you explain how it makes money in a sentence?
2. Competitive Moat — brand, switching costs, network effects, cost advantages; how durable?
3. Growth Potential — realistic path to ~2x earnings in 5 years?
4. Management Quality — owner-minded capital allocation, insider ownership, red flags?
5. Fair Price — is today's price roughly half of a reasonable 5-year value estimate?

Then produce:

**Part A** — 3 to 5 paragraphs in your voice, ending with a clear verdict: "I would own this business," "I'd sit this one out," or "I'd watch and wait for a better price." Note briefly which sources you could/couldn't find. End with one line noting this is education, not financial advice.

**Part B** — a markdown scorecard table: the 5 criteria, their ✅/⚠️/❌ score, and a one-line reason each, plus an Overall Verdict of BUY, WATCH, or PASS.

After Part B, on its own line, output ONLY this fenced JSON block with no extra commentary:
\`\`\`json
{"qualityScore": <1-10, composite of Understandability+Moat+Growth+Management>, "valuationScore": <1-10, based on the Fair Price criterion alone>, "action": "<buy|hold|avoid>"}
\`\`\`
Map BUY→buy, WATCH→hold, PASS→avoid.`;
}

export async function generateAnalysis(
  ticker: string,
  price: number | null
): Promise<AnalysisResult> {
  const response = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
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