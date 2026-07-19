import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../../services/api';
import CustomerLayout from '../../components/CustomerLayout';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const initialEmail = location.state?.email || searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState(location.state?.message || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(location.state?.cooldown || 0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (newPassword !== confirmPassword) {
      setError('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authAPI.resetPassword({ email, otp, newPassword });
      setMessage(data.message);
      setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (err) {
      setError(err.response?.data?.error || 'รีเซ็ตรหัสผ่านไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    setError('');
    setMessage('');
    setResending(true);
    try {
      const { data } = await authAPI.forgotPassword(email);
      setMessage(data.message);
      setCooldown(data.resendAfter || 60);
    } catch (err) {
      setError(err.response?.data?.error || 'ส่งรหัสใหม่ไม่สำเร็จ');
      if (err.response?.data?.retryAfter) setCooldown(err.response.data.retryAfter);
    } finally {
      setResending(false);
    }
  };

  return (
    <CustomerLayout>
      <div style={{ maxWidth: 440, margin: '4rem auto', padding: '0 20px' }}>
        <div className="card" style={{ padding: '2.5rem' }}>
          <h1 className="page-title" style={{ textAlign: 'center' }}>ตั้งรหัสผ่านใหม่</h1>
          <p className="page-subtitle" style={{ textAlign: 'center' }}>
            กรอกรหัส 6 หลักจากอีเมล แล้วตั้งรหัสผ่านใหม่
          </p>
          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>อีเมล</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>รหัสรีเซ็ต</label>
              <input
                className="form-input"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                required
                style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '0.4rem' }}
              />
            </div>
            <div className="form-group">
              <label>รหัสผ่านใหม่</label>
              <input
                className="form-input"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <div className="form-group">
              <label>ยืนยันรหัสผ่านใหม่</label>
              <input
                className="form-input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading || otp.length !== 6}>
              {loading ? 'กำลังบันทึก...' : 'ตั้งรหัสผ่านใหม่'}
            </button>
          </form>

          <button
            type="button"
            className="btn btn-ghost"
            style={{ width: '100%', marginTop: '0.75rem' }}
            disabled={resending || cooldown > 0 || !email}
            onClick={handleResend}
          >
            {resending
              ? 'กำลังส่ง...'
              : cooldown > 0
                ? `ส่งรหัสใหม่ได้ใน ${cooldown} วินาที`
                : 'ส่งรหัสรีเซ็ตใหม่'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Link to="/login" style={{ color: '#FF6B6B' }}>กลับไปเข้าสู่ระบบ</Link>
          </p>
        </div>
      </div>
    </CustomerLayout>
  );
}
