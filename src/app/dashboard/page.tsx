import prisma from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Users, Package, CreditCard, TrendingUp, TrendingDown, AlertTriangle, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(number)
}

export default async function DashboardPage() {
    const [
        todaySales,
        totalReceivables,
        totalPayables,
        lowStockCount,
        newCustomers,
        recentTransactions,
        totalProducts
    ] = await Promise.all([
        prisma.transaction.aggregate({
            _sum: { totalAmount: true },
            _count: true,
            where: {
                date: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0))
                }
            }
        }),
        prisma.customer.aggregate({
            _sum: { balance: true },
            _count: true,
            where: { balance: { gt: 0 } }
        }),
        prisma.supplier.aggregate({
            _sum: { balance: true },
            _count: true,
            where: { balance: { gt: 0 } }
        }),
        prisma.product.count({
            where: { stock: { lte: 5 } }
        }),
        prisma.customer.count({
            where: {
                createdAt: {
                    gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                }
            }
        }),
        prisma.transaction.findMany({
            take: 5,
            orderBy: { date: 'desc' },
            include: { customer: true }
        }),
        prisma.product.count()
    ])

    const statsCards = [
        {
            title: "Penjualan Hari Ini",
            value: formatRupiah(Number(todaySales._sum.totalAmount ?? 0)),
            subtitle: `${todaySales._count} transaksi`,
            icon: DollarSign,
            trend: "up",
            color: "bg-gradient-to-br from-emerald-500 to-teal-600",
            href: "/dashboard/transactions"
        },
        {
            title: "Total Piutang",
            value: formatRupiah(Number(totalReceivables._sum.balance ?? 0)),
            subtitle: `${totalReceivables._count} pelanggan`,
            icon: TrendingUp,
            trend: "warning",
            color: "bg-gradient-to-br from-amber-500 to-orange-600",
            href: "/dashboard/customers"
        },
        {
            title: "Total Hutang",
            value: formatRupiah(Number(totalPayables._sum.balance ?? 0)),
            subtitle: `${totalPayables._count} supplier`,
            icon: TrendingDown,
            trend: "danger",
            color: "bg-gradient-to-br from-rose-500 to-pink-600",
            href: "/dashboard/suppliers"
        },
        {
            title: "Stok Kritis",
            value: lowStockCount.toString(),
            subtitle: `dari ${totalProducts} produk`,
            icon: AlertTriangle,
            trend: lowStockCount > 0 ? "danger" : "up",
            color: "bg-gradient-to-br from-violet-500 to-purple-600",
            href: "/dashboard/stock-opname"
        },
    ]

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Selamat datang kembali! Berikut ringkasan bisnis Anda.</p>
                </div>
                <div className="flex gap-2">
                    <Button asChild>
                        <Link href="/dashboard/pos">
                            <DollarSign className="h-4 w-4 mr-2" />
                            Buat Transaksi
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statsCards.map((stat) => (
                    <Link key={stat.title} href={stat.href}>
                        <Card className="hover-lift cursor-pointer overflow-hidden">
                            <div className={`${stat.color} p-4`}>
                                <div className="flex items-center justify-between">
                                    <stat.icon className="h-8 w-8 text-white/80" />
                                    <ArrowUpRight className="h-5 w-5 text-white/60" />
                                </div>
                            </div>
                            <CardContent className="p-4">
                                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                                <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Quick Stats Row */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Pelanggan Baru</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{newCustomers}</div>
                        <p className="text-xs text-muted-foreground">Bulan ini</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalProducts}</div>
                        <p className="text-xs text-muted-foreground">Item terdaftar</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Margin Hari Ini</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">-</div>
                        <p className="text-xs text-muted-foreground">Lihat di Laporan L/R</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Transaksi Terakhir</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">5 penjualan terbaru</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/dashboard/transactions">Lihat Semua</Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {recentTransactions.length === 0 ? (
                        <div className="text-center py-8">
                            <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-muted-foreground">Belum ada transaksi hari ini</p>
                            <Button className="mt-4" asChild>
                                <Link href="/dashboard/pos">Mulai Transaksi</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {recentTransactions.map((t) => (
                                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${t.status === 'LUNAS' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                        <div>
                                            <p className="font-medium">{t.customer.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(t.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} · {t.status}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">{formatRupiah(Number(t.totalAmount))}</p>
                                        {Number(t.remaining) > 0 && (
                                            <p className="text-xs text-amber-600">Sisa: {formatRupiah(Number(t.remaining))}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
