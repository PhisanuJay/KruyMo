import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';
import { bookingAPI } from '../../services/api';
import CustomerLayout from '../../components/CustomerLayout';
import StatusBadge from '../../components/StatusBadge';

const STATUS_FILTERS = [
  { value: '', label: 'ทุกสถานะ' },
  { value: 'pending', label: 'รอตรวจสลิป' },
  { value: 'preparing', label: 'จัดเตรียมชุด' },
  { value: 'ready_to_ship', label: 'พร้อมจัดส่ง' },
  { value: 'out_for_delivery', label: 'กำลังจัดส่ง' },
  { value: 'delivered', label: 'ส่งถึงแล้ว' },
  { value: 'return_submitted', label: 'ส่งคืนแล้ว (รอรับ)' },
  { value: 'returned', label: 'รับคืนแล้ว' },
  { value: 'deposit_refunded', label: 'คืนเงินมัดจำแล้ว' },
  { value: 'cancelled', label: 'ยกเลิก' },
  { value: 'rejected', label: 'ปฏิเสธ' },
];

const QUICK_FILTERS = [
  { value: '', label: 'ทั้งหมด' },
  { value: 'pending', label: 'รอตรวจสลิป' },
  { value: 'out_for_delivery', label: 'กำลังส่ง' },
  { value: 'delivered', label: 'ส่งถึงแล้ว' },
  { value: 'return_submitted', label: 'ส่งคืนแล้ว' },
  { value: 'deposit_refunded', label: 'คืนมัดจำแล้ว' },
];

export default function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    bookingAPI.getAll()
      .then((r) => {
        const list = Array.isArray(r.data) ? r.data : [];
        const sorted = [...list].sort(
          (a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0)
        );
        setBookings(sorted);
      })
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings.filter((b) => {
      // ไม่โชว์รายการที่ยังไม่ส่งสลิป — บังคับชำระก่อนดูประวัติ
      if (b.status === 'payment_pending') return false;
      if (statusFilter && b.status !== statusFilter) return false;
      if (!q) return true;
      const name = (b.costume?.name || '').toLowerCase();
      const id = (b.id || '').toLowerCase();
      return name.includes(q) || id.includes(q);
    });
  }, [bookings, statusFilter, search]);

  return (
    <CustomerLayout>
      <div className="container" style={{ padding: '2rem 20px' }}>
        <h1 className="page-title">ติดตามสถานะ</h1>
        <p className="page-subtitle">ดูสถานะการจองล่าสุดอยู่บนสุด · ค้นหาและกรองได้</p>

        <div className="card booking-history-filters">
          <div className="booking-history-filters-row">
            <div className="booking-search">
              <Search size={18} />
              <input
                className="form-input"
                type="search"
                placeholder="ค้นหาชื่อชุดครุย..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="booking-status-select">
              <Filter size={16} />
              <select
                className="form-input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {STATUS_FILTERS.map((f) => (
                  <option key={f.value || 'all'} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="booking-quick-filters">
            {QUICK_FILTERS.map((f) => (
              <button
                key={f.value || 'all'}
                type="button"
                className={`booking-chip ${statusFilter === f.value ? 'is-active' : ''}`}
                onClick={() => setStatusFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading">กำลังโหลด...</div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            ยังไม่มีการจอง{' '}
            <Link to="/catalog" style={{ color: 'var(--primary)' }}>เลือกชุดครุย</Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">ไม่พบรายการที่ตรงกับตัวกรอง</div>
        ) : (
          <>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
              แสดง {filtered.length} จาก {bookings.length} รายการ
            </p>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {filtered.map((b) => (
                <div key={b.id} className="card booking-history-item" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Link
                    to={`/bookings/${b.id}`}
                    className="booking-history-item-main"
                    style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}
                  >
                    {b.costume?.images?.[0] && (
                      <img
                        src={b.costume.images[0]}
                        alt=""
                        className="booking-history-thumb"
                      />
                    )}
                    <div>
                      <h3>{b.costume?.name || 'ชุดครุย'}</h3>
                      <p className="booking-history-meta">
                        {new Date(b.startDate).toLocaleDateString('th-TH')}
                        {' – '}
                        {new Date(b.endDate).toLocaleDateString('th-TH')}
                      </p>
                      <p className="booking-history-date">
                        จองเมื่อ {new Date(b.createdAt || b.updatedAt).toLocaleString('th-TH')}
                      </p>
                      <p className="booking-history-price">฿{b.totalPrice?.toLocaleString()}</p>
                    </div>
                  </Link>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <StatusBadge status={b.status} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </CustomerLayout>
  );
}
