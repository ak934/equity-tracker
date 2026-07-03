export type Stock = {
    ticker: string;
    name: string;
};

export const stocks: Stock[] =[
    { ticker: "AAPL", name: "Apple Inc."},
    { ticker: "MSFT", name: "Microsoft Corporation"},
    { ticker: "GOOGL", name: "Alphabet Inc."},
    { ticker: "TSLA", name: "Tesla Inc."},
    { ticker: "NFLX", name: "Netflix Inc."},
];