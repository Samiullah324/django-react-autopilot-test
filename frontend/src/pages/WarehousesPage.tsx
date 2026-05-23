import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import api from '../lib/api';
import type { Warehouse, PaginatedResponse } from '../types';
import { useAuth } from '../context/AuthContext';
import { Modal, Loading, EmptyState } from '../components/ui';

const emptyForm = { name: '', code: '', location: '', is_active: true };

export default function WarehousesPage() {
  const { canManage } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get<PaginatedResponse<Warehouse>>('/inventory/warehouses/')
      .then(({ data }) => setWarehouses(data.results))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await api.patch(`/inventory/warehouses/${editing.id}/`, form);
      else await api.post('/inventory/warehouses/', form);
      setModalOpen(false);
      load();
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Warehouses</h1>
          <p className="text-sm text-slate-500">Location-based stock management</p>
        </div>
        {canManage && (
          <button onClick={() => { setEditing(null); setForm(emptyForm); setModalOpen(true); }} className="btn-primary">
            <Plus className="h-4 w-4" /> Add Warehouse
          </button>
        )}
      </div>

      {loading ? <Loading /> : warehouses.length === 0 ? (
        <EmptyState title="No warehouses" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {warehouses.map((w) => (
            <div key={w.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{w.name}</h3>
                  <p className="text-sm text-brand-600">{w.code}</p>
                </div>
                {canManage && (
                  <div className="flex gap-2">
                    <button onClick={() => { setEditing(w); setForm({ name: w.name, code: w.code, location: w.location, is_active: w.is_active }); setModalOpen(true); }} className="text-brand-600"><Pencil className="h-4 w-4" /></button>
                    <button onClick={async () => { if (confirm('Delete?')) { await api.delete(`/inventory/warehouses/${w.id}/`); load(); } }} className="text-red-500"><Trash2 className="h-4 w-4" /></button>
                  </div>
                )}
              </div>
              <p className="mt-2 text-sm text-slate-500">{w.location || 'No location set'}</p>
              <p className="mt-4 text-2xl font-bold">{w.total_items.toLocaleString()} <span className="text-sm font-normal text-slate-500">units</span></p>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Warehouse' : 'Add Warehouse'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="label">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div><label className="label">Code</label><input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required disabled={!!editing} /></div>
          <div><label className="label">Location</label><input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
