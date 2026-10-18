import json
import joblib
import pandas as pd
from pathlib import Path
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score

ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = ROOT / "ml/models/random_forest.pkl"
MAPPING_PATH = ROOT / "ml/data/processed/label_mapping.json"
X_PATH = ROOT / "ml/data/processed/split/X_test.csv"
Y_PATH = ROOT / "ml/data/processed/split/y_test.csv"
REPORT_PATH = ROOT / "ml/data/processed/evaluation_report.json"
BATCH_SIZE = 20000


def main():
    print("=" * 60)
    print("FULL TEST DATASET MODEL EVALUATION")
    print("=" * 60)

    for path in (MODEL_PATH, MAPPING_PATH, X_PATH, Y_PATH):
        if not path.exists():
            raise FileNotFoundError(f"File not found: {path}")

    print("\nLoading model and label mapping...")
    model = joblib.load(MODEL_PATH)

    with open(MAPPING_PATH, "r", encoding="utf-8") as file:
        mapping = json.load(file)

    # Expected mapping format: {"BENIGN": 0, "DDoS": 1, ...}
    id_to_name = {int(class_id): str(name) for name, class_id in mapping.items()}

    print("Model loaded. Expected features:", model.n_features_in_)
    print("\nLoading test data...")
    X = pd.read_csv(X_PATH)
    y_df = pd.read_csv(Y_PATH)

    if len(X) != len(y_df):
        raise ValueError("X_test and y_test have different row counts.")

    if hasattr(model, "feature_names_in_"):
        expected = list(model.feature_names_in_)
        missing = set(expected) - set(X.columns)
        extra = set(X.columns) - set(expected)
        if missing or extra:
            raise ValueError(f"Feature mismatch. Missing={missing}; extra={extra}")
        X = X[expected]

    if X.shape[1] != model.n_features_in_:
        raise ValueError(f"Expected {model.n_features_in_} features, got {X.shape[1]}")

    if y_df.shape[1] != 1:
        raise ValueError("Expected exactly one label column in y_test.csv")

    y = y_df.iloc[:, 0].to_numpy()
    predictions = []

    print(f"Test records: {len(X):,}")
    print("Predicting in batches...")

    for start in range(0, len(X), BATCH_SIZE):
        end = min(start + BATCH_SIZE, len(X))
        batch = model.predict(X.iloc[start:end])
        predictions.extend(batch.tolist())
        print(f"Processed {end:,}/{len(X):,} ({end / len(X) * 100:.1f}%)")

    names = sorted(set(id_to_name.get(int(v), str(v)) for v in y) |
                   set(id_to_name.get(int(v), str(v)) for v in predictions))
    y_names = [id_to_name.get(int(v), str(v)) for v in y]
    pred_names = [id_to_name.get(int(v), str(v)) for v in predictions]

    accuracy = accuracy_score(y, predictions)
    macro_f1 = f1_score(y_names, pred_names, labels=names,
                         average="macro", zero_division=0)
    report = classification_report(y_names, pred_names, labels=names,
                                   output_dict=True, zero_division=0)
    matrix = confusion_matrix(y_names, pred_names, labels=names)

    print("\n" + "=" * 60)
    print("EVALUATION RESULTS")
    print("=" * 60)
    print(f"Total test records : {len(y):,}")
    print(f"Correct predictions: {sum(int(a == b) for a, b in zip(y, predictions)):,}")
    print(f"Accuracy           : {accuracy * 100:.4f}%")
    print(f"Macro F1-score     : {macro_f1:.4f}")

    print("\nCLASSIFICATION REPORT")
    print(classification_report(y_names, pred_names, labels=names,
                                zero_division=0))

    print("CONFUSION MATRIX")
    print("Class order:", names)
    print(matrix)

    output = {
        "test_records": int(len(y)),
        "accuracy": float(accuracy),
        "accuracy_percent": float(accuracy * 100),
        "macro_f1": float(macro_f1),
        "class_names": names,
        "classification_report": report,
        "confusion_matrix": matrix.tolist()
    }

    with open(REPORT_PATH, "w", encoding="utf-8") as file:
        json.dump(output, file, indent=2)

    print(f"\nReport saved to: {REPORT_PATH}")
    print("Evaluation completed successfully.")


if __name__ == "__main__":
    main()
