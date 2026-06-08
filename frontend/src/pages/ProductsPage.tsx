import { Download, Plus, Search, Trash2, Upload } from 'lucide-react';
import { downloadFile } from '../utils/download';
import { useCallback, useEffect, useRef, useState } from 'react';

import { api } from '../api/client';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Modal } from '../components/Modal';
import { StockBadge } from '../components/StockBadge';
import { useAuth } from '../context/AuthContext';
import type { Category, Product, Supplier } from '../types';

export function ProductsPage() {
  const { isManager } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: '',
    supplier: '',
    price: '',
    low_stock_threshold: '10',
    description: '',
  });

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (stockFilter) params.stock_status = stockFilter;
      const res = await api.products(params);
      setProducts(res.results);
    } finally {
      setLoading(false);
    }
  }, [search, stockFilter]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    Promise.all([api.categories(), api.suppliers()]).then(([cats, sups]) => {
      setCategories(cats.results);
      setSuppliers(sups.results);
    });
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '', sku: '', barcode: '', category: '', supplier: '',
      price: '', low_stock_threshold: '10', description: '',
    });
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      category: product.category ? String(product.category) : '',
      supplier: product.supplier ? String(product.supplier) : '',
      price: product.price,
      low_stock_threshold: String(product.low_stock_threshold),
      description: product.description || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      name: form.name,
      sku: form.sku,
      barcode: form.barcode,
      category: form.category ? Number(form.category) : null,
      supplier: form.supplier ? Number(form.supplier) : null,
      price: form.price,
      low_stock_threshold: Number(form.low_stock_threshold),
      description: form.description,
    };
    if (editing) {
      await api.updateProduct(editing.id, payload);
    } else {
      await api.createProduct(payload);
    }
    setModalOpen(false);
    loadProducts();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product?')) return;
    await api.deleteProduct(id);
    loadProducts();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    await fetch('/api/products/import_file/', {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('inventory_access_token')}` },
      body: fd,
    });
    loadProducts();
    e.target.value = '';
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Products</h2>
          <p>Manage product catalog, pricing, and stock thresholds</p>
        </div>
        {isManager && (
          <div className="btn-group">
            <button className="btn btn-secondary" onClick={() => downloadFile('/api/products/export/?format=csv', 'products.csv')}>
              <Download size={16} /> Export CSV
            </button>
            <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
              <Upload size={16} /> Import
            </button>
            <input ref={fileRef} type="file" accept=".csv,.xlsx" hidden onChange={handleImport} />
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus size={16} /> Add Product
            </button>
          </div>
        )}
      </div>

      <div className="filters-bar">
        <div className="search-field">
          <Search size={16} className="search-field-icon" />
          <input
            className="search-input"
            placeholder="Search by name, SKU, or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
          <option value="">All stock levels</option>
          <option value="in_stock">In stock</option>
          <option value="low_stock">Low stock</option>
          <option value="out_of_stock">Out of stock</option>
        </select>
      </div>

      <div className="card">
        <div className="table-wrap">
          {loading ? (
            <LoadingSpinner message="Loading products..." />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Status</th>
                  {isManager && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong></td>
                    <td>{p.sku}</td>
                    <td>{p.category_name || '—'}</td>
                    <td>${Number(p.price).toFixed(2)}</td>
                    <td>{p.total_quantity}</td>
                    <td><StockBadge status={p.stock_status} /></td>
                    {isManager && (
                      <td>
                        <div className="btn-group">
                          <button className="btn btn-secondary" onClick={() => openEdit(p)}>Edit</button>
                          <button className="btn btn-danger btn-icon" onClick={() => handleDelete(p.id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        title={editing ? 'Edit Product' : 'Add Product'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>Save</button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group">
            <label>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>SKU</label>
            <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Barcode</label>
            <input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Price</label>
            <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">None</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Supplier</label>
            <select value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })}>
              <option value="">None</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Low Stock Threshold</label>
            <input type="number" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} />
          </div>
          <div className="form-group form-group--full">
            <label>Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
      </Modal>
    </>
  );
}
