'use client'

import { useState, useMemo } from "react"
import { PurchaseItem, createPurchase } from "@/app/actions/suppliers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2, ShoppingBag, Truck, ChevronLeft, Check, Package, Square, CheckSquare, Search } from "lucide-react"
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

interface PlainProduct {
    id: string
    code: string | null
    name: string
    stock: number
    hpp: number
    price: number
    unit: string
    category: string | null
}

interface PlainSupplier {
    id: string
    name: string
    phone: string | null
    balance: number
}

interface SelectedProduct {
    product: PlainProduct
    qty: string
    price: string
}

interface ProductCategory {
    name: string
    icon: string
    color: string
    bgColor: string
    products: PlainProduct[]
}

const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(number)
}

// Category config with icons and colors
const CATEGORY_CONFIG: Record<string, { icon: string; color: string; bgColor: string }> = {
    'andesit': { icon: '🪨', color: 'text-slate-700', bgColor: 'bg-slate-100 hover:bg-slate-200 border-slate-300' },
    'candi': { icon: '🧱', color: 'text-amber-700', bgColor: 'bg-amber-50 hover:bg-amber-100 border-amber-300' },
    'putih tulang': { icon: '🦴', color: 'text-stone-600', bgColor: 'bg-stone-50 hover:bg-stone-100 border-stone-300' },
    'green sukabumi': { icon: '💎', color: 'text-emerald-700', bgColor: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300' },
    'paras jember': { icon: '🏔️', color: 'text-orange-700', bgColor: 'bg-orange-50 hover:bg-orange-100 border-orange-300' },
    'templek': { icon: '📋', color: 'text-yellow-700', bgColor: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-300' },
    'ganggong': { icon: '🔲', color: 'text-purple-700', bgColor: 'bg-purple-50 hover:bg-purple-100 border-purple-300' },
    'coating': { icon: '🎨', color: 'text-blue-700', bgColor: 'bg-blue-50 hover:bg-blue-100 border-blue-300' },
    'pae': { icon: '🧩', color: 'text-pink-700', bgColor: 'bg-pink-50 hover:bg-pink-100 border-pink-300' },
    'batu koral': { icon: '⚪', color: 'text-gray-600', bgColor: 'bg-gray-50 hover:bg-gray-100 border-gray-300' },
    'lainnya': { icon: '📦', color: 'text-gray-600', bgColor: 'bg-gray-50 hover:bg-gray-100 border-gray-300' },
}

// Extract category from product name
function extractCategory(name: string): string {
    const lowerName = name.toLowerCase()
    
    if (lowerName.includes('andesit')) return 'andesit'
    if (lowerName.includes('candi') && !lowerName.includes('ganggong')) return 'candi'
    if (lowerName.includes('putih tulang')) return 'putih tulang'
    if (lowerName.includes('green sukabumi') || lowerName.includes('sukabumi')) return 'green sukabumi'
    if (lowerName.includes('paras jember') || lowerName.includes('jember')) return 'paras jember'
    if (lowerName.includes('templek')) return 'templek'
    if (lowerName.includes('ganggong')) return 'ganggong'
    if (lowerName.includes('coating') || lowerName.includes('protex')) return 'coating'
    if (lowerName.includes('pae')) return 'pae'
    if (lowerName.includes('koral')) return 'batu koral'
    
    return 'lainnya'
}

// Extract size/variant from product name
function extractSize(name: string, category: string): string {
    const lowerName = name.toLowerCase()
    const catLower = category.toLowerCase()
    
    // Remove category name to get the variant/size
    let variant = lowerName.replace(catLower, '').trim()
    
    // Clean up common patterns
    variant = variant.replace(/^[\s\-]+/, '').replace(/[\s\-]+$/, '')
    
    return variant || name
}

export default function StockMasukClient({
    products,
    suppliers
}: {
    products: PlainProduct[]
    suppliers: PlainSupplier[]
}) {
    const [cart, setCart] = useState<PurchaseItem[]>([])
    const [selectedSupplierId, setSelectedSupplierId] = useState<string>("")
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    
    // Multi-select mode: track selected products with qty & price
    const [selectedProducts, setSelectedProducts] = useState<Map<string, SelectedProduct>>(new Map())
    
    // Search (for both category and products)
    const [searchTerm, setSearchTerm] = useState("")

    // Checkout State
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
    const [paidAmount, setPaidAmount] = useState("")
    const [invoiceNo, setInvoiceNo] = useState("")
    const [isProcessing, setIsProcessing] = useState(false)

    // Group products by category
    const categories = useMemo(() => {
        const grouped: Record<string, PlainProduct[]> = {}
        
        products.forEach(product => {
            const cat = extractCategory(product.name)
            if (!grouped[cat]) grouped[cat] = []
            grouped[cat].push(product)
        })
        
        // Convert to array and sort by count
        return Object.entries(grouped)
            .map(([name, prods]) => ({
                name,
                ...CATEGORY_CONFIG[name] || CATEGORY_CONFIG['lainnya'],
                products: prods.sort((a, b) => a.name.localeCompare(b.name))
            }))
            .sort((a, b) => b.products.length - a.products.length)
    }, [products])

    // Filter categories by search term (for step 1)
    const filteredCategories = useMemo(() => {
        if (!searchTerm) return categories
        const q = searchTerm.toLowerCase()
        return categories.filter(c => c.name.toLowerCase().includes(q))
    }, [categories, searchTerm])

    // Direct product search (search all products across categories)
    const directSearchProducts = useMemo(() => {
        if (!searchTerm || searchTerm.length < 2) return []
        const q = searchTerm.toLowerCase()
        return products.filter(p => p.name.toLowerCase().includes(q)).slice(0, 20)
    }, [products, searchTerm])

    // Get products for selected category (with search filter)
    const categoryProducts = useMemo(() => {
        if (!selectedCategory) return []
        const cat = categories.find(c => c.name === selectedCategory)
        let prods = cat?.products || []
        
        // Filter by search term
        if (searchTerm) {
            const q = searchTerm.toLowerCase()
            prods = prods.filter(p => p.name.toLowerCase().includes(q))
        }
        
        return prods
    }, [selectedCategory, categories, searchTerm])

    // Toggle product selection
    const toggleProductSelection = (product: PlainProduct) => {
        setSelectedProducts(prev => {
            const newMap = new Map(prev)
            if (newMap.has(product.id)) {
                newMap.delete(product.id)
            } else {
                newMap.set(product.id, {
                    product,
                    qty: '',
                    price: product.hpp.toString()
                })
            }
            return newMap
        })
    }

    // Update qty for selected product
    const updateSelectedQty = (productId: string, qty: string) => {
        setSelectedProducts(prev => {
            const newMap = new Map(prev)
            const item = newMap.get(productId)
            if (item) {
                newMap.set(productId, { ...item, qty })
            }
            return newMap
        })
    }

    // Update price for selected product
    const updateSelectedPrice = (productId: string, price: string) => {
        setSelectedProducts(prev => {
            const newMap = new Map(prev)
            const item = newMap.get(productId)
            if (item) {
                newMap.set(productId, { ...item, price })
            }
            return newMap
        })
    }

    // Add all selected products to cart
    const handleAddSelectedToCart = () => {
        let addedCount = 0
        
        selectedProducts.forEach((selected, productId) => {
            const qty = parseFloat(selected.qty.replace(',', '.')) || 0
            const price = parseFloat(selected.price.replace(',', '.')) || 0
            
            if (qty <= 0) return
            
            setCart(prev => {
                const existing = prev.find(item => item.productId === productId)
                if (existing) {
                    return prev.map(item =>
                        item.productId === productId
                            ? { ...item, qty: item.qty + qty, cost: price }
                            : item
                    )
                }
                return [...prev, {
                    productId: productId,
                    name: selected.product.name,
                    cost: price,
                    qty: qty
                }]
            })
            addedCount++
        })

        if (addedCount > 0) {
            toast.success(`${addedCount} item ditambahkan!`)
            setSelectedProducts(new Map())
        } else {
            toast.error("Isi qty minimal 1 item")
        }
    }

    // Count selected with valid qty
    const validSelectedCount = useMemo(() => {
        let count = 0
        selectedProducts.forEach(item => {
            const qty = parseFloat(item.qty.replace(',', '.')) || 0
            if (qty > 0) count++
        })
        return count
    }, [selectedProducts])

    const updateCartQty = (productId: string, newQty: number) => {
        if (newQty <= 0) {
            removeFromCart(productId)
            return
        }
        setCart(prev => prev.map(item =>
            item.productId === productId ? { ...item, qty: newQty } : item
        ))
    }

    const updateCartPrice = (productId: string, newPrice: number) => {
        setCart(prev => prev.map(item =>
            item.productId === productId ? { ...item, cost: newPrice } : item
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
            toast.success("Stok Masuk Berhasil! ✅")
            setCart([])
            setPaidAmount("")
            setInvoiceNo("")
            setIsCheckoutOpen(false)
            setSelectedCategory(null)
            setSelectedProducts(new Map())
        } else {
            toast.error(result.error || "Gagal")
        }
        setIsProcessing(false)
    }

    const handleBack = () => {
        if (selectedCategory) {
            setSelectedCategory(null)
            setSelectedProducts(new Map())
            setSearchTerm("")
        }
    }

    // Get current step (now only 2 steps)
    const currentStep = selectedCategory ? 2 : 1

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-6rem)] gap-4">
            {/* Left: Product Selection */}
            <div className="flex-1 flex flex-col bg-card rounded-xl border shadow-sm overflow-hidden">
                {/* Header with breadcrumb */}
                <div className="p-4 border-b bg-muted/30">
                    <div className="flex items-center gap-2 mb-3">
                        {currentStep > 1 && (
                            <Button variant="ghost" size="sm" onClick={handleBack} className="mr-2">
                                <ChevronLeft className="h-5 w-5" />
                                Kembali
                            </Button>
                        )}
                        <div className="flex items-center gap-2 text-sm ml-auto">
                            <span className={`flex items-center gap-1 ${currentStep >= 1 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                                <Package className="h-4 w-4" /> Jenis
                            </span>
                            <span className="text-muted-foreground">→</span>
                            <span className={`flex items-center gap-1 ${currentStep >= 2 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                                ☑️ Pilih & Input
                            </span>
                        </div>
                    </div>
                    <h2 className="text-xl font-bold">
                        {currentStep === 1 && "Pilih Jenis Batu"}
                        {currentStep === 2 && `${CATEGORY_CONFIG[selectedCategory!]?.icon || '📦'} ${selectedCategory?.toUpperCase()}`}
                    </h2>
                    {currentStep === 2 && (
                        <p className="text-muted-foreground mt-1">Centang item, isi qty & harga, lalu klik "Tambah ke List"</p>
                    )}
                </div>

                {/* Content based on step */}
                <div className="flex-1 overflow-auto p-4">
                    {/* Step 1: Category Selection */}
                    {currentStep === 1 && (
                        <div className="space-y-4">
                            {/* Search input for categories */}
                            <div className="sticky top-0 bg-background pb-2 z-10">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Cari jenis batu... (misal: andesit, candi)"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 h-12 text-lg"
                                        autoFocus
                                    />
                                </div>
                                {searchTerm && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Ditemukan: {filteredCategories.length} jenis
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {filteredCategories.map((cat) => (
                                    <Card
                                        key={cat.name}
                                        className={`cursor-pointer transition-all border-2 ${cat.bgColor}`}
                                        onClick={() => {
                                            setSelectedCategory(cat.name)
                                            setSearchTerm("")
                                        }}
                                    >
                                        <CardContent className="p-6 text-center">
                                            <div className="text-4xl mb-3">{cat.icon}</div>
                                            <div className={`font-bold text-lg uppercase ${cat.color}`}>
                                                {cat.name}
                                            </div>
                                            <Badge variant="secondary" className="mt-2">
                                                {cat.products.length} item
                                            </Badge>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {filteredCategories.length === 0 && directSearchProducts.length === 0 && (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                    <p>Tidak ditemukan "{searchTerm}"</p>
                                </div>
                            )}

                            {/* Direct product search results */}
                            {directSearchProducts.length > 0 && (
                                <div className="mt-6">
                                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                        <Search className="h-5 w-5" />
                                        Hasil Pencarian Produk ({directSearchProducts.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {directSearchProducts.map((product) => {
                                            const isSelected = selectedProducts.has(product.id)
                                            const selectedData = selectedProducts.get(product.id)
                                            const isInCart = cart.some(item => item.productId === product.id)
                                            
                                            return (
                                                <Card
                                                    key={product.id}
                                                    className={`transition-all border-2 ${isSelected ? 'border-primary bg-primary/5' : isInCart ? 'border-green-500 bg-green-50' : 'hover:border-muted-foreground/50'}`}
                                                >
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start gap-4">
                                                            <button
                                                                onClick={() => toggleProductSelection(product)}
                                                                className="mt-1 flex-shrink-0"
                                                            >
                                                                {isSelected ? (
                                                                    <CheckSquare className="h-7 w-7 text-primary" />
                                                                ) : (
                                                                    <Square className="h-7 w-7 text-muted-foreground" />
                                                                )}
                                                            </button>

                                                            <div className="flex-1 min-w-0" onClick={() => !isSelected && toggleProductSelection(product)}>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-lg">{product.name}</span>
                                                                    {isInCart && (
                                                                        <Badge className="bg-green-500 text-xs">
                                                                            <Check className="h-3 w-3 mr-1" /> Sudah ada
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    Stok: {product.stock} {product.unit} • HPP: {formatRupiah(product.hpp)}
                                                                </div>
                                                            </div>

                                                            {isSelected && (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-24">
                                                                        <Label className="text-xs text-muted-foreground">Qty</Label>
                                                                        <Input
                                                                            type="text"
                                                                            inputMode="decimal"
                                                                            placeholder="0"
                                                                            value={selectedData?.qty || ''}
                                                                            onChange={(e) => updateSelectedQty(product.id, e.target.value)}
                                                                            className="h-12 text-lg text-center"
                                                                        />
                                                                    </div>
                                                                    <div className="w-32">
                                                                        <Label className="text-xs text-muted-foreground">Harga</Label>
                                                                        <Input
                                                                            type="text"
                                                                            inputMode="decimal"
                                                                            value={selectedData?.price || ''}
                                                                            onChange={(e) => updateSelectedPrice(product.id, e.target.value)}
                                                                            className="h-12 text-lg text-center"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )
                                        })}
                                    </div>

                                    {/* Add button for direct search */}
                                    {selectedProducts.size > 0 && (
                                        <div className="sticky bottom-0 bg-background pt-4 pb-2 border-t mt-4">
                                            <Button 
                                                onClick={handleAddSelectedToCart} 
                                                className="w-full h-14 text-xl font-bold"
                                                disabled={validSelectedCount === 0}
                                            >
                                                <Check className="h-6 w-6 mr-2" />
                                                Tambah {validSelectedCount} Item ke List
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Multi-Select with Qty & Price */}
                    {currentStep === 2 && (
                        <div className="space-y-4">
                            {/* Search input */}
                            <div className="sticky top-0 bg-background pb-2 z-10">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Cari ukuran... (misal: 20x40)"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 h-12 text-lg"
                                        autoFocus
                                    />
                                </div>
                                {searchTerm && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Ditemukan: {categoryProducts.length} item
                                    </p>
                                )}
                            </div>

                            {/* Product list with checkboxes */}
                            <div className="space-y-2">
                                {categoryProducts.map((product) => {
                                    const size = extractSize(product.name, selectedCategory!)
                                    const isSelected = selectedProducts.has(product.id)
                                    const selectedData = selectedProducts.get(product.id)
                                    const isInCart = cart.some(item => item.productId === product.id)
                                    
                                    return (
                                        <Card
                                            key={product.id}
                                            className={`transition-all border-2 ${isSelected ? 'border-primary bg-primary/5' : isInCart ? 'border-green-500 bg-green-50' : 'hover:border-muted-foreground/50'}`}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-start gap-4">
                                                    {/* Checkbox */}
                                                    <button
                                                        onClick={() => toggleProductSelection(product)}
                                                        className="mt-1 flex-shrink-0"
                                                    >
                                                        {isSelected ? (
                                                            <CheckSquare className="h-7 w-7 text-primary" />
                                                        ) : (
                                                            <Square className="h-7 w-7 text-muted-foreground" />
                                                        )}
                                                    </button>

                                                    {/* Product info */}
                                                    <div className="flex-1 min-w-0" onClick={() => !isSelected && toggleProductSelection(product)}>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-lg">{size}</span>
                                                            {isInCart && (
                                                                <Badge className="bg-green-500 text-xs">
                                                                    <Check className="h-3 w-3 mr-1" /> Sudah ada
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            Stok: {product.stock} {product.unit} • HPP: {formatRupiah(product.hpp)}
                                                        </div>
                                                    </div>

                                                    {/* Qty & Price inputs - show when selected */}
                                                    {isSelected && (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-24">
                                                                <Label className="text-xs text-muted-foreground">Qty</Label>
                                                                <Input
                                                                    type="text"
                                                                    inputMode="decimal"
                                                                    placeholder="0"
                                                                    value={selectedData?.qty || ''}
                                                                    onChange={(e) => updateSelectedQty(product.id, e.target.value)}
                                                                    className="h-12 text-lg text-center"
                                                                    autoFocus
                                                                />
                                                            </div>
                                                            <div className="w-32">
                                                                <Label className="text-xs text-muted-foreground">Harga</Label>
                                                                <Input
                                                                    type="text"
                                                                    inputMode="decimal"
                                                                    value={selectedData?.price || ''}
                                                                    onChange={(e) => updateSelectedPrice(product.id, e.target.value)}
                                                                    className="h-12 text-lg text-center"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>

                            {/* Add selected button - sticky at bottom */}
                            {selectedProducts.size > 0 && (
                                <div className="sticky bottom-0 bg-background pt-4 pb-2 border-t">
                                    <Button 
                                        onClick={handleAddSelectedToCart} 
                                        className="w-full h-14 text-xl font-bold"
                                        disabled={validSelectedCount === 0}
                                    >
                                        <Check className="h-6 w-6 mr-2" />
                                        Tambah {validSelectedCount} Item ke List
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Cart */}
            <div className="w-full lg:w-[400px] flex flex-col bg-card rounded-xl border shadow-sm overflow-hidden">
                {/* Supplier Selection */}
                <div className="p-4 border-b bg-gradient-to-r from-primary/10 to-primary/5">
                    <div className="flex items-center gap-2 mb-3">
                        <Truck className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Supplier</span>
                    </div>
                    <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                        <SelectTrigger className="h-12 text-base bg-background">
                            <SelectValue placeholder="-- Pilih Supplier --" />
                        </SelectTrigger>
                        <SelectContent>
                            {suppliers.map(s => (
                                <SelectItem key={s.id} value={s.id} className="text-base py-3">
                                    {s.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Cart Header */}
                <div className="px-4 py-3 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5" />
                        <span className="font-bold text-lg">List Stok Masuk</span>
                    </div>
                    <Badge variant="secondary" className="text-base px-3 py-1">
                        {cart.length} item
                    </Badge>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                            <ShoppingBag className="h-16 w-16 opacity-20 mb-3" />
                            <p className="text-lg">Belum ada item</p>
                            <p className="text-sm">Pilih jenis batu untuk mulai</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.productId} className="p-4 rounded-lg bg-muted/50 border space-y-3">
                                <div className="flex justify-between items-start">
                                    <p className="font-semibold text-base flex-1">{item.name}</p>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-destructive hover:text-destructive" 
                                        onClick={() => removeFromCart(item.productId)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <Label className="text-xs text-muted-foreground">Harga Beli</Label>
                                        <Input
                                            type="text"
                                            inputMode="decimal"
                                            className="h-10 text-base"
                                            value={item.cost}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(',', '.')
                                                updateCartPrice(item.productId, parseFloat(val) || 0)
                                            }}
                                        />
                                    </div>
                                    <div className="w-24">
                                        <Label className="text-xs text-muted-foreground">Qty</Label>
                                        <Input
                                            type="text"
                                            inputMode="decimal"
                                            className="h-10 text-base text-center"
                                            value={item.qty}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(',', '.')
                                                updateCartQty(item.productId, parseFloat(val) || 0)
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t">
                                    <span className="text-sm text-muted-foreground">Subtotal</span>
                                    <span className="font-bold text-lg">{formatRupiah(item.cost * item.qty)}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Cart Footer */}
                <div className="p-4 border-t bg-muted/30 space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-lg">Total</span>
                        <span className="text-3xl font-bold text-primary">{formatRupiah(grandTotal)}</span>
                    </div>
                    <Button
                        className="w-full h-14 text-xl font-bold"
                        size="lg"
                        disabled={cart.length === 0 || !selectedSupplierId}
                        onClick={() => setIsCheckoutOpen(true)}
                    >
                        <Check className="h-6 w-6 mr-2" />
                        Proses Stok Masuk
                    </Button>
                </div>
            </div>

            {/* Checkout Dialog */}
            <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Konfirmasi Stok Masuk</DialogTitle>
                        <DialogDescription>
                            Total: <strong className="text-primary text-lg">{formatRupiah(grandTotal)}</strong>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label className="text-base">No. Nota/Faktur (Opsional)</Label>
                            <Input
                                value={invoiceNo}
                                onChange={e => setInvoiceNo(e.target.value)}
                                placeholder="Contoh: INV-001"
                                className="h-12 text-base"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-base">Nominal Bayar</Label>
                            <Input
                                type="text"
                                inputMode="decimal"
                                placeholder="Kosongkan jika hutang"
                                value={paidAmount}
                                onChange={e => setPaidAmount(e.target.value)}
                                className="h-12 text-base"
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setPaidAmount(grandTotal.toString())}
                                >
                                    Lunas
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setPaidAmount("")}
                                    className="text-orange-600"
                                >
                                    Hutang
                                </Button>
                            </div>
                        </div>

                        <div className="p-4 bg-muted rounded-lg">
                            <div className="flex justify-between text-base">
                                <span>Sisa Hutang:</span>
                                <span className={`font-bold ${(grandTotal - (parseFloat(paidAmount) || 0)) > 0 ? 'text-orange-500' : 'text-green-600'}`}>
                                    {formatRupiah(grandTotal - (parseFloat(paidAmount) || 0))}
                                </span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsCheckoutOpen(false)} className="h-12">
                            Batal
                        </Button>
                        <Button onClick={handleCheckout} disabled={isProcessing} className="h-12 min-w-[140px]">
                            {isProcessing ? "Memproses..." : "✓ Simpan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
