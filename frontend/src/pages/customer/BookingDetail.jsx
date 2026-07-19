import { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, Ruler, GraduationCap, Image as ImageIcon, Truck, MapPin, Phone, Clock, Pencil } from 'lucide-react';
import { bookingAPI, paymentAPI, uploadAPI } from '../../services/api';
import CustomerLayout from '../../components/CustomerLayout';
import StatusTimeline from '../../components/StatusTimeline';
import StatusBadge from '../../components/StatusBadge';
import UploadBox from '../../components/UploadBox';
import DeliveryAddressFields, {
  emptyDeliveryAddress,
  validateDeliveryAddress,
  normalizeDeliveryAddress,
} from '../../components/DeliveryAddressFields';
import { STORE_INFO } from '../../constants/store';

const DEGREE_LABELS = {
  bachelor: 'ปริญญาตรี',
  master: 'ปริญญาโท',
  doctoral: 'ปริญญาเอก',
};

const EDITABLE_ADDRESS_STATUSES = ['payment_pending', 'pending', 'payment_verified', 'approved', 'preparing'];

export default function BookingDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [returnImages, setReturnImages] = useState([]);
  const [returnNote, setReturnNote] = useState('');
  const [returnError, setReturnError] = useState('');
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [editingAddress, setEditingAddress] = useState(() => Boolean(location.state?.editAddress));
  const [returnToPayment, setReturnToPayment] = useState(() => Boolean(location.state?.editAddress));
  const [addressDraft, setAddressDraft] = useState(emptyDeliveryAddress());
  const [addressError, setAddressError] = useState('');

  useEffect(() => {
    if (location.state?.editAddress) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, []);

  useEffect(() => {
    if (editingAddress) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [editingAddress]);

  const load = async () => {
    const [b, p] = await Promise.all([
      bookingAPI.get(id),
      paymentAPI.getByBooking(id).catch(() => ({ data: null })),
    ]);
    setBooking(b.data);
    setPayment(p.data);
    setReturnImages(b.data?.returnImages || []);
    if (b.data?.deliveryAddress) {
      setAddressDraft({
        recipientName: b.data.deliveryAddress.recipientName || '',
        recipientPhone: b.data.deliveryAddress.recipientPhone || '',
        line1: b.data.deliveryAddress.line1 || '',
        amphoe: b.data.deliveryAddress.amphoe || '',
        district: b.data.deliveryAddress.district || '',
        province: b.data.deliveryAddress.province || '',
        postalCode: b.data.deliveryAddress.postalCode || '',
      });
    }
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [id]);

  // ยังไม่ส่งสลิป → บังคับไปหน้าชำระเงินก่อน ไม่ให้ดูสถานะ
  useEffect(() => {
    if (!loading && booking?.status === 'payment_pending') {
      navigate(`/payment/${id}`, { replace: true });
    }
  }, [loading, booking?.status, id, navigate]);

  const handleCancel = async () => {
    if (!confirm('ยืนยันยกเลิกการจอง?')) return;
    await bookingAPI.cancel(id);
    await load();
  };

  const handleConfirmDelivered = async () => {
    setActing(true);
    try {
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
    if (!confirm('ยืนยันว่าคุณส่งคืนชุดแล้ว? พนักงานจะตรวจรับเข้าคลังและคืนมัดจำตามบัญชีที่บันทึกตอนส่งสลิป')) return;
    setReturnError('');
    setActing(true);
    try {
      await bookingAPI.submitReturn(id, { returnImages, note: returnNote });
      await load();
    } catch (e) {
      setReturnError(e.response?.data?.error || 'แจ้งส่งคืนไม่สำเร็จ');
    } finally {
      setActing(false);
    }
  };

  const handleSaveAddress = async () => {
    const err = validateDeliveryAddress(addressDraft);
    if (err) {
      setAddressError(err);
      return;
    }
    setActing(true);
    setAddressError('');
    try {
      const { data } = await bookingAPI.updateDeliveryAddress(id, {
        deliveryAddress: normalizeDeliveryAddress(addressDraft),
      });
      setBooking(data);
      setEditingAddress(false);
      setReturnToPayment(false);
    } catch (e) {
      setAddressError(e.response?.data?.error || 'บันทึกที่อยู่ไม่สำเร็จ');
    } finally {
      setActing(false);
    }
  };

  if (loading) return <CustomerLayout><div className="loading">กำลังโหลด...</div></CustomerLayout>;
  if (!booking) return <CustomerLayout><div className="empty-state">ไม่พบการจอง</div></CustomerLayout>;
  // ยังไม่ส่งสลิป — ไม่แสดงสถานะ บังคับไปชำระเงิน
  if (booking.status === 'payment_pending') {
    return <CustomerLayout><div className="loading">กำลังไปหน้าชำระเงิน...</div></CustomerLayout>;
  }

  const canCancel = ['pending', 'payment_pending'].includes(booking.status);
  const canEditAddress = EDITABLE_ADDRESS_STATUSES.includes(booking.status);
  const slipImage = payment?.slipImage;
  const inUse = ['delivered', 'picked_up'].includes(booking.status);
  const awaitingShipConfirm = ['out_for_delivery', 'ready_to_ship', 'ready_for_pickup'].includes(booking.status);
  const addressText = booking.deliveryAddressText;
  const returnDeadline = new Date(booking.endDate).toLocaleDateString('th-TH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

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
          {booking.refundSlipImage && (
            <div style={{ marginTop: '1rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                สลิปโอนคืนมัดจำ
              </p>
              <a href={booking.refundSlipImage} target="_blank" rel="noreferrer" className="booking-slip-preview">
                <img src={booking.refundSlipImage} alt="สลิปโอนคืนมัดจำ" />
              </a>
            </div>
          )}
        </div>

        {(addressText || canEditAddress) && (
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={18} color="var(--primary)" />
                ที่อยู่จัดส่ง
              </h3>
              {canEditAddress && !editingAddress && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setEditingAddress(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Pencil size={14} />
                  แก้ไข
                </button>
              )}
            </div>

            {editingAddress ? (
              <>
                {addressError && <div className="alert alert-error" style={{ marginBottom: '0.75rem' }}>{addressError}</div>}
                <DeliveryAddressFields value={addressDraft} onChange={setAddressDraft} compact />
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button type="button" className="btn btn-primary btn-sm" disabled={acting} onClick={handleSaveAddress}>
                    {acting ? 'กำลังบันทึก...' : 'บันทึกที่อยู่'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={acting}
                    onClick={() => {
                      setEditingAddress(false);
                      setAddressError('');
                      if (booking.deliveryAddress) {
                        setAddressDraft({
                          recipientName: booking.deliveryAddress.recipientName || '',
                          recipientPhone: booking.deliveryAddress.recipientPhone || '',
                          line1: booking.deliveryAddress.line1 || '',
                          amphoe: booking.deliveryAddress.amphoe || '',
                          district: booking.deliveryAddress.district || '',
                          province: booking.deliveryAddress.province || '',
                          postalCode: booking.deliveryAddress.postalCode || '',
                        });
                      }
                    }}
                  >
                    ยกเลิก
                  </button>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem', marginBottom: 0 }}>
                  แก้ได้ก่อนชุดออกแมสเซนเจอร์เท่านั้น
                </p>
              </>
            ) : (
              <p style={{ fontSize: '0.95rem', margin: 0, lineHeight: 1.6 }}>
                {addressText || 'ยังไม่ระบุที่อยู่จัดส่ง'}
              </p>
            )}
          </div>
        )}

        {booking.messenger && (booking.messenger.name || booking.messenger.eta) && (
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Truck size={18} color="var(--primary)" />
              ข้อมูลแมสเซนเจอร์
            </h3>
            <p>แมสฯ: {booking.messenger.name || '-'}</p>
            {booking.messenger.phone && (
              <p>
                โทร:{' '}
                <a href={`tel:${booking.messenger.phone.replace(/\D/g, '')}`}>{booking.messenger.phone}</a>
              </p>
            )}
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
            {booking.refundAccount && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', fontSize: '0.9rem' }}>
                <strong>บัญชีรับเงินคืนมัดจำ</strong>
                <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)' }}>
                  {booking.refundAccount.method === 'bank'
                    ? `${booking.refundAccount.bankName} · ${booking.refundAccount.accountNumber} · ${booking.refundAccount.accountName}`
                    : `พร้อมเพย์ ${booking.refundAccount.promptpay} · ${booking.refundAccount.accountName}`}
                </p>
              </div>
            )}
          </div>
        )}

        {canCancel && (
          <button type="button" className="btn btn-danger btn-sm" onClick={handleCancel}>
            ยกเลิกการจอง
          </button>
        )}

        {booking.status === 'out_for_delivery' && (
          <div className="alert alert-info" style={{ marginTop: '1rem' }}>
            แมสเซนเจอร์กำลังนำส่งชุดให้คุณ
            {booking.messenger?.name ? ` (${booking.messenger.name})` : ''}
          </div>
        )}

        {awaitingShipConfirm && booking.status !== 'out_for_delivery' && (
          <div className="alert alert-info" style={{ marginTop: '1rem' }}>
            ชุดของคุณอยู่ในคิวจัดส่งแมสเซนเจอร์
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
            {booking.refundAccount && (
              <div style={{ fontSize: '0.85rem', marginTop: '0.35rem', opacity: 0.9 }}>
                คืนเข้า: {booking.refundAccount.method === 'bank'
                  ? `${booking.refundAccount.bankName} ${booking.refundAccount.accountNumber} (${booking.refundAccount.accountName})`
                  : `พร้อมเพย์ ${booking.refundAccount.promptpay} (${booking.refundAccount.accountName})`}
              </div>
            )}
          </div>
        )}

        {(inUse || ['return_submitted', 'delivered', 'picked_up'].includes(booking.status)) && (
          <div className="card" style={{ padding: '1.5rem', marginTop: '1rem', marginBottom: inUse ? 0 : '1rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={18} color="var(--primary)" />
              วิธีส่งคืนชุด
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              กำหนดคืนชุด: <strong>{returnDeadline}</strong>
            </p>
            <div style={{ fontSize: '0.95rem', lineHeight: 1.7 }}>
              <p style={{ display: 'flex', gap: 8, margin: '0.35rem 0' }}>
                <MapPin size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: 3 }} />
                <span>{STORE_INFO.returnAddress}</span>
              </p>
              <p style={{ display: 'flex', gap: 8, margin: '0.35rem 0' }}>
                <Clock size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: 3 }} />
                <span>{STORE_INFO.returnHours}</span>
              </p>
              <p style={{ display: 'flex', gap: 8, margin: '0.35rem 0' }}>
                <Phone size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: 3 }} />
                <span>
                  โทร{' '}
                  <a href={`tel:${STORE_INFO.returnPhone.replace(/\D/g, '')}`}>{STORE_INFO.returnPhone}</a>
                </span>
              </p>
            </div>
            <ul style={{ margin: '0.75rem 0 0', paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {STORE_INFO.returnNotes.map((note) => (
                <li key={note} style={{ marginBottom: '0.35rem' }}>{note}</li>
              ))}
            </ul>
          </div>
        )}

        {inUse && (
          <div className="card" style={{ padding: '1.5rem', marginTop: '1rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>แจ้งว่าส่งคืนแล้ว</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              หลังส่งชุดกลับมาที่ร้านตามที่อยู่ด้านบนแล้ว กดแจ้งสถานะด้านล่าง พนักงานจะตรวจรับเข้าคลังและดำเนินการคืนมัดจำ
            </p>
            <UploadBox
              label="อัปโหลดรูปหลักฐานการส่งคืน / สภาพชุด (ถ้ามี)"
              preview={returnImages}
              onUpload={handleReturnUpload}
              multiple
              onRemove={(i) => setReturnImages((prev) => prev.filter((_, idx) => idx !== i))}
            />
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>หมายเหตุ (เช่น เวลาที่ส่งคืน)</label>
              <input
                className="form-input"
                value={returnNote}
                onChange={(e) => setReturnNote(e.target.value)}
                placeholder="รายละเอียดการส่งคืน"
              />
            </div>

            {returnError && <div className="alert alert-error" style={{ marginTop: '0.5rem' }}>{returnError}</div>}
            <button type="button" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={acting} onClick={handleSubmitReturn}>
              {acting ? 'กำลังบันทึก...' : 'แจ้งว่าส่งคืนแล้ว'}
            </button>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
