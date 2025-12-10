'use client'

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, ArrowUpCircle, ArrowDownCircle, Keyboard } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { createCashFlow } from "@/app/actions/inventory"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

// Plain type for Client Component
interface PlainCashFlow {
    id: string
    type: string
    category: string
    description: string
    amount: number
    balance: number
    date: Date
    refType: string | null
    refId: string | null
    createdAt: Date
}

const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(number)
}

// Categories matching Excel Beban Usaha
const expenseCategories = [
    { key: 'GAJI', label: 'Biaya Gaji', shortcuts: ['gaji', 'bayar gaji'] },
    { key: 'BANTEN', label: 'Biaya Banten', shortcuts: ['banten', 'canang'] },
    { key: 'AIR', label: 'Biaya Air', shortcuts: ['air', 'pdam'] },
    { key: 'LISTRIK', label: 'Biaya Listrik', shortcuts: ['listrik', 'pln'] },
    { key: 'WIFI', label: 'Biaya Wifi', shortcuts: ['wifi', 'internet'] },
    { key: 'PULSA', label: 'Biaya Pulsa', shortcuts: ['pulsa', 'hp'] },
    { key: 'BANK', label: 'Biaya Bank', shortcuts: ['bank', 'transfer'] },
    { key: 'SERVICE', label: 'Biaya Service Mobil', shortcuts: ['service', 'bengkel', 'mobil'] },
    { key: 'LAINNYA', label: 'Biaya Lain-lain', shortcuts: ['lainnya', 'lain'] },
    { key: 'KOMISI', label: 'Komisi Penjualan', shortcuts: ['komisi'] },
    { key: 'TRANSPORT', label: 'Biaya Transport', shortcuts: ['transport', 'ongkir', 'truk'] },
    { key: 'BONGKAR', label: 'Biaya Bongkar', shortcuts: ['bongkar', 'muat'] },
]

const incomeCategories = [
    { key: 'PENJUALAN', label: 'Penjualan', shortcuts: ['jual'] },
    { key: 'PIUTANG', label: 'Terima Piutang', shortcuts: ['piutang', 'bayar'] },
    { key: 'LAIN_MASUK', label: 'Pendapatan Lain', shortcuts: ['lain'] },
]

// Quick expense buttons
const quickExpenses = [
    { label: 'Gaji', category: 'GAJI', type: 'CREDIT' as const },
    { label: 'Listrik', category: 'LISTRIK', type: 'CREDIT' as const },
    { label: 'Banten', category: 'BANTEN', type: 'CREDIT' as const },
    { label: 'Transport', category: 'TRANSPORT', type: 'CREDIT' as const },
    { label: 'Bongkar', category: 'BONGKAR', type: 'CREDIT' as const },
]

