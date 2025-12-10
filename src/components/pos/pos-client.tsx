'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { CartItem, createTransaction } from "@/app/actions/transactions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, ShoppingCart, Search, User, Calculator, Receipt, Keyboard, Star, Terminal, Zap, RotateCcw } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Plain types for Client Component (no Prisma Decimal)
interface PlainProduct {
    id: string
    code: string | null  // Kode produk singkat
    name: string
    stock: number
    hpp: number
    price: number
    unit: string
    category: string | null
}

interface PlainCustomer {
    id: string
    name: string
    phone: string | null
    address: string | null
    balance: number
}

const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(number)
}

// Quick pay amounts
const QUICK_PAY_AMOUNTS = [10000, 20000, 50000, 100000, 200000, 500000]

export default function POSClient({
    products,
    customers
}: {
    products: PlainProduct[]
    customers: PlainCustomer[]
}) {
    const [cart, setCart] = useState<CartItem[]>([])
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("umum")
    const [searchTerm, setSearchTerm] = useState("")
    const [inputMode, setInputMode] = useState<'search' | 'command'>('search')

    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
    const [paidAmount, setPaidAmount] = useState("")
    const [isProcessing, setIsProcessing] = useState(false)

    // Command mode state
    const [commandText, setCommandText] = useState("")
    const [commandResults, setCommandResults] = useState<string[]>([])

    // Refs for keyboard navigation
    const searchInputRef = useRef<HTMLInputElement>(null)
    const commandInputRef = useRef<HTMLTextAreaElement>(null)
    const payInputRef = useRef<HTMLInputElement>(null)

    // Create product search index for fuzzy matching
    const productIndex = useMemo(() => {
        return products.map(p => ({
            ...p,
            searchTerms: p.name.toLowerCase().split(/[\s\-x]+/)
        }))
    }, [products])

    // Smart product search - matches code or partial name
    const findProduct = useCallback((query: string): PlainProduct | null => {
        const q = query.toLowerCase().trim()
        if (!q) return null

        // 1. Exact code match (highest priority)
        const byCode = products.find(p => p.code?.toLowerCase() === q)
        if (byCode) return byCode

        // 2. Exact name match
        const exact = products.find(p => p.name.toLowerCase() === q)
        if (exact) return exact

        // 3. Partial match - all words must be present
        const queryWords = q.split(/\s+/)
        const matches = productIndex.filter(p =>
            queryWords.every(word =>
                p.searchTerms.some(term => term.includes(word)) ||
                (p.code?.toLowerCase().includes(word))
            )
        )

        return matches.length === 1 ? matches[0] : null
    }, [products, productIndex])

    // Filter products for grid view (search by code or name)
    const filteredProducts = useMemo(() => {
        if (!searchTerm) return products.slice(0, 50)
        const q = searchTerm.toLowerCase()
        return products.filter(p =>
            p.name.toLowerCase().includes(q) ||
            (p.code?.toLowerCase().includes(q))
        ).slice(0, 50)
    }, [products, searchTerm])

    // Add to cart function
    const addToCart = useCallback((product: PlainProduct, qty: number = 1) => {
        if (product.stock <= 0) {
            toast.error("Stok habis!")
            return false
        }
        setCart(prev => {
            const existing = prev.find(item => item.productId === product.id)
            if (existing) {
                if (existing.qty + qty > product.stock) {
                    toast.error("Stok tidak mencukupi")
                    return prev
                }
                return prev.map(item =>
                    item.productId === product.id
                        ? { ...item, qty: item.qty + qty }
                        : item
                )
            }
            return [...prev, {
                productId: product.id,
                name: product.name,
                price: product.price,
                cost: product.hpp,
                qty: qty,
                unit: product.unit
            }]
        })
        return true
    }, [])

    const updateQty = (productId: string, newQty: number) => {
        if (newQty <= 0) {
            removeFromCart(productId)
            return
        }
        setCart(prev => prev.map(item =>
            item.productId === productId ? { ...item, qty: newQty } : item
        ))
    }

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.productId !== productId))
    }

    const clearCart = () => {
        setCart([])
        setSearchTerm("")
        setCommandText("")
        setCommandResults([])
        searchInputRef.current?.focus()
    }

    const grandTotal = useMemo(() => {
        return cart.reduce((sum, item) => sum + (item.price * item.qty), 0)
    }, [cart])

    const totalItems = useMemo(() => {
        return cart.reduce((sum, item) => sum + item.qty, 0)
    }, [cart])

    // Process command mode input
    const processCommand = useCallback(() => {
        const lines = commandText.split('\n').filter(l => l.trim())
        const results: string[] = []
        let addedCount = 0

        for (const line of lines) {
            // Parse: "product name qty" or "product name" (qty=1)
            const match = line.trim().match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*$/)
            let productName: string
            let qty: number

            if (match) {
                productName = match[1]
                qty = parseFloat(match[2])
            } else {
                productName = line.trim()
                qty = 1
            }

            const product = findProduct(productName)
            if (product) {
                if (addToCart(product, qty)) {
                    results.push(`✅ ${product.name} x${qty}`)
                    addedCount++
                } else {
                    results.push(`❌ ${productName} - stok tidak cukup`)
                }
            } else {
                results.push(`❓ "${productName}" tidak ditemukan`)
            }
        }

        setCommandResults(results)
        if (addedCount > 0) {
            toast.success(`${addedCount} item ditambahkan!`)
            setCommandText("")
        }
    }, [commandText, findProduct, addToCart])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // F2 - Focus search
            if (e.key === 'F2') {
                e.preventDefault()
                setInputMode('search')
                setTimeout(() => {
                    searchInputRef.current?.focus()
                    searchInputRef.current?.select()
                }, 50)
            }
            // F4 - Command mode
            if (e.key === 'F4') {
                e.preventDefault()
                setInputMode('command')
                setTimeout(() => commandInputRef.current?.focus(), 50)
            }
            // F12 - Quick checkout
            if (e.key === 'F12' && cart.length > 0) {
                e.preventDefault()
                setIsCheckoutOpen(true)
            }
            // F8 - Quick cash (bayar tunai langsung)
            if (e.key === 'F8' && cart.length > 0) {
                e.preventDefault()
                handleQuickCash()
            }
            // Escape - Close dialog or clear search
            if (e.key === 'Escape') {
                if (isCheckoutOpen) {
                    setIsCheckoutOpen(false)
                } else if (searchTerm || commandText) {
                    setSearchTerm("")
                    setCommandText("")
                    setCommandResults([])
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [cart.length, isCheckoutOpen, searchTerm, commandText])

    // Handle search input enter - add first product
    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && filteredProducts.length > 0) {
            e.preventDefault()
            addToCart(filteredProducts[0])
            setSearchTerm("")
        }
    }

    // Quick cash - bayar tunai langsung tanpa dialog
    const handleQuickCash = async () => {
        if (cart.length === 0 || isProcessing) return
        setIsProcessing(true)

        const result = await createTransaction(
            selectedCustomerId,
            cart,
            grandTotal, // Bayar penuh
            "CASH"
        )

        if (result.success) {
            toast.success("💵 Transaksi TUNAI Berhasil!", { duration: 2000 })
            clearCart()
        } else {
            toast.error(result.error || "Gagal")
        }
        setIsProcessing(false)
    }

    const handleCheckout = async () => {
        if (cart.length === 0) return
        setIsProcessing(true)

        const payValue = parseFloat(paidAmount) || 0

        const result = await createTransaction(
            selectedCustomerId,
            cart,
            payValue,
            "CASH"
        )

        if (result.success) {
            toast.success("Transaksi Berhasil! 🎉", { duration: 2000 })
            clearCart()
            setPaidAmount("")
            setIsCheckoutOpen(false)
        } else {
            toast.error(result.error || "Gagal")
        }
        setIsProcessing(false)
    }

    // Auto-focus pay input when checkout opens
    useEffect(() => {
        if (isCheckoutOpen) {
            setTimeout(() => payInputRef.current?.focus(), 100)
        }
    }, [isCheckoutOpen])

    const selectedCustomer = customers.find(c => c.id === selectedCustomerId)
    const change = (parseFloat(paidAmount) || 0) - grandTotal

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] gap-4">
            {/* Left: Product Catalog */}
            <div className="flex-1 flex flex-col bg-card rounded-xl border shadow-sm overflow-hidden">
                {/* Input Mode Tabs */}
                <div className="p-4 border-b bg-muted/30">
                    <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'search' | 'command')}>
                        <TabsList className="grid w-full grid-cols-2 mb-3">
                            <TabsTrigger value="search" className="text-sm">
                                <Search className="h-4 w-4 mr-2" /> Search (F2)
                            </TabsTrigger>
                            <TabsTrigger value="command" className="text-sm">
                                <Terminal className="h-4 w-4 mr-2" /> Batch (F4)
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="search" className="mt-0">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    ref={searchInputRef}
                                    placeholder="Ketik nama produk + Enter..."
                                    className="pl-10 h-11"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    autoFocus
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="command" className="mt-0 space-y-2">
                            <Textarea
                                ref={commandInputRef}
                                placeholder={`Ketik daftar item (satu per baris):
andesit 20x40 5
candi 30x40 3
green sukabumi 10

Lalu tekan Ctrl+Enter atau klik Proses`}
                                className="min-h-[100px] font-mono text-sm"
                                value={commandText}
                                onChange={e => setCommandText(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && e.ctrlKey) {
                                        e.preventDefault()
                                        processCommand()
                                    }
                                }}
                            />
                            <div className="flex gap-2">
                                <Button onClick={processCommand} className="flex-1">
                                    <Zap className="h-4 w-4 mr-2" /> Proses (Ctrl+Enter)
                                </Button>
                                <Button variant="outline" onClick={() => { setCommandText(""); setCommandResults([]) }}>
                                    Clear
                                </Button>
                            </div>
                            {commandResults.length > 0 && (
                                <div className="text-xs space-y-1 p-2 bg-muted rounded max-h-20 overflow-auto">
                                    {commandResults.map((r, i) => (
                                        <div key={i}>{r}</div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>

                    <div className="text-xs text-muted-foreground mt-2 flex gap-4 flex-wrap">
                        <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">F2</kbd> Search</span>
                        <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">F4</kbd> Batch</span>
                        <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">F8</kbd> Tunai</span>
                        <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">F12</kbd> Bayar</span>
                    </div>
                </div>

                {/* Product Grid - only show in search mode */}
                {inputMode === 'search' && (
                    <div className="flex-1 overflow-auto p-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                            {filteredProducts.map((product, index) => (
                                <Card
                                    key={product.id}
                                    className={`cursor-pointer transition-all overflow-hidden hover-lift ${product.stock <= 0 ? 'opacity-50' : 'hover:border-primary'} ${index === 0 && searchTerm ? 'ring-2 ring-primary' : ''}`}
                                    onClick={() => addToCart(product)}
                                >
                                    <CardHeader className="p-3 pb-2">
                                        <CardTitle className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">
                                            {index === 0 && searchTerm && <Star className="h-3 w-3 inline mr-1 text-primary" />}
                                            {product.name}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-3 pt-0">
                                        <div className="flex items-center justify-between">
                                            <Badge variant={product.stock <= 5 ? "destructive" : "secondary"} className="text-xs">
                                                {product.stock} {product.unit}
                                            </Badge>
                                        </div>
                                        <div className="font-bold text-lg text-primary mt-2">
                                            {formatRupiah(product.price)}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {filteredProducts.length === 0 && (
                                <div className="col-span-full text-center py-12 text-muted-foreground">
                                    <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                    <p>Produk tidak ditemukan</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Command mode info */}
                {inputMode === 'command' && (
                    <div className="flex-1 overflow-auto p-4">
                        <div className="text-center py-8 text-muted-foreground">
                            <Terminal className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p className="font-medium mb-2">Batch Input Mode</p>
                            <p className="text-sm">Ketik nama produk dan jumlah, satu per baris</p>
                            <p className="text-sm">Contoh: <code className="bg-muted px-1 rounded">andesit 20x40 5</code></p>
                            <p className="text-xs mt-4 text-muted-foreground/60">
                                Tips: Cukup ketik sebagian nama, sistem akan mencocokkan otomatis
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Right: Cart */}
            <div className="w-full lg:w-[400px] flex flex-col bg-card rounded-xl border shadow-sm overflow-hidden">
                {/* Customer Selection */}
                <div className="p-4 border-b bg-gradient-to-r from-primary/10 to-primary/5">
                    <div className="flex items-center gap-2 mb-3">
                        <User className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Pelanggan</span>
                    </div>
                    <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                        <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Pilih Pelanggan" />
                        </SelectTrigger>
                        <SelectContent>
                            {customers.map(c => (
                                <SelectItem key={c.id} value={c.id}>
                                    <div className="flex items-center justify-between w-full">
                                        <span>{c.name}</span>
                                        {c.balance > 0 && (
                                            <Badge variant="outline" className="ml-2 text-xs text-destructive">
                                                Hutang: {formatRupiah(c.balance)}
                                            </Badge>
                                        )}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Cart Header */}
                <div className="px-4 py-3 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        <span className="font-semibold">Keranjang</span>
                        <Badge variant="secondary">{totalItems} item</Badge>
                    </div>
                    {cart.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={clearCart} className="text-xs text-muted-foreground">
                            <RotateCcw className="h-3 w-3 mr-1" /> Reset
                        </Button>
                    )}
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                            <Receipt className="h-16 w-16 opacity-20 mb-3" />
                            <p className="text-sm">Keranjang masih kosong</p>
                            <p className="text-xs">Ketik nama produk + Enter</p>
                            <p className="text-xs">atau gunakan Batch Mode (F4)</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.productId} className="flex gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{item.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatRupiah(item.price)} × {item.qty}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <p className="font-bold text-sm">{formatRupiah(item.price * item.qty)}</p>
                                    <div className="flex items-center gap-1">
                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.productId, item.qty - 1)}>-</Button>
                                        <Input
                                            type="number"
                                            className="h-7 w-12 text-center text-sm p-0"
                                            value={item.qty}
                                            onChange={(e) => updateQty(item.productId, parseInt(e.target.value) || 0)}
                                            min={0}
                                        />
                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.productId, item.qty + 1)}>+</Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeFromCart(item.productId)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Cart Footer */}
                <div className="p-4 border-t bg-muted/30 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total</span>
                        <span className="text-2xl font-bold">{formatRupiah(grandTotal)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant="outline"
                            className="h-12 text-base font-semibold border-green-500 text-green-600 hover:bg-green-50"
                            disabled={cart.length === 0 || isProcessing}
                            onClick={handleQuickCash}
                        >
                            <Zap className="h-4 w-4 mr-2" />
                            Tunai (F8)
                        </Button>
                        <Button
                            className="h-12 text-base font-semibold"
                            disabled={cart.length === 0}
                            onClick={() => setIsCheckoutOpen(true)}
                        >
                            <Calculator className="h-4 w-4 mr-2" />
                            Bayar (F12)
                        </Button>
                    </div>
                </div>
            </div>

            {/* Checkout Dialog */}
            <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Pembayaran</DialogTitle>
                        <DialogDescription>
                            Pelanggan: <strong>{selectedCustomer?.name}</strong>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="p-4 rounded-lg bg-primary/10 text-center">
                            <p className="text-sm text-muted-foreground mb-1">Total Tagihan</p>
                            <p className="text-3xl font-bold text-primary">{formatRupiah(grandTotal)}</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Nominal Bayar</Label>
                            <Input
                                ref={payInputRef}
                                type="number"
                                placeholder="Masukkan nominal..."
                                value={paidAmount}
                                onChange={e => setPaidAmount(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !isProcessing) {
                                        handleCheckout()
                                    }
                                }}
                                className="h-12 text-lg"
                            />
                            <div className="flex gap-2 flex-wrap">
                                <Button variant="outline" size="sm" onClick={() => setPaidAmount(grandTotal.toString())}>
                                    Uang Pas
                                </Button>
                                {QUICK_PAY_AMOUNTS.filter(a => a >= grandTotal * 0.5).slice(0, 4).map(amount => (
                                    <Button
                                        key={amount}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPaidAmount(amount.toString())}
                                    >
                                        {formatRupiah(amount).replace('Rp', '')}
                                    </Button>
                                ))}
                                <Button variant="outline" size="sm" onClick={() => setPaidAmount("")} className="text-destructive">
                                    BON
                                </Button>
                            </div>
                        </div>

                        <div className="p-4 rounded-lg border space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Total</span>
                                <span className="font-medium">{formatRupiah(grandTotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Bayar</span>
                                <span className="font-medium">{formatRupiah(parseFloat(paidAmount) || 0)}</span>
                            </div>
                            <div className="border-t pt-2 flex justify-between font-bold text-lg">
                                <span>{change >= 0 ? 'Kembalian' : 'Sisa Hutang'}</span>
                                <span className={change >= 0 ? 'text-emerald-600' : 'text-destructive'}>
                                    {formatRupiah(Math.abs(change))}
                                </span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>Batal</Button>
                        <Button
                            onClick={handleCheckout}
                            disabled={isProcessing}
                            className="min-w-[120px]"
                        >
                            {isProcessing ? "Memproses..." : "Selesai (Enter)"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
