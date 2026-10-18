import { useState } from 'react';
import { 
  Send, 
  RotateCcw, 
  FileCode, 
  CheckCircle2, 
  AlertOctagon, 
  AlertTriangle,
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { FEATURE_GROUPS, FEATURE_NAMES_ORDERED } from '../data/features';
import { PRESETS } from '../data/presets';
import { getThreatDetails } from '../data/labelMapping';

export function PredictionLab({ onPredictionSuccess, addToast }) {
  // Initialize form state with Sample HTTP Normal preset
  const [features, setFeatures] = useState(() => ({ ...PRESETS[0].values }));
  const [activePreset, setActivePreset] = useState(PRESETS[0].id);

  // Group collapse state (all open by default)
  const [collapsedGroups, setCollapsedGroups] = useState({});

  // Submission & Result state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);

  // JSON modal / Drawer state
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [copied, setCopied] = useState(false);

  // Input change handler
  function handleInputChange(name, value) {
    setActivePreset('custom');
    setFeatures((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // Toggle group collapse
  function toggleGroup(groupId) {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  }

  // Load preset
  function loadPreset(preset) {
    setFeatures({ ...preset.values });
    setActivePreset(preset.id);
    setPredictionResult(null);
    setErrorDetails(null);
    addToast({
      type: 'info',
      title: 'Preset Applied',
      message: `Loaded "${preset.name}" into all 70 input fields.`,
    });
  }

  // Reset to default blank/zero
  function handleReset() {
    loadPreset(PRESETS.find((p) => p.id === 'zero_baseline') || PRESETS[0]);
  }

  // Validate and submit
  async function handleSubmit(e) {
    e?.preventDefault();
    setErrorDetails(null);
    setPredictionResult(null);

    // Validate that all 70 features exist and are finite numbers
    const missing = [];
    const invalid = [];
    const numericPayload = {};

    for (const name of FEATURE_NAMES_ORDERED) {
      if (features[name] === undefined || features[name] === '') {
        missing.push(name);
      } else {
        const num = Number(features[name]);
        if (!Number.isFinite(num)) {
          invalid.push(name);
        } else {
          numericPayload[name] = num;
        }
      }
    }

    if (missing.length > 0 || invalid.length > 0) {
      setErrorDetails({
        message: 'Client-side validation failed before sending.',
        missing,
        invalid,
      });
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: `${missing.length} missing and ${invalid.length} invalid numeric features.`,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.predict(numericPayload);
      setPredictionResult(response);
      addToast({
        type: response.is_benign ? 'success' : 'warning',
        title: response.is_benign ? 'Traffic Classified Benign' : `Attack Detected: ${response.prediction}`,
        message: `Prediction ID #${response.history_id || 'saved'} registered in PostgreSQL audit table.`,
      });
      if (onPredictionSuccess) {
        onPredictionSuccess();
      }
    } catch (err) {
      console.error('Prediction API Error:', err);
      const detail = err.data?.detail;
      setErrorDetails({
        message: typeof detail === 'string' ? detail : detail?.message || err.message,
        missing: detail?.missing_features || [],
        extra: detail?.extra_features || [],
        invalid: detail?.invalid_features || [],
      });
      addToast({
        type: 'error',
        title: 'Inference Request Failed',
        message: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Copy JSON payload
  function handleCopyJson() {
    navigator.clipboard.writeText(JSON.stringify({ features }, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addToast({
      type: 'success',
      title: 'Copied to Clipboard',
      message: 'Raw feature payload copied in JSON format.',
    });
  }

  // Import JSON payload
  function handleImportJson() {
    try {
      const parsed = JSON.parse(jsonInput);
      const importedFeatures = parsed.features || parsed;
      if (typeof importedFeatures !== 'object' || importedFeatures === null) {
        throw new Error('JSON must contain a "features" object or direct key-value map.');
      }
      setFeatures((prev) => ({
        ...prev,
        ...importedFeatures,
      }));
      setActivePreset('custom');
      setShowJsonModal(false);
      addToast({
        type: 'success',
        title: 'JSON Imported',
        message: 'Feature values updated from provided JSON.',
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'JSON Parse Error',
        message: err.message,
      });
    }
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header & Presets Bar */}
      <div
        style={{
          background: '#0B1930',
          border: '1px solid rgba(40, 120, 255, 0.18)',
          borderRadius: '12px',
          padding: '20px 24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#F8FAFC' }}>
              Random Forest Inference Testbench
            </h2>
            <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
              Populates all 70 trained flow features. Sends payload to FastAPI endpoint <code>POST /predict</code>.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => {
                setJsonInput(JSON.stringify({ features }, null, 2));
                setShowJsonModal(true);
              }}
              style={{
                background: 'rgba(40, 120, 255, 0.12)',
                border: '1px solid rgba(40, 120, 255, 0.25)',
                color: '#06D6E0',
                padding: '7px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <FileCode size={14} />
              <span>Import / Export JSON</span>
            </button>
            <button
              onClick={handleCopyJson}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#CBD5E1',
                padding: '7px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
            </button>
          </div>
        </div>

        {/* Quick Presets */}
        <div>
          <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
            Fast Flow Presets (Click to Load):
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {PRESETS.map((p) => {
              const isSelected = activePreset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => loadPreset(p)}
                  style={{
                    background: isSelected ? 'rgba(40, 120, 255, 0.22)' : 'rgba(5, 11, 24, 0.6)',
                    border: `1px solid ${isSelected ? '#2878FF' : 'rgba(40, 120, 255, 0.15)'}`,
                    color: isSelected ? '#F8FAFC' : '#94A3B8',
                    padding: '6px 12px',
                    borderRadius: '7px',
                    fontSize: '11px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: p.badgeColor,
                    }}
                  />
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Real Prediction Result Card */}
      {predictionResult && (
        <div
          className="animate-fade-in"
          style={{
            background: predictionResult.is_benign ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.09)',
            border: `1px solid ${predictionResult.is_benign ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.4)'}`,
            borderRadius: '12px',
            padding: '24px',
            boxShadow: `0 8px 30px ${predictionResult.is_benign ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.2)'}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: predictionResult.is_benign ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: predictionResult.is_benign ? '#10B981' : '#EF4444',
                }}
              >
                {predictionResult.is_benign ? <CheckCircle2 size={26} /> : <AlertOctagon size={26} />}
              </div>
              <div>
                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: predictionResult.is_benign ? '#10B981' : '#EF4444' }}>
                  {predictionResult.is_benign ? 'BENIGN CLASSIFICATION' : 'ATTACK DETECTED BY ML MODEL'}
                </span>
                <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#F8FAFC', lineHeight: 1.1, marginTop: '2px' }}>
                  {predictionResult.prediction}
                </h3>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '10px', color: '#94A3B8', display: 'block' }}>AUDIT RECORD ID</span>
              <span style={{ fontSize: '18px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#06D6E0' }}>
                #{predictionResult.history_id ?? 'PENDING'}
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              padding: '16px',
              background: 'rgba(5, 11, 24, 0.6)',
              borderRadius: '8px',
              border: '1px solid rgba(40, 120, 255, 0.12)',
            }}
          >
            <div>
              <span style={{ fontSize: '10px', color: '#64748B' }}>CONFIDENCE PERCENT</span>
              <div style={{ fontSize: '18px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#06D6E0', marginTop: '2px' }}>
                {predictionResult.confidence_percent != null ? `${predictionResult.confidence_percent}%` : 'N/A'}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: '#64748B' }}>PREDICTION CLASS ID</span>
              <div style={{ fontSize: '18px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#CBD5E1', marginTop: '2px' }}>
                {predictionResult.prediction_id}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: '#64748B' }}>FEATURES RECEIVED</span>
              <div style={{ fontSize: '18px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#10B981', marginTop: '2px' }}>
                {predictionResult.features_received} / 70
              </div>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: '#64748B' }}>SAVED TIMESTAMP</span>
              <div style={{ fontSize: '12px', color: '#CBD5E1', marginTop: '6px' }}>
                {predictionResult.saved_at ? new Date(predictionResult.saved_at).toLocaleTimeString() : 'N/A'}
              </div>
            </div>
          </div>

          {/* Threat Metadata Guidance */}
          {(() => {
            const meta = getThreatDetails(predictionResult.prediction);
            return (
              <div
                style={{
                  marginTop: '14px',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  background: meta.bg,
                  border: `1px solid ${meta.border}`,
                  fontSize: '12px',
                  color: '#CBD5E1',
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontWeight: 600, color: meta.color, marginBottom: '2px' }}>
                  {meta.category} — {meta.description}
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                  <b>Action:</b> {meta.mitigation}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Validation / API Error Display */}
      {errorDetails && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '10px',
            padding: '16px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <AlertTriangle size={18} color="#EF4444" />
            <h4 style={{ fontSize: '14px', color: '#F8FAFC' }}>
              Validation Error: {errorDetails.message}
            </h4>
          </div>

          {errorDetails.missing?.length > 0 && (
            <div style={{ fontSize: '12px', color: '#FCA5A5', marginTop: '6px' }}>
              <b>Missing Features ({errorDetails.missing.length}):</b> {errorDetails.missing.slice(0, 10).join(', ')}
              {errorDetails.missing.length > 10 ? '...' : ''}
            </div>
          )}

          {errorDetails.invalid?.length > 0 && (
            <div style={{ fontSize: '12px', color: '#FCA5A5', marginTop: '6px' }}>
              <b>Non-numeric/Infinite Values ({errorDetails.invalid.length}):</b> {errorDetails.invalid.join(', ')}
            </div>
          )}
        </div>
      )}

      {/* 70-Feature Form with Collapsible Groups */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {FEATURE_GROUPS.map((group) => {
          const isCollapsed = collapsedGroups[group.id];

          return (
            <div
              key={group.id}
              style={{
                background: '#0B1930',
                border: '1px solid rgba(40, 120, 255, 0.16)',
                borderRadius: '10px',
                overflow: 'hidden',
              }}
            >
              {/* Group Header */}
              <div
                onClick={() => toggleGroup(group.id)}
                style={{
                  padding: '14px 20px',
                  background: 'linear-gradient(90deg, rgba(40, 120, 255, 0.06) 0%, transparent 100%)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: isCollapsed ? 'none' : '1px solid rgba(40, 120, 255, 0.12)',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '2px',
                      background: group.color,
                    }}
                  />
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#F8FAFC' }}>
                      {group.title}
                    </h4>
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                      {group.subtitle} ({group.features.length} features)
                    </span>
                  </div>
                </div>

                <div style={{ color: '#64748B' }}>
                  {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                </div>
              </div>

              {/* Group Inputs Grid */}
              {!isCollapsed && (
                <div
                  style={{
                    padding: '18px 20px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                    gap: '14px',
                  }}
                >
                  {group.features.map((feat) => {
                    const val = features[feat.name] !== undefined ? features[feat.name] : '';

                    return (
                      <div key={feat.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <label
                            htmlFor={`field-${feat.name}`}
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: '#CBD5E1',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '180px',
                            }}
                            title={feat.name}
                          >
                            {feat.name}
                          </label>
                          {feat.unit && (
                            <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: '#64748B' }}>
                              [{feat.unit}]
                            </span>
                          )}
                        </div>

                        <input
                          id={`field-${feat.name}`}
                          type="number"
                          step={feat.step || 'any'}
                          value={val}
                          onChange={(e) => handleInputChange(feat.name, e.target.value)}
                          placeholder="0.0"
                          style={{
                            padding: '7px 10px',
                            fontSize: '12px',
                            fontFamily: 'var(--font-mono)',
                            width: '100%',
                          }}
                        />

                        <span
                          style={{
                            fontSize: '9px',
                            color: '#64748B',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={feat.desc}
                        >
                          {feat.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Action Controls Toolbar */}
        <div
          style={{
            position: 'sticky',
            bottom: '16px',
            background: 'rgba(7, 16, 32, 0.95)',
            border: '1px solid rgba(40, 120, 255, 0.3)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(40, 120, 255, 0.15)',
            backdropFilter: 'blur(16px)',
            borderRadius: '10px',
            padding: '14px 22px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            zIndex: 80,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#94A3B8' }}>
            <span style={{ fontFamily: 'var(--font-mono)', color: '#06D6E0' }}>70/70</span>
            <span>Features Configured</span>
            <span style={{ color: '#64748B' }}>•</span>
            <span style={{ color: '#64748B' }}>Target: Random Forest</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleReset}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#CBD5E1',
                padding: '9px 16px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <RotateCcw size={14} />
              <span>Reset Values</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                background: 'linear-gradient(135deg, #2878FF 0%, #06D6E0 100%)',
                boxShadow: '0 0 24px rgba(6, 214, 224, 0.35)',
                color: '#050B18',
                border: 'none',
                padding: '9px 22px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              <Send size={15} />
              <span>{isSubmitting ? 'Transmitting to ML Engine...' : 'Execute ML Prediction'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* JSON Modal */}
      {showJsonModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            background: 'rgba(5, 11, 24, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setShowJsonModal(false)}
        >
          <div
            style={{
              background: '#0B1930',
              border: '1px solid rgba(40, 120, 255, 0.3)',
              borderRadius: '12px',
              maxWidth: '650px',
              width: '100%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(40, 120, 255, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', color: '#F8FAFC' }}>Raw Flow Features JSON</h3>
              <button
                onClick={() => setShowJsonModal(false)}
                style={{ color: '#94A3B8', fontSize: '13px' }}
              >
                Close
              </button>
            </div>
            <div style={{ padding: '16px 20px', flex: 1, overflowY: 'auto' }}>
              <p style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '8px' }}>
                Paste custom feature JSON matching <code>{'{"features": {...}}'}</code> or copy current values:
              </p>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                rows={16}
                style={{
                  width: '100%',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  padding: '12px',
                  color: '#06D6E0',
                  background: '#071020',
                  border: '1px solid rgba(40, 120, 255, 0.2)',
                  borderRadius: '6px',
                }}
              />
            </div>
            <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(40, 120, 255, 0.15)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={handleImportJson}
                style={{
                  background: '#2878FF',
                  color: '#FFFFFF',
                  padding: '7px 16px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                Load into Form
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
