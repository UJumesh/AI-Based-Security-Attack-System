
import { useEffect, useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  FileText,
  Table2,
  Grid,
  TrendingUp,
  Percent,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

import { StatCard } from '../components/StatCard';
import { api } from '../services/api';

const panelStyle = {
  background: '#0B1930',
  border: '1px solid rgba(40, 120, 255, 0.18)',
  borderRadius: '12px',
};

const headingStyle = {
  fontSize: '15px',
  fontWeight: 600,
  color: '#F8FAFC',
  margin: 0,
};

const mutedStyle = {
  fontSize: '11px',
  color: '#94A3B8',
};

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-US');
}

function formatScore(value) {
  return Number.isFinite(Number(value))
    ? Number(value).toFixed(4)
    : '—';
}

function scoreColor(value) {
  if (value >= 0.9) return '#10B981';
  if (value >= 0.5) return '#F59E0B';
  return '#EF4444';
}

function getCategory(name) {
  const label = String(name).toLowerCase();

  if (label === 'benign') return 'Normal Traffic';
  if (label.includes('ddos')) return 'DDoS';
  if (label.includes('dos')) return 'DoS';
  if (label.includes('portscan') || label.includes('port scan')) {
    return 'Port Scanning';
  }
  if (label.includes('bot')) return 'Bot Activity';
  if (label.includes('brute')) return 'Brute Force';
  if (label.includes('web')) return 'Web Attack';
  if (label.includes('infiltration')) return 'Infiltration';
  if (label.includes('heartbleed')) return 'Heartbleed';
  if (label.includes('ftp')) return 'FTP Attack';
  if (label.includes('ssh')) return 'SSH Attack';

  return 'Network Attack';
}

