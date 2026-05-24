import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import type { Supplier } from '../types';

export function SuppliersPage() {
  const { isManager } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState({
    name: '', contact_person: '', email: '', phone: '', address: '',
  });

  const load = async () => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    const res = await api.suppliers(params);
    setSuppliers(res.results);
  };

  useEffect(() => {
    load();
  }, [search]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', contact_person: '', email: '', phone: '', address: '' });
    setModalOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({
      name: s.name,
      contact_person: s.contact_person,
      email: s.email,
      phone: s.phone,
      address: s.address,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (editing) {
      await api.updateSupplier(editing.id, form);
    } else {
      await api.createSupplier(form);
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this supplier?')) return;
    await api.deleteSupplier(id);
    load();
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Suppliers</h2>
          <p>Manage supplier contacts and purchase relationships</p>
        </div>
        {isManager && (
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> Add Supplier
          </button>
        )}
      </div>

      <div className="filters-bar">
        <input placeholder="Search suppliers..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Products</th>
                {isManager && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.name}</strong></td>
                  <td>{s.contact_person || '—'}</td>
                  <td>{s.email || '—'}</td>
                  <td>{s.phone || '—'}</td>
                  <td>{s.product_count}</td>
                  {isManager && (
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-secondary" onClick={() => openEdit(s)}>Edit</button>
                        <button className="btn btn-danger btn-icon" onClick={() => handleDelete(s.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        title={editing ? 'Edit Supplier' : 'Add Supplier'}
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
            <label>Contact Person</label>
            <input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Address</label>
            <textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
        </div>
      </Modal>
    </>
  );
}
