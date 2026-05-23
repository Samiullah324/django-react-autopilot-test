import { useEffect, useState } from 'react';


interface HelloResponse {
  message: string;
  version: string;
  timestamp: string;
}


function App() {
  const [data, setData] = useState<HelloResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/hello/')
      .then((res) => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then((j: HelloResponse) => setData(j))
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.h1}>Django + React</h1>
        <p style={styles.subtitle}>Sunset Autopilot preview deploy target.</p>

        <div style={styles.section}>
          <div style={styles.sectionLabel}>Backend response</div>
          {data ? (
            <>
              <p style={styles.message}>{data.message}</p>
              <p style={styles.meta}>v{data.version} - {data.timestamp}</p>
            </>
          ) : error ? (
            <p style={styles.error}>{error}</p>
          ) : (
            <p style={styles.meta}>Loading...</p>
          )}
        </div>

        <div style={styles.footer}>
          nginx serves this page - /api/* proxies to the Django sidecar on
          the same ECS task.
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
  footer: {
    marginTop: 24,
    fontSize: 11,
    color: '#64748b',
    lineHeight: 1.6,
  },
};


export default App;
