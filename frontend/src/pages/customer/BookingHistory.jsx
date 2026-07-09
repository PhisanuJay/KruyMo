import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingAPI } from '../../services/api';
import CustomerLayout from '../../components/CustomerLayout';
import StatusBadge from '../../components/StatusBadge';

export default function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingAPI.getAll().then((r) => setBookings(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <CustomerLayout>
      <div className="container" style={{ padding: '2rem 20px' }}>
        <h1 className="page-title">การจองของฉัน</h1>
        <p className="page-subtitle">ประวัติการเช่าชุดครุยทั้งหมด</p>

        {loading ? (
          <div className="loading">กำลังโหลด...</div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            ยังไม่มีการจอง <Link to="/catalog" style={{ color: '#FF6B6B' }}>เลือกชุดครุย</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {bookings.map((b) => (
              <Link key={b.id} to={`/bookings/${b.id}`} className="card" style={{
                padding: '1.5rem', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
              }}>
                <div>
                  <h3 style={{ fontWeight: 700 }}>{b.costume?.name || 'ชุดครุย'}</h3>
                  <p style={{ fontSize: '0.85rem', color: '#636E72' }}>
                    {new Date(b.startDate).toLocaleDateString('th-TH')} - {new Date(b.endDate).toLocaleDateString('th-TH')}
                  </p>
                  <p style={{ fontWeight: 600, color: '#FF6B6B', marginTop: '4px' }}>฿{b.totalPrice?.toLocaleString()}</p>
                </div>
                <StatusBadge status={b.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
