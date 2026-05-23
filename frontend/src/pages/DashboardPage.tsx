import { useEffect, useState } from 'react';
import {
  Package, AlertTriangle, XCircle, Truck, Activity,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import api from '../lib/api';
import type { DashboardData } from '../types';
import { StatCard, Loading, Badge } from '../components/ui';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const TX_LABELS: Record<string, string> = {
  purchase: 'Purchase',
  sale: 'Sale',
  return: 'Return',
  adjustment: 'Adjustment',
  stock_in: 'Stock In',
  stock_out: 'Stock Out',
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/inventory/dashboard/')
      .then(({ data: d }) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (!data) return null;

  const pieData = data.category_breakdown.map((c) => ({
    name: c.name,
    value: c.product_count,
  }));

  const txData = data.transaction_by_type.map((t) => ({
    name: TX_LABELS[t.transaction_type] || t.transaction_type,
    count: t.count,
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-slate-500">Real-time overview of your inventory</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total Products" value={data.total_products} icon={<Package className="h-6 w-6" />} color="brand" />
        <StatCard title="Low Stock" value={data.low_stock_items} icon={<AlertTriangle className="h-6 w-6" />} color="amber" />
        <StatCard title="Out of Stock" value={data.out_of_stock_items} icon={<XCircle className="h-6 w-6" />} color="red" />
        <StatCard title="Suppliers" value={data.total_suppliers} icon={<Truck className="h-6 w-6" />} color="violet" />
        <StatCard title="Unread Alerts" value={data.unread_notifications} icon={<Activity className="h-6 w-6" />} color="emerald" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 font-semibold">Products by Category</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-slate-500">No category data</p>
          )}
        </div>

        <div className="card">
          <h3 className="mb-4 font-semibold">Transactions by Type</h3>
          {txData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={txData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-slate-500">No transaction data</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h3 className="mb-4 font-semibold">Activity (Last 30 Days)</h3>
          {data.daily_activity.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.daily_activity}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-slate-500">No recent activity</p>
          )}
        </div>

        <div className="card">
          <h3 className="mb-4 font-semibold">Recent Transactions</h3>
          <div className="space-y-3">
            {data.recent_transactions.slice(0, 8).map((tx) => (
              <div key={tx.id} className="flex items-start justify-between border-b border-slate-100 pb-3 last:border-0 dark:border-slate-800">
                <div>
                  <p className="text-sm font-medium">{tx.product_name}</p>
                  <p className="text-xs text-slate-500">
                    {TX_LABELS[tx.transaction_type] || tx.transaction_type} · Qty {tx.quantity}
                  </p>
                </div>
                <Badge variant="info">{new Date(tx.created_at).toLocaleDateString()}</Badge>
              </div>
            ))}
            {data.recent_transactions.length === 0 && (
              <p className="text-sm text-slate-500">No transactions yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
