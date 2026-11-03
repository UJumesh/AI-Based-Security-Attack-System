# AI-Based Security Attack Detection System

Existing React/Vite + FastAPI + PostgreSQL + Random Forest college project, repaired in place. This is a local flow-classification demonstration. Predictions are estimated labels, not confirmed attacks, and the application does not block traffic.

## Working local configuration — recovered

The original artifacts and PostgreSQL configuration were found at `D:\College\3rd Year\5th sam\Desgine P\Desgine Project\AI-Based-Security-Attack-System`. The repaired backend reads them in place; no model/data/credential copies are required. The existing PostgreSQL database is connected and genuine predictions, history, global importance and full offline evaluation have been verified.

From this repaired project folder, run these in separate PowerShell terminals:

```powershell
.\start-backend.ps1
```

```powershell
.\start-frontend.ps1
```

Open http://127.0.0.1:5177. Backend: http://127.0.0.1:8017/docs. If the scripts are blocked by your PowerShell policy, use the equivalent commands below rather than weakening system policy:

```powershell
$env:SECURITY_ARTIFACT_ROOT='D:\College\3rd Year\5th sam\Desgine P\Desgine Project\AI-Based-Security-Attack-System'
$env:SECURITY_ENV_FILE=Join-Path $env:SECURITY_ARTIFACT_ROOT '.env'
$env:CORS_ORIGINS='http://127.0.0.1:5177'
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8017
```

Frontend terminal: `cd frontend-ui`, set `$env:VITE_API_BASE_URL='http://127.0.0.1:8017'`, then `npm run dev -- --host 127.0.0.1 --port 5177 --strictPort`.

`SECURITY_ARTIFACT_ROOT` selects the original project root, while `SECURITY_ENV_FILE` selects its local environment file. Defaults still support self-contained artifact restoration into the repaired project. Never commit or package the original .env. Read docs/FINAL_REPORT.md for current verified status.

## Portable setup / source archive limitations

**The supplied ZIP contains source only.** It has no trained model, CSV datasets, label mapping, evaluation report, .env or virtual environment. Startup remains possible in degraded mode; genuine predictions and evaluation need the original artifacts. Do not manufacture a model or reuse the old hardcoded UI scores.

## Restore the original artifacts

Copy the matching trusted artifacts into these project-relative locations:

- ml/models/random_forest.pkl
- ml/data/processed/label_mapping.json (label to numeric ID)
- ml/data/processed/evaluation_report.json
- ml/data/processed/split/X_test.csv and y_test.csv (Label column)
- ml/data/processed/split/X_train.csv if the model has no feature_names_in_

Preserve exact feature spelling/order and the original training library versions. Joblib model files can execute code: load only the original trusted model. requirements.txt records this machine's tested environment, not the unknown model's training environment. Prefer the original virtual environment if available. Restart the backend after restoring artifacts.

## Local setup on Windows PowerShell

From this project folder:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit the local .env with your PostgreSQL host, port, database, user and password. Never paste credentials into the UI or commit them. Use an existing database or create a dedicated local database and account through your PostgreSQL administrator. The backend creates prediction_history if absent and adds source if absent; it never drops tables or clears rows. The configured account needs corresponding schema permissions. No PostgreSQL database or role was created during this repair.

Start the backend in terminal 1 (8001 avoids the unrelated service found on port 8000):

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8001
```

Terminal 2, from the project folder:

```powershell
cd frontend-ui
npm ci --ignore-scripts
$env:VITE_API_BASE_URL='http://127.0.0.1:8001'
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Open http://127.0.0.1:5173. API docs are at http://127.0.0.1:8001/docs. Use one backend worker: replay and dataset jobs keep process-local state. If using another frontend port, include its exact origin in CORS_ORIGINS and restart the backend. Never put database secrets in VITE variables.

## Verification

```powershell
python -m unittest discover -s backend/tests -v
cd frontend-ui
npm test
npm run lint
npm run build
```

Tests use isolated model/database doubles and temporary local CSV fixtures. They do not clear or write your real database. A passing isolated test does not establish original artifact or PostgreSQL compatibility.

## Architecture and API

| Stage | What happens |
| --- | --- |
| Input | A sample flow from the form or a bounded offline test-flow replay is sent to the API. |
| Validation | FastAPI validates the flow before processing it. |
| Prediction | The original Random Forest classifies the validated flow. |
| Storage and history | Predictions are saved to PostgreSQL `prediction_history` and exposed through paginated history and total counters. |
| Evaluation | Verified offline metrics are calculated from the saved confusion matrix. |
| Explainability | Global impurity feature importance is provided by the model. |

See docs/SYSTEM.md for schema, endpoints, evaluation limits, demonstration and future scope; docs/AUDIT.md for prioritized findings; docs/FINAL_REPORT.md for actual verification and remaining blockers.

The topology circles show backend counts for saved inputs/classified flows/database rows, the loaded model's feature count, and benign/attack totals. These are not packet-capture counters. Unavailable data displays a dash; a connected empty database displays zero. Compact circle values have exact totals in the text below.

The active source is frontend-ui/src. frontend-ui/frontend-ui and backup scripts are preserved archival copies and should not be started.
