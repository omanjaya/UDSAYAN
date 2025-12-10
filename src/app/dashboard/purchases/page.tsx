import prisma from "@/lib/prisma"
import PurchaseClient from "@/components/purchases/purchase-client"

export default async function PurchasesPage() {
    const [products, suppliers] = await Promise.all([
        prisma.product.findMany({ orderBy: { name: 'asc' } }),
        prisma.supplier.findMany({ orderBy: { name: 'asc' } })
    ])

    return (
        <div className="h-full">
            <PurchaseClient products={products} suppliers={suppliers} />
        </div>
    )
}
