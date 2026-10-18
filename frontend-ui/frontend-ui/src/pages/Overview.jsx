import { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  FileCheck2, 
  Percent, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip 
} from 'recharts';
import { StatCard } from '../components/StatCard';
import { NetworkTopology } from '../components/NetworkTopology';
import { Modal } from '../components/Modal';
import { StatCardSkeleton, TableRowSkeleton } from '../components/Skeleton';
import { getThreatDetails } from '../data/labelMapping';
import { api } from '../services/api';

export function Overview({ 
  history = [], 
  isLoading, 
  error, 
  onRefresh, 
  setActiveTab 
}) {
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [evaluation, setEvaluation] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadEvaluation() {
      try {
        const data = await api.getEvaluation();
        if (!cancelled) {
          setEvaluation(data);
        }
      } catch (err) {
        console.error('Unable to load dataset evaluation.', err);
      }
    }

    loadEvaluation();
    return () => {
      cancelled = true;
    };
  }, []);

  const total = history.length;
  const isAttack = (x) => x.is_benign === false || x.is_benign === 'false';
  const attackList = history.filter(isAttack);
  const attacks = attackList.length;
  const benign = total - attacks;
  const attackRate = total > 0 ? ((attacks / total) * 100).toFixed(1) : '0.0';

  // Distribution for Donut
  const donutData = [
    { name: 'Benign Flow', value: benign, color: '#10B981' },
    { name: 'Attacks Detected', value: attacks, color: '#EF4444' },
  ];

  // Class breakdown for Bar Chart
  const classCounts = history.reduce((acc, item) => {
    const label = item.prediction || 'Unknown';
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  const barData = Object.entries(classCounts).map(([name, count]) => ({
    name: name.replace('Web Attack – ', 'WA: '),
    fullName: name,
    count,
    color: name.toUpperCase().includes('BENIGN') ? '#10B981' : '#EF4444',
  }));

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Backend Degradation / Offline Notice */}
      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '10px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={20} color="#EF4444" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#F8FAFC' }}>
                Backend Service Notice
              </div>
              <div style={{ fontSize: '12px', color: '#FCA5A5' }}>
                {error} - Dashboard displaying cached records.
              </div>
            </div>
          </div>
          <button
            onClick={onRefresh}
            style={{
              background: '#EF4444',
              color: '#FFFFFF',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
        }}
      >
        {isLoading && !history.length ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Dataset Test Records"
              value={
                evaluation?.test_records != null
                  ? Number(evaluation.test_records).toLocaleString('en-IN')
                  : 'N/A'
              }
              subtitle="Records evaluated from CIC-IDS2017 test set"
              icon={FileCheck2}
              color="#2878FF"
              bg="rgba(40, 120, 255, 0.12)"
            />
            <StatCard
              title="Detected Attacks"
              value={attacks}
              subtitle="Attack predictions saved in recent history"
              icon={ShieldAlert}
              color="#EF4444"
              bg="rgba(239, 68, 68, 0.12)"
              trend={attacks > 0 ? { text: 'Threat Active', isPositive: false } : { text: 'Clear', isPositive: true }}
            />
            <StatCard
              title="Benign Predictions"
              value={benign}
              subtitle="Benign predictions saved in recent history"
              icon={ShieldCheck}
              color="#10B981"
              bg="rgba(16, 185, 129, 0.12)"
            />
            <StatCard
              title="Attack Rate"
              value={Number(attackRate)}
              suffix="%"
              subtitle="Attack share of saved prediction history"
              icon={Percent}
              color={Number(attackRate) > 20 ? '#EF4444' : '#06D6E0'}
              bg="rgba(6, 214, 224, 0.12)"
            />
          </>
        )}
      </div>

      {/* Hero Network Topology */}
      <div>
        <NetworkTopology height={360} recentAttackCount={attacks} />
      </div>

      {/* Middle Row: Charts */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Donut Chart: Benign vs Attack */}
        <div
          style={{
            background: '#0B1930',
            border: '1px solid rgba(40, 120, 255, 0.18)',
            borderRadius: '12px',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#F8FAFC' }}>
                Benign vs. Attack Proportion
              </h3>
              <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                Classification breakdown from current history pool
              </span>
            </div>
            <span
              style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                color: '#06D6E0',
                background: 'rgba(6, 214, 224, 0.1)',
                padding: '3px 8px',
                borderRadius: '4px',
              }}
            >
              {total} TOTAL
            </span>
          </div>

          <div style={{ height: '220px', position: 'relative' }}>
            {total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={88}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(5, 11, 24, 0.8)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      background: '#071020',
                      border: '1px solid rgba(40, 120, 255, 0.3)',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748B',
                  fontSize: '12px',
                }}
              >
                No historical records returned yet.
              </div>
            )}

            {/* Inner Center Label */}
            {total > 0 && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
              >
                <span style={{ fontSize: '22px', fontWeight: 700, color: '#F8FAFC' }}>
                  {total}
                </span>
                <span style={{ fontSize: '9px', letterSpacing: '1px', color: '#94A3B8' }}>
                  RECORDS
                </span>
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '24px',
              marginTop: '12px',
              paddingTop: '14px',
              borderTop: '1px solid rgba(40, 120, 255, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#10B981' }} />
              <span style={{ fontSize: '12px', color: '#CBD5E1' }}>
                Benign: <b>{benign}</b> ({total ? ((benign / total) * 100).toFixed(0) : 0}%)
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#EF4444' }} />
              <span style={{ fontSize: '12px', color: '#CBD5E1' }}>
                Attack: <b>{attacks}</b> ({total ? ((attacks / total) * 100).toFixed(0) : 0}%)
              </span>
            </div>
          </div>
        </div>

        {/* Bar Chart: Class Distribution */}
        <div
          style={{
            background: '#0B1930',
            border: '1px solid rgba(40, 120, 255, 0.18)',
            borderRadius: '12px',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#F8FAFC' }}>
                Prediction-Class Frequency
              </h3>
              <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                Frequency of each predicted class in active history
              </span>
            </div>
          </div>

          <div style={{ height: '220px' }}>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748B" 
                    fontSize={10} 
                    tickLine={false}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis stroke="#64748B" fontSize={10} tickLine={false} allowDecimals={false} />
                  <RechartsTooltip
                    contentStyle={{
                      background: '#071020',
                      border: '1px solid rgba(40, 120, 255, 0.3)',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                    formatter={(val, name, item) => [val, item.payload.fullName]}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748B',
                  fontSize: '12px',
                }}
              >
                No class counts available.
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid rgba(40, 120, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              color: '#64748B',
            }}
          >
            <span>Scope: Stored predictions returned by backend `GET /history`.</span>
          </div>
        </div>
      </div>

      {/* Recent Predictions Table */}
      <div
        style={{
          background: '#0B1930',
          border: '1px solid rgba(40, 120, 255, 0.18)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid rgba(40, 120, 255, 0.12)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(180deg, rgba(40, 120, 255, 0.05) 0%, transparent 100%)',
          }}
        >
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#F8FAFC' }}>
              Recent Prediction Events
            </h3>
            <span style={{ fontSize: '11px', color: '#94A3B8' }}>
              Latest classification events persisted in PostgreSQL
            </span>
          </div>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              color: '#06D6E0',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>View All Records</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(40, 120, 255, 0.12)', background: 'rgba(5, 11, 24, 0.4)' }}>
                <th style={{ padding: '12px 18px', fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>EVENT ID</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>PREDICTION LABEL</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>SEVERITY</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>CONFIDENCE</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>FEATURES</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>TIMESTAMP</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', color: '#94A3B8', fontWeight: 600, textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && !history.length ? (
                <>
                  <TableRowSkeleton cols={7} />
                  <TableRowSkeleton cols={7} />
                  <TableRowSkeleton cols={7} />
                </>
              ) : history.length ? (
                history.slice(0, 8).map((record, idx) => {
                  const threat = getThreatDetails(record.prediction);

                  return (
                    <tr
                      key={record.id || idx}
                      style={{
                        borderBottom: '1px solid rgba(40, 120, 255, 0.08)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(40, 120, 255, 0.04)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '14px 18px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#CBD5E1' }}>
                        #{record.id ?? '—'}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: threat.bg,
                            border: `1px solid ${threat.border}`,
                            color: threat.color,
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: threat.color }} />
                          {record.prediction || 'Unknown'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' }}>
                        {threat.severity}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#F8FAFC' }}>
                        {record.confidence_percent != null
                          ? `${record.confidence_percent}%`
                          : record.confidence != null
                          ? `${record.confidence}%`
                          : '—'}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#94A3B8' }}>
                        {record.features_received ?? '70'}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '11px', color: '#94A3B8' }}>
                        {record.created_at ? new Date(record.created_at).toLocaleString() : '—'}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedRecord(record)}
                          style={{
                            color: '#06D6E0',
                            background: 'rgba(6, 214, 224, 0.08)',
                            border: '1px solid rgba(6, 214, 224, 0.25)',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 500,
                          }}
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                    <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                      No prediction history found in database.
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '16px' }}>
                      Execute a flow prediction in the Prediction Lab to generate real audit records.
                    </div>
                    <button
                      onClick={() => setActiveTab('prediction-lab')}
                      style={{
                        background: '#2878FF',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      Open Prediction Lab
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Inspection Modal */}
      {selectedRecord && (
        <Modal
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title={`Prediction Event Audit #${selectedRecord.id}`}
          subtitle={`Classified at ${selectedRecord.created_at ? new Date(selectedRecord.created_at).toLocaleString() : 'N/A'}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                background: 'rgba(5, 11, 24, 0.5)',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid rgba(40, 120, 255, 0.12)',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: '#64748B' }}>Classification:</span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#F8FAFC', marginTop: '2px' }}>
                  {selectedRecord.prediction}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748B' }}>Status:</span>
                <div style={{ fontSize: '14px', fontWeight: 600, color: selectedRecord.is_benign ? '#10B981' : '#EF4444', marginTop: '2px' }}>
                  {selectedRecord.is_benign ? 'BENIGN TRAFFIC' : 'MALICIOUS ATTACK'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748B' }}>Confidence Score:</span>
                <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: '#06D6E0', marginTop: '2px' }}>
                  {selectedRecord.confidence_percent ?? selectedRecord.confidence ?? 'N/A'}%
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748B' }}>Features Ingested:</span>
                <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: '#CBD5E1', marginTop: '2px' }}>
                  {selectedRecord.features_received ?? 70} Features
                </div>
              </div>
            </div>

            {/* Threat Description & Mitigation */}
            {(() => {
              const meta = getThreatDetails(selectedRecord.prediction);
              return (
                <div
                  style={{
                    background: meta.bg,
                    border: `1px solid ${meta.border}`,
                    borderRadius: '8px',
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 600, color: meta.color, marginBottom: '4px' }}>
                    {meta.category} — Threat Profile
                  </div>
                  <p style={{ fontSize: '12px', color: '#CBD5E1', lineHeight: '1.5', marginBottom: '8px' }}>
                    {meta.description}
                  </p>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                    <b>SOC Recommended Action:</b> {meta.mitigation}
                  </div>
                </div>
              );
            })()}

            <div>
              <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '6px' }}>
                Raw Audit Event JSON:
              </span>
              <pre
                style={{
                  background: '#071020',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(40, 120, 255, 0.12)',
                  fontSize: '11px',
                  color: '#06D6E0',
                  overflowX: 'auto',
                }}
              >
                {JSON.stringify(selectedRecord, null, 2)}
              </pre>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
