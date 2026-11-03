
/**
 * Centralized API service for AI-Based Security Attack System.
 * Handles FastAPI communication, timeouts, and error normalization.
 */

const API_BASE =
  import.meta.env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

async function request(endpoint, options = {}) {
  const primaryUrl = `${API_BASE}${endpoint}`;

  async function performFetch(targetUrl) {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      options.timeout || 10000
    );

    try {
      const res = await fetch(targetUrl, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });

      if (!res.ok) {
        let errorData;

        try {
          errorData = await res.json();
        } catch {
          errorData = {
            detail: `HTTP ${res.status}: ${res.statusText}`,
          };
        }

        const err = new Error(
          typeof errorData.detail === 'string'
            ? errorData.detail
            : errorData.detail?.message ||
                `Request failed with status ${res.status}`
        );

        err.status = res.status;
        err.data = errorData;
        throw err;
      }

      return await res.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        const abortErr = new Error(
          'Connection timed out. The backend server took too long to respond.'
        );
        abortErr.status = 408;
        throw abortErr;
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return performFetch(primaryUrl);
}

export const api = {
  getModelInfo() { return request("/model-info"); },
  getExplanation() { return request("/explain"); },
  startReplay() { return request('/monitoring/start', { method: 'POST', body: JSON.stringify({limit: 20, interval_seconds: 1}) }); },
  stopReplay() { return request('/monitoring/stop', { method: 'POST' }); },
  getMonitoringStatus() { return request("/monitoring/status"); },
  getBaseUrl() {
    return API_BASE;
  },

  async getHealth() {
    return request('/health');
  },

  async getInfo() {
    return request('/');
  },

  async getHistory(limit = 20, params = {}) {
    const validLimit = Math.min(
      Math.max(Number(limit) || 20, 1),
      100
    );

    return request(`/history?${new URLSearchParams({ limit: validLimit, ...params })}`);
  },

  // Fetch actual model evaluation metrics from the backend.
  async getEvaluation() {
    return request('/evaluation');
  },

  // Start the backend's offline CIC-IDS2017 test-dataset prediction job.
  // This is deliberately separate from live prediction history.
  async startDatasetPredictions() {
    return request('/dataset-predictions/run', {
      method: 'POST',
      timeout: 15000,
    });
  },

  async getDatasetPredictionStatus() {
    return request('/dataset-predictions/status', { timeout: 15000 });
  },

  async predict(features) {
    return request('/predict', {
      method: 'POST',
      body: JSON.stringify({ features }),
      timeout: 15000,
    });
  },
};
