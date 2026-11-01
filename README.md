# AI-Based Security Attack System

A cybersecurity research project combining **Random Forest network-flow classification**, a **FastAPI backend**, and a **React monitoring dashboard**.

## Architecture

```text
React dashboard (frontend-ui/src/)
        | JSON / HTTP
        v
FastAPI (backend/app/main.py)
      /   \
     v     v
ML model  PostgreSQL prediction history
```

## API

| Method | Endpoint | Function |
| --- | --- | --- |
| GET | `/` | Service information |
| GET | `/health` | Database and model readiness |
| POST | `/predict` | Classify a supplied feature vector |
| GET | `/history` | Retrieve stored prediction history |
| GET | `/evaluation` | Model evaluation results |
| POST | `/dataset-predictions/run` | Queue offline dataset predictions |
| GET | `/dataset-predictions/status` | Check task status |

FastAPI provides `/docs` automatically.

## Project layout
- `backend/app/main.py`: FastAPI routes, inference and PostgreSQL access
- `frontend-ui/`: React/Vite UI and API client
- `ml/preprocessing/`: dataset scripts
- `ml/training/`: model training and validation
- `ml/models/`: model artifact location (ignored in Git)
- `ml/data/processed/`: processed dataset location (ignored in Git)

## Setup
Before launching the backend, prepare a trained model at `ml/models/random_forest.pkl`, the expected processed feature files, Python dependencies, and PostgreSQL. The repository does not include a complete pinned Python requirements manifest or the model artifact. Create a local `.env` with `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`.

```bash
uvicorn backend.app.main:app --reload
```

In a separate terminal, start the frontend:

```bash
cd frontend-ui
npm install
npm run dev
```

Default API URL: `http://127.0.0.1:8000` (configurable through `VITE_API_BASE_URL`).

## Security and maturity
**Prototype, not production-grade network intrusion detection.** The current API does not implement user authentication, and CORS is permissive. The dashboard sends model feature vectors; real-time packet capture and production monitoring have not been verified. Model accuracy and dataset generalization should be reported only from reproducible tests. No source code was changed as part of this documentation update.
