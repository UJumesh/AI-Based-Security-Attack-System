import { useMemo } from 'react';
import { 
  TrendingUp, 
  ShieldAlert, 
  ShieldCheck, 
  Info,
  Layers
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';
import { StatCard } from '../components/StatCard';
import { getThreatDetails } from '../data/labelMapping';

export function AttackAnalytics({ history = [], setActiveTab }) {
  const isAttack = (x) => x.is_benign === false || x.is_benign === 'false';

  const stats = useMemo(() => {
    const total = history.length;
    const attacks = history.filter(isAttack);
    const benign = history.filter((x) => !isAttack(x));

    const attackRate = total > 0 ? ((attacks.length / total) * 100).toFixed(1) : '0.0';

    // Average Confidence
    const calcAvgConf = (arr) => {
      const valid = arr.map((x) => x.confidence_percent ?? x.confidence).filter((c) => typeof c === 'number' && !isNaN(c));
      if (!valid.length) return 'N/A';
      return (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1);
    };

    const avgBenignConf = calcAvgConf(benign);
    const avgAttackConf = calcAvgConf(attacks);

    // Group attacks by class
    const attackCounts = attacks.reduce((acc, item) => {
      const name = item.prediction || 'Unknown Attack';
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});

    const attackBarData = Object.entries(attackCounts)
      .map(([name, count]) => ({
        name: name.replace('Web Attack – ', 'WA: '),
        fullName: name,
        count,
        percent: ((count / (attacks.length || 1)) * 100).toFixed(1),
        threat: getThreatDetails(name),
      }))
      .sort((a, b) => b.count - a.count);

    // Group attacks by category
    const categoryCounts = history.reduce((acc, item) => {
      const threat = getThreatDetails(item.prediction);
      const cat = threat.category || 'General';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    const categoryData = Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      count,
    }));

    return {
      total,
      attacksCount: attacks.length,
      benignCount: benign.length,
      attackRate,
      avgBenignConf,
      avgAttackConf,
      attackBarData,
      categoryData,
    };
  }, [history]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Notice Card */}
      <div
        style={{
          background: '#0B1930',
          border: '1px solid rgba(40, 120, 255, 0.2)',
          borderRadius: '10px',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <Info size={20} color="#06D6E0" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '12px', color: '#CBD5E1', lineHeight: '1.5' }}>
          <b>Data Provenance & Scope:</b> All metrics and charts below are computed strictly from the <b>{history.length}</b> records currently available in the prediction history audit table (<code>GET /history</code>). This represents classified flow records — not aggregate uninspected raw network infrastructure traffic.
        </div>
      </div>

      {/* Analytics KPI Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        <StatCard
          title="Sample Size"
          value={stats.total}
          subtitle="Audit records in current pool"
          icon={Layers}
          color="#2878FF"
          bg="rgba(40, 120, 255, 0.12)"
        />
        <StatCard
          title="Attack Incidents"
          value={stats.attacksCount}
          subtitle="Total confirmed threat records"
          icon={ShieldAlert}
          color="#EF4444"
          bg="rgba(239, 68, 68, 0.12)"
        />
        <StatCard
          title="Avg Benign Confidence"
          value={stats.avgBenignConf === 'N/A' ? 'N/A' : Number(stats.avgBenignConf)}
          suffix={stats.avgBenignConf !== 'N/A' ? '%' : ''}
          subtitle="Model certainty on normal traffic"
          icon={ShieldCheck}
          color="#10B981"
          bg="rgba(16, 185, 129, 0.12)"
        />
        <StatCard
          title="Avg Attack Confidence"
          value={stats.avgAttackConf === 'N/A' ? 'N/A' : Number(stats.avgAttackConf)}
          suffix={stats.avgAttackConf !== 'N/A' ? '%' : ''}
          subtitle="Model certainty on identified attacks"
          icon={TrendingUp}
          color="#F59E0B"
          bg="rgba(245, 158, 11, 0.12)"
        />
      </div>

      {/* Charts Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Attack Vector Breakdown Bar Chart */}
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
                Detected Attack Vectors
              </h3>
              <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                Frequency of each identified attack classification
              </span>
            </div>
            <span
              style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                color: '#EF4444',
                background: 'rgba(239, 68, 68, 0.1)',
                padding: '3px 8px',
                borderRadius: '4px',
              }}
            >
              {stats.attacksCount} ATTACKS
            </span>
          </div>

          <div style={{ height: '240px' }}>
            {stats.attackBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.attackBarData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
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
                    formatter={(val, name, item) => [`${val} (${item.payload.percent}%)`, item.payload.fullName]}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {stats.attackBarData.map((entry, index) => (
                      <Cell key={`attack-${index}`} fill={entry.threat.color || '#EF4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748B',
                  fontSize: '12px',
                  gap: '8px',
                }}
              >
                <span>Zero attack records found in current history.</span>
                <button
                  onClick={() => setActiveTab('prediction-lab')}
                  style={{
                    color: '#06D6E0',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >
                  Test an Attack Vector in Prediction Lab →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Threat Category Classification */}
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
                Macro Threat Categories
              </h3>
              <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                Distribution aggregated into high-level cybersecurity domains
              </span>
            </div>
          </div>

          <div style={{ height: '240px' }}>
            {stats.categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.categoryData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                  <XAxis type="number" stroke="#64748B" fontSize={10} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" stroke="#CBD5E1" fontSize={11} tickLine={false} width={100} />
                  <RechartsTooltip
                    contentStyle={{
                      background: '#071020',
                      border: '1px solid rgba(40, 120, 255, 0.3)',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="#2878FF" radius={[0, 4, 4, 0]} />
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
                No categorical distributions available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
