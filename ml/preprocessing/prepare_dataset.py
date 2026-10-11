import pandas as pd
import os
import json

# ============================================================
# CIC-IDS2017 ML DATASET PREPARATION
# ============================================================

INPUT_PATH = r"ml\data\processed\cic_ids2017_clean.csv"

X_OUTPUT = r"ml\data\processed\X.csv"
Y_OUTPUT = r"ml\data\processed\y.csv"
MAPPING_OUTPUT = r"ml\data\processed\label_mapping.json"


def main():

    print("=" * 70)
    print("CIC-IDS2017 ML DATASET PREPARATION")
    print("=" * 70)

    # --------------------------------------------------------
    # Load cleaned dataset
    # --------------------------------------------------------

    print("\nLoading cleaned dataset...")

    if not os.path.exists(INPUT_PATH):
        print("ERROR: Cleaned dataset not found!")
        print(f"Expected: {INPUT_PATH}")
        return

    df = pd.read_csv(INPUT_PATH)

    print(f"Rows    : {len(df):,}")
    print(f"Columns : {len(df.columns):,}")

    # --------------------------------------------------------
    # Clean column names
    # --------------------------------------------------------

    df.columns = df.columns.str.strip()

    # --------------------------------------------------------
    # Clean labels
    # --------------------------------------------------------

    if "Label" not in df.columns:
        print("ERROR: Label column not found!")
        return

    df["Label"] = (
        df["Label"]
        .astype(str)
        .str.strip()
    )

    # Fix common encoding problem in Web Attack labels
    df["Label"] = df["Label"].str.replace(
        "�",
        "–",
        regex=False
    )

    print("\nAttack classes:")
    print(df["Label"].value_counts())

    # --------------------------------------------------------
    # Separate features and target
    # --------------------------------------------------------

    print("\nSeparating features and labels...")

    X = df.drop(columns=["Label"])
    y = df["Label"]

    print(f"Features : {X.shape[1]}")
    print(f"Samples  : {X.shape[0]:,}")

    # --------------------------------------------------------
    # Convert features to numeric
    # --------------------------------------------------------

    print("\nConverting features to numeric...")

    for column in X.columns:

        X[column] = pd.to_numeric(
            X[column],
            errors="coerce"
        )

    # --------------------------------------------------------
    # Handle invalid values
    # --------------------------------------------------------

    print("\nChecking invalid values...")

    X = X.replace(
        [float("inf"), float("-inf")],
        pd.NA
    )

    invalid_rows = X.isna().any(axis=1).sum()

    print(f"Rows with invalid feature values: {invalid_rows:,}")

    if invalid_rows > 0:

        valid_rows = ~X.isna().any(axis=1)

        X = X.loc[valid_rows].reset_index(drop=True)
        y = y.loc[valid_rows].reset_index(drop=True)

    # --------------------------------------------------------
    # Remove constant features
    # --------------------------------------------------------

    print("\nChecking constant features...")

    constant_columns = [
        column
        for column in X.columns
        if X[column].nunique(dropna=False) <= 1
    ]

    print(f"Constant features found: {len(constant_columns)}")

    if constant_columns:

        print("\nRemoving constant features:")

        for column in constant_columns:
            print(f" - {column}")

        X = X.drop(columns=constant_columns)

    # --------------------------------------------------------
    # Encode labels
    # --------------------------------------------------------

    print("\nEncoding attack labels...")

    labels = sorted(y.unique())

    label_mapping = {
        label: index
        for index, label in enumerate(labels)
    }

    y_encoded = y.map(label_mapping)

    print("\nLabel mapping:")

    for label, number in label_mapping.items():
        print(f"{number:2d} -> {label}")

    # --------------------------------------------------------
    # Create output directory
    # --------------------------------------------------------

    os.makedirs(
        os.path.dirname(X_OUTPUT),
        exist_ok=True
    )

    # --------------------------------------------------------
    # Save X and y
    # --------------------------------------------------------

    print("\nSaving ML datasets...")

    X.to_csv(
        X_OUTPUT,
        index=False
    )

    y_encoded.to_csv(
        Y_OUTPUT,
        index=False,
        header=["Label"]
    )

    # Save label mapping
    with open(
        MAPPING_OUTPUT,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            label_mapping,
            file,
            indent=4,
            ensure_ascii=False
        )

    # --------------------------------------------------------
    # Final summary
    # --------------------------------------------------------

    print("\n" + "=" * 70)
    print("ML DATASET PREPARATION COMPLETED")
    print("=" * 70)

    print(f"\nFinal samples  : {len(X):,}")
    print(f"Final features : {X.shape[1]:,}")
    print(f"Classes        : {len(labels)}")

    print("\nFiles created:")

    print(f"X → {X_OUTPUT}")
    print(f"y → {Y_OUTPUT}")
    print(f"Mapping → {MAPPING_OUTPUT}")

    print("\nDataset is ready for train/test splitting.")


if __name__ == "__main__":
    main()