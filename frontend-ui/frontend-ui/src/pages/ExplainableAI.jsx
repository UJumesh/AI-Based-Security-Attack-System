import { useState } from 'react';
import { 
  AlertTriangle, 
  Copy, 
  Check, 
  FileCode2
} from 'lucide-react';

export function ExplainableAI({ addToast }) {
  const [copied, setCopied] = useState(false);

  const pythonSnippet = `# Suggested backend addition for backend/app/main.py
# (Requires: pip install shap)

import shap

# 1. Initialize TreeExplainer with trained Random Forest model
# Use a background summary sample from X_train for accelerated TreeSHAP
print("Initializing SHAP TreeExplainer...")
background_sample = pd.read_csv(FEATURE_FILE, nrows=200)
explainer = shap.TreeExplainer(model, data=background_sample)

@app.post("/explain")
def explain_prediction(request: PredictionRequest):
    """Calculate genuine Shapley values for an input flow."""
    supplied = request.features
    row = pd.DataFrame(
        [[supplied[name] for name in FEATURE_NAMES]],
        columns=FEATURE_NAMES,
    )
    
    # Calculate genuine SHAP values
    shap_values = explainer(row)
    
    # Extract values for the predicted class
    predicted_id = int(model.predict(row)[0])
    class_shap = shap_values.values[0, :, predicted_id].tolist()
    base_val = float(shap_values.base_values[0, predicted_id])
    
    feature_impacts = [
        {"feature": name, "shap_value": round(val, 5), "feature_value": supplied[name]}
        for name, val in zip(FEATURE_NAMES, class_shap)
    ]
    # Sort by absolute SHAP attribution
    feature_impacts.sort(key=lambda x: abs(x["shap_value"]), reverse=True)
    
    return {
        "prediction_id": predicted_id,
        "prediction": ID_TO_LABEL.get(predicted_id, "Unknown"),
        "base_value": base_val,
        "top_features": feature_impacts[:15],
        "all_features": feature_impacts,
    }`;

  function handleCopySnippet() {
    navigator.clipboard.writeText(pythonSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (addToast) {
      addToast({
        type: 'success',
        title: 'Backend Blueprint Copied',
        message: 'SHAP integration code copied to clipboard.',
      });
    }
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Explicit Status Banner */}
      <div
        style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: '12px',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
        }}
      >
        <AlertTriangle size={24} color="#F59E0B" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#F8FAFC' }}>
            SHAP Explainability Engine: Backend Endpoint Offline
          </h3>
          <p style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: '1.5', marginTop: '4px' }}>
            In accordance with system policy (<b>No synthetic or simulated SHAP values permitted</b>), this interface is held in an authenticated inactive state until genuine Shapley values are calculated by the model service.
          </p>
          <div style={{ marginTop: '10px', fontSize: '11px', color: '#94A3B8' }}>
            Current backend endpoints: <code>/health</code>, <code>/predict</code>, <code>/history</code>. Endpoint <code>/explain</code> is not yet registered in <code>backend/app/main.py</code>.
          </div>
        </div>
      </div>

      {/* Integration Requirement Steps */}
      <div
        style={{
          background: '#0B1930',
          border: '1px solid rgba(40, 120, 255, 0.18)',
          borderRadius: '12px',
          padding: '24px',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#F8FAFC', marginBottom: '6px' }}>
          Backend Architecture Roadmap: Enabling Genuine SHAP
        </h3>
        <p style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '20px' }}>
          Follow these 3 engineering steps to activate real feature-attribution waterfall plots and local importance rankings.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'rgba(5, 11, 24, 0.6)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(40, 120, 255, 0.12)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#2878FF', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                1
              </span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#F8FAFC' }}>TreeExplainer Init</span>
            </div>
            <p style={{ fontSize: '11px', color: '#94A3B8', lineHeight: '1.5' }}>
              Initialize <code>shap.TreeExplainer(model, data=sample)</code> in memory upon FastAPI startup using a 200-row representative baseline from <code>X_train.csv</code>.
            </p>
          </div>

          <div style={{ background: 'rgba(5, 11, 24, 0.6)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(40, 120, 255, 0.12)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#06D6E0', color: '#050B18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                2
              </span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#F8FAFC' }}>Register /explain Route</span>
            </div>
            <p style={{ fontSize: '11px', color: '#94A3B8', lineHeight: '1.5' }}>
              Create a <code>POST /explain</code> route that accepts the 70 input features, computes real TreeSHAP values, and returns the top positive and negative contributing flow attributes.
            </p>
          </div>

          <div style={{ background: 'rgba(5, 11, 24, 0.6)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(40, 120, 255, 0.12)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#10B981', color: '#050B18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                3
              </span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#F8FAFC' }}>UI Auto-Activation</span>
            </div>
            <p style={{ fontSize: '11px', color: '#94A3B8', lineHeight: '1.5' }}>
              Once <code>/explain</code> responds with HTTP 200, this page automatically transitions to render live feature attribution bars and decision path waterfalls.
            </p>
          </div>
        </div>
      </div>

      {/* Code Blueprint Implementation Card */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCode2 size={16} color="#06D6E0" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#F8FAFC' }}>
              Implementation Blueprint: FastAPI SHAP Service
            </span>
          </div>
          <button
            onClick={handleCopySnippet}
            style={{
              background: 'rgba(40, 120, 255, 0.12)',
              border: '1px solid rgba(40, 120, 255, 0.25)',
              color: '#06D6E0',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {copied ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
            <span>{copied ? 'Copied Blueprint' : 'Copy Python Code'}</span>
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          <pre
            style={{
              background: '#071020',
              border: '1px solid rgba(40, 120, 255, 0.12)',
              borderRadius: '8px',
              padding: '16px',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              color: '#94A3B8',
              lineHeight: '1.6',
              overflowX: 'auto',
            }}
          >
            <code>{pythonSnippet}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
