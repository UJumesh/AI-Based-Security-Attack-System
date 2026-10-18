import { 
  LayoutDashboard, 
  Activity, 
  FlaskConical, 
  History, 
  BarChart3, 
  Award, 
  Sparkles, 
  ServerCog, 
  ShieldCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export function Sidebar({ 
  activeTab, 
  setActiveTab, 
  healthStatus, 
  isCollapsed, 
  setIsCollapsed,
  mobileOpen,
  setMobileOpen
}) {
  const navItems = [
    {
      id: 'overview',
      label: 'Overview Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'monitoring',
      label: 'Live Monitoring',
      icon: Activity,
      badge: 'LIVE',
      badgeColor: '#10B981',
    },
    {
      id: 'prediction-lab',
      label: 'Prediction Lab',
      icon: FlaskConical,
      badge: '70 Feat',
      badgeColor: '#2878FF',
    },
    {
      id: 'history',
      label: 'Event History',
      icon: History,
      badge: null,
    },
    {
      id: 'analytics',
      label: 'Attack Analytics',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'performance',
      label: 'Model Performance',
      icon: Award,
      badge: '99.7%',
      badgeColor: '#06D6E0',
    },
    {
      id: 'explainability',
      label: 'Explainable AI (XAI)',
      icon: Sparkles,
      badge: 'SHAP',
      badgeColor: '#F59E0B',
    },
    {
      id: 'status',
      label: 'System Status',
      icon: ServerCog,
      badge: null,
    },
  ];

  const isHealthy = healthStatus?.status === 'healthy';
  const isDegraded = healthStatus?.status === 'degraded';

  const statusColor = isHealthy ? '#10B981' : isDegraded ? '#F59E0B' : '#EF4444';
  const statusLabel = isHealthy ? 'ONLINE' : isDegraded ? 'DEGRADED' : 'OFFLINE';

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 11, 24, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 998,
          }}
        />
      )}

      <aside
        style={{
          width: isCollapsed ? '76px' : '260px',
          minWidth: isCollapsed ? '76px' : '260px',
          height: '100vh',
          position: 'sticky',
          top: 0,
          background: '#071020',
          borderRight: '1px solid rgba(40, 120, 255, 0.14)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 999,
          overflow: 'hidden',
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: isCollapsed ? '20px 14px' : '20px 20px',
            borderBottom: '1px solid rgba(40, 120, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            background: 'linear-gradient(180deg, rgba(40, 120, 255, 0.05) 0%, transparent 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #2878FF 0%, #06D6E0 100%)',
                boxShadow: '0 0 20px rgba(6, 214, 224, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#050B18',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={22} strokeWidth={2.5} />
            </div>
            {!isCollapsed && (
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '15px',
                    fontWeight: 700,
                    letterSpacing: '-0.3px',
                    color: '#F8FAFC',
                    lineHeight: 1.1,
                  }}
                >
                  AEGIS AI <span style={{ color: '#06D6E0' }}>SOC</span>
                </div>
                <div
                  style={{
                    fontSize: '9px',
                    color: '#94A3B8',
                    letterSpacing: '1.2px',
                    fontWeight: 600,
                    marginTop: '2px',
                    textTransform: 'uppercase',
                  }}
                >
                  Attack Detection System
                </div>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              style={{
                color: '#64748B',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.15s ease',
              }}
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={18} />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <div style={{ padding: '16px 12px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {!isCollapsed && (
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '1.4px',
                color: '#64748B',
                textTransform: 'uppercase',
                padding: '0 8px 8px',
              }}
            >
              Command Operations
            </div>
          )}

          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (setMobileOpen) setMobileOpen(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: isCollapsed ? '12px' : '10px 14px',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  borderRadius: '9px',
                  background: isActive ? 'linear-gradient(90deg, rgba(40, 120, 255, 0.18) 0%, rgba(6, 214, 224, 0.08) 100%)' : 'transparent',
                  border: isActive ? '1px solid rgba(6, 214, 224, 0.35)' : '1px solid transparent',
                  color: isActive ? '#F8FAFC' : '#94A3B8',
                  boxShadow: isActive ? '0 0 16px rgba(40, 120, 255, 0.15)' : 'none',
                  transition: 'all 0.18s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(40, 120, 255, 0.08)';
                    e.currentTarget.style.color = '#F8FAFC';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#94A3B8';
                  }
                }}
                title={isCollapsed ? item.label : undefined}
              >
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '25%',
                      bottom: '25%',
                      width: '3px',
                      borderRadius: '0 2px 2px 0',
                      background: '#06D6E0',
                      boxShadow: '0 0 8px #06D6E0',
                    }}
                  />
                )}

                <IconComponent
                  size={18}
                  color={isActive ? '#06D6E0' : '#94A3B8'}
                  style={{ flexShrink: 0 }}
                />

                {!isCollapsed && (
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: isActive ? 600 : 500,
                      flex: 1,
                      textAlign: 'left',
                    }}
                  >
                    {item.label}
                  </span>
                )}

                {!isCollapsed && item.badge && (
                  <span
                    style={{
                      fontSize: '9px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: item.badgeColor,
                      background: `${item.badgeColor}18`,
                      border: `1px solid ${item.badgeColor}40`,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      letterSpacing: '0.4px',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Expand button if collapsed */}
        {isCollapsed && (
          <div style={{ padding: '10px', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={() => setIsCollapsed(false)}
              style={{
                color: '#64748B',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 255, 255, 0.04)',
              }}
              aria-label="Expand sidebar"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Footer / System Health Card */}
        <div
          style={{
            padding: isCollapsed ? '14px 8px' : '16px',
            borderTop: '1px solid rgba(40, 120, 255, 0.12)',
            background: 'rgba(5, 11, 24, 0.5)',
          }}
        >
          {isCollapsed ? (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: statusColor,
                  boxShadow: `0 0 10px ${statusColor}`,
                }}
                title={`Status: ${statusLabel}`}
              />
            </div>
          ) : (
            <div
              style={{
                background: '#0B1930',
                border: '1px solid rgba(40, 120, 255, 0.16)',
                borderRadius: '8px',
                padding: '10px 12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.8px' }}>
                  BACKEND CLUSTER
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '9px',
                    fontWeight: 700,
                    color: statusColor,
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: statusColor,
                      boxShadow: `0 0 6px ${statusColor}`,
                    }}
                  />
                  {statusLabel}
                </span>
              </div>
              <div style={{ fontSize: '10px', color: '#64748B', lineHeight: '1.3' }}>
                Model: Random Forest (70 Feats)
              </div>
              <div style={{ fontSize: '10px', color: '#64748B', lineHeight: '1.3' }}>
                Postgres: {healthStatus?.database_connected ? 'Connected' : 'Unavailable'}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
