# Repository audit — 21 October 2026

**Recovery update:** The original artifacts and .env were subsequently located under D:\College. Healthy PostgreSQL/model integration, real persistence, bounded replay, full 504,160-row evaluation and numeric circle rendering are now verified. See FINAL_REPORT.md; the missing-ZIP findings below describe the original source-only baseline.

## Scope and baseline
The supplied ZIP is the preserved baseline. It contains 116 files, 714,963 uncompressed bytes. No .git directory or virtual environment is included; git status therefore cannot establish prior branch history. Work is in the extracted existing project, with the original ZIP unchanged. The active frontend is frontend-ui/src. The nested frontend-ui/frontend-ui tree and backend main_backup.py are retained historical copies, not startup targets.

## Critical
- Missing random_forest.pkl, all CSV datasets, label_mapping.json, evaluation_report.json and .env. This was confirmed against every ZIP entry, not only the extracted tree. The ignore rules exclude those artifacts. Genuine inference, original database records, evaluation reproduction and production model compatibility are blocked.
- Original backend raised FileNotFoundError during module import when model files were missing. Fixed: degraded health, actionable setup details and 503 dependent endpoints.

## High priority
- History returned only LIMIT rows with no database total; UI filtered and paginated that subset. Fixed: snapshot-consistent matching counts, database-wide summary, bounded server pagination/search/sort/filter, updated UI. The prior 23 versus 11 discrepancy is not independently reproduced against the absent original database. A test with 23 total, 12 benign and 11 attacks verifies that counts cannot be confused with a loaded page.
- UI asserted hardcoded 99.7% performance, SHAP, sensor and mitigation states. Corrected active navigation and topology. Global model impurity importance is now implemented; SHAP is not claimed.
- Wildcard CORS with credentials and implicit alternate-server retries. Fixed: configured local origins, credentials disabled, no automatic retry of failed prediction mutations against another server.
- Metrics cards rounded animated decimal values to whole numbers. Fixed to preserve decimals during animation.

## Medium priority
- Strict numeric feature validation, source metadata, bounded replay, sanitized API errors, database statement timeout, startup warnings and shutdown handling added.
- Evaluation report now checks matrix dimensions, integer nonnegative counts, support, accuracy and macro F1; displayed per-class and aggregate metrics derive from the matrix.
- Preprocessing selects constant features on the full cleaned dataset before splitting; this uses test-distribution information. Exact-row deduplication occurs before identifier removal, so distinct raw rows may become duplicate feature vectors after cleaning. The random stratified split does not establish host/day-independent generalization. Do not alter the existing model schema or retrain automatically. Quantify cross-split overlap after restoring data.
- Original training samples at most 20,000 records per class from training only with random state 42, 100 trees and balanced_subsample. Existing code keeps test labels outside fitting. Dataset execution and rare-class results cannot be verified without data.

## Low priority
- Two existing React effect warnings remain. Production bundle exceeds 500 kB. These are recorded, not hidden.
- Duplicate archived frontend and backup Python files remain deliberately preserved. Unused static verifiedMetrics.js remains historical and is not imported by the active UI.

## Already working / preserved
React navigation, grouped 70-feature form, JSON input, history detail modal, offline batch evaluation routes, parameterized insertion, deterministic history ordering, per-class evaluation and confusion-matrix UI.

## Partially implemented
Real model inference, global explainability and replay have implementation and isolated tests; real artifacts and PostgreSQL integration are unavailable. No packet collector, CIC-compatible packet-to-flow extractor, or automatic traffic blocking exists.

## Missing / blocked
Original artifacts, original PostgreSQL configuration/data, actual model serialization verification, real dataset metrics, full browser success-path and real database integration tests. No public deployment or paid service was used. No models, datasets or records were deleted/replaced.
