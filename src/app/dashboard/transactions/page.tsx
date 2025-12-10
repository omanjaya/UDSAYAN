import prisma from "@/lib/prisma"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(number)
}

export default async function TransactionsPage() {
    const transactions = await prisma.transaction.findMany({
        orderBy: { date: 'desc' },
        include: {
            customer: true,
            _count: {
                select: { items: true }
            }
        }
    })

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">Riwayat Transaksi</h1>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>No. Invoice</TableHead>
                            <TableHead>Pelanggan</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Bayar</TableHead>
                            <TableHead className="text-right">Sisa (Bon)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                    Belum ada transaksi.
                                </TableCell>
                            </TableRow>
                        ) : (
                            transactions.map((t) => (
                                <TableRow key={t.id}>
                                    <TableCell>{new Date(t.date).toLocaleDateString('id-ID')} {new Date(t.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                                    <TableCell className="font-mono text-xs">{t.id.slice(0, 8).toUpperCase()}</TableCell>
                                    <TableCell>{t.customer.name}</TableCell>
                                    <TableCell>
                                        <Badge variant={t.status === 'LUNAS' ? 'default' : 'destructive'}>
                                            {t.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">{formatRupiah(Number(t.totalAmount))}</TableCell>
                                    <TableCell className="text-right text-green-600">{formatRupiah(Number(t.paidAmount))}</TableCell>
                                    <TableCell className="text-right text-red-500 font-bold">{formatRupiah(Number(t.remaining))}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
