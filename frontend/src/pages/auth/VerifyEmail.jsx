import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import CustomerLayout from '../../components/CustomerLayout';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const initialEmail = location.state?.email || searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState(location.state?.message || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(location.state?.cooldown || 0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => {
      setCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const { data } = await authAPI.verifyEmail({ email, otp });
      login(data.user, data.token);
      navigate('/catalog', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'ยืนยันอีเมลไม่สำเร็จ');
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
      const { data } = await authAPI.resendVerification(email);
      setMessage(data.message);
      setCooldown(data.resendAfter || 60);
    } catch (err) {
      setError(err.response?.data?.error || 'ส่งรหัสใหม่ไม่สำเร็จ');
      if (err.response?.data?.retryAfter) {
        setCooldown(err.response.data.retryAfter);
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <CustomerLayout>
      <div style={{ maxWidth: 440, margin: '4rem auto', padding: '0 20px' }}>
        <div className="card" style={{ padding: '2.5rem' }}>
          <div style={{
            width: 64,
            height: 64,
            margin: '0 auto 1rem',
            borderRadius: '50%',
            background: '#fff1f2',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <MailCheck size={30} />
          </div>
          <h1 className="page-title" style={{ textAlign: 'center' }}>ยืนยันอีเมล</h1>
          <p className="page-subtitle" style={{ textAlign: 'center' }}>
            กรอกรหัส 6 หลักที่ส่งไปยังอีเมลของคุณ รหัสมีอายุ 10 นาที
          </p>

          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleVerify}>
            <div className="form-group">
              <label>อีเมล</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>รหัสยืนยัน</label>
              <input
                className="form-input"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={6}
                required
                style={{
                  textAlign: 'center',
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  letterSpacing: '0.5rem',
                }}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={loading || otp.length !== 6}
            >
              {loading ? 'กำลังตรวจสอบ...' : 'ยืนยันอีเมล'}
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
                : 'ส่งรหัสยืนยันใหม่'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem', color: '#636E72' }}>
            ใช้อีเมลไม่ถูกต้อง? <Link to="/register" style={{ color: '#FF6B6B', fontWeight: 600 }}>กลับไปสมัครใหม่</Link>
          </p>
        </div>
      </div>
    </CustomerLayout>
  );
}
