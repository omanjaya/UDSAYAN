'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowDownCircle, ArrowUpCircle, Search, Package, TrendingUp, TrendingDown, Filter } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface StockMovement {
    id: string
    date: Date
    productId: string
    productName: string
    productCode: string | null
    productUnit: string
    type: string // IN or OUT
    qty: number
    hpp: number
    hj: number | null
    stockAfter: number
    refType: string | null
    refId: string | null
    customerName: string | null
    status: string | null
    note: string | null
    createdAt: Date
}

const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(number)
}

export function StockMovementList({ movements }: { movements: StockMovement[] }) {
    const [searchTerm, setSearchTerm] = useState("")
    const [typeFilter, setTypeFilter] = useState<string>("ALL")

    const filteredMovements = movements.filter(m => {
        const matchSearch = !searchTerm ||
            m.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.productCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.customerName?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchType = typeFilter === "ALL" || m.type === typeFilter

        return matchSearch && matchType
    })

    // Calculate stats
    const totalIn = movements.filter(m => m.type === 'IN').reduce((sum, m) => sum + m.qty, 0)
    const totalOut = movements.filter(m => m.type === 'OUT').reduce((sum, m) => sum + m.qty, 0)
    const totalSales = movements.filter(m => m.type === 'OUT' && m.hj).reduce((sum, m) => sum + (m.qty * (m.hj || 0)), 0)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Package className="h-6 w-6" /> Pergerakan Stok
                    </h1>
                    <p className="text-muted-foreground">Log semua stok masuk (IN) dan keluar (OUT)</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <ArrowDownCircle className="h-4 w-4 text-green-600" /> Total Stok Masuk (IN)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{totalIn.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <ArrowUpCircle className="h-4 w-4 text-red-600" /> Total Stok Keluar (OUT)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{totalOut.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-600" /> Total Penjualan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{formatRupiah(totalSales)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari produk atau pelanggan..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Tipe" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Semua</SelectItem>
                        <SelectItem value="IN">Stok Masuk (IN)</SelectItem>
                        <SelectItem value="OUT">Stok Keluar (OUT)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Movement Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Kode</TableHead>
                                <TableHead>Item</TableHead>
                                <TableHead className="text-center">IN</TableHead>
                                <TableHead className="text-center">OUT</TableHead>
                                <TableHead className="text-right">HPP</TableHead>
                                <TableHead className="text-right">HJ</TableHead>
                                <TableHead className="text-right">Sisa Stock</TableHead>
                                <TableHead>Nama Bon</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredMovements.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center py-12">
                                        <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                                        <p className="text-muted-foreground">Belum ada pergerakan stok</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredMovements.map((m) => (
                                    <TableRow key={m.id} className="hover:bg-muted/30">
                                        <TableCell className="text-sm">
                                            {new Date(m.date).toLocaleDateString('id-ID', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">
                                            {m.productCode ? (
                                                <Badge variant="secondary">{m.productCode}</Badge>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell className="font-medium">{m.productName}</TableCell>
                                        <TableCell className="text-center">
                                            {m.type === 'IN' ? (
                                                <span className="text-green-600 font-bold">{m.qty}</span>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {m.type === 'OUT' ? (
                                                <span className="text-red-600 font-bold">{m.qty}</span>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">
                                            {formatRupiah(m.hpp)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">
                                            {m.hj ? formatRupiah(m.hj) : '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant={m.stockAfter <= 5 ? "destructive" : "secondary"}>
                                                {m.stockAfter}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">{m.customerName || '-'}</TableCell>
                                        <TableCell className="text-center">
                                            {m.status ? (
                                                <Badge variant={m.status === 'LUNAS' ? 'default' : 'destructive'}>
                                                    {m.status}
                                                </Badge>
                                            ) : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
