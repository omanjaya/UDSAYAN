'use client'

import { useState, useRef, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { TrendingUp, TrendingDown, Calendar, BarChart3, Receipt, Users, Printer, Save, Edit2, X } from "lucide-react"
import { saveMonthlyExpense } from "@/app/actions/expenses"
import { toast } from "sonner"

const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "decimal",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(number)
}

const parseRupiah = (str: string): number => {
    return parseInt(str.replace(/[^0-9]/g, '')) || 0
}

interface ReportData {
    todaySales: number
    todayCOGS: number
    todayGrossProfit: number
    todayNetProfit: number
    todayExpenses: number
    todayTransactionCount: number
    recentTransactions: Array<{
        id: string
        date: Date
        status: string
        totalAmount: number
        customer: { name: string }
        items: Array<{ product: { name: string } }>
    }>
    monthSales: number
    monthCOGS: number
    monthGrossProfit: number
    monthNetProfit: number
    monthExpenses: number
    monthTransactionCount: number
    salesGrowth: number
    profitGrowth: number
    expenseMap: Record<string, number>
    topProductsWithNames: Array<{
        productId: string
        _sum: { qty: number | null }
        _count: number
        product?: { name: string; unit: string }
    }>
    topCustomersWithNames: Array<{
        customerId: string
        _sum: { totalAmount: number | null }
        _count: number
        customer?: { name: string }
    }>
    totalReceivables: number
    totalPayables: number
    inventoryValue: number
    todayFormatted: string
    monthName: string
    lastMonthName: string
    reportDate: string
    currentMonth: number
    currentYear: number
}

const EXPENSE_CATEGORIES = [
    { key: 'GAJI', label: 'Biaya Gaji' },
    { key: 'BANTEN', label: 'Biaya Banten' },
    { key: 'AIR', label: 'Biaya Air' },
    { key: 'LISTRIK', label: 'Biaya Listrik' },
    { key: 'WIFI', label: 'Biaya Wifi' },
    { key: 'PULSA', label: 'Biaya Pulsa' },
    { key: 'BANK', label: 'Biaya Bank' },
    { key: 'SERVICE', label: 'Biaya Service Mobil' },
    { key: 'LAINNYA', label: 'Biaya Lain-lain' },
    { key: 'KOMISI', label: 'Komisi Penjualan' },
    { key: 'TRANSPORT', label: 'Biaya Transport' },
    { key: 'BONGKAR', label: 'Biaya Bongkar' },
]

