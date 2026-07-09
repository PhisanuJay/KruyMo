import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function CustomerLayout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div>
      <nav className="site-nav">
        <div className="container site-nav-inner">
          <Link to="/" className="brand">
            <span>K</span>ruyMo
          </Link>

          <div className="nav-links">
            <Link to="/">หน้าแรก</Link>
            <Link to="/catalog">ชุดครุย</Link>
            {user && <Link to="/bookings">การจอง</Link>}
            {user && <Link to="/profile">โปรไฟล์</Link>}
          </div>

          <div className="nav-actions">
            {user ? (
              <>
                <NotificationBell />
                <button onClick={logout} className="btn btn-ghost btn-sm">ออกจากระบบ</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">เข้าสู่ระบบ</Link>
                <Link to="/register" className="btn btn-primary btn-sm">สมัครสมาชิก</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main>{children}</main>

      <footer className="site-footer">
        <div className="container">
          <div className="brand"><span>K</span>ruyMo</div>
          <p>ระบบเช่าชุดครุยบัณฑิตออนไลน์ · จองง่าย ชำระสะดวก ติดตามสถานะได้ตลอด</p>
        </div>
      </footer>
    </div>
  );
}
