'use client'

import { useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2, Search, Package } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ProductDialog } from "./product-dialog"
import { deleteProduct } from "@/app/actions/products"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Plain type for Client Component (no Prisma Decimal)
interface PlainProduct {
    id: string
    code: string | null  // Kode produk singkat
    name: string
    stock: number
    hpp: number
    price: number
    unit: string
    category: string | null
    minStock: number
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

export function ProductList({ initialProducts }: { initialProducts: PlainProduct[] }) {
    const [searchTerm, setSearchTerm] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<PlainProduct | null>(null)
    const [deleteId, setDeleteId] = useState<string | null>(null)

    const filteredProducts = initialProducts.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleEdit = (product: PlainProduct) => {
        setSelectedProduct(product)
        setIsDialogOpen(true)
    }

    const handleAdd = () => {
        setSelectedProduct(null)
        setIsDialogOpen(true)
    }

    const handleDelete = async () => {
        if (deleteId) {
            await deleteProduct(deleteId)
            setDeleteId(null)
            toast.success("Produk dihapus")
        }
    }

    // Stats
    const totalProducts = initialProducts.length
    const lowStockProducts = initialProducts.filter(p => p.stock <= 5).length
    const totalValue = initialProducts.reduce((sum, p) => sum + (p.stock * Number(p.hpp)), 0)

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Produk</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalProducts}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Stok Kritis</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{lowStockProducts}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Nilai Persediaan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{formatRupiah(totalValue)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Search & Add */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari produk..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button onClick={handleAdd}>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Produk
                </Button>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead>Kode</TableHead>
                                <TableHead>Nama Produk</TableHead>
                                <TableHead>Satuan</TableHead>
                                <TableHead className="text-right">Stok</TableHead>
                                <TableHead className="text-right">HPP (Modal)</TableHead>
                                <TableHead className="text-right">Harga Jual</TableHead>
                                <TableHead className="text-right">Margin</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProducts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-12">
                                        <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                                        <p className="text-muted-foreground">Tidak ada produk ditemukan</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredProducts.map((product) => {
                                    const margin = Number(product.price) - Number(product.hpp)
                                    const marginPercent = (margin / Number(product.hpp) * 100).toFixed(0)
                                    return (
                                        <TableRow key={product.id} className="hover:bg-muted/30">
                                            <TableCell className="font-mono text-sm">
                                                {product.code ? (
                                                    <Badge variant="secondary">{product.code}</Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{product.unit}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant={product.stock <= 5 ? "destructive" : "secondary"}>
                                                    {product.stock}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">{formatRupiah(Number(product.hpp))}</TableCell>
                                            <TableCell className="text-right font-mono font-bold">{formatRupiah(Number(product.price))}</TableCell>
                                            <TableCell className="text-right">
                                                <span className="text-emerald-600 font-medium">+{marginPercent}%</span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(product)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(product.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <ProductDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                product={selectedProduct}
            />

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Produk?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Produk akan dihapus permanen dari database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
