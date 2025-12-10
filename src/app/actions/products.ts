'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export type ProductState = {
    errors?: {
        code?: string[]
        name?: string[]
        stock?: string[]
        hpp?: string[]
        price?: string[]
        unit?: string[]
    }
    message?: string
}

export async function createProduct(prevState: ProductState, formData: FormData) {
    const code = (formData.get("code") as string)?.trim().toUpperCase() || null
    const name = formData.get("name") as string
    const stock = parseInt(formData.get("stock") as string)
    const hpp = parseFloat(formData.get("hpp") as string)
    const price = parseFloat(formData.get("price") as string)
    const unit = formData.get("unit") as string

    // Simple validation
    if (!name || isNaN(stock) || isNaN(hpp) || isNaN(price) || !unit) {
        return {
            message: "Please fill all fields correctly"
        }
    }

    try {
        await prisma.product.create({
            data: {
                code: code || null,
                name,
                stock,
                hpp,
                price,
                unit,
            },
        })

        revalidatePath("/dashboard/products")
        revalidatePath("/dashboard/pos")
        return { message: "Success" }
    } catch (e: any) {
        if (e?.code === 'P2002') {
            return { message: "Kode produk sudah digunakan" }
        }
        return { message: "Failed to create product" }
    }
}

export async function updateProduct(id: string, prevState: ProductState, formData: FormData) {
    const code = (formData.get("code") as string)?.trim().toUpperCase() || null
    const name = formData.get("name") as string
    const stock = parseInt(formData.get("stock") as string)
    const hpp = parseFloat(formData.get("hpp") as string)
    const price = parseFloat(formData.get("price") as string)
    const unit = formData.get("unit") as string

    try {
        await prisma.product.update({
            where: { id },
            data: {
                code: code || null,
                name,
                stock,
                hpp,
                price,
                unit,
            },
        })

        revalidatePath("/dashboard/products")
        revalidatePath("/dashboard/pos")
        return { message: "Success" }
    } catch (e: any) {
        if (e?.code === 'P2002') {
            return { message: "Kode produk sudah digunakan" }
        }
        return { message: "Failed to update product" }
    }
}

export async function deleteProduct(id: string) {
    try {
        await prisma.product.delete({
            where: { id },
        })
        revalidatePath("/dashboard/products")
        return { message: "Success" }
    } catch (e) {
        return { message: "Failed to delete product" }
    }
}
