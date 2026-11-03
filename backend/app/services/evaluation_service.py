"""Saved evaluation validation and confusion-derived metrics."""
import json
import numpy as np
from fastapi import HTTPException
from .. import config as cfg

def verify_evaluation(report):
    """Derive metrics from integer confusion counts; reject contradictory saved results."""
    names = report['class_names']
    raw = np.asarray(report['confusion_matrix'])
    if not names or len(set(names)) != len(names) or raw.shape != (len(names), len(names)):
        raise ValueError('Invalid confusion matrix or class names')
    matrix = raw.astype(float)
    if not np.isfinite(matrix).all() or (matrix < 0).any() or (not np.equal(matrix, np.floor(matrix)).all()):
        raise ValueError('Confusion counts must be finite nonnegative integers')
    total = int(matrix.sum())
    if total <= 0 or total != report['test_records']:
        raise ValueError('Confusion support does not match test records')
    correct = int(np.trace(matrix))
    accuracy = correct * 100 / total
    if abs(float(report['accuracy_percent']) - accuracy) > 0.0001:
        raise ValueError('Saved accuracy contradicts confusion matrix')
    per_class = {}
    for i, name in enumerate(names):
        tp = float(matrix[i, i])
        support = float(matrix[i].sum())
        predicted = float(matrix[:, i].sum())
        precision = tp / predicted if predicted else 0.0
        recall = tp / support if support else 0.0
        f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
        per_class[name] = {'precision': precision, 'recall': recall, 'f1-score': f1, 'support': int(support)}
    macro = {key: sum((row[key] for row in per_class.values())) / len(names) for key in ('precision', 'recall', 'f1-score')}
    weighted = {key: sum((row[key] * row['support'] for row in per_class.values())) / total for key in ('precision', 'recall', 'f1-score')}
    if abs(float(report['macro_f1']) - macro['f1-score']) > 0.0001:
        raise ValueError('Saved macro F1 contradicts confusion matrix')
    macro['support'] = weighted['support'] = total
    per_class.update({'accuracy': correct / total, 'macro avg': macro, 'weighted avg': weighted})
    return {**report, 'correct_predictions': correct, 'accuracy_percent': accuracy, 'macro_f1': macro['f1-score'], 'classification_report': per_class}

def get_evaluation():
    if not cfg.EVALUATION_REPORT_PATH.exists():
        raise HTTPException(status_code=404, detail='Saved evaluation report is missing. Restore the original report, or restore the model, label mapping and test data before running ml/training/validate_model.py.')
    try:
        with cfg.EVALUATION_REPORT_PATH.open('r', encoding='utf-8') as file:
            report = json.load(file)
        required = ['test_records', 'accuracy_percent', 'macro_f1', 'class_names', 'classification_report', 'confusion_matrix']
        missing = [field for field in required if field not in report]
        if missing:
            raise HTTPException(status_code=500, detail={'missing_fields': missing})
        report = verify_evaluation(report)
        return {'source': 'CIC-IDS2017', 'test_records': report['test_records'], 'correct_predictions': int(report.get('correct_predictions', sum((int(report['confusion_matrix'][i][i]) for i in range(len(report['confusion_matrix'])))))), 'accuracy_percent': report['accuracy_percent'], 'macro_f1': report['macro_f1'], 'class_count': len(report['class_names']), 'class_names': report['class_names'], 'classification_report': report['classification_report'], 'confusion_matrix': report['confusion_matrix']}
    except HTTPException:
        raise
    except (OSError, json.JSONDecodeError, KeyError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=500, detail='Unable to read the CIC-IDS2017 evaluation report.') from exc

def dataset_summary():
    report = get_evaluation()
    return {'source': report['source'], 'test_records': report['test_records'], 'classes': [{'label': name, 'support': report['classification_report'][name]['support']} for name in report['class_names']], 'note': 'Offline held-out evaluation support, distinct from saved prediction history.'}
