import { useEffect, useState, useRef } from 'react';

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = '#2878FF',
  bg = 'rgba(40, 120, 255, 0.1)',
  suffix = '',
  loading = false,
}) {
  const isNumber = typeof value === 'number';
  const [animatedNumber, setAnimatedNumber] = useState(isNumber ? value : 0);
  const prevValueRef = useRef(isNumber ? value : 0);

  useEffect(() => {
    if (!isNumber) return;

    const duration = 700;
    const start = prevValueRef.current;
    const end = value;
    const startTime = performance.now();
    let animId;

    function update(time) {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * ease);
      setAnimatedNumber(current);

      if (progress < 1) {
        animId = requestAnimationFrame(update);
      } else {
        prevValueRef.current = end;
      }
    }

    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [value, isNumber]);

  const display = isNumber ? animatedNumber.toLocaleString() : value;

  return (
    <div
      style={{
        background: '#0B1930',
        border: '1px solid rgba(40, 120, 255, 0.16)',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.25s ease',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.boxShadow = `0 8px 30px rgba(0, 0, 0, 0.4), 0 0 20px ${color}26`;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(40, 120, 255, 0.16)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Top accent glow line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: '#94A3B8',
          }}
        >
          {title}
        </span>
        {Icon && (
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '9px',
              background: bg,
              border: `1px solid ${color}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color,
              flexShrink: 0,
            }}
          >
            <Icon size={18} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '28px',
            fontWeight: 700,
            color: '#F8FAFC',
            letterSpacing: '-0.5px',
          }}
        >
          {loading ? '—' : display}
          {suffix}
        </span>
        {trend && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: trend.isPositive ? '#10B981' : '#EF4444',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            {trend.text}
          </span>
        )}
      </div>

      {subtitle && (
        <span style={{ fontSize: '11px', color: '#64748B', lineHeight: '1.4' }}>
          {subtitle}
        </span>
      )}
    </div>
  );
}
