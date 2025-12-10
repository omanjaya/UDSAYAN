'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Wallet } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { createCustomer, updateCustomer, processPayment } from "@/app/actions/customers"
import { toast } from "sonner"

// Plain type for Client Component (no Prisma Decimal)
interface PlainCustomer {
    id: string
    name: string
    phone: string | null
    address: string | null
    balance: number
    createdAt: Date
    updatedAt: Date
}

const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(number)
}

export function CustomerList({ initialCustomers }: { initialCustomers: PlainCustomer[] }) {
    const [searchTerm, setSearchTerm] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedCustomer, setSelectedCustomer] = useState<PlainCustomer | null>(null)

    // Payment State
    const [isPaymentOpen, setIsPaymentOpen] = useState(false)
    const [paymentAmount, setPaymentAmount] = useState("")
    const [paymentNote, setPaymentNote] = useState("")

    const filtered = initialCustomers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))

    async function handleSubmit(formData: FormData) {
        if (selectedCustomer) {
            await updateCustomer(selectedCustomer.id, formData)
            toast.success("Pelanggan diupdate")
        } else {
            await createCustomer(formData)
            toast.success("Pelanggan dibuat")
        }
        setIsDialogOpen(false)
    }

    async function handlePayment() {
        if (!selectedCustomer || !paymentAmount) return
        const result = await processPayment(selectedCustomer.id, parseFloat(paymentAmount), paymentNote)
        if (result.success) {
            toast.success("Pembayaran berhasil dicatat")
            setIsPaymentOpen(false)
            setPaymentAmount("")
            setPaymentNote("")
        } else {
            toast.error(result.message)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between">
                <Input
                    placeholder="Cari pelanggan..."
                    className="max-w-xs"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <Button onClick={() => { setSelectedCustomer(null); setIsDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Tambah Pelanggan
                </Button>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>No. HP</TableHead>
                            <TableHead>Alamat</TableHead>
                            <TableHead className="text-right">Total Hutang (Piutang)</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map(c => (
                            <TableRow key={c.id}>
                                <TableCell className="font-medium">{c.name}</TableCell>
                                <TableCell>{c.phone}</TableCell>
                                <TableCell>{c.address}</TableCell>
                                <TableCell className={`text-right font-bold ${Number(c.balance) > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                    {formatRupiah(Number(c.balance))}
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => { setSelectedCustomer(c); setIsPaymentOpen(true); }}>
                                        <Wallet className="h-4 w-4 mr-1" /> Bayar
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => { setSelectedCustomer(c); setIsDialogOpen(true); }}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{selectedCustomer ? 'Edit' : 'Tambah'} Pelanggan</DialogTitle></DialogHeader>
                    <form action={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Nama</Label>
                                <Input name="name" defaultValue={selectedCustomer?.name} required />
                            </div>
                            <div className="grid gap-2">
                                <Label>No HP</Label>
                                <Input name="phone" defaultValue={selectedCustomer?.phone || ''} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Alamat</Label>
                                <Input name="address" defaultValue={selectedCustomer?.address || ''} />
                            </div>
                        </div>
                        <DialogFooter><Button type="submit">Simpan</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Terima Pembayaran Piutang</DialogTitle>
                        <DialogDescription>
                            Catat pembayaran masuk dari {selectedCustomer?.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="p-3 bg-muted rounded-md text-sm flex justify-between">
                            <span>Sisa Hutang Saat Ini:</span>
                            <span className="font-bold">{selectedCustomer ? formatRupiah(Number(selectedCustomer.balance)) : 0}</span>
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
                                placeholder="e.g. Tranfer BCA"
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
