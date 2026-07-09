import { useState, useEffect } from 'react';
import { bookingAPI, paymentAPI } from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';

export default function StaffBookings() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    const params = filter ? { status: filter } : {};
    bookingAPI.getAll(params).then((r) => setBookings(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const handleAction = async (action) => {
    if (action === 'reject' && !reason) return alert('กรุณากรอกเหตุผล');
    await bookingAPI.updateStatus(modal.id, {
      status: action === 'approve' ? 'approved' : 'rejected',
      rejectReason: reason,
    });
    setModal(null);
    setReason('');
    load();
  };

  const handleVerifyPayment = async (bookingId) => {
    try {
      const { data: payment } = await paymentAPI.getByBooking(bookingId);
      await paymentAPI.verify(payment.id, 'verified');
      await bookingAPI.updateStatus(bookingId, { status: 'approved' });
      load();
    } catch {
      alert('ไม่พบข้อมูลการชำระเงิน');
    }
  };

  return (
    <DashboardLayout role="staff">
      <h1 className="page-title">จัดการคำสั่งเช่า</h1>
      <p className="page-subtitle">อนุมัติ/ปฏิเสธการจอง และตรวจสอบการชำระเงิน</p>

      <div style={{ marginBottom: '1.5rem' }}>
        <select className="form-input" style={{ maxWidth: 250 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">ทุกสถานะ</option>
          <option value="payment_pending">รอชำระเงิน</option>
          <option value="payment_verified">ตรวจสอบการชำระแล้ว</option>
          <option value="approved">อนุมัติแล้ว</option>
          <option value="preparing">กำลังเตรียมชุด</option>
          <option value="ready_for_pickup">พร้อมรับชุด</option>
          <option value="picked_up">รับชุดแล้ว</option>
          <option value="returned">คืนชุดแล้ว</option>
        </select>
      </div>

      {loading ? <div className="loading">กำลังโหลด...</div> : (
        <div className="card table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ลูกค้า</th>
                <th>ชุดครุย</th>
                <th>ไซส์ / ระดับ</th>
                <th>วันที่</th>
                <th>ยอดรวม</th>
                <th>สถานะ</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>{b.user?.name}<br /><small style={{ color: '#999' }}>{b.user?.email}</small></td>
                  <td>{b.costume?.name}</td>
                  <td style={{ fontSize: '0.85rem' }}>
                    <div>{b.size?.label ? `ไซส์ ${b.size.label}` : '-'}</div>
                    <div style={{ color: '#888' }}>{b.degreeLabel || b.degreeLevel || ''}</div>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>
                    {new Date(b.startDate).toLocaleDateString('th-TH')} - {new Date(b.endDate).toLocaleDateString('th-TH')}
                  </td>
                  <td>฿{b.totalPrice?.toLocaleString()}</td>
                  <td><StatusBadge status={b.status} size="sm" /></td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {b.status === 'payment_verified' && (
                        <>
                          <button className="btn btn-success btn-sm" onClick={() => setModal({ ...b, action: 'approve' })}>อนุมัติ</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setModal({ ...b, action: 'reject' })}>ปฏิเสธ</button>
                        </>
                      )}
                      {b.status === 'payment_pending' && (
                        <button className="btn btn-secondary btn-sm" onClick={() => handleVerifyPayment(b.id)}>ยืนยันชำระเงิน</button>
                      )}
                      {b.status === 'approved' && (
                        <button className="btn btn-primary btn-sm"
                          onClick={() => bookingAPI.updateStatus(b.id, { status: 'preparing' }).then(load)}>
                          เตรียมชุด
                        </button>
                      )}
                      {b.status === 'preparing' && (
                        <button className="btn btn-primary btn-sm"
                          onClick={() => bookingAPI.updateStatus(b.id, { status: 'ready_for_pickup' }).then(load)}>
                          พร้อมรับ
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{modal.action === 'approve' ? 'อนุมัติการจอง' : 'ปฏิเสธการจอง'}</h3>
            <p>{modal.costume?.name} - {modal.user?.name}</p>
            {modal.action === 'reject' && (
              <div className="form-group">
                <label>เหตุผล</label>
                <textarea className="form-input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>ยกเลิก</button>
              <button className={`btn ${modal.action === 'approve' ? 'btn-success' : 'btn-danger'}`}
                onClick={() => handleAction(modal.action)}>
                {modal.action === 'approve' ? 'อนุมัติ' : 'ปฏิเสธ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
