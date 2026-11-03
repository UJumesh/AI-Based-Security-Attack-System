"""Isolated contracts: deterministic test doubles never loaded by production."""
import asyncio
import importlib.util
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch, MagicMock
import httpx
import numpy as np
from backend.app import main as api, config as cfg
from backend.app.database import connection as db
from backend.app.models import schemas
from backend.app.services import model_service as ml, prediction_service as prediction
from backend.app.services import evaluation_service as evaluation, monitoring_service as monitoring

class ContractTests(unittest.TestCase):

    def setUp(self):
        self.model = MagicMock()
        self.model.predict.return_value = np.array([1])
        self.model.predict_proba.return_value = np.array([[0.2, 0.8]])
        self.model.classes_ = np.array([0, 1])
        self.model.feature_importances_ = np.array([0.25, 0.75])
        self.patches = [patch.object(ml, 'model', self.model), patch.object(ml, 'FEATURE_NAMES', ['a', 'b']), patch.object(ml, 'EXPECTED_FEATURE_COUNT', 2), patch.object(ml, 'ID_TO_LABEL', {0: 'BENIGN', 1: 'DDoS'})]
        for p in self.patches:
            p.start()
        self.db = MagicMock()
        self.cur = self.db.__enter__.return_value.cursor.return_value.__enter__.return_value
        self.cur.fetchone.return_value = (42, datetime(2026, 1, 1, tzinfo=timezone.utc))
        self.dbpatch = patch.object(db, 'get_db_connection', return_value=self.db)
        self.dbpatch.start()

    def tearDown(self):
        self.dbpatch.stop()
        for p in reversed(self.patches):
            p.stop()

    def request(self, method, path, **kwargs):

        async def run():
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=api.app), base_url='http://test') as client:
                return await client.request(method, path, **kwargs)
        return asyncio.run(run())

    def prediction(self, features=None, **extra):
        return self.request('POST', '/predict', json={'features': features if features is not None else {'b': 2, 'a': 1}, **extra})

    def test_home(self):
        self.assertEqual(self.request('GET', '/').status_code, 200)

    def test_health_healthy(self):
        self.cur.fetchone.return_value = (1,)
        self.assertEqual(self.request('GET', '/health').json()['status'], 'healthy')

    def test_health_database_down(self):
        with patch.object(db, 'get_db_connection', side_effect=RuntimeError()):
            self.assertEqual(self.request('GET', '/health').json()['status'], 'degraded')

    def test_health_model_down(self):
        with patch.object(ml, 'model', None):
            self.assertFalse(self.request('GET', '/health').json()['model_loaded'])

    def test_prediction_saved(self):
        r = self.prediction()
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()['history_id'], 42)
        self.assertEqual(r.json()['confidence_percent'], 80)

    def test_prediction_order(self):
        self.prediction()
        self.assertEqual(self.model.predict.call_args.args[0].columns.tolist(), ['a', 'b'])
        self.assertEqual(self.model.predict.call_args.args[0].iloc[0].tolist(), [1, 2])

    def test_prediction_missing(self):
        self.assertEqual(self.prediction({'a': 1}).status_code, 422)

    def test_prediction_extra(self):
        self.assertEqual(self.prediction({'a': 1, 'b': 2, 'c': 3}).status_code, 422)

    def test_prediction_string(self):
        self.assertEqual(self.prediction({'a': '1', 'b': 2}).status_code, 422)

    def test_prediction_boolean(self):
        self.assertEqual(self.prediction({'a': True, 'b': 2}).status_code, 422)

    def test_prediction_null(self):
        self.assertEqual(self.prediction({'a': None, 'b': 2}).status_code, 422)

    def test_prediction_nonfinite(self):
        from fastapi import HTTPException
        with self.assertRaises(HTTPException) as e:
            prediction.predict(schemas.PredictionRequest(features={'a': float('inf'), 'b': 2}))
        self.assertEqual(e.exception.status_code, 422)

    def test_prediction_extra_body(self):
        self.assertEqual(self.prediction(other=1).status_code, 422)

    def test_prediction_unknown_source(self):
        self.assertEqual(self.prediction(source='live_capture').status_code, 422)

    def test_prediction_database_down(self):
        with patch.object(db, 'get_db_connection', side_effect=RuntimeError()):
            self.assertEqual(self.prediction().status_code, 503)

    def test_prediction_model_down(self):
        with patch.object(ml, 'model', None):
            self.assertEqual(self.prediction().status_code, 503)

    def test_prediction_unknown_class(self):
        self.model.predict.return_value = np.array([999])
        self.assertEqual(self.prediction().status_code, 500)

    def test_history_page_and_counts(self):
        self.cur.fetchone.side_effect = [(23, 12, 11), (23,)]
        self.cur.fetchall.return_value = [(22, 'BENIGN', 0, True, None, 2, datetime.now(timezone.utc), 'offline_flow')]
        r = self.request('GET', '/history?page=2&limit=10')
        data = r.json()
        self.assertEqual(r.status_code, 200)
        self.assertEqual(data['total'], 23)
        self.assertEqual(data['total_pages'], 3)
        self.assertEqual(data['summary']['attacks'], 11)
        self.assertEqual(data['history'][0]['source'], 'offline_flow')
        self.assertEqual(self.cur.execute.call_args.args[1], (10, 10))

    def test_history_search_parameterized(self):
        self.cur.fetchone.side_effect = [(23, 12, 11), (0,)]
        self.cur.fetchall.return_value = []
        self.assertEqual(self.request('GET', '/history?search=%27%3Bdrop&status=attack').status_code, 200)
        sql, params = self.cur.execute.call_args.args
        self.assertNotIn('drop', sql)
        self.assertIn('drop', params[0])
        self.assertIn(False, params)

    def test_history_bad_limit(self):
        self.assertEqual(self.request('GET', '/history?limit=101').status_code, 422)

    def test_history_bad_page(self):
        self.assertEqual(self.request('GET', '/history?page=0').status_code, 422)

    def test_history_bad_sort(self):
        self.assertEqual(self.request('GET', '/history?sort=DROP').status_code, 422)

    def test_history_bad_filter(self):
        self.assertEqual(self.request('GET', '/history?status=invalid').status_code, 422)

    def test_history_database_down(self):
        with patch.object(db, 'get_db_connection', side_effect=RuntimeError()):
            self.assertEqual(self.request('GET', '/history').status_code, 503)

    def test_model_info(self):
        self.assertEqual(self.request('GET', '/model-info').json()['features'], ['a', 'b'])

    def test_explanation(self):
        data = self.request('GET', '/explain').json()
        self.assertEqual(data['scope'], 'global')
        self.assertEqual(data['features'][0]['feature'], 'b')

    def test_explanation_model_down(self):
        with patch.object(ml, 'model', None):
            self.assertEqual(self.request('GET', '/explain').status_code, 503)

    def test_evaluation_missing(self):
        with patch.object(cfg, 'EVALUATION_REPORT_PATH', Path('absent-report.json')):
            self.assertEqual(self.request('GET', '/evaluation').status_code, 404)

    def test_monitoring_honest(self):
        self.assertFalse(self.request('GET', '/monitoring/status').json()['capture_available'])

    def test_replay_missing(self):
        with patch.object(cfg, 'X_TEST_PATH', Path('absent-flows.csv')):
            self.assertEqual(self.request('POST', '/monitoring/start', json={}).status_code, 503)

    def test_replay_limit(self):
        self.assertEqual(self.request('POST', '/monitoring/start', json={'limit': 101}).status_code, 422)

    def test_replay_stop(self):
        self.assertEqual(self.request('POST', '/monitoring/stop').status_code, 200)

