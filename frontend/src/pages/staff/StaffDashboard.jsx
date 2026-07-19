import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt, Truck, Wallet, ClipboardList, ArrowRight,
  AlertCircle, Package,
} from 'lucide-react';
import { bookingAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import './staff.css';

function nextPathForBooking(b) {
  if (b.status === 'pending' || b.status === 'payment_verified') {
    return '/staff/dispatch?queue=approve';
  }
  if (['preparing', 'approved'].includes(b.status)) {
    return '/staff/dispatch?queue=prep';
  }
  if (['ready_to_ship', 'ready_for_pickup'].includes(b.status)) {
    return '/staff/dispatch?queue=ready';
  }
  if (b.status === 'out_for_delivery') {
    return '/staff/dispatch?queue=shipping';
  }
  if (['delivered', 'picked_up'].includes(b.status)) {
    return '/staff/dispatch?queue=with_customer';
  }
  if (b.status === 'return_submitted') {
    return '/staff/dispatch?queue=inbound';
  }
  if (b.status === 'returned') {
    return '/staff/refund';
  }
  return `/staff/bookings?status=${b.status}&focus=${b.id}`;
}

function actionHint(status) {
  const map = {
    pending: 'ตรวจสลิป',
    payment_verified: 'ตรวจสลิป',
    approved: 'จัดเตรียมชุด',
    preparing: 'จัดเตรียมชุด',
    ready_to_ship: 'มอบหมายจัดส่ง',
    ready_for_pickup: 'มอบหมายจัดส่ง',
    out_for_delivery: 'ยืนยันส่งถึง',
    delivered: 'รอลูกค้าส่งคืน',
    picked_up: 'รอลูกค้าส่งคืน',
    return_submitted: 'รับคืนเข้าคลัง',
    returned: 'คืนมัดจำ',
  };
  return map[status] || 'ดูรายละเอียด';
}

function shortId(id = '') {
  return id.replace(/-/g, '').slice(0, 8).toUpperCase();
}

function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function StaffDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingAPI.getAll()
      .then((r) => setBookings(r.data || []))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const needSlip = bookings.filter((b) => b.status === 'pending');
    const prep = bookings.filter((b) => ['preparing', 'approved'].includes(b.status));
    const shipQueue = bookings.filter((b) =>
      ['ready_to_ship', 'ready_for_pickup', 'out_for_delivery', 'return_submitted'].includes(b.status));
    // คืนมัดจำหลังรับเข้าคลังแล้วเท่านั้น — return_submitted อยู่คิวจัดส่ง/รับคืน
    const awaitRefund = bookings.filter((b) => b.status === 'returned');
    const urgent = needSlip.length + prep.length + awaitRefund.length;
    return { needSlip, prep, shipQueue, awaitRefund, urgent };
  }, [bookings]);

  const recent = useMemo(() => [...bookings]
    .filter((b) => !['cancelled', 'rejected', 'payment_pending', 'deposit_refunded'].includes(b.status))
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 8), [bookings]);

  const todayLabel = new Date().toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const firstName = (user?.name || 'พนักงาน').trim().split(/\s+/)[0];

  const queues = [
    {
      key: 'slip',
      label: 'รอตรวจสลิป',
      value: stats.needSlip.length,
      hint: stats.needSlip.length > 0
        ? `${stats.needSlip.length} รายการเร่งด่วน`
        : 'ไม่มีคิวรอตรวจ',
      icon: Receipt,
      tone: 'red',
      path: '/staff/dispatch?queue=approve',
    },
    {
      key: 'ship',
      label: 'จัดส่งและรับคืน',
      value: stats.shipQueue.length,
      hint: stats.prep.length > 0
        ? `${stats.prep.length} รายการกำลังจัดเตรียม`
        : 'คิวส่ง / รับคืนวันนี้',
      icon: Truck,
      tone: 'dark',
      path: '/staff/dispatch',
    },
    {
      key: 'refund',
      label: 'รอคืนมัดจำ',
      value: stats.awaitRefund.length,
      hint: stats.awaitRefund.length > 0 ? 'มีรายการรอโอนคืน' : 'ยังไม่มีคิวคืนมัดจำ',
      icon: Wallet,
      tone: 'green',
      path: '/staff/refund',
    },
    {
      key: 'all',
      label: 'คำสั่งเช่าทั้งหมด',
      value: bookings.length,
      hint: 'เปิดรายการทั้งหมด',
      icon: ClipboardList,
      tone: 'muted',
      path: '/staff/bookings',
    },
  ];

  return (
    <DashboardLayout role="staff">
      <div className="staff-ops staff-home-desk">
        <header className="home-hero">
          <div className="home-hero-copy">
            <p className="home-hero-kicker">วันนี้ · {todayLabel}</p>
            <h1>สวัสดี, {firstName}</h1>
            <p>สรุปงานที่ต้องทำ — ตรวจสลิป · จัดส่ง · รับคืน · คืนมัดจำ</p>
          </div>
          <div className="home-hero-aside">
            <span>งานที่ต้องโฟกัส</span>
            <strong>{loading ? '—' : stats.urgent}</strong>
            <small>สลิป / จัดเตรียม / คืนมัดจำ</small>
          </div>
        </header>

        {!loading && stats.needSlip.length > 0 && (
          <button
            type="button"
            className="home-alert"
            onClick={() => navigate('/staff/dispatch?queue=approve')}
          >
            <AlertCircle size={18} />
            <div>
              <strong>มีสลิปรอตรวจ {stats.needSlip.length} รายการ</strong>
              <span>ตรวจยืนยันก่อน เพื่อให้เข้าคิวจัดเตรียมชุดได้ทันที</span>
            </div>
            <ArrowRight size={18} />
          </button>
        )}

        <section className="home-queue-grid" aria-label="คิวงานหลัก">
          {queues.map((q) => {
            const Icon = q.icon;
            return (
              <button
                key={q.key}
                type="button"
                className={`home-queue-card tone-${q.tone}`}
                onClick={() => navigate(q.path)}
              >
                <div className="home-queue-top">
                  <span className="home-queue-icon"><Icon size={18} /></span>
                  <ArrowRight size={16} className="home-queue-arrow" />
                </div>
                <span className="home-queue-label">{q.label}</span>
                <strong className="home-queue-value">{loading ? '—' : q.value}</strong>
                <span className="home-queue-hint">{q.hint}</span>
              </button>
            );
          })}
        </section>

        <section className="home-panel">
          <header className="home-panel-head">
            <div>
              <h2>งานที่ต้องทำต่อ</h2>
              <p>รายการล่าสุดที่ยังอยู่ในกระบวนการ — กดเพื่อไปทำต่อ</p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/staff/bookings')}
            >
              ดูทั้งหมด
            </button>
          </header>

          {loading ? (
            <div className="home-empty">กำลังโหลดงาน...</div>
          ) : recent.length === 0 ? (
            <div className="home-empty">
              <Package size={28} strokeWidth={1.5} />
              <h3>ยังไม่มีงานค้าง</h3>
              <p>เมื่อมีคำสั่งเช่าใหม่ จะแสดงที่นี่ให้ดำเนินการต่อ</p>
            </div>
          ) : (
            <div className="home-work-list">
              {recent.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className="home-work-row"
                  onClick={() => navigate(nextPathForBooking(b))}
                >
                  <div className="home-work-who">
                    <div className="home-avatar" aria-hidden>{initials(b.user?.name)}</div>
                    <div>
                      <div className="home-work-name">
                        <strong>{b.user?.name || 'ลูกค้า'}</strong>
                        <StatusBadge status={b.status} size="sm" />
                      </div>
                      <p>
                        {b.costume?.name || '—'}
                        {' · '}
                        <code>#{shortId(b.id)}</code>
                      </p>
                    </div>
                  </div>
                  <div className="home-work-next">
                    <span>ขั้นตอนถัดไป</span>
                    <strong>{actionHint(b.status)}</strong>
                  </div>
                  <div className="home-work-amount">
                    <strong>฿{(b.totalPrice || 0).toLocaleString()}</strong>
                    <span className="home-work-go">
                      ไปทำต่อ
                      <ArrowRight size={14} />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
