import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import CustomerLayout from '../../components/CustomerLayout';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const { data } = await authAPI.forgotPassword(email);
      setMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    }
  };

  return (
    <CustomerLayout>
      <div style={{ maxWidth: 420, margin: '4rem auto', padding: '0 20px' }}>
        <div className="card" style={{ padding: '2.5rem' }}>
          <h1 className="page-title" style={{ textAlign: 'center' }}>ลืมรหัสผ่าน</h1>
          <p className="page-subtitle" style={{ textAlign: 'center' }}>กรอกอีเมลเพื่อรีเซ็ตรหัสผ่าน</p>
          {error && <div className="alert alert-error">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>อีเมล</label>
              <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }}>ส่งลิงก์รีเซ็ต</button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Link to="/login" style={{ color: '#FF6B6B' }}>กลับไปเข้าสู่ระบบ</Link>
          </p>
        </div>
      </div>
    </CustomerLayout>
  );
}
