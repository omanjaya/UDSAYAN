'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// ==================== CASH FLOW ====================
export async function createCashFlow(
    type: 'DEBIT' | 'CREDIT',
    category: string,
    description: string,
    amount: number
) {
    try {
        // Get current balance
        const lastCashFlow = await prisma.cashFlow.findFirst({
            orderBy: { createdAt: 'desc' }
        })
        const currentBalance = lastCashFlow ? Number(lastCashFlow.balance) : 0
        const newBalance = type === 'DEBIT'
            ? currentBalance + amount
            : currentBalance - amount

        await prisma.cashFlow.create({
            data: {
                type,
                category,
                description,
                amount,
                balance: newBalance
            }
        })

        revalidatePath("/dashboard/cashflow")
        return { success: true }
    } catch (e) {
        return { error: "Gagal mencatat transaksi kas" }
    }
}

// ==================== STOCK OPNAME ====================
export async function createStockOpname(
    productId: string,
    stockActual: number,
    reason?: string,
    note?: string
) {
    try {
        // Get current system stock
        const product = await prisma.product.findUnique({
            where: { id: productId }
        })

        if (!product) return { error: "Produk tidak ditemukan" }

        const stockSystem = product.stock
        const difference = stockActual - stockSystem

        await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
            // 1. Create opname record
            await tx.stockOpname.create({
                data: {
                    productId,
                    stockSystem,
                    stockActual,
                    difference,
                    reason,
                    note
                }
            })

            // 2. Adjust product stock to match actual
            await tx.product.update({
                where: { id: productId },
                data: { stock: stockActual }
            })
        })

        revalidatePath("/dashboard/products")
        revalidatePath("/dashboard/stock-opname")
        return { success: true, difference }
    } catch (e) {
        return { error: "Gagal memproses stock opname" }
    }
}

export async function getStockOpnameHistory(productId?: string) {
    return prisma.stockOpname.findMany({
        where: productId ? { productId } : undefined,
        include: { product: true },
        orderBy: { date: 'desc' }
    })
}
