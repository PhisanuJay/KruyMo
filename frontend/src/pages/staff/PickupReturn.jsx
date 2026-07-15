import { useState, useEffect, useCallback } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { bookingAPI, uploadAPI } from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';
import UploadBox from '../../components/UploadBox';
import StatusBadge from '../../components/StatusBadge';
import './staff.css';

export default function PickupReturn() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const layoutRole = location.pathname.startsWith('/admin') ? 'admin' : 'staff';
  const isStaff = layoutRole === 'staff';
  const [searchId, setSearchId] = useState('');
  const [booking, setBooking] = useState(null);
  const [returnImages, setReturnImages] = useState([]);
  const [penalty, setPenalty] = useState(0);
  const [error, setError] = useState('');

  const loadBooking = useCallback(async (id) => {
    if (!id) return;
    setError('');
    setSearchId(id);
    try {
      const { data } = await bookingAPI.get(id);
      setBooking(data);
      setReturnImages(data.returnImages || []);
      setPenalty(data.penaltyAmount || 0);
    } catch {
      setError('ไม่พบเลขที่จอง');
      setBooking(null);
    }
  }, []);

  useEffect(() => {
    const fromState = location.state?.bookingId;
    const fromQuery = searchParams.get('id');
    const incoming = fromState || fromQuery;
    if (incoming) loadBooking(incoming);
  }, [location.state, searchParams, loadBooking]);

  const handleSearch = async () => {
    await loadBooking(searchId.trim());
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

  const refundPreview = Math.max(0, (booking?.deposit || 0) - Number(penalty || 0));

  return (
    <DashboardLayout role={layoutRole}>
      <div className={isStaff ? 'staff-ops' : undefined}>
        <div className={isStaff ? 'staff-page-head' : undefined}>
          <div>
            <h1 className="page-title">รับ-คืนชุด</h1>
            <p className="page-subtitle">ค้นหาเลขที่จองเพื่อยืนยันรับชุด หรือบันทึกการคืนชุด</p>
          </div>
        </div>

        <div className={isStaff ? 'staff-search-bar' : 'card'} style={isStaff ? undefined : { padding: '1.5rem', marginBottom: '1.5rem', maxWidth: 500 }}>
          {isStaff ? (
            <>
              <input
                className="form-input"
                placeholder="เลขที่จอง (Booking ID)"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button type="button" className="btn btn-primary" onClick={handleSearch}>ค้นหา</button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                className="form-input"
                placeholder="เลขที่จอง (Booking ID)"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button type="button" className="btn btn-primary" onClick={handleSearch}>ค้นหา</button>
            </div>
          )}
          {!isStaff && error && (
            <div className="alert alert-error" style={{ marginTop: 12 }}>{error}</div>
          )}
        </div>
        {isStaff && error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem', maxWidth: 640 }}>{error}</div>
        )}

        {booking && isStaff && (
          <div className="staff-detail">
            <div className="staff-detail-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h3 style={{ margin: 0 }}>{booking.costume?.name}</h3>
                <StatusBadge status={booking.status} />
              </div>
              <dl className="staff-kv">
                <dt>ลูกค้า</dt>
                <dd>{booking.user?.name}</dd>
                <dt>โทรศัพท์</dt>
                <dd>{booking.user?.phone || '-'}</dd>
                <dt>ช่วงเช่า</dt>
                <dd>
                  {new Date(booking.startDate).toLocaleDateString('th-TH')}
                  {' – '}
                  {new Date(booking.endDate).toLocaleDateString('th-TH')}
                </dd>
                <dt>มัดจำ</dt>
                <dd>฿{(booking.deposit || 0).toLocaleString()}</dd>
                <dt>เลขจอง</dt>
                <dd style={{ fontSize: '0.8rem', fontWeight: 500, wordBreak: 'break-all' }}>{booking.id}</dd>
              </dl>
            </div>

            <div className="staff-detail-card">
              <h3>ดำเนินการ</h3>
              {['ready_for_pickup', 'approved'].includes(booking.status) && (
                <>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    ตรวจสอบตัวตนลูกค้าแล้วกดยืนยันเมื่อมารับชุด
                  </p>
                  <button type="button" className="btn btn-success" onClick={handlePickup}>
                    ยืนยันรับชุด
                  </button>
                </>
              )}

              {booking.status === 'picked_up' && (
                <>
                  <UploadBox
                    label="อัปโหลดรูปสภาพชุด (ก่อน-หลัง)"
                    preview={returnImages}
                    onUpload={handleReturnUpload}
                    multiple
                    onRemove={(i) => setReturnImages((prev) => prev.filter((_, idx) => idx !== i))}
                  />
                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label>ค่าปรับ (บาท)</label>
                    <input
                      className="form-input"
                      type="number"
                      value={penalty}
                      onChange={(e) => setPenalty(e.target.value)}
                      min={0}
                    />
                  </div>
                  <div className="staff-money-box">
                    <div className="staff-money-row">
                      <span>มัดจำเดิม</span>
                      <strong>฿{(booking.deposit || 0).toLocaleString()}</strong>
                    </div>
                    <div className="staff-money-row">
                      <span>ค่าปรับ</span>
                      <strong>฿{Number(penalty || 0).toLocaleString()}</strong>
                    </div>
                    <div className="staff-money-row is-total">
                      <span>ยอดคืนมัดจำ</span>
                      <strong>฿{refundPreview.toLocaleString()}</strong>
                    </div>
                  </div>
                  <button type="button" className="btn btn-primary" onClick={handleReturn}>
                    บันทึกคืนชุด
                  </button>
                </>
              )}

              {booking.status === 'returned' && (
                <div className="alert alert-success">คืนชุดเรียบร้อยแล้ว — ไปหน้าคืนมัดจำเพื่อปิดงาน</div>
              )}

              {!['ready_for_pickup', 'approved', 'picked_up', 'returned'].includes(booking.status) && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  สถานะปัจจุบันยังไม่พร้อมรับหรือคืนชุด
                </p>
              )}
            </div>
          </div>
        )}

        {booking && !isStaff && (
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontWeight: 700 }}>{booking.costume?.name}</h3>
              <StatusBadge status={booking.status} />
            </div>
            <p>ลูกค้า: {booking.user?.name} ({booking.user?.phone})</p>
            <p>วันที่: {new Date(booking.startDate).toLocaleDateString('th-TH')} - {new Date(booking.endDate).toLocaleDateString('th-TH')}</p>
            <p>มัดจำ: ฿{booking.deposit?.toLocaleString()}</p>

            {['ready_for_pickup', 'approved'].includes(booking.status) && (
              <button type="button" className="btn btn-success" style={{ marginTop: '1rem' }} onClick={handlePickup}>
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
                <button type="button" className="btn btn-primary" onClick={handleReturn}>บันทึกคืนชุด</button>
              </div>
            )}

            {booking.status === 'returned' && (
              <div className="alert alert-success" style={{ marginTop: '1rem' }}>คืนชุดเรียบร้อยแล้ว</div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
