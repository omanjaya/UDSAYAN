import prisma from "@/lib/prisma"
import StockMasukClient from "@/components/purchases/stock-masuk-client"

export default async function StokMasukPage() {
    const [products, suppliers] = await Promise.all([
        prisma.product.findMany({ orderBy: { name: 'asc' } }),
        prisma.supplier.findMany({ orderBy: { name: 'asc' } })
    ])

    // Convert Decimal to plain numbers for client component
    const plainProducts = products.map(p => ({
        ...p,
        hpp: Number(p.hpp),
        price: Number(p.price)
    }))

    const plainSuppliers = suppliers.map(s => ({
        ...s,
        balance: Number(s.balance)
    }))

    return (
        <div className="h-full">
            <StockMasukClient products={plainProducts} suppliers={plainSuppliers} />
        </div>
    )
}
