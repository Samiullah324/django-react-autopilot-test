import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  Package,
  PackageX,
  RefreshCw,
  Truck,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { StatCard } from '../components/StatCard';
import { StockBadge } from '../components/StockBadge';
import {
  categorySummary,
  featuredProducts,
  landingHighlights,
  landingStats,
  recentActivity,
} from '../data/landingDummyData';

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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

export function LandingPage() {
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
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-header-inner">
          <div className="landing-brand">
            <Package size={22} aria-hidden="true" />
            <span>Inventory Management</span>
          </div>
          <span
            className={`landing-status landing-status--${status}`}
            role="status"
            aria-live="polite"
          >
            {status === 'connected' && 'Backend connected'}
            {status === 'loading' && 'Checking backend…'}
            {status === 'error' && 'Backend unavailable'}
          </span>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-hero-content">
            <p className="landing-eyebrow">Sunset Autopilot · DJAN-0004</p>
            <h1>Inventory management, simplified</h1>
            <p className="landing-hero-subtitle">
              Track products, suppliers, and warehouse stock in one place. The preview below uses
              dummy data to showcase the dashboard experience.
            </p>
            <ul className="landing-highlights">
              {landingHighlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="landing-hero-actions">
              <button type="button" className="btn btn-primary">
                Get started
                <ArrowRight size={16} aria-hidden="true" />
              </button>
              <button type="button" className="btn btn-secondary">
                View documentation
              </button>
            </div>
          </div>
        </section>

        <section className="landing-section">
          <div className="landing-section-header">
            <h2>Overview</h2>
            <p>Sample metrics from demo inventory data</p>
          </div>
          <div className="stats-grid">
            <StatCard label="Total Products" value={landingStats.totalProducts} icon={Package} />
            <StatCard
              label="Low Stock Items"
              value={landingStats.lowStockItems}
              icon={AlertTriangle}
              tone="warning"
            />
            <StatCard
              label="Out of Stock"
              value={landingStats.outOfStockItems}
              icon={PackageX}
              tone="danger"
            />
            <StatCard
              label="Total Suppliers"
              value={landingStats.totalSuppliers}
              icon={Truck}
              tone="success"
            />
            <StatCard
              label="Transactions"
              value={landingStats.recentTransactions.toLocaleString()}
              icon={ArrowLeftRight}
            />
          </div>
        </section>

        <div className="landing-grid">
          <section className="landing-section">
            <div className="landing-section-header">
              <h2>Featured products</h2>
              <p>Popular items with current stock levels</p>
            </div>
            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Qty</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {featuredProducts.map((product) => (
                      <tr key={product.id}>
                        <td>{product.name}</td>
                        <td className="text-muted">{product.sku}</td>
                        <td>{product.category}</td>
                        <td>{formatCurrency(product.price)}</td>
                        <td>{product.quantity}</td>
                        <td>
                          <StockBadge status={product.stockStatus} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <aside className="landing-aside">
            <section className="landing-section">
              <div className="landing-section-header">
                <h2>Categories</h2>
                <p>Product distribution</p>
              </div>
              <div className="card">
                <div className="card-body">
                  <ul className="category-list">
                    {categorySummary.map((category) => (
                      <li key={category.name} className="category-list-item">
                        <span>{category.name}</span>
                        <span className="category-count">{category.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section className="landing-section">
              <div className="landing-section-header">
                <h2>Recent activity</h2>
                <p>Latest stock movements</p>
              </div>
              <div className="card">
                <div className="card-body">
                  <div className="timeline">
                    {recentActivity.map((item) => (
                      <div key={item.id} className="timeline-item">
                        <span className="timeline-dot" aria-hidden="true" />
                        <div className="timeline-content">
                          <h4>
                            {item.type} · {item.productName}
                          </h4>
                          <p>
                            {item.quantity > 0 ? '+' : ''}
                            {item.quantity} units · {item.warehouse} · {item.user}
                          </p>
                          <p>{formatTimestamp(item.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>

        <section className="landing-section landing-backend">
          <div className="landing-section-header">
            <h2>Backend status</h2>
            <p>Live response from the Django API sidecar</p>
          </div>
          <div className="card">
            <div className="card-body" aria-live="polite">
              {loading ? (
                <div className="landing-loading">
                  <span className="landing-spinner" aria-hidden="true" />
                  <span>Fetching from Django…</span>
                </div>
              ) : error ? (
                <div className="landing-backend-error">
                  <p className="error-banner">{error}</p>
                  <button type="button" className="btn btn-secondary" onClick={fetchHello}>
                    <RefreshCw size={14} aria-hidden="true" />
                    Retry
                  </button>
                </div>
              ) : data ? (
                <div className="landing-backend-response">
                  <p className="landing-backend-message">{data.message}</p>
                  <p className="text-muted">
                    v{data.version} · {formatTimestamp(data.timestamp)}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        nginx serves this page · /api/* proxies to the Django sidecar on the same ECS task.
      </footer>
    </div>
  );
}
