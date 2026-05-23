import { useEffect, useState, useRef } from 'react';
import { Plus, Search, Download, Upload, Pencil, Trash2 } from 'lucide-react';
import api from '../lib/api';
import { downloadFile } from '../lib/download';
import type { Product, Category, Supplier, PaginatedResponse } from '../types';
import { useAuth } from '../context/AuthContext';
import { Modal, Loading, stockBadge, EmptyState } from '../components/ui';

const emptyForm = {
  name: '', sku: '', barcode: '', category: '', supplier: '',
  price: '', low_stock_threshold: '10', description: '', is_active: true,
};

export default function ProductsPage() {
  const { canManage } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (stockFilter) params.stock_status = stockFilter;
    Promise.all([
      api.get<PaginatedResponse<Product>>('/inventory/products/', { params }),
      api.get<PaginatedResponse<Category>>('/inventory/categories/'),
      api.get<PaginatedResponse<Supplier>>('/inventory/suppliers/'),
    ]).then(([p, c, s]) => {
      setProducts(p.data.results);
      setCategories(c.data.results);
      setSuppliers(s.data.results);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, stockFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name, sku: p.sku, barcode: p.barcode,
      category: p.category?.toString() || '', supplier: p.supplier?.toString() || '',
      price: p.price, low_stock_threshold: p.low_stock_threshold.toString(),
      description: p.description, is_active: p.is_active,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      category: form.category ? Number(form.category) : null,
      supplier: form.supplier ? Number(form.supplier) : null,
      price: form.price,
      low_stock_threshold: Number(form.low_stock_threshold),
    };
    try {
      if (editing) {
        await api.patch(`/inventory/products/${editing.id}/`, payload);
      } else {
        await api.post('/inventory/products/', payload);
      }
      setModalOpen(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product?')) return;
    await api.delete(`/inventory/products/${id}/`);
    load();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    await api.post('/inventory/products/import/', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    load();
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleExport = async (format: string) => {
    await downloadFile(`/inventory/products/export/?format=${format}`, `products.${format === 'xlsx' ? 'xlsx' : 'csv'}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-slate-500">Manage your product catalog</p>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => fileRef.current?.click()} className="btn-secondary">
              <Upload className="h-4 w-4" /> Import
            </button>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleImport} />
            <button onClick={() => handleExport('csv')} className="btn-secondary">
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button onClick={() => handleExport('xlsx')} className="btn-secondary">
              <Download className="h-4 w-4" /> Export Excel
            </button>
            <button onClick={openCreate} className="btn-primary">
              <Plus className="h-4 w-4" /> Add Product
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-10"
            placeholder="Search by name, SKU, or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input sm:w-48" value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
          <option value="">All stock levels</option>
          <option value="in_stock">In Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </div>

      {loading ? (
        <Loading />
      ) : products.length === 0 ? (
        <EmptyState title="No products found" description="Add your first product to get started." />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left dark:border-slate-800">
                <th className="px-6 py-3 font-medium text-slate-500">Product</th>
                <th className="px-6 py-3 font-medium text-slate-500">SKU</th>
                <th className="px-6 py-3 font-medium text-slate-500">Category</th>
                <th className="px-6 py-3 font-medium text-slate-500">Price</th>
                <th className="px-6 py-3 font-medium text-slate-500">Qty</th>
                <th className="px-6 py-3 font-medium text-slate-500">Status</th>
                {canManage && <th className="px-6 py-3 font-medium text-slate-500">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 dark:border-slate-800/50">
                  <td className="px-6 py-4 font-medium">{p.name}</td>
                  <td className="px-6 py-4 text-slate-500">{p.sku}</td>
                  <td className="px-6 py-4">{p.category_name || '—'}</td>
                  <td className="px-6 py-4">${Number(p.price).toFixed(2)}</td>
                  <td className="px-6 py-4">{p.total_quantity}</td>
                  <td className="px-6 py-4">{stockBadge(p.stock_status)}</td>
                  {canManage && (
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(p)} className="text-brand-600 hover:text-brand-700">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Product' : 'Add Product'} wide>
        <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Product Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">SKU</label>
            <input className="input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required disabled={!!editing} />
          </div>
          <div>
            <label className="label">Barcode</label>
            <input className="input" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">None</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Supplier</label>
            <select className="input" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })}>
              <option value="">None</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Price</label>
            <input type="number" step="0.01" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          </div>
          <div>
            <label className="label">Low Stock Threshold</label>
            <input type="number" className="input" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
