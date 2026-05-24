import { useCallback, useEffect, useState } from 'react';


interface HelloResponse {
  message: string;
  version: string;
  timestamp: string;
}


type ConnectionStatus = 'loading' | 'connected' | 'error';


function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}


function App() {
  const [data, setData] = useState<HelloResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHello = useCallback(() => {
    setLoading(true);
    setError(null);

    fetch('/api/hello/')
      .then((res) => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then((j: HelloResponse) => {
        setData(j);
        setError(null);
      })
      .catch((err: Error) => {
        setData(null);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchHello();
  }, [fetchHello]);

  const status: ConnectionStatus = loading ? 'loading' : error ? 'error' : 'connected';

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.h1}>Django + React</h1>
            <p style={styles.subtitle}>Sunset Autopilot preview deploy target.</p>
          </div>
          <span
            style={{
              ...styles.statusBadge,
              ...(status === 'connected' ? styles.statusConnected : {}),
              ...(status === 'loading' ? styles.statusLoading : {}),
              ...(status === 'error' ? styles.statusError : {}),
            }}
            role="status"
            aria-live="polite"
          >
            {status === 'connected' && 'Connected'}
            {status === 'loading' && 'Checking…'}
            {status === 'error' && 'Error'}
          </span>
        </div>

        <div style={styles.section} aria-live="polite">
          <div style={styles.sectionLabel}>Backend response</div>
          {loading ? (
            <div style={styles.loadingRow} role="status" aria-label="Loading backend response">
              <span style={styles.spinner} aria-hidden="true" />
              <span style={styles.meta}>Fetching from Django…</span>
            </div>
          ) : error ? (
            <div>
              <p style={styles.error} role="alert">
                {error}
              </p>
              <button type="button" style={styles.retryButton} onClick={fetchHello}>
                Retry
              </button>
            </div>
          ) : data ? (
            <div style={styles.responseContent}>
              <p style={styles.message}>{data.message}</p>
              <p style={styles.meta}>
                v{data.version} · {formatTimestamp(data.timestamp)}
              </p>
            </div>
          ) : null}
        </div>

        <div style={styles.footer}>
          nginx serves this page · /api/* proxies to the Django sidecar on the same ECS
          task.
        </div>
      </div>
    </div>
  );
}


const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    color: '#f1f5f9',
    padding: 24,
  },
  card: {
    maxWidth: 560,
    width: '100%',
    background: '#0b1220',
    border: '1px solid #1f2937',
    borderRadius: 12,
    padding: 32,
    boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
    transition: 'box-shadow 0.2s ease',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
  },
  h1: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
  },
  subtitle: {
    marginTop: 6,
    color: '#94a3b8',
    fontSize: 14,
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    border: '1px solid transparent',
    flexShrink: 0,
  },
  statusConnected: {
    color: '#34d399',
    background: 'rgba(52, 211, 153, 0.12)',
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  statusLoading: {
    color: '#94a3b8',
    background: 'rgba(148, 163, 184, 0.1)',
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  statusError: {
    color: '#f87171',
    background: 'rgba(248, 113, 113, 0.12)',
    borderColor: 'rgba(248, 113, 113, 0.35)',
  },
  section: {
    marginTop: 24,
    padding: 16,
    background: '#0f1a2e',
    border: '1px solid #1e293b',
    borderRadius: 8,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#64748b',
    marginBottom: 8,
  },
  loadingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  spinner: {
    width: 16,
    height: 16,
    border: '2px solid #334155',
    borderTopColor: '#22d3ee',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    flexShrink: 0,
  },
  responseContent: {
    animation: 'fadeIn 0.25s ease',
  },
  message: {
    margin: 0,
    fontSize: 20,
    fontWeight: 600,
    color: '#22d3ee',
  },
  meta: {
    margin: '6px 0 0',
    color: '#94a3b8',
    fontSize: 12,
  },
  error: {
    margin: 0,
    color: '#f87171',
    fontSize: 14,
  },
  retryButton: {
    marginTop: 12,
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: 'inherit',
    color: '#f1f5f9',
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'background 0.15s ease, border-color 0.15s ease',
  },
  footer: {
    marginTop: 24,
    fontSize: 11,
    color: '#64748b',
    lineHeight: 1.6,
  },
};


export default App;