export function CashFlowList({ initialData }: { initialData: PlainCashFlow[] }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [type, setType] = useState<'DEBIT' | 'CREDIT'>('CREDIT')
    const [category, setCategory] = useState('')
    const [description, setDescription] = useState('')
    const [amount, setAmount] = useState('')

    const descriptionInputRef = useRef<HTMLInputElement>(null)
    const amountInputRef = useRef<HTMLInputElement>(null)

    // Keyboard shortcut to open dialog
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F3') {
                e.preventDefault()
                setIsDialogOpen(true)
                setType('CREDIT')
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Auto-focus when dialog opens
    useEffect(() => {
        if (isDialogOpen) {
            setTimeout(() => descriptionInputRef.current?.focus(), 100)
        }
    }, [isDialogOpen])

    // Smart category detection from description
    const detectCategory = useCallback((desc: string) => {
        const lowerDesc = desc.toLowerCase()
        for (const cat of [...expenseCategories, ...incomeCategories]) {
            for (const shortcut of cat.shortcuts) {
                if (lowerDesc.includes(shortcut)) {
                    return cat.key
                }
            }
        }
        return ''
    }, [])

    const handleDescriptionChange = (value: string) => {
        setDescription(value)
        if (!category) {
            const detected = detectCategory(value)
            if (detected) {
                setCategory(detected)
            }
        }
    }

    async function handleSubmit() {
        if (!category || !description || !amount) {
            toast.error("Lengkapi semua field")
            return
        }

        const result = await createCashFlow(type, category, description, parseFloat(amount))
        if (result.success) {
            toast.success("Transaksi kas dicatat ✅")
            setIsDialogOpen(false)
            setCategory('')
            setDescription('')
            setAmount('')
        } else {
            toast.error(result.error)
        }
    }

    // Quick add expense
    const handleQuickExpense = (cat: string) => {
        setType('CREDIT')
        setCategory(cat)
        setIsDialogOpen(true)
    }

    // Handle Enter to move to next field or submit
    const handleKeyDown = (e: React.KeyboardEvent, nextAction: () => void) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            nextAction()
        }
    }

    // Get current balance (from last entry)
    const currentBalance = initialData.length > 0 ? initialData[0].balance : 0

    // Today's summary
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayEntries = initialData.filter(cf => new Date(cf.date) >= today)
    const todayDebit = todayEntries.filter(cf => cf.type === 'DEBIT').reduce((sum, cf) => sum + cf.amount, 0)
    const todayCredit = todayEntries.filter(cf => cf.type === 'CREDIT').reduce((sum, cf) => sum + cf.amount, 0)

    return (
        <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">Saldo Kas</div>
                        <div className="text-2xl font-bold">{formatRupiah(currentBalance)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">Masuk Hari Ini</div>
                        <div className="text-2xl font-bold text-green-600">{formatRupiah(todayDebit)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">Keluar Hari Ini</div>
                        <div className="text-2xl font-bold text-red-600">{formatRupiah(todayCredit)}</div>
                    </CardContent>
                </Card>
                <Card className="flex items-center justify-center">
                    <CardContent className="pt-4">
                        <Button onClick={() => setIsDialogOpen(true)} className="w-full">
                            <Plus className="mr-2 h-4 w-4" /> Catat (F3)
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Expense Buttons */}
            <div className="flex gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground py-2">Quick Add:</span>
                {quickExpenses.map(qe => (
                    <Button
                        key={qe.category}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickExpense(qe.category)}
                    >
                        {qe.label}
                    </Button>
                ))}
            </div>

            {/* Table */}
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Tipe</TableHead>
                            <TableHead>Kategori</TableHead>
                            <TableHead>Keterangan</TableHead>
                            <TableHead className="text-right">Masuk (Debit)</TableHead>
                            <TableHead className="text-right">Keluar (Kredit)</TableHead>
                            <TableHead className="text-right">Saldo</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                    Belum ada transaksi kas. Tekan F3 untuk mencatat.
                                </TableCell>
                            </TableRow>
                        ) : (
                            initialData.map(cf => (
                                <TableRow key={cf.id}>
                                    <TableCell className="text-sm">{new Date(cf.date).toLocaleDateString('id-ID')}</TableCell>
                                    <TableCell>
                                        {cf.type === 'DEBIT' ? (
                                            <Badge className="bg-green-500"><ArrowUpCircle className="h-3 w-3 mr-1" /> Masuk</Badge>
                                        ) : (
                                            <Badge variant="destructive"><ArrowDownCircle className="h-3 w-3 mr-1" /> Keluar</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{cf.category}</Badge>
                                    </TableCell>
                                    <TableCell>{cf.description}</TableCell>
                                    <TableCell className="text-right font-mono text-green-600">
                                        {cf.type === 'DEBIT' ? formatRupiah(cf.amount) : '-'}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-red-500">
                                        {cf.type === 'CREDIT' ? formatRupiah(cf.amount) : '-'}
                                    </TableCell>
                                    <TableCell className="text-right font-bold font-mono">{formatRupiah(cf.balance)}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Add Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Catat Transaksi Kas</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Tipe Transaksi</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    type="button"
                                    variant={type === 'DEBIT' ? 'default' : 'outline'}
                                    onClick={() => setType('DEBIT')}
                                    className={type === 'DEBIT' ? 'bg-green-600 hover:bg-green-700' : ''}
                                >
                                    <ArrowUpCircle className="h-4 w-4 mr-2" /> Uang Masuk
                                </Button>
                                <Button
                                    type="button"
                                    variant={type === 'CREDIT' ? 'default' : 'outline'}
                                    onClick={() => setType('CREDIT')}
                                    className={type === 'CREDIT' ? 'bg-red-600 hover:bg-red-700' : ''}
                                >
                                    <ArrowDownCircle className="h-4 w-4 mr-2" /> Uang Keluar
                                </Button>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Keterangan (ketik untuk auto-detect kategori)</Label>
                            <Input
                                ref={descriptionInputRef}
                                value={description}
                                onChange={e => handleDescriptionChange(e.target.value)}
                                onKeyDown={e => handleKeyDown(e, () => amountInputRef.current?.focus())}
                                placeholder="e.g. Bayar gaji Dewik, Listrik bulan Desember"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Kategori</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih atau ketik keterangan dulu" />
                                </SelectTrigger>
                                <SelectContent>
                                    <div className="px-2 py-1 text-xs text-muted-foreground">Pengeluaran</div>
                                    {expenseCategories.map(c => (
                                        <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                                    ))}
                                    <div className="px-2 py-1 text-xs text-muted-foreground border-t mt-1 pt-1">Pemasukan</div>
                                    {incomeCategories.map(c => (
                                        <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Nominal</Label>
                            <Input
                                ref={amountInputRef}
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                onKeyDown={e => handleKeyDown(e, handleSubmit)}
                                placeholder="0"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                        <Button onClick={handleSubmit}>Simpan (Enter)</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
