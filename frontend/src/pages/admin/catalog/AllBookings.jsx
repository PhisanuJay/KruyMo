import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Eye, Search, ClipboardList, Clock, CheckCircle2,
  XCircle, MoreVertical, Pencil,
} from 'lucide-react';
import { bookingAPI, masterDataAPI } from '../../../services/api';
import DashboardLayout from '../../../components/DashboardLayout';
import StatusBadge from '../../../components/StatusBadge';

const DEGREE_SHORT = { bachelor: 'ป.ตรี', master: 'ป.โท', doctoral: 'ป.เอก' };

const GROUP_STATUSES = {
  all: null,
  pending: ['payment_pending', 'pending', 'payment_verified', 'approved', 'preparing', 'ready_to_ship', 'ready_for_pickup'],
  renting: ['out_for_delivery', 'delivered', 'picked_up', 'return_submitted'],
  returned: ['returned', 'deposit_refunded'],
  canceled: ['cancelled', 'rejected'],
};

const GROUP_TITLES = {
  all: 'การจองทั้งหมด',
  pending: 'รอดำเนินการ',
  renting: 'กำลังเช่า',
  returned: 'คืนแล้ว',
  canceled: 'ยกเลิกการจอง',
};

function formatThaiDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear() + 543}`;
}

function formatOrderId(booking) {
  const d = new Date(booking.createdAt);
  const y = d.getFullYear() + 543;
  const md = `${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const seq = booking.id.replace(/-/g, '').slice(-3).toUpperCase();
  return `#ORD-${y}${md}-${seq}`;
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
  const [selected, setSelected] = useState([]);

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
    setSelected([]);
  }, [group, search, statusFilter, universityFilter, returnFrom, returnTo, sort, perPage]);

  const summary = useMemo(() => {
    const pending = bookings.filter((b) => GROUP_STATUSES.pending.includes(b.status)).length;
    const renting = bookings.filter((b) => GROUP_STATUSES.renting.includes(b.status)).length;
    const returned = bookings.filter((b) => GROUP_STATUSES.returned.includes(b.status)).length;
    const canceled = bookings.filter((b) => GROUP_STATUSES.canceled.includes(b.status)).length;
    return { pending, renting, returned, canceled };
  }, [bookings]);

  const filtered = useMemo(() => {
    let list = [...bookings];
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

  const allPageSelected = pageItems.length > 0 && pageItems.every((b) => selected.includes(b.id));
  const toggleAll = () => {
    if (allPageSelected) {
      setSelected((prev) => prev.filter((id) => !pageItems.some((b) => b.id === id)));
    } else {
      setSelected((prev) => [...new Set([...prev, ...pageItems.map((b) => b.id)])]);
    }
  };
  const toggleOne = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const setGroup = (g) => {
    const next = new URLSearchParams(searchParams);
    if (g === 'all') next.delete('group');
    else next.set('group', g);
    setSearchParams(next);
  };

  const title = GROUP_TITLES[group] || GROUP_TITLES.all;

  return (
    <DashboardLayout role="admin">
      <div className="booking-page-head">
        <div>
          <h1 className="page-title">{title}</h1>
          <div className="booking-breadcrumb">
            <Link to="/admin">หน้าหลัก</Link>
            <span>/</span>
            <button type="button" onClick={() => setGroup('all')}>จัดการคำสั่งเช่า</button>
            <span>/</span>
            <strong>{title}</strong>
          </div>
        </div>
        <div className="booking-head-search">
          <Search size={16} />
          <input
            placeholder="ค้นหาเลขคำสั่ง, ชื่อลูกค้า, เบอร์โทร..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="booking-sum-grid">
        <SummaryCard
          icon={ClipboardList}
          label="รอดำเนินการ"
          value={summary.pending}
          color="#E63946"
          bg="#FFE4E6"
        />
        <SummaryCard
          icon={Clock}
          label="กำลังเช่า"
          value={summary.renting}
          color="#F59E0B"
          bg="#FEF3C7"
        />
        <SummaryCard
          icon={CheckCircle2}
          label="คืนแล้ว"
          value={summary.returned}
          color="#16A34A"
          bg="#DCFCE7"
        />
        <SummaryCard
          icon={XCircle}
          label="ยกเลิกการจอง"
          value={summary.canceled}
          color="#7C3AED"
          bg="#EDE9FE"
        />
      </div>

      <div className="booking-filter-bar">
        <div className="booking-filter-fields">
          <label>
            สถานะ
            <select className="form-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">ทั้งหมด</option>
              <option value="payment_pending">รอชำระเงิน</option>
              <option value="pending">รออนุมัติ / ตรวจสลิป</option>
              <option value="payment_verified">ตรวจสอบการชำระแล้ว</option>
              <option value="approved">อนุมัติแล้ว</option>
              <option value="preparing">กำลังเตรียมชุด</option>
              <option value="ready_to_ship">พร้อมส่งแมสฯ</option>
              <option value="out_for_delivery">แมสฯ กำลังนำส่ง</option>
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
        <div className="loading">กำลังโหลด...</div>
      ) : (
        <>
          <div className="card table-wrapper">
            <table className="dash-bookings-table booking-admin-table">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>
                    <input type="checkbox" checked={allPageSelected} onChange={toggleAll} />
                  </th>
                  <th>เลขคำสั่งเช่า</th>
                  <th>ลูกค้า</th>
                  <th>มหาวิทยาลัย</th>
                  <th>ชุดครุย</th>
                  <th>สถานะ</th>
                  <th>วันเริ่มเช่า</th>
                  <th>กำหนดคืน</th>
                  <th>ยอดรวม</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', color: '#6B7280' }}>ไม่พบรายการจอง</td>
                  </tr>
                )}
                {pageItems.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.includes(b.id)}
                        onChange={() => toggleOne(b.id)}
                      />
                    </td>
                    <td className="dash-order-id">{formatOrderId(b)}</td>
                    <td>
                      <div>{b.user?.name || '—'}</div>
                      <small style={{ color: '#999' }}>{b.user?.phone || b.user?.email || ''}</small>
                    </td>
                    <td>
                      <div>{b.costume?.university?.shortName || b.costume?.university?.name || '—'}</div>
                      <small style={{ color: '#888' }}>{b.costume?.faculty?.name || ''}</small>
                    </td>
                    <td>
                      <div>{DEGREE_SHORT[b.degreeLevel] || b.degreeLabel || '—'}</div>
                      <small style={{ color: '#888' }}>
                        {b.size?.label ? `ไซส์ ${b.size.label}` : ''}
                      </small>
                    </td>
                    <td><StatusBadge status={b.status} size="sm" /></td>
                    <td>{formatThaiDate(b.startDate)}</td>
                    <td>{formatThaiDate(b.endDate)}</td>
                    <td>
                      <div>฿{(b.totalPrice || 0).toLocaleString('th-TH')}</div>
                      <small style={{ color: '#888' }}>มัดจำ ฿{(b.deposit || 0).toLocaleString('th-TH')}</small>
                    </td>
                    <td>
                      <div className="booking-row-actions">
                        <Link to={`/admin/bookings/${b.id}`} className="dash-view-btn" title="ดูรายละเอียด">
                          <Eye size={16} />
                        </Link>
                        <Link to={`/admin/bookings/${b.id}`} className="dash-view-btn" title="จัดการ">
                          <Pencil size={16} />
                        </Link>
                        <button type="button" className="dash-view-btn" title="เพิ่มเติม">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    </DashboardLayout>
  );
}
