import { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import { api } from './services/api';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { ToastContainer } from './components/Toast';
import { DatasetSummary } from './components/DatasetSummary';

// Pages
import { Overview } from './pages/Overview';
import { LiveMonitoring } from './pages/LiveMonitoring';
import { PredictionLab } from './pages/PredictionLab';
import { EventHistory } from './pages/EventHistory';
import { AttackAnalytics } from './pages/AttackAnalytics';
import { ModelPerformance } from './pages/ModelPerformance';
import { ExplainableAI } from './pages/ExplainableAI';
import { SystemStatus } from './pages/SystemStatus';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [history, setHistory] = useState([]);
  const [healthStatus, setHealthStatus] = useState(null);
  const [historyLimit, setHistoryLimit] = useState(20);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(10000);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [toasts, setToasts] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Toast dispatch
  const toastIdRef = useRef(0);

  const addToast = useCallback(
    ({ type = 'info', title, message, duration = 4500 }) => {
      toastIdRef.current += 1;
      const id = toastIdRef.current;

      setToasts((prev) => [
        ...prev,
        { id, type, title, message, duration },
      ]);
    },
    []
  );

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Fetch real data from FastAPI backend
  const fetchData = useCallback(
    async (isManual = false) => {
      if (isManual) {
        setIsRefreshing(true);
      }

      let fetchError = '';

      // 1. Fetch backend health
      try {
        const healthData = await api.getHealth();

        setHealthStatus(healthData);

        if (healthData.status === 'degraded') {
          fetchError =
            'PostgreSQL database is currently disconnected. Stored history is unavailable.';
        }
      } catch (err) {
        setHealthStatus({
          status: 'offline',
          model_loaded: false,
          database_connected: false,
        });

        fetchError =
          err.message ||
          'Unable to connect to FastAPI backend (http://127.0.0.1:8000). Verify server is running.';
      }

      // 2. Fetch live prediction history
      try {
        const histData = await api.getHistory(historyLimit);

        const list = Array.isArray(histData)
          ? histData
          : histData.history || [];

        setHistory(list);
      } catch {
        // Preserve the previous history if the request fails.
      }

      setError(fetchError);
      setIsLoading(false);
      setIsRefreshing(false);
    },
    [historyLimit]
  );

  // Initial load and refresh when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Automatic polling
  useEffect(() => {
    if (autoRefreshInterval <= 0) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      fetchData();
    }, autoRefreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefreshInterval, fetchData]);

  // Refresh history after a successful prediction
  function handlePredictionSuccess() {
    fetchData();
  }

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        healthStatus={healthStatus}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        <Navbar
          activeTab={activeTab}
          onRefresh={() => fetchData(true)}
          isRefreshing={isRefreshing}
          healthStatus={healthStatus}
          setMobileOpen={setMobileOpen}
          autoRefreshInterval={autoRefreshInterval}
          setAutoRefreshInterval={setAutoRefreshInterval}
        />

        <main className="content-area">
          {/* Overview Dashboard */}
          {activeTab === 'overview' && (
            <>
              <DatasetSummary />

              <Overview
                history={history}
                isLoading={isLoading}
                error={error}
                onRefresh={() => fetchData(true)}
                setActiveTab={setActiveTab}
              />
            </>
          )}

          {/* Live Monitoring */}
          {activeTab === 'monitoring' && (
            <LiveMonitoring
              history={history}
              healthStatus={healthStatus}
              isLoading={isLoading}
              error={error}
              onRefresh={() => fetchData(true)}
              setActiveTab={setActiveTab}
            />
          )}

          {/* Manual Prediction */}
          {activeTab === 'prediction-lab' && (
            <PredictionLab
              onPredictionSuccess={handlePredictionSuccess}
              addToast={addToast}
            />
          )}

          {/* PostgreSQL Prediction History */}
          {activeTab === 'history' && (
            <EventHistory
              history={history}
              isLoading={isLoading}
              onRefresh={() => fetchData(true)}
              limit={historyLimit}
              setLimit={setHistoryLimit}
              addToast={addToast}
            />
          )}

          {/* Attack Analytics */}
          {activeTab === 'analytics' && (
            <AttackAnalytics
              history={history}
              setActiveTab={setActiveTab}
            />
          )}

          {/* Model Performance */}
          {activeTab === 'performance' && (
            <ModelPerformance />
          )}

          {/* Explainable AI */}
          {activeTab === 'explainability' && (
            <ExplainableAI addToast={addToast} />
          )}

          {/* System Status */}
          {activeTab === 'status' && (
            <SystemStatus
              healthStatus={healthStatus}
              onRefresh={() => fetchData(true)}
              isRefreshing={isRefreshing}
              error={error}
              addToast={addToast}
            />
          )}
        </main>
      </div>

      {/* Global Toast Notifications */}
      <ToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
      />
    </div>
  );
}
