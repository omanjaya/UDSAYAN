
import pandas as pd
import os

file_path = '/home/omanjaya/Project/UD/tmp/MITRA USAHA SAYAN 2025.xlsx'

def analyze_excel(file_path):
    print(f"Analyzing file: {file_path}")
    try:
        xls = pd.ExcelFile(file_path)
        print(f"Sheet names: {xls.sheet_names}")
        
        for sheet_name in xls.sheet_names:
            print(f"\n--- Sheet: {sheet_name} ---")
            try:
                # Read only a few rows to avoid memory issues with large files
                df = pd.read_excel(xls, sheet_name=sheet_name, nrows=5)
                print(f"Columns: {list(df.columns)}")
                print("First 5 rows:")
                print(df.head())
                
                # Get total rows count if possible efficiently, or just skip if too slow
                # parsing the whole sheet might be slow for 11MB but let's try reading just header for info if needed
                # For now, just the sample is enough to understand logic
            except Exception as e:
                print(f"Error reading sheet {sheet_name}: {e}")
                
    except Exception as e:
        print(f"Error opening file: {e}")

if __name__ == "__main__":
    analyze_excel(file_path)
