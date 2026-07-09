import { useState, useEffect } from 'react';
import { bookingAPI } from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';

export default function DepositRefund() {
  const [bookings, setBookings] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    bookingAPI.getAll({ status: 'returned' }).then((r) => setBookings(r.data));
  }, []);

  const handleRefund = async (id) => {
    if (!confirm('ยืนยันคืนเงินมัดจำ?')) return;
    await bookingAPI.refund(id);
    setBookings((prev) => prev.filter((b) => b.id !== id));
    setSelected(null);
  };

  return (
    <DashboardLayout role="staff">
      <h1 className="page-title">คืนเงินมัดจำ</h1>
      <p className="page-subtitle">คำนวณและยืนยันการคืนเงินมัดจำหลังคืนชุด</p>

      {bookings.length === 0 ? (
        <div className="empty-state">ไม่มีรายการรอคืนเงินมัดจำ</div>
      ) : (
        <div className="grid-2">
          {bookings.map((b) => {
            const refund = Math.max(0, b.deposit - (b.penaltyAmount || 0));
            return (
              <div key={b.id} className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontWeight: 700 }}>{b.user?.name}</h3>
                <p style={{ fontSize: '0.9rem', color: '#636E72' }}>{b.costume?.name}</p>
                <StatusBadge status={b.status} size="sm" />
                <div style={{ margin: '1rem 0', background: '#f8f9fa', borderRadius: '10px', padding: '1rem' }}>
                  <p>มัดจำเดิม: ฿{b.deposit?.toLocaleString()}</p>
                  <p>ค่าปรับ: ฿{(b.penaltyAmount || 0).toLocaleString()}</p>
                  <p style={{ fontWeight: 800, color: '#00B894', fontSize: '1.2rem' }}>
                    คืน: ฿{refund.toLocaleString()}
                  </p>
                </div>
                <button className="btn btn-success" onClick={() => handleRefund(b.id)}>
                  ยืนยันคืนเงินมัดจำ
                </button>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
