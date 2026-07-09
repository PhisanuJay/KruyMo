import { useState, useEffect } from 'react';
import { masterDataAPI } from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';

const TABS = [
  { key: 'universities', label: 'มหาวิทยาลัย' },
  { key: 'faculties', label: 'คณะ' },
  { key: 'sizes', label: 'ไซส์' },
];

export default function MasterDataManager() {
  const [tab, setTab] = useState('universities');
  const [items, setItems] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);

  const api = masterDataAPI[tab];

  const load = () => {
    api.getAll().then((r) => setItems(r.data));
    if (tab === 'faculties') {
      masterDataAPI.universities.getAll().then((r) => setUniversities(r.data));
    }
  };

  useEffect(() => { load(); }, [tab]);

  const handleSave = async () => {
    if (editing === 'new') {
      await api.create(form);
    } else {
      await api.update(editing, form);
    }
    setEditing(null);
    setForm({});
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('ยืนยันลบ?')) return;
    await api.delete(id);
    load();
  };

  return (
    <DashboardLayout role="admin">
      <h1 className="page-title">ข้อมูลหลัก</h1>
      <p className="page-subtitle">จัดการมหาวิทยาลัย คณะ และไซส์ชุด</p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
        {TABS.map((t) => (
          <button key={t.key} className={`btn ${tab === t.key ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
        <button className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }}
          onClick={() => { setEditing('new'); setForm({}); }}>+ เพิ่ม</button>
      </div>

      <div className="card table-wrapper">
        <table>
          <thead>
            <tr>
              {tab === 'universities' && <><th>ชื่อ</th><th>ชื่อย่อ</th><th>สี</th></>}
              {tab === 'faculties' && <><th>ชื่อ</th><th>มหาวิทยาลัย</th><th>สี</th></>}
              {tab === 'sizes' && <><th>ไซส์</th><th>รายละเอียด</th></>}
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                {tab === 'universities' && (
                  <>
                    <td>{item.name}</td>
                    <td>{item.shortName}</td>
                    <td><span style={{ display: 'inline-block', width: 24, height: 24, borderRadius: '50%', background: item.color }} /></td>
                  </>
                )}
                {tab === 'faculties' && (
                  <>
                    <td>{item.name}</td>
                    <td>{universities.find((u) => u.id === item.universityId)?.name}</td>
                    <td><span style={{ display: 'inline-block', width: 24, height: 24, borderRadius: '50%', background: item.color }} /></td>
                  </>
                )}
                {tab === 'sizes' && (
                  <>
                    <td><strong>{item.label}</strong></td>
                    <td>{item.description}</td>
                  </>
                )}
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(item.id); setForm(item); }}>แก้ไข</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>ลบ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editing === 'new' ? 'เพิ่ม' : 'แก้ไข'} {TABS.find((t) => t.key === tab)?.label}</h3>
            {tab === 'universities' && (
              <>
                <div className="form-group"><label>ชื่อ</label><input className="form-input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="form-group"><label>ชื่อย่อ</label><input className="form-input" value={form.shortName || ''} onChange={(e) => setForm({ ...form, shortName: e.target.value })} /></div>
                <div className="form-group"><label>สี</label><input className="form-input" type="color" value={form.color || '#FF6B6B'} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
              </>
            )}
            {tab === 'faculties' && (
              <>
                <div className="form-group"><label>ชื่อคณะ</label><input className="form-input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="form-group">
                  <label>มหาวิทยาลัย</label>
                  <select className="form-input" value={form.universityId || ''} onChange={(e) => setForm({ ...form, universityId: e.target.value })}>
                    <option value="">เลือก</option>
                    {universities.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>สี</label><input className="form-input" type="color" value={form.color || '#228B22'} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
              </>
            )}
            {tab === 'sizes' && (
              <>
                <div className="form-group"><label>ไซส์</label><input className="form-input" value={form.label || ''} onChange={(e) => setForm({ ...form, label: e.target.value })} /></div>
                <div className="form-group"><label>รายละเอียด</label><input className="form-input" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              </>
            )}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setEditing(null)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleSave}>บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
