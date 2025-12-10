'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function saveMonthlyExpense(
    category: string,
    amount: number,
    month: number,
    year: number
) {
    if (amount < 0) {
        return { error: "Jumlah tidak boleh negatif" }
    }

    try {
        // Set date to first of the target month
        const date = new Date(year, month, 1)

        // Get current cash balance
        const lastCashFlow = await prisma.cashFlow.findFirst({
            orderBy: { createdAt: 'desc' }
        })
        const currentBalance = lastCashFlow ? Number(lastCashFlow.balance) : 0

        // Check if expense already exists for this category/month
        const startOfMonth = new Date(year, month, 1)
        const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59)

        const existingExpense = await prisma.cashFlow.findFirst({
            where: {
                type: 'CREDIT',
                category: category,
                date: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            }
        })

        if (existingExpense) {
            // Update existing
            if (amount === 0) {
                // Delete if zero
                await prisma.cashFlow.delete({
                    where: { id: existingExpense.id }
                })
            } else {
                await prisma.cashFlow.update({
                    where: { id: existingExpense.id },
                    data: {
                        amount: amount,
                        balance: currentBalance - amount
                    }
                })
            }
        } else if (amount > 0) {
            // Create new expense entry
            await prisma.cashFlow.create({
                data: {
                    type: 'CREDIT',
                    category: category,
                    description: `Beban ${category} - ${date.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}`,
                    amount: amount,
                    date: date,
                    balance: currentBalance - amount
                }
            })
        }

        revalidatePath('/dashboard/reports')
        revalidatePath('/dashboard/cashflow')
        return { success: true }
    } catch (e) {
        console.error(e)
        return { error: "Gagal menyimpan beban usaha" }
    }
}
