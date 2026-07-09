import { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { bookingAPI } from '../../services/api';
import CustomerLayout from '../../components/CustomerLayout';

const DEGREE_LABELS = {
  bachelor: 'ปริญญาตรี',
  master: 'ปริญญาโท',
  doctoral: 'ปริญญาเอก',
};

export default function BookingForm() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await bookingAPI.create({
        costumeId: id,
        startDate,
        endDate,
        sizeId,
        degreeLevel,
      });
      navigate(`/payment/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'จองไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomerLayout>
      <div className="container" style={{ maxWidth: 600, padding: '2rem 20px' }}>
        <h1 className="page-title">ยืนยันการจอง</h1>
        <p className="page-subtitle">ตรวจสอบรายละเอียดก่อนยืนยัน</p>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="card" style={{ padding: '2rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>{costume.name}</h3>
          <div style={{ display: 'grid', gap: '8px', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            <p>🎓 ระดับ: <strong>{DEGREE_LABELS[degreeLevel] || degreeLevel}</strong></p>
            <p>📏 ไซส์: <strong>{size?.label || sizeId}</strong>
              {size?.description ? ` (${size.description})` : ''}
            </p>
            <p>📅 วันรับชุด: <strong>{new Date(startDate).toLocaleDateString('th-TH')}</strong></p>
            <p>📅 วันคืนชุด: <strong>{new Date(endDate).toLocaleDateString('th-TH')}</strong></p>
            <p>⏱️ จำนวน: <strong>{days} วัน</strong></p>
          </div>

          <div style={{ background: '#f8f9fa', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>ค่าเช่า ({days} วัน × ฿{costume.pricePerDay})</span>
              <strong>฿{rentalPrice}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>เงินมัดจำ</span>
              <strong>฿{costume.deposit}</strong>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem' }}>
              <strong>รวมทั้งสิ้น</strong>
              <strong style={{ color: 'var(--primary)' }}>฿{total}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => navigate(-1)}>ยกเลิก</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleConfirm} disabled={loading}>
              {loading ? 'กำลังจอง...' : 'ยืนยันการจอง'}
            </button>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
