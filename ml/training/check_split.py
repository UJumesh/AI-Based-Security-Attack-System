import pandas as pd
import os

BASE_PATH = r"ml\data\processed\split"


def main():
    print("=" * 60)
    print("TRAIN/TEST CLASS DISTRIBUTION CHECK")
    print("=" * 60)

    files = {
        "y_train.csv": "Training",
        "y_test.csv": "Testing",
    }

    distributions = {}

    for filename, title in files.items():
        path = os.path.join(BASE_PATH, filename)

        if not os.path.exists(path):
            print(f"ERROR: File not found: {path}")
            return

        df = pd.read_csv(path)

        if "Label" not in df.columns:
            print(f"ERROR: Label column missing in {filename}")
            return

        counts = df["Label"].value_counts().sort_index()
        distributions[title] = counts

        print(f"\n{title} set: {len(df):,} records")
        print("-" * 40)
        print(counts.to_string())

    comparison = pd.concat(distributions, axis=1).fillna(0).astype(int)

    print("\n" + "=" * 60)
    print("CLASS DISTRIBUTION COMPARISON")
    print("=" * 60)
    print(comparison.to_string())

    print("\nCheck completed.")


if __name__ == "__main__":
    main()