import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { bookingAPI, paymentAPI } from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import './staff.css';

const PENDING_STATUSES = ['pending', 'payment_pending', 'payment_verified'];
const ACTIVE_STATUSES = ['approved', 'preparing', 'ready_to_ship', 'out_for_delivery', 'delivered', 'return_submitted', 'ready_for_pickup', 'picked_up'];

const PREP_ITEMS = [
  { key: 'gown', label: 'ชุดครุย' },
  { key: 'cap', label: 'หมวก' },
  { key: 'sash', label: 'สายสะพาย' },
  { key: 'accessories', label: 'อุปกรณ์เสริม' },
];

const emptyPrep = () => ({ gown: false, cap: false, sash: false, accessories: false });

function isPrepComplete(checklist) {
  const c = checklist || emptyPrep();
  return PREP_ITEMS.every((item) => c[item.key]);
}

const STATUS_OPTIONS = [
  { value: '', label: 'ทุกสถานะ' },
  { value: 'payment_pending', label: 'รอชำระเงิน' },
  { value: 'pending', label: 'รออนุมัติ / ตรวจสลิป' },
  { value: 'payment_verified', label: 'ตรวจชำระแล้ว' },
  { value: 'approved', label: 'อนุมัติแล้ว' },
  { value: 'preparing', label: 'กำลังเตรียมชุด' },
  { value: 'ready_to_ship', label: 'พร้อมส่งแมสฯ' },
  { value: 'out_for_delivery', label: 'แมสฯ กำลังนำส่ง' },
  { value: 'delivered', label: 'ส่งถึงแล้ว' },
  { value: 'return_submitted', label: 'ลูกค้าส่งคืนแล้ว' },
  { value: 'returned', label: 'รับคืนแล้ว' },
  { value: 'deposit_refunded', label: 'คืนมัดจำแล้ว' },
  { value: 'rejected', label: 'ปฏิเสธแล้ว' },
  { value: 'cancelled', label: 'ยกเลิกแล้ว' },
];

