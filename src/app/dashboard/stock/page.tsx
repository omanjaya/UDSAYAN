import prisma from "@/lib/prisma"
import { StockMovementList } from "@/components/stock/stock-movement-list"

export default async function StockMovementPage() {
    const movements = await prisma.stockMovement.findMany({
        include: {
            product: true
        },
        orderBy: { date: 'desc' },
        take: 500
    })

    // Convert Decimal to number for Client Component
    const plainMovements = movements.map(m => ({
        id: m.id,
        date: m.date,
        productId: m.productId,
        productName: m.product.name,
        productCode: m.product.code,
        productUnit: m.product.unit,
        type: m.type,
        qty: Number(m.qty),
        hpp: Number(m.hpp),
        hj: m.hj ? Number(m.hj) : null,
        stockAfter: m.stockAfter,
        refType: m.refType,
        refId: m.refId,
        customerName: m.customerName,
        status: m.status,
        note: m.note,
        createdAt: m.createdAt
    }))

    return (
        <div className="container py-6">
            <StockMovementList movements={plainMovements} />
        </div>
    )
}
