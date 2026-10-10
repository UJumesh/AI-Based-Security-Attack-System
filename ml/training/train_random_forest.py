
import json
import os
import time

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)
from sklearn.utils import resample

# ============================================================
# RANDOM FOREST TRAINING
# ============================================================

BASE_PATH = r"ml\data\processed\split"
MAPPING_PATH = r"ml\data\processed\label_mapping.json"

MODEL_DIR = r"ml\models"
MODEL_PATH = os.path.join(MODEL_DIR, "random_forest.pkl")
REPORT_PATH = os.path.join(MODEL_DIR, "evaluation_report.txt")

MAX_PER_CLASS = 20_000
RANDOM_STATE = 42


def main():
    start_time = time.time()

    print("=" * 65)
    print("AI SECURITY SYSTEM - RANDOM FOREST TRAINING")
    print("=" * 65)

    # 1. Load training and testing data
    print("\nLoading training data...")

    X_train = pd.read_csv(
        os.path.join(BASE_PATH, "X_train.csv")
    )
    y_train = pd.read_csv(
        os.path.join(BASE_PATH, "y_train.csv")
    )["Label"]

    print("Loading testing data...")

    X_test = pd.read_csv(
        os.path.join(BASE_PATH, "X_test.csv")
    )
    y_test = pd.read_csv(
        os.path.join(BASE_PATH, "y_test.csv")
    )["Label"]

    if len(X_train) != len(y_train):
        raise ValueError("Training features and labels do not match.")

    if len(X_test) != len(y_test):
        raise ValueError("Testing features and labels do not match.")

    if list(X_train.columns) != list(X_test.columns):
        raise ValueError("Training and testing features differ.")

    print(f"Training rows: {len(X_train):,}")
    print(f"Testing rows : {len(X_test):,}")
    print(f"Features     : {X_train.shape[1]}")

    # 2. Load numeric-label mapping
    with open(MAPPING_PATH, "r", encoding="utf-8") as file:
        label_mapping = json.load(file)

    id_to_label = {
        int(number): label
        for label, number in label_mapping.items()
    }

    # 3. Select a maximum of 20,000 training records per class
    print("\nPreparing training sample...")

    train_data = X_train.copy()
    train_data["__target__"] = y_train.to_numpy()

    sampled_parts = []

    for class_id, group in train_data.groupby("__target__"):
        if len(group) > MAX_PER_CLASS:
            group = resample(
                group,
                replace=False,
                n_samples=MAX_PER_CLASS,
                random_state=RANDOM_STATE,
            )

        sampled_parts.append(group)

    sampled_data = pd.concat(
        sampled_parts,
        ignore_index=True,
    )

    X_sample = sampled_data.drop(columns=["__target__"])
    y_sample = sampled_data["__target__"]

    print(f"Training sample: {len(X_sample):,} rows")
    print("\nSamples per class:")
    print(y_sample.value_counts().sort_index().to_string())

    # 4. Train Random Forest
    print("\nTraining Random Forest...")

    model = RandomForestClassifier(
        n_estimators=100,
        random_state=RANDOM_STATE,
        n_jobs=-1,
        class_weight="balanced_subsample",
    )

    model.fit(X_sample, y_sample)

    print("Training completed.")

    # 5. Evaluate on the untouched test set
    print("\nPredicting test records...")

    predictions = model.predict(X_test)

    accuracy = accuracy_score(y_test, predictions)

    class_ids = sorted(
        set(y_test.unique()) | set(predictions)
    )

    target_names = [
        id_to_label.get(class_id, str(class_id))
        for class_id in class_ids
    ]

    report = classification_report(
        y_test,
        predictions,
        labels=class_ids,
        target_names=target_names,
        zero_division=0,
    )

    matrix = confusion_matrix(
        y_test,
        predictions,
        labels=class_ids,
    )

    print("\n" + "=" * 65)
    print("MODEL EVALUATION")
    print("=" * 65)

    print(f"\nAccuracy: {accuracy:.4f} ({accuracy * 100:.2f}%)")
    print("\nClassification report:")
    print(report)

    print("Confusion matrix:")
    print(matrix)

    # 6. Save model and evaluation report
    os.makedirs(MODEL_DIR, exist_ok=True)

    joblib.dump(model, MODEL_PATH)

    with open(REPORT_PATH, "w", encoding="utf-8") as file:
        file.write(f"Accuracy: {accuracy:.4f}\n\n")
        file.write(report)
        file.write("\nConfusion matrix:\n")
        file.write(str(matrix))

    elapsed = time.time() - start_time

    print("\n" + "=" * 65)
    print("TRAINING PIPELINE COMPLETED")
    print("=" * 65)
    print(f"Model saved : {MODEL_PATH}")
    print(f"Report saved: {REPORT_PATH}")
    print(f"Elapsed time: {elapsed / 60:.2f} minutes")


if __name__ == "__main__":
    main()
