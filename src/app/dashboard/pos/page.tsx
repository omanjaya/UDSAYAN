import prisma from "@/lib/prisma"
import POSClient from "@/components/pos/pos-client"

export default async function POSPage() {
    const [products, customers] = await Promise.all([
        prisma.product.findMany({ orderBy: { name: 'asc' } }),
        prisma.customer.findMany({ orderBy: { name: 'asc' } })
    ])

    // Ensure there's always at least "Pelanggan Umum"
    let customerList = customers
    if (customers.length === 0 || !customers.find(c => c.id === 'umum')) {
        // Create default customer if not exists
        const defaultCustomer = await prisma.customer.upsert({
            where: { id: 'umum' },
            update: {},
            create: {
                id: 'umum',
                name: 'Pelanggan Umum',
                phone: '-',
                address: '-',
            }
        })
        customerList = [defaultCustomer, ...customers.filter(c => c.id !== 'umum')]
    }

    // Convert Decimal to number for Client Component serialization
    const plainProducts = products.map(p => ({
        ...p,
        hpp: Number(p.hpp),
        price: Number(p.price),
    }))

    const plainCustomers = customerList.map(c => ({
        ...c,
        balance: Number(c.balance),
    }))

    return (
        <div className="h-full">
            <POSClient products={plainProducts} customers={plainCustomers} />
        </div>
    )
}
