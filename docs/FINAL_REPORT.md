# Current final report — 21 October 2026

## Status
**The missing-data problem is resolved on this machine.** The original project was located under `D:\College\3rd Year\5th sam\Desgine P\Desgine Project\AI-Based-Security-Attack-System`. Its trusted model, CSVs, mapping, report and .env are read directly by the repaired backend. The ZIP itself still contains source only; the recovered artifacts remain in their original location. The previous missing-artifact report is preserved as INITIAL_REPORT.md for audit history.

The running frontend is http://127.0.0.1:5177 and backend is http://127.0.0.1:8017. /health now reports healthy, model loaded, mapping loaded and database connected, with 70 features, 15 classes and no missing artifacts. Existing model/data files and credentials were not copied into deliverables or replaced.

## Features completed
- Real model prediction and PostgreSQL persistence; a genuine test-dataset flow returned BENIGN, 98% model confidence and history ID 52.
- Accurate global totals, bounded server pagination, search, benign/attack filtering, deterministic sorting, history detail and loaded-page CSV export.
- Backend-derived numeric circle counters: saved flows, model features, classified flows, database records, benign predictions and attack predictions.
- Original evaluation report loaded and independently reproduced through the full offline dataset worker.
- Actual Random Forest global impurity importance endpoint, 70 features; model/form schema match verified.
- Bounded labelled offline replay, start/stop/status, source persistence and last ingestion time.
- Explicit readiness/errors, configured local CORS, safe parameterized SQL, timeouts, strict numeric validation and no alternate-server mutation retries.
- Startup scripts that select the recovered original artifacts/environment without exposing credentials; setup, architecture, API, audit and demonstration documentation.

## Database verification and changes
Before integration checks the original database had 51 records: 43 benign and 8 attack-classified. Startup applied the additive source column with legacy_unknown for existing rows; no records were removed or overwritten. Verification added three clearly labelled offline_flow records: IDs 52 and 53 BENIGN and ID 54 PortScan. The final checked SQL totals were **54 records, 45 benign, 9 attack-classified**. Direct SQL aggregates matched API summary values exactly, and the browser rendered those same circle values.

With 52 records, page 3 at limit 20 returned 12 rows and total_pages 3; the attack filter matched all 8 then-existing attack-classified records. Counts are live and will change when the user submits more predictions. The historical 23-versus-11 snapshot cannot be reconstructed, but limited returned rows are now explicitly separate from full database totals.

## ML and evaluation
No model was trained, overwritten or replaced. The recovered original Random Forest loaded successfully in the installed environment and accepts the exact 70-feature frontend schema. The entire **504,160-row** test set was classified again through the offline worker: **502,736 correct**, **1,424 incorrect**, **99.71755% accuracy**, **15 classes**. The saved report's unrounded accuracy is 99.71754998413202% and macro F1 is 0.830162342035204; confusion-derived macro F1 matched to floating-point precision. Per-class and weighted metrics are derived from the confusion matrix.

These are held-out dataset results, not proof of real-world capture effectiveness. The preprocessing/split leakage caveats in AUDIT.md remain relevant; cross-split duplicate rates and host/day independence have not been quantified. No retraining was performed. Confidence is an uncalibrated model estimate.

## Explainability and monitoring
/explain returns actual global mean decrease in impurity from the loaded model; it is not local SHAP or causation. Offline replay was genuinely executed with two existing test flows, completed with processed=2 and no error, and both records persisted as offline_flow. Full offline dataset evaluation did not write 504,160 rows into history. No packet collector, attack launch, quarantine, traffic blocking or real packet-to-CIC feature extractor is claimed.

## Tests and checks
| Check | Actual result |
|---|---|
| python -m unittest discover -s backend/tests -v | 41 passed, 0 failed, 0 skipped after artifact-root configuration changes |
| npm test | 13 passed, 0 failed, 0 skipped |
| npm run lint | Exit 0, 2 existing React effect warnings |
| npm run build | Passed, 2,516 modules; bundle-size warning (~744 kB JS) |
| python -m compileall -q backend/app ml | Passed |
| npm audit --json | Zero findings in the locked frontend dependencies |
| Backend startup on port 8017 | Passed, healthy model/mapping/database |
| Real /predict and SELECT history verification | Passed; actual ID 52 persisted |
| SQL totals versus /history summary | Exact match: 54 / 45 / 9 |
| Model form schema comparison | Exact ordered match, 70 features |
| Full test-dataset evaluation worker | Completed, 504,160 rows, reproduced saved accuracy |
| Bounded two-flow replay | Completed, two saved rows, correct source, no error |
| Browser checks | Healthy indicators, no missing-file banner, actual numeric circles and real history rows visible |

Machine-readable current evidence: recovered-integration-results.json. Initial degraded-mode HTTP checks remain in http-smoke.txt as historical tests, not current failures. Earlier failures (sandbox network restriction, missing archive artifacts, temporary directory/encoding issues) were resolved. PostgreSQL access required the approved local network permission; no database password was printed.

## Changed files and reasons
The earlier implementation changes are detailed in CHANGED_FILES.md and INITIAL_REPORT.md. This recovery additionally changed backend/app/main.py to support SECURITY_ARTIFACT_ROOT and SECURITY_ENV_FILE. Added start-backend.ps1 and start-frontend.ps1 provide reproducible startup using the existing original project. README and this report document the working configuration. No code or artifact in the original D: project was overwritten; the existing database received only the source column and three labelled verification records.

## Exact startup commands
From this repaired project folder, in two PowerShell terminals:

```powershell
.\start-backend.ps1
```

```powershell
.\start-frontend.ps1
```

The scripts default to the recovered original folder and ports 8017/5177. Use `-ArtifactRoot 'your original project folder'` with the backend script if moving the artifacts. README includes equivalent direct commands if script execution is restricted. Dependencies are already installed in this environment; on another machine install requirements.txt and run npm ci in frontend-ui, preserving model-compatible library versions.

## Remaining limits / next actions
The dashboard issue is resolved and the system supports the documented local demonstration. Keep both development processes running. Do not delete/move the original artifact folder without updating startup configuration. A standalone transfer to another machine still needs the original model/data and a locally configured PostgreSQL database. Credentials are intentionally excluded from the archive. No public deployment or paid service was used. Real packet capture, authenticated production hosting, job persistence across restarts and local SHAP remain future work. Run one backend worker for the process-local replay/dataset state. Existing React warnings, bundle size and cross-split leakage investigation remain documented limitations.
