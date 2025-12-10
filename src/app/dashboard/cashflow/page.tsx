import prisma from "@/lib/prisma"
import { CashFlowList } from "@/components/cashflow/cashflow-list"

export default async function CashFlowPage() {
    const cashFlows = await prisma.cashFlow.findMany({
        orderBy: { date: 'desc' },
        take: 100 // Limit for performance
    })

    // Convert Decimal to number for Client Component serialization
    const plainCashFlows = cashFlows.map(cf => ({
        ...cf,
        amount: Number(cf.amount),
        balance: Number(cf.balance),
    }))

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">Transaksi Harian / Arus Kas</h1>
            <CashFlowList initialData={plainCashFlows} />
        </div>
    )
}
