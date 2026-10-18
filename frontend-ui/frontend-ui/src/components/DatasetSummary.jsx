import { useEffect, useState } from 'react';
import {
    FileCheck2,
    CheckCircle2,
    Target,
    BarChart3,
    RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';

const metrics = [
    {
        key: 'test_records',
        title: 'Test Records',
        icon: FileCheck2,
        color: '#2878FF',
        format: (value) => Number(value).toLocaleString('en-IN'),
    },
    {
        key: 'correct_predictions',
        title: 'Correct Predictions',
        icon: CheckCircle2,
        color: '#10B981',
        format: (value) => Number(value).toLocaleString('en-IN'),
    },
    {
        key: 'accuracy_percent',
        title: 'Model Accuracy',
        icon: Target,
        color: '#06D6E0',
        format: (value) => `${Number(value).toFixed(2)}%`,
    },
    {
        key: 'macro_f1',
        title: 'Macro F1 Score',
        icon: BarChart3,
        color: '#A78BFA',
        format: (value) => {
            const score = Number(value);
            return `${(score <= 1 ? score * 100 : score).toFixed(2)}%`;
        },
    },
];

export function DatasetSummary() {
    const [evaluation, setEvaluation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [datasetJob, setDatasetJob] = useState(null);
    const [datasetJobBusy, setDatasetJobBusy] = useState(false);
    const [datasetJobError, setDatasetJobError] = useState('');

    // If the report omits correct_predictions, compute it from the confusion
    // matrix diagonal. This is an exact count for the evaluated test set.
    function getCorrectPredictions(data) {
        if (data?.correct_predictions != null && Number.isFinite(Number(data.correct_predictions))) {
            return Number(data.correct_predictions);
        }

        const matrix = data?.confusion_matrix;
        if (
            Array.isArray(matrix) &&
            matrix.length > 0 &&
            matrix.every((row) => Array.isArray(row) && row.length === matrix.length)
        ) {
            return matrix.reduce((sum, row, index) => sum + Number(row[index] || 0), 0);
        }

        return null;
    }

    async function startDatasetPredictions() {
        setDatasetJobError('');
        setDatasetJobBusy(true);
        try {
            const result = await api.startDatasetPredictions();
            setDatasetJob(result);
            if (result?.status && !['queued', 'running'].includes(result.status)) {
                setDatasetJobBusy(false);
            }
        } catch (err) {
            setDatasetJobError(err.message || 'Could not start dataset predictions.');
            setDatasetJobBusy(false);
        }
    }

    async function loadEvaluation() {
        setLoading(true);
        setError('');

        try {
            const data = await api.getEvaluation();

            if (
                !data ||
                data.test_records == null ||
                data.accuracy_percent == null
            ) {
                throw new Error('Evaluation metrics are missing from the API response.');
            }

            setEvaluation(data);
        } catch (err) {
            setError(
                err.message || 'Unable to load dataset evaluation from the backend.'
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadEvaluation();
    }, []);

    // Poll only while an offline dataset job is active; do not poll forever.
    useEffect(() => {
        if (!datasetJobBusy) return undefined;

        let cancelled = false;
        const poll = async () => {
            try {
                const status = await api.getDatasetPredictionStatus();
                if (cancelled) return;
                setDatasetJob(status);
                if (status?.status && !['queued', 'running'].includes(status.status)) {
                    setDatasetJobBusy(false);
                }
            } catch (err) {
                if (cancelled) return;
                setDatasetJobError(err.message || 'Could not read dataset job status.');
                setDatasetJobBusy(false);
            }
        };

        poll();
        const intervalId = window.setInterval(poll, 2000);
        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
        };
    }, [datasetJobBusy]);

    const correctPredictions = getCorrectPredictions(evaluation);
    const datasetResult = datasetJob?.result || null;
    const predictionCounts = datasetResult?.prediction_counts || {};
    const benignDatasetPredictions = Object.entries(predictionCounts).reduce(
        (sum, [label, count]) => sum + (label.trim().toUpperCase() === 'BENIGN' ? Number(count || 0) : 0),
        0
    );
    const totalDatasetPredictions = Object.values(predictionCounts).reduce(
        (sum, count) => sum + Number(count || 0),
        0
    );
    const attackDatasetPredictions = Math.max(0, totalDatasetPredictions - benignDatasetPredictions);

    const cardStyle = {
        background: 'rgba(5, 11, 24, 0.55)',
        border: '1px solid rgba(40, 120, 255, 0.15)',
        borderRadius: '10px',
        padding: '17px',
        minWidth: 0,
    };

    return (
        <section
            style={{
                background: '#0B1930',
                border: '1px solid rgba(40, 120, 255, 0.22)',
                borderRadius: '12px',
                padding: '22px',
                marginBottom: '24px',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '14px',
                    flexWrap: 'wrap',
                }}
            >
                <div>
                    <h2
                        style={{
                            color: '#F8FAFC',
                            fontSize: '16px',
                            fontWeight: 700,
                            margin: 0,
                        }}
                    >
                        CIC-IDS2017 Dataset Evaluation
                    </h2>

                    <p
                        style={{
                            color: '#94A3B8',
                            fontSize: '12px',
                            marginTop: '6px',
                            lineHeight: 1.5,
                        }}
                    >
                        Offline test-set results for the trained Random Forest model.
                        These metrics are separate from live prediction history.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={loadEvaluation}
                    disabled={loading}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '7px',
                        padding: '8px 12px',
                        borderRadius: '7px',
                        border: '1px solid rgba(6, 214, 224, 0.3)',
                        background: 'rgba(6, 214, 224, 0.08)',
                        color: '#06D6E0',
                        cursor: loading ? 'wait' : 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                        opacity: loading ? 0.65 : 1,
                    }}
                >
                    <RefreshCw size={14} />
                    Refresh Evaluation
                </button>
            </div>

            {loading ? (
                <p style={{ color: '#94A3B8', fontSize: '12px', marginTop: '20px' }}>
                    Loading evaluation metrics...
                </p>
            ) : error ? (
                <div
                    style={{
                        marginTop: '18px',
                        padding: '14px',
                        borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#FCA5A5',
                        fontSize: '12px',
                    }}
                >
                    <strong>Evaluation unavailable:</strong> {error}
                    <p style={{ marginBottom: 0 }}>
                        Confirm that the FastAPI backend is running and GET /evaluation
                        returns the saved evaluation report.
                    </p>
                </div>
            ) : (
                <>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                            gap: '14px',
                            marginTop: '20px',
                        }}
                    >
                        {metrics.map((metric) => {
                            const Icon = metric.icon;
                            const value = metric.key === 'correct_predictions' ? correctPredictions : evaluation?.[metric.key];

                            return (
                                <div key={metric.key} style={cardStyle}>
                                    <Icon size={21} color={metric.color} />

                                    <div
                                        style={{
                                            color: '#94A3B8',
                                            fontSize: '12px',
                                            marginTop: '12px',
                                        }}
                                    >
                                        {metric.title}
                                    </div>

                                    <div
                                        style={{
                                            color: metric.color,
                                            fontSize: '25px',
                                            fontWeight: 700,
                                            marginTop: '7px',
                                            overflowWrap: 'anywhere',
                                        }}
                                    >
                                        {value == null ? 'N/A' : metric.format(value)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div
                        style={{
                            marginTop: '18px',
                            padding: '14px',
                            borderRadius: '9px',
                            border: '1px solid rgba(6, 214, 224, 0.2)',
                            background: 'rgba(6, 214, 224, 0.045)',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <div>
                                <div style={{ color: '#F8FAFC', fontSize: '12px', fontWeight: 700 }}>
                                    Offline Test-Dataset Predictions
                                </div>
                                <div style={{ color: '#94A3B8', fontSize: '11px', marginTop: '4px', lineHeight: 1.5 }}>
                                    Runs the backend model against the held-out test dataset. Results are not live network detections and do not alter saved live history.
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={startDatasetPredictions}
                                disabled={datasetJobBusy}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '7px',
                                    border: '1px solid rgba(6, 214, 224, 0.35)',
                                    background: 'rgba(6, 214, 224, 0.1)',
                                    color: '#06D6E0',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: datasetJobBusy ? 'wait' : 'pointer',
                                    opacity: datasetJobBusy ? 0.65 : 1,
                                }}
                            >
                                {datasetJobBusy ? 'Running Dataset Predictions…' : 'Run Dataset Predictions'}
                            </button>
                        </div>

                        {datasetJobError && (
                            <div style={{ color: '#FCA5A5', fontSize: '11px', marginTop: '10px' }}>
                                {datasetJobError}
                            </div>
                        )}

                        {datasetJobBusy && (
                            <div style={{ color: '#94A3B8', fontSize: '11px', marginTop: '10px' }}>
                                Status: {datasetJob?.status || 'queued'}
                                {datasetJob?.processed_records != null && datasetJob?.total_records != null
                                    ? ` · ${Number(datasetJob.processed_records).toLocaleString('en-IN')} / ${Number(datasetJob.total_records).toLocaleString('en-IN')} records`
                                    : ''}
                                {datasetJob?.progress_percent != null
                                    ? ` · ${Number(datasetJob.progress_percent).toFixed(1)}%`
                                    : ''}
                            </div>
                        )}

                        {datasetJob?.status === 'failed' && datasetJob?.error && (
                            <div style={{ color: '#FCA5A5', fontSize: '11px', marginTop: '10px' }}>
                                Dataset job failed: {datasetJob.error}
                            </div>
                        )}

                        {datasetResult && datasetJob?.status === 'completed' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginTop: '14px' }}>
                                {[
                                    ['Records Predicted', datasetResult.test_records],
                                    ['Correct Predictions', datasetResult.correct_predictions],
                                    ['Predicted Attacks', attackDatasetPredictions],
                                    ['Predicted Benign', benignDatasetPredictions],
                                    ['Dataset Accuracy', datasetResult.accuracy_percent == null ? null : `${Number(datasetResult.accuracy_percent).toFixed(2)}%`],
                                ].map(([label, value]) => (
                                    <div key={label} style={{ padding: '10px', borderRadius: '7px', background: 'rgba(5, 11, 24, 0.55)' }}>
                                        <div style={{ color: '#94A3B8', fontSize: '10px' }}>{label}</div>
                                        <div style={{ color: '#F8FAFC', fontSize: '16px', fontWeight: 700, marginTop: '5px' }}>
                                            {value == null ? 'N/A' : typeof value === 'number' ? Number(value).toLocaleString('en-IN') : value}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {datasetResult && datasetJob?.status === 'completed' && (
                            <div style={{ marginTop: '18px' }}>
                                <div style={{ color: '#F8FAFC', fontSize: '13px', fontWeight: 700, marginBottom: '5px' }}>
                                    Attack-Type Breakdown — Offline Dataset
                                </div>
                                <div style={{ color: '#94A3B8', fontSize: '11px', lineHeight: 1.5, marginBottom: '10px' }}>
                                    Actual labels and model predictions are shown separately. Counts here are dataset results, not live traffic detections.
                                </div>
                                {(() => {
                                    const actualCounts = datasetResult.actual_label_counts || {};
                                    const predictedCounts = datasetResult.prediction_counts || {};
                                    const report = datasetResult.classification_report || {};
                                    const names = [...new Set([
                                        ...Object.keys(actualCounts),
                                        ...Object.keys(predictedCounts),
                                    ])].sort((a, b) => {
                                        if (a.toUpperCase() === 'BENIGN') return -1;
                                        if (b.toUpperCase() === 'BENIGN') return 1;
                                        return a.localeCompare(b);
                                    });
                                    if (!names.length) {
                                        return <div style={{ color: '#FCA5A5', fontSize: '11px' }}>
                                            Dataset job completed, but the backend did not return actual_label_counts or prediction_counts. Check the backend response.
                                        </div>;
                                    }
                                    return (
                                        <div style={{ overflowX: 'auto', border: '1px solid rgba(40, 120, 255, 0.18)', borderRadius: '8px' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '620px', fontSize: '11px' }}>
                                                <thead>
                                                    <tr style={{ background: 'rgba(5, 11, 24, 0.65)', color: '#94A3B8', textAlign: 'left' }}>
                                                        {['Attack Type / Class', 'Actual Records', 'Predicted Records', 'Precision', 'Recall', 'F1 Score'].map((heading) => (
                                                            <th key={heading} style={{ padding: '10px', borderBottom: '1px solid rgba(40, 120, 255, 0.18)', fontWeight: 600 }}>{heading}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {names.map((name) => {
                                                        const metricsForClass = report[name] || report[name.trim()] || {};
                                                        const actual = Number(actualCounts[name] || 0);
                                                        const predicted = Number(predictedCounts[name] || 0);
                                                        const benignClass = name.trim().toUpperCase() === 'BENIGN';
                                                        return (
                                                            <tr key={name}>
                                                                <td style={{ padding: '10px', color: benignClass ? '#10B981' : '#FCA5A5', borderBottom: '1px solid rgba(40, 120, 255, 0.10)', fontWeight: 600 }}>{name}</td>
                                                                <td style={{ padding: '10px', color: '#E2E8F0', borderBottom: '1px solid rgba(40, 120, 255, 0.10)' }}>{actual.toLocaleString('en-IN')}</td>
                                                                <td style={{ padding: '10px', color: '#E2E8F0', borderBottom: '1px solid rgba(40, 120, 255, 0.10)' }}>{predicted.toLocaleString('en-IN')}</td>
                                                                <td style={{ padding: '10px', color: '#CBD5E1', borderBottom: '1px solid rgba(40, 120, 255, 0.10)' }}>{Number.isFinite(Number(metricsForClass.precision)) ? `${(Number(metricsForClass.precision) * 100).toFixed(1)}%` : '—'}</td>
                                                                <td style={{ padding: '10px', color: '#CBD5E1', borderBottom: '1px solid rgba(40, 120, 255, 0.10)' }}>{Number.isFinite(Number(metricsForClass.recall)) ? `${(Number(metricsForClass.recall) * 100).toFixed(1)}%` : '—'}</td>
                                                                <td style={{ padding: '10px', color: '#CBD5E1', borderBottom: '1px solid rgba(40, 120, 255, 0.10)' }}>{Number.isFinite(Number(metricsForClass['f1-score'])) ? `${(Number(metricsForClass['f1-score']) * 100).toFixed(1)}%` : '—'}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>

                    <div
                        style={{
                            marginTop: '16px',
                            paddingTop: '13px',
                            borderTop: '1px solid rgba(40, 120, 255, 0.12)',
                            color: '#94A3B8',
                            fontSize: '11px',
                        }}
                    >
                        Number of classes:{' '}
                        {evaluation?.class_count ??
                            evaluation?.class_names?.length ??
                            'N/A'}
                        {' · '}
                        Source: {evaluation?.source || 'Saved evaluation report'}
                    </div>
                </>
            )}
        </section>
    );
}
