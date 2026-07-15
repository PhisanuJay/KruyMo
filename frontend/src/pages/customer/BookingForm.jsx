import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Ruler,
  CalendarDays,
  CalendarCheck,
  Timer,
  ArrowLeft,
  ArrowRight,
  Smartphone,
  Copy,
  Check,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { bookingAPI, paymentAPI, uploadAPI } from '../../services/api';
import CustomerLayout from '../../components/CustomerLayout';
import UploadBox from '../../components/UploadBox';
import DeliveryAddressFields, {
  emptyDeliveryAddress,
  validateDeliveryAddress,
  normalizeDeliveryAddress,
} from '../../components/DeliveryAddressFields';

const DEGREE_LABELS = {
  bachelor: 'ปริญญาตรี',
  master: 'ปริญญาโท',
  doctoral: 'ปริญญาเอก',
};

const PROMPTPAY = {
  phone: '097-070-9141',
  phoneRaw: '0970709141',
  name: 'KruyMo',
};

const formatThaiDate = (iso) => new Date(iso).toLocaleDateString('th-TH', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export default function BookingForm() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [step, setStep] = useState('confirm');
  const [bookingId, setBookingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState(emptyDeliveryAddress());

  const [slipPreview, setSlipPreview] = useState(null);
  const [payment, setPayment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const costume = state?.costume;
  const startDate = state?.startDate;
  const endDate = state?.endDate;
  const sizeId = state?.sizeId;
  const degreeLevel = state?.degreeLevel;
  const size = state?.size;

  if (!costume || !startDate || !endDate || !sizeId || !degreeLevel) {
    return (
      <CustomerLayout>
        <div className="empty-state">กรุณาเลือกวันเช่า ไซส์ และระดับปริญญาจากหน้ารายละเอียดชุดครุย</div>
      </CustomerLayout>
    );
  }

  const days = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000) + 1);
  const rentalPrice = days * costume.pricePerDay;
  const total = rentalPrice + costume.deposit;
  const image = costume.images?.[0];
  const facultyColor = costume.faculty?.color || '#E63946';

  const details = [
    {
      icon: GraduationCap,
      label: 'ระดับปริญญา',
      value: DEGREE_LABELS[degreeLevel] || degreeLevel,
    },
    {
      icon: Ruler,
      label: 'ไซส์',
      value: size?.label || sizeId,
      hint: size?.description
        || (size?.heightMin && size?.heightMax ? `ส่วนสูง ${size.heightMin}-${size.heightMax} ซม.` : ''),
    },
    {
      icon: CalendarDays,
      label: 'วันเริ่มเช่า',
      value: formatThaiDate(startDate),
    },
    {
      icon: CalendarCheck,
      label: 'วันคืนชุด',
      value: formatThaiDate(endDate),
    },
    {
      icon: Timer,
      label: 'ระยะเวลาเช่า',
      value: `${days} วัน`,
    },
  ];

  const submitted = payment?.status === 'pending' || payment?.status === 'verified';

  const handleConfirm = async () => {
    const addrError = validateDeliveryAddress(deliveryAddress);
    if (addrError) {
      setError(addrError);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data } = await bookingAPI.create({
        costumeId: id,
        startDate,
        endDate,
        sizeId,
        degreeLevel,
        deliveryAddress: normalizeDeliveryAddress(deliveryAddress),
      });
      window.dispatchEvent(new Event('kruymo:notifications-refresh'));
      setBookingId(data.id);
      setStep('pay');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.error || 'จองไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file) => {
    const { data } = await uploadAPI.single(file);
    setSlipPreview(data.url);
    return data.url;
  };

  const handleSubmitSlip = async () => {
    if (!slipPreview || !bookingId) return;
    setSubmitting(true);
    setError('');
    try {
      const { data } = await paymentAPI.uploadSlip(bookingId, slipPreview);
      setPayment(data);
      window.dispatchEvent(new Event('kruymo:notifications-refresh'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.error || 'อัปโหลดสลิปไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
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

  const priceBox = (
    <div className="booking-price-box">
      <div className="booking-price-row">
        <span>ค่าเช่า ({days} วัน × ฿{costume.pricePerDay.toLocaleString()})</span>
        <strong>฿{rentalPrice.toLocaleString()}</strong>
      </div>
      <div className="booking-price-row">
        <span>เงินมัดจำ</span>
        <strong>฿{costume.deposit.toLocaleString()}</strong>
      </div>
      <div className="booking-price-total">
        <span>รวมทั้งสิ้น</span>
        <strong>฿{total.toLocaleString()}</strong>
      </div>
    </div>
  );

  if (step === 'pay') {
    return (
      <CustomerLayout>
        <div className="container" style={{ padding: '2rem 20px', maxWidth: 760 }}>
          <h1 className="page-title">ชำระเงิน</h1>
          <p className="page-subtitle">
            {submitted
              ? 'เราได้รับสลิปของคุณแล้ว กำลังรอพนักงานตรวจสอบ'
              : 'สแกน QR หรือโอนพร้อมเพย์ แล้วอัปโหลดสลิปเพื่อรอตรวจสอบ'}
          </p>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="card" style={{ padding: '1.25rem 1.35rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h3 style={{ fontWeight: 700, margin: 0, flex: 1 }}>{costume.name}</h3>
              <strong style={{ color: 'var(--primary)', fontSize: '1.15rem' }}>฿{total.toLocaleString()}</strong>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.35rem 0 0' }}>
              {DEGREE_LABELS[degreeLevel] || degreeLevel} · ไซส์ {size?.label || sizeId} · {formatThaiDate(startDate)} – {formatThaiDate(endDate)}
            </p>
          </div>

          {submitted ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', background: '#FFF8E1',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
              }}>
                <Clock size={30} color="#FDCB6E" />
              </div>
              <h3 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>รอดำเนินการ</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                เราได้รับสลิปการชำระเงินของคุณแล้ว พนักงานกำลังตรวจสอบ<br />
                จะแจ้งเตือนเมื่อการจองได้รับการอนุมัติ
              </p>
              {slipPreview && (
                <a href={slipPreview} target="_blank" rel="noreferrer" className="booking-slip-preview" style={{ display: 'inline-block', marginBottom: '1.25rem', maxWidth: 220 }}>
                  <img src={slipPreview} alt="สลิปการชำระเงิน" style={{ width: '100%', borderRadius: 12 }} />
                </a>
              )}
              <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-primary" onClick={() => navigate(`/bookings/${bookingId}`)}>
                  ดูสถานะการจอง
                  <ArrowRight size={16} />
                </button>
                <button type="button" className="btn btn-outline" onClick={() => navigate('/bookings')}>
                  การจองทั้งหมด
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
                <div className="payment-qr-panel">
                  <div className="payment-qr-frame">
                    <img src="/images/promptpay-qr.png" alt="QR Code PromptPay KruyMo" className="payment-qr-image" />
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
                      โอนให้ตรงยอด <strong>฿{total.toLocaleString()}</strong> แล้วอัปโหลดสลิปด้านล่าง
                    </p>
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: '1.5rem' }}>
                <h4 style={{ fontWeight: 700, marginBottom: '0.85rem' }}>อัปโหลดสลิปการโอน</h4>
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
                  onClick={handleSubmitSlip}
                >
                  {submitting ? 'กำลังส่ง...' : 'ส่งสลิปเพื่อรอตรวจสอบ'}
                </button>
                <button
                  type="button"
                  className="payment-status-link"
                  onClick={() => navigate(`/bookings/${bookingId}`)}
                >
                  ข้ามไปดูสถานะการจอง (ส่งสลิปภายหลังได้)
                  <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="container booking-confirm" style={{ padding: '2rem 20px' }}>
        <button type="button" className="booking-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          กลับไปแก้ไข
        </button>

        <h1 className="page-title">ยืนยันการจอง</h1>
        <p className="page-subtitle">กรอกที่อยู่จัดส่ง ตรวจสอบรายละเอียด แล้วดำเนินการชำระเงิน</p>
        {error && <div className="alert alert-error">{error}</div>}

        <DeliveryAddressFields value={deliveryAddress} onChange={setDeliveryAddress} />

        <div className="booking-confirm-card">
          <div className="booking-confirm-media" style={{ '--accent': facultyColor }}>
            {image ? (
              <img src={image} alt={costume.name} />
            ) : (
              <div className="booking-confirm-placeholder">
                <GraduationCap size={64} strokeWidth={1.25} />
              </div>
            )}
            <div className="booking-confirm-media-fade" />
          </div>

          <div className="booking-confirm-body">
            <div className="booking-confirm-tags">
              {costume.university?.shortName && (
                <span className="booking-tag">{costume.university.shortName}</span>
              )}
              {costume.faculty?.name && (
                <span className="booking-tag accent" style={{ background: facultyColor, color: ['#F5F5F5', '#F4C430', '#FFD700'].includes(facultyColor) ? '#111' : '#fff' }}>
                  {costume.faculty.name.replace('คณะ', '')}
                </span>
              )}
            </div>

            <h2 className="booking-confirm-title">{costume.name}</h2>

            <ul className="booking-detail-list">
              {details.map(({ icon: Icon, label, value, hint }) => (
                <li key={label} className="booking-detail-item">
                  <span className="booking-detail-icon" aria-hidden>
                    <Icon size={18} strokeWidth={2} />
                  </span>
                  <div className="booking-detail-text">
                    <span className="booking-detail-label">{label}</span>
                    <strong className="booking-detail-value">{value}</strong>
                    {hint ? <span className="booking-detail-hint">{hint}</span> : null}
                  </div>
                </li>
              ))}
            </ul>

            {priceBox}

            <div className="booking-confirm-actions">
              <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
                ยกเลิก
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading ? 'กำลังจอง...' : 'ยืนยันการจอง'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
