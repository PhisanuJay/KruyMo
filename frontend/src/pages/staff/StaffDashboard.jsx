import { useState, useEffect } from 'react';
import { bookingAPI } from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';

export default function StaffDashboard() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    bookingAPI.getAll().then((r) => setBookings(r.data));
  }, []);

  const pending = bookings.filter((b) => ['payment_pending', 'payment_verified'].includes(b.status));
  const active = bookings.filter((b) => ['approved', 'preparing', 'ready_for_pickup', 'picked_up'].includes(b.status));

  return (
    <DashboardLayout role="staff">
      <h1 className="page-title">แดชบอร์ดพนักงาน</h1>
      <p className="page-subtitle">ภาพรวมงานที่ต้องดำเนินการ</p>

      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-value">{pending.length}</div>
          <div className="stat-label">รอดำเนินการ</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{active.length}</div>
          <div className="stat-label">กำลังดำเนินการ</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{bookings.length}</div>
          <div className="stat-label">ทั้งหมด</div>
        </div>
      </div>

      <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>รายการล่าสุด</h3>
      <div className="card table-wrapper">
        <table>
          <thead>
            <tr><th>ลูกค้า</th><th>ชุดครุย</th><th>สถานะ</th><th>วันที่</th></tr>
          </thead>
          <tbody>
            {bookings.slice(0, 10).map((b) => (
              <tr key={b.id}>
                <td>{b.user?.name}</td>
                <td>{b.costume?.name}</td>
                <td><StatusBadge status={b.status} size="sm" /></td>
                <td>{new Date(b.createdAt).toLocaleDateString('th-TH')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
