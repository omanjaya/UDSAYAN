#!/usr/bin/env python3
"""
Excel to Seed Data Converter
Converts Mitra Usaha Excel file to seed-data.json format
"""

import pandas as pd
import json
from datetime import datetime
from decimal import Decimal
import sys

EXCEL_FILE = 'tmp/MITRA USAHA SAYAN 2025.xlsx'
OUTPUT_FILE = 'prisma/seed-data-from-excel.json'

def safe_float(value, default=0):
    """Safely convert value to float"""
    try:
        if pd.isna(value) or value is None or value == '':
            return default
        return float(value)
    except:
        return default

def safe_int(value, default=0):
    """Safely convert value to int"""
    try:
        if pd.isna(value) or value is None or value == '':
            return default
        return int(float(value))
    except:
        return default

def safe_str(value, default=''):
    """Safely convert value to string"""
    try:
        if pd.isna(value) or value is None:
            return default
        return str(value).strip()
    except:
        return default

def extract_products(xls):
    """
    Extract products from MAIN sheet or Stok Gudang
    Returns list of unique products with HPP and HJ
    """
    print("Extracting products...")
    products = {}

    try:
        # Try MAIN sheet first (has ITEM, HPP, HJ)
        df_main = pd.read_excel(xls, sheet_name='MAIN')

        for _, row in df_main.iterrows():
            item = safe_str(row.get('ITEM', ''))
            if not item or item == 'nan':
                continue

            hpp = safe_float(row.get('HPP', 0))
            hj = safe_float(row.get('HJ', 0))
            sisa_stock = safe_int(row.get('Sisa Stock', 0))

            if item not in products and hpp > 0 and hj > 0:
                products[item] = {
                    "name": item,
                    "stock": sisa_stock if sisa_stock > 0 else 100,
                    "hpp": hpp,
                    "price": hj,
                    "unit": "m2",  # Default, bisa disesuaikan
                    "category": "Batu Alam"
                }
    except Exception as e:
        print(f"Error reading MAIN sheet: {e}")

    # Fallback: Try Stok Gudang sheet
    if not products:
        try:
            df_stock = pd.read_excel(xls, sheet_name='Stok Gudang')

            for _, row in df_stock.iterrows():
                item = safe_str(row.get('ITEM', ''))
                if not item or item == 'nan':
                    continue

                hpp = safe_float(row.get('HPP', 0))
                stok_akhir = safe_int(row.get('Stok Akhir', 0))

                if item not in products and hpp > 0:
                    products[item] = {
                        "name": item,
                        "stock": stok_akhir if stok_akhir > 0 else 100,
                        "hpp": hpp,
                        "price": hpp * 1.2,  # Estimate 20% markup
                        "unit": "m2",
                        "category": "Batu Alam"
                    }
        except Exception as e:
            print(f"Error reading Stok Gudang sheet: {e}")

    print(f"Found {len(products)} unique products")
    return list(products.values())

def extract_customers(xls):
    """
    Extract customers from PIUTANG or Piutang M sheet
    """
    print("Extracting customers...")
    customers = {}

    try:
        # Try Piutang M sheet (has detail per customer)
        df_piutang = pd.read_excel(xls, sheet_name='Piutang M')

        for _, row in df_piutang.iterrows():
            nama = safe_str(row.get('Nama', ''))
            if not nama or nama == 'nan' or nama == 'NaN':
                continue

            sisa_hutang = safe_float(row.get('Sisa Hutang', 0))

            if nama not in customers:
                customers[nama] = {
                    "name": nama,
                    "phone": "",
                    "address": "",
                    "balance": sisa_hutang
                }
            else:
                # Accumulate balance if customer appears multiple times
                customers[nama]["balance"] += sisa_hutang

    except Exception as e:
        print(f"Error reading Piutang M sheet: {e}")

    # Fallback: Try PIUTANG sheet
    if not customers:
        try:
            df_piutang_summary = pd.read_excel(xls, sheet_name='PIUTANG')

            for _, row in df_piutang_summary.iterrows():
                nama = safe_str(row.get('NAMA', ''))
                if not nama or nama == 'nan' or nama == '(blank)':
                    continue

                utang = safe_float(row.get('UTANG', 0))
                sisa = safe_float(row.get('Sisa', 0))

                if nama not in customers and utang > 0:
                    customers[nama] = {
                        "name": nama,
                        "phone": "",
                        "address": "",
                        "balance": sisa if sisa > 0 else utang
                    }
        except Exception as e:
            print(f"Error reading PIUTANG sheet: {e}")

    print(f"Found {len(customers)} customers")
    return list(customers.values())

def extract_suppliers(xls):
    """
    Extract suppliers from Hutang sheet
    """
    print("Extracting suppliers...")
    suppliers = []

    try:
        df_hutang = pd.read_excel(xls, sheet_name='Hutang')

        # Hutang sheet might have supplier names in row headers
        # This needs to be adjusted based on actual structure
        # For now, create some default suppliers
        default_suppliers = ['Rully', 'Junaedi', 'Ramdan', 'PT Batu Alam']

        for supplier_name in default_suppliers:
            suppliers.append({
                "name": supplier_name,
                "phone": "",
                "address": "",
                "balance": 0
            })

    except Exception as e:
        print(f"Error reading Hutang sheet: {e}")
        # Create default suppliers anyway
        suppliers = [
            {"name": "Supplier Default", "phone": "", "address": "", "balance": 0}
        ]

    print(f"Found {len(suppliers)} suppliers")
    return suppliers

def main():
    print(f"Reading Excel file: {EXCEL_FILE}")

    try:
        xls = pd.ExcelFile(EXCEL_FILE)
        print(f"Available sheets: {xls.sheet_names}")

        # Extract data
        products = extract_products(xls)
        customers = extract_customers(xls)
        suppliers = extract_suppliers(xls)

        # Create seed data structure
        seed_data = {
            "products": products[:500],  # Limit to 500 products to avoid huge file
            "customers": customers[:200],  # Limit to 200 customers
            "suppliers": suppliers
        }

        # Write to JSON
        print(f"\nWriting to {OUTPUT_FILE}...")
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(seed_data, f, indent=2, ensure_ascii=False)

        print("\n✅ Success!")
        print(f"   Products: {len(seed_data['products'])}")
        print(f"   Customers: {len(seed_data['customers'])}")
        print(f"   Suppliers: {len(seed_data['suppliers'])}")
        print(f"\nSeed file created: {OUTPUT_FILE}")
        print("\nNext steps:")
        print("1. Review the generated file")
        print("2. Update prisma/seed.ts to use this file")
        print("3. Run: npm run db:seed")

    except FileNotFoundError:
        print(f"❌ Error: File not found: {EXCEL_FILE}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