class EvaluationTests(unittest.TestCase):

    def report(self):
        return {'class_names': ['BENIGN', 'DDoS'], 'confusion_matrix': [[8, 2], [1, 9]], 'test_records': 20, 'accuracy_percent': 85, 'macro_f1': (16 / 19 + 18 / 21) / 2}

    def test_accuracy_and_support(self):
        r = evaluation.verify_evaluation(self.report())
        self.assertEqual(r['correct_predictions'], 17)
        self.assertEqual(r['classification_report']['DDoS']['support'], 10)

    def test_per_class_precision(self):
        self.assertAlmostEqual(evaluation.verify_evaluation(self.report())['classification_report']['DDoS']['precision'], 9 / 11)

    def test_wrong_accuracy(self):
        r = self.report()
        r['accuracy_percent'] = 99
        with self.assertRaises(ValueError):
            evaluation.verify_evaluation(r)

    def test_wrong_support(self):
        r = self.report()
        r['test_records'] = 21
        with self.assertRaises(ValueError):
            evaluation.verify_evaluation(r)

    def test_negative_counts(self):
        r = self.report()
        r['confusion_matrix'][0][0] = -1
        with self.assertRaises(ValueError):
            evaluation.verify_evaluation(r)

    def test_wrong_macro(self):
        r = self.report()
        r['macro_f1'] = 1
        with self.assertRaises(ValueError):
            evaluation.verify_evaluation(r)

    def test_duplicate_classes(self):
        r = self.report()
        r['class_names'] = ['BENIGN', 'BENIGN']
        with self.assertRaises(ValueError):
            evaluation.verify_evaluation(r)

class ReplayTests(unittest.TestCase):

    def test_replay_real_rows_and_source(self):
        import tempfile
        with tempfile.TemporaryDirectory(dir=Path(__file__).parent) as directory:
            path = Path(directory) / 'flows.csv'
            path.write_text('a,b\n1,2\n3,4\n')
            monitoring.replay_stop.clear()
            monitoring.replay_state.update(status='running', processed=0)
            with patch.object(cfg, 'X_TEST_PATH', path), patch.object(ml, 'FEATURE_NAMES', ['a', 'b']), patch.object(prediction, 'predict') as predict:
                monitoring.replay_worker(schemas.ReplayRequest(limit=1, interval_seconds=0.2))
                self.assertEqual(predict.call_count, 1)
                self.assertEqual(predict.call_args.args[0].features, {'a': 1, 'b': 2})
                self.assertEqual(predict.call_args.args[0].source, 'offline_flow')
            self.assertEqual(monitoring.replay_state['status'], 'completed')

    def test_replay_stopped_before_prediction(self):
        import tempfile
        with tempfile.TemporaryDirectory(dir=Path(__file__).parent) as directory:
            path = Path(directory) / 'flows.csv'
            path.write_text('a,b\n1,2\n')
            monitoring.replay_stop.set()
            with patch.object(cfg, 'X_TEST_PATH', path), patch.object(ml, 'FEATURE_NAMES', ['a', 'b']), patch.object(prediction, 'predict') as predict:
                monitoring.replay_worker(schemas.ReplayRequest())
                predict.assert_not_called()
            self.assertEqual(monitoring.replay_state['status'], 'stopped')
            monitoring.replay_stop.clear()
if __name__ == '__main__':
    unittest.main()
