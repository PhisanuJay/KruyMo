import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Ruler,
  CalendarDays,
  CalendarCheck,
  Timer,
  ArrowLeft,
} from 'lucide-react';
import { bookingAPI, userAPI } from '../../services/api';
import CustomerLayout from '../../components/CustomerLayout';
import DeliveryAddressFields, {
  deliveryAddressFromUser,
  validateDeliveryAddress,
  normalizeDeliveryAddress,
} from '../../components/DeliveryAddressFields';
import { useAuth } from '../../context/AuthContext';

const DEGREE_LABELS = {
  bachelor: 'ปริญญาตรี',
  master: 'ปริญญาโท',
  doctoral: 'ปริญญาเอก',
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
  const { user, updateUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState(() => deliveryAddressFromUser(user));

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    setDeliveryAddress((prev) => {
      const hasTyped = Object.values(prev).some((v) => String(v || '').trim());
      if (hasTyped) return prev;
      return deliveryAddressFromUser(user);
    });
    userAPI.get(user.id)
      .then(({ data }) => {
        updateUser(data);
        setDeliveryAddress((prev) => {
          const fromDb = deliveryAddressFromUser(data);
          return {
            recipientName: prev.recipientName.trim() || fromDb.recipientName,
            recipientPhone: prev.recipientPhone.trim() || fromDb.recipientPhone,
            line1: prev.line1.trim() || fromDb.line1,
            amphoe: prev.amphoe.trim() || fromDb.amphoe,
            district: prev.district.trim() || fromDb.district,
            province: prev.province.trim() || fromDb.province,
            postalCode: prev.postalCode.trim() || fromDb.postalCode,
          };
        });
      })
      .catch(() => {});
  }, [user?.id]);

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
      // บังคับไปหน้าชำระเงินทันที — ต้องส่งสลิปก่อน จึงไปดูสถานะได้
      navigate(`/payment/${data.id}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'จองไม่สำเร็จ');
    } finally {
      setLoading(false);
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
                {loading ? 'กำลังจอง...' : 'ยืนยันการจองและชำระเงิน'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
