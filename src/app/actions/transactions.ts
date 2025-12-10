'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export type CartItem = {
    productId: string
    name: string
    price: number
    cost: number // HPP
    qty: number
    unit: string
}

export async function createTransaction(
    customerId: string,
    items: CartItem[],
    paidAmount: number,
    paymentMethod: string,
    note?: string
) {
    if (!items.length) return { error: "Keranjang kosong" }

    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.qty), 0)
    const remaining = totalAmount - paidAmount
    const status = remaining <= 0 ? "LUNAS" : "BON"

    try {
        // We use a transaction to ensure data integrity
        const result = await prisma.$transaction(async (tx) => {
            // Get customer name for stock movement
            const customer = await tx.customer.findUnique({ where: { id: customerId } })

            // 1. Create Transaction Record
            const transaction = await tx.transaction.create({
                data: {
                    customerId,
                    totalAmount,
                    paidAmount,
                    remaining,
                    status,
                    type: "SALE",
                    paymentMethod: status === "LUNAS" ? paymentMethod : "PARTIAL",
                    note,
                    items: {
                        create: items.map(item => ({
                            productId: item.productId,
                            qty: item.qty,
                            price: item.price,
                            cost: item.cost
                        }))
                    }
                }
            })

            // 2. Update Stock for each product and record StockMovement (OUT)
            for (const item of items) {
                const product = await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: {
                            decrement: item.qty
                        }
                    }
                })

                // Record stock movement (OUT) - like Excel MAIN sheet
                await tx.stockMovement.create({
                    data: {
                        date: new Date(),
                        productId: item.productId,
                        type: 'OUT',
                        qty: item.qty,
                        hpp: item.cost,
                        hj: item.price,
                        stockAfter: product.stock,
                        refType: 'SALE',
                        refId: transaction.id,
                        customerName: customer?.name,
                        status: status
                    }
                })
            }

            // 3. Update Customer Balance (Piutang)
            if (remaining > 0) {
                await tx.customer.update({
                    where: { id: customerId },
                    data: {
                        balance: {
                            increment: remaining // Hutang bertambah
                        }
                    }
                })
            }

            // 4. Record CashFlow if there's payment
            if (paidAmount > 0) {
                const lastCashFlow = await tx.cashFlow.findFirst({
                    orderBy: { createdAt: 'desc' }
                })
                const currentBalance = lastCashFlow ? Number(lastCashFlow.balance) : 0

                await tx.cashFlow.create({
                    data: {
                        type: 'DEBIT',
                        category: 'PENJUALAN',
                        description: `Penjualan #${transaction.id.slice(0, 8).toUpperCase()}`,
                        amount: paidAmount,
                        refType: 'SALE',
                        refId: transaction.id,
                        balance: currentBalance + paidAmount
                    }
                })
            }

            return transaction
        })

        revalidatePath("/dashboard")
        revalidatePath("/dashboard/products")
        revalidatePath("/dashboard/customers")

        return { success: true, transactionId: result.id }
    } catch (e) {
        console.error(e)
        return { error: "Gagal memproses transaksi" }
    }
}
