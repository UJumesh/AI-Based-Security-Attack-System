
import json
import joblib
import pandas as pd
from pathlib import Path
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
)

# Project paths
PROJECT_ROOT = Path(__file__).resolve().parents[2]

MODEL_PATH = PROJECT_ROOT / "ml" / "models" / "random_forest.pkl"
MAPPING_PATH = (
    PROJECT_ROOT / "ml" / "data" / "processed" / "label_mapping.json"
)
X_TEST_PATH = (
    PROJECT_ROOT / "ml" / "data" / "processed" / "split" / "X_test.csv"
)
Y_TEST_PATH = (
    PROJECT_ROOT / "ml" / "data" / "processed" / "split" / "y_test.csv"
)
REPORT_PATH = (
    PROJECT_ROOT / "ml" / "data" / "processed" / "evaluation_report.json"
)

BATCH_SIZE = 20_000


def main():
    print("=" * 65)
    print("FULL TEST DATASET MODEL EVALUATION")
    print("=" * 65)

    # Check required files
    for path in (MODEL_PATH, MAPPING_PATH, X_TEST_PATH, Y_TEST_PATH):
        if not path.exists():
            raise FileNotFoundError(f"Required file not found: {path}")

    print("\nLoading trained model...")
    model = joblib.load(MODEL_PATH)

    with open(MAPPING_PATH, "r", encoding="utf-8") as file:
        label_mapping = json.load(file)

    print("Model loaded successfully!")
    print(f"Expected features: {model.n_features_in_}")

    # Load test data
    print("\nLoading test dataset...")
    X_test = pd.read_csv(X_TEST_PATH)
    y_frame = pd.read_csv(Y_TEST_PATH)

    if len(X_test) != len(y_frame):
        raise ValueError("X_test and y_test contain different row counts.")

    if X_test.shape[1] != model.n_features_in_:
        raise ValueError(
            f"Expected {model.n_features_in_} features, "
            f"but test data has {X_test.shape[1]}."
        )

    # Use the model's original feature order when available.
    if hasattr(model, "feature_names_in_"):
        expected_features = list(model.feature_names_in_)

        missing = set(expected_features) - set(X_test.columns)
        extra = set(X_test.columns) - set(expected_features)

        if missing or extra:
            raise ValueError(
                f"Feature mismatch. Missing: {sorted(missing)}; "
                f"Extra: {sorted(extra)}"
            )

        X_test = X_test[expected_features]

    if y_frame.shape[1] != 1:
        raise ValueError("Expected y_test.csv to contain exactly one column.")

    y_test = y_frame.iloc[:, 0].to_numpy()

    print(f"Test records: {len(X_test):,}")
    print(f"Features: {X_test.shape[1]}")
    print(f"Batch size: {BATCH_SIZE:,}")
    print("\nPredicting in batches...")

    predictions = []

    for start in range(0, len(X_test), BATCH_SIZE):
        end = min(start + BATCH_SIZE, len(X_test))
        batch_predictions = model.predict(X_test.iloc[start:end])
        predictions.extend(batch_predictions.tolist())

        print(
            f"Processed {end:,}/{len(X_test):,} records "
            f"({100 * end / len(X_test):.1f}%)"
        )

    # Map class IDs to readable names.
    # Supports mappings stored as either {"0": "BENIGN"} or
    # {"BENIGN": 0}.
    id_to_name = {}

    for key, value in label_mapping.items():
        if isinstance(value, (int, float)) or (
            isinstance(value, str) and value.isdigit()
        ):
            id_to_name[int(value)] = str(key)
        else:
            try:
                id_to_name[int(key)] = str(value)
            except (ValueError, TypeError):
                continue

    def class_name(label):
        return id_to_name.get(int(label), str(label))

    y_true_names = [class_name(label) for label in y_test]
    y_pred_names = [class_name(label) for label in predictions]

    labels = sorted(set(y_true_names) | set(y_pred_names))

    accuracy = accuracy_score(y_test, predictions)
    macro_f1 = f1_score(
        y_true_names,
        y_pred_names,
        labels=labels,
        average="macro",
        zero_division=0,
    )

    report = classification_report(
        y_true_names,
        y_pred_names,
        labels=labels,
        output_dict=True,
        zero_division=0,
    )

    matrix = confusion_matrix(
        y_true_names,
        y_pred_names,
        labels=labels,
    )

    print("\n" + "=" * 65)
    print("EVALUATION RESULTS")
    print("=" * 65)
    print(f"Total test records : {len(y_test):,}")
    print(f"Correct predictions: {(y_test == predictions).sum():,}")
    print(f"Accuracy           : {accuracy * 100:.4f}%")
    print(f"Macro F1-score     : {macro_f1:.4f}")

    print("\nCLASSIFICATION REPORT")
    print("-" * 65)
    print(
        classification_report(
            y_true_names,
            y_pred_names,
            labels=labels,
            zero_division=0,
        )
    )

    print("CONFUSION MATRIX")
    print("Class order:", labels)
    print(matrix)

    # Save a machine-readable report for future dashboard integration.
    output = {
        "test_records": int(len(y_test)),
        "correct_predictions": int((y_test == predictions).sum()),
        "accuracy": float(accuracy),
        "accuracy_percent": float(accuracy * 100),
        "macro_f1": float(macro_f1),
        "class_names": labels,
        "classification_report": report,
        "confusion_matrix": matrix.tolist(),
    }

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)

    with open(REPORT_PATH, "w", encoding="utf-8") as file:
        json.dump(output, file, indent=2)

    print(f"\nEvaluation report saved to:\n{REPORT_PATH}")
    print("\nEvaluation completed successfully.")


if __name__ == "__main__":
    main()
