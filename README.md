# Mitra Usaha POS - Sistem Manajemen Penjualan

## 🎯 Mapping Fitur Excel → Sistem

| Sheet Excel | Fitur di Sistem | Menu | Status |
|-------------|-----------------|------|--------|
| **Daftar Harga** | Master Produk (Nama, HPP, Harga Jual, Stok, Satuan) | `/dashboard/products` | ✅ |
| **MAIN** (Transaksi Penjualan) | Kasir/POS - Buat Transaksi, Kurangi Stok Otomatis | `/dashboard/pos` | ✅ |
| **Stok Gudang (IN)** | Pembelian/Stock Masuk - Tambah Stok Otomatis | `/dashboard/purchases` | ✅ |
| **PIUTANG** | Saldo Hutang Pelanggan (Real-time) | `/dashboard/customers` | ✅ |
| **Piutang M** | Detail Piutang Per Pelanggan | `/dashboard/customers` | ✅ |
| **Pembayaran** | Terima Pembayaran Piutang (Tombol "Bayar") | `/dashboard/customers` | ✅ |
| **Hutang** (Rully, Junaedi, Ramdan) | Supplier & Hutang Kita | `/dashboard/suppliers` | ✅ |
| **Transaksi Harian** | Arus Kas (Debit/Kredit Manual + Otomatis) | `/dashboard/cashflow` | ✅ |
| **Stock Opname** | Penyesuaian Stok Fisik vs Sistem | `/dashboard/stock-opname` | ✅ |
| **LR (Laba Rugi)** | Laporan Laba Rugi Otomatis | `/dashboard/reports` | ✅ |

---

## 🔄 Alur Logika Otomatis

### 1. PENJUALAN (POS)

```
User Input: Pilih Pelanggan → Pilih Produk → Input Bayar → Selesai
↓
Sistem Otomatis:
├── Stok Produk BERKURANG
├── Jika belum lunas → Piutang Pelanggan BERTAMBAH
└── Jika bayar > 0 → CashFlow DEBIT (Uang Masuk) tercatat
```

### 2. PEMBELIAN (Stock IN)

```
User Input: Pilih Supplier → Pilih Produk → Input Harga Beli → Bayar/Hutang
↓
Sistem Otomatis:
├── Stok Produk BERTAMBAH
├── HPP Produk di-update ke harga beli terakhir
├── Jika belum lunas → Hutang ke Supplier BERTAMBAH
└── Jika bayar > 0 → CashFlow KREDIT (Uang Keluar) tercatat
```

### 3. BAYAR PIUTANG (Pelanggan bayar hutang)

```
User Input: Pilih Pelanggan → Input Nominal Bayar
↓
Sistem Otomatis:
├── Saldo Piutang Pelanggan BERKURANG
└── CashFlow DEBIT (Uang Masuk) tercatat
```

### 4. BAYAR HUTANG (Kita bayar ke Supplier)

```
User Input: Pilih Supplier → Input Nominal Bayar
↓
Sistem Otomatis:
├── Saldo Hutang ke Supplier BERKURANG
└── CashFlow KREDIT (Uang Keluar) tercatat
```

### 5. STOCK OPNAME

```
User Input: Pilih Produk → Input Stok Hasil Hitung Fisik
↓
Sistem Otomatis:
├── Stok di Sistem di-ADJUST sesuai fisik
└── Selisih + Alasan tercatat di History
```

---

## 📊 Laporan Laba Rugi (Otomatis)

```
Penjualan (Total Nilai Jual)
- HPP (Harga Pokok Penjualan = Cost × Qty)
─────────────────────────────────────────
= LABA KOTOR

- Biaya Operasional (dari CashFlow KREDIT non-pembelian)
─────────────────────────────────────────
= LABA BERSIH
```

---

## 🚀 Cara Menjalankan

```bash
cd /home/omanjaya/Project/UD
npm run dev
```

Buka: **<http://localhost:3001>**

---

## 📁 Struktur Database

- `Product` - Master produk (stok, HPP, harga jual)
- `Customer` - Pelanggan + saldo piutang
- `Supplier` - Supplier + saldo hutang kita
- `Transaction` - Penjualan (header)
- `TransactionItem` - Detail item penjualan
- `Purchase` - Pembelian (header)
- `PurchaseItem` - Detail item pembelian
- `Payment` - Log pembayaran piutang
- `SupplierPayment` - Log bayar hutang ke supplier
- `CashFlow` - Arus kas (debit/kredit)
- `StockOpname` - History penyesuaian stok

---

## 🎨 Teknologi

- **Frontend**: Next.js 16 + React + TypeScript
- **Database**: SQLite (bisa upgrade ke PostgreSQL)
- **ORM**: Prisma 6
- **UI**: Tailwind CSS + Shadcn/UI
- **Theme**: Modern Indigo (Dark Sidebar)
