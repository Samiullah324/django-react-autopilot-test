import { useEffect, useState } from 'react';

import { ThemeToggle } from './theme/ThemeToggle';


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
    <div className="page">
      <div className="card">
        <ThemeToggle />

        <h1 className="card__title">Django + React</h1>
        <p className="card__subtitle">Sunset Autopilot preview deploy target.</p>

        <div className="section">
          <div className="section__label">Backend response</div>
          {data ? (
            <>
              <p className="section__message">{data.message}</p>
              <p className="section__meta">v{data.version} - {data.timestamp}</p>
            </>
          ) : error ? (
            <p className="section__error">{error}</p>
          ) : (
            <p className="section__meta">Loading...</p>
          )}
        </div>

        <div className="card__footer">
          nginx serves this page - /api/* proxies to the Django sidecar on
          the same ECS task.
        </div>
      </div>
    </div>
  );
}


export default App;
