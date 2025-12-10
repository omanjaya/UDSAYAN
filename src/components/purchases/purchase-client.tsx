'use client'

import { useState, useMemo } from "react"
import { Product, Supplier } from "@prisma/client"
import { PurchaseItem, createPurchase } from "@/app/actions/suppliers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, ShoppingBag, Search, Truck } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(number)
}

export default function PurchaseClient({
    products,
    suppliers
}: {
    products: Product[]
    suppliers: Supplier[]
}) {
    const [cart, setCart] = useState<PurchaseItem[]>([])
    const [selectedSupplierId, setSelectedSupplierId] = useState<string>("")
    const [searchTerm, setSearchTerm] = useState("")

    // Checkout State
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
    const [paidAmount, setPaidAmount] = useState("")
    const [invoiceNo, setInvoiceNo] = useState("")
    const [isProcessing, setIsProcessing] = useState(false)

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.productId === product.id)
            if (existing) {
                return prev.map(item =>
                    item.productId === product.id
                        ? { ...item, qty: item.qty + 1 }
                        : item
                )
            }
            return [...prev, {
                productId: product.id,
                name: product.name,
                cost: Number(product.hpp), // Default ke HPP terakhir
                qty: 1
            }]
        })
        toast.success("Produk ditambahkan")
    }

    const updateQty = (productId: string, newQty: number) => {
        if (newQty <= 0) {
            removeFromCart(productId)
            return
        }
        setCart(prev => prev.map(item =>
            item.productId === productId ? { ...item, qty: newQty } : item
        ))
    }

    const updateCost = (productId: string, newCost: number) => {
        setCart(prev => prev.map(item =>
            item.productId === productId ? { ...item, cost: newCost } : item
        ))
    }

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.productId !== productId))
    }

    const grandTotal = useMemo(() => {
        return cart.reduce((sum, item) => sum + (item.cost * item.qty), 0)
    }, [cart])

    const handleCheckout = async () => {
        if (cart.length === 0 || !selectedSupplierId) {
            toast.error("Pilih supplier dan tambah item")
            return
        }
        setIsProcessing(true)

        const payValue = parseFloat(paidAmount) || 0

        const result = await createPurchase(
            selectedSupplierId,
            cart,
            payValue,
            invoiceNo || undefined
        )

        if (result.success) {
            toast.success("Pembelian Berhasil! Stok bertambah.")
            setCart([])
            setPaidAmount("")
            setInvoiceNo("")
            setIsCheckoutOpen(false)
        } else {
            toast.error(result.error || "Gagal")
        }
        setIsProcessing(false)
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-6rem)] gap-4">
            {/* Left: Product Catalog */}
            <div className="flex-1 overflow-auto bg-card rounded-lg border p-4">
                <div className="sticky top-0 bg-card z-10 pb-4 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari nama produk..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
                    {filteredProducts.map(product => (
                        <Card
                            key={product.id}
                            className="cursor-pointer hover:border-primary transition-all overflow-hidden flex flex-col justify-between"
                            onClick={() => addToCart(product)}
                        >
                            <CardHeader className="p-4">
                                <CardTitle className="text-sm font-medium line-clamp-2">{product.name}</CardTitle>
                                <div className="text-xs text-muted-foreground">Stok: {product.stock} {product.unit}</div>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <div className="text-sm text-muted-foreground">
                                    HPP: {formatRupiah(Number(product.hpp))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Right: Cart */}
            <div className="w-full lg:w-[400px] flex flex-col bg-card rounded-lg border h-full">
                <div className="p-4 border-b bg-muted/20">
                    <div className="flex items-center gap-2 mb-4">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Supplier:</span>
                        <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih Supplier" />
                            </SelectTrigger>
                            <SelectContent>
                                {suppliers.map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5" /> Pembelian / Stock IN
                    </h2>
                </div>

                <div className="flex-1 overflow-auto p-4 space-y-4">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                            <ShoppingBag className="h-12 w-12 opacity-20" />
                            <p>Keranjang kosong</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.productId} className="flex gap-2 items-start border-b pb-3">
                                <div className="flex-1">
                                    <div className="font-medium text-sm">{item.name}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Label className="text-xs">Harga Beli:</Label>
                                        <Input
                                            type="number"
                                            value={item.cost}
                                            onChange={e => updateCost(item.productId, parseFloat(e.target.value) || 0)}
                                            className="w-28 h-7 text-xs"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <div className="font-bold text-sm">
                                        {formatRupiah(item.cost * item.qty)}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQty(item.productId, item.qty - 1)}>-</Button>
                                        <span className="text-xs w-6 text-center">{item.qty}</span>
                                        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQty(item.productId, item.qty + 1)}>+</Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => removeFromCart(item.productId)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t bg-muted/20 space-y-4">
                    <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total Pembelian</span>
                        <span>{formatRupiah(grandTotal)}</span>
                    </div>
                    <Button
                        className="w-full h-12 text-lg"
                        size="lg"
                        disabled={cart.length === 0 || !selectedSupplierId}
                        onClick={() => setIsCheckoutOpen(true)}
                    >
                        Proses Pembelian
                    </Button>
                </div>
            </div>

            <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Pembelian</DialogTitle>
                        <DialogDescription>Total: {formatRupiah(grandTotal)}</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>No. Faktur Supplier (Opsional)</Label>
                            <Input
                                value={invoiceNo}
                                onChange={e => setInvoiceNo(e.target.value)}
                                placeholder="e.g. INV-001"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Nominal Bayar</Label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={paidAmount}
                                onChange={e => setPaidAmount(e.target.value)}
                                autoFocus
                            />
                            <p className="text-xs text-muted-foreground">
                                Kosongkan jika Hutang. Isi {formatRupiah(grandTotal)} untuk Lunas.
                            </p>
                        </div>

                        <div className="p-3 bg-muted rounded-md text-sm">
                            <div className="flex justify-between">
                                <span>Sisa Hutang ke Supplier:</span>
                                <span className={((grandTotal - (parseFloat(paidAmount) || 0))) > 0 ? "text-orange-500 font-bold" : "text-green-600 font-bold"}>
                                    {formatRupiah(grandTotal - (parseFloat(paidAmount) || 0))}
                                </span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>Batal</Button>
                        <Button onClick={handleCheckout} disabled={isProcessing}>
                            {isProcessing ? "Memproses..." : "Selesaikan Pembelian"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
