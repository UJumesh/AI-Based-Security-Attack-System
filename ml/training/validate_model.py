
import json
import joblib
import pandas as pd

MODEL_PATH = "ml/models/random_forest.pkl"
MAPPING_PATH = "ml/data/processed/label_mapping.json"
TEST_X_PATH = "ml/data/processed/split/X_test.csv"
TEST_Y_PATH = "ml/data/processed/split/y_test.csv"


def main():
    print("Loading trained model...")

    model = joblib.load(MODEL_PATH)

    with open(MAPPING_PATH, "r", encoding="utf-8") as file:
        label_mapping = json.load(file)

    id_to_label = {
        int(class_id): label
        for label, class_id in label_mapping.items()
    }

    print("Model loaded successfully!")
    print("Expected features:", model.n_features_in_)

    print("\nLoading 10 test records...")
    X_test = pd.read_csv(TEST_X_PATH, nrows=10)
    y_test = pd.read_csv(TEST_Y_PATH, nrows=10)["Label"]

    if X_test.shape[1] != model.n_features_in_:
        raise ValueError("Feature count does not match the model.")

    predictions = model.predict(X_test)

    print("\nPREDICTION VALIDATION")
    print("-" * 65)

    correct = 0

    for i, (actual_id, predicted_id) in enumerate(
        zip(y_test, predictions), start=1
    ):
        actual = id_to_label.get(int(actual_id), str(actual_id))
        predicted = id_to_label.get(int(predicted_id), str(predicted_id))

        result = "CORRECT" if actual_id == predicted_id else "MISMATCH"

        if actual_id == predicted_id:
            correct += 1

        print(f"{i}. Actual: {actual}")
        print(f"   Predicted: {predicted}")
        print(f"   Result: {result}")

    print("-" * 65)
    print(f"Correct predictions: {correct}/10")
    print("Validation test completed.")


if __name__ == "__main__":
    main()
