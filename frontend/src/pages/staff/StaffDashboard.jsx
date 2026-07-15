import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingAPI } from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import './staff.css';

const PENDING_STATUSES = ['pending', 'payment_pending', 'payment_verified'];
const ACTIVE_STATUSES = [
  'approved', 'preparing', 'ready_to_ship', 'out_for_delivery',
  'delivered', 'return_submitted', 'ready_for_pickup', 'picked_up',
];

function nextPathForBooking(b) {
  if (['ready_to_ship', 'ready_for_pickup', 'out_for_delivery', 'return_submitted'].includes(b.status)) {
    return { path: '/staff/dispatch' };
  }
  if (['delivered', 'picked_up'].includes(b.status)) {
    return { path: '/staff/dispatch' };
  }
  if (b.status === 'returned') {
    return { path: '/staff/refund' };
  }
  if (PENDING_STATUSES.includes(b.status) || ACTIVE_STATUSES.includes(b.status)) {
    return { path: `/staff/bookings?status=${b.status}&focus=${b.id}` };
  }
  return { path: `/staff/bookings?status=${b.status}` };
}

function actionHint(status) {
  const map = {
    payment_pending: 'รอลูกค้าชำระ',
    pending: 'ตรวจสลิป',
    payment_verified: 'รออนุมัติ',
    approved: 'เตรียมชุด',
    preparing: 'เช็ค checklist',
    ready_to_ship: 'จัดแมสฯ ส่ง',
    ready_for_pickup: 'จัดแมสฯ ส่ง',
    out_for_delivery: 'รอส่งถึง',
    delivered: 'รอลูกค้าส่งคืน',
    picked_up: 'รอลูกค้าส่งคืน',
    return_submitted: 'รับคืนเข้าคลัง',
    returned: 'คืนมัดจำ',
  };
  return map[status] || 'ดูรายละเอียด';
}

export default function StaffDashboard() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingAPI.getAll()
      .then((r) => setBookings(r.data))
      .finally(() => setLoading(false));
  }, []);

  const pending = bookings.filter((b) => PENDING_STATUSES.includes(b.status));
  const shipQueue = bookings.filter((b) =>
    ['ready_to_ship', 'ready_for_pickup', 'out_for_delivery', 'return_submitted'].includes(b.status));
  const needSlip = bookings.filter((b) => b.status === 'pending');
  const recent = [...bookings]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8);

  const goBooking = (b) => {
    const { path, state } = nextPathForBooking(b);
    navigate(path, state ? { state } : undefined);
  };

  const todayLabel = new Date().toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <DashboardLayout role="staff">
      <div className="staff-ops">
        <div className="staff-page-head">
          <div>
            <h1 className="page-title">แดชบอร์ดพนักงาน</h1>
            <p className="page-subtitle">งานวันนี้ — ตรวจสลิป · ส่งแมสฯ · รับคืน · คืนมัดจำ</p>
          </div>
          <div className="staff-head-meta">{todayLabel}</div>
        </div>

        <div className="staff-stat-grid">
          <button
            type="button"
            className="staff-stat"
            style={{ '--stat-accent': '#E63946' }}
            onClick={() => navigate('/staff/bookings?group=pending')}
          >
            <span className="staff-stat-kicker">รอดำเนินการ</span>
            <span className="staff-stat-value">{pending.length}</span>
            <span className="staff-stat-hint">
              {needSlip.length > 0 ? `${needSlip.length} รายการรอตรวจสลิป` : 'ไม่มีคิวเร่งด่วน'}
            </span>
          </button>
          <button
            type="button"
            className="staff-stat"
            style={{ '--stat-accent': '#1D3557' }}
            onClick={() => navigate('/staff/dispatch')}
          >
            <span className="staff-stat-kicker">คิวแมสฯ / รับคืน</span>
            <span className="staff-stat-value">{shipQueue.length}</span>
            <span className="staff-stat-hint">ส่งวันนี้และของรอรับคืน</span>
          </button>
          <button
            type="button"
            className="staff-stat"
            style={{ '--stat-accent': '#4CC9F0' }}
            onClick={() => navigate('/staff/bookings')}
          >
            <span className="staff-stat-kicker">ทั้งหมด</span>
            <span className="staff-stat-value">{bookings.length}</span>
            <span className="staff-stat-hint">เปิดรายการคำสั่งเช่า</span>
          </button>
        </div>

        <div className="staff-panel">
          <div className="staff-panel-head">
            <h3>รายการล่าสุด</h3>
            <span className="staff-panel-count">{recent.length} รายการ</span>
          </div>

          {loading ? (
            <div className="staff-empty">กำลังโหลด...</div>
          ) : recent.length === 0 ? (
            <div className="staff-empty">ยังไม่มีรายการจอง</div>
          ) : (
            <div className="staff-booking-list">
              {recent.map((b) => (
                <div
                  key={b.id}
                  className="staff-booking-row is-clickable"
                  onClick={() => goBooking(b)}
                  onKeyDown={(e) => e.key === 'Enter' && goBooking(b)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="staff-booking-main">
                    <div className="staff-booking-title">
                      <strong>{b.user?.name || 'ลูกค้า'}</strong>
                      <StatusBadge status={b.status} size="sm" />
                    </div>
                    <div className="staff-booking-meta">
                      <span>{b.costume?.name || '-'}</span>
                      <span>{new Date(b.createdAt).toLocaleDateString('th-TH')}</span>
                    </div>
                  </div>
                  <div className="staff-booking-side">
                    <span className="amount">฿{(b.totalPrice || 0).toLocaleString()}</span>
                    ขั้นตอนถัดไป: {actionHint(b.status)}
                  </div>
                  <div className="staff-actions">
                    <span className="btn btn-ghost btn-sm" style={{ pointerEvents: 'none' }}>
                      ไปทำต่อ →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
