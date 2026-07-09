import { useState } from 'react';
import { bookingAPI, uploadAPI } from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';
import UploadBox from '../../components/UploadBox';
import StatusBadge from '../../components/StatusBadge';

export default function PickupReturn() {
  const [searchId, setSearchId] = useState('');
  const [booking, setBooking] = useState(null);
  const [returnImages, setReturnImages] = useState([]);
  const [penalty, setPenalty] = useState(0);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    setError('');
    try {
      const { data } = await bookingAPI.get(searchId);
      setBooking(data);
      setReturnImages(data.returnImages || []);
      setPenalty(data.penaltyAmount || 0);
    } catch {
      setError('ไม่พบเลขที่จอง');
      setBooking(null);
    }
  };

  const handlePickup = async () => {
    const { data } = await bookingAPI.pickup(booking.id);
    setBooking(data);
  };

  const handleReturnUpload = async (files) => {
    const fileArr = Array.isArray(files) ? files : [files];
    const { data } = await uploadAPI.multiple(fileArr);
    setReturnImages((prev) => [...prev, ...data.urls]);
  };

  const handleReturn = async () => {
    const { data } = await bookingAPI.return(booking.id, { returnImages, penaltyAmount: Number(penalty) });
    setBooking(data);
  };

  return (
    <DashboardLayout role="staff">
      <h1 className="page-title">รับ-คืนชุด</h1>
      <p className="page-subtitle">ค้นหาเลขที่จองเพื่อยืนยันรับหรือบันทึกคืนชุด</p>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', maxWidth: 500 }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input className="form-input" placeholder="เลขที่จอง (Booking ID)"
            value={searchId} onChange={(e) => setSearchId(e.target.value)} />
          <button className="btn btn-primary" onClick={handleSearch}>ค้นหา</button>
        </div>
        {error && <div className="alert alert-error" style={{ marginTop: '12px' }}>{error}</div>}
      </div>

      {booking && (
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 700 }}>{booking.costume?.name}</h3>
            <StatusBadge status={booking.status} />
          </div>
          <p>ลูกค้า: {booking.user?.name} ({booking.user?.phone})</p>
          <p>วันที่: {new Date(booking.startDate).toLocaleDateString('th-TH')} - {new Date(booking.endDate).toLocaleDateString('th-TH')}</p>
          <p>มัดจำ: ฿{booking.deposit?.toLocaleString()}</p>

          {['ready_for_pickup', 'approved'].includes(booking.status) && (
            <button className="btn btn-success" style={{ marginTop: '1rem' }} onClick={handlePickup}>
              ยืนยันรับชุด
            </button>
          )}

          {booking.status === 'picked_up' && (
            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ fontWeight: 700, marginBottom: '1rem' }}>บันทึกคืนชุด</h4>
              <UploadBox
                label="อัปโหลดรูปสภาพชุด (ก่อน-หลัง)"
                preview={returnImages}
                onUpload={handleReturnUpload}
                multiple
                onRemove={(i) => setReturnImages((prev) => prev.filter((_, idx) => idx !== i))}
              />
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>ค่าปรับ (บาท)</label>
                <input className="form-input" type="number" value={penalty}
                  onChange={(e) => setPenalty(e.target.value)} min={0} />
              </div>
              <p style={{ color: '#636E72', fontSize: '0.9rem' }}>
                ยอดคืนมัดจำ: ฿{Math.max(0, booking.deposit - Number(penalty)).toLocaleString()}
              </p>
              <button className="btn btn-primary" onClick={handleReturn}>บันทึกคืนชุด</button>
            </div>
          )}

          {booking.status === 'returned' && (
            <div className="alert alert-success" style={{ marginTop: '1rem' }}>คืนชุดเรียบร้อยแล้ว</div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
