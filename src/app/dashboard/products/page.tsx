import prisma from "@/lib/prisma"
import { ProductList } from "@/components/products/product-list"

export default async function ProductsPage() {
    const products = await prisma.product.findMany({
        orderBy: {
            name: 'asc'
        }
    })

    // Convert Decimal to number for Client Component serialization
    const plainProducts = products.map(p => ({
        ...p,
        hpp: Number(p.hpp),
        price: Number(p.price),
    }))

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Master Produk</h1>
            </div>
            <ProductList initialProducts={plainProducts} />
        </div>
    )
}
