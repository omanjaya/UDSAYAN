import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface ProductData {
    name: string
    stock: number
    hpp: number
    price: number
    unit: string
    category: string
}

interface CustomerData {
    name: string
    phone: string
    address: string
    balance: number
}

interface SupplierData {
    name: string
    phone: string
    address: string
    balance: number
}

interface TransactionData {
    date: string
    item: string
    qty: number
    hpp: number
    price: number
    customer: string
    status: string
    nominal: number
}

interface SeedData {
    products: ProductData[]
    customers: CustomerData[]
    suppliers: SupplierData[]
    transactions: TransactionData[]
}

function cleanId(name: string): string {
    return name.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 25)
}

async function main() {
    console.log('🌱 Starting full data import from Excel...')

    // Read seed data from JSON
    const dataPath = path.join(__dirname, 'seed-data.json')
    const rawData = fs.readFileSync(dataPath, 'utf-8')
    const data: SeedData = JSON.parse(rawData)

    // 1. Clear existing data
    console.log('🗑️  Clearing existing data...')
    await prisma.transactionItem.deleteMany()
    await prisma.transaction.deleteMany()
    await prisma.purchaseItem.deleteMany()
    await prisma.purchase.deleteMany()
    await prisma.payment.deleteMany()
    await prisma.supplierPayment.deleteMany()
    await prisma.stockOpname.deleteMany()
    await prisma.cashFlow.deleteMany()
    await prisma.customer.deleteMany()
    await prisma.supplier.deleteMany()
    await prisma.product.deleteMany()

    // 2. Create default "Pelanggan Umum"
    console.log('👤 Creating default customer...')
    await prisma.customer.create({
        data: {
            id: 'umum',
            name: 'Pelanggan Umum',
            phone: '-',
            address: '-',
            balance: 0,
        },
    })

    // 3. Seed Products (with real HPP & HJ)
    console.log(`📦 Seeding ${data.products.length} products...`)
    const productMap = new Map<string, string>()
    for (const product of data.products) {
        const id = cleanId(product.name)
        productMap.set(product.name.toLowerCase(), id)
        try {
            await prisma.product.create({
                data: {
                    id,
                    name: product.name,
                    stock: product.stock,
                    hpp: product.hpp,
                    price: product.price,
                    unit: product.unit,
                    category: product.category,
                },
            })
        } catch (e) {
            // Skip duplicates
        }
    }

    // 4. Seed Customers (with BON balances)
    console.log(`👥 Seeding ${data.customers.length} customers with balances...`)
    const customerMap = new Map<string, string>()
    for (const customer of data.customers) {
        const id = cleanId(customer.name)
        customerMap.set(customer.name.toLowerCase(), id)
        try {
            await prisma.customer.create({
                data: {
                    id,
                    name: customer.name,
                    phone: customer.phone,
                    address: customer.address,
                    balance: customer.balance,
                },
            })
        } catch (e) {
            // Skip duplicates
        }
    }

    // 5. Seed Suppliers
    console.log(`🚚 Seeding ${data.suppliers.length} suppliers...`)
    for (const supplier of data.suppliers) {
        const id = cleanId(supplier.name)
        try {
            await prisma.supplier.create({
                data: {
                    id,
                    name: supplier.name,
                    phone: supplier.phone,
                    address: supplier.address,
                    balance: supplier.balance,
                },
            })
        } catch (e) {
            // Skip duplicates
        }
    }

    // 6. Seed Sample Transactions
    console.log(`💰 Seeding ${data.transactions.length} sample transactions...`)
    let successCount = 0
    for (const tx of data.transactions) {
        try {
            // Find product and customer IDs
            const productId = productMap.get(tx.item.toLowerCase())
            const customerId = customerMap.get(tx.customer.toLowerCase()) || 'umum'

            if (!productId) continue

            const totalAmount = tx.price * tx.qty
            const status = tx.status.toUpperCase() === 'BON' ? 'BON' : 'LUNAS'
            const paidAmount = status === 'LUNAS' ? totalAmount : 0
            const remaining = status === 'BON' ? totalAmount : 0

            // Parse date
            let transactionDate = new Date()
            try {
                if (tx.date && tx.date !== 'NaT') {
                    transactionDate = new Date(tx.date)
                    if (isNaN(transactionDate.getTime())) {
                        transactionDate = new Date()
                    }
                }
            } catch {
                transactionDate = new Date()
            }

            await prisma.transaction.create({
                data: {
                    date: transactionDate,
                    customerId,
                    totalAmount,
                    paidAmount,
                    remaining,
                    status,
                    type: 'SALE',
                    paymentMethod: status === 'LUNAS' ? 'CASH' : null,
                    items: {
                        create: [{
                            productId,
                            qty: tx.qty,
                            price: tx.price,
                            cost: tx.hpp
                        }]
                    }
                }
            })
            successCount++
        } catch (e) {
            // Skip failed transactions
        }
    }

    console.log('✅ Seed completed!')
    console.log(`   - ${data.products.length} products (with real HPP & Harga Jual)`)
    console.log(`   - ${data.customers.length + 1} customers (with BON balances)`)
    console.log(`   - ${data.suppliers.length} suppliers`)
    console.log(`   - ${successCount} sample transactions imported`)
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
