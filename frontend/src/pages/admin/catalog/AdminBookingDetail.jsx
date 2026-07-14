import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  GraduationCap,
  Ruler,
  User,
  Phone,
  Mail,
  Image as ImageIcon,
} from 'lucide-react';
import { bookingAPI, paymentAPI } from '../../../services/api';
import DashboardLayout from '../../../components/DashboardLayout';
import StatusTimeline from '../../../components/StatusTimeline';
import StatusBadge from '../../../components/StatusBadge';

const DEGREE_LABELS = {
  bachelor: 'ปริญญาตรี',
  master: 'ปริญญาโท',
  doctoral: 'ปริญญาเอก',
};

function formatOrderId(booking) {
  const d = new Date(booking.createdAt);
  const y = d.getFullYear() + 543;
  const md = `${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const seq = booking.id.replace(/-/g, '').slice(-3).toUpperCase();
  return `#ORD-${y}${md}-${seq}`;
}

export default function AdminBookingDetail() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [acting, setActing] = useState(false);

  const load = async () => {
    const [b, p] = await Promise.all([
      bookingAPI.get(id),
      paymentAPI.getByBooking(id).catch(() => ({ data: null })),
    ]);
    setBooking(b.data);
    setPayment(p.data);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [id]);

  const handleVerifyAndApprove = async () => {
    setActing(true);
    try {
      if (payment?.id) {
        await paymentAPI.verify(payment.id, 'verified');
      }
      await bookingAPI.updateStatus(id, { status: 'approved' });
      await load();
    } catch (err) {
      alert(err.response?.data?.error || 'ดำเนินการไม่สำเร็จ');
    } finally {
      setActing(false);
    }
  };

  const handleApprove = async () => {
    setActing(true);
    try {
      await bookingAPI.updateStatus(id, { status: 'approved' });
      await load();
    } catch (err) {
      alert(err.response?.data?.error || 'อนุมัติไม่สำเร็จ');
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('กรุณากรอกเหตุผล');
      return;
    }
    setActing(true);
    try {
      await bookingAPI.updateStatus(id, { status: 'rejected', rejectReason });
      setShowReject(false);
      setRejectReason('');
      await load();
    } catch (err) {
      alert(err.response?.data?.error || 'ปฏิเสธไม่สำเร็จ');
    } finally {
      setActing(false);
    }
  };

  const handleStatus = async (status) => {
    setActing(true);
    try {
      await bookingAPI.updateStatus(id, { status });
      await load();
    } catch (err) {
      alert(err.response?.data?.error || 'อัปเดตสถานะไม่สำเร็จ');
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="loading">กำลังโหลด...</div>
      </DashboardLayout>
    );
  }

  if (!booking) {
    return (
      <DashboardLayout role="admin">
        <div className="empty-state">ไม่พบการจอง</div>
        <Link to="/admin/bookings" className="btn btn-outline btn-sm">กลับรายการจอง</Link>
      </DashboardLayout>
    );
  }

  const slipImage = payment?.slipImage;

  return (
    <DashboardLayout role="admin">
      <div className="booking-page-head">
        <div>
          <Link to="/admin/bookings" className="booking-back-link">
            <ArrowLeft size={16} />
            กลับรายการจอง
          </Link>
          <h1 className="page-title" style={{ marginTop: '0.75rem' }}>รายละเอียดการจอง</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            {formatOrderId(booking)} · มุมมองแอดมิน
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <StatusTimeline status={booking.status} />

      <div className="admin-booking-grid">
        <section className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>ข้อมูลการจอง</h3>
          <h4 style={{ fontWeight: 700, marginBottom: '0.85rem' }}>{booking.costume?.name || 'ชุดครุย'}</h4>
          <div className="admin-booking-meta">
            <p><GraduationCap size={16} /> ระดับ: {booking.degreeLabel || DEGREE_LABELS[booking.degreeLevel] || '-'}</p>
            <p>
              <Ruler size={16} />
              ไซส์: {booking.size?.label || '-'}
              {booking.size?.description ? ` (${booking.size.description})` : ''}
            </p>
            <p>
              <CalendarDays size={16} />
              {new Date(booking.startDate).toLocaleDateString('th-TH')}
              {' – '}
              {new Date(booking.endDate).toLocaleDateString('th-TH')}
            </p>
            <p>ค่าเช่า ฿{booking.rentalPrice?.toLocaleString()} + มัดจำ ฿{booking.deposit?.toLocaleString()}</p>
            <p style={{ fontWeight: 800, color: 'var(--primary)' }}>
              รวม ฿{booking.totalPrice?.toLocaleString()}
            </p>
          </div>
        </section>

        <section className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>ข้อมูลลูกค้า</h3>
          <div className="admin-booking-meta">
            <p><User size={16} /> {booking.user?.name || '—'}</p>
            <p><Mail size={16} /> {booking.user?.email || '—'}</p>
            <p><Phone size={16} /> {booking.user?.phone || '—'}</p>
          </div>
          {booking.rejectReason && (
            <div className="alert alert-error" style={{ marginTop: '1rem', marginBottom: 0 }}>
              เหตุผลปฏิเสธ: {booking.rejectReason}
            </div>
          )}
        </section>
      </div>

      {slipImage && (
        <section className="card" style={{ padding: '1.5rem', marginTop: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ImageIcon size={18} color="var(--primary)" />
            สลิปการชำระเงิน
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
            {payment?.submittedAt && (
              <>ส่งเมื่อ {new Date(payment.submittedAt).toLocaleString('th-TH')} · </>
            )}
            สถานะสลิป: {payment?.status === 'verified' ? 'ยืนยันแล้ว' : payment?.status === 'rejected' ? 'ไม่ผ่าน' : 'รอตรวจสอบ'}
          </p>
          <a href={slipImage} target="_blank" rel="noreferrer" className="booking-slip-preview">
            <img src={slipImage} alt="สลิปการชำระเงิน" />
          </a>
        </section>
      )}

      <section className="card" style={{ padding: '1.5rem', marginTop: '1.25rem' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>จัดการคำสั่ง</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
          {booking.status === 'pending' && (
            <>
              <button type="button" className="btn btn-success btn-sm" disabled={acting} onClick={handleVerifyAndApprove}>
                ยืนยันชำระเงินและอนุมัติ
              </button>
              <button type="button" className="btn btn-danger btn-sm" disabled={acting} onClick={() => setShowReject(true)}>
                ปฏิเสธ
              </button>
            </>
          )}
          {booking.status === 'payment_verified' && (
            <>
              <button type="button" className="btn btn-success btn-sm" disabled={acting} onClick={handleApprove}>
                อนุมัติ
              </button>
              <button type="button" className="btn btn-danger btn-sm" disabled={acting} onClick={() => setShowReject(true)}>
                ปฏิเสธ
              </button>
            </>
          )}
          {booking.status === 'approved' && (
            <button type="button" className="btn btn-primary btn-sm" disabled={acting} onClick={() => handleStatus('preparing')}>
              เริ่มเตรียมชุด
            </button>
          )}
          {booking.status === 'preparing' && (
            <button type="button" className="btn btn-primary btn-sm" disabled={acting} onClick={() => handleStatus('ready_for_pickup')}>
              ตั้งเป็นพร้อมรับ
            </button>
          )}
          {booking.status === 'payment_pending' && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>รอลูกค้าชำระเงิน / ส่งสลิป</p>
          )}
          {!['pending', 'payment_verified', 'approved', 'preparing', 'payment_pending'].includes(booking.status) && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>ไม่มีปุ่มจัดการเพิ่มเติมในสถานะนี้</p>
          )}
        </div>

        {showReject && (
          <div style={{ marginTop: '1.25rem' }}>
            <div className="form-group">
              <label>เหตุผลการปฏิเสธ</label>
              <textarea
                className="form-input"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowReject(false)}>ยกเลิก</button>
              <button type="button" className="btn btn-danger btn-sm" disabled={acting} onClick={handleReject}>
                ยืนยันปฏิเสธ
              </button>
            </div>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
