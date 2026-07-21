import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Truck, ClipboardCheck, Package, PackageCheck, MapPin, RotateCcw,
  Receipt, Phone, CalendarDays, User,
} from 'lucide-react';
import { bookingAPI, paymentAPI } from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import { formatOrderId } from '../../utils/orderId';
import './staff.css';

const QUEUES = [
  {
    id: 'approve',
    title: 'รอตรวจสลิป',
    short: 'ตรวจสลิป',
    hint: 'ตรวจสลิปโอนเงิน — ยืนยันแล้วเข้าคิวจัดเตรียมชุด',
    statuses: ['pending', 'payment_verified'],
    icon: Receipt,
  },
  {
    id: 'prep',
    title: 'จัดเตรียมชุด',
    short: 'จัดเตรียม',
    hint: 'เตรียมชุดครุยให้ครบ แล้วกดพร้อมจัดส่ง',
    statuses: ['preparing', 'approved'],
    icon: Package,
  },
  {
    id: 'ready',
    title: 'พร้อมจัดส่ง',
    short: 'พร้อมส่ง',
    hint: 'เตรียมครบแล้ว — มอบหมายคนส่งและช่วงเวลา',
    statuses: ['ready_to_ship', 'ready_for_pickup'],
    icon: PackageCheck,
  },
  {
    id: 'shipping',
    title: 'กำลังจัดส่ง',
    short: 'กำลังส่ง',
    hint: 'ออกส่งแล้ว — ยืนยันเมื่อส่งถึงลูกค้า',
    statuses: ['out_for_delivery'],
    icon: Truck,
  },
  {
    id: 'with_customer',
    title: 'อยู่กับลูกค้า',
    short: 'กับลูกค้า',
    hint: 'ส่งถึงแล้ว — รอลูกค้าใช้งานและแจ้งส่งคืน',
    statuses: ['delivered', 'picked_up'],
    icon: MapPin,
  },
  {
    id: 'inbound',
    title: 'รอรับคืน',
    short: 'รับคืน',
    hint: 'ลูกค้าแจ้งส่งคืนแล้ว — ตรวจรับเข้าคลัง',
    statuses: ['return_submitted'],
    icon: RotateCcw,
  },
];

const emptyMessenger = () => ({ name: '', phone: '', eta: '', note: '' });

const DELIVERY_TIME_SLOTS = [
  '09:00–11:00',
  '11:00–13:00',
  '13:00–15:00',
  '15:00–17:00',
  '17:00–19:00',
];

