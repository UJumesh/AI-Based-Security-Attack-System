export function Skeleton({ width = '100%', height = '20px', borderRadius = '6px', style = {} }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, #0B1930 25%, #132A4D 50%, #0B1930 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.8s infinite',
        ...style,
      }}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div
      style={{
        background: '#0B1930',
        border: '1px solid rgba(40, 120, 255, 0.12)',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton width="90px" height="14px" />
        <Skeleton width="32px" height="32px" borderRadius="8px" />
      </div>
      <Skeleton width="120px" height="32px" />
      <Skeleton width="160px" height="12px" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '14px 16px', borderBottom: '1px solid rgba(40, 120, 255, 0.08)' }}>
          <Skeleton height="16px" width={i === 1 ? '70%' : i === 0 ? '40px' : '90%'} />
        </td>
      ))}
    </tr>
  );
}
