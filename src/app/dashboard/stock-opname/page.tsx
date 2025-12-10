import prisma from "@/lib/prisma"
import { StockOpnameList } from "@/components/inventory/stock-opname"

export default async function StockOpnamePage() {
    const [products, history] = await Promise.all([
        prisma.product.findMany({ orderBy: { name: 'asc' } }),
        prisma.stockOpname.findMany({
            include: { product: true },
            orderBy: { date: 'desc' },
            take: 50
        })
    ])

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">Stock Opname</h1>
            <StockOpnameList products={products} history={history} />
        </div>
    )
}
