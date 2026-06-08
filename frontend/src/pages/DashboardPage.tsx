import {
  AlertTriangle,
  ArrowLeftRight,
  Package,
  PackageX,
  Truck,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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

import { api } from '../api/client';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { StatCard } from '../components/StatCard';
import type { DashboardData } from '../types';

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
];

const chartTooltipStyle = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text)',
};

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const trendData = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, number>();
    data.transaction_trends.forEach((t) => {
      const day = String(t.day).slice(0, 10);
      map.set(day, (map.get(day) || 0) + t.total);
    });
    return Array.from(map.entries()).map(([day, count]) => ({ day, count }));
  }, [data]);

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;
  if (!data) return <div className="empty-state">Unable to load dashboard.</div>;

  const { stats } = data;

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Real-time overview of your inventory operations</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Total Products" value={stats.total_products} icon={Package} />
        <StatCard label="Low Stock Items" value={stats.low_stock_items} icon={AlertTriangle} tone="warning" />
        <StatCard label="Out of Stock" value={stats.out_of_stock_items} icon={PackageX} tone="danger" />
        <StatCard label="Total Suppliers" value={stats.total_suppliers} icon={Truck} tone="success" />
        <StatCard label="Transactions" value={stats.recent_transactions} icon={ArrowLeftRight} />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">Products by Category</div>
          <div className="card-body card-body--chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.category_distribution}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.category_distribution.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">Transaction Activity (30 days)</div>
          <div className="card-body card-body--chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="var(--text-muted)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--text-muted)" />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card card--spaced">
        <div className="card-header">Recent Activity</div>
        <div className="card-body">
          {data.recent_activity.length === 0 ? (
            <div className="empty-state">No recent activity</div>
          ) : (
            <div className="timeline">
              {data.recent_activity.map((item) => (
                <div key={item.id} className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <h4>
                      {item.transaction_type_display}: {item.product_name}
                    </h4>
                    <p>
                      {item.quantity > 0 ? '+' : ''}{item.quantity} units at {item.warehouse_name} ·{' '}
                      {item.created_by_name} · {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
