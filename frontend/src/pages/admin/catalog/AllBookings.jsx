import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Eye, Search, ClipboardList, Clock, CheckCircle2,
  XCircle, Pencil,
} from 'lucide-react';
import { bookingAPI, masterDataAPI } from '../../../services/api';
import DashboardLayout from '../../../components/DashboardLayout';
import StatusBadge from '../../../components/StatusBadge';
import { formatOrderId } from '../../../utils/orderId';

const DEGREE_SHORT = { bachelor: 'ป.ตรี', master: 'ป.โท', doctoral: 'ป.เอก' };

const GROUP_STATUSES = {
  all: null,
  pending: ['pending', 'payment_verified', 'approved', 'preparing', 'ready_to_ship', 'ready_for_pickup'],
  renting: ['out_for_delivery', 'delivered', 'picked_up', 'return_submitted'],
  returned: ['returned', 'deposit_refunded'],
  canceled: ['cancelled', 'rejected'],
};

const GROUP_TITLES = {
  all: 'การจองทั้งหมด',
  pending: 'ก่อนส่งถึง',
  renting: 'ระหว่างใช้งาน / ส่งคืน',
  returned: 'คืนแล้ว',
  canceled: 'ยกเลิกการจอง',
};

function formatThaiDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear() + 543}`;
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

export default function AllBookings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const group = searchParams.get('group') || 'all';

  const [bookings, setBookings] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [universityFilter, setUniversityFilter] = useState('');
  const [returnFrom, setReturnFrom] = useState('');
  const [returnTo, setReturnTo] = useState('');
  const [sort, setSort] = useState('latest');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      bookingAPI.getAll(),
      masterDataAPI.universities.getAll(),
    ])
      .then(([bRes, uRes]) => {
        setBookings(bRes.data || []);
        setUniversities(uRes.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [group, search, statusFilter, universityFilter, returnFrom, returnTo, sort, perPage]);

  const summary = useMemo(() => {
    const pending = bookings.filter((b) => GROUP_STATUSES.pending.includes(b.status)).length;
    const renting = bookings.filter((b) => GROUP_STATUSES.renting.includes(b.status)).length;
    const returned = bookings.filter((b) => GROUP_STATUSES.returned.includes(b.status)).length;
    const canceled = bookings.filter((b) => GROUP_STATUSES.canceled.includes(b.status)).length;
    return { pending, renting, returned, canceled };
  }, [bookings]);

  const filtered = useMemo(() => {
    let list = [...bookings].filter((b) => b.status !== 'payment_pending');
    const groupStatuses = GROUP_STATUSES[group];
    if (groupStatuses) list = list.filter((b) => groupStatuses.includes(b.status));
    if (statusFilter) list = list.filter((b) => b.status === statusFilter);

    if (universityFilter) {
      list = list.filter((b) => b.costume?.universityId === universityFilter || b.costume?.university?.id === universityFilter);
    }
    if (returnFrom) list = list.filter((b) => b.endDate >= returnFrom);
    if (returnTo) list = list.filter((b) => b.endDate <= returnTo);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((b) => {
        const orderId = formatOrderId(b).toLowerCase();
        const hay = [orderId, b.id, b.user?.name, b.user?.email, b.user?.phone, b.costume?.name, b.costume?.university?.name]
          .filter(Boolean).join(' ').toLowerCase();
        return hay.includes(q);
      });
    }

    list.sort((a, b) => {
      if (sort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sort === 'return_asc') return String(a.endDate).localeCompare(String(b.endDate));
      if (sort === 'return_desc') return String(b.endDate).localeCompare(String(a.endDate));
      if (sort === 'amount') return (b.totalPrice || 0) - (a.totalPrice || 0);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return list;
  }, [bookings, group, statusFilter, universityFilter, returnFrom, returnTo, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageSafe = Math.min(page, totalPages);
  const pageItems = filtered.slice((pageSafe - 1) * perPage, pageSafe * perPage);
  const from = filtered.length === 0 ? 0 : (pageSafe - 1) * perPage + 1;
  const to = Math.min(pageSafe * perPage, filtered.length);

  const setGroup = (g) => {
    const next = new URLSearchParams(searchParams);
    if (g === 'all') next.delete('group');
    else next.set('group', g);
    setSearchParams(next);
  };

  const title = GROUP_TITLES[group] || GROUP_TITLES.all;
  const groupChips = [
    { id: 'all', label: 'ทั้งหมด', count: bookings.filter((b) => b.status !== 'payment_pending').length },
    { id: 'pending', label: 'ก่อนส่งถึง', count: summary.pending },
    { id: 'renting', label: 'ระหว่างใช้งาน', count: summary.renting },
    { id: 'returned', label: 'คืนแล้ว', count: summary.returned },
    { id: 'canceled', label: 'ยกเลิก / ปฏิเสธ', count: summary.canceled },
  ];

  return (
    <DashboardLayout role="admin">
      <div className="admin-desk">
        <header className="admin-hero admin-hero-compact">
          <div className="admin-hero-copy">
            <p className="admin-hero-kicker">คำสั่งเช่า</p>
            <h1>คำสั่งเช่า</h1>
            <p>ค้นหาและกรองคำสั่ง — ใช้ชิปด้านล่างแทนเมนูย่อยในแถบข้าง</p>
          </div>
          <div className="admin-hero-aside">
            <span>กำลังดู</span>
            <strong style={{ fontSize: '1.15rem', lineHeight: 1.3 }}>{title}</strong>
            <small>{loading ? '...' : `${filtered.length} รายการ`}</small>
          </div>
        </header>

        <div className="admin-toolbar">
          <div className="admin-search">
            <Search size={16} />
            <input
              type="search"
              placeholder="ค้นหาเลขคำสั่ง, ชื่อลูกค้า, เบอร์โทร..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="admin-chips" role="tablist" aria-label="กลุ่มคำสั่งเช่า">
          {groupChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              role="tab"
              aria-selected={group === chip.id}
              className={group === chip.id ? 'is-active' : ''}
              onClick={() => setGroup(chip.id)}
            >
              {chip.label}
              <em>{chip.count}</em>
            </button>
          ))}
        </div>

        <div className="booking-sum-grid admin-sum-grid">
          <button type="button" className={`admin-sum-btn${group === 'pending' ? ' is-active' : ''}`} onClick={() => setGroup('pending')}>
            <SummaryCard icon={ClipboardList} label="ก่อนส่งถึง" value={summary.pending} color="#E63946" bg="#FFE4E6" />
          </button>
          <button type="button" className={`admin-sum-btn${group === 'renting' ? ' is-active' : ''}`} onClick={() => setGroup('renting')}>
            <SummaryCard icon={Clock} label="ระหว่างใช้งาน" value={summary.renting} color="#141414" bg="#F5F5F4" />
          </button>
          <button type="button" className={`admin-sum-btn${group === 'returned' ? ' is-active' : ''}`} onClick={() => setGroup('returned')}>
            <SummaryCard icon={CheckCircle2} label="คืนแล้ว" value={summary.returned} color="#15803d" bg="#DCFCE7" />
          </button>
          <button type="button" className={`admin-sum-btn${group === 'canceled' ? ' is-active' : ''}`} onClick={() => setGroup('canceled')}>
            <SummaryCard icon={XCircle} label="ยกเลิก / ปฏิเสธ" value={summary.canceled} color="#57534e" bg="#F5F5F4" />
          </button>
        </div>

        <div className="booking-filter-bar admin-filter-bar">
          <div className="booking-filter-fields">
            <label>
              สถานะ
              <select className="form-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">ทั้งหมด</option>
                <option value="pending">รอตรวจสลิป</option>
                <option value="preparing">จัดเตรียมชุด</option>
                <option value="ready_to_ship">พร้อมจัดส่ง</option>
                <option value="out_for_delivery">กำลังจัดส่ง</option>
                <option value="delivered">ส่งถึงแล้ว</option>
                <option value="return_submitted">ลูกค้าส่งคืนแล้ว</option>
                <option value="returned">รับคืนแล้ว</option>
                <option value="deposit_refunded">คืนเงินมัดจำแล้ว</option>
                <option value="cancelled">ยกเลิก</option>
                <option value="rejected">ปฏิเสธ</option>
              </select>
            </label>
            <label>
              มหาวิทยาลัย
              <select className="form-input" value={universityFilter} onChange={(e) => setUniversityFilter(e.target.value)}>
                <option value="">ทั้งหมด</option>
                {universities.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </label>
            <label>
              กำหนดคืน
              <div className="booking-date-range">
                <input className="form-input" type="date" value={returnFrom} onChange={(e) => setReturnFrom(e.target.value)} />
                <span>–</span>
                <input className="form-input" type="date" value={returnTo} onChange={(e) => setReturnTo(e.target.value)} />
              </div>
            </label>
            <label>
              เรียงลำดับ
              <select className="form-input" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="latest">ล่าสุด</option>
                <option value="oldest">เก่าสุด</option>
                <option value="return_asc">กำหนดคืนใกล้สุด</option>
                <option value="return_desc">กำหนดคืนไกลสุด</option>
                <option value="amount">ยอดรวมสูงสุด</option>
              </select>
            </label>
          </div>
        </div>

        {loading ? (
          <div className="admin-empty">กำลังโหลดคำสั่งเช่า...</div>
        ) : (
          <>
            <div className="admin-panel">
              <div className="table-wrapper">
                <table className="admin-table booking-admin-table">
                  <thead>
                    <tr>
                      <th>เลขคำสั่ง</th>
                      <th>ลูกค้า</th>
                      <th>ชุดครุย</th>
                      <th>สถานะ</th>
                      <th>กำหนดคืน</th>
                      <th>ยอดรวม</th>
                      <th>ดู</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.length === 0 && (
                      <tr>
                        <td colSpan={7} className="admin-table-empty">ไม่พบรายการจอง</td>
                      </tr>
                    )}
                    {pageItems.map((b) => (
                      <tr key={b.id}>
                        <td className="admin-order-id">{formatOrderId(b)}</td>
                        <td>
                          <div className="admin-cell-main">{b.user?.name || '—'}</div>
                          <div className="admin-cell-sub">{b.user?.phone || b.user?.email || ''}</div>
                        </td>
                        <td>
                          <div className="admin-cell-main">{DEGREE_SHORT[b.degreeLevel] || b.degreeLabel || b.costume?.name || '—'}</div>
                          <div className="admin-cell-sub">
                            {b.costume?.university?.shortName || b.costume?.university?.name || '—'}
                            {b.size?.label ? ` · ไซส์ ${b.size.label}` : ''}
                          </div>
                        </td>
                        <td><StatusBadge status={b.status} size="sm" /></td>
                        <td>{formatThaiDate(b.endDate)}</td>
                        <td className="admin-cell-money">฿{(b.totalPrice || 0).toLocaleString('th-TH')}</td>
                        <td>
                          <div className="booking-row-actions">
                            <Link to={`/admin/bookings/${b.id}`} className="dash-view-btn" title="ดูรายละเอียด">
                              <Eye size={16} />
                            </Link>
                            <Link to={`/admin/bookings/${b.id}`} className="dash-view-btn" title="จัดการ">
                              <Pencil size={16} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="booking-pagination">
              <span>แสดง {from} - {to} จาก {filtered.length} รายการ</span>
              <div className="booking-pagination-controls">
                <select
                  className="form-input"
                  style={{ width: 'auto', minWidth: 90 }}
                  value={perPage}
                  onChange={(e) => setPerPage(Number(e.target.value))}
                >
                  <option value={10}>10 / หน้า</option>
                  <option value={20}>20 / หน้า</option>
                  <option value={50}>50 / หน้า</option>
                </select>
                <button type="button" className="btn btn-ghost btn-sm" disabled={pageSafe <= 1} onClick={() => setPage(pageSafe - 1)}>
                  ก่อนหน้า
                </button>
                <span className="booking-page-num">{pageSafe} / {totalPages}</span>
                <button type="button" className="btn btn-ghost btn-sm" disabled={pageSafe >= totalPages} onClick={() => setPage(pageSafe + 1)}>
                  ถัดไป
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
