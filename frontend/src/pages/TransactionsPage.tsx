import { useEffect, useState } from 'react';
import { Download, Filter } from 'lucide-react';
import api from '../lib/api';
import { downloadFile } from '../lib/download';
import type { InventoryTransaction, PaginatedResponse } from '../types';
import { Loading, Badge, EmptyState } from '../components/ui';

const TX_LABELS: Record<string, string> = {
  purchase: 'Purchase', sale: 'Sale', return: 'Return',
  adjustment: 'Adjustment', stock_in: 'Stock In', stock_out: 'Stock Out',
};

const TX_VARIANTS: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  purchase: 'success', stock_in: 'success', return: 'info',
  sale: 'warning', stock_out: 'danger', adjustment: 'default',
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (typeFilter) params.transaction_type = typeFilter;
    api.get<PaginatedResponse<InventoryTransaction>>('/inventory/transactions/', { params })
      .then(({ data }) => setTransactions(data.results))
      .finally(() => setLoading(false));
  }, [typeFilter]);

  const downloadReport = async (format: string) => {
    const params = new URLSearchParams({ format });
    if (typeFilter) params.set('transaction_type', typeFilter);
    await downloadFile(`/inventory/transactions/report/?${params}`, `transactions.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-sm text-slate-500">Complete inventory transaction history</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => downloadReport('xlsx')} className="btn-secondary"><Download className="h-4 w-4" /> Excel</button>
          <button onClick={() => downloadReport('pdf')} className="btn-secondary"><Download className="h-4 w-4" /> PDF</button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-slate-400" />
        <select className="input sm:w-48" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All types</option>
          {Object.entries(TX_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {loading ? <Loading /> : transactions.length === 0 ? (
        <EmptyState title="No transactions" />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left dark:border-slate-800">
                <th className="px-6 py-3 font-medium text-slate-500">Date</th>
                <th className="px-6 py-3 font-medium text-slate-500">Type</th>
                <th className="px-6 py-3 font-medium text-slate-500">Product</th>
                <th className="px-6 py-3 font-medium text-slate-500">Warehouse</th>
                <th className="px-6 py-3 font-medium text-slate-500">Qty</th>
                <th className="px-6 py-3 font-medium text-slate-500">By</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-slate-100 dark:border-slate-800/50">
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(tx.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4"><Badge variant={TX_VARIANTS[tx.transaction_type] || 'default'}>{TX_LABELS[tx.transaction_type] || tx.transaction_type}</Badge></td>
                  <td className="px-6 py-4">{tx.product_name} <span className="text-slate-400">({tx.product_sku})</span></td>
                  <td className="px-6 py-4">{tx.warehouse_name}</td>
                  <td className="px-6 py-4 font-medium">{tx.quantity}</td>
                  <td className="px-6 py-4 text-slate-500">{tx.performed_by_name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
