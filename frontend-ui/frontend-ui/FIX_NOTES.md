# Frontend fixes

1. `DatasetSummary.jsx` derives `Correct Predictions` from the confusion-matrix diagonal when the backend omits `correct_predictions`.
2. The summary includes a button to start the existing backend `POST /dataset-predictions/run` job and polls `GET /dataset-predictions/status`.
3. The dataset job result is explicitly labeled as offline test-dataset predictions, not live traffic detection.
4. Overview metric subtitles now clarify that attack/benign counts come from saved prediction history.

Important:
- A zero live attack count is correct when no attack prediction has been saved in the history table.
- This frontend does not create a packet-capture/live traffic sensor. Actual live detection requires a traffic ingestion source that sends real extracted features to the prediction API.
- The backend must be running and expose `/dataset-predictions/run` and `/dataset-predictions/status` as in the existing backend source.

## Attack-type breakdown update
After the offline dataset prediction job completes, the Dataset Evaluation panel now shows a per-class table with actual label counts, predicted label counts, and precision/recall/F1 when the backend returns those metrics. These are offline dataset results and are explicitly separated from live network history.
