'use client'

import { useState } from "react"
import { Product, StockOpname } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ClipboardCheck, AlertTriangle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createStockOpname } from "@/app/actions/inventory"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

type StockOpnameWithProduct = StockOpname & { product: Product }

const reasons = [
    'RUSAK',
    'HILANG',
    'SALAH_HITUNG',
    'RETUR',
    'LAIN-LAIN'
]

export function StockOpnameList({
    products,
    history
}: {
    products: Product[]
    history: StockOpnameWithProduct[]
}) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedProductId, setSelectedProductId] = useState('')
    const [stockActual, setStockActual] = useState('')
    const [reason, setReason] = useState('')
    const [note, setNote] = useState('')

    const selectedProduct = products.find(p => p.id === selectedProductId)

    async function handleSubmit() {
        if (!selectedProductId || stockActual === '') {
            toast.error("Pilih produk dan isi stok aktual")
            return
        }

        const result = await createStockOpname(
            selectedProductId,
            parseInt(stockActual),
            reason || undefined,
            note || undefined
        )

        if (result.success) {
            const diff = result.difference || 0
            if (diff === 0) {
                toast.success("Stok sesuai! Tidak ada selisih.")
            } else if (diff > 0) {
                toast.success(`Stok dikoreksi. Lebih +${diff}`)
            } else {
                toast.warning(`Stok dikoreksi. Kurang ${diff}`)
            }
            setIsDialogOpen(false)
            setSelectedProductId('')
            setStockActual('')
            setReason('')
            setNote('')
        } else {
            toast.error(result.error)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold">Stock Opname / Penyesuaian Stok</h2>
                    <p className="text-sm text-muted-foreground">Cocokkan stok fisik dengan sistem</p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)}>
                    <ClipboardCheck className="mr-2 h-4 w-4" /> Mulai Opname
                </Button>
            </div>

            {/* Quick Overview - Products with low stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {products.filter(p => p.stock <= (p.minStock || 5)).slice(0, 4).map(p => (
                    <div key={p.id} className="p-4 border rounded-lg bg-red-50 border-red-200">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            <span className="font-medium text-sm">{p.name}</span>
                        </div>
                        <div className="text-red-600 font-bold mt-1">Stok: {p.stock} {p.unit}</div>
                    </div>
                ))}
            </div>

            {/* History */}
            <div className="rounded-md border bg-white">
                <div className="p-4 border-b">
                    <h3 className="font-semibold">Riwayat Stock Opname</h3>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Produk</TableHead>
                            <TableHead className="text-right">Stok Sistem</TableHead>
                            <TableHead className="text-right">Stok Fisik</TableHead>
                            <TableHead className="text-right">Selisih</TableHead>
                            <TableHead>Alasan</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {history.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                    Belum ada riwayat opname.
                                </TableCell>
                            </TableRow>
                        ) : (
                            history.map(h => (
                                <TableRow key={h.id}>
                                    <TableCell>{new Date(h.date).toLocaleDateString('id-ID')}</TableCell>
                                    <TableCell className="font-medium">{h.product.name}</TableCell>
                                    <TableCell className="text-right">{h.stockSystem}</TableCell>
                                    <TableCell className="text-right">{h.stockActual}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={h.difference === 0 ? "secondary" : h.difference > 0 ? "default" : "destructive"}>
                                            {h.difference > 0 ? '+' : ''}{h.difference}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{h.reason || '-'}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Stock Opname</DialogTitle>
                        <DialogDescription>Pilih produk dan masukkan jumlah stok hasil hitung fisik.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Produk</Label>
                            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih produk" />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map(p => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.name} (Stok: {p.stock})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedProduct && (
                            <div className="p-3 bg-muted rounded-md text-sm">
                                <div className="flex justify-between">
                                    <span>Stok di Sistem:</span>
                                    <span className="font-bold">{selectedProduct.stock} {selectedProduct.unit}</span>
                                </div>
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label>Stok Hasil Hitung Fisik</Label>
                            <Input
                                type="number"
                                value={stockActual}
                                onChange={e => setStockActual(e.target.value)}
                                placeholder="0"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Alasan Selisih (jika ada)</Label>
                            <Select value={reason} onValueChange={setReason}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih alasan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {reasons.map(r => (
                                        <SelectItem key={r} value={r}>{r}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label>Catatan (opsional)</Label>
                            <Input
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                placeholder="e.g. Barang pecah saat pengiriman"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSubmit}>Proses Opname</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
