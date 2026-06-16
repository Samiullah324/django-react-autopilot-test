import { Download, Plus, Search, Trash2, Upload } from 'lucide-react';
import { downloadFile } from '../utils/download';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError, api, getFieldErrors } from '../api/client';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Modal } from '../components/Modal';
import { StockBadge } from '../components/StockBadge';
import { useAuth } from '../context/AuthContext';
import type { Category, Product, Supplier } from '../types';

type ProductForm = {
  name: string;
  sku: string;
  barcode: string;
  category: string;
  supplier: string;
  price: string;
  low_stock_threshold: string;
  description: string;
};

const emptyForm: ProductForm = {
  name: '',
  sku: '',
  barcode: '',
  category: '',
  supplier: '',
  price: '',
  low_stock_threshold: '10',
  description: '',
};

function validateForm(form: ProductForm): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.name.trim()) errors.name = 'Name is required.';
  if (!form.sku.trim()) errors.sku = 'SKU is required.';
  const price = Number(form.price);
  if (form.price === '' || Number.isNaN(price)) {
    errors.price = 'Price is required.';
  } else if (price <= 0) {
    errors.price = 'Price must be greater than zero.';
  }
  const threshold = Number(form.low_stock_threshold);
  if (form.low_stock_threshold === '' || Number.isNaN(threshold)) {
    errors.low_stock_threshold = 'Low stock threshold is required.';
  } else if (threshold < 0) {
    errors.low_stock_threshold = 'Threshold cannot be negative.';
  }
  return errors;
}

export function ProductsPage() {
  const { isManager } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [pageError, setPageError] = useState('');
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setPageError('');
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (stockFilter) params.stock_status = stockFilter;
      const res = await api.products(params);
      setProducts(res.results);
    } catch (err) {
      setPageError(err instanceof ApiError ? err.message : 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, [search, stockFilter]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    Promise.all([api.categories(), api.suppliers()])
      .then(([cats, sups]) => {
        setCategories(cats.results);
        setSuppliers(sups.results);
      })
      .catch(() => {
        setPageError('Failed to load categories or suppliers.');
      });
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
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
    setFormErrors({});
    setModalOpen(true);
  };

  const handleSave = async () => {
    const clientErrors = validateForm(form);
    setFormErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;

    setSaving(true);
    setMessage('');
    try {
      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        barcode: form.barcode.trim(),
        category: form.category ? Number(form.category) : null,
        supplier: form.supplier ? Number(form.supplier) : null,
        price: form.price,
        low_stock_threshold: Number(form.low_stock_threshold),
        description: form.description,
      };
      if (editing) {
        await api.updateProduct(editing.id, payload);
        setMessage('Product updated successfully.');
      } else {
        await api.createProduct(payload);
        setMessage('Product created successfully.');
      }
      setModalOpen(false);
      await loadProducts();
    } catch (err) {
      if (err instanceof ApiError && err.data) {
        const apiErrors = getFieldErrors(err.data);
        if (Object.keys(apiErrors).length > 0) {
          setFormErrors(apiErrors);
        } else {
          setFormErrors({ _form: err.message });
        }
      } else {
        setFormErrors({ _form: 'Failed to save product.' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product?')) return;
    setDeletingId(id);
    setMessage('');
    setPageError('');
    try {
      await api.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setMessage('Product deleted successfully.');
    } catch (err) {
      setPageError(err instanceof ApiError ? err.message : 'Failed to delete product.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPageError('');
    setMessage('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      await fetch('/api/products/import_file/', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('inventory_access_token')}` },
        body: fd,
      });
      setMessage('Products imported successfully.');
      await loadProducts();
    } catch {
      setPageError('Failed to import products.');
    } finally {
      e.target.value = '';
    }
  };

  const fieldError = (key: string) => formErrors[key];

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

      {pageError && <div className="error-banner">{pageError}</div>}
      {message && (
        <div className={message.includes('success') ? 'success-banner' : 'error-banner'}>
          {message}
        </div>
      )}

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
          ) : products.length === 0 ? (
            <p className="empty-state">No products found. {isManager ? 'Add your first product to get started.' : ''}</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Description</th>
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
                    <td className="text-muted">{p.description || '—'}</td>
                    <td>{p.sku}</td>
                    <td>{p.category_name || '—'}</td>
                    <td>${Number(p.price).toFixed(2)}</td>
                    <td>{p.total_quantity}</td>
                    <td><StockBadge status={p.stock_status} /></td>
                    {isManager && (
                      <td>
                        <div className="btn-group">
                          <button className="btn btn-secondary" onClick={() => openEdit(p)}>Edit</button>
                          <button
                            className="btn btn-danger btn-icon"
                            onClick={() => handleDelete(p.id)}
                            disabled={deletingId === p.id}
                          >
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
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </>
        }
      >
        {formErrors._form && <div className="error-banner">{formErrors._form}</div>}
        <div className="form-grid">
          <div className="form-group">
            <label>Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              aria-invalid={!!fieldError('name')}
            />
            {fieldError('name') && <span className="field-error">{fieldError('name')}</span>}
          </div>
          <div className="form-group">
            <label>SKU</label>
            <input
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              required
              aria-invalid={!!fieldError('sku')}
            />
            {fieldError('sku') && <span className="field-error">{fieldError('sku')}</span>}
          </div>
          <div className="form-group">
            <label>Barcode</label>
            <input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Price</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
              aria-invalid={!!fieldError('price')}
            />
            {fieldError('price') && <span className="field-error">{fieldError('price')}</span>}
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
            <input
              type="number"
              min="0"
              value={form.low_stock_threshold}
              onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })}
              required
              aria-invalid={!!fieldError('low_stock_threshold')}
            />
            {fieldError('low_stock_threshold') && (
              <span className="field-error">{fieldError('low_stock_threshold')}</span>
            )}
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
