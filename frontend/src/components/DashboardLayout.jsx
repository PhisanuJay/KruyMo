import { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import {
  LayoutDashboard, Users, BarChart3, Settings,
  ClipboardList, LogOut, Bell, Shirt, ChevronDown, Wallet, Truck,
} from 'lucide-react';

const staffLinks = [
  { to: '/staff', icon: LayoutDashboard, label: 'แดชบอร์ด' },
  { to: '/staff/bookings', icon: ClipboardList, label: 'จัดการคำสั่งเช่า' },
  { to: '/staff/dispatch', icon: Truck, label: 'คิวส่งแมสฯ / รับคืน' },
  { to: '/staff/refund', icon: BarChart3, label: 'คืนเงินมัดจำ' },
];

const bookingSubLinks = [
  { to: '/admin/bookings', group: 'all', label: 'การจองทั้งหมด' },
  { to: '/admin/bookings?group=pending', group: 'pending', label: 'รอดำเนินการ' },
  { to: '/admin/bookings?group=renting', group: 'renting', label: 'กำลังเช่า' },
  { to: '/admin/bookings?group=returned', group: 'returned', label: 'คืนแล้ว' },
  { to: '/admin/bookings?group=canceled', group: 'canceled', label: 'ยกเลิกการจอง' },
];

const adminTopLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'ภาพรวมระบบ' },
];

const adminRestLinks = [
  { to: '/admin/costumes', icon: Shirt, label: 'จัดการชุดครุย' },
  { to: '/admin/master-data', icon: Settings, label: 'ข้อมูลพื้นฐาน' },
  { to: '/admin/users', icon: Users, label: 'จัดการผู้ใช้' },
  { to: '/staff/dispatch', icon: Truck, label: 'คิวส่งแมสฯ / รับคืน' },
  { to: '/admin/refund', icon: Wallet, label: 'คืนเงินมัดจำ' },
  { to: '/admin/reports', icon: BarChart3, label: 'รายงาน' },
  { to: '/admin/activity', icon: ClipboardList, label: 'ประวัติการทำรายการ' },
  { to: '/admin/notifications', icon: Bell, label: 'การแจ้งเตือน' },
];

function NavLinkItem({ to, icon: Icon, label, active }) {
  return (
    <Link to={to} className={active ? 'active' : ''}>
      {Icon && <Icon size={18} />} {label}
    </Link>
  );
}

export default function DashboardLayout({ children, role = 'staff' }) {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const bookingOpen = location.pathname.startsWith('/admin/bookings');
  const [ordersOpen, setOrdersOpen] = useState(bookingOpen);
  const currentGroup = searchParams.get('group') || 'all';

  useEffect(() => {
    if (bookingOpen) setOrdersOpen(true);
  }, [bookingOpen]);

  if (role !== 'admin') {
    return (
      <div className="dashboard-layout">
        <aside className="sidebar">
          <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingRight: '1.25rem' }}>
            <span>🎓 KruyMo Staff</span>
            <NotificationBell variant="light" />
          </div>
          <p style={{ padding: '0 1.5rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem' }}>
            {user?.name}
          </p>
          <nav className="sidebar-nav">
            {staffLinks.map(({ to, icon: Icon, label }) => (
              <NavLinkItem key={to} to={to} icon={Icon} label={label} active={location.pathname === to} />
            ))}
            <button onClick={logout} style={{ marginTop: '2rem' }}>
              <LogOut size={18} /> ออกจากระบบ
            </button>
          </nav>
        </aside>
        <main className="dashboard-main">{children}</main>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingRight: '1.25rem' }}>
          <span>🎓 KruyMo Admin</span>
          <NotificationBell variant="light" />
        </div>
        <p style={{ padding: '0 1.5rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem' }}>
          {user?.name}
        </p>
        <nav className="sidebar-nav">
          {adminTopLinks.map(({ to, icon: Icon, label }) => (
            <NavLinkItem key={to} to={to} icon={Icon} label={label} active={location.pathname === to} />
          ))}

          <button
            type="button"
            className={`sidebar-parent ${bookingOpen ? 'active' : ''}`}
            onClick={() => setOrdersOpen((v) => !v)}
          >
            <ClipboardList size={18} />
            <span style={{ flex: 1 }}>จัดการคำสั่งเช่า</span>
            <ChevronDown size={16} style={{ transform: ordersOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
          </button>
          {ordersOpen && (
            <div className="sidebar-subnav">
              {bookingSubLinks.map((item) => {
                const active = bookingOpen && currentGroup === item.group;
                return (
                  <Link key={item.group} to={item.to} className={active ? 'active' : ''}>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}

          {adminRestLinks.map(({ to, icon: Icon, label }) => (
            <NavLinkItem
              key={to}
              to={to}
              icon={Icon}
              label={label}
              active={location.pathname === to}
            />
          ))}

          <button onClick={logout} style={{ marginTop: '2rem' }}>
            <LogOut size={18} /> ออกจากระบบ
          </button>
        </nav>
      </aside>
      <main className="dashboard-main">{children}</main>
    </div>
  );
}
