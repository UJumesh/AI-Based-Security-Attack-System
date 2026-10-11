import pandas as pd
import glob
import os

# ============================================================
# CIC-IDS2017 DATASET INSPECTION
# ============================================================

DATA_PATH = r"ml\data\raw\*.csv"


def inspect_file(file_path):
    """Inspect one CIC-IDS2017 CSV file."""

    print("\n" + "=" * 80)
    print(f"FILE: {os.path.basename(file_path)}")
    print("=" * 80)

    # Read CSV
    df = pd.read_csv(file_path)

    # Remove accidental spaces from column names
    df.columns = df.columns.str.strip()

    print(f"\nRows              : {len(df):,}")
    print(f"Columns           : {len(df.columns):,}")

    # --------------------------------------------------------
    # Label information
    # --------------------------------------------------------

    if "Label" in df.columns:
        print("\nLABEL DISTRIBUTION:")
        print(df["Label"].value_counts())

        print("\nLABEL PERCENTAGE:")
        print(
            (df["Label"].value_counts(normalize=True) * 100)
            .round(2)
        )

    else:
        print("\nWARNING: Label column not found!")

    # --------------------------------------------------------
    # Missing values
    # --------------------------------------------------------

    missing_total = df.isna().sum().sum()

    print(f"\nTotal missing values: {missing_total:,}")

    if missing_total > 0:
        print("\nColumns containing missing values:")
        missing = df.isna().sum()
        print(missing[missing > 0].sort_values(ascending=False).head(10))

    # --------------------------------------------------------
    # Infinite values
    # --------------------------------------------------------

    numeric_df = df.select_dtypes(include="number")

    infinity_count = numeric_df.isin([float("inf"), float("-inf")]).sum().sum()

    print(f"\nTotal infinity values: {infinity_count:,}")

    # --------------------------------------------------------
    # Duplicate rows
    # --------------------------------------------------------

    duplicate_count = df.duplicated().sum()

    print(f"\nDuplicate rows      : {duplicate_count:,}")

    # --------------------------------------------------------
    # Data types
    # --------------------------------------------------------

    print("\nDATA TYPES:")
    print(df.dtypes.value_counts())

    # --------------------------------------------------------
    # Feature information
    # --------------------------------------------------------

    if "Label" in df.columns:

        feature_columns = [
            column for column in df.columns
            if column != "Label"
        ]

        print(f"\nTotal features     : {len(feature_columns):,}")

        numeric_features = df[feature_columns].select_dtypes(
            include="number"
        )

        categorical_features = df[feature_columns].select_dtypes(
            exclude="number"
        )

        print(f"Numerical features : {len(numeric_features.columns):,}")
        print(f"Categorical        : {len(categorical_features.columns):,}")

    return df


def main():

    files = glob.glob(DATA_PATH)

    if not files:
        print("ERROR: No CSV files found.")
        print(f"Expected location: {DATA_PATH}")
        return

    print("=" * 80)
    print("CIC-IDS2017 DATASET INSPECTION")
    print("=" * 80)

    print(f"\nCSV files found: {len(files)}")

    total_rows = 0

    for file_path in files:

        df = inspect_file(file_path)

        total_rows += len(df)

        # Free memory before loading next file
        del df

    print("\n" + "=" * 80)
    print("FINAL SUMMARY")
    print("=" * 80)

    print(f"\nTotal CSV files : {len(files)}")
    print(f"Total rows      : {total_rows:,}")

    print("\nDataset inspection completed successfully.")


if __name__ == "__main__":
    main()