import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, Receipt, Truck, Wallet, Eye, ArrowRight, ClipboardList,
} from 'lucide-react';
import { bookingAPI, paymentAPI } from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import { formatOrderId, shortOrderCode } from '../../utils/orderId';
import './staff.css';

const ACTIVE_STATUSES = [
  'pending', 'preparing', 'ready_to_ship',
  'out_for_delivery', 'delivered', 'return_submitted', 'ready_for_pickup', 'picked_up',
  'payment_verified', 'approved',
];

const STATUS_OPTIONS = [
  { value: '', label: 'ทุกสถานะ' },
  { value: 'preparing', label: 'จัดเตรียมชุด' },
  { value: 'ready_to_ship', label: 'พร้อมจัดส่ง' },
  { value: 'out_for_delivery', label: 'กำลังจัดส่ง' },
  { value: 'delivered', label: 'ส่งถึงแล้ว' },
  { value: 'return_submitted', label: 'ลูกค้าส่งคืนแล้ว' },
  { value: 'returned', label: 'รับคืนแล้ว' },
  { value: 'deposit_refunded', label: 'คืนมัดจำแล้ว' },
  { value: 'rejected', label: 'ปฏิเสธแล้ว' },
  { value: 'cancelled', label: 'ยกเลิกแล้ว' },
];

const QUICK_FILTERS = [
  { id: 'all', label: 'ทั้งหมด', status: '', group: '' },
  { id: 'active', label: 'กำลังดำเนินการ', status: '', group: 'active' },
  { id: 'shipping', label: 'จัดส่ง', status: '', group: 'shipping' },
  { id: 'refund', label: 'รอคืนมัดจำ', status: '', group: 'refund' },
  { id: 'done', label: 'ปิดงานแล้ว', status: 'deposit_refunded', group: '' },
  { id: 'closed', label: 'ยกเลิก / ปฏิเสธ', status: '', group: 'closed' },
];

function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function degreeLabel(b) {
  return b.degreeLabel || ({
    bachelor: 'ปริญญาตรี',
    master: 'ปริญญาโท',
    doctoral: 'ปริญญาเอก',
  }[b.degreeLevel]) || b.degreeLevel || '—';
}

