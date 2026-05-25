import {
  AlertTriangle,
  ArrowLeftRight,
  Boxes,
  Package,
  PackageX,
  Truck,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { StatCard } from '../components/StatCard';
import {
  landingCategoryDistribution,
  landingFeatures,
  landingLowStockItems,
  landingRecentActivity,
  landingStats,
  landingTransactionTrends,
} from '../data/landingDummyData';

interface HelloResponse {
  message: string;
  version: string;
  timestamp: string;
}

type ConnectionStatus = 'loading' | 'connected' | 'error';

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function LandingPage() {
  const [backendData, setBackendData] = useState<HelloResponse | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [backendLoading, setBackendLoading] = useState(true);

  const fetchHello = useCallback(() => {
    setBackendLoading(true);
    setBackendError(null);

    fetch('/api/hello/')
      .then((res) => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then((payload: HelloResponse) => {
        setBackendData(payload);
        setBackendError(null);
      })
      .catch((err: Error) => {
        setBackendData(null);
        setBackendError(err.message);
      })
      .finally(() => setBackendLoading(false));
  }, []);

  useEffect(() => {
    fetchHello();
  }, [fetchHello]);

  const status: ConnectionStatus = backendLoading ? 'loading' : backendError ? 'error' : 'connected';

  return (
    <div className="landing-page">
      <header className="landing-hero">
        <div className="landing-hero-content">
          <div className="landing-brand">
            <div className="landing-brand-icon">
              <Boxes size={22} />
            </div>
            <div>
              <p className="landing-eyebrow">Inventory Management</p>
              <h1>StockFlow</h1>
            </div>
          </div>
          <p className="landing-tagline">
            A modern inventory platform for tracking products, suppliers, warehouses, and
            transactions — powered by Django and React.
          </p>
          <div className="landing-hero-actions">
            <span className="landing-demo-badge">Preview with demo data</span>
          </div>
        </div>

        <aside className="landing-status-card" aria-live="polite">
          <div className="landing-status-header">
            <span className="landing-status-label">Backend status</span>
            <span
              className={`landing-status-badge landing-status-${status}`}
              role="status"
            >
              {status === 'connected' && 'Connected'}
              {status === 'loading' && 'Checking…'}
              {status === 'error' && 'Error'}
            </span>
          </div>
          {backendLoading ? (
            <p className="landing-status-meta">Fetching from Django…</p>
          ) : backendError ? (
            <div>
              <p className="landing-status-error" role="alert">
                {backendError}
              </p>
              <button type="button" className="btn btn-secondary" onClick={fetchHello}>
                Retry
              </button>
            </div>
          ) : backendData ? (
            <div>
              <p className="landing-status-message">{backendData.message}</p>
              <p className="landing-status-meta">
                v{backendData.version} · {formatTimestamp(backendData.timestamp)}
              </p>
            </div>
          ) : null}
        </aside>
      </header>

      <main className="landing-main">
        <section className="landing-section">
          <div className="page-header">
            <div>
              <h2>Overview</h2>
              <p>Sample metrics shown below use static demo data for this landing preview.</p>
            </div>
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
              label="Transactions (30d)"
              value={landingStats.recent_transactions}
              icon={ArrowLeftRight}
            />
          </div>
        </section>

        <section className="landing-section">
          <div className="grid-2">
            <div className="card">
              <div className="card-header">Products by Category</div>
              <div className="card-body" style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={landingCategoryDistribution}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {landingCategoryDistribution.map((_, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="card-header">Transaction Activity (7 days)</div>
              <div className="card-body" style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={landingTransactionTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11 }}
                      stroke="var(--text-muted)"
                      tickFormatter={(value) => String(value).slice(5)}
                    />
                    <YAxis tick={{ fontSize: 11 }} stroke="var(--text-muted)" />
                    <Tooltip />
                    <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section">
          <div className="landing-features">
            {landingFeatures.map((feature) => (
              <article key={feature.title} className="landing-feature-card">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section grid-2">
          <div className="card">
            <div className="card-header">Recent Activity</div>
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
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">Low Stock Alerts</div>
            <div className="card-body table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Product</th>
                    <th>Warehouse</th>
                    <th>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {landingLowStockItems.map((item) => (
                    <tr key={item.sku}>
                      <td>{item.sku}</td>
                      <td>{item.name}</td>
                      <td>{item.warehouse}</td>
                      <td>
                        <span className="badge badge-warning">
                          {item.quantity} / {item.threshold}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
