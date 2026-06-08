import { Download } from 'lucide-react';
import { downloadFile } from '../utils/download';
import { useEffect, useState } from 'react';

import { api } from '../api/client';
import type { Transaction } from '../types';

export function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [typeFilter, setTypeFilter] = useState('');

  const load = async () => {
    const params: Record<string, string> = {};
    if (typeFilter) params.transaction_type = typeFilter;
    const res = await api.transactions(params);
    setTransactions(res.results);
  };

  useEffect(() => {
    load();
  }, [typeFilter]);

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Transactions</h2>
          <p>Complete inventory transaction history</p>
        </div>
        <div className="btn-group">
          <button className="btn btn-secondary" onClick={() => downloadFile('/api/transactions/export/?format=xlsx', 'transactions.xlsx')}>
            <Download size={16} /> Excel
          </button>
          <button className="btn btn-secondary" onClick={() => downloadFile('/api/transactions/export/?format=pdf', 'transactions.pdf')}>
            <Download size={16} /> PDF
          </button>
        </div>
      </div>

      <div className="filters-bar">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All types</option>
          <option value="purchase">Purchase</option>
          <option value="sale">Sale</option>
          <option value="return">Return</option>
          <option value="adjustment">Adjustment</option>
          <option value="stock_in">Stock In</option>
          <option value="stock_out">Stock Out</option>
        </select>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Product</th>
                <th>Warehouse</th>
                <th>Qty</th>
                <th>Before → After</th>
                <th>By</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td><span className="badge badge-neutral">{t.transaction_type_display}</span></td>
                  <td>{t.product_name} <small className="text-muted">({t.product_sku})</small></td>
                  <td>{t.warehouse_name}</td>
                  <td>{t.quantity > 0 ? '+' : ''}{t.quantity}</td>
                  <td>{t.previous_quantity} → {t.new_quantity}</td>
                  <td>{t.created_by_name || '—'}</td>
                  <td>{new Date(t.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
