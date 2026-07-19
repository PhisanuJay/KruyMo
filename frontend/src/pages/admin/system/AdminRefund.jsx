import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Eye, Search, Wallet, Clock, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { bookingAPI } from '../../../services/api';
import DashboardLayout from '../../../components/DashboardLayout';
import StatusBadge from '../../../components/StatusBadge';

function formatOrderId(booking) {
  const d = new Date(booking.createdAt);
  const y = d.getFullYear() + 543;
  const md = `${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const seq = booking.id.replace(/-/g, '').slice(-3).toUpperCase();
  return `#ORD-${y}${md}-${seq}`;
}

function formatThaiDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('th-TH');
}

function refundAmount(b) {
  if (b.refundAmount != null) return b.refundAmount;
  return Math.max(0, (b.deposit || 0) - (b.penaltyAmount || 0));
}

function SummaryCard({ icon: Icon, label, value, sub, color, bg }) {
  return (
    <div className="booking-sum-card">
      <div className="booking-sum-icon" style={{ color, background: bg }}>
        <Icon size={20} />
      </div>
      <div>
        <div className="booking-sum-label">{label}</div>
        <div className="booking-sum-value">{value}</div>
        {sub && <div className="booking-sum-sub">{sub}</div>}
      </div>
    </div>
  );
}

export default function AdminRefund() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'pending';
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    bookingAPI.getAll()
      .then((r) => setBookings(r.data || []))
      .finally(() => setLoading(false));
  }, []);

  const pending = useMemo(
    () => bookings.filter((b) => ['return_submitted', 'returned'].includes(b.status)),
    [bookings],
  );
  const done = useMemo(
    () => bookings.filter((b) => b.status === 'deposit_refunded'),
    [bookings],
  );

  const summary = useMemo(() => {
    const pendingTotal = pending.reduce((s, b) => s + refundAmount(b), 0);
    const pendingPenalty = pending.reduce((s, b) => s + (b.penaltyAmount || 0), 0);
    const thisMonth = new Date().toISOString().slice(0, 7);
    const refundedThisMonth = done.filter((b) => (b.refundedAt || b.createdAt)?.startsWith(thisMonth));
    const refundedMonthTotal = refundedThisMonth.reduce((s, b) => s + refundAmount(b), 0);
    return {
      pendingCount: pending.length,
      pendingTotal,
      pendingPenalty,
      doneCount: done.length,
      refundedThisMonth: refundedThisMonth.length,
      refundedMonthTotal,
    };
  }, [pending, done]);

  const list = tab === 'done' ? done : pending;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((b) => {
      const hay = [
        formatOrderId(b),
        b.id,
        b.user?.name,
        b.user?.phone,
        b.user?.email,
        b.costume?.name,
        b.penaltyReason,
      ].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [list, search]);

  const setTab = (next) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'pending') params.delete('tab');
    else params.set('tab', next);
    setSearchParams(params);
  };

  return (
    <DashboardLayout role="admin">
      <div className="booking-page-head">
        <div>
          <h1 className="page-title">ติดตามคืนเงินมัดจำ</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            ตรวจสอบสถานะและดูรายละเอียด — การคืนมัดจำจริงดำเนินการโดยพนักงาน
          </p>
        </div>
        <div className="booking-head-search">
          <Search size={16} />
          <input
            placeholder="ค้นหาชื่อ, เลขจอง, ชุดครุย..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="booking-sum-grid">
        <SummaryCard
          icon={Clock}
          label="รอคืนมัดจำ"
          value={summary.pendingCount}
          sub={`รวม ฿${summary.pendingTotal.toLocaleString()}`}
          color="#F59E0B"
          bg="#FEF3C7"
        />
        <SummaryCard
          icon={AlertCircle}
          label="รอหัก/ค่าปรับ"
          value={`฿${summary.pendingPenalty.toLocaleString()}`}
          sub="จากรายการที่รอคืน"
          color="#E63946"
          bg="#FFE4E6"
        />
        <SummaryCard
          icon={CheckCircle2}
          label="คืนแล้วเดือนนี้"
          value={summary.refundedThisMonth}
          sub={`รวม ฿${summary.refundedMonthTotal.toLocaleString()}`}
          color="#16A34A"
          bg="#DCFCE7"
        />
        <SummaryCard
          icon={Wallet}
          label="คืนมัดจำทั้งหมด"
          value={summary.doneCount}
          sub="รายการที่ปิดแล้ว"
          color="#7C3AED"
          bg="#EDE9FE"
        />
      </div>

      <div className="booking-filter-bar" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className={`btn btn-sm${tab === 'pending' ? ' btn-primary' : ' btn-outline'}`}
            onClick={() => setTab('pending')}
          >
            รอคืน ({summary.pendingCount})
          </button>
          <button
            type="button"
            className={`btn btn-sm${tab === 'done' ? ' btn-primary' : ' btn-outline'}`}
            onClick={() => setTab('done')}
          >
            คืนแล้ว ({summary.doneCount})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">กำลังโหลด...</div>
      ) : filtered.length === 0 ? (
        <div className="card empty-state" style={{ padding: '2rem' }}>
          {tab === 'pending' ? 'ไม่มีรายการรอคืนมัดจำ' : 'ยังไม่มีรายการที่คืนมัดจำแล้ว'}
        </div>
      ) : (
        <div className="card table-wrapper">
          <table className="dash-bookings-table booking-admin-table">
            <thead>
              <tr>
                <th>เลขคำสั่ง</th>
                <th>ลูกค้า</th>
                <th>ชุดครุย</th>
                <th>มัดจำ</th>
                <th>หัก</th>
                <th>คืนสุทธิ</th>
                <th>บัญชีรับเงิน</th>
                <th>สถานะ</th>
                <th>{tab === 'done' ? 'วันที่คืน' : 'รับคืนเมื่อ'}</th>
                <th>ดู</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td className="dash-order-id">{formatOrderId(b)}</td>
                  <td>
                    <div>{b.user?.name || '—'}</div>
                    <small style={{ color: '#999' }}>{b.user?.phone || b.user?.email || ''}</small>
                  </td>
                  <td>{b.costume?.name || '—'}</td>
                  <td>฿{(b.deposit || 0).toLocaleString()}</td>
                  <td style={{ color: b.penaltyAmount > 0 ? '#E17055' : undefined }}>
                    ฿{(b.penaltyAmount || 0).toLocaleString()}
                    {b.penaltyReason && (
                      <small style={{ display: 'block', color: '#999' }}>{b.penaltyReason}</small>
                    )}
                  </td>
                  <td style={{ fontWeight: 700, color: '#00B894' }}>
                    ฿{refundAmount(b).toLocaleString()}
                  </td>
                  <td style={{ maxWidth: 220 }}>
                    {b.refundAccountText
                      ? <small style={{ color: '#555' }}>{b.refundAccountText}</small>
                      : <small style={{ color: '#E17055' }}>ยังไม่ระบุ</small>}
                  </td>
                  <td><StatusBadge status={b.status} size="sm" /></td>
                  <td>
                    {tab === 'done'
                      ? formatThaiDate(b.refundedAt)
                      : formatThaiDate(b.returnedAt)}
                    {tab === 'done' && b.refundSlipImage && (
                      <div style={{ marginTop: 6 }}>
                        <a href={b.refundSlipImage} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem' }}>
                          ดูสลิปโอนคืน
                        </a>
                      </div>
                    )}
                  </td>
                  <td>
                    <Link to={`/admin/bookings/${b.id}`} className="dash-view-btn" title="ดูรายละเอียด">
                      <Eye size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
