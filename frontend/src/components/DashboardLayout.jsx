import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Package, Users, BarChart3, Settings,
  ClipboardList, LogOut, Bell, Shirt,
} from 'lucide-react';

const staffLinks = [
  { to: '/staff', icon: LayoutDashboard, label: 'แดชบอร์ด' },
  { to: '/staff/bookings', icon: ClipboardList, label: 'จัดการคำสั่งเช่า' },
  { to: '/staff/pickup-return', icon: Package, label: 'รับ-คืนชุด' },
  { to: '/staff/refund', icon: BarChart3, label: 'คืนเงินมัดจำ' },
];

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'ภาพรวม' },
  { to: '/admin/costumes', icon: Shirt, label: 'จัดการชุดครุย' },
  { to: '/admin/master-data', icon: Settings, label: 'ข้อมูลหลัก' },
  { to: '/admin/users', icon: Users, label: 'จัดการผู้ใช้' },
  { to: '/admin/reports', icon: BarChart3, label: 'รายงาน' },
  { to: '/admin/activity', icon: ClipboardList, label: 'ประวัติการทำรายการ' },
  { to: '/admin/notifications', icon: Bell, label: 'เทมเพลตแจ้งเตือน' },
  { to: '/staff/bookings', icon: ClipboardList, label: 'จัดการคำสั่งเช่า' },
  { to: '/staff/pickup-return', icon: Package, label: 'รับ-คืนชุด' },
];

export default function DashboardLayout({ children, role = 'staff' }) {
  const { logout, user } = useAuth();
  const location = useLocation();
  const links = role === 'admin' ? adminLinks : staffLinks;

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">🎓 KruyMo {role === 'admin' ? 'Admin' : 'Staff'}</div>
        <p style={{ padding: '0 1.5rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem' }}>
          {user?.name}
        </p>
        <nav className="sidebar-nav">
          {links.map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to} className={location.pathname === to ? 'active' : ''}>
              <Icon size={18} /> {label}
            </Link>
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
