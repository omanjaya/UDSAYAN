'use client'

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { createProduct, updateProduct } from "@/app/actions/products" // We will adjust the action signature effectively
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"

// Type definition for Product (simplified from Prisma)
type Product = {
    id: string
    code: string | null  // Kode produk singkat
    name: string
    stock: number
    hpp: any // Decimal in Prisma is complicated in simple Typescript interface usually number or string
    price: any
    unit: string
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : isEditing ? "Simpan Perubahan" : "Tambah Produk"}
        </Button>
    )
}

export function ProductDialog({
    product,
    open,
    onOpenChange
}: {
    product?: Product | null
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const isEditing = !!product

    async function clientAction(formData: FormData) {
        let result;
        if (isEditing && product) {
            // Wrapper to match signature expected by useFormState if we used it, 
            // but here we just call directly for simplicity in this iteration
            result = await updateProduct(product.id, {}, formData)
        } else {
            result = await createProduct({}, formData)
        }

        if (result.message === "Success") {
            toast.success(isEditing ? "Produk berhasil diupdate" : "Produk berhasil ditambahkan")
            onOpenChange(false)
        } else {
            toast.error(result.message || "Terjadi kesalahan")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Produk" : "Tambah Produk Baru"}</DialogTitle>
                    <DialogDescription>
                        Masukkan detail produk di bawah ini.
                    </DialogDescription>
                </DialogHeader>
                <form action={clientAction} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="code" className="text-right">
                            Kode
                        </Label>
                        <Input
                            id="code"
                            name="code"
                            placeholder="e.g. A2040, GS10"
                            defaultValue={product?.code ?? ''}
                            className="col-span-3 uppercase"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Nama
                        </Label>
                        <Input
                            id="name"
                            name="name"
                            defaultValue={product?.name}
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="unit" className="text-right">
                            Satuan
                        </Label>
                        <Input
                            id="unit"
                            name="unit"
                            placeholder="e.g. m2, pcs"
                            defaultValue={product?.unit}
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="stock" className="text-right">
                            Stok Awal
                        </Label>
                        <Input
                            id="stock"
                            name="stock"
                            type="number"
                            defaultValue={product?.stock ?? 0}
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="hpp" className="text-right">
                            HPP (Modal)
                        </Label>
                        <Input
                            id="hpp"
                            name="hpp"
                            type="number"
                            step="500"
                            defaultValue={product?.hpp?.toString()}
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="price" className="text-right">
                            Harga Jual
                        </Label>
                        <Input
                            id="price"
                            name="price"
                            type="number"
                            step="500"
                            defaultValue={product?.price?.toString()}
                            className="col-span-3"
                            required
                        />
                    </div>
                    <DialogFooter>
                        <SubmitButton isEditing={isEditing} />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
