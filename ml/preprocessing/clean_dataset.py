import pandas as pd
import glob
import os

# ============================================================
# CIC-IDS2017 DATA CLEANING
# ============================================================

RAW_PATH = r"ml\data\raw\*.csv"
OUTPUT_PATH = r"ml\data\processed\cic_ids2017_clean.csv"


def main():

    files = glob.glob(RAW_PATH)

    if not files:
        print("ERROR: No CSV files found.")
        return

    print("=" * 70)
    print("CIC-IDS2017 DATA CLEANING")
    print("=" * 70)

    dataframes = []

    # --------------------------------------------------------
    # Read all CSV files
    # --------------------------------------------------------

    for file in files:

        print(f"\nReading: {os.path.basename(file)}")

        df = pd.read_csv(file)

        # Remove spaces from column names
        df.columns = df.columns.str.strip()

        dataframes.append(df)

        print(f"Rows loaded: {len(df):,}")

    # --------------------------------------------------------
    # Combine datasets
    # --------------------------------------------------------

    print("\nCombining all CSV files...")

    data = pd.concat(dataframes, ignore_index=True)

    print(f"Total rows: {len(data):,}")
    print(f"Total columns: {len(data.columns):,}")

    # --------------------------------------------------------
    # Remove duplicate rows
    # --------------------------------------------------------

    before = len(data)

    data = data.drop_duplicates()

    after = len(data)

    print(f"\nDuplicates removed: {before - after:,}")

    # --------------------------------------------------------
    # Replace infinity values
    # --------------------------------------------------------

    numeric_columns = data.select_dtypes(include="number").columns

    infinity_count = data[numeric_columns].isin(
        [float("inf"), float("-inf")]
    ).sum().sum()

    print(f"Infinity values found: {infinity_count:,}")

    data[numeric_columns] = data[numeric_columns].replace(
        [float("inf"), float("-inf")],
        pd.NA
    )

    # --------------------------------------------------------
    # Remove rows containing missing values
    # --------------------------------------------------------

    missing_before = data.isna().sum().sum()

    print(f"Missing values before cleaning: {missing_before:,}")

    data = data.dropna()

    missing_after = data.isna().sum().sum()

    print(f"Missing values after cleaning: {missing_after:,}")

    # --------------------------------------------------------
    # Clean labels
    # --------------------------------------------------------

    if "Label" not in data.columns:
        print("\nERROR: Label column not found!")
        return

    data["Label"] = data["Label"].astype(str).str.strip()

    print("\nAttack labels:")

    print(data["Label"].value_counts())

    # --------------------------------------------------------
    # Remove completely useless columns
    # --------------------------------------------------------

    useless_columns = [
        column for column in data.columns
        if column.lower() in [
            "flow id",
            "source ip",
            "destination ip",
            "timestamp"
        ]
    ]

    if useless_columns:

        print("\nRemoving columns:")

        for column in useless_columns:
            print(f" - {column}")

        data = data.drop(columns=useless_columns)

    # --------------------------------------------------------
    # Save cleaned dataset
    # --------------------------------------------------------

    os.makedirs(
        os.path.dirname(OUTPUT_PATH),
        exist_ok=True
    )

    data.to_csv(
        OUTPUT_PATH,
        index=False
    )

    # --------------------------------------------------------
    # Final summary
    # --------------------------------------------------------

    print("\n" + "=" * 70)
    print("CLEANING COMPLETED")
    print("=" * 70)

    print(f"\nFinal rows    : {len(data):,}")
    print(f"Final columns : {len(data.columns):,}")
    print(f"Output file   : {OUTPUT_PATH}")

    print("\nDataset is now ready for preprocessing.")


if __name__ == "__main__":
    main()