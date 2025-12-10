'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createCustomer(formData: FormData) {
    const name = formData.get("name") as string
    const phone = formData.get("phone") as string
    const address = formData.get("address") as string

    if (!name) return { message: "Name required" }

    try {
        await prisma.customer.create({
            data: { name, phone, address }
        })
        revalidatePath("/dashboard/customers")
        return { message: "Success" }
    } catch (e) {
        return { message: "Failed" }
    }
}

export async function updateCustomer(id: string, formData: FormData) {
    // Similar logic
    const name = formData.get("name") as string
    const phone = formData.get("phone") as string
    const address = formData.get("address") as string

    try {
        await prisma.customer.update({
            where: { id },
            data: { name, phone, address }
        })
        revalidatePath("/dashboard/customers")
        return { message: "Success" }
    } catch (e) {
        return { message: "Failed" }
    }
}

export async function deleteCustomer(id: string) {
    try {
        await prisma.customer.delete({ where: { id } })
        revalidatePath("/dashboard/customers")
        return { message: "Success" }
    } catch (e) {
        return { message: "Failed to delete" }
    }
}

export async function processPayment(customerId: string, amount: number, note?: string) {
    try {
        await prisma.$transaction(async (tx) => {
            // 1. Create Payment Record
            await tx.payment.create({
                data: {
                    customerId,
                    amount,
                    method: "CASH",
                    note
                }
            })

            // 2. Reduce Customer Balance (Hutang berkurang)
            await tx.customer.update({
                where: { id: customerId },
                data: {
                    balance: {
                        decrement: amount
                    }
                }
            })
        })

        revalidatePath("/dashboard/customers")
        revalidatePath("/dashboard")
        return { success: true }
    } catch (e) {
        return { success: false, message: "Gagal memproses pembayaran" }
    }
}
