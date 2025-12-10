import Link from "next/link"
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    FileText,
    History,
    Menu,
    Truck,
    ShoppingBag,
    Wallet,
    ClipboardCheck,
    ArrowLeftRight
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

// Force dynamic rendering for all dashboard pages (they query database)
export const dynamic = 'force-dynamic'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen w-full flex-col md:flex-row">
            <DesktopSidebar />
            <div className="flex flex-col flex-1 md:pl-64 transition-all">
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:px-6">
                    <MobileSidebar />
                    <div className="flex-1">
                        <h1 className="text-lg font-bold md:text-xl gradient-text">Mitra Usaha POS</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-sm text-muted-foreground hidden md:block">
                            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                    </div>
                </header>
                <main className="flex-1 p-4 sm:p-6 bg-muted/30">
                    {children}
                </main>
            </div>
        </div>
    )
}

function DesktopSidebar() {
    return (
        <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col bg-sidebar md:flex">
            <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
                <Link className="flex items-center gap-3 font-bold text-xl text-sidebar-foreground" href="/dashboard">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sidebar-primary">
                        <Package className="h-5 w-5 text-sidebar-primary-foreground" />
                    </div>
                    <span>Mitra Usaha</span>
                </Link>
            </div>
            <div className="flex-1 overflow-auto py-4">
                <NavLinks className="px-3" />
            </div>
            <div className="p-4 border-t border-sidebar-border">
                <div className="text-xs text-sidebar-foreground/60">
                    © 2025 Mitra Usaha POS
                </div>
            </div>
        </aside>
    )
}

function MobileSidebar() {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button size="icon" variant="outline" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-sidebar">
                <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
                    <Link className="flex items-center gap-3 font-bold text-lg text-sidebar-foreground" href="/dashboard">
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sidebar-primary">
                            <Package className="h-4 w-4 text-sidebar-primary-foreground" />
                        </div>
                        <span>Mitra Usaha</span>
                    </Link>
                </div>
                <div className="py-4">
                    <NavLinks className="px-3" />
                </div>
            </SheetContent>
        </Sheet>
    )
}

function NavLinks({ className }: { className?: string }) {
    const sections = [
        {
            title: "Operasional",
            links: [
                { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
                { href: "/dashboard/pos", label: "Kasir (POS)", icon: ShoppingCart },
                { href: "/dashboard/purchases", label: "Pembelian (IN)", icon: ShoppingBag },
            ]
        },
        {
            title: "Data Master",
            links: [
                { href: "/dashboard/products", label: "Produk", icon: Package },
                { href: "/dashboard/customers", label: "Pelanggan & Piutang", icon: Users },
                { href: "/dashboard/suppliers", label: "Supplier & Hutang", icon: Truck },
            ]
        },
        {
            title: "Laporan",
            links: [
                { href: "/dashboard/transactions", label: "Riwayat Penjualan", icon: History },
                { href: "/dashboard/stock", label: "Pergerakan Stok", icon: ArrowLeftRight },
                { href: "/dashboard/cashflow", label: "Arus Kas", icon: Wallet },
                { href: "/dashboard/stock-opname", label: "Stock Opname", icon: ClipboardCheck },
                { href: "/dashboard/reports", label: "Laporan L/R", icon: FileText },
            ]
        }
    ]

    return (
        <nav className={`space-y-6 ${className}`}>
            {sections.map((section) => (
                <div key={section.title}>
                    <div className="px-3 mb-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                        {section.title}
                    </div>
                    <div className="space-y-1">
                        {section.links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sidebar-foreground/80 transition-all hover:text-sidebar-foreground hover:bg-sidebar-accent"
                            >
                                <link.icon className="h-4 w-4" />
                                <span className="text-sm font-medium">{link.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            ))}
        </nav>
    )
}
