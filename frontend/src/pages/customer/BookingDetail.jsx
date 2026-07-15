import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CalendarDays, Ruler, GraduationCap, Image as ImageIcon, Truck } from 'lucide-react';
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
  const [returnNote, setReturnNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const load = async () => {
    const [b, p] = await Promise.all([
      bookingAPI.get(id),
      paymentAPI.getByBooking(id).catch(() => ({ data: null })),
    ]);
    setBooking(b.data);
    setPayment(p.data);
    setReturnImages(b.data?.returnImages || []);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!confirm('ยืนยันยกเลิกการจอง?')) return;
    await bookingAPI.cancel(id);
    await load();
  };

  const handleConfirmDelivered = async () => {
    setActing(true);
    try {
      // ลูกค้ายืนยันได้รับของจากแมสฯ
      await bookingAPI.pickup(id);
      await load();
    } finally {
      setActing(false);
    }
  };

  const handleReturnUpload = async (files) => {
    const fileArr = Array.isArray(files) ? files : [files];
    const { data } = await uploadAPI.multiple(fileArr);
    setReturnImages((prev) => [...prev, ...data.urls]);
  };

  const handleSubmitReturn = async () => {
    if (!confirm('ยืนยันว่าคุณส่งคืนชุดแล้ว? พนักงานจะตรวจรับเข้าคลังต่อไป')) return;
    setActing(true);
    try {
      await bookingAPI.submitReturn(id, { returnImages, note: returnNote });
      await load();
    } catch {
      alert('แจ้งส่งคืนไม่สำเร็จ');
    } finally {
      setActing(false);
    }
  };

  if (loading) return <CustomerLayout><div className="loading">กำลังโหลด...</div></CustomerLayout>;
  if (!booking) return <CustomerLayout><div className="empty-state">ไม่พบการจอง</div></CustomerLayout>;

  const canCancel = ['pending', 'payment_pending'].includes(booking.status);
  const slipImage = payment?.slipImage;
  const inUse = ['delivered', 'picked_up'].includes(booking.status);
  const awaitingShipConfirm = ['out_for_delivery', 'ready_to_ship', 'ready_for_pickup'].includes(booking.status);

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
            {(booking.deliveryAddressText || booking.user?.addressText) && (
              <p style={{ marginTop: '0.5rem' }}>
                ที่อยู่จัดส่ง: {booking.deliveryAddressText || booking.user?.addressText}
              </p>
            )}
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

        {booking.messenger && (booking.messenger.name || booking.messenger.eta) && (
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Truck size={18} color="var(--primary)" />
              ข้อมูลแมสเซนเจอร์ (ส่งภายในวันนี้)
            </h3>
            <p>แมสฯ: {booking.messenger.name || '-'}</p>
            {booking.messenger.phone && <p>โทร: {booking.messenger.phone}</p>}
            {booking.messenger.eta && <p>ช่วงเวลา: {booking.messenger.eta}</p>}
            {booking.messenger.note && <p>หมายเหตุ: {booking.messenger.note}</p>}
          </div>
        )}

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
          </div>
        )}

        {canCancel && (
          <button type="button" className="btn btn-danger btn-sm" onClick={handleCancel}>
            ยกเลิกการจอง
          </button>
        )}

        {booking.status === 'out_for_delivery' && (
          <div className="alert alert-info" style={{ marginTop: '1rem' }}>
            แมสเซนเจอร์กำลังนำส่งชุดให้คุณภายในวันนี้
            {booking.messenger?.name ? ` (${booking.messenger.name})` : ''}
          </div>
        )}

        {awaitingShipConfirm && booking.status !== 'out_for_delivery' && (
          <div className="alert alert-info" style={{ marginTop: '1rem' }}>
            ชุดของคุณอยู่ในคิวจัดส่งแมสเซนเจอร์ภายในวันนี้
          </div>
        )}

        {booking.status === 'out_for_delivery' && (
          <button type="button" className="btn btn-success" style={{ marginTop: '0.75rem' }} disabled={acting} onClick={handleConfirmDelivered}>
            ยืนยันว่าได้รับชุดแล้ว
          </button>
        )}

        {booking.status === 'return_submitted' && (
          <div className="alert alert-success" style={{ marginTop: '1rem' }}>
            แจ้งส่งคืนแล้ว — รอพนักงานตรวจรับเข้าคลังและคืนมัดจำ
          </div>
        )}

        {inUse && (
          <div className="card" style={{ padding: '1.5rem', marginTop: '1rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>ส่งคืนชุดด้วยตนเอง</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              เมื่อส่งคืนแล้ว กดแจ้งสถานะด้านล่าง พนักงานจะอัปเดตเมื่อตรวจรับเข้าคลัง
            </p>
            <UploadBox
              label="อัปโหลดรูปหลักฐานการส่งคืน / สภาพชุด (ถ้ามี)"
              preview={returnImages}
              onUpload={handleReturnUpload}
              multiple
              onRemove={(i) => setReturnImages((prev) => prev.filter((_, idx) => idx !== i))}
            />
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>หมายเหตุ (เช่น เลขพัสดุ / เวลาที่ส่ง)</label>
              <input
                className="form-input"
                value={returnNote}
                onChange={(e) => setReturnNote(e.target.value)}
                placeholder="รายละเอียดการส่งคืน"
              />
            </div>
            <button type="button" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={acting} onClick={handleSubmitReturn}>
              {acting ? 'กำลังบันทึก...' : 'แจ้งว่าส่งคืนแล้ว'}
            </button>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
