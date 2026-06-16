import { ArrowDownCircle, ArrowUpCircle, Plus, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { api, ApiError } from '../api/client';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Modal } from '../components/Modal';
import { StockBadge } from '../components/StockBadge';
import { useAuth } from '../context/AuthContext';
import type { Category, Product, Supplier, Warehouse } from '../types';

const emptyProductForm = {
  name: '',
  sku: '',
  barcode: '',
  category: '',
  supplier: '',
  price: '',
  low_stock_threshold: '10',
  description: '',
};

export function InventoryPage() {
  const { isManager } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [moveType, setMoveType] = useState<'stock_in' | 'stock_out'>('stock_in');
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProductForm);
  const [moveForm, setMoveForm] = useState({
    product_id: '',
    warehouse_id: '',
    quantity: '',
    notes: '',
    reference_number: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      const [prods, whs, cats, sups] = await Promise.all([
        api.inventory(params),
        api.warehouses(),
        api.categories(),
        api.suppliers(),
      ]);
      setProducts(prods.results);
      setWarehouses(whs.results);
      setCategories(cats.results);
      setSuppliers(sups.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const openMove = (type: 'stock_in' | 'stock_out') => {
    setMoveType(type);
    setMoveForm({ product_id: '', warehouse_id: '', quantity: '', notes: '', reference_number: '' });
    setMoveModalOpen(true);
    setError('');
    setMessage('');
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyProductForm);
    setProductModalOpen(true);
    setError('');
    setMessage('');
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
    setProductModalOpen(true);
    setError('');
    setMessage('');
  };

  const validateProductForm = (): string | null => {
    if (!form.name.trim()) return 'Name is required.';
    if (!form.sku.trim()) return 'SKU is required.';
    if (!form.price || Number(form.price) <= 0) return 'Price must be greater than 0.';
    if (Number(form.low_stock_threshold) < 0) return 'Low stock threshold must be 0 or greater.';
    return null;
  };

  const handleSave = async () => {
    const validationError = validateProductForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      barcode: form.barcode,
      category: form.category ? Number(form.category) : null,
      supplier: form.supplier ? Number(form.supplier) : null,
      price: form.price,
      low_stock_threshold: Number(form.low_stock_threshold),
      description: form.description,
    };

    setError('');
    try {
      if (editing) {
        await api.updateInventoryItem(editing.id, payload);
        setMessage('Product updated successfully.');
      } else {
        await api.createInventoryItem(payload);
        setMessage('Product created successfully.');
      }
      setProductModalOpen(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save product');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product from inventory?')) return;
    setError('');
    try {
      await api.deleteInventoryItem(id);
      setMessage('Product deleted successfully.');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete product');
    }
  };

  const handleMove = async () => {
    if (!moveForm.product_id || !moveForm.warehouse_id || !moveForm.quantity) {
      setError('Product, warehouse, and quantity are required.');
      return;
    }
    if (Number(moveForm.quantity) <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }

    setError('');
    try {
      await api.stockMove({
        product_id: Number(moveForm.product_id),
        warehouse_id: Number(moveForm.warehouse_id),
        quantity: Number(moveForm.quantity),
        transaction_type: moveType,
        notes: moveForm.notes,
        reference_number: moveForm.reference_number,
      });
      setMoveModalOpen(false);
      setMessage('Stock updated successfully.');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Stock update failed');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Inventory</h2>
          <p>Manage products, stock levels, and warehouse movements</p>
        </div>
        <div className="btn-group">
          <button className="btn btn-primary" onClick={() => openMove('stock_in')}>
            <ArrowDownCircle size={16} /> Stock In
          </button>
          <button className="btn btn-secondary" onClick={() => openMove('stock_out')}>
            <ArrowUpCircle size={16} /> Stock Out
          </button>
          {isManager && (
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus size={16} /> Add Product
            </button>
          )}
        </div>
      </div>

      {message && <div className="success-banner">{message}</div>}
      {error && <div className="error-banner">{error}</div>}

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
      </div>

      <div className="card">
        <div className="table-wrap">
          {loading ? (
            <LoadingSpinner message="Loading inventory..." />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Total Qty</th>
                  <th>Threshold</th>
                  <th>Status</th>
                  {isManager && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={isManager ? 7 : 6} style={{ textAlign: 'center' }}>
                      No inventory items found.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id}>
                      <td><strong>{p.name}</strong></td>
                      <td>{p.sku}</td>
                      <td>${Number(p.price).toFixed(2)}</td>
                      <td>{p.total_quantity}</td>
                      <td>{p.low_stock_threshold}</td>
                      <td><StockBadge status={p.stock_status} /></td>
                      {isManager && (
                        <td>
                          <div className="btn-group">
                            <button className="btn btn-secondary" onClick={() => openEdit(p)}>
                              Edit
                            </button>
                            <button className="btn btn-danger btn-icon" onClick={() => handleDelete(p.id)}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        title={editing ? 'Edit Product' : 'Add Product'}
        open={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setProductModalOpen(false)}>Cancel</button>
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
            <input type="number" step="0.01" min="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
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
            <input type="number" min="0" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} />
          </div>
          <div className="form-group form-group--full">
            <label>Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
      </Modal>

      <Modal
        title={moveType === 'stock_in' ? 'Stock In' : 'Stock Out'}
        open={moveModalOpen}
        onClose={() => setMoveModalOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setMoveModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleMove}>Confirm</button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group">
            <label>Product</label>
            <select value={moveForm.product_id} onChange={(e) => setMoveForm({ ...moveForm, product_id: e.target.value })}>
              <option value="">Select product</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Warehouse</label>
            <select value={moveForm.warehouse_id} onChange={(e) => setMoveForm({ ...moveForm, warehouse_id: e.target.value })}>
              <option value="">Select warehouse</option>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Quantity</label>
            <input type="number" min="1" value={moveForm.quantity} onChange={(e) => setMoveForm({ ...moveForm, quantity: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Reference #</label>
            <input value={moveForm.reference_number} onChange={(e) => setMoveForm({ ...moveForm, reference_number: e.target.value })} />
          </div>
          <div className="form-group form-group--full">
            <label>Notes</label>
            <textarea rows={2} value={moveForm.notes} onChange={(e) => setMoveForm({ ...moveForm, notes: e.target.value })} />
          </div>
        </div>
      </Modal>
    </>
  );
}
