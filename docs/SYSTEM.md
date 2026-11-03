# System design and demonstration

## Problem and objectives
Classify precomputed network-flow features with an existing Random Forest, save predictions durably, explore history and inspect reproducible offline evaluation. Existing limitations were incomplete pagination, misleading status labels and absent deployment artifacts. The repaired design keeps the same frontend/backend stack and adds explicit readiness, source-aware offline replay, global explanation and isolated tests.

## Components
React pages: Overview, Prediction Lab, Event History, Attack Analytics, Model Performance, Explainable AI and Monitoring/System Status. FastAPI validates and orders numeric input, invokes the loaded model and commits the result to PostgreSQL before returning success. In-memory workers process only local CSV flows. Database errors return 503. History SQL uses bound values and allowlisted sort identifiers. A repeatable-read transaction keeps counts and each page consistent during concurrent inserts.

## Database schema
prediction_history: id SERIAL primary key; prediction TEXT; prediction_id INTEGER; is_benign BOOLEAN; confidence_percent DOUBLE PRECISION nullable; features_received INTEGER; created_at TIMESTAMPTZ default NOW(); source TEXT default legacy_unknown. New requests identify manual_sample or offline_flow. Existing records remain legacy_unknown because their origin cannot be recovered. No other table is required and no destructive migration is applied.

## API contracts

| Method | Route | Behavior |
|---|---|---|
| GET | /health | Reachability, model/mapping readiness, database/schema status and missing setup details; degraded is a 200 diagnostic response |
| GET | /model-info | Exact ordered features/classes, or 503 |
| POST | /predict | JSON features numeric object; optional source manual_sample/offline_flow; strict finite values and exact keys; 422 validation, 503 unavailable/persistence failure |
| GET | /history | page>=1, limit 1..100, search<=200 chars, status all/benign/attack, sort id/created_at/confidence_percent, direction asc/desc |
| GET | /evaluation | Saved report verified against confusion counts; 404 absent, 500 invalid |
| GET | /dataset-summary | Evaluation class support; distinct from prediction-history counts |
| GET | /explain | Actual model global feature_importances_, sorted; not local SHAP |
| POST | /dataset-predictions/run | Existing offline evaluation job, separate from saved live history; bounded to two million test rows |
| GET | /dataset-predictions/status | Job progress/result/error |
| GET | /monitoring/status | Offline replay readiness, last ingestion time, saved count and failure |
| POST | /monitoring/start | limit 1..100, interval_seconds .2..10; defaults 20/1; duplicate running worker rejected with 409 |
| POST | /monitoring/stop | Requests stop; an in-flight database insert may finish |

History returns count (loaded page), total (matching database count), total_pages, page, limit, history, and summary.total/benign/attacks across all saved records. Search covers ID, label and timestamp text stored by PostgreSQL; displayed times use the browser locale. Sort uses a deterministic ID tiebreaker. CSV export explicitly covers the loaded page, quotes every cell and neutralizes spreadsheet formulas.

## ML workflow and limitations
The supplied scripts clean CIC-IDS2017 flow CSVs, remove invalid rows/constant features, encode labels, split 80/20 with stratification and seed 42, cap training classes at 20,000 and fit 100 Random Forest trees. Do not rerun preprocessing against the primary artifacts during setup: it may alter feature names or mapping. Training now refuses to overwrite an existing primary model.

Evaluation derives accuracy from matrix trace/support; precision is TP/predicted-class support, recall is TP/actual-class support, F1 is their harmonic mean, macro is an unweighted mean and weighted F1 uses actual class support. Off-diagonal benign-to-attack counts are false alarms; attack-to-benign counts are missed attack-labelled examples. Rare-class support must be considered with per-class scores. High aggregate accuracy does not prove live detection, calibrated confidence, robustness or host/day generalization. Original metrics and the claimed 504,160 rows were not verified because datasets/report/model are absent.

Global mean decrease in impurity measures how training splits reduce impurity. It can favor high-cardinality features and distribute importance among correlated features; it is neither a local explanation nor evidence of causation. No additional SHAP dependency is required.

## Demonstration checklist
1. Restore artifacts and .env, start backend and frontend using README commands.
2. Inspect /health: require loaded model/mapping and database/schema availability.
3. Open Prediction Lab; explain that presets are illustrative and their names are not guaranteed labels. Feature-schema mismatch blocks submission.
4. Submit one labelled sample, inspect predicted class/confidence estimate/history ID.
5. Find the ID in Event History; compare database total to summary.total with identical connection and filters. Changing page size must not change global totals.
6. Inspect offline performance, per-class support and confusion matrix; discuss rare classes.
7. Inspect actual global importance, explaining its bias and scope.
8. Start bounded offline replay only when test data/model/database are restored. This creates up to 20 history rows with source offline_flow. Verify stop, last ingestion time and history rows. This is not genuine packet capture.
9. Demonstrate the topology counters: saved flows, model features, predictions, stored rows, benign and attack totals. The animation is decorative and there is no quarantine action.
10. Explain limitations honestly. Without restored artifacts, demonstrate degraded-state handling only.

## Security and future work
Local loopback use only; no authentication or rate limiter has been added. Restrict database privileges, retain configured CORS, never load untrusted pickles or expose this local demo publicly. npm audit reported zero findings on the current lockfile; this does not constitute a full security audit. Python dependency vulnerability scanning was not performed. Future work: authenticated deployment, indexed search at scale, chronological/host-separated evaluation, calibrated probabilities, background job persistence, source-aware collector adapter and verified CIC-compatible feature extraction. Packet capture, malicious traffic, public deployment and retraining were not performed.
