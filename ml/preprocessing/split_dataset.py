
import pandas as pd
import os
from sklearn.model_selection import train_test_split

# Input files
X_PATH = r"ml\data\processed\X.csv"
Y_PATH = r"ml\data\processed\y.csv"

# Output folder
OUTPUT_DIR = r"ml\data\processed\split"

def main():
    print("=" * 60)
    print("CIC-IDS2017 TRAIN/TEST SPLIT")
    print("=" * 60)

    # Load features and labels
    print("\nLoading X and y...")
    X = pd.read_csv(X_PATH)
    y = pd.read_csv(Y_PATH)["Label"]

    print(f"Feature rows: {len(X):,}")
    print(f"Label rows:   {len(y):,}")
    print(f"Features:     {X.shape[1]}")

    # Confirm rows match
    if len(X) != len(y):
        raise ValueError("X and y have different row counts!")

    # Split: 80% training, 20% testing
    print("\nSplitting dataset...")

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
        stratify=y
    )

    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Save all four files
    X_train.to_csv(
        os.path.join(OUTPUT_DIR, "X_train.csv"), index=False
    )
    X_test.to_csv(
        os.path.join(OUTPUT_DIR, "X_test.csv"), index=False
    )
    y_train.to_csv(
        os.path.join(OUTPUT_DIR, "y_train.csv"), index=False
    )
    y_test.to_csv(
        os.path.join(OUTPUT_DIR, "y_test.csv"), index=False
    )

    print("\nSPLIT COMPLETED")
    print("-" * 40)
    print(f"Training records: {len(X_train):,}")
    print(f"Testing records:  {len(X_test):,}")
    print(f"Training labels:  {len(y_train):,}")
    print(f"Testing labels:   {len(y_test):,}")
    print(f"\nSaved to: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
