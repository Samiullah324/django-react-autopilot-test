import { useEffect, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import api from '../lib/api';
import type { Product, Warehouse, PaginatedResponse } from '../types';
import { useAuth } from '../context/AuthContext';
import { Modal, Loading, stockBadge } from '../components/ui';

const TX_TYPES = [
  { value: 'stock_in', label: 'Stock In', icon: ArrowDownToLine },
  { value: 'stock_out', label: 'Stock Out', icon: ArrowUpFromLine },
  { value: 'purchase', label: 'Purchase', icon: ArrowDownToLine },
  { value: 'sale', label: 'Sale', icon: ArrowUpFromLine },
  { value: 'return', label: 'Return', icon: ArrowDownToLine },
  { value: 'adjustment', label: 'Adjustment', icon: ArrowDownToLine },
];

export default function InventoryPage() {
  const { canManage } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({
    warehouse: '', quantity: '', transaction_type: 'stock_in', reference: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get<PaginatedResponse<Product>>('/inventory/products/'),
      api.get<PaginatedResponse<Warehouse>>('/inventory/warehouses/'),
    ]).then(([p, w]) => {
      setProducts(p.data.results);
      setWarehouses(w.data.results);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openMove = (product: Product) => {
    setSelectedProduct(product);
    setForm({ warehouse: warehouses[0]?.id.toString() || '', quantity: '', transaction_type: 'stock_in', reference: '', notes: '' });
    setMessage('');
    setModalOpen(true);
  };

  const handleMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setSaving(true);
    setMessage('');
    try {
      await api.post('/inventory/stock/move/', {
        product: selectedProduct.id,
        warehouse: Number(form.warehouse),
        quantity: Number(form.quantity),
        transaction_type: form.transaction_type,
        reference: form.reference,
        notes: form.notes,
      });
      setMessage('Stock updated successfully.');
      load();
      setTimeout(() => setModalOpen(false), 800);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { quantity?: string[] } } })?.response?.data?.quantity?.[0]
        || 'Failed to update stock.';
      setMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Inventory Tracking</h1>
        <p className="text-sm text-slate-500">Real-time stock levels across warehouses</p>
      </div>

      <div className="grid gap-4">
        {products.map((p) => (
          <div key={p.id} className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-semibold">{p.name}</h3>
                {stockBadge(p.stock_status)}
              </div>
              <p className="mt-1 text-sm text-slate-500">SKU: {p.sku} · Threshold: {p.low_stock_threshold}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {p.stock_levels.map((sl) => (
                  <span key={sl.id} className="rounded-md bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">
                    {sl.warehouse_name}: <strong>{sl.quantity}</strong>
                  </span>
                ))}
                {p.stock_levels.length === 0 && (
                  <span className="text-xs text-slate-500">No stock assigned</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-bold">{p.total_quantity}</p>
                <p className="text-xs text-slate-500">Total units</p>
              </div>
              {canManage && (
                <button onClick={() => openMove(p)} className="btn-primary">Move Stock</button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`Stock Movement — ${selectedProduct?.name}`}>
        <form onSubmit={handleMove} className="space-y-4">
          {message && (
            <div className={`rounded-lg px-4 py-3 text-sm ${message.includes('success') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
              {message}
            </div>
          )}
          <div>
            <label className="label">Warehouse</label>
            <select className="input" value={form.warehouse} onChange={(e) => setForm({ ...form, warehouse: e.target.value })} required>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Transaction Type</label>
            <select className="input" value={form.transaction_type} onChange={(e) => setForm({ ...form, transaction_type: e.target.value })} required>
              {TX_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Quantity</label>
            <input type="number" min="1" className="input" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
          </div>
          <div>
            <label className="label">Reference</label>
            <input className="input" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Processing...' : 'Submit'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