export function ReportsClient({ data }: { data: ReportData }) {
    const [activeTab, setActiveTab] = useState('pl')
    const [isEditMode, setIsEditMode] = useState(false)
    const [editedExpenses, setEditedExpenses] = useState<Record<string, number>>({ ...data.expenseMap })
    const [isPending, startTransition] = useTransition()
    const printRef = useRef<HTMLDivElement>(null)

    const handlePrint = () => window.print()

    const toggleEditMode = () => {
        if (isEditMode) setEditedExpenses({ ...data.expenseMap })
        setIsEditMode(!isEditMode)
    }

    const handleExpenseChange = (key: string, value: string) => {
        setEditedExpenses(prev => ({ ...prev, [key]: parseRupiah(value) }))
    }

    const handleSaveExpenses = () => {
        startTransition(async () => {
            for (const cat of EXPENSE_CATEGORIES) {
                const newAmount = editedExpenses[cat.key] ?? 0
                const oldAmount = data.expenseMap[cat.key] ?? 0
                if (newAmount !== oldAmount) {
                    const result = await saveMonthlyExpense(cat.key, newAmount, data.currentMonth, data.currentYear)
                    if (result.error) {
                        toast.error(`Gagal: ${result.error}`)
                        return
                    }
                }
            }
            toast.success("Beban usaha berhasil disimpan!")
            setIsEditMode(false)
        })
    }

    const totalExpenses = isEditMode
        ? Object.values(editedExpenses).reduce((sum, val) => sum + val, 0)
        : data.monthExpenses
    const netProfit = data.monthGrossProfit - totalExpenses

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between no-print">
                <h1 className="text-2xl font-bold">Laporan Keuangan</h1>
                <Button variant="outline" onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" /> Print / PDF
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5 no-print">
                    <TabsTrigger value="pl">Laba Rugi</TabsTrigger>
                    <TabsTrigger value="daily">Harian</TabsTrigger>
                    <TabsTrigger value="monthly">Bulanan</TabsTrigger>
                    <TabsTrigger value="top">Terlaris</TabsTrigger>
                    <TabsTrigger value="balance">Neraca</TabsTrigger>
                </TabsList>

                {/* LABA RUGI */}
                <TabsContent value="pl" className="mt-4">
                    <Card className="print-area">
                        <CardContent className="p-8">
                            <div className="text-center mb-6">
                                <h1 className="text-xl font-bold uppercase">UD. MITRA USAHA SAYAN</h1>
                                <h2 className="text-lg font-semibold">Laporan Laba Rugi</h2>
                                <p className="text-sm text-muted-foreground">{data.reportDate}</p>
                            </div>

                            <div className="flex justify-end mb-4 no-print">
                                {isEditMode ? (
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={toggleEditMode} disabled={isPending}>
                                            <X className="h-4 w-4 mr-1" /> Batal
                                        </Button>
                                        <Button size="sm" onClick={handleSaveExpenses} disabled={isPending}>
                                            <Save className="h-4 w-4 mr-1" /> {isPending ? 'Menyimpan...' : 'Simpan'}
                                        </Button>
                                    </div>
                                ) : (
                                    <Button variant="outline" size="sm" onClick={toggleEditMode}>
                                        <Edit2 className="h-4 w-4 mr-1" /> Edit Beban
                                    </Button>
                                )}
                            </div>

                            <div className="max-w-2xl mx-auto space-y-4">
                                {/* PENDAPATAN */}
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-blue-50 dark:bg-blue-950 px-4 py-2 font-bold text-blue-800 dark:text-blue-200">
                                        PENDAPATAN
                                    </div>
                                    <div className="divide-y">
                                        <div className="flex justify-between px-4 py-2">
                                            <span className="pl-4">Penjualan</span>
                                            <span className="font-mono">Rp {formatRupiah(data.monthSales)}</span>
                                        </div>
                                        <div className="flex justify-between px-4 py-2 bg-muted/30 font-semibold">
                                            <span>Jumlah Pendapatan</span>
                                            <span className="font-mono">Rp {formatRupiah(data.monthSales)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* HPP */}
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-orange-50 dark:bg-orange-950 px-4 py-2 font-bold text-orange-800 dark:text-orange-200">
                                        HPP
                                    </div>
                                    <div className="flex justify-between px-4 py-2">
                                        <span className="pl-4">Harga Pokok Penjualan</span>
                                        <span className="font-mono text-red-600">(Rp {formatRupiah(data.monthCOGS)})</span>
                                    </div>
                                </div>

                                {/* LABA KOTOR */}
                                <div className="border-2 border-emerald-500 rounded-lg px-4 py-3 bg-emerald-50 dark:bg-emerald-950">
                                    <div className="flex justify-between font-bold text-lg">
                                        <span className="text-emerald-800 dark:text-emerald-200">LABA KOTOR</span>
                                        <span className="font-mono text-emerald-600">Rp {formatRupiah(data.monthGrossProfit)}</span>
                                    </div>
                                    <div className="text-xs text-emerald-600">
                                        Margin: {data.monthSales > 0 ? ((data.monthGrossProfit / data.monthSales) * 100).toFixed(1) : 0}%
                                    </div>
                                </div>

                                {/* BEBAN USAHA - EDITABLE */}
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-red-50 dark:bg-red-950 px-4 py-2 font-bold text-red-800 dark:text-red-200 flex justify-between">
                                        <span>BEBAN USAHA</span>
                                        {isEditMode && <Badge variant="secondary">Mode Edit</Badge>}
                                    </div>
                                    <div className="divide-y">
                                        {EXPENSE_CATEGORIES.map(cat => {
                                            const amount = isEditMode ? (editedExpenses[cat.key] ?? 0) : (data.expenseMap[cat.key] ?? 0)
                                            return (
                                                <div key={cat.key} className="flex justify-between items-center px-4 py-1.5">
                                                    <span className="pl-4 text-sm">{cat.label}</span>
                                                    {isEditMode ? (
                                                        <Input
                                                            type="text"
                                                            className="w-36 text-right font-mono h-7 text-sm"
                                                            value={amount > 0 ? formatRupiah(amount) : ''}
                                                            onChange={(e) => handleExpenseChange(cat.key, e.target.value)}
                                                            placeholder="0"
                                                        />
                                                    ) : (
                                                        <span className={`font-mono text-sm ${amount > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                                                            {amount > 0 ? `Rp ${formatRupiah(amount)}` : '-'}
                                                        </span>
                                                    )}
                                                </div>
                                            )
                                        })}
                                        <div className="flex justify-between px-4 py-2 bg-red-100 dark:bg-red-900/30 font-semibold">
                                            <span>Total Beban Usaha</span>
                                            <span className="font-mono text-red-600">(Rp {formatRupiah(totalExpenses)})</span>
                                        </div>
                                    </div>
                                </div>

                                {/* LABA/RUGI BERSIH */}
                                <div className={`border-2 rounded-lg px-4 py-3 ${netProfit >= 0 ? 'border-green-600 bg-green-50 dark:bg-green-950' : 'border-red-600 bg-red-50 dark:bg-red-950'}`}>
                                    <div className="flex justify-between font-bold text-xl">
                                        <span className={netProfit >= 0 ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}>
                                            LABA / RUGI BERSIH
                                        </span>
                                        <span className={`font-mono ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            Rp {formatRupiah(netProfit)}
                                        </span>
                                    </div>
                                    <div className={`text-xs ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        Margin: {data.monthSales > 0 ? ((netProfit / data.monthSales) * 100).toFixed(1) : 0}%
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* HARIAN */}
                <TabsContent value="daily" className="mt-4 space-y-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm font-medium">{data.todayFormatted}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Penjualan</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">Rp {formatRupiah(data.todaySales)}</div><div className="text-xs text-muted-foreground">{data.todayTransactionCount} transaksi</div></CardContent></Card>
                        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">HPP</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">(Rp {formatRupiah(data.todayCOGS)})</div></CardContent></Card>
                        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Laba Kotor</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">Rp {formatRupiah(data.todayGrossProfit)}</div></CardContent></Card>
                        <Card className="bg-primary/5"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Laba Bersih</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${data.todayNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>Rp {formatRupiah(data.todayNetProfit)}</div></CardContent></Card>
                    </div>
                    <Card>
                        <CardHeader><CardTitle>Transaksi Hari Ini</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow className="bg-muted/50"><TableHead>Waktu</TableHead><TableHead>Pelanggan</TableHead><TableHead>Item</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-center">Status</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {data.recentTransactions.length === 0 ? (
                                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Belum ada transaksi hari ini.</TableCell></TableRow>
                                    ) : data.recentTransactions.map((tx) => (
                                        <TableRow key={tx.id}>
                                            <TableCell>{new Date(tx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                                            <TableCell className="font-medium">{tx.customer.name}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{tx.items.length > 1 ? `${tx.items[0].product.name} +${tx.items.length - 1}` : tx.items[0]?.product.name || '-'}</TableCell>
                                            <TableCell className="text-right font-mono font-bold">Rp {formatRupiah(tx.totalAmount)}</TableCell>
                                            <TableCell className="text-center"><Badge variant={tx.status === 'LUNAS' ? 'default' : 'destructive'}>{tx.status}</Badge></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* BULANAN */}
                <TabsContent value="monthly" className="mt-4 space-y-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <BarChart3 className="h-4 w-4" />
                        <span className="text-sm font-medium">{data.monthName}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Penjualan</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">Rp {formatRupiah(data.monthSales)}</div><div className="flex items-center gap-1 text-xs">{data.salesGrowth >= 0 ? <TrendingUp className="h-3 w-3 text-green-600" /> : <TrendingDown className="h-3 w-3 text-red-600" />}<span className={data.salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>{data.salesGrowth >= 0 ? '+' : ''}{data.salesGrowth.toFixed(1)}%</span></div></CardContent></Card>
                        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">HPP</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">(Rp {formatRupiah(data.monthCOGS)})</div></CardContent></Card>
                        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Laba Kotor</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">Rp {formatRupiah(data.monthGrossProfit)}</div></CardContent></Card>
                        <Card className="bg-primary/5"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Laba Bersih</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${data.monthNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>Rp {formatRupiah(data.monthNetProfit)}</div></CardContent></Card>
                    </div>
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Top 10 Pelanggan</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow className="bg-muted/50"><TableHead className="w-12">No</TableHead><TableHead>Nama</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Transaksi</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {data.topCustomersWithNames.length === 0 ? (
                                        <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Belum ada data.</TableCell></TableRow>
                                    ) : data.topCustomersWithNames.map((tc, i) => (
                                        <TableRow key={tc.customerId}><TableCell className="font-bold">{i + 1}</TableCell><TableCell className="font-medium">{tc.customer?.name || 'Unknown'}</TableCell><TableCell className="text-right font-mono font-bold">Rp {formatRupiah(Number(tc._sum.totalAmount ?? 0))}</TableCell><TableCell className="text-right text-muted-foreground">{tc._count}x</TableCell></TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TERLARIS */}
                <TabsContent value="top" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle>10 Produk Terlaris - {data.monthName}</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow className="bg-muted/50"><TableHead className="w-12">No</TableHead><TableHead>Produk</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Transaksi</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {data.topProductsWithNames.length === 0 ? (
                                        <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Belum ada data.</TableCell></TableRow>
                                    ) : data.topProductsWithNames.map((tp, i) => (
                                        <TableRow key={tp.productId}><TableCell className="font-bold">{i + 1}</TableCell><TableCell className="font-medium">{tp.product?.name || 'Unknown'}</TableCell><TableCell className="text-right font-bold">{Number(tp._sum.qty ?? 0)} {tp.product?.unit}</TableCell><TableCell className="text-right text-muted-foreground">{tp._count}x</TableCell></TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* NERACA */}
                <TabsContent value="balance" className="mt-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader><CardTitle>Aset (Piutang)</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between py-2 border-b"><span>Piutang (BON)</span><span className="font-mono font-bold">Rp {formatRupiah(data.totalReceivables)}</span></div>
                                <div className="flex justify-between py-2 border-b"><span>Persediaan</span><span className="font-mono font-bold">Rp {formatRupiah(data.inventoryValue)}</span></div>
                                <div className="flex justify-between py-2 bg-blue-100 dark:bg-blue-900/30 px-3 rounded font-bold"><span>Total Aset</span><span className="font-mono text-blue-600">Rp {formatRupiah(data.totalReceivables + data.inventoryValue)}</span></div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Kewajiban (Hutang)</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between py-2 border-b"><span>Hutang Supplier</span><span className="font-mono font-bold text-orange-600">Rp {formatRupiah(data.totalPayables)}</span></div>
                                <div className="flex justify-between py-2 bg-orange-100 dark:bg-orange-900/30 px-3 rounded font-bold"><span>Total Kewajiban</span><span className="font-mono text-orange-600">Rp {formatRupiah(data.totalPayables)}</span></div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
