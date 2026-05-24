import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import type { Warehouse } from '../types';

export function WarehousesPage() {
  const { isManager } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', location: '' });

  const load = async () => {
    const res = await api.warehouses();
    setWarehouses(res.results);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    await api.createWarehouse(form);
    setModalOpen(false);
    setForm({ name: '', location: '' });
    load();
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Warehouses</h2>
          <p>Location-based stock management</p>
        </div>
        {isManager && (
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Add Warehouse
          </button>
        )}
      </div>

      <div className="stats-grid">
        {warehouses.map((w) => (
          <div key={w.id} className="stat-card">
            <div className="stat-card-label">{w.location || 'No location'}</div>
            <div className="stat-card-value" style={{ fontSize: 20 }}>{w.name}</div>
            <span className={`badge ${w.is_active ? 'badge-success' : 'badge-neutral'}`}>
              {w.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        ))}
      </div>

      <Modal
        title="Add Warehouse"
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
            <label>Location</label>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
        </div>
      </Modal>
    </>
  );
}
