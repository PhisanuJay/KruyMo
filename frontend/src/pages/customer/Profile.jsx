import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userAPI, uploadAPI } from '../../services/api';
import CustomerLayout from '../../components/CustomerLayout';
import UploadBox from '../../components/UploadBox';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [avatar, setAvatar] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name, phone: user.phone || '', email: user.email });
      setAvatar(user.avatar);
    }
  }, [user]);

  const handleAvatarUpload = async (file) => {
    const { data } = await uploadAPI.single(file);
    setAvatar(data.url);
    const { data: updated } = await userAPI.updateAvatar(user.id, data.url);
    updateUser(updated);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const payload = { ...form };
      if (passwords.newPassword) {
        payload.currentPassword = passwords.currentPassword;
        payload.newPassword = passwords.newPassword;
      }
      const { data } = await userAPI.update(user.id, payload);
      updateUser(data);
      setMessage('บันทึกสำเร็จ');
      setPasswords({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <CustomerLayout><div className="empty-state">กรุณา <Link to="/login">เข้าสู่ระบบ</Link></div></CustomerLayout>;

  return (
    <CustomerLayout>
      <div className="container" style={{ maxWidth: 600, padding: '2rem 20px' }}>
        <h1 className="page-title">โปรไฟล์</h1>
        <p className="page-subtitle">จัดการข้อมูลส่วนตัวของคุณ</p>
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%', margin: '0 auto 1rem',
              background: '#FF6B6B', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {avatar ? (
                <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '2.5rem', color: 'white' }}>{user.name?.[0]}</span>
              )}
            </div>
            <UploadBox
              label="อัปโหลดรูปโปรไฟล์"
              preview={avatar}
              onUpload={handleAvatarUpload}
            />
          </div>

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label>ชื่อ-นามสกุล</label>
              <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>อีเมล</label>
              <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label>เบอร์โทร</label>
              <input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '1.5rem 0' }} />
            <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>เปลี่ยนรหัสผ่าน</h3>
            <div className="form-group">
              <label>รหัสผ่านปัจจุบัน</label>
              <input className="form-input" type="password" value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} />
            </div>
            <div className="form-group">
              <label>รหัสผ่านใหม่</label>
              <input className="form-input" type="password" value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} />
            </div>
            <button className="btn btn-primary" disabled={saving}>
              {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </button>
          </form>
        </div>
      </div>
    </CustomerLayout>
  );
}
