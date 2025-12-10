# Analisa Sistem: Mitra Usaha Sayan 2025

Berdasarkan analisa mendalam terhadap file `MITRA USAHA SAYAN 2025.xlsx`, berikut adalah temuan logika bisnis dan usulan sistem yang paling sederhana namun efektif.

## 1. Logika Bisnis (Business Logic)

Bisnis ini bergerak di bidang **Supply Material Alam** (Batu Andesit, Candi, dll). Operasional utamanya meliputi:

1. **Penjualan & Stok (Sheet MAIN & Stok Gudang)**
    - Transaksi dicatat harian.
    - Setiap penjualan langsung mengurangi stok fisik.
    - Terdapat dua jenis harga: **HPP** (Harga Pokok Penjualan) dan **HJ** (Harga Jual).
    - Selisih (Margin) dihitung per transaksi untuk laporan Laba Rugi (L/R).
    - Status pembayaran vital: **LUNAS** atau **BON** (Hutang).

2. **Manajemen Piutang (Sheet Piutang & Pembayaran)**
    - Banyak transaksi bersifat kredit (Bon).
    - Pelunasan sering dilakukan bertahap (cicilan/partial payment).
    - Perlu tracking 'Sisa Hutang' per pelanggan yang akurat.

3. **Arus Kas (Sheet Transaksi Harian)**
    - Pencatatan kas masuk (Debet) dan keluar (Kredit) untuk operasional harian diluar penjualan stok saja (misal biaya lain-lain).

## 2. Masalah pada Excel Saat Ini

- **Redundansi**: Input data berulang di sheet MAIN, Stok, dan Piutang.
- **Rawan Kesalahan**: Formula manual untuk update stok dan sisa hutang bisa rusak atau tidak tertarik dengan benar.
- **Sulit Monitor**: Melihat total hutang satu orang harus memfilter sheet Piutang atau melihat rekap manual.

## 3. Usulan Sistem "Simplest Possible"

Sistem akan berbasis Web (Localhost atau Online) yang mengotomatisasi aliran data ini. User hanya input **satu kali** di satu tempat.

### Alur Kerja Sistem Baru

1. **Master Data Produk**: Input Stok Awal, HPP, dan Harga Jual standar.
2. **POS (Kasir/Invoice)**:
    - Pilih Pelanggan.
    - Pilih Barang & Jumlah.
    - Input Pembayaran (Full/DP/Nol).
    - **Otomatis**: Kurangi Stok, Tambah Catatan Penjualan, Tambah Piutang (jika belum lunas).
3. **Pelunasan Piutang**:
    - Menu khusus "Bayar Hutang".
    - Pilih Pelanggan -> Muncul Total Hutang.
1. **Master Data Produk**: Input Stok Awal, HPP, dan Harga Jual standar.
2. **POS (Kasir/Invoice)**:
    - Pilih Pelanggan.
    - Pilih Barang & Jumlah.
    - Input Pembayaran (Full/DP/Nol).
    - **Otomatis**: Kurangi Stok, Tambah Catatan Penjualan, Tambah Piutang (jika belum lunas).
3. **Pelunasan Piutang**:
    - Menu khusus "Bayar Hutang".
    - Pilih Pelanggan -> Muncul Total Hutang.
    - Input Bayar -> Update Sisa Hutang & Masuk Laporan Kas.
4. **Laporan Otomatis**:
    - Laporan Stok (Real-time).
    - Laporan Laba Rugi (Harian/Bulanan).
    - Laporan Kartu Piutang per Pelanggan.

## 4. Arsitektur Teknis: Maintainable & Upgradeable (Deep Analysis)

Untuk menjawab kebutuhan sistem yang **mudah di-maintain** namun **siap di-upgrade** kapanpun, berikut adalah pilihan "Golden Standard" saat ini:

### Core Stack

