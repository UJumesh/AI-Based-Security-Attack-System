import { useState } from 'react';
import { 
  Activity, 
  Radio, 
  RefreshCw, 
  AlertTriangle 
} from 'lucide-react';
import { NetworkTopology } from '../components/NetworkTopology';
import { TableRowSkeleton } from '../components/Skeleton';
import { getThreatDetails } from '../data/labelMapping';

export function LiveMonitoring({ 
  history = [], 
  healthStatus, 
  isLoading, 
  error, 
  onRefresh, 
  setActiveTab 
}) {
  const [filterType, setFilterType] = useState('all'); // all | attacks | benign

  const isAttack = (x) => x.is_benign === false || x.is_benign === 'false';

  const filteredHistory = history.filter((item) => {
    if (filterType === 'attacks') return isAttack(item);
    if (filterType === 'benign') return !isAttack(item);
    return true;
  });

  const isHealthy = healthStatus?.status === 'healthy';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Notice Banner */}
      <div
        style={{
          background: 'rgba(40, 120, 255, 0.08)',
          border: '1px solid rgba(40, 120, 255, 0.25)',
          borderRadius: '10px',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Radio size={18} color="#06D6E0" style={{ animation: 'pulseGlow 2s infinite' }} />
          <div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#F8FAFC' }}>
              Monitoring Scope: Periodic Backend History Polling
            </span>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>
              Real-time visualization syncs with FastAPI <code>GET /history</code>. Stored prediction audit records are visualized — not raw promiscuous NIC packet capture.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              padding: '4px 8px',
              borderRadius: '4px',
              background: isHealthy ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: isHealthy ? '#10B981' : '#EF4444',
              border: `1px solid ${isHealthy ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            }}
          >
            {isHealthy ? 'SENSOR ONLINE' : 'SENSOR DISCONNECTED'}
          </span>
        </div>
      </div>

      {/* Network Animation Canvas */}
      <div>
        <NetworkTopology height={320} recentAttackCount={history.filter(isAttack).length} />
      </div>

      {/* Live Stream Panel */}
      <div
        style={{
          background: '#0B1930',
          border: '1px solid rgba(40, 120, 255, 0.18)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        {/* Stream Header */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid rgba(40, 120, 255, 0.12)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            background: 'linear-gradient(180deg, rgba(40, 120, 255, 0.05) 0%, transparent 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={18} color="#06D6E0" />
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#F8FAFC' }}>
                Classification Stream
              </h3>
              <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                Showing {filteredHistory.length} of {history.length} audit sessions
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Filter Pills */}
            <div
              style={{
                display: 'flex',
                background: 'rgba(5, 11, 24, 0.6)',
                border: '1px solid rgba(40, 120, 255, 0.18)',
                borderRadius: '8px',
                padding: '3px',
              }}
            >
              <button
                onClick={() => setFilterType('all')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: filterType === 'all' ? '#F8FAFC' : '#94A3B8',
                  background: filterType === 'all' ? '#2878FF' : 'transparent',
                }}
              >
                All Events ({history.length})
              </button>
              <button
                onClick={() => setFilterType('attacks')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: filterType === 'attacks' ? '#FFFFFF' : '#94A3B8',
                  background: filterType === 'attacks' ? '#EF4444' : 'transparent',
                }}
              >
                Attacks Only ({history.filter(isAttack).length})
              </button>
              <button
                onClick={() => setFilterType('benign')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: filterType === 'benign' ? '#FFFFFF' : '#94A3B8',
                  background: filterType === 'benign' ? '#10B981' : 'transparent',
                }}
              >
                Benign Only ({history.filter((x) => !isAttack(x)).length})
              </button>
            </div>

            <button
              onClick={onRefresh}
              disabled={isLoading}
              style={{
                background: 'rgba(40, 120, 255, 0.12)',
                border: '1px solid rgba(40, 120, 255, 0.25)',
                color: '#06D6E0',
                padding: '6px 12px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              <RefreshCw size={13} style={{ animation: isLoading ? 'radarSweep 1s linear infinite' : 'none' }} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div
            style={{
              padding: '14px 20px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderBottom: '1px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FCA5A5', fontSize: '12px' }}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
            <button
              onClick={onRefresh}
              style={{
                background: '#EF4444',
                color: '#FFFFFF',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Event List / Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(40, 120, 255, 0.12)', background: 'rgba(5, 11, 24, 0.4)' }}>
                <th style={{ padding: '12px 18px', fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>EVENT ID</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>STATUS</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>PREDICTION LABEL</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>CONFIDENCE METER</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>FEATURES</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>EVENT TIME</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && !history.length ? (
                <>
                  <TableRowSkeleton cols={6} />
                  <TableRowSkeleton cols={6} />
                  <TableRowSkeleton cols={6} />
                </>
              ) : filteredHistory.length ? (
                filteredHistory.map((item, idx) => {
                  const attack = isAttack(item);
                  const threat = getThreatDetails(item.prediction);
                  const conf = item.confidence_percent ?? item.confidence ?? null;

                  return (
                    <tr
                      key={item.id || idx}
                      style={{
                        borderBottom: '1px solid rgba(40, 120, 255, 0.08)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(40, 120, 255, 0.04)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '14px 18px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#CBD5E1' }}>
                        #{item.id ?? '—'}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: attack ? '#EF4444' : '#10B981',
                          }}
                        >
                          <span
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              background: attack ? '#EF4444' : '#10B981',
                              boxShadow: `0 0 6px ${attack ? '#EF4444' : '#10B981'}`,
                            }}
                          />
                          {attack ? 'DEFLECTED' : 'PERMITTED'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            background: threat.bg,
                            border: `1px solid ${threat.border}`,
                            color: threat.color,
                            padding: '3px 8px',
                            borderRadius: '5px',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          {item.prediction || 'Unknown'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '90px',
                              height: '6px',
                              background: 'rgba(5, 11, 24, 0.6)',
                              borderRadius: '3px',
                              overflow: 'hidden',
                              border: '1px solid rgba(40, 120, 255, 0.15)',
                            }}
                          >
                            <div
                              style={{
                                width: conf ? `${conf}%` : '0%',
                                height: '100%',
                                background: attack ? '#EF4444' : '#10B981',
                                borderRadius: '3px',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#CBD5E1' }}>
                            {conf != null ? `${conf}%` : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94A3B8' }}>
                        {item.features_received ?? 70} parsed
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '11px', color: '#94A3B8' }}>
                        {item.created_at ? new Date(item.created_at).toLocaleTimeString() : '—'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                    <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                      No matching events in the current monitoring buffer.
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '16px' }}>
                      Try selecting "All Events" or execute a sample inference vector.
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
                      Launch Prediction Lab
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
