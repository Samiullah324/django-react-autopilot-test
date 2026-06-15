import { Download, Plus, Search, Trash2, Upload } from 'lucide-react';
import { downloadFile } from '../utils/download';
import { useCallback, useEffect, useRef, useState } from 'react';

import { api, ApiError } from '../api/client';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Modal } from '../components/Modal';
import { StockBadge } from '../components/StockBadge';
import { useAuth } from '../context/AuthContext';
import type { Category, Product, Supplier } from '../types';

type FormState = {
  name: string;
  sku: string;
  barcode: string;
  category: string;
  supplier: string;
  price: string;
  low_stock_threshold: string;
  description: string;
};

const emptyForm: FormState = {
  name: '',
  sku: '',
  barcode: '',
  category: '',
  supplier: '',
  price: '',
  low_stock_threshold: '10',
  description: '',
};

function parseFieldErrors(data: unknown): Record<string, string> {
  if (!data || typeof data !== 'object') return {};
  const errors: Record<string, string> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (key === 'detail') continue;
    if (Array.isArray(value)) {
      errors[key] = value.map(String).join(' ');
    } else if (typeof value === 'string') {
      errors[key] = value;
    }
  }
  return errors;
}

function validateForm(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.name.trim()) errors.name = 'Name is required.';
  if (!form.sku.trim()) errors.sku = 'SKU is required.';
  if (form.price !== '' && (Number.isNaN(Number(form.price)) || Number(form.price) < 0)) {
    errors.price = 'Price must be a non-negative number.';
  }
  const threshold = Number(form.low_stock_threshold);
  if (
    form.low_stock_threshold !== '' &&
    (Number.isNaN(threshold) || !Number.isInteger(threshold) || threshold < 0)
  ) {
    errors.low_stock_threshold = 'Threshold must be a non-negative whole number.';
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
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>(emptyForm);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (stockFilter) params.stock_status = stockFilter;
      const res = await api.products(params);
      setProducts(res.results);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load products.');
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
        setLoadError('Failed to load categories or suppliers.');
      });
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setFieldErrors({});
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
    setFormError('');
    setFieldErrors({});
    setModalOpen(true);
  };

  const handleSave = async () => {
    const clientErrors = validateForm(form);
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setFormError('Please fix the highlighted fields.');
      return;
    }

    setSaving(true);
    setFormError('');
    setFieldErrors({});

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      barcode: form.barcode.trim(),
      category: form.category ? Number(form.category) : null,
      supplier: form.supplier ? Number(form.supplier) : null,
      price: form.price === '' ? '0' : form.price,
      low_stock_threshold: Number(form.low_stock_threshold || 0),
      description: form.description,
    };

    try {
      if (editing) {
        await api.updateProduct(editing.id, payload);
      } else {
        await api.createProduct(payload);
      }
      setModalOpen(false);
      await loadProducts();
    } catch (err) {
      if (err instanceof ApiError) {
        const apiFieldErrors = parseFieldErrors(err.data);
        if (Object.keys(apiFieldErrors).length > 0) {
          setFieldErrors(apiFieldErrors);
        }
        setFormError(err.message);
      } else {
        setFormError('Failed to save product.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product?')) return;
    setDeletingId(id);
    setLoadError('');
    try {
      await api.deleteProduct(id);
      await loadProducts();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to delete product.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoadError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/products/import_file/', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('inventory_access_token')}` },
        body: fd,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          typeof data === 'object' && data && 'detail' in data
            ? String((data as { detail: string }).detail)
            : 'Import failed.',
        );
      }
      await loadProducts();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      e.target.value = '';
    }
  };

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
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

      {loadError && <div className="error-banner">{loadError}</div>}

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
        onClose={() => !saving && setModalOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </>
        }
      >
        {formError && <div className="error-banner">{formError}</div>}
        <div className="form-grid">
          <div className="form-group">
            <label>Name</label>
            <input
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              required
              aria-invalid={!!fieldErrors.name}
            />
            {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
          </div>
          <div className="form-group">
            <label>SKU</label>
            <input
              value={form.sku}
              onChange={(e) => updateField('sku', e.target.value)}
              required
              aria-invalid={!!fieldErrors.sku}
            />
            {fieldErrors.sku && <span className="field-error">{fieldErrors.sku}</span>}
          </div>
          <div className="form-group">
            <label>Barcode</label>
            <input value={form.barcode} onChange={(e) => updateField('barcode', e.target.value)} />
            {fieldErrors.barcode && <span className="field-error">{fieldErrors.barcode}</span>}
          </div>
          <div className="form-group">
            <label>Price</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => updateField('price', e.target.value)}
              aria-invalid={!!fieldErrors.price}
            />
            {fieldErrors.price && <span className="field-error">{fieldErrors.price}</span>}
          </div>
          <div className="form-group">
            <label>Category</label>
            <select value={form.category} onChange={(e) => updateField('category', e.target.value)}>
              <option value="">None</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {fieldErrors.category && <span className="field-error">{fieldErrors.category}</span>}
          </div>
          <div className="form-group">
            <label>Supplier</label>
            <select value={form.supplier} onChange={(e) => updateField('supplier', e.target.value)}>
              <option value="">None</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {fieldErrors.supplier && <span className="field-error">{fieldErrors.supplier}</span>}
          </div>
          <div className="form-group">
            <label>Low Stock Threshold</label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.low_stock_threshold}
              onChange={(e) => updateField('low_stock_threshold', e.target.value)}
              aria-invalid={!!fieldErrors.low_stock_threshold}
            />
            {fieldErrors.low_stock_threshold && (
              <span className="field-error">{fieldErrors.low_stock_threshold}</span>
            )}
          </div>
          <div className="form-group form-group--full">
            <label>Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
            />
            {fieldErrors.description && <span className="field-error">{fieldErrors.description}</span>}
          </div>
        </div>
      </Modal>
    </>
  );
}
