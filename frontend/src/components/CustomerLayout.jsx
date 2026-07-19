import { Link } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import NotificationBell from './NotificationBell';

export default function CustomerLayout({ children }) {
  const { user, logout } = useAuth();
  const shop = useShop();
  const favoriteCount = shop?.favoriteIds?.length || 0;
  const cartCount = shop?.cartCount || 0;
  const isCustomer = user?.role === 'customer';

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
            <Link to="/how-to-rent">ขั้นตอนการเช่า</Link>
            {user && <Link to="/bookings">ประวัติการจอง</Link>}
            {user && <Link to="/profile">โปรไฟล์</Link>}
          </div>

          <div className="nav-actions">
            {user ? (
              <>
                {isCustomer && (
                  <>
                    <Link to="/favorites" className="nav-icon-btn" title="รายการโปรด" aria-label="รายการโปรด">
                      <Heart size={22} />
                      {favoriteCount > 0 && <span className="nav-badge">{favoriteCount}</span>}
                    </Link>
                    <Link to="/cart" className="nav-icon-btn" title="ตะกร้า" aria-label="ตะกร้า">
                      <ShoppingCart size={22} />
                      {cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
                    </Link>
                  </>
                )}
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
          <p style={{ marginTop: 8 }}>
            <Link to="/how-to-rent" style={{ color: 'inherit', textDecoration: 'underline', opacity: 0.9 }}>
              ขั้นตอนการเช่า
            </Link>
            {' · '}
            <Link to="/catalog" style={{ color: 'inherit', textDecoration: 'underline', opacity: 0.9 }}>
              ชุดครุย
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
