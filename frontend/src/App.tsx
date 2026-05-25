import {
  AlertTriangle,
  ArrowLeftRight,
  BarChart3,
  Boxes,
  Package,
  PackageX,
  Shield,
  Truck,
  Warehouse,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { StatCard } from './components/StatCard';
import {
  landingCategoryHighlights,
  landingFeatures,
  landingRecentActivity,
  landingStats,
  landingWarehouses,
} from './data/landingDummyData';

interface HelloResponse {
  message: string;
  version: string;
  timestamp: string;
}

type ConnectionStatus = 'loading' | 'connected' | 'error';

const featureIcons = [Boxes, Truck, BarChart3, Shield];

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
    <div className="landing-page" data-theme="dark">
      <header className="landing-header">
        <div className="landing-brand">
          <div className="sidebar-brand-icon">
            <Package size={18} />
          </div>
          <div>
            <h1>StockFlow</h1>
            <p>Inventory Management System</p>
          </div>
        </div>
        <span
          className={`landing-status landing-status--${status}`}
          role="status"
          aria-live="polite"
        >
          {status === 'connected' && 'API Connected'}
          {status === 'loading' && 'Checking API…'}
          {status === 'error' && 'API Offline'}
        </span>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-hero-content">
            <p className="landing-eyebrow">Django + React · Sunset Autopilot</p>
            <h2>Manage inventory with clarity and control</h2>
            <p className="landing-hero-text">
              StockFlow helps teams track products, suppliers, warehouses, and transactions from a
              single dashboard. Preview the platform below with sample data.
            </p>
            <div className="landing-hero-actions">
              <a className="btn btn-primary" href="#overview">
                View Overview
              </a>
              <a className="btn btn-secondary" href="#activity">
                Recent Activity
              </a>
            </div>
          </div>
          <div className="landing-hero-panel card">
            <div className="card-header">Platform Snapshot</div>
            <div className="card-body">
              <ul className="landing-snapshot-list">
                {landingCategoryHighlights.map((category) => (
                  <li key={category.name}>
                    <span>{category.name}</span>
                    <strong>{category.count} products</strong>
                  </li>
                ))}
              </ul>
              <div className="landing-snapshot-divider" />
              <ul className="landing-snapshot-list">
                {landingWarehouses.map((warehouse) => (
                  <li key={warehouse.name}>
                    <span>
                      <Warehouse size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
                      {warehouse.name}
                    </span>
                    <strong>{warehouse.products} SKUs</strong>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="overview" className="landing-section">
          <div className="landing-section-header">
            <h3>Inventory Overview</h3>
            <p>Sample metrics from the demo dataset</p>
          </div>
          <div className="stats-grid">
            <StatCard label="Total Products" value={landingStats.total_products} icon={Package} />
            <StatCard
              label="Low Stock Items"
              value={landingStats.low_stock_items}
              icon={AlertTriangle}
              tone="warning"
            />
            <StatCard
              label="Out of Stock"
              value={landingStats.out_of_stock_items}
              icon={PackageX}
              tone="danger"
            />
            <StatCard
              label="Total Suppliers"
              value={landingStats.total_suppliers}
              icon={Truck}
              tone="success"
            />
            <StatCard
              label="Transactions"
              value={landingStats.recent_transactions}
              icon={ArrowLeftRight}
            />
          </div>
        </section>

        <section className="landing-section">
          <div className="landing-section-header">
            <h3>Core Capabilities</h3>
            <p>Everything you need to run day-to-day inventory operations</p>
          </div>
          <div className="landing-features">
            {landingFeatures.map((feature, index) => {
              const Icon = featureIcons[index] ?? Boxes;
              return (
                <article key={feature.title} className="landing-feature card">
                  <div className="landing-feature-icon">
                    <Icon size={22} />
                  </div>
                  <h4>{feature.title}</h4>
                  <p>{feature.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="activity" className="landing-section">
          <div className="landing-section-header">
            <h3>Recent Activity</h3>
            <p>Latest stock movements from the demo environment</p>
          </div>
          <div className="card">
            <div className="card-body">
              <div className="timeline">
                {landingRecentActivity.map((item) => (
                  <div key={item.id} className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <h4>
                        {item.transaction_type_display}: {item.product_name}
                      </h4>
                      <p>
                        {item.quantity > 0 ? '+' : ''}
                        {item.quantity} units at {item.warehouse_name} · {item.created_by_name} ·{' '}
                        {formatTimestamp(item.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer-content">
          <p>
            Demo credentials: <code>admin</code> / <code>admin12345</code> · nginx serves this page ·{' '}
            <code>/api/*</code> proxies to Django
          </p>
          {loading ? (
            <p className="landing-footer-meta">Checking backend…</p>
          ) : error ? (
            <p className="landing-footer-meta landing-footer-meta--error" role="alert">
              Backend unavailable ({error}).{' '}
              <button type="button" className="landing-retry" onClick={fetchHello}>
                Retry
              </button>
            </p>
          ) : data ? (
            <p className="landing-footer-meta">
              {data.message} · v{data.version} · {formatTimestamp(data.timestamp)}
            </p>
          ) : null}
        </div>
      </footer>
    </div>
  );
}

export default App;
