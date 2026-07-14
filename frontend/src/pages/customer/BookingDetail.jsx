import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CalendarDays, Ruler, GraduationCap, Image as ImageIcon } from 'lucide-react';
import { bookingAPI, paymentAPI, uploadAPI } from '../../services/api';
import CustomerLayout from '../../components/CustomerLayout';
import StatusTimeline from '../../components/StatusTimeline';
import StatusBadge from '../../components/StatusBadge';
import UploadBox from '../../components/UploadBox';

const DEGREE_LABELS = {
  bachelor: 'ปริญญาตรี',
  master: 'ปริญญาโท',
  doctoral: 'ปริญญาเอก',
};

export default function BookingDetail() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [returnImages, setReturnImages] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleCancel = async () => {
    if (!confirm('ยืนยันยกเลิกการจอง?')) return;
    await bookingAPI.cancel(id);
    await load();
  };

  const handlePickup = async () => {
    const { data } = await bookingAPI.pickup(id);
    setBooking(data);
  };

  const handleReturnUpload = async (files) => {
    const fileArr = Array.isArray(files) ? files : [files];
    const { data } = await uploadAPI.multiple(fileArr);
    setReturnImages((prev) => [...prev, ...data.urls]);
  };

  const handleReturn = async () => {
    const { data } = await bookingAPI.return(id, { returnImages });
    setBooking(data);
  };

  if (loading) return <CustomerLayout><div className="loading">กำลังโหลด...</div></CustomerLayout>;
  if (!booking) return <CustomerLayout><div className="empty-state">ไม่พบการจอง</div></CustomerLayout>;

  const canCancel = ['pending', 'payment_pending'].includes(booking.status);
  const slipImage = payment?.slipImage;

  return (
    <CustomerLayout>
      <div className="container" style={{ maxWidth: 700, padding: '2rem 20px' }}>
        <Link to="/bookings" style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>← กลับ</Link>
        <h1 className="page-title" style={{ marginTop: '1rem' }}>สถานะการจอง</h1>
        <div style={{ marginBottom: '1rem' }}><StatusBadge status={booking.status} /></div>

        <StatusTimeline status={booking.status} />

        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>{booking.costume?.name}</h3>
          <div style={{ display: 'grid', gap: '0.55rem', fontSize: '0.95rem' }}>
            <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <GraduationCap size={16} color="var(--primary)" />
              ระดับ: {booking.degreeLabel || DEGREE_LABELS[booking.degreeLevel] || booking.degreeLevel || '-'}
            </p>
            <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Ruler size={16} color="var(--primary)" />
              ไซส์: {booking.size?.label || '-'}
              {booking.size?.description ? ` (${booking.size.description})` : ''}
            </p>
            <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarDays size={16} color="var(--primary)" />
              {new Date(booking.startDate).toLocaleDateString('th-TH')} - {new Date(booking.endDate).toLocaleDateString('th-TH')}
            </p>
            <p>ค่าเช่า ฿{booking.rentalPrice?.toLocaleString()} + มัดจำ ฿{booking.deposit?.toLocaleString()}</p>
            <p style={{ fontWeight: 800, color: 'var(--primary)' }}>
              รวม ฿{booking.totalPrice?.toLocaleString()}
            </p>
          </div>
          {booking.refundAmount != null && (
            <p style={{ color: '#00B894', fontWeight: 600, marginTop: '0.75rem' }}>
              คืนมัดจำ ฿{booking.refundAmount?.toLocaleString()}
            </p>
          )}
          {booking.penaltyAmount > 0 && (
            <p style={{ color: '#E17055', marginTop: '0.5rem' }}>ค่าปรับ ฿{booking.penaltyAmount?.toLocaleString()}</p>
          )}
          {booking.status === 'payment_pending' && (
            <div className="alert alert-info" style={{ marginTop: '1rem', marginBottom: 0 }}>
              คำสั่งนี้ยังไม่ได้ชำระเงิน หากออกจากหน้าชำระเงินโดยไม่ส่งสลิป ระบบจะให้ยืนยันยกเลิกคำสั่งซื้อ
            </div>
          )}
        </div>

        {slipImage && (
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ImageIcon size={18} color="var(--primary)" />
              สลิปการชำระเงิน
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
              สลิปที่แนบไว้กับการจองนี้
              {payment?.submittedAt && (
                <> · ส่งเมื่อ {new Date(payment.submittedAt).toLocaleString('th-TH')}</>
              )}
            </p>
            <a href={slipImage} target="_blank" rel="noreferrer" className="booking-slip-preview">
              <img src={slipImage} alt="สลิปการชำระเงิน" />
            </a>
            {payment?.status === 'pending' && (
              <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                สถานะสลิป: รอพนักงานตรวจสอบ
              </p>
            )}
            {payment?.status === 'verified' && (
              <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--success)' }}>
                สถานะสลิป: ยืนยันแล้ว
              </p>
            )}
            {payment?.status === 'rejected' && (
              <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--danger)' }}>
                สถานะสลิป: ไม่ผ่านการตรวจสอบ
              </p>
            )}
          </div>
        )}

        {canCancel && (
          <button type="button" className="btn btn-danger btn-sm" onClick={handleCancel}>
            ยกเลิกการจอง
          </button>
        )}

        {booking.status === 'ready_for_pickup' && (
          <button type="button" className="btn btn-success" onClick={handlePickup}>ยืนยันรับชุด</button>
        )}

        {booking.status === 'picked_up' && (
          <div className="card" style={{ padding: '1.5rem', marginTop: '1rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>คืนชุด</h3>
            <UploadBox
              label="อัปโหลดรูปสภาพชุดตอนคืน"
              preview={returnImages}
              onUpload={handleReturnUpload}
              multiple
              onRemove={(i) => setReturnImages((prev) => prev.filter((_, idx) => idx !== i))}
            />
            <button type="button" className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={handleReturn}>
              ยืนยันคืนชุด
            </button>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
