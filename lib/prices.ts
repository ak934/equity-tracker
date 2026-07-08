export type PriceResult = {
  ticker: string;
  price: number;
  asOf: Date;
};

export async function getPrice(ticker: string): Promise<PriceResult> {
  const apiKey = process.env.MASSIVE_API_KEY;
  const url = `https://api.massive.com/v2/snapshot/locale/us/markets/stocks/tickers/${ticker}?apiKey=${apiKey}`;
  
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Massive API error for ${ticker}: ${res.status}`);
  }
  
  const data = await res.json();
  const price = data?.ticker?.day?.c ?? data?.ticker?.lastTrade?.p;
  
  if (typeof price !== "number") {
    throw new Error(`No price available for ${ticker}`);
  }
  
  return {
    ticker,
    price,
    asOf: new Date(),
  };
}