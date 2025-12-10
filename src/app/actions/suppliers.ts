'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// ==================== SUPPLIER CRUD ====================
export async function createSupplier(formData: FormData) {
    const name = formData.get("name") as string
    const phone = formData.get("phone") as string
    const address = formData.get("address") as string

    if (!name) return { error: "Nama supplier wajib diisi" }

    try {
        await prisma.supplier.create({
            data: { name, phone, address }
        })
        revalidatePath("/dashboard/suppliers")
        return { success: true }
    } catch (e) {
        return { error: "Gagal menambah supplier" }
    }
}

export async function updateSupplier(id: string, formData: FormData) {
    const name = formData.get("name") as string
    const phone = formData.get("phone") as string
    const address = formData.get("address") as string

    try {
        await prisma.supplier.update({
            where: { id },
            data: { name, phone, address }
        })
        revalidatePath("/dashboard/suppliers")
        return { success: true }
    } catch (e) {
        return { error: "Gagal update supplier" }
    }
}

// ==================== PURCHASE (Pembelian / Stock IN) ====================
export type PurchaseItem = {
    productId: string
    name: string
    qty: number
    cost: number
}

export async function createPurchase(
    supplierId: string,
    items: PurchaseItem[],
    paidAmount: number,
    invoiceNo?: string,
    note?: string
) {
    if (!items.length) return { error: "Item pembelian kosong" }

    const totalAmount = items.reduce((sum, item) => sum + (item.cost * item.qty), 0)
    const remaining = totalAmount - paidAmount
    const status = remaining <= 0 ? "LUNAS" : "HUTANG"

    try {
        await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
            // 1. Create Purchase record
            const purchase = await tx.purchase.create({
                data: {
                    supplierId,
                    invoiceNo,
                    totalAmount,
                    paidAmount,
                    remaining,
                    status,
                    note,
                    items: {
                        create: items.map(item => ({
                            productId: item.productId,
                            qty: item.qty,
                            cost: item.cost
                        }))
                    }
                }
            })

            // 2. Update stock for each product (INCREMENT)
            for (const item of items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: { increment: item.qty },
                        hpp: item.cost // Update HPP ke harga beli terakhir
                    }
                })
            }

            // 3. Update Supplier balance (Hutang)
            if (remaining > 0) {
                await tx.supplier.update({
                    where: { id: supplierId },
                    data: {
                        balance: { increment: remaining }
                    }
                })
            }

            // 4. Record cash flow if there's payment
            if (paidAmount > 0) {
                const lastCashFlow = await tx.cashFlow.findFirst({
                    orderBy: { createdAt: 'desc' }
                })
                const currentBalance = lastCashFlow ? Number(lastCashFlow.balance) : 0

                await tx.cashFlow.create({
                    data: {
                        type: 'CREDIT',
                        category: 'PEMBELIAN',
                        description: `Pembelian dari ${supplierId}`,
                        amount: paidAmount,
                        refType: 'PURCHASE',
                        refId: purchase.id,
                        balance: currentBalance - paidAmount
                    }
                })
            }

            return purchase
        })

        revalidatePath("/dashboard/suppliers")
        revalidatePath("/dashboard/products")
        revalidatePath("/dashboard/purchases")
        return { success: true }
    } catch (e) {
        console.error(e)
        return { error: "Gagal memproses pembelian" }
    }
}

// ==================== SUPPLIER PAYMENT (Bayar Hutang ke Supplier) ====================
export async function paySupplier(supplierId: string, amount: number, note?: string) {
    try {
        await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
            // 1. Create payment record
            await tx.supplierPayment.create({
                data: {
                    supplierId,
                    amount,
                    method: "CASH",
                    note
                }
            })

            // 2. Reduce supplier balance
            await tx.supplier.update({
                where: { id: supplierId },
                data: {
                    balance: { decrement: amount }
                }
            })

            // 3. Record cash flow
            const lastCashFlow = await tx.cashFlow.findFirst({
                orderBy: { createdAt: 'desc' }
            })
            const currentBalance = lastCashFlow ? Number(lastCashFlow.balance) : 0

            await tx.cashFlow.create({
                data: {
                    type: 'CREDIT',
                    category: 'PEMBELIAN',
                    description: `Bayar hutang ke supplier`,
                    amount,
                    refType: 'PAYMENT_OUT',
                    refId: supplierId,
                    balance: currentBalance - amount
                }
            })
        })

        revalidatePath("/dashboard/suppliers")
        revalidatePath("/dashboard/cashflow")
        return { success: true }
    } catch (e) {
        return { error: "Gagal memproses pembayaran" }
    }
}
