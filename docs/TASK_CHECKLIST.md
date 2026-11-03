# Execution checklist

- [x] Inspect archive, source, manifests, frontend callers, preprocessing/training and baseline environment.
- [x] Preserve original ZIP and backup of original backend; no Git metadata supplied.
- [x] Repair startup/readiness and strict prediction contract.
- [x] Implement bounded database pagination/search/filter/sort/counts and update history UI.
- [x] Connect topology circle counts to backend totals and model schema.
- [x] Preserve original metrics/model; add confusion-derived metric consistency checks and training overwrite guard.
- [x] Replace explanation blueprint with model-derived global importance.
- [x] Implement bounded, labelled offline replay with start/stop/status and source persistence.
- [x] Restrict CORS, eliminate alternate-server mutation retry and sanitize API errors.
- [x] Add isolated backend/frontend tests, build/lint, browser degraded-state smoke checks and local HTTP checks.
- [x] Document architecture, setup, schema, API, ML caveats, demonstration and blockers.
- [x] Locate and read original model, mapping, dataset/report and .env through configurable artifact/environment roots.
- [x] Verify direct PostgreSQL counts against API/UI (54 total, 45 benign, 9 attack-classified); historical 23/11 snapshot is not reconstructable.
- [x] Run genuine inference, full 504,160-row evaluation, global importance and two-flow replay against original artifacts.
- [ ] Verify model serialization with its actual training environment and quantify data leakage/rare-class behavior.

Artifacts were recovered from the original local project. Remaining work is deeper leakage/generalization analysis, not a startup blocker.