function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function StaffDispatch() {
  const navigate = useNavigate();
  const location = useLocation();
  const layoutRole = location.pathname.startsWith('/admin') ? 'admin' : 'staff';
  const refundPath = layoutRole === 'admin' ? '/admin/refund' : '/staff/refund';
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeQueue, setActiveQueue] = useState(() => {
    const q = new URLSearchParams(location.search).get('queue');
    return QUEUES.some((x) => x.id === q) ? q : 'approve';
  });
  const [messengerModal, setMessengerModal] = useState(null);
  const [messengerForm, setMessengerForm] = useState(emptyMessenger());
  const [slipModal, setSlipModal] = useState(null);
  const [slipLoading, setSlipLoading] = useState(false);
  const [slipActing, setSlipActing] = useState(false);
  const [rejectSlipReason, setRejectSlipReason] = useState('');
  const [acting, setActing] = useState(false);

  const load = () => {
    setLoading(true);
    bookingAPI.getAll()
      .then((r) => setBookings(r.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const q = new URLSearchParams(location.search).get('queue');
    if (q && QUEUES.some((x) => x.id === q)) setActiveQueue(q);
  }, [location.search]);

  const counts = useMemo(() => QUEUES.reduce((acc, q) => {
    acc[q.id] = bookings.filter((b) => q.statuses.includes(b.status)).length;
    return acc;
  }, {}), [bookings]);

  const totalInPipeline = useMemo(
    () => QUEUES.reduce((s, q) => s + (counts[q.id] || 0), 0),
    [counts],
  );

  const queue = QUEUES.find((q) => q.id === activeQueue) || QUEUES[0];
  const list = bookings.filter((b) => queue.statuses.includes(b.status));
  const QueueIcon = queue.icon;

  const setStatus = async (booking, status, extra = {}) => {
    setActing(true);
    try {
      await bookingAPI.updateStatus(booking.id, { status, ...extra });
      setMessengerModal(null);
      setMessengerForm(emptyMessenger());
      load();
    } catch {
      alert('อัปเดตสถานะไม่สำเร็จ');
    } finally {
      setActing(false);
    }
  };

  const openDispatch = (booking) => {
    setMessengerForm({
      name: booking.messenger?.name || '',
      phone: booking.messenger?.phone || '',
      eta: booking.messenger?.eta || '',
      note: booking.messenger?.note || '',
    });
    setMessengerModal(booking);
  };

  const confirmDispatch = async () => {
    if (!messengerModal) return;
    if (!messengerForm.name.trim()) {
      alert('กรุณาระบุชื่อพนักงานจัดส่ง');
      return;
    }
    if (!messengerForm.eta.trim()) {
      alert('กรุณาเลือกช่วงเวลาส่ง');
      return;
    }
    await setStatus(messengerModal, 'out_for_delivery', {
      messenger: {
        ...messengerForm,
        dispatchedAt: new Date().toISOString(),
      },
    });
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
      setActiveQueue('prep');
      load();
    } catch {
      alert('ยืนยันการชำระเงินไม่สำเร็จ');
    } finally {
      setSlipActing(false);
    }
  };

  const handleRejectSlip = async () => {
    if (!slipModal?.payment) return;
    const reason = rejectSlipReason.trim();
    if (!reason) {
      alert('กรุณาระบุเหตุผลในการปฏิเสธสลิป');
      return;
    }
    if (!confirm('ปฏิเสธสลิปนี้? ลูกค้าจะต้องอัปโหลดใหม่')) return;
    setSlipActing(true);
    try {
      await paymentAPI.verify(slipModal.payment.id, 'rejected', reason);
      setSlipModal(null);
      setRejectSlipReason('');
      load();
    } catch (err) {
      alert(err?.response?.data?.error || 'ปฏิเสธสลิปไม่สำเร็จ');
    } finally {
      setSlipActing(false);
    }
  };

  const acceptReturn = async (booking) => {
    setActing(true);
    try {
      await bookingAPI.return(booking.id, {
        returnImages: booking.returnImages || [],
        penaltyAmount: booking.penaltyAmount || 0,
      });
      load();
      navigate(refundPath);
    } catch {
      alert('รับคืนไม่สำเร็จ');
    } finally {
      setActing(false);
    }
  };

  const slipStatusLabel = (status) => {
    if (status === 'verified') return 'ยืนยันแล้ว';
    if (status === 'rejected') return 'ไม่ผ่าน';
    return 'รอตรวจสอบ';
  };

  const renderActions = (b) => {
    if (b.status === 'pending' || b.status === 'payment_verified') {
      return (
        <button type="button" className="btn btn-primary btn-sm" onClick={() => openSlip(b)}>
          ตรวจสลิป
        </button>
      );
    }
    if (b.status === 'preparing' || b.status === 'approved') {
      return (
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={acting}
          onClick={() => setStatus(b, 'ready_to_ship')}
        >
          พร้อมจัดส่ง
        </button>
      );
    }
    if (b.status === 'ready_to_ship' || b.status === 'ready_for_pickup') {
      return (
        <button type="button" className="btn btn-primary btn-sm" disabled={acting} onClick={() => openDispatch(b)}>
          มอบหมายจัดส่ง
        </button>
      );
    }
    if (b.status === 'out_for_delivery') {
      return (
        <button
          type="button"
          className="btn btn-success btn-sm"
          disabled={acting}
          onClick={() => setStatus(b, 'delivered')}
        >
          ส่งถึงแล้ว
        </button>
      );
    }
    if (b.status === 'delivered' || b.status === 'picked_up') {
      return <span className="ops-muted">รอลูกค้าแจ้งส่งคืน</span>;
    }
    if (b.status === 'return_submitted') {
      return (
        <>
          <button type="button" className="btn btn-primary btn-sm" disabled={acting} onClick={() => acceptReturn(b)}>
            รับเข้าคลัง
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate(refundPath)}>
            ไปคืนมัดจำ
          </button>
        </>
      );
    }
    return null;
  };

  return (
    <DashboardLayout role={layoutRole}>
      <div className="staff-ops staff-ops-desk">
        <header className="ops-hero">
          <div className="ops-hero-copy">
            <p className="ops-hero-kicker">คิวงาน</p>
            <h1>จัดส่ง–รับคืน</h1>
            <p>ตรวจสลิป · จัดเตรียมชุด · จัดส่ง · รับคืนเข้าคลัง</p>
          </div>
          <div className="ops-hero-stats">
            <div>
              <span>งานในระบบ</span>
              <strong>{loading ? '—' : totalInPipeline}</strong>
            </div>
            <div>
              <span>คิวปัจจุบัน</span>
              <strong>{loading ? '—' : list.length}</strong>
            </div>
          </div>
        </header>

        <nav className="ops-stage-nav" aria-label="ขั้นตอนจัดส่ง–รับคืน">
          {QUEUES.map((q, i) => {
            const Icon = q.icon;
            const count = counts[q.id] || 0;
            return (
              <button
                key={q.id}
                type="button"
                className={`ops-stage${activeQueue === q.id ? ' is-active' : ''}${count > 0 ? ' has-items' : ''}`}
                onClick={() => setActiveQueue(q.id)}
              >
                <span className="ops-stage-num">{String(i + 1).padStart(2, '0')}</span>
                <Icon size={16} strokeWidth={2} />
                <span className="ops-stage-title">{q.short}</span>
                <em>{count}</em>
              </button>
            );
          })}
        </nav>

        <section className="ops-board">
          <header className="ops-board-head">
            <div className="ops-board-title">
              <div className="ops-board-icon">
                <QueueIcon size={18} />
              </div>
              <div>
                <h2>{queue.title}</h2>
                <p>{queue.hint}</p>
              </div>
            </div>
            <span className="ops-board-count">{list.length} รายการ</span>
          </header>

          {loading ? (
            <div className="ops-empty">กำลังโหลดคิวงาน...</div>
          ) : list.length === 0 ? (
            <div className="ops-empty">
              <ClipboardCheck size={28} strokeWidth={1.5} />
              <h3>ไม่มีรายการในขั้นตอนนี้</h3>
              <p>เมื่อมีงานเข้าคิว จะแสดงที่นี่ให้ดำเนินการต่อ</p>
            </div>
          ) : (
            <div className="ops-card-list">
              {list.map((b) => (
                <article key={b.id} className="ops-card">
                  <div className="ops-card-main">
                    <div className="ops-card-who">
                      <div className="ops-avatar" aria-hidden>{initials(b.user?.name)}</div>
                      <div>
                        <div className="ops-card-name">
                          <strong>{b.user?.name || 'ลูกค้า'}</strong>
                          <StatusBadge status={b.status} size="sm" />
                        </div>
                        <div className="ops-card-meta">
                          <span><User size={13} /> {b.costume?.name || '—'}</span>
                          {(b.user?.phone || b.user?.email) && (
                            <span><Phone size={13} /> {b.user?.phone || b.user?.email}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="ops-card-facts">
                      <div>
                        <span>เลขจอง</span>
                        <code>{formatOrderId(b)}</code>
                      </div>
                      <div>
                        <span>ช่วงเช่า</span>
                        <strong>
                          <CalendarDays size={13} style={{ marginRight: 4, verticalAlign: -2 }} />
                          {new Date(b.startDate).toLocaleDateString('th-TH')}
                          {' – '}
                          {new Date(b.endDate).toLocaleDateString('th-TH')}
                        </strong>
                      </div>
                      <div>
                        <span>ยอดรวม</span>
                        <strong className="ops-amount">฿{(b.totalPrice || 0).toLocaleString()}</strong>
                      </div>
                    </div>

                    {(b.deliveryAddressText || b.user?.addressText) && (
                      <div className="ops-card-address">
                        <MapPin size={14} />
                        <span>{b.deliveryAddressText || b.user?.addressText}</span>
                      </div>
                    )}

                    {b.messenger?.name && (
                      <div className="ops-card-courier">
                        <Truck size={14} />
                        <span>
                          คนส่ง: <strong>{b.messenger.name}</strong>
                          {b.messenger.phone ? ` · ${b.messenger.phone}` : ''}
                          {b.messenger.eta ? ` · ${b.messenger.eta}` : ''}
                        </span>
                      </div>
                    )}

                    {b.returnNote && (
                      <div className="ops-card-note">หมายเหตุคืน: {b.returnNote}</div>
                    )}

                    {b.status === 'return_submitted' && (
                      <div className="ops-evidence">
                        <div className="ops-evidence-label">หลักฐานที่ลูกค้าแนบ</div>
                        {b.returnImages?.length > 0 ? (
                          <div className="ops-evidence-thumbs">
                            {b.returnImages.map((url, i) => (
                              <a key={`${b.id}-ret-${i}`} href={url} target="_blank" rel="noreferrer">
                                <img src={url} alt={`หลักฐานส่งคืน ${i + 1}`} />
                              </a>
                            ))}
                          </div>
                        ) : (
                          <p>ลูกค้าไม่ได้แนบรูปหลักฐาน</p>
                        )}
                        {b.returnSubmittedAt && (
                          <time>แจ้งส่งคืนเมื่อ {new Date(b.returnSubmittedAt).toLocaleString('th-TH')}</time>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="ops-card-actions">
                    {renderActions(b)}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {messengerModal && (
          <div className="modal-overlay" onClick={() => !acting && setMessengerModal(null)}>
            <div className="modal ops-modal" onClick={(e) => e.stopPropagation()}>
              <p className="ops-modal-kicker">จัดส่ง</p>
              <h3>มอบหมายคนส่ง</h3>
              <p className="ops-modal-sub">
                {messengerModal.user?.name} — {messengerModal.costume?.name}
              </p>
              <div className="form-group">
                <label htmlFor="courier-name">ชื่อพนักงานจัดส่ง *</label>
                <input
                  id="courier-name"
                  className="form-input"
                  value={messengerForm.name}
                  onChange={(e) => setMessengerForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="ชื่อคนส่ง"
                />
              </div>
              <div className="form-group">
                <label htmlFor="courier-phone">เบอร์โทร</label>
                <input
                  id="courier-phone"
                  className="form-input"
                  value={messengerForm.phone}
                  onChange={(e) => setMessengerForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="08x-xxx-xxxx"
                />
              </div>
              <div className="form-group">
                <label htmlFor="courier-eta">ช่วงเวลาส่ง (วันนี้) *</label>
                <select
                  id="courier-eta"
                  className="form-input"
                  value={messengerForm.eta}
                  onChange={(e) => setMessengerForm((p) => ({ ...p, eta: e.target.value }))}
                >
                  <option value="">เลือกช่วงเวลา</option>
                  {DELIVERY_TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                  {messengerForm.eta && !DELIVERY_TIME_SLOTS.includes(messengerForm.eta) && (
                    <option value={messengerForm.eta}>{messengerForm.eta}</option>
                  )}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="courier-note">หมายเหตุ</label>
                <input
                  id="courier-note"
                  className="form-input"
                  value={messengerForm.note}
                  onChange={(e) => setMessengerForm((p) => ({ ...p, note: e.target.value }))}
                  placeholder="จุดนัด / รายละเอียดเพิ่ม"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" disabled={acting} onClick={() => setMessengerModal(null)}>
                  ยกเลิก
                </button>
                <button type="button" className="btn btn-primary" disabled={acting} onClick={confirmDispatch}>
                  {acting ? 'กำลังบันทึก...' : 'ยืนยันออกส่ง'}
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
                  ) : (
                    <div className="alert alert-error">ไม่มีรูปสลิป</div>
                  )}
                  {slipModal.payment?.slipImage
                    && !slipModal.archived
                    && slipModal.booking?.status === 'pending'
                    && slipModal.payment?.status === 'pending' && (
                    <div className="form-group" style={{ marginTop: '1rem', marginBottom: 0 }}>
                      <label htmlFor="reject-slip-reason">เหตุผลปฏิเสธสลิป (ถ้าจะปฏิเสธ)</label>
                      <textarea
                        id="reject-slip-reason"
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
                {slipModal.payment?.slipImage
                  && !slipModal.archived
                  && slipModal.booking?.status === 'pending'
                  && slipModal.payment?.status === 'pending' && (
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
