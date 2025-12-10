import prisma from "@/lib/prisma"
import { CustomerList } from "@/components/customers/customer-list"

export default async function CustomersPage() {
    const customers = await prisma.customer.findMany({
        orderBy: { name: 'asc' }
    })

    // Convert Decimal to number for Client Component serialization
    const plainCustomers = customers.map(c => ({
        ...c,
        balance: Number(c.balance),
    }))

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">Data Pelanggan & Piutang</h1>
            <CustomerList initialCustomers={plainCustomers} />
        </div>
    )
}
