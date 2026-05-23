import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, FileText } from 'lucide-react';
import api from '../lib/api';
import type { Supplier, PaginatedResponse } from '../types';
import { useAuth } from '../context/AuthContext';
import { Modal, Loading, EmptyState } from '../components/ui';

const emptyForm = { name: '', contact_person: '', email: '', phone: '', address: '', is_active: true };

export default function SuppliersPage() {
  const { canManage } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [report, setReport] = useState<{ products: unknown[]; purchase_count: number } | null>(null);

  const load = () => {
    setLoading(true);
    api.get<PaginatedResponse<Supplier>>('/inventory/suppliers/')
      .then(({ data }) => setSuppliers(data.results))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({ name: s.name, contact_person: s.contact_person, email: s.email, phone: s.phone, address: s.address, is_active: s.is_active });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await api.patch(`/inventory/suppliers/${editing.id}/`, form);
      else await api.post('/inventory/suppliers/', form);
      setModalOpen(false);
      load();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this supplier?')) return;
    await api.delete(`/inventory/suppliers/${id}/`);
    load();
  };

  const viewReport = async (id: number) => {
    const { data } = await api.get(`/inventory/suppliers/${id}/report/`);
    setReport(data);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Suppliers</h1>
          <p className="text-sm text-slate-500">Manage supplier contacts and inventory</p>
        </div>
        {canManage && (
          <button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> Add Supplier</button>
        )}
      </div>

      {loading ? <Loading /> : suppliers.length === 0 ? (
        <EmptyState title="No suppliers" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {suppliers.map((s) => (
            <div key={s.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{s.name}</h3>
                  <p className="text-sm text-slate-500">{s.contact_person}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs ${s.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-500'}`}>
                  {s.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                {s.email && <p>{s.email}</p>}
                {s.phone && <p>{s.phone}</p>}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                <div className="text-sm">
                  <span className="font-medium">{s.product_count}</span> products ·
                  <span className="font-medium"> ${s.total_inventory_value.toLocaleString()}</span> value
                </div>
                <div className="flex gap-2">
                  <button onClick={() => viewReport(s.id)} className="text-brand-600"><FileText className="h-4 w-4" /></button>
                  {canManage && (
                    <>
                      <button onClick={() => openEdit(s)} className="text-brand-600"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(s.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Supplier' : 'Add Supplier'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="label">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div><label className="label">Contact Person</label><input className="input" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></div>
          <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label className="label">Address</label><textarea className="input" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!report} onClose={() => setReport(null)} title="Supplier Report" wide>
        {report && (
          <div>
            <p className="mb-4 text-sm text-slate-500">{report.purchase_count} purchase transactions</p>
            <p className="text-sm font-medium">{Array.isArray(report.products) ? report.products.length : 0} products from this supplier</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
