import { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon, Info, X } from 'lucide-react';

export function ToastContainer({ toasts, onDismiss }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '420px',
        width: 'calc(100vw - 48px)',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration || 4500);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const configs = {
    success: {
      icon: CheckCircle2,
      color: '#10B981',
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.35)',
    },
    error: {
      icon: AlertOctagon,
      color: '#EF4444',
      bg: 'rgba(239, 68, 68, 0.15)',
      border: 'rgba(239, 68, 68, 0.4)',
    },
    warning: {
      icon: AlertTriangle,
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.35)',
    },
    info: {
      icon: Info,
      color: '#06D6E0',
      bg: 'rgba(6, 214, 224, 0.12)',
      border: 'rgba(6, 214, 224, 0.35)',
    },
  };

  const config = configs[toast.type] || configs.info;
  const IconComponent = config.icon;

  return (
    <div
      className="animate-fade-in"
      style={{
        pointerEvents: 'auto',
        background: '#0B1930',
        backgroundImage: `linear-gradient(135deg, ${config.bg}, rgba(11, 25, 48, 0.95))`,
        border: `1px solid ${config.border}`,
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6), 0 0 15px rgba(40, 120, 255, 0.1)',
        backdropFilter: 'blur(12px)',
        borderRadius: '10px',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
      }}
    >
      <IconComponent size={20} color={config.color} style={{ flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {toast.title && (
          <div style={{ fontWeight: 600, fontSize: '13px', color: '#F8FAFC', marginBottom: '2px' }}>
            {toast.title}
          </div>
        )}
        <div style={{ fontSize: '12px', color: '#CBD5E1', lineHeight: '1.4', wordBreak: 'break-word' }}>
          {toast.message}
        </div>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          color: '#94A3B8',
          background: 'transparent',
          border: 'none',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
        }}
        aria-label="Dismiss toast"
      >
        <X size={15} />
      </button>
    </div>
  );
}
