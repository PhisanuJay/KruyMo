import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useBlocker } from 'react-router-dom';
import {
  Smartphone,
  Copy,
  Check,
  ArrowRight,
  CalendarDays,
  Ruler,
  Shirt,
  ShieldCheck,
  AlertTriangle,
  MapPin,
} from 'lucide-react';
import { bookingAPI, paymentAPI, uploadAPI } from '../../services/api';
import CustomerLayout from '../../components/CustomerLayout';
import UploadBox from '../../components/UploadBox';
import StatusBadge from '../../components/StatusBadge';

const PROMPTPAY = {
  phone: '097-070-9141',
  phoneRaw: '0970709141',
  name: 'KruyMo',
};

const DEGREE_LABELS = {
  bachelor: 'ปริญญาตรี',
  master: 'ปริญญาโท',
  doctoral: 'ปริญญาเอก',
};

export default function Payment() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const skipBlockRef = useRef(false);
  const bookingStatusRef = useRef(null);

  useEffect(() => {
    Promise.all([
      bookingAPI.get(bookingId),
      paymentAPI.getByBooking(bookingId).catch(() => ({ data: null })),
    ]).then(([b, p]) => {
      setBooking(b.data);
      setPayment(p.data);
      bookingStatusRef.current = b.data?.status;
      if (p.data?.slipImage) setSlipPreview(p.data.slipImage);
      if (
        b.data?.status === 'pending'
        || b.data?.status === 'payment_verified'
        || b.data?.status === 'approved'
        || p.data?.status === 'verified'
      ) {
        skipBlockRef.current = true;
      }
    }).finally(() => setLoading(false));
  }, [bookingId]);

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (skipBlockRef.current) return false;
    if (bookingStatusRef.current !== 'payment_pending') return false;
    return currentLocation.pathname !== nextLocation.pathname;
  });

  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (skipBlockRef.current || bookingStatusRef.current !== 'payment_pending') return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  const handleUpload = async (file) => {
    const { data } = await uploadAPI.single(file);
    setSlipPreview(data.url);
    return data.url;
  };

  const handleSubmit = async () => {
    if (!slipPreview) return;
    setSubmitting(true);
    try {
      const { data } = await paymentAPI.uploadSlip(bookingId, slipPreview);
      setPayment(data);
      skipBlockRef.current = true;
      bookingStatusRef.current = 'pending';
      window.dispatchEvent(new Event('kruymo:notifications-refresh'));
      navigate(`/bookings/${bookingId}`, { replace: true });
    } catch (err) {
      alert(err.response?.data?.error || 'อัปโหลดไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = useCallback(async () => {
    setCancelling(true);
    try {
      await bookingAPI.cancel(bookingId);
      skipBlockRef.current = true;
      bookingStatusRef.current = 'cancelled';
      window.dispatchEvent(new Event('kruymo:notifications-refresh'));
      if (blocker.state === 'blocked') {
        blocker.proceed();
      } else {
        navigate('/bookings', { replace: true });
      }
    } catch (err) {
      alert(err.response?.data?.error || 'ยกเลิกไม่สำเร็จ');
      if (blocker.state === 'blocked') blocker.reset();
    } finally {
      setCancelling(false);
    }
  }, [bookingId, blocker, navigate]);

  const handleStay = () => {
    if (blocker.state === 'blocked') blocker.reset();
  };

  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(PROMPTPAY.phoneRaw);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const goBookingStatus = () => {
    navigate(`/bookings/${bookingId}`);
  };

  if (loading) return <CustomerLayout><div className="loading">กำลังโหลด...</div></CustomerLayout>;
  if (!booking) return <CustomerLayout><div className="empty-state">ไม่พบการจอง</div></CustomerLayout>;

  const costume = booking.costume;
  const image = costume?.images?.[0];
  const canUpload = booking.status === 'payment_pending'
    || payment?.status === 'rejected'
    || (payment?.status === 'pending' && booking.status === 'payment_pending');
  const paymentBadgeStatus = payment?.status === 'pending'
    ? 'pending'
    : payment?.status === 'verified'
      ? 'approved'
      : payment?.status === 'rejected'
        ? 'rejected'
        : 'payment_pending';
  const showLeaveModal = blocker.state === 'blocked';

  return (
    <CustomerLayout>
      <div className="container payment-page" style={{ padding: '2rem 20px' }}>
        <h1 className="page-title">ชำระเงิน</h1>
        <p className="page-subtitle">โอนเงิน PromptPay แล้วอัปโหลดสลิปเพื่อยืนยัน — หากออกจากหน้านี้โดยยังไม่ส่งสลิป จะต้องยืนยันการยกเลิกคำสั่งซื้อ</p>

        <div className="payment-layout">
          <aside className="payment-side">
            <div className="payment-costume-card">
              <div className="payment-costume-media">
                {image ? (
                  <img src={image} alt={costume?.name || 'ชุดครุย'} />
                ) : (
                  <div className="payment-costume-placeholder">
                    <Shirt size={48} strokeWidth={1.25} />
                  </div>
                )}
              </div>
              <div className="payment-costume-body">
                <h2>{costume?.name || 'ชุดครุย'}</h2>
                <ul className="payment-meta-list">
                  <li>
                    <Shirt size={16} />
                    <span>{DEGREE_LABELS[booking.degreeLevel] || booking.degreeLevel}</span>
                  </li>
                  <li>
                    <Ruler size={16} />
                    <span>ไซส์ {booking.size?.label || booking.sizeId}</span>
                  </li>
                  <li>
                    <CalendarDays size={16} />
                    <span>
                      {new Date(booking.startDate).toLocaleDateString('th-TH')}
                      {' – '}
                      {new Date(booking.endDate).toLocaleDateString('th-TH')}
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="payment-amount-card">
              <span className="payment-amount-label">ยอดที่ต้องชำระ</span>
              <strong className="payment-amount-value">
                ฿{booking.totalPrice?.toLocaleString()}
              </strong>
              <div className="payment-amount-breakdown">
                <div>
                  <span>ค่าเช่า</span>
                  <strong>฿{booking.rentalPrice?.toLocaleString()}</strong>
                </div>
                <div>
                  <span>มัดจำ</span>
                  <strong>฿{booking.deposit?.toLocaleString()}</strong>
                </div>
              </div>
            </div>

            {booking.deliveryAddressText && (
              <div className="payment-amount-card" style={{ marginTop: '1rem' }}>
                <span className="payment-amount-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={14} />
                  ที่อยู่จัดส่ง
                </span>
                <p style={{ fontSize: '0.9rem', margin: '0.5rem 0 0', lineHeight: 1.6 }}>
                  {booking.deliveryAddressText}
                </p>
              </div>
            )}
          </aside>

          <section className="payment-main card">
            <div className="payment-main-head">
              <div>
                <h3>ชำระผ่าน PromptPay</h3>
                <p>สแกน QR หรือโอนเข้าเบอร์ด้านล่าง แล้วอัปโหลดสลิป</p>
              </div>
              <StatusBadge status={paymentBadgeStatus} />
            </div>

            {payment?.status === 'rejected' && (
              <div className="alert alert-error">
                สลิปไม่ผ่านการตรวจสอบ กรุณาอัปโหลดใหม่อีกครั้ง
              </div>
            )}

            <div className="payment-qr-panel">
              <div className="payment-qr-frame">
                <img
                  src="/images/promptpay-qr.png"
                  alt="QR Code PromptPay KruyMo"
                  className="payment-qr-image"
                />
              </div>

              <div className="payment-transfer-info">
                <div className="payment-info-row">
                  <Smartphone size={18} />
                  <div className="payment-info-text">
                    <span className="payment-info-label">พร้อมเพย์</span>
                    <div className="payment-phone-line">
                      <strong className="payment-phone">{PROMPTPAY.phone}</strong>
                      <button type="button" className="payment-copy-btn" onClick={copyPhone}>
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="payment-info-row">
                  <ShieldCheck size={18} />
                  <div className="payment-info-text">
                    <span className="payment-info-label">ชื่อบัญชี</span>
                    <strong>{PROMPTPAY.name}</strong>
                  </div>
                </div>
                <p className="payment-tip">
                  โอนให้ตรงยอด <strong>฿{booking.totalPrice?.toLocaleString()}</strong> แล้วอัปโหลดสลิปด้านล่าง
                </p>
              </div>
            </div>

            {canUpload && (
              <div className="payment-upload-block">
                <h4>อัปโหลดสลิปการโอน</h4>
                <UploadBox
                  label="ลากสลิปมาวาง หรือคลิกเพื่อเลือกไฟล์"
                  preview={slipPreview}
                  onUpload={handleUpload}
                  onRemove={() => setSlipPreview(null)}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '1rem' }}
                  disabled={!slipPreview || submitting}
                  onClick={handleSubmit}
                >
                  {submitting
                    ? 'กำลังส่ง...'
                    : payment?.slipImage
                      ? 'ส่งสลิปอีกครั้ง'
                      : 'ส่งสลิปเพื่อตรวจสอบ'}
                </button>
              </div>
            )}

            <button
              type="button"
              className="payment-status-link"
              onClick={goBookingStatus}
            >
              ดูสถานะการจอง
              <ArrowRight size={16} />
            </button>
          </section>
        </div>
      </div>

      {showLeaveModal && (
        <div className="modal-overlay" onClick={handleStay}>
          <div className="modal payment-leave-modal" onClick={(e) => e.stopPropagation()}>
            <div className="payment-leave-icon">
              <AlertTriangle size={28} />
            </div>
            <h3>ต้องการยกเลิกคำสั่งซื้อหรือไม่?</h3>
            <p>
              คุณยังไม่ได้ส่งสลิปชำระเงิน หากออกจากหน้านี้ คำสั่งจองชุดครุยจะถูกยกเลิก
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={handleStay} disabled={cancelling}>
                ไม่ อยู่หน้าชำระเงินต่อ
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleCancelOrder}
                disabled={cancelling}
              >
                {cancelling ? 'กำลังยกเลิก...' : 'ยกเลิกคำสั่งซื้อ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </CustomerLayout>
  );
}
