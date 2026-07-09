import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingAPI, paymentAPI, uploadAPI } from '../../services/api';
import CustomerLayout from '../../components/CustomerLayout';
import UploadBox from '../../components/UploadBox';
import StatusBadge from '../../components/StatusBadge';

export default function Payment() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      bookingAPI.get(bookingId),
      paymentAPI.getByBooking(bookingId).catch(() => ({ data: null })),
    ]).then(([b, p]) => {
      setBooking(b.data);
      setPayment(p.data);
      if (p.data?.slipImage) setSlipPreview(p.data.slipImage);
    }).finally(() => setLoading(false));
  }, [bookingId]);

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
    } catch (err) {
      alert(err.response?.data?.error || 'อัปโหลดไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <CustomerLayout><div className="loading">กำลังโหลด...</div></CustomerLayout>;
  if (!booking) return <CustomerLayout><div className="empty-state">ไม่พบการจอง</div></CustomerLayout>;

  return (
    <CustomerLayout>
      <div className="container" style={{ maxWidth: 600, padding: '2rem 20px' }}>
        <h1 className="page-title">ชำระเงิน</h1>
        <p className="page-subtitle">โอนเงินและอัปโหลดสลิปเพื่อยืนยันการชำระ</p>

        <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <p style={{ fontWeight: 700, marginBottom: '8px' }}>สแกน QR Code PromptPay</p>
            <div style={{
              width: 200, height: 200, margin: '0 auto', background: '#f0f0f0',
              borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '5rem',
            }}>
              📱
            </div>
            <p style={{ marginTop: '12px', fontSize: '1.5rem', fontWeight: 800, color: '#FF6B6B' }}>
              ฿{booking.totalPrice?.toLocaleString()}
            </p>
            <p style={{ color: '#636E72', fontSize: '0.85rem' }}>พร้อมเพย์: 081-234-5678 (KruyMo)</p>
          </div>

          <div style={{ background: '#f8f9fa', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' }}>
            <p>ค่าเช่า: ฿{booking.rentalPrice?.toLocaleString()}</p>
            <p>มัดจำ: ฿{booking.deposit?.toLocaleString()}</p>
          </div>

          {payment?.status && (
            <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
              สถานะ: <StatusBadge status={payment.status === 'pending' ? 'payment_pending' : payment.status === 'verified' ? 'approved' : 'rejected'} />
            </div>
          )}

          {(!payment || payment.status === 'pending') && (
            <>
              <UploadBox
                label="อัปโหลดสลิปการโอนเงิน (drag & drop)"
                preview={slipPreview}
                onUpload={handleUpload}
                onRemove={() => setSlipPreview(null)}
              />
              <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}
                disabled={!slipPreview || submitting} onClick={handleSubmit}>
                {submitting ? 'กำลังส่ง...' : 'ส่งสลิปเพื่อตรวจสอบ'}
              </button>
            </>
          )}

          {payment?.status === 'verified' && (
            <div className="alert alert-success">การชำระเงินได้รับการยืนยันแล้ว</div>
          )}
        </div>

        <button className="btn btn-ghost" onClick={() => navigate(`/bookings/${bookingId}`)}>
          ดูสถานะการจอง →
        </button>
      </div>
    </CustomerLayout>
  );
}
