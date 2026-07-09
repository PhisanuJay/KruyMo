import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { bookingAPI, uploadAPI } from '../../services/api';
import CustomerLayout from '../../components/CustomerLayout';
import StatusTimeline from '../../components/StatusTimeline';
import StatusBadge from '../../components/StatusBadge';
import UploadBox from '../../components/UploadBox';

export default function BookingDetail() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [returnImages, setReturnImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    bookingAPI.get(id).then((r) => setBooking(r.data)).finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!confirm('ยืนยันยกเลิกการจอง?')) return;
    await bookingAPI.cancel(id);
    const { data } = await bookingAPI.get(id);
    setBooking(data);
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

  return (
    <CustomerLayout>
      <div className="container" style={{ maxWidth: 700, padding: '2rem 20px' }}>
        <Link to="/bookings" style={{ color: '#FF6B6B', fontSize: '0.9rem' }}>← กลับ</Link>
        <h1 className="page-title" style={{ marginTop: '1rem' }}>สถานะการจอง</h1>
        <div style={{ marginBottom: '1rem' }}><StatusBadge status={booking.status} /></div>

        <StatusTimeline status={booking.status} />

        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>{booking.costume?.name}</h3>
          <p>🎓 ระดับ: {booking.degreeLabel || booking.degreeLevel || '-'}</p>
          <p>📏 ไซส์: {booking.size?.label || '-'}{booking.size?.description ? ` (${booking.size.description})` : ''}</p>
          <p>📅 {new Date(booking.startDate).toLocaleDateString('th-TH')} - {new Date(booking.endDate).toLocaleDateString('th-TH')}</p>
          <p>💰 ค่าเช่า ฿{booking.rentalPrice?.toLocaleString()} + มัดจำ ฿{booking.deposit?.toLocaleString()}</p>
          {booking.refundAmount != null && (
            <p style={{ color: '#00B894', fontWeight: 600 }}>คืนมัดจำ ฿{booking.refundAmount?.toLocaleString()}</p>
          )}
          {booking.penaltyAmount > 0 && (
            <p style={{ color: '#E17055' }}>ค่าปรับ ฿{booking.penaltyAmount?.toLocaleString()}</p>
          )}
        </div>

        {booking.status === 'payment_pending' && (
          <button className="btn btn-primary" style={{ marginRight: '8px' }}
            onClick={() => navigate(`/payment/${id}`)}>ชำระเงิน</button>
        )}

        {['payment_pending', 'pending'].includes(booking.status) && (
          <button className="btn btn-danger btn-sm" onClick={handleCancel}>ยกเลิกการจอง</button>
        )}

        {booking.status === 'ready_for_pickup' && (
          <button className="btn btn-success" onClick={handlePickup}>ยืนยันรับชุด</button>
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
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={handleReturn}>
              ยืนยันคืนชุด
            </button>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
