// Counts describe saved predictions; no packet collection or mitigation is inferred.
export function topologyMetrics(summary, health) {
  const count = value => Number.isSafeInteger(value) && value >= 0 ? value : null;
  const total = count(summary?.total);
  const features = health?.model_loaded ? count(health.expected_features) : null;
  return {
    ingress: {label:'Saved Input Flows', unit:'saved flows', value:total},
    extractor: {label:'Model Input Schema', unit:'features per flow', value:features},
    model: {label:'Classified Flows', unit:'saved predictions', value:total},
    database: {label:'Prediction History', unit:'database records', value:total},
    workloads: {label:'Benign Predictions', unit:'benign classified', value:count(summary?.benign)},
    quarantine: {label:'Attack Predictions', unit:'attack classified', value:count(summary?.attacks)},
  };
}
export function displayCount(value) {
  return value == null ? '—' : new Intl.NumberFormat('en', {notation:'compact', maximumFractionDigits:1}).format(value);
}