export default function StaffBookings() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState(searchParams.get('status') || '');
  const [group, setGroup] = useState(searchParams.get('group') || '');
  const [modal, setModal] = useState(null);
  const [prepModal, setPrepModal] = useState(null);
  const [prepChecklist, setPrepChecklist] = useState(emptyPrep());
  const [savingPrep, setSavingPrep] = useState(false);
  const [slipModal, setSlipModal] = useState(null);
  const [slipLoading, setSlipLoading] = useState(false);
  const [slipActing, setSlipActing] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const focusId = searchParams.get('focus');

  const load = () => {
    setLoading(true);
    const params = filter ? { status: filter } : {};
    bookingAPI.getAll(params)
      .then((r) => {
        let list = r.data;
        if (!filter && group === 'pending') {
          list = list.filter((b) => PENDING_STATUSES.includes(b.status));
        } else if (!filter && group === 'active') {
          list = list.filter((b) => ACTIVE_STATUSES.includes(b.status));
        }
        setBookings(list);
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

  const openSlip = async (booking) => {
    setSlipLoading(true);
    setSlipModal({ booking, payment: null, error: null });
    try {
      const { data: payment } = await paymentAPI.getByBooking(booking.id);
      setSlipModal({ booking, payment, error: null });
    } catch {
      setSlipModal({ booking, payment: null, error: 'ไม่พบสลิปการชำระเงิน' });
    } finally {
      setSlipLoading(false);
    }
  };

  const handleVerifyFromSlip = async () => {
    if (!slipModal?.payment) return;
    setSlipActing(true);
    try {
      await paymentAPI.verify(slipModal.payment.id, 'verified');
      await bookingAPI.updateStatus(slipModal.booking.id, { status: 'approved' });
      setSlipModal(null);
      load();
    } catch {
      alert('ยืนยันการชำระเงินไม่สำเร็จ');
    } finally {
      setSlipActing(false);
    }
  };

  const handleRejectSlip = async () => {
    if (!slipModal?.payment) return;
    if (!confirm('ปฏิเสธสลิปนี้? ลูกค้าจะต้องอัปโหลดใหม่')) return;
    setSlipActing(true);
    try {
      await paymentAPI.verify(slipModal.payment.id, 'rejected');
      setSlipModal(null);
      load();
    } catch {
      alert('ปฏิเสธสลิปไม่สำเร็จ');
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
    ['pending', 'payment_verified', 'approved', 'preparing', 'ready_for_pickup', 'picked_up', 'returned', 'deposit_refunded'].includes(status);

  const openPrep = (booking) => {
    setPrepChecklist({ ...emptyPrep(), ...(booking.prepChecklist || {}) });
    setPrepModal(booking);
  };

  const startPreparing = async (booking) => {
    await bookingAPI.updateStatus(booking.id, { status: 'preparing' });
    const { data } = await bookingAPI.get(booking.id);
    openPrep(data);
    load();
  };

  const savePrepChecklist = async () => {
    if (!prepModal) return;
    setSavingPrep(true);
    try {
      await bookingAPI.updatePrep(prepModal.id, { prepChecklist });
      setPrepModal((prev) => (prev ? { ...prev, prepChecklist } : null));
      load();
    } finally {
      setSavingPrep(false);
    }
  };

  const markReady = async (bookingId) => {
    await bookingAPI.updateStatus(bookingId, { status: 'ready_to_ship' });
    setPrepModal(null);
    load();
  };

  const goDispatch = () => {
    navigate('/staff/dispatch');
  };

  const renderActions = (b) => {
    if (b.status === 'payment_pending') {
      return <span className="staff-muted-action">รอลูกค้าชำระเงิน</span>;
    }
    if (b.status === 'pending') {
      return (
        <>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => openSlip(b)}>
            ตรวจสลิป
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setModal({ ...b, action: 'reject' })}>
            ปฏิเสธจอง
          </button>
        </>
      );
    }
    if (b.status === 'payment_verified') {
      return (
        <>
          {canViewSlip(b.status) && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => openSlip(b)}>ดูสลิป</button>
          )}
          <button type="button" className="btn btn-success btn-sm" onClick={() => setModal({ ...b, action: 'approve' })}>
            อนุมัติ
          </button>
          <button type="button" className="btn btn-danger btn-sm" onClick={() => setModal({ ...b, action: 'reject' })}>
            ปฏิเสธ
          </button>
        </>
      );
    }
    if (b.status === 'approved') {
      return (
        <>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => openSlip(b)}>ดูสลิป</button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => startPreparing(b)}>
            เริ่มเตรียมชุด
          </button>
        </>
      );
    }
    if (b.status === 'preparing') {
      return (
        <>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => openPrep(b)}>
            Checklist
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={!isPrepComplete(b.prepChecklist)}
            title={!isPrepComplete(b.prepChecklist) ? 'ติ๊ก checklist ให้ครบก่อน' : ''}
            onClick={() => markReady(b.id)}
          >
            พร้อมส่งแมสฯ
          </button>
        </>
      );
    }
    if (['ready_to_ship', 'ready_for_pickup', 'out_for_delivery'].includes(b.status)) {
      return (
        <button type="button" className="btn btn-primary btn-sm" onClick={goDispatch}>
          ไปคิวส่งแมสฯ
        </button>
      );
    }
    if (['delivered', 'picked_up'].includes(b.status)) {
      return <span className="staff-muted-action">รอลูกค้าส่งคืนเอง</span>;
    }
    if (b.status === 'return_submitted') {
      return (
        <button type="button" className="btn btn-success btn-sm" onClick={goDispatch}>
          ไปรับคืนเข้าคลัง
        </button>
      );
    }
    if (b.status === 'returned') {
      return (
        <button type="button" className="btn btn-success btn-sm" onClick={() => navigate('/staff/refund')}>
          คืนมัดจำ
        </button>
      );
    }
    if (canViewSlip(b.status)) {
      return (
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => openSlip(b)}>
          ดูสลิป
        </button>
      );
    }
    return <span className="staff-muted-action">—</span>;
  };

  return (
    <DashboardLayout role="staff">
      <div className="staff-ops">
        <div className="staff-page-head">
          <div>
            <h1 className="page-title">จัดการคำสั่งเช่า</h1>
            <p className="page-subtitle">ตรวจสลิป อนุมัติ และเตรียมชุดให้พร้อมส่งแมสฯ</p>
          </div>
        </div>

        <div className="staff-toolbar">
          <label htmlFor="staff-status-filter">กรองสถานะ</label>
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
          {group && !filter && (
            <span className="staff-chip">
              กลุ่ม: {group === 'pending' ? 'รอดำเนินการ' : 'กำลังดำเนินการ'}
              <button
                type="button"
                aria-label="ล้างกลุ่ม"
                onClick={() => {
                  setGroup('');
                  setSearchParams({}, { replace: true });
                }}
              >
                ×
              </button>
            </span>
          )}
          <span className="staff-panel-count" style={{ marginLeft: 'auto' }}>
            {loading ? '...' : `${bookings.length} รายการ`}
          </span>
        </div>

        <div className="staff-panel">
          {loading ? (
            <div className="staff-empty">กำลังโหลด...</div>
          ) : bookings.length === 0 ? (
            <div className="staff-empty">ไม่พบรายการตามตัวกรอง</div>
          ) : (
            <div className="staff-booking-list">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  id={`staff-booking-${b.id}`}
                  className={`staff-booking-row${b.id === focusId ? ' is-focus' : ''}`}
                >
                  <div className="staff-booking-main">
                    <div className="staff-booking-title">
                      <strong>{b.user?.name || '-'}</strong>
                      <StatusBadge status={b.status} size="sm" />
                    </div>
                    <div className="staff-booking-meta">
                      <span>{b.costume?.name || '-'}</span>
                      <span>{b.size?.label ? `ไซส์ ${b.size.label}` : 'ไม่ระบุไซส์'}</span>
                      <span>{b.degreeLabel || b.degreeLevel || '-'}</span>
                    </div>
                    <div className="staff-booking-meta" style={{ marginTop: 4 }}>
                      <span>{b.user?.email}</span>
                      <span>
                        {new Date(b.startDate).toLocaleDateString('th-TH')}
                        {' – '}
                        {new Date(b.endDate).toLocaleDateString('th-TH')}
                      </span>
                    </div>
                  </div>
                  <div className="staff-booking-side">
                    <span className="amount">฿{(b.totalPrice || 0).toLocaleString()}</span>
                    มัดจำ ฿{(b.deposit || 0).toLocaleString()}
                  </div>
                  <div className="staff-actions">{renderActions(b)}</div>
                </div>
              ))}
            </div>
          )}
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

        {prepModal && (
          <div className="modal-overlay" onClick={() => setPrepModal(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
              <h3>Checklist เตรียมชุด</h3>
              <p style={{ marginBottom: '0.25rem', color: 'var(--text-muted)' }}>
                {prepModal.costume?.name} — {prepModal.user?.name}
              </p>
              <div className="staff-checklist">
                {PREP_ITEMS.map((item) => (
                  <label
                    key={item.key}
                    className={`staff-check-item${prepChecklist[item.key] ? ' is-on' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={!!prepChecklist[item.key]}
                      onChange={(e) => {
                        setPrepChecklist((prev) => ({ ...prev, [item.key]: e.target.checked }));
                      }}
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
              <div className="modal-actions" style={{ flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setPrepModal(null)}>ปิด</button>
                <button type="button" className="btn btn-secondary" disabled={savingPrep} onClick={savePrepChecklist}>
                  {savingPrep ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!isPrepComplete(prepChecklist)}
                  onClick={async () => {
                    await bookingAPI.updatePrep(prepModal.id, { prepChecklist });
                    await markReady(prepModal.id);
                  }}
                >
                  ครบแล้ว — พร้อมส่งแมสฯ
                </button>
              </div>
            </div>
          </div>
        )}

        {slipModal && (
          <div className="modal-overlay" onClick={() => !slipActing && setSlipModal(null)}>
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
                  ) : (
                    <div className="alert alert-error">ไม่มีรูปสลิป</div>
                  )}
                </div>
              )}
              <div className="modal-actions" style={{ flexWrap: 'wrap', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-ghost" disabled={slipActing} onClick={() => setSlipModal(null)}>
                  ปิด
                </button>
                {slipModal.payment?.slipImage &&
                  slipModal.booking?.status === 'pending' &&
                  slipModal.payment?.status === 'pending' && (
                  <>
                    <button type="button" className="btn btn-danger" disabled={slipActing} onClick={handleRejectSlip}>
                      ปฏิเสธสลิป
                    </button>
                    <button type="button" className="btn btn-success" disabled={slipActing} onClick={handleVerifyFromSlip}>
                      {slipActing ? 'กำลังบันทึก...' : 'ยืนยันสลิปและอนุมัติ'}
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