export default function StaffBookings() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [filter, setFilter] = useState(searchParams.get('status') || '');
  const [group, setGroup] = useState(searchParams.get('group') || '');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [slipModal, setSlipModal] = useState(null);
  const [slipLoading, setSlipLoading] = useState(false);
  const [slipActing, setSlipActing] = useState(false);
  const [rejectSlipReason, setRejectSlipReason] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const focusId = searchParams.get('focus');

  const applyListFilter = (raw, statusFilter, groupFilter) => {
    let list = (raw || []).filter((b) => !['payment_pending', 'pending'].includes(b.status));
    if (statusFilter) {
      list = list.filter((b) => b.status === statusFilter);
    } else if (groupFilter === 'active') {
      list = list.filter((b) => ACTIVE_STATUSES.includes(b.status));
    } else if (groupFilter === 'shipping') {
      list = list.filter((b) =>
        ['ready_to_ship', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'picked_up', 'return_submitted'].includes(b.status));
    } else if (groupFilter === 'refund') {
      list = list.filter((b) => ['return_submitted', 'returned'].includes(b.status));
    } else if (groupFilter === 'closed') {
      list = list.filter((b) => ['cancelled', 'rejected'].includes(b.status));
    }
    return list.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  };

  const load = () => {
    setLoading(true);
    bookingAPI.getAll()
      .then((r) => {
        const raw = r.data || [];
        setAllBookings(raw);
        setBookings(applyListFilter(raw, filter, group));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter, group]);

  useEffect(() => {
    if (!focusId || loading || !bookings.length) return;
    const el = document.getElementById(`staff-booking-${focusId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('is-focus');
      const t = setTimeout(() => el.classList.remove('is-focus'), 2500);
      return () => clearTimeout(t);
    }
  }, [focusId, loading, bookings]);

  const summary = useMemo(() => {
    const visible = (allBookings || []).filter((b) => !['payment_pending', 'pending'].includes(b.status));
    return {
      total: visible.length,
      active: visible.filter((b) => ACTIVE_STATUSES.includes(b.status)).length,
      refund: visible.filter((b) => ['return_submitted', 'returned'].includes(b.status)).length,
      done: visible.filter((b) => b.status === 'deposit_refunded').length,
    };
  }, [allBookings]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter((b) => {
      const hay = [
        b.id,
        formatOrderId(b),
        shortOrderCode(b.id),
        b.user?.name,
        b.user?.phone,
        b.user?.email,
        b.costume?.name,
        b.size?.label,
      ].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [bookings, search]);

  const activeQuick = useMemo(() => {
    if (filter === 'deposit_refunded' && !group) return 'done';
    if (!filter && group === 'active') return 'active';
    if (!filter && group === 'shipping') return 'shipping';
    if (!filter && group === 'refund') return 'refund';
    if (!filter && group === 'closed') return 'closed';
    if (!filter && !group) return 'all';
    return '';
  }, [filter, group]);

  const setQuick = (q) => {
    setFilter(q.status);
    setGroup(q.group);
    const next = new URLSearchParams();
    if (q.status) next.set('status', q.status);
    if (q.group) next.set('group', q.group);
    setSearchParams(next, { replace: true });
  };

  const updateFilter = (value) => {
    setFilter(value);
    setGroup('');
    const next = new URLSearchParams();
    if (value) next.set('status', value);
    setSearchParams(next, { replace: true });
  };

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

  const closeSlipModal = () => {
    if (slipActing) return;
    setSlipModal(null);
    setRejectSlipReason('');
  };

  const openSlip = async (booking) => {
    setRejectSlipReason('');
    setSlipLoading(true);
    setSlipModal({ booking, payment: null, error: null });
    try {
      const { data: payment } = await paymentAPI.getByBooking(booking.id);
      if (!payment?.slipImage && booking.rejectedSlipImage) {
        setSlipModal({
          booking,
          payment: {
            ...payment,
            slipImage: booking.rejectedSlipImage,
            status: payment?.status || 'rejected',
            rejectReason: payment?.rejectReason || booking.slipRejectReason || null,
          },
          error: null,
          archived: true,
        });
      } else {
        setSlipModal({ booking, payment, error: null });
      }
    } catch {
      if (booking.rejectedSlipImage) {
        setSlipModal({
          booking,
          payment: {
            slipImage: booking.rejectedSlipImage,
            status: 'rejected',
            rejectReason: booking.slipRejectReason || null,
            submittedAt: null,
          },
          error: null,
          archived: true,
        });
      } else {
        setSlipModal({ booking, payment: null, error: 'ไม่พบสลิปการชำระเงิน' });
      }
    } finally {
      setSlipLoading(false);
    }
  };

  const handleVerifyFromSlip = async () => {
    if (!slipModal?.payment) return;
    setSlipActing(true);
    try {
      await paymentAPI.verify(slipModal.payment.id, 'verified');
      setSlipModal(null);
      setRejectSlipReason('');
      navigate('/staff/dispatch?queue=prep');
    } catch {
      alert('ยืนยันการชำระเงินไม่สำเร็จ');
    } finally {
      setSlipActing(false);
    }
  };

  const handleRejectSlip = async () => {
    if (!slipModal?.payment) return;
    const slipReason = rejectSlipReason.trim();
    if (!slipReason) {
      alert('กรุณาระบุเหตุผลในการปฏิเสธสลิป');
      return;
    }
    if (!confirm('ปฏิเสธสลิปนี้? ลูกค้าจะต้องอัปโหลดใหม่')) return;
    setSlipActing(true);
    try {
      await paymentAPI.verify(slipModal.payment.id, 'rejected', slipReason);
      setSlipModal(null);
      setRejectSlipReason('');
      load();
    } catch (err) {
      alert(err?.response?.data?.error || 'ปฏิเสธสลิปไม่สำเร็จ');
    } finally {
      setSlipActing(false);
    }
  };

  const slipStatusLabel = (status) => {
    if (status === 'verified') return 'ยืนยันแล้ว';
    if (status === 'rejected') return 'ไม่ผ่าน';
    return 'รอตรวจสอบ';
  };

  const canViewSlip = (status) =>
    [
      'pending', 'payment_verified', 'approved', 'preparing', 'ready_to_ship',
      'out_for_delivery', 'delivered', 'return_submitted', 'ready_for_pickup',
      'picked_up', 'returned', 'deposit_refunded', 'rejected', 'cancelled',
    ].includes(status);

  const primaryAction = (b) => {
    if (b.status === 'pending' || b.status === 'payment_verified') {
      return { label: 'ไปตรวจสลิป', path: '/staff/dispatch?queue=approve', tone: 'primary' };
    }
    if (b.status === 'approved' || b.status === 'preparing') {
      return { label: 'ไปจัดเตรียม', path: '/staff/dispatch?queue=prep', tone: 'primary' };
    }
    if (['ready_to_ship', 'ready_for_pickup'].includes(b.status)) {
      return { label: 'ไปมอบหมายจัดส่ง', path: '/staff/dispatch?queue=ready', tone: 'primary' };
    }
    if (b.status === 'out_for_delivery') {
      return { label: 'ไปยืนยันส่งถึง', path: '/staff/dispatch?queue=shipping', tone: 'primary' };
    }
    if (['delivered', 'picked_up'].includes(b.status)) {
      return { label: 'รอลูกค้าส่งคืน', path: null, tone: 'muted' };
    }
    if (b.status === 'return_submitted') {
      return { label: 'ไปรับคืน', path: '/staff/dispatch?queue=inbound', tone: 'success' };
    }
    if (b.status === 'returned') {
      return { label: 'ไปคืนมัดจำ', path: '/staff/refund', tone: 'success' };
    }
    if (b.status === 'deposit_refunded') {
      return { label: 'ดูประวัติคืนมัดจำ', path: '/staff/refund?tab=done', tone: 'ghost' };
    }
    return null;
  };

  return (
    <DashboardLayout role="staff">
      <div className="staff-ops staff-orders-desk">
        <header className="orders-hero">
          <div className="orders-hero-copy">
            <p className="orders-hero-kicker">คำสั่งเช่า</p>
            <h1>คำสั่งเช่า</h1>
            <p>ค้นหา ติดตามสถานะ และส่งต่อไปยังคิวจัดส่งหรือคืนมัดจำ</p>
          </div>
          <div className="orders-hero-stats">
            <div>
              <span>ทั้งหมด</span>
              <strong>{loading ? '—' : summary.total}</strong>
            </div>
            <div>
              <span>กำลังทำ</span>
              <strong>{loading ? '—' : summary.active}</strong>
            </div>
            <div>
              <span>รอคืนมัดจำ</span>
              <strong>{loading ? '—' : summary.refund}</strong>
            </div>
          </div>
        </header>

        <div className="orders-toolbar">
          <div className="orders-search">
            <Search size={16} />
            <input
              type="search"
              placeholder="ค้นหาชื่อลูกค้า, เบอร์, เลขจอง, ชุดครุย..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="orders-filter">
            <label htmlFor="staff-status-filter">สถานะ</label>
            <select
              id="staff-status-filter"
              className="form-input"
              value={filter}
              onChange={(e) => updateFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="orders-chips" role="tablist" aria-label="กรองด่วน">
          {QUICK_FILTERS.map((q) => (
            <button
              key={q.id}
              type="button"
              role="tab"
              aria-selected={activeQuick === q.id}
              className={activeQuick === q.id ? 'is-active' : ''}
              onClick={() => setQuick(q)}
            >
              {q.label}
            </button>
          ))}
        </div>

        <section className="orders-panel">
          <header className="orders-panel-head">
            <div>
              <h2>รายการคำสั่ง</h2>
              <p>
                {loading
                  ? 'กำลังโหลด...'
                  : `แสดง ${filtered.length} จาก ${bookings.length} รายการ`}
              </p>
            </div>
          </header>

          {loading ? (
            <div className="orders-empty">กำลังโหลดคำสั่งเช่า...</div>
          ) : filtered.length === 0 ? (
            <div className="orders-empty">
              <ClipboardList size={28} strokeWidth={1.5} />
              <h3>ไม่พบรายการ</h3>
              <p>ลองเปลี่ยนตัวกรองหรือคำค้นหา</p>
            </div>
          ) : (
            <div className="orders-list">
              {filtered.map((b) => {
                const action = primaryAction(b);
                return (
                  <article
                    key={b.id}
                    id={`staff-booking-${b.id}`}
                    className={`orders-card${b.id === focusId ? ' is-focus' : ''}`}
                  >
                    <div className="orders-card-main">
                      <div className="orders-card-who">
                        <div className="orders-avatar" aria-hidden>{initials(b.user?.name)}</div>
                        <div>
                          <div className="orders-card-name">
                            <strong>{b.user?.name || 'ลูกค้า'}</strong>
                            <StatusBadge status={b.status} size="sm" />
                          </div>
                          <p className="orders-card-contact">
                            {b.user?.phone || b.user?.email || 'ไม่มีเบอร์ติดต่อ'}
                          </p>
                        </div>
                      </div>

                      <div className="orders-card-facts">
                        <div>
                          <span>ชุดครุย</span>
                          <strong>{b.costume?.name || '—'}</strong>
                        </div>
                        <div>
                          <span>ไซส์ / ระดับ</span>
                          <strong>
                            {b.size?.label ? `ไซส์ ${b.size.label}` : 'ไม่ระบุไซส์'}
                            {' · '}
                            {degreeLabel(b)}
                          </strong>
                        </div>
                        <div>
                          <span>ช่วงเช่า</span>
                          <strong>
                            {new Date(b.startDate).toLocaleDateString('th-TH')}
                            {' – '}
                            {new Date(b.endDate).toLocaleDateString('th-TH')}
                          </strong>
                        </div>
                        <div>
                          <span>เลขจอง</span>
                          <code>{formatOrderId(b)}</code>
                        </div>
                      </div>
                    </div>

                    <div className="orders-card-side">
                      <div className="orders-money">
                        <strong>฿{(b.totalPrice || 0).toLocaleString()}</strong>
                        <span>มัดจำ ฿{(b.deposit || 0).toLocaleString()}</span>
                      </div>
                      <div className="orders-actions">
                        {action?.path ? (
                          <button
                            type="button"
                            className={`btn btn-sm ${
                              action.tone === 'success'
                                ? 'btn-success'
                                : action.tone === 'ghost'
                                  ? 'btn-ghost'
                                  : 'btn-primary'
                            }`}
                            onClick={() => navigate(action.path)}
                          >
                            {action.label}
                            <ArrowRight size={14} />
                          </button>
                        ) : action ? (
                          <span className="orders-muted">{action.label}</span>
                        ) : null}
                        {canViewSlip(b.status) && (
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => openSlip(b)}>
                            <Eye size={14} />
                            ดูสลิป
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <div className="orders-shortcuts">
          <button type="button" className="orders-shortcut" onClick={() => navigate('/staff/dispatch?queue=approve')}>
            <Receipt size={16} />
            ไปตรวจสลิป
          </button>
          <button type="button" className="orders-shortcut" onClick={() => navigate('/staff/dispatch')}>
            <Truck size={16} />
            ไปจัดส่ง–รับคืน
          </button>
          <button type="button" className="orders-shortcut" onClick={() => navigate('/staff/refund')}>
            <Wallet size={16} />
            ไปคืนมัดจำ
          </button>
        </div>

        {modal && (
          <div className="modal-overlay" onClick={() => setModal(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>{modal.action === 'approve' ? 'อนุมัติการจอง' : 'ปฏิเสธการจอง'}</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                {modal.costume?.name} — {modal.user?.name}
              </p>
              {modal.action === 'reject' && (
                <div className="form-group">
                  <label>เหตุผล</label>
                  <textarea className="form-input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>ยกเลิก</button>
                <button
                  type="button"
                  className={`btn ${modal.action === 'approve' ? 'btn-success' : 'btn-danger'}`}
                  onClick={() => handleAction(modal.action)}
                >
                  {modal.action === 'approve' ? 'อนุมัติ' : 'ปฏิเสธ'}
                </button>
              </div>
            </div>
          </div>
        )}

        {slipModal && (
          <div className="modal-overlay" onClick={closeSlipModal}>
            <div className="modal staff-modal-wide" onClick={(e) => e.stopPropagation()}>
              <h3>สลิปการชำระเงิน</h3>
              <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
                {slipModal.booking?.costume?.name} — {slipModal.booking?.user?.name}
              </p>
              {slipLoading ? (
                <div className="loading">กำลังโหลดสลิป...</div>
              ) : slipModal.error ? (
                <div className="alert alert-error">{slipModal.error}</div>
              ) : (
                <div className="staff-slip-layout">
                  <div className="staff-slip-meta">
                    <div>
                      <span>ยอดที่ต้องชำระ</span>
                      <strong>฿{slipModal.booking?.totalPrice?.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span>สถานะสลิป</span>
                      <strong>{slipStatusLabel(slipModal.payment?.status)}</strong>
                    </div>
                    <div>
                      <span>ส่งเมื่อ</span>
                      <strong>
                        {slipModal.payment?.submittedAt
                          ? new Date(slipModal.payment.submittedAt).toLocaleString('th-TH')
                          : '-'}
                      </strong>
                    </div>
                    <div>
                      <span>ลูกค้า</span>
                      <strong>{slipModal.booking?.user?.phone || slipModal.booking?.user?.email || '-'}</strong>
                    </div>
                  </div>
                  {(slipModal.payment?.rejectReason || slipModal.booking?.slipRejectReason) && (
                    <div className="alert alert-error" style={{ marginBottom: '0.75rem' }}>
                      เหตุผลปฏิเสธสลิป: {slipModal.payment?.rejectReason || slipModal.booking?.slipRejectReason}
                    </div>
                  )}
                  {(slipModal.booking?.rejectReason || slipModal.booking?.cancelReason) && (
                    <div className="alert alert-error" style={{ marginBottom: '0.75rem' }}>
                      เหตุผล{slipModal.booking?.status === 'cancelled' ? 'ยกเลิก' : 'ปฏิเสธ'}คำสั่ง: {slipModal.booking?.rejectReason || slipModal.booking?.cancelReason}
                    </div>
                  )}
                  {slipModal.payment?.slipImage ? (
                    <a
                      href={slipModal.payment.slipImage}
                      target="_blank"
                      rel="noreferrer"
                      className="booking-slip-preview"
                      style={{ maxWidth: '100%' }}
                    >
                      <img src={slipModal.payment.slipImage} alt="สลิปการชำระเงิน" />
                    </a>
                  ) : slipModal.booking?.rejectedSlipImage ? (
                    <a
                      href={slipModal.booking.rejectedSlipImage}
                      target="_blank"
                      rel="noreferrer"
                      className="booking-slip-preview"
                      style={{ maxWidth: '100%' }}
                    >
                      <img src={slipModal.booking.rejectedSlipImage} alt="สลิปที่เคยถูกปฏิเสธ" />
                    </a>
                  ) : (
                    <div className="alert alert-error">ไม่มีรูปสลิป</div>
                  )}
                  {slipModal.payment?.slipImage
                    && !slipModal.archived
                    && slipModal.booking?.status === 'pending'
                    && slipModal.payment?.status === 'pending' && (
                    <div className="form-group" style={{ marginTop: '1rem', marginBottom: 0 }}>
                      <label htmlFor="staff-reject-slip-reason">เหตุผลปฏิเสธสลิป (ถ้าจะปฏิเสธ)</label>
                      <textarea
                        id="staff-reject-slip-reason"
                        className="form-input"
                        rows={3}
                        value={rejectSlipReason}
                        onChange={(e) => setRejectSlipReason(e.target.value)}
                        placeholder="เช่น ยอดเงินไม่ตรง / ชื่อบัญชีไม่ตรง / รูปไม่ชัด"
                      />
                    </div>
                  )}
                </div>
              )}
              <div className="modal-actions" style={{ flexWrap: 'wrap', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-ghost" disabled={slipActing} onClick={closeSlipModal}>
                  ปิด
                </button>
                {slipModal.payment?.slipImage &&
                  !slipModal.archived &&
                  slipModal.booking?.status === 'pending' &&
                  slipModal.payment?.status === 'pending' && (
                  <>
                    <button type="button" className="btn btn-danger" disabled={slipActing} onClick={handleRejectSlip}>
                      ปฏิเสธสลิป
                    </button>
                    <button type="button" className="btn btn-success" disabled={slipActing} onClick={handleVerifyFromSlip}>
                      {slipActing ? 'กำลังบันทึก...' : 'ยืนยันสลิป — เข้าคิวจัดเตรียม'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
