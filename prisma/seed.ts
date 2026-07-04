import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main(){
    const stocks = [
    { ticker: "AAPL", name: "Apple Inc."},
    { ticker: "MSFT", name: "Microsoft Corporation"},
    { ticker: "GOOGL", name: "Alphabet Inc."},
    { ticker: "TSLA", name: "Tesla Inc."},
    { ticker: "NFLX", name: "Netflix Inc."},
    ]

    for (const stock of stocks){
        await prisma.stock.upsert({
            where: {ticker : stock.ticker },
            update: {},
            create: stock,
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