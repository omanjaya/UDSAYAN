import prisma from "@/lib/prisma"
import { SupplierList } from "@/components/suppliers/supplier-list"

export default async function SuppliersPage() {
    const suppliers = await prisma.supplier.findMany({
        orderBy: { name: 'asc' }
    })

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">Data Supplier & Hutang</h1>
            <SupplierList initialSuppliers={suppliers} />
        </div>
    )
}
