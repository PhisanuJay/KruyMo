import { Link } from 'react-router-dom';
import {
  Heart,
  ShoppingCart,
  Instagram,
  Facebook,
  Phone,
  Mail,
  Clock,
  MessageCircle,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import NotificationBell from './NotificationBell';
import { ABOUT_CONTACT } from '../constants/store';

export default function CustomerLayout({ children }) {
  const { user, logout } = useAuth();
  const shop = useShop();
  const favoriteCount = shop?.favoriteIds?.length || 0;
  const cartCount = shop?.cartCount || 0;
  const isCustomer = user?.role === 'customer';
  const c = ABOUT_CONTACT;
  const year = new Date().getFullYear();

  return (
    <div className="site-shell">
      <nav className="site-nav">
        <div className="container site-nav-inner">
          <Link to="/" className="brand">
            <span>K</span>ruyMo
          </Link>

          <div className="nav-links">
            <Link to="/">หน้าแรก</Link>
            <Link to="/catalog">ชุดครุย</Link>
            <Link to="/how-to-rent">ขั้นตอนการเช่า</Link>
            {!user && <Link to="/about">เกี่ยวกับเรา</Link>}
            {user && <Link to="/bookings">ติดตามสถานะ</Link>}
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
        <div className="container footer-inner">
          <div className="footer-top">
            <div className="footer-col footer-col-brand">
              <Link to="/" className="footer-logo">
                <span className="footer-logo-mark">K</span>
                <span className="footer-logo-text">ruyMo</span>
              </Link>
              <p className="footer-tagline">{c.tagline}</p>
              <div className="footer-social" aria-label="โซเชียลมีเดีย">
                <a href={c.instagram.url} target="_blank" rel="noreferrer" aria-label="Instagram">
                  <Instagram size={18} />
                </a>
                <a href={c.line.url} target="_blank" rel="noreferrer" aria-label="LINE">
                  <MessageCircle size={18} />
                </a>
                <a href={c.facebook.url} target="_blank" rel="noreferrer" aria-label="Facebook">
                  <Facebook size={18} />
                </a>
              </div>
            </div>

            <div className="footer-col footer-col-contact">
              <h2 className="footer-heading">ติดต่อร้าน</h2>
              <ul className="footer-contact-list">
                <li>
                  <Phone size={16} aria-hidden />
                  <a href={`tel:${c.phone.replace(/\D/g, '')}`}>{c.phone}</a>
                </li>
                <li>
                  <Mail size={16} aria-hidden />
                  <a href={`mailto:${c.email}`}>{c.email}</a>
                </li>
                <li>
                  <Clock size={16} aria-hidden />
                  <span>{c.hours}</span>
                </li>
                <li>
                  <MapPin size={16} aria-hidden />
                  <span>{c.address}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© {year} KruyMo · เช่าชุดครุย มหาวิทยาลัยศรีปทุม</p>
            <p className="footer-bottom-note">จองออนไลน์ · จัดส่งแมสฯ · คืนมัดจำผ่านระบบ</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
