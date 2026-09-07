import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const SEED_CLERK_USER_ID = process.env.SEED_CLERK_USER_ID ?? "seed-user"

async function main(){
    const stocks = [
    { ticker: "AAPL", name: "Apple Inc.", status: "watchlist"},
    { ticker: "MSFT", name: "Microsoft Corporation", status: "watchlist"},
    { ticker: "GOOGL", name: "Alphabet Inc.", status: "watchlist"},
    { ticker: "TSLA", name: "Tesla Inc.", status: "watchlist"},
    { ticker: "NFLX", name: "Netflix Inc.", status: "watchlist"},
    ]

    for (const stock of stocks){
        await prisma.stock.upsert({
            where: {clerkUserId_ticker: {clerkUserId: SEED_CLERK_USER_ID, ticker: stock.ticker}},
            update: {},
            create: {...stock, clerkUserId: SEED_CLERK_USER_ID},
        })
    }
}

main()
.then(() => prisma.$disconnect())
.catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
})