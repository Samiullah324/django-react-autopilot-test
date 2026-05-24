import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { StockBadge } from '../components/StockBadge';
import type { Product, Warehouse } from '../types';

export function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [moveType, setMoveType] = useState<'stock_in' | 'stock_out'>('stock_in');
  const [form, setForm] = useState({
    product_id: '',
    warehouse_id: '',
    quantity: '',
    notes: '',
    reference_number: '',
  });
  const [message, setMessage] = useState('');

  const load = async () => {
    const [prods, whs] = await Promise.all([api.products(), api.warehouses()]);
    setProducts(prods.results);
    setWarehouses(whs.results);
  };

  useEffect(() => {
    load();
  }, []);

  const openMove = (type: 'stock_in' | 'stock_out') => {
    setMoveType(type);
    setForm({ product_id: '', warehouse_id: '', quantity: '', notes: '', reference_number: '' });
    setModalOpen(true);
  };

  const handleMove = async () => {
    setMessage('');
    try {
      await api.stockMove({
        product_id: Number(form.product_id),
        warehouse_id: Number(form.warehouse_id),
        quantity: Number(form.quantity),
        transaction_type: moveType,
        notes: form.notes,
        reference_number: form.reference_number,
      });
      setModalOpen(false);
      setMessage('Stock updated successfully.');
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Stock update failed');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Inventory Tracking</h2>
          <p>Real-time stock levels and warehouse management</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={() => openMove('stock_in')}>
            <ArrowDownCircle size={16} /> Stock In
          </button>
          <button className="btn btn-secondary" onClick={() => openMove('stock_out')}>
            <ArrowUpCircle size={16} /> Stock Out
          </button>
        </div>
      </div>

      {message && (
        <div className={message.includes('success') ? 'badge badge-success' : 'error-banner'} style={{ marginBottom: 16 }}>
          {message}
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Total Qty</th>
                <th>Threshold</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong></td>
                  <td>{p.sku}</td>
                  <td>{p.total_quantity}</td>
                  <td>{p.low_stock_threshold}</td>
                  <td><StockBadge status={p.stock_status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        title={moveType === 'stock_in' ? 'Stock In' : 'Stock Out'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleMove}>Confirm</button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group">
            <label>Product</label>
            <select value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}>
              <option value="">Select product</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Warehouse</label>
            <select value={form.warehouse_id} onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}>
              <option value="">Select warehouse</option>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Quantity</label>
            <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Reference #</label>
            <input value={form.reference_number} onChange={(e) => setForm({ ...form, reference_number: e.target.value })} />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Notes</label>
            <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
      </Modal>
    </>
  );
}
