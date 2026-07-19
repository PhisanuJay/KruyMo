import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import CustomerLayout from '../../components/CustomerLayout';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authAPI.login({ email, password });
      login(data.user, data.token);
      if (data.user.role === 'admin') navigate('/admin');
      else if (data.user.role === 'staff') navigate('/staff');
      else navigate('/catalog');
    } catch (err) {
      if (err.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        const pendingEmail = err.response.data.email || email;
        navigate(`/verify-email?email=${encodeURIComponent(pendingEmail)}`, {
          state: { email: pendingEmail, message: 'บัญชีนี้ยังไม่ได้ยืนยันอีเมล กรุณากรอกรหัสหรือขอรหัสใหม่' },
        });
        return;
      }
      setError(err.response?.data?.error || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomerLayout>
      <div style={{ maxWidth: 420, margin: '4rem auto', padding: '0 20px' }}>
        <div className="card" style={{ padding: '2.5rem' }}>
          <h1 className="page-title" style={{ textAlign: 'center' }}>เข้าสู่ระบบ</h1>
          <p className="page-subtitle" style={{ textAlign: 'center' }}>ยินดีต้อนรับกลับสู่ KruyMo</p>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>อีเมล</label>
              <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>รหัสผ่าน</label>
              <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
            <Link to="/forgot-password" style={{ color: '#FF6B6B' }}>ลืมรหัสผ่าน?</Link>
          </p>
          <p style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.9rem', color: '#636E72' }}>
            ยังไม่มีบัญชี? <Link to="/register" style={{ color: '#FF6B6B', fontWeight: 600 }}>สมัครสมาชิก</Link>
          </p>
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8f9fa', borderRadius: '10px', fontSize: '0.8rem', color: '#636E72' }}>
            <strong>ทดสอบ:</strong> customer@test.com / customer123<br />
            staff@kruymo.com / staff123<br />
            admin@kruymo.com / admin123
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
