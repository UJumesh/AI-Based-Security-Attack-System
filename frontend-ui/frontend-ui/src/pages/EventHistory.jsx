import { useState, useMemo } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { TableRowSkeleton } from '../components/Skeleton';
import { getThreatDetails } from '../data/labelMapping';

export function EventHistory({ 
  history = [], 
  isLoading, 
  onRefresh, 
  limit, 
  setLimit,
  addToast 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | benign | attack
  const [sortField, setSortField] = useState('id'); // id | created_at | confidence_percent
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const isAttack = (x) => x.is_benign === false || x.is_benign === 'false';

  // Filter & Search
  const filteredRecords = useMemo(() => {
    return history.filter((item) => {
      // Status filter
      if (statusFilter === 'benign' && isAttack(item)) return false;
      if (statusFilter === 'attack' && !isAttack(item)) return false;

      // Text search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesId = String(item.id).toLowerCase().includes(query);
        const matchesLabel = String(item.prediction || '').toLowerCase().includes(query);
        const matchesTime = String(item.created_at || '').toLowerCase().includes(query);
        if (!matchesId && !matchesLabel && !matchesTime) return false;
      }

      return true;
    });
  }, [history, statusFilter, searchTerm]);

  // Sort
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'created_at') {
        valA = new Date(valA || 0).getTime();
        valB = new Date(valB || 0).getTime();
      } else if (sortField === 'confidence_percent') {
        valA = a.confidence_percent ?? a.confidence ?? 0;
        valB = b.confidence_percent ?? b.confidence ?? 0;
      } else {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredRecords, sortField, sortAsc]);

  // Pagination
  const totalPages = Math.ceil(sortedRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage, pageSize]);

  function handleSort(field) {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  }

  // Export CSV
  function handleExportCsv() {
    if (!history.length) return;
    const headers = ['id', 'prediction', 'prediction_id', 'is_benign', 'confidence_percent', 'features_received', 'created_at'];
    const rows = history.map((item) => [
      item.id,
      `"${item.prediction || ''}"`,
      item.prediction_id,
      item.is_benign,
      item.confidence_percent ?? item.confidence ?? '',
      item.features_received,
      `"${item.created_at || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `prediction_audit_history_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      type: 'success',
      title: 'Export Generated',
      message: `Exported ${history.length} records to CSV.`,
    });
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Control Bar */}
      <div
        style={{
          background: '#0B1930',
          border: '1px solid rgba(40, 120, 255, 0.18)',
          borderRadius: '12px',
          padding: '18px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#F8FAFC' }}>
              PostgreSQL Prediction Audit Ledger
            </h3>
            <span style={{ fontSize: '11px', color: '#94A3B8' }}>
              Querying table <code>prediction_history</code> via endpoint <code>GET /history?limit={limit}</code>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Backend Limit Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label htmlFor="history-limit" style={{ fontSize: '11px', color: '#64748B' }}>
                Query Limit:
              </label>
              <select
                id="history-limit"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                style={{
                  background: '#071020',
                  border: '1px solid rgba(40, 120, 255, 0.2)',
                  color: '#CBD5E1',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                }}
              >
                <option value={20}>20 Records</option>
                <option value={50}>50 Records</option>
                <option value={100}>100 Records (Max)</option>
              </select>
            </div>

            <button
              onClick={handleExportCsv}
              disabled={!history.length}
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
                opacity: history.length ? 1 : 0.5,
              }}
            >
              <FileSpreadsheet size={13} />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onRefresh}
              disabled={isLoading}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#CBD5E1',
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
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
            <Search
              size={14}
              color="#64748B"
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Search by label or event ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '7px 10px 7px 32px',
                fontSize: '12px',
                background: '#071020',
                border: '1px solid rgba(40, 120, 255, 0.18)',
                borderRadius: '6px',
              }}
            />
          </div>

          {/* Status Segmented Control */}
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
              onClick={() => {
                setStatusFilter('all');
                setCurrentPage(1);
              }}
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                color: statusFilter === 'all' ? '#F8FAFC' : '#94A3B8',
                background: statusFilter === 'all' ? '#2878FF' : 'transparent',
              }}
            >
              All Records ({history.length})
            </button>
            <button
              onClick={() => {
                setStatusFilter('benign');
                setCurrentPage(1);
              }}
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                color: statusFilter === 'benign' ? '#FFFFFF' : '#94A3B8',
                background: statusFilter === 'benign' ? '#10B981' : 'transparent',
              }}
            >
              Benign Only
            </button>
            <button
              onClick={() => {
                setStatusFilter('attack');
                setCurrentPage(1);
              }}
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                color: statusFilter === 'attack' ? '#FFFFFF' : '#94A3B8',
                background: statusFilter === 'attack' ? '#EF4444' : 'transparent',
              }}
            >
              Attacks Only
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div
        style={{
          background: '#0B1930',
          border: '1px solid rgba(40, 120, 255, 0.18)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(40, 120, 255, 0.12)', background: 'rgba(5, 11, 24, 0.5)' }}>
                <th
                  onClick={() => handleSort('id')}
                  style={{ padding: '12px 18px', fontSize: '11px', color: '#94A3B8', fontWeight: 600, cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>AUDIT ID</span>
                    <ArrowUpDown size={12} color={sortField === 'id' ? '#06D6E0' : '#64748B'} />
                  </div>
                </th>
                <th style={{ padding: '12px 18px', fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>STATUS</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>CLASSIFICATION</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>CLASS ID</th>
                <th
                  onClick={() => handleSort('confidence_percent')}
                  style={{ padding: '12px 18px', fontSize: '11px', color: '#94A3B8', fontWeight: 600, cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>CONFIDENCE</span>
                    <ArrowUpDown size={12} color={sortField === 'confidence_percent' ? '#06D6E0' : '#64748B'} />
                  </div>
                </th>
                <th style={{ padding: '12px 18px', fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>FEATURES</th>
                <th
                  onClick={() => handleSort('created_at')}
                  style={{ padding: '12px 18px', fontSize: '11px', color: '#94A3B8', fontWeight: 600, cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>TIMESTAMP</span>
                    <ArrowUpDown size={12} color={sortField === 'created_at' ? '#06D6E0' : '#64748B'} />
                  </div>
                </th>
                <th style={{ padding: '12px 18px', fontSize: '11px', color: '#94A3B8', fontWeight: 600, textAlign: 'right' }}>
                  INSPECT
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && !history.length ? (
                <>
                  <TableRowSkeleton cols={8} />
                  <TableRowSkeleton cols={8} />
                  <TableRowSkeleton cols={8} />
                </>
              ) : paginatedRecords.length ? (
                paginatedRecords.map((item) => {
                  const attack = isAttack(item);
                  const threat = getThreatDetails(item.prediction);
                  const conf = item.confidence_percent ?? item.confidence ?? null;

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid rgba(40, 120, 255, 0.08)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(40, 120, 255, 0.04)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '14px 18px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#CBD5E1' }}>
                        #{item.id}
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
                            }}
                          />
                          {attack ? 'ATTACK' : 'BENIGN'}
                        </span>
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
                            padding: '3px 8px',
                            borderRadius: '5px',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          {item.prediction || 'Unknown'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#94A3B8' }}>
                        {item.prediction_id ?? '—'}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#F8FAFC' }}>
                        {conf != null ? `${conf}%` : '—'}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#94A3B8' }}>
                        {item.features_received ?? 70}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '11px', color: '#94A3B8' }}>
                        {item.created_at ? new Date(item.created_at).toLocaleString() : '—'}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedRecord(item)}
                          style={{
                            color: '#06D6E0',
                            background: 'rgba(6, 214, 224, 0.08)',
                            border: '1px solid rgba(6, 214, 224, 0.25)',
                            padding: '4px 10px',
                            borderRadius: '5px',
                            fontSize: '11px',
                            fontWeight: 500,
                          }}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                    No prediction history matched your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div
          style={{
            padding: '14px 22px',
            borderTop: '1px solid rgba(40, 120, 255, 0.12)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            background: 'rgba(5, 11, 24, 0.4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#94A3B8' }}>
            <span>
              Showing <b>{paginatedRecords.length}</b> of <b>{sortedRecords.length}</b> filtered records ({history.length} total)
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  background: '#071020',
                  border: '1px solid rgba(40, 120, 255, 0.18)',
                  color: '#CBD5E1',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              style={{
                color: currentPage <= 1 ? '#475569' : '#CBD5E1',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>

            <span style={{ fontSize: '11px', color: '#94A3B8', padding: '0 6px' }}>
              Page <b>{currentPage}</b> of <b>{totalPages}</b>
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              style={{
                color: currentPage >= totalPages ? '#475569' : '#CBD5E1',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <Modal
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title={`Audit Record #${selectedRecord.id}`}
          subtitle={`Classified as ${selectedRecord.prediction}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                background: 'rgba(5, 11, 24, 0.6)',
                border: '1px solid rgba(40, 120, 255, 0.15)',
                borderRadius: '8px',
                padding: '16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
              }}
            >
              <div>
                <span style={{ fontSize: '10px', color: '#64748B' }}>TIMESTAMP</span>
                <div style={{ fontSize: '12px', color: '#F8FAFC', marginTop: '2px' }}>
                  {selectedRecord.created_at ? new Date(selectedRecord.created_at).toLocaleString() : 'N/A'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#64748B' }}>PREDICTION LABEL</span>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC', marginTop: '2px' }}>
                  {selectedRecord.prediction}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#64748B' }}>PREDICTION ID</span>
                <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: '#CBD5E1', marginTop: '2px' }}>
                  Class {selectedRecord.prediction_id}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#64748B' }}>CONFIDENCE PERCENT</span>
                <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: '#06D6E0', marginTop: '2px' }}>
                  {selectedRecord.confidence_percent ?? selectedRecord.confidence ?? 'N/A'}%
                </div>
              </div>
            </div>

            {/* Threat Profile */}
            {(() => {
              const meta = getThreatDetails(selectedRecord.prediction);
              return (
                <div
                  style={{
                    background: meta.bg,
                    border: `1px solid ${meta.border}`,
                    borderRadius: '8px',
                    padding: '14px',
                    fontSize: '12px',
                    color: '#CBD5E1',
                  }}
                >
                  <div style={{ fontWeight: 600, color: meta.color, marginBottom: '4px' }}>
                    Category: {meta.category}
                  </div>
                  <p style={{ lineHeight: 1.5, marginBottom: '8px' }}>{meta.description}</p>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                    <b>Action:</b> {meta.mitigation}
                  </div>
                </div>
              );
            })()}

            <div>
              <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '6px' }}>
                PostgreSQL Row Record:
              </span>
              <pre
                style={{
                  background: '#071020',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(40, 120, 255, 0.12)',
                  fontSize: '11px',
                  color: '#06D6E0',
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