function MetricTable({ rows, macro, weighted }) {
  const allRows = [
    ...rows,
    {
      name: 'Macro Average',
      category: 'Unweighted',
      precision: macro.precision,
      recall: macro.recall,
      f1Score: macro.f1Score,
      support: macro.support,
      summary: true,
    },
    {
      name: 'Weighted Average',
      category: 'Support-weighted',
      precision: weighted.precision,
      recall: weighted.recall,
      f1Score: weighted.f1Score,
      support: weighted.support,
      weighted: true,
    },
  ];

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          minWidth: '680px',
          borderCollapse: 'collapse',
          textAlign: 'left',
        }}
      >
        <thead>
          <tr
            style={{
              background: 'rgba(5, 11, 24, 0.5)',
              borderBottom: '1px solid rgba(40, 120, 255, 0.12)',
            }}
          >
            {[
              'CLASS LABEL',
              'CATEGORY',
              'PRECISION',
              'RECALL',
              'F1-SCORE',
              'SUPPORT',
            ].map((heading) => (
              <th
                key={heading}
                style={{
                  padding: '12px 16px',
                  fontSize: '10px',
                  color: '#94A3B8',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  textAlign: heading === 'SUPPORT' ? 'right' : 'left',
                }}
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {allRows.map((row) => {
            const color = row.summary
              ? '#06D6E0'
              : row.weighted
                ? '#10B981'
                : row.name === 'BENIGN'
                  ? '#10B981'
                  : '#F8FAFC';

            return (
              <tr
                key={row.name}
                style={{
                  borderBottom: '1px solid rgba(40, 120, 255, 0.08)',
                  background: row.summary
                    ? 'rgba(40, 120, 255, 0.06)'
                    : row.weighted
                      ? 'rgba(16, 185, 129, 0.06)'
                      : 'transparent',
                }}
              >
                <td
                  style={{
                    padding: '12px 16px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row.name}
                </td>

                <td
                  style={{
                    padding: '12px 16px',
                    fontSize: '11px',
                    color: '#94A3B8',
                  }}
                >
                  {row.category}
                </td>

                {[
                  ['precision', row.precision],
                  ['recall', row.recall],
                  ['f1Score', row.f1Score],
                ].map(([key, value]) => (
                  <td
                    key={key}
                    style={{
                      padding: '12px 16px',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: row.summary || row.weighted ? 700 : 400,
                      color: row.summary || row.weighted
                        ? color
                        : scoreColor(value),
                    }}
                  >
                    {formatScore(value)}
                  </td>
                ))}

                <td
                  style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    color: '#CBD5E1',
                  }}
                >
                  {formatNumber(row.support)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ConfusionMatrix({
  matrix,
  labels,
  selectedCell,
  setSelectedCell,
}) {
  if (!matrix.length || !labels.length) {
    return (
      <p style={{ color: '#94A3B8', padding: '20px' }}>
        Confusion matrix data is not available.
      </p>
    );
  }

  return (
    <div style={{ padding: '20px', overflowX: 'auto' }}>
      <p style={{ ...mutedStyle, marginBottom: '14px' }}>
        Rows: Actual labels | Columns: Predicted labels
      </p>

      {selectedCell && (
        <p style={{ color: '#06D6E0', fontSize: '12px' }}>
          Actual [{selectedCell.actual}] → Predicted [
          {selectedCell.predicted}]:{' '}
          <strong>{formatNumber(selectedCell.value)} records</strong>
        </p>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `130px repeat(${labels.length}, minmax(55px, 1fr))`,
          gap: '2px',
          minWidth: `${180 + labels.length * 57}px`,
          background: 'rgba(5, 11, 24, 0.8)',
          padding: '10px',
          borderRadius: '8px',
          border: '1px solid rgba(40, 120, 255, 0.15)',
        }}
      >
        <div style={{ ...mutedStyle, padding: '6px' }}>
          Actual / Predicted
        </div>

        {labels.map((label) => (
          <div
            key={`header-${label}`}
            title={label}
            style={{
              height: '90px',
              padding: '4px',
              fontSize: '9px',
              fontFamily: 'var(--font-mono)',
              color: '#94A3B8',
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              textAlign: 'left',
              overflow: 'hidden',
            }}
          >
            {label}
          </div>
        ))}

        {matrix.map((row, rowIndex) => (
          <div
            key={`matrix-row-${rowIndex}`}
            style={{ display: 'contents' }}
          >
            <div
              title={labels[rowIndex]}
              style={{
                fontSize: '10px',
                color: '#CBD5E1',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
              }}
            >
              {labels[rowIndex]}
            </div>

            {row.map((value, colIndex) => {
              const diagonal = rowIndex === colIndex;
              const hasError = !diagonal && value > 0;

              return (
                <button
                  type="button"
                  key={`cell-${rowIndex}-${colIndex}`}
                  onMouseEnter={() =>
                    setSelectedCell({
                      actual: labels[rowIndex],
                      predicted: labels[colIndex],
                      value,
                    })
                  }
                  onFocus={() =>
                    setSelectedCell({
                      actual: labels[rowIndex],
                      predicted: labels[colIndex],
                      value,
                    })
                  }
                  onClick={() =>
                    setSelectedCell({
                      actual: labels[rowIndex],
                      predicted: labels[colIndex],
                      value,
                    })
                  }
                  title={`Actual: ${labels[rowIndex]}\nPredicted: ${labels[colIndex]}\nCount: ${value}`}
                  style={{
                    minWidth: 0,
                    padding: '6px 2px',
                    textAlign: 'center',
                    fontSize: '9px',
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                    borderRadius: '2px',
                    border: diagonal
                      ? '1px solid rgba(16, 185, 129, 0.4)'
                      : '1px solid rgba(40, 120, 255, 0.05)',
                    background: diagonal
                      ? 'rgba(16, 185, 129, 0.25)'
                      : hasError
                        ? 'rgba(239, 68, 68, 0.2)'
                        : 'rgba(255, 255, 255, 0.02)',
                    color: diagonal
                      ? '#10B981'
                      : hasError
                        ? '#EF4444'
                        : '#64748B',
                  }}
                >
                  {value > 0
                    ? value >= 10000
                      ? `${(value / 1000).toFixed(0)}k`
                      : formatNumber(value)
                    : '0'}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ ...mutedStyle, marginTop: '12px' }}>
        Green diagonal cells represent correct classifications.
        Red off-diagonal cells represent misclassifications.
      </div>
    </div>
  );
}

export function ModelPerformance() {
  const [activeView, setActiveView] = useState('table');
  const [selectedCell, setSelectedCell] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadEvaluation() {
      setLoading(true);
      setError('');

      try {
        const result = await api.getEvaluation();

        if (!result || !result.classification_report) {
          throw new Error(
            'The evaluation API response is missing classification_report.'
          );
        }

        if (!cancelled) {
          setEvaluation(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message ||
              'Unable to load evaluation metrics from the backend.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadEvaluation();

    return () => {
      cancelled = true;
    };
  }, []);

  const report = evaluation?.classification_report || {};

  const metrics = useMemo(() => {
    if (!evaluation) return null;

    const labels = Array.isArray(evaluation.class_names)
      ? evaluation.class_names
      : Object.keys(report).filter(
          (key) =>
            !['accuracy', 'macro avg', 'weighted avg', 'micro avg'].includes(
              key
            )
        );

    const rows = labels.map((name) => {
      const item = report[name] || {};

      return {
        name,
        category: getCategory(name),
        precision: Number(item.precision || 0),
        recall: Number(item.recall || 0),
        f1Score: Number(item['f1-score'] || 0),
        support: Number(item.support || 0),
      };
    });

    const macro = report['macro avg'] || {};
    const weighted = report['weighted avg'] || {};

    const accuracyPercent = Number(evaluation.accuracy_percent || 0);
    const testRecords = Number(evaluation.test_records || 0);

    return {
      labels,
      rows,
      confusionMatrix: Array.isArray(evaluation.confusion_matrix)
        ? evaluation.confusion_matrix
        : [],
      accuracyPercent,
      testRecords,
      correctPredictions: Number.isFinite(
        Number(evaluation.correct_predictions)
      )
        ? Number(evaluation.correct_predictions)
        : Math.round((testRecords * accuracyPercent) / 100),
      macro: {
        precision: Number(macro.precision || 0),
        recall: Number(macro.recall || 0),
        f1Score: Number(macro['f1-score'] || evaluation.macro_f1 || 0),
        support: Number(macro.support || testRecords),
      },
      weighted: {
        precision: Number(weighted.precision || 0),
        recall: Number(weighted.recall || 0),
        f1Score: Number(weighted['f1-score'] || 0),
        support: Number(weighted.support || testRecords),
      },
    };
  }, [evaluation, report]);

  if (loading) {
    return (
      <div
        style={{
          ...panelStyle,
          padding: '40px 20px',
          textAlign: 'center',
          color: '#CBD5E1',
        }}
      >
        <RefreshCw
          size={26}
          color="#06D6E0"
          style={{ marginBottom: '12px' }}
        />
        <h3 style={headingStyle}>Loading Model Evaluation</h3>
        <p style={mutedStyle}>
          Fetching verified metrics from the FastAPI backend...
        </p>
      </div>
    );
  }

  if (error || !evaluation || !metrics) {
    return (
      <div
        style={{
          ...panelStyle,
          padding: '24px',
          borderColor: 'rgba(239, 68, 68, 0.35)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#EF4444',
          }}
        >
          <AlertTriangle size={22} />
          <h3 style={headingStyle}>Unable to Load Evaluation</h3>
        </div>

        <p style={{ color: '#CBD5E1', fontSize: '13px' }}>
          {error || 'No evaluation data was returned by the backend.'}
        </p>

        <p style={mutedStyle}>
          Confirm that the FastAPI backend is running and that GET /evaluation
          returns a valid JSON report.
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            background: '#2878FF',
            color: '#FFFFFF',
            border: 0,
            borderRadius: '7px',
            padding: '9px 14px',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '22px',
      }}
    >
      <div
        style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '10px',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <CheckCircle2
          size={22}
          color="#10B981"
          style={{ flexShrink: 0 }}
        />

        <div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#F8FAFC',
            }}
          >
            Model Evaluation Report
          </div>

          <div
            style={{
              ...mutedStyle,
              marginTop: '4px',
              lineHeight: 1.6,
            }}
          >
            Metrics loaded from the backend evaluation report for CIC-IDS2017.
            These are held-out test-set metrics, not live network detection
            statistics.
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
        }}
      >
        <StatCard
          title="Overall Test Accuracy"
          value={Number(metrics.accuracyPercent.toFixed(4))}
          suffix="%"
          subtitle={`${formatNumber(metrics.correctPredictions)} of ${formatNumber(metrics.testRecords)} correct`}
          icon={Award}
          color="#10B981"
          bg="rgba(16, 185, 129, 0.12)"
        />

        <StatCard
          title="Test Support Records"
          value={metrics.testRecords}
          subtitle="Held-out CIC-IDS2017 test records"
          icon={FileText}
          color="#2878FF"
          bg="rgba(40, 120, 255, 0.12)"
        />

        <StatCard
          title="Macro Avg F1-Score"
          value={Number((metrics.macro.f1Score * 100).toFixed(2))}
          suffix="%"
          subtitle="Unweighted average across classes"
          icon={TrendingUp}
          color="#06D6E0"
          bg="rgba(6, 214, 224, 0.12)"
        />

        <StatCard
          title="Weighted Avg F1-Score"
          value={Number((metrics.weighted.f1Score * 100).toFixed(2))}
          suffix="%"
          subtitle="Weighted by test class support"
          icon={Percent}
          color="#A855F7"
          bg="rgba(168, 85, 247, 0.12)"
        />
      </div>

      <section style={{ ...panelStyle, padding: '20px 24px' }}>
        <h3 style={{ ...headingStyle, marginBottom: '16px' }}>
          Model Evaluation Details
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '14px',
          }}
        >
          {[
            ['Algorithm', 'Random Forest Classifier'],
            ['Evaluation Dataset', 'CIC-IDS2017'],
            ['Input Features', '70 numerical features'],
            ['Target Classes', `${metrics.labels.length} classes`],
            ['Test Records', formatNumber(metrics.testRecords)],
            ['Evaluation Source', 'evaluation_report.json'],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                background: 'rgba(5, 11, 24, 0.5)',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(40, 120, 255, 0.1)',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  color: '#64748B',
                  marginBottom: '5px',
                }}
              >
                {label.toUpperCase()}
              </div>

              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#F8FAFC',
                  overflowWrap: 'anywhere',
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ ...panelStyle, overflow: 'hidden' }}>
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid rgba(40, 120, 255, 0.12)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div>
            <h3 style={headingStyle}>
              {activeView === 'table'
                ? 'Classification Report'
                : 'Confusion Matrix'}
            </h3>

            <span style={mutedStyle}>
              {activeView === 'table'
                ? 'Precision, recall, F1-score and support by class'
                : 'Actual labels versus model-predicted labels'}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '4px',
              padding: '4px',
              background: 'rgba(5, 11, 24, 0.6)',
              border: '1px solid rgba(40, 120, 255, 0.18)',
              borderRadius: '8px',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveView('table')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 11px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                color: activeView === 'table' ? '#FFFFFF' : '#94A3B8',
                background: activeView === 'table' ? '#2878FF' : 'transparent',
                border: 0,
                cursor: 'pointer',
              }}
            >
              <Table2 size={13} />
              Metrics Table
            </button>

            <button
              type="button"
              onClick={() => setActiveView('matrix')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 11px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                color: activeView === 'matrix' ? '#FFFFFF' : '#94A3B8',
                background: activeView === 'matrix' ? '#2878FF' : 'transparent',
                border: 0,
                cursor: 'pointer',
              }}
            >
              <Grid size={13} />
              Confusion Matrix
            </button>
          </div>
        </div>

        {activeView === 'table' ? (
          <MetricTable
            rows={metrics.rows}
            macro={metrics.macro}
            weighted={metrics.weighted}
          />
        ) : (
          <ConfusionMatrix
            matrix={metrics.confusionMatrix}
            labels={metrics.labels}
            selectedCell={selectedCell}
            setSelectedCell={setSelectedCell}
          />
        )}
      </section>
    </div>
  );
}
