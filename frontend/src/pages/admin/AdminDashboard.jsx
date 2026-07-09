import { useState, useEffect } from 'react';
import { reportAPI } from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    reportAPI.dashboard().then((r) => setData(r.data));
  }, []);

  if (!data) return <DashboardLayout role="admin"><div className="loading">กำลังโหลด...</div></DashboardLayout>;

  return (
    <DashboardLayout role="admin">
      <h1 className="page-title">ภาพรวมระบบ</h1>
      <p className="page-subtitle">สถิติและข้อมูลสำคัญของ KruyMo</p>

      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-value">฿{data.totalRevenue?.toLocaleString()}</div>
          <div className="stat-label">รายได้รวม</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#4ECDC4' }}>{data.todayRentals}</div>
          <div className="stat-label">การเช่าวันนี้</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#00B894' }}>{data.totalStock}</div>
          <div className="stat-label">ชุดคงเหลือ</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#FDCB6E' }}>{data.pendingApproval}</div>
          <div className="stat-label">รออนุมัติ</div>
        </div>
      </div>

      <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>การจองล่าสุด</h3>
      <div className="card table-wrapper">
        <table>
          <thead>
            <tr><th>ID</th><th>สถานะ</th><th>ยอดรวม</th><th>วันที่</th></tr>
          </thead>
          <tbody>
            {data.recentBookings?.map((b) => (
              <tr key={b.id}>
                <td style={{ fontSize: '0.8rem' }}>{b.id.substring(0, 8)}...</td>
                <td><StatusBadge status={b.status} size="sm" /></td>
                <td>฿{b.totalPrice?.toLocaleString()}</td>
                <td>{new Date(b.createdAt).toLocaleDateString('th-TH')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
