import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import CustomerLayout from '../../components/CustomerLayout';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-card-brand" aria-hidden>
            <span className="auth-card-mark">K</span>
          </div>
          <h1 className="auth-card-title">เข้าสู่ระบบ</h1>
          <p className="auth-card-sub">ยินดีต้อนรับกลับสู่ KruyMo</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="login-email">อีเมล</label>
              <input
                id="login-email"
                className="form-input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com"
                required
              />
            </div>
            <div className="form-group">
              <div className="auth-label-row">
                <label htmlFor="login-password">รหัสผ่าน</label>
                <Link to="/forgot-password" className="auth-inline-link">ลืมรหัสผ่าน?</Link>
              </div>
              <div className="auth-password-wrap">
                <input
                  id="login-password"
                  className="form-input"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>

          <p className="auth-footer">
            ยังไม่มีบัญชี? <Link to="/register">สมัครสมาชิก</Link>
          </p>
        </div>
      </div>
    </CustomerLayout>
  );
}
