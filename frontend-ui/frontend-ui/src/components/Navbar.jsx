import { useEffect, useState } from 'react';
import { RefreshCw, Menu, Clock } from 'lucide-react';

export function Navbar({ 
  activeTab, 
  onRefresh, 
  isRefreshing, 
  healthStatus, 
  setMobileOpen,
  autoRefreshInterval,
  setAutoRefreshInterval 
}) {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const titles = {
    overview: {
      title: 'Threat Intelligence Overview',
      crumb: 'Operations / SOC Dashboard',
    },
    monitoring: {
      title: 'Live Network Flow Monitoring',
      crumb: 'Operations / Ingress Sensor',
    },
    'prediction-lab': {
      title: 'ML Prediction & Inference Lab',
      crumb: 'Analysis / Random Forest',
    },
    history: {
      title: 'Prediction Event Ledger',
      crumb: 'Database / prediction_history',
    },
    analytics: {
      title: 'Attack Vector Analytics',
      crumb: 'Intelligence / Empirical Data',
    },
    performance: {
      title: 'Model Performance & Validation',
      crumb: 'ML Architecture / CIC-IDS2017',
    },
    explainability: {
      title: 'Explainable AI & Feature Attribution',
      crumb: 'Interpretability / SHAP Engine',
    },
    status: {
      title: 'System & Cluster Infrastructure',
      crumb: 'Infrastructure / Topology',
    },
  };

  const current = titles[activeTab] || titles.overview;

  const isHealthy = healthStatus?.status === 'healthy';
  const isDegraded = healthStatus?.status === 'degraded';
  const statusColor = isHealthy ? '#10B981' : isDegraded ? '#F59E0B' : '#EF4444';
  const statusLabel = isHealthy ? 'API HEALTHY' : isDegraded ? 'DEGRADED' : 'BACKEND OFFLINE';

  return (
    <header
      className="navbar-header"
      style={{
        borderBottom: '1px solid rgba(40, 120, 255, 0.12)',
        background: 'rgba(7, 16, 32, 0.75)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 90,
      }}
    >
      <div className="navbar-title-wrap" style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '180px', flex: '1 1 auto' }}>
        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileOpen(true)}
          style={{
            display: 'none',
            color: '#94A3B8',
            padding: '6px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.05)',
          }}
          className="mobile-menu-btn"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              color: '#06D6E0',
              fontWeight: 600,
              letterSpacing: '1.2px',
              textTransform: 'uppercase',
              marginBottom: '3px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            <span>{current.crumb}</span>
          </div>
          <h1
            className="navbar-title"
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#F8FAFC',
              letterSpacing: '-0.3px',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
            }}
          >
            {current.title}
          </h1>
        </div>
      </div>

      <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        {/* UTC/Local Clock */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(11, 25, 48, 0.8)',
            border: '1px solid rgba(40, 120, 255, 0.15)',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: '#94A3B8',
            whiteSpace: 'nowrap',
          }}
          className="navbar-clock hide-mobile"
        >
          <Clock size={13} color="#06D6E0" />
          <span>{time.toLocaleTimeString()}</span>
          <span className="utc-clock-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#64748B' }}>|</span>
            <span style={{ color: '#64748B' }}>UTC {time.toISOString().substring(11, 19)}</span>
          </span>
        </div>

        {/* Polling Interval Select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} className="poll-interval-wrap hide-mobile">
          <label htmlFor="poll-interval" style={{ fontSize: '11px', color: '#64748B' }}>
            Poll:
          </label>
          <select
            id="poll-interval"
            value={autoRefreshInterval}
            onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
            style={{
              background: '#0B1930',
              border: '1px solid rgba(40, 120, 255, 0.18)',
              color: '#CBD5E1',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            <option value={0}>Manual Only</option>
            <option value={5000}>5 Seconds</option>
            <option value={10000}>10 Seconds</option>
            <option value={30000}>30 Seconds</option>
          </select>
        </div>

        {/* Manual Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          style={{
            background: 'rgba(40, 120, 255, 0.12)',
            border: '1px solid rgba(40, 120, 255, 0.3)',
            color: '#06D6E0',
            borderRadius: '8px',
            padding: '7px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 600,
            transition: 'all 0.15s ease',
            opacity: isRefreshing ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(40, 120, 255, 0.25)';
            e.currentTarget.style.borderColor = '#06D6E0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(40, 120, 255, 0.12)';
            e.currentTarget.style.borderColor = 'rgba(40, 120, 255, 0.3)';
          }}
          title="Refresh real API data now"
        >
          <RefreshCw size={14} style={{ animation: isRefreshing ? 'radarSweep 1s linear infinite' : 'none' }} />
          <span>{isRefreshing ? 'Syncing...' : 'Sync Data'}</span>
        </button>

        {/* Status Indicator Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: `${statusColor}14`,
            border: `1px solid ${statusColor}40`,
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.6px',
            color: statusColor,
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: statusColor,
              boxShadow: `0 0 8px ${statusColor}`,
              animation: isHealthy ? 'pulseGlow 2.5s infinite' : 'none',
            }}
          />
          <span>{statusLabel}</span>
        </div>
      </div>
    </header>
  );
}
