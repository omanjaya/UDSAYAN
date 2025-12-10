import prisma from "@/lib/prisma"
import { ReportsClient } from "@/components/reports/reports-client"
import { TransactionItem, Product, Customer, Transaction, CashFlow } from "@prisma/client"

export default async function ReportsPage() {
    const now = new Date()

    // Date ranges
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

    // Fetch all data in parallel - REAL DATA from database
    const [
        salesToday,
        itemsToday,
        expensesToday,
        salesThisMonth,
        itemsThisMonth,
        expensesThisMonth,
        salesLastMonth,
        itemsLastMonth,
        totalReceivables,
        totalPayables,
        topProducts,
        products,
        recentTransactions,
        topCustomers
    ] = await Promise.all([
        // TODAY - Real sales data
        prisma.transaction.aggregate({
            _sum: { totalAmount: true, paidAmount: true },
            _count: true,
            where: { date: { gte: todayStart, lte: todayEnd } }
        }),
        prisma.transactionItem.findMany({
            where: { transaction: { date: { gte: todayStart, lte: todayEnd } } }
        }),
        prisma.cashFlow.aggregate({
            _sum: { amount: true },
            where: {
                type: 'CREDIT',
                category: { not: 'PEMBELIAN' },
                createdAt: { gte: todayStart, lte: todayEnd }
            }
        }),

        // THIS MONTH - Real sales data
        prisma.transaction.aggregate({
            _sum: { totalAmount: true, paidAmount: true },
            _count: true,
            where: { date: { gte: startOfMonth, lte: endOfMonth } }
        }),
        prisma.transactionItem.findMany({
            where: { transaction: { date: { gte: startOfMonth, lte: endOfMonth } } }
        }),
        prisma.cashFlow.groupBy({
            by: ['category'],
            _sum: { amount: true },
            where: {
                type: 'CREDIT',
                category: { not: 'PEMBELIAN' },
                createdAt: { gte: startOfMonth, lte: endOfMonth }
            }
        }),

        // LAST MONTH - For comparison
        prisma.transaction.aggregate({
            _sum: { totalAmount: true },
            _count: true,
            where: { date: { gte: startOfLastMonth, lte: endOfLastMonth } }
        }),
        prisma.transactionItem.findMany({
            where: { transaction: { date: { gte: startOfLastMonth, lte: endOfLastMonth } } }
        }),

        // Real balance data
        prisma.customer.aggregate({
            _sum: { balance: true },
            where: { balance: { gt: 0 } }
        }),
        prisma.supplier.aggregate({
            _sum: { balance: true },
            where: { balance: { gt: 0 } }
        }),

        // Real top products
        prisma.transactionItem.groupBy({
            by: ['productId'],
            _sum: { qty: true },
            _count: true,
            where: { transaction: { date: { gte: startOfMonth, lte: endOfMonth } } },
            orderBy: { _sum: { qty: 'desc' } },
            take: 10
        }),
        prisma.product.findMany(),

        // Real transactions today
        prisma.transaction.findMany({
            where: { date: { gte: todayStart, lte: todayEnd } },
            include: { customer: true, items: { include: { product: true } } },
            orderBy: { date: 'desc' },
            take: 20
        }),

        // Real top customers
        prisma.transaction.groupBy({
            by: ['customerId'],
            _sum: { totalAmount: true },
            _count: true,
            where: { date: { gte: startOfMonth, lte: endOfMonth } },
            orderBy: { _sum: { totalAmount: 'desc' } },
            take: 10
        })
    ])

    // Calculate TODAY totals from real data
    const todaySales = Number(salesToday._sum.totalAmount ?? 0)
    const todayCOGS = itemsToday.reduce((sum: number, item: TransactionItem) => sum + (Number(item.cost) * Number(item.qty)), 0)
    const todayGrossProfit = todaySales - todayCOGS
    const todayExpenses = Number(expensesToday._sum.amount ?? 0)
    const todayNetProfit = todayGrossProfit - todayExpenses
    const todayTransactionCount = salesToday._count

    // Calculate THIS MONTH totals from real data
    const monthSales = Number(salesThisMonth._sum.totalAmount ?? 0)
    const monthCOGS = itemsThisMonth.reduce((sum: number, item: TransactionItem) => sum + (Number(item.cost) * Number(item.qty)), 0)
    const monthGrossProfit = monthSales - monthCOGS
    const expenseMap = new Map<string, number>(
        expensesThisMonth.map((e: { category: string; _sum: { amount: unknown } }) => [e.category, Number(e._sum.amount ?? 0)])
    )
    const monthExpenses = expensesThisMonth.reduce((sum: number, e: { _sum: { amount: unknown } }) => sum + Number(e._sum.amount ?? 0), 0)
    const monthNetProfit = monthGrossProfit - monthExpenses
    const monthTransactionCount = salesThisMonth._count

    // Calculate LAST MONTH for comparison
    const lastMonthSales = Number(salesLastMonth._sum.totalAmount ?? 0)
    const lastMonthCOGS = itemsLastMonth.reduce((sum: number, item: TransactionItem) => sum + (Number(item.cost) * Number(item.qty)), 0)
    const lastMonthGrossProfit = lastMonthSales - lastMonthCOGS

    // Growth calculations
    const salesGrowth = lastMonthSales > 0 ? ((monthSales - lastMonthSales) / lastMonthSales * 100) : 0
    const profitGrowth = lastMonthGrossProfit > 0 ? ((monthGrossProfit - lastMonthGrossProfit) / lastMonthGrossProfit * 100) : 0

    // Calculate inventory value from real product data
    const inventoryValue = products.reduce((sum: number, p: Product) => sum + (p.stock * Number(p.hpp)), 0)
    const productMap = new Map(products.map((p: Product) => [p.id, p]))
    const topProductsWithNames = topProducts.map((tp: { productId: string; _sum: { qty: unknown }; _count: number }) => {
        const prod = productMap.get(tp.productId)
        return {
            productId: tp.productId,
            _sum: { qty: Number(tp._sum.qty ?? 0) },
            _count: tp._count,
            product: prod ? { name: prod.name, unit: prod.unit } : undefined
        }
    })

    // Get real customer data for top customers
    const customerIds = topCustomers.map((tc: { customerId: string }) => tc.customerId)
    const customerData = await prisma.customer.findMany({
        where: { id: { in: customerIds } }
    })
    const customerMap = new Map(customerData.map((c: Customer) => [c.id, c]))
    const topCustomersWithNames = topCustomers.map((tc: { customerId: string; _sum: { totalAmount: unknown }; _count: number }) => {
        const cust = customerMap.get(tc.customerId)
        return {
            customerId: tc.customerId,
            _sum: { totalAmount: Number(tc._sum.totalAmount ?? 0) },
            _count: tc._count,
            customer: cust ? { name: cust.name } : undefined
        }
    })

    // Format dates
    const monthName = now.toLocaleString('id-ID', { month: 'long', year: 'numeric' })
    const lastMonthName = new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })
    const todayFormatted = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    const reportDate = `Per ${now.getDate()} ${monthName}`

    // Convert transactions for client component
    type TransactionWithRelations = Transaction & {
        customer: Customer
        items: (TransactionItem & { product: Product })[]
    }
    const plainTransactions = recentTransactions.map((tx: TransactionWithRelations) => ({
        id: tx.id,
        date: tx.date,
        status: tx.status,
        totalAmount: Number(tx.totalAmount),
        customer: { name: tx.customer.name },
        items: tx.items.map((item: TransactionItem & { product: Product }) => ({
            product: { name: item.product.name }
        }))
    }))

    // Build data object for client component - ALL REAL DATA
    const reportData = {
        // Today
        todaySales,
        todayCOGS,
        todayGrossProfit,
        todayNetProfit,
        todayExpenses,
        todayTransactionCount,
        recentTransactions: plainTransactions,

        // Month
        monthSales,
        monthCOGS,
        monthGrossProfit,
        monthNetProfit,
        monthExpenses,
        monthTransactionCount,
        salesGrowth,
        profitGrowth,
        expenseMap: Object.fromEntries(expenseMap),

        // Top data
        topProductsWithNames,
        topCustomersWithNames,

        // Balance
        totalReceivables: Number(totalReceivables._sum.balance ?? 0),
        totalPayables: Number(totalPayables._sum.balance ?? 0),
        inventoryValue,

        // Dates
        todayFormatted,
        monthName,
        lastMonthName,
        reportDate,
        currentMonth: now.getMonth(),
        currentYear: now.getFullYear(),
    }

    return <ReportsClient data={reportData} />
}
