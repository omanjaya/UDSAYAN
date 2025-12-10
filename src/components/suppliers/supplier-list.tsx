'use client'

import { useState } from "react"
import { Supplier } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Wallet, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { createSupplier, updateSupplier, paySupplier } from "@/app/actions/suppliers"
import { toast } from "sonner"

const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(number)
}

export function SupplierList({ initialSuppliers }: { initialSuppliers: Supplier[] }) {
    const [searchTerm, setSearchTerm] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

    // Payment State
    const [isPaymentOpen, setIsPaymentOpen] = useState(false)
    const [paymentAmount, setPaymentAmount] = useState("")
    const [paymentNote, setPaymentNote] = useState("")

    const filtered = initialSuppliers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    async function handleSubmit(formData: FormData) {
        let result
        if (selectedSupplier) {
            result = await updateSupplier(selectedSupplier.id, formData)
        } else {
            result = await createSupplier(formData)
        }

        if (result.success) {
            toast.success(selectedSupplier ? "Supplier diupdate" : "Supplier ditambahkan")
            setIsDialogOpen(false)
        } else {
            toast.error(result.error)
        }
    }

    async function handlePayment() {
        if (!selectedSupplier || !paymentAmount) return
        const result = await paySupplier(selectedSupplier.id, parseFloat(paymentAmount), paymentNote)
        if (result.success) {
            toast.success("Pembayaran berhasil dicatat")
            setIsPaymentOpen(false)
            setPaymentAmount("")
            setPaymentNote("")
        } else {
            toast.error(result.error)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between">
                <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari supplier..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button onClick={() => { setSelectedSupplier(null); setIsDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Tambah Supplier
                </Button>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Supplier</TableHead>
                            <TableHead>No. HP</TableHead>
                            <TableHead>Alamat</TableHead>
                            <TableHead className="text-right">Hutang Kita</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                    Tidak ada supplier.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map(s => (
                                <TableRow key={s.id}>
                                    <TableCell className="font-medium">{s.name}</TableCell>
                                    <TableCell>{s.phone || '-'}</TableCell>
                                    <TableCell>{s.address || '-'}</TableCell>
                                    <TableCell className={`text-right font-bold ${Number(s.balance) > 0 ? 'text-orange-500' : 'text-green-600'}`}>
                                        {formatRupiah(Number(s.balance))}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        {Number(s.balance) > 0 && (
                                            <Button variant="outline" size="sm" onClick={() => { setSelectedSupplier(s); setIsPaymentOpen(true); }}>
                                                <Wallet className="h-4 w-4 mr-1" /> Bayar
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="icon" onClick={() => { setSelectedSupplier(s); setIsDialogOpen(true); }}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedSupplier ? 'Edit' : 'Tambah'} Supplier</DialogTitle>
                    </DialogHeader>
                    <form action={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Nama</Label>
                                <Input name="name" defaultValue={selectedSupplier?.name} required />
                            </div>
                            <div className="grid gap-2">
                                <Label>No HP</Label>
                                <Input name="phone" defaultValue={selectedSupplier?.phone || ''} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Alamat</Label>
                                <Input name="address" defaultValue={selectedSupplier?.address || ''} />
                            </div>
                        </div>
                        <DialogFooter><Button type="submit">Simpan</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Payment Dialog */}
            <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Bayar Hutang ke Supplier</DialogTitle>
                        <DialogDescription>
                            Catat pembayaran ke {selectedSupplier?.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="p-3 bg-muted rounded-md text-sm flex justify-between">
                            <span>Hutang Saat Ini:</span>
                            <span className="font-bold">{selectedSupplier ? formatRupiah(Number(selectedSupplier.balance)) : 0}</span>
                        </div>
                        <div className="grid gap-2">
                            <Label>Nominal Pembayaran</Label>
                            <Input
                                type="number"
                                value={paymentAmount}
                                onChange={e => setPaymentAmount(e.target.value)}
                                placeholder="0"
                                autoFocus
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Catatan (Opsional)</Label>
                            <Input
                                value={paymentNote}
                                onChange={e => setPaymentNote(e.target.value)}
                                placeholder="e.g. Transfer BCA"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handlePayment}>Proses Pembayaran</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
