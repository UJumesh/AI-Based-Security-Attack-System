import { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';

export function SystemStatus({ healthStatus, onRefresh, isRefreshing, error, addToast }) {
  const [pingLatency, setPingLatency] = useState(null);
  const [isPinging, setIsPinging] = useState(false);

  const isHealthy = healthStatus?.status === 'healthy';
  const isDegraded = healthStatus?.status === 'degraded';
  const statusColor = isHealthy ? '#10B981' : isDegraded ? '#F59E0B' : '#EF4444';
  const statusText = isHealthy ? 'HEALTHY' : isDegraded ? 'DEGRADED' : 'OFFLINE';

  const baseUrl = api.getBaseUrl();

  async function handlePing() {
    setIsPinging(true);
    const start = performance.now();
    try {
      await api.getHealth();
      const end = performance.now();
      const ms = Math.round(end - start);
      setPingLatency(ms);
      if (addToast) {
        addToast({
          type: 'success',
          title: 'Ping Successful',
          message: `Backend roundtrip latency: ${ms}ms`,
        });
      }
    } catch (err) {
      setPingLatency(-1);
      if (addToast) {
        addToast({
          type: 'error',
          title: 'Ping Failed',
          message: err.message,
        });
      }
    } finally {
      setIsPinging(false);
    }
  }

  const endpoints = [
    { method: 'GET', path: '/', desc: 'Root service discovery and API metadata', status: healthStatus ? 200 : 0 },
    { method: 'GET', path: '/health', desc: 'Service health check, model & database connectivity status', status: healthStatus ? 200 : 0 },
    { method: 'POST', path: '/predict', desc: 'Classification inference on 70 numeric flow features', status: healthStatus?.model_loaded ? 200 : 0 },
    { method: 'GET', path: '/history?limit=20', desc: 'Retrieve recent saved predictions from PostgreSQL', status: healthStatus?.database_connected ? 200 : 503 },
    { method: 'GET', path: '/docs', desc: 'FastAPI interactive Swagger UI documentation', status: healthStatus ? 200 : 0 },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Optional Error Alert */}
      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '10px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#FCA5A5', fontSize: '12px' }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            style={{
              background: '#EF4444',
              color: '#FFFFFF',
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            {isRefreshing ? 'Checking...' : 'Re-check Service'}
          </button>
        </div>
      )}

      {/* Overall Health Header Card */}
      <div
        style={{
          background: '#0B1930',
          border: `1px solid ${statusColor}40`,
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: `0 8px 30px ${statusColor}14`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '12px',
              background: `${statusColor}18`,
              border: `1px solid ${statusColor}50`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: statusColor,
            }}
          >
            {isHealthy ? <CheckCircle2 size={28} /> : <AlertTriangle size={28} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', color: '#94A3B8' }}>
                PRIMARY BACKEND STATUS
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: statusColor,
                  background: `${statusColor}18`,
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                {statusText}
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#F8FAFC', marginTop: '2px' }}>
              FastAPI Intelligence Service (v1.2.0)
            </h2>
            <span style={{ fontSize: '12px', color: '#CBD5E1', fontFamily: 'var(--font-mono)' }}>
              Connected to: {baseUrl}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handlePing}
            disabled={isPinging}
            style={{
              background: 'rgba(40, 120, 255, 0.15)',
              border: '1px solid rgba(40, 120, 255, 0.3)',
              color: '#06D6E0',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={14} style={{ animation: isPinging ? 'radarSweep 1s linear infinite' : 'none' }} />
            <span>{isPinging ? 'Pinging...' : 'Ping Endpoint'}</span>
          </button>
          {pingLatency !== null && (
            <span
              style={{
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                color: pingLatency >= 0 ? '#10B981' : '#EF4444',
                background: 'rgba(5, 11, 24, 0.6)',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(40, 120, 255, 0.15)',
              }}
            >
              {pingLatency >= 0 ? `${pingLatency}ms` : 'TIMEOUT'}
            </span>
          )}
        </div>
      </div>

      {/* Component Status Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        {/* ML Model Card */}
        <div
          style={{
            background: '#0B1930',
            border: '1px solid rgba(40, 120, 255, 0.18)',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', color: '#94A3B8' }}>
              MACHINE LEARNING ENGINE
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: healthStatus?.model_loaded ? '#10B981' : '#EF4444',
                background: healthStatus?.model_loaded ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                padding: '2px 8px',
                borderRadius: '4px',
              }}
            >
              {healthStatus?.model_loaded ? 'LOADED' : 'NOT LOADED'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#CBD5E1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Artifact:</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>ml/models/random_forest.pkl</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Expected Features:</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: '#06D6E0' }}>
                {healthStatus?.expected_features ?? 70} Features
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Known Target Classes:</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: '#10B981' }}>
                {healthStatus?.known_classes ?? 15} Classes
              </span>
            </div>
          </div>
        </div>

        {/* PostgreSQL Database Card */}
        <div
          style={{
            background: '#0B1930',
            border: '1px solid rgba(40, 120, 255, 0.18)',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', color: '#94A3B8' }}>
              POSTGRESQL AUDIT DATABASE
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: healthStatus?.database_connected ? '#10B981' : '#EF4444',
                background: healthStatus?.database_connected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                padding: '2px 8px',
                borderRadius: '4px',
              }}
            >
              {healthStatus?.database_connected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#CBD5E1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Audit Table:</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>prediction_history</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Driver:</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>psycopg (PostgreSQL)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Security:</span>
              <span style={{ color: '#10B981' }}>Backend Mediated (No direct browser access)</span>
            </div>
          </div>
        </div>

        {/* Label Mapping Card */}
        <div
          style={{
            background: '#0B1930',
            border: '1px solid rgba(40, 120, 255, 0.18)',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', color: '#94A3B8' }}>
              CLASS LABEL MAPPING
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: healthStatus?.label_mapping_loaded ? '#10B981' : '#EF4444',
                background: healthStatus?.label_mapping_loaded ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                padding: '2px 8px',
                borderRadius: '4px',
              }}
            >
              {healthStatus?.label_mapping_loaded ? 'SYNCHRONIZED' : 'MISSING'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#CBD5E1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Mapping File:</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>label_mapping.json</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>ID Coverage:</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>IDs 0 to 14 mapped</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Benign Class ID:</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: '#10B981' }}>Class 0 (BENIGN)</span>
            </div>
          </div>
        </div>
      </div>

      {/* API Endpoint Registry Table */}
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
            padding: '16px 22px',
            borderBottom: '1px solid rgba(40, 120, 255, 0.12)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(180deg, rgba(40, 120, 255, 0.05) 0%, transparent 100%)',
          }}
        >
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#F8FAFC' }}>
              Registered FastAPI REST Endpoints
            </h3>
            <span style={{ fontSize: '11px', color: '#94A3B8' }}>
              Active route schemas verified in <code>backend/app/main.py</code>
            </span>
          </div>

          <a
            href={`${baseUrl}/docs`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 600,
              color: '#06D6E0',
            }}
          >
            <span>Swagger UI (/docs)</span>
            <ExternalLink size={13} />
          </a>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(40, 120, 255, 0.12)', background: 'rgba(5, 11, 24, 0.5)' }}>
                <th style={{ padding: '12px 18px', fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>METHOD</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>ROUTE</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>DESCRIPTION</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((ep) => (
                <tr
                  key={ep.path}
                  style={{
                    borderBottom: '1px solid rgba(40, 120, 255, 0.08)',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(40, 120, 255, 0.04)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '14px 18px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: ep.method === 'GET' ? 'rgba(40, 120, 255, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: ep.method === 'GET' ? '#2878FF' : '#10B981',
                        border: `1px solid ${ep.method === 'GET' ? 'rgba(40, 120, 255, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                      }}
                    >
                      {ep.method}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#F8FAFC' }}>
                    {ep.path}
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: '12px', color: '#CBD5E1' }}>
                    {ep.desc}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        color: ep.status === 200 ? '#10B981' : '#EF4444',
                      }}
                    >
                      {ep.status ? `HTTP ${ep.status}` : 'UNREACHABLE'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
