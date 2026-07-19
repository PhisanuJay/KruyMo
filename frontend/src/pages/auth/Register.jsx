import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import CustomerLayout from '../../components/CustomerLayout';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authAPI.register(form);
      navigate(`/verify-email?email=${encodeURIComponent(data.email)}`, {
        state: {
          email: data.email,
          message: data.message,
          cooldown: data.resendAfter || 60,
        },
      });
    } catch (err) {
      setError(err.response?.data?.error || 'สมัครสมาชิกไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomerLayout>
      <div style={{ maxWidth: 420, margin: '4rem auto', padding: '0 20px' }}>
        <div className="card" style={{ padding: '2.5rem' }}>
          <h1 className="page-title" style={{ textAlign: 'center' }}>สมัครสมาชิก</h1>
          <p className="page-subtitle" style={{ textAlign: 'center' }}>เริ่มเช่าชุดครุยกับ KruyMo</p>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>ชื่อ-นามสกุล</label>
              <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>อีเมล</label>
              <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>เบอร์โทร</label>
              <input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label>รหัสผ่าน</label>
              <input className="form-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#636E72' }}>
            มีบัญชีแล้ว? <Link to="/login" style={{ color: '#FF6B6B', fontWeight: 600 }}>เข้าสู่ระบบ</Link>
          </p>
        </div>
      </div>
    </CustomerLayout>
  );
}
