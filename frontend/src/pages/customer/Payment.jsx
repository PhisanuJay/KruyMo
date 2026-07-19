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
  Pencil,
} from 'lucide-react';
import { bookingAPI, paymentAPI, uploadAPI } from '../../services/api';
import CustomerLayout from '../../components/CustomerLayout';
import UploadBox from '../../components/UploadBox';
import StatusBadge from '../../components/StatusBadge';
import DeliveryAddressFields, {
  emptyDeliveryAddress,
  validateDeliveryAddress,
  normalizeDeliveryAddress,
} from '../../components/DeliveryAddressFields';
import RefundAccountFields, {
  refundAccountFromUser,
  validateRefundAccount,
  normalizeRefundAccount,
} from '../../components/RefundAccountFields';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';

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
  const { user, updateUser } = useAuth();
  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [refundAccount, setRefundAccount] = useState(() => refundAccountFromUser(null));
  const [refundError, setRefundError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressDraft, setAddressDraft] = useState(emptyDeliveryAddress());
  const [addressError, setAddressError] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);
  const navigate = useNavigate();
  const { refreshCartCount } = useShop();
  const skipBlockRef = useRef(false);
  const bookingStatusRef = useRef(null);

  const applyBooking = (data) => {
    setBooking(data);
    bookingStatusRef.current = data?.status;
    if (data?.deliveryAddress) {
      setAddressDraft({
        recipientName: data.deliveryAddress.recipientName || '',
        recipientPhone: data.deliveryAddress.recipientPhone || '',
        line1: data.deliveryAddress.line1 || '',
        amphoe: data.deliveryAddress.amphoe || '',
        district: data.deliveryAddress.district || '',
        province: data.deliveryAddress.province || '',
        postalCode: data.deliveryAddress.postalCode || '',
      });
    }
  };

  useEffect(() => {
    Promise.all([
      bookingAPI.get(bookingId),
      paymentAPI.getByBooking(bookingId).catch(() => ({ data: null })),
    ]).then(([b, p]) => {
      applyBooking(b.data);
      setPayment(p.data);
      if (p.data?.slipImage) setSlipPreview(p.data.slipImage);
      if (b.data?.refundAccount) {
        setRefundAccount(refundAccountFromUser({
          refundAccount: b.data.refundAccount,
          name: b.data.user?.name || user?.name,
          phone: b.data.user?.phone || user?.phone,
        }));
      } else if (b.data?.user?.refundAccount || user?.refundAccount) {
        setRefundAccount(refundAccountFromUser(b.data?.user?.refundAccount ? b.data.user : user));
      } else {
        setRefundAccount(refundAccountFromUser(b.data?.user || user));
      }
      // ส่งสลิปแล้ว → ไปหน้าสถานะเลย
      if (
        b.data?.status
        && b.data.status !== 'payment_pending'
        && b.data.status !== 'cancelled'
      ) {
        skipBlockRef.current = true;
        navigate(`/bookings/${bookingId}`, { replace: true });
      } else if (p.data?.status === 'verified' || p.data?.status === 'pending') {
        skipBlockRef.current = true;
        if (b.data?.status !== 'payment_pending') {
          navigate(`/bookings/${bookingId}`, { replace: true });
        }
      }
    }).finally(() => setLoading(false));
  }, [bookingId]);

  // บังคับอยู่หน้าชำระจนกว่าจะส่งสลิป — ออกแล้วต้องยกเลิกคำสั่ง
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
    const accountErr = validateRefundAccount(refundAccount);
    if (accountErr) {
      setRefundError(accountErr);
      return;
    }
    setRefundError('');
    setSubmitting(true);
    try {
      const normalized = normalizeRefundAccount(refundAccount);
      const { data } = await paymentAPI.uploadSlip(bookingId, slipPreview, normalized);
      setPayment(data);
      if (user) updateUser({ ...user, refundAccount: normalized });
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
      const { data } = await bookingAPI.cancel(bookingId);
      skipBlockRef.current = true;
      bookingStatusRef.current = 'cancelled';
      window.dispatchEvent(new Event('kruymo:notifications-refresh'));
      await refreshCartCount();
      const goCart = data?.restoredToCart;
      if (blocker.state === 'blocked') {
        blocker.proceed();
      }
      navigate(goCart ? '/cart' : '/bookings', { replace: true });
    } catch (err) {
      alert(err.response?.data?.error || 'ยกเลิกไม่สำเร็จ');
      if (blocker.state === 'blocked') blocker.reset();
    } finally {
      setCancelling(false);
    }
  }, [bookingId, blocker, navigate, refreshCartCount]);

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

  const handleSaveAddress = async () => {
    const err = validateDeliveryAddress(addressDraft);
    if (err) {
      setAddressError(err);
      return;
    }
    setSavingAddress(true);
    setAddressError('');
    try {
      const { data } = await bookingAPI.updateDeliveryAddress(bookingId, {
        deliveryAddress: normalizeDeliveryAddress(addressDraft),
      });
      applyBooking(data);
      setEditingAddress(false);
    } catch (e) {
      setAddressError(e.response?.data?.error || 'บันทึกที่อยู่ไม่สำเร็จ');
    } finally {
      setSavingAddress(false);
    }
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
  const showLeaveModal = blocker && blocker.state === 'blocked';
  const canEditAddress = booking.status === 'payment_pending';

  return (
    <CustomerLayout>
      <div className="container payment-page" style={{ padding: '2rem 20px' }}>
        <h1 className="page-title">ชำระเงิน</h1>
        <p className="page-subtitle">
          โอน PromptPay แล้วอัปโหลดสลิปให้เสร็จก่อน — หลังส่งสลิปแล้วจึงจะเห็นสถานะการจอง
        </p>

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

            <div className="payment-amount-card" style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: editingAddress ? '0.75rem' : 0 }}>
                <span className="payment-amount-label" style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                  <MapPin size={14} />
                  ที่อยู่จัดส่ง
                </span>
                {canEditAddress && !editingAddress && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setEditingAddress(true);
                      setAddressError('');
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0.2rem 0.5rem' }}
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
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button type="button" className="btn btn-primary btn-sm" disabled={savingAddress} onClick={handleSaveAddress}>
                      {savingAddress ? 'กำลังบันทึก...' : 'บันทึกที่อยู่'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      disabled={savingAddress}
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
                </>
              ) : (
                <p style={{ fontSize: '0.9rem', margin: '0.5rem 0 0', lineHeight: 1.6 }}>
                  {booking.deliveryAddressText || 'ยังไม่ระบุที่อยู่'}
                </p>
              )}
            </div>
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
                สลิปไม่ผ่านการตรวจสอบ
                {(payment?.rejectReason || booking?.slipRejectReason) && (
                  <> — เหตุผล: {payment?.rejectReason || booking?.slipRejectReason}</>
                )}
                {' '}กรุณาอัปโหลดใหม่อีกครั้ง
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

            {canUpload ? (
              <div className="payment-upload-block">
                <h4>อัปโหลดสลิปการโอน</h4>
                <UploadBox
                  label="ลากสลิปมาวาง หรือคลิกเพื่อเลือกไฟล์"
                  preview={slipPreview}
                  onUpload={handleUpload}
                  onRemove={() => setSlipPreview(null)}
                />

                <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
                  <RefundAccountFields
                    value={refundAccount}
                    onChange={(next) => {
                      setRefundAccount(next);
                      if (refundError) setRefundError('');
                    }}
                    title="บัญชีรับเงินคืนมัดจำ"
                    hint={`กรอกพร้อมเพย์หรือบัญชีธนาคารสำหรับรับเงินมัดจำคืน (฿${(booking.deposit || 0).toLocaleString()}) หลังส่งคืนชุด — ระบบจะบันทึกไว้กับคำสั่งจองนี้`}
                  />
                  {refundError && (
                    <div className="alert alert-error" style={{ marginTop: '0.75rem' }}>{refundError}</div>
                  )}
                </div>

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
                      : 'ส่งสลิปและบัญชีรับเงินคืน'}
                </button>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.85rem', marginBottom: 0, textAlign: 'center' }}>
                  ส่งสลิปเสร็จแล้วระบบจะพาไปหน้าสถานะการจอง — หากออกจากหน้านี้โดยยังไม่ส่งสลิป จะต้องยกเลิกคำสั่งซื้อ
                </p>
              </div>
            ) : (
              <button
                type="button"
                className="payment-status-link"
                onClick={() => {
                  skipBlockRef.current = true;
                  navigate(`/bookings/${bookingId}`);
                }}
              >
                ดูสถานะการจอง
                <ArrowRight size={16} />
              </button>
            )}
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
              ต้องส่งสลิปชำระเงินก่อนจึงจะดูสถานะการจองได้ หากยกเลิก คำสั่งจากตะกร้าจะถูกคืนกลับตะกร้าเหมือนเดิม
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
