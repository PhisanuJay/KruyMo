import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, BarChart3, Settings,
  ClipboardList, LogOut, Bell, Shirt, Wallet, Truck,
} from 'lucide-react';

const staffLinks = [
  { to: '/staff', icon: LayoutDashboard, label: 'แดชบอร์ด' },
  { to: '/staff/bookings', icon: ClipboardList, label: 'จัดการคำสั่งเช่า' },
  { to: '/staff/dispatch', icon: Truck, label: 'จัดส่งและรับคืน' },
  { to: '/staff/refund', icon: BarChart3, label: 'คืนเงินมัดจำ' },
];

const adminNavSections = [
  {
    title: 'ภาพรวม',
    links: [
      { to: '/admin', icon: LayoutDashboard, label: 'ภาพรวมระบบ', end: true },
    ],
  },
  {
    title: 'คำสั่งเช่า',
    links: [
      { to: '/admin/bookings', icon: ClipboardList, label: 'จัดการคำสั่งเช่า' },
      { to: '/admin/dispatch', icon: Truck, label: 'จัดส่งและรับคืน' },
      { to: '/admin/refund', icon: Wallet, label: 'ติดตามคืนมัดจำ' },
    ],
  },
  {
    title: 'ชุดครุย',
    links: [
      { to: '/admin/costumes', icon: Shirt, label: 'จัดการชุดครุย' },
      { to: '/admin/master-data', icon: Settings, label: 'ข้อมูลหลัก' },
    ],
  },
  {
    title: 'รายงาน',
    links: [
      { to: '/admin/reports', icon: BarChart3, label: 'รายงาน' },
      { to: '/admin/activity', icon: ClipboardList, label: 'ประวัติการทำรายการ' },
    ],
  },
  {
    title: 'ระบบ',
    links: [
      { to: '/admin/users', icon: Users, label: 'จัดการผู้ใช้' },
      { to: '/admin/notifications', icon: Bell, label: 'เทมเพลตแจ้งเตือน' },
    ],
  },
];

function isNavActive(pathname, to, end = false) {
  if (end) return pathname === to;
  if (to === '/admin/bookings') return pathname.startsWith('/admin/bookings');
  return pathname === to || pathname.startsWith(`${to}/`);
}

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

  if (role !== 'admin') {
    return (
      <div className="dashboard-layout">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <span>KruyMo Staff</span>
          </div>
          <p className="sidebar-user">{user?.name}</p>
          <nav className="sidebar-nav">
            {staffLinks.map(({ to, icon: Icon, label }) => (
              <NavLinkItem
                key={to}
                to={to}
                icon={Icon}
                label={label}
                active={location.pathname === to}
              />
            ))}
            <button type="button" className="sidebar-logout" onClick={logout}>
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
        <div className="sidebar-logo">
          <span>KruyMo Admin</span>
        </div>
        <p className="sidebar-user">{user?.name}</p>
        <nav className="sidebar-nav">
          {adminNavSections.map((section) => (
            <div key={section.title} className="sidebar-section">
              <div className="sidebar-section-title">{section.title}</div>
              {section.links.map(({ to, icon: Icon, label, end }) => (
                <NavLinkItem
                  key={to}
                  to={to}
                  icon={Icon}
                  label={label}
                  active={isNavActive(location.pathname, to, end)}
                />
              ))}
            </div>
          ))}
          <button type="button" className="sidebar-logout" onClick={logout}>
            <LogOut size={18} /> ออกจากระบบ
          </button>
        </nav>
      </aside>
      <main className="dashboard-main">{children}</main>
    </div>
  );
}
