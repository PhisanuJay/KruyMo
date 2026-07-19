import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { userAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import DashboardLayout from '../../../components/DashboardLayout';

const ROLE_LABELS = { customer: 'ลูกค้า', staff: 'พนักงาน', admin: 'แอดมิน' };
const ROLE_COLORS = { customer: '#74B9FF', staff: '#A29BFE', admin: '#E63946' };

const emptyForm = () => ({
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'customer',
});

export default function UserManager() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const load = () => {
    setLoading(true);
    userAPI.getAll()
      .then((r) => setUsers(Array.isArray(r.data) ? r.data : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleRoleChange = async (id, role) => {
    const { data } = await userAPI.update(id, { role });
    setUsers((prev) => prev.map((u) => (u.id === id ? data : u)));
  };

  const handleDelete = async (u) => {
    if (u.id === me?.id) {
      alert('ไม่สามารถลบบัญชีของตัวเองได้');
      return;
    }
    if (!confirm(`ลบผู้ใช้ "${u.name}" (${u.email})?\nการกระทำนี้ย้อนกลับไม่ได้`)) return;
    setDeletingId(u.id);
    try {
      await userAPI.delete(u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } catch (err) {
      alert(err.response?.data?.error || 'ลบผู้ใช้ไม่สำเร็จ');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('กรุณากรอกชื่อ อีเมล และรหัสผ่าน');
      return;
    }
    setSaving(true);
    try {
      const { data } = await userAPI.create({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        role: form.role,
      });
      setUsers((prev) => [data, ...prev]);
      setForm(emptyForm());
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.error || 'เพิ่มผู้ใช้ไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="booking-page-head">
        <div>
          <h1 className="page-title">จัดการผู้ใช้</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>เพิ่ม ลบ และกำหนดสิทธิ์ผู้ใช้ในระบบ</p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => {
            setShowForm(true);
            setError('');
            setForm(emptyForm());
          }}
        >
          <Plus size={16} />
          เพิ่มผู้ใช้
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem', maxWidth: 520 }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>เพิ่มผู้ใช้ใหม่</h3>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label htmlFor="new-user-name">ชื่อ *</label>
              <input
                id="new-user-name"
                className="form-input"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="new-user-email">อีเมล *</label>
              <input
                id="new-user-email"
                className="form-input"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="new-user-phone">เบอร์โทร</label>
              <input
                id="new-user-phone"
                className="form-input"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="08x-xxx-xxxx"
              />
            </div>
            <div className="form-group">
              <label htmlFor="new-user-password">รหัสผ่าน *</label>
              <input
                id="new-user-password"
                className="form-input"
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                minLength={6}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="new-user-role">สิทธิ์</label>
              <select
                id="new-user-role"
                className="form-input"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              >
                <option value="customer">ลูกค้า</option>
                <option value="staff">พนักงาน</option>
                <option value="admin">แอดมิน</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={saving}
                onClick={() => {
                  setShowForm(false);
                  setError('');
                }}
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading">กำลังโหลด...</div>
      ) : (
        <div className="card table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ชื่อ</th>
                <th>อีเมล</th>
                <th>เบอร์โทร</th>
                <th>สิทธิ์</th>
                <th>เปลี่ยนสิทธิ์</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#6B7280' }}>ยังไม่มีผู้ใช้</td>
                </tr>
              )}
              {users.map((u) => {
                const isSelf = u.id === me?.id;
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', background: ROLE_COLORS[u.role],
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.8rem',
                        }}>
                          {u.name?.[0]}
                        </div>
                        {u.name}
                        {isSelf && (
                          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>(คุณ)</span>
                        )}
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>{u.phone || '-'}</td>
                    <td>
                      <span style={{
                        padding: '4px 12px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 600,
                        color: 'white', background: ROLE_COLORS[u.role],
                      }}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td>
                      <select
                        className="form-input"
                        style={{ maxWidth: 140 }}
                        value={u.role}
                        disabled={isSelf}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      >
                        <option value="customer">ลูกค้า</option>
                        <option value="staff">พนักงาน</option>
                        <option value="admin">แอดมิน</option>
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        disabled={isSelf || deletingId === u.id}
                        title={isSelf ? 'ลบบัญชีตัวเองไม่ได้' : 'ลบผู้ใช้'}
                        onClick={() => handleDelete(u)}
                      >
                        <Trash2 size={14} />
                        {deletingId === u.id ? 'กำลังลบ...' : 'ลบ'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