1. **Framework: Next.js 14/15 (App Router)**
    - *Why Maintainable*: Struktur berbasis file yang jelas. Satu bahasa (TypeScript) untuk Frontend & Backend mengurangi konteks switching.
    - *Why Upgradeable*: Ini adalah standar industri. Jika bisnis berkembang menjadi Enterprise, Next.js sanggup menangani jutaan request.

2. **Language: TypeScript**
    - *Why Maintainable*: "Self-documenting code". Tipe data yang ketat mencegah bug "undefined" yang sering terjadi di JavaScript biasa.
    - *Why Upgradeable*: Memudahkan refactoring. Saat fitur bertambah rumit, TypeScript menjaga kode tetap aman dari perubahan yang merusak.

3. **Database ORM: Prisma**
    - *Why Maintainable*: Schema database ("Schema.prisma") terbaca seperti dokumentasi. Query ke database sangat intuitif & aman (Type-safe).
    - *Why Upgradeable*: **Kunci Upgradeability**. Kita mulai dengan **SQLite** (file-based, tanpa setup server) untuk kesederhanaan. Jika data tembus jutaan baris, kita bisa switch ke PostgreSQL/MySQL hanya dengan mengubah 2 baris kode konvensional, tanpa merombak logika aplikasi.

4. **UI Library: Shadcn/UI + Tailwind CSS**
    - *Why Maintainable*: Kita memiliki kode komponennya (bukan npm dependency black-box). Layouting dengan Tailwind cepat dan mudah dibaca langsung di HTML.
    - *Why Upgradeable*: Desain sangat fleksibel. Mudah dikustomisasi untuk rebranding atau penambahan fitur UI kompleks (Dark mode, Mobile responsive sudah bawaan).

### Strategi "Future-Proof"

- **Local-First / Hybrid**: Sistem ini berjalan di Localhost (Laptop User) namun bisa di-deploy ke Cloud (Vercel/VPS) kapan saja tanpa perubahan kode berarti.
- **Backup Strategy**: Karena menggunakan SQLite awal-awal, backup database semudah copy-paste file `.db`.

### Integrasi Sistem Pembayaran & Eksternal

Stack ini **SANGAT CUKUP** dan memang didesain untuk integrasi (Extensible).

1. **Payment Gateway (QRIS/Transfer)**: Next.js memiliki "API Routes". Kita bisa membuat endpoint (misal: `/api/payment-callback`) untuk menerima notifikasi otomatis dari Xendit/Midtrans saat pembayaran sukses.
2. **Hardware POS (Printer/EDC)**: Karena berbasis Web Modern, kita bisa memanfaatkan **Web Serial API** atau **Web Bluetooth** untuk bicara langsung dengan thermal printer atau scanner barcode dari browser.
3. **API-First Design**: Backend logic kita terpisah, sehingga jika nanti ada aplikasi mobile atau mesin EDC pintar yang ingin "tembak data" ke sistem ini, jalurnya sudah tersedia.

### Database Schema (Prisma Draft)

```prisma
model Customer {
  id        String   @id @default(cuid())
  name      String
  phone     String?
  balance   Decimal  @default(0) // Hutang/Piutang
  transactions Transaction[]
  payments     Payment[]
}

model Product {
  id        String   @id @default(cuid())
  name      String
  stock     Int      @default(0)
  hpp       Decimal  // Harga Pokok
  price     Decimal  // Harga Jual
  unit      String   // m2, pcs, truck
  transactions TransactionItem[]
}

model Transaction {
  id        String   @id @default(cuid())
  date      DateTime @default(now())
  customer  Customer @relation(fields: [customerId], references: [id])
  customerId String
  items     TransactionItem[]
  total     Decimal
  status    String   // LUNAS, BON, PARTIAL
  
  // Future-proof untuk integrasi payment gateway
  paymentMethod String? // e.g., 'CASH', 'QRIS', 'TRANSFER'
  externalId    String? // ID dari mesin EDC atau Payment Gateway
}
```

---
**Status**: Siap untuk dibangun dengan fondasi yang kuat.
