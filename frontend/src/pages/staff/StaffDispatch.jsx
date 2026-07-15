import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingAPI } from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import './staff.css';

const QUEUES = [
  {
    id: 'ready',
    title: 'พร้อมส่งแมสฯ',
    hint: 'เตรียมครบแล้ว รอจัดแมสฯ ส่งวันนี้',
    statuses: ['ready_to_ship', 'ready_for_pickup'],
  },
  {
    id: 'shipping',
    title: 'แมสฯ กำลังนำส่ง',
    hint: 'ออกส่งแล้ว รอส่งถึงลูกค้า',
    statuses: ['out_for_delivery'],
  },
  {
    id: 'with_customer',
    title: 'ส่งถึงแล้ว — รอลูกค้าส่งคืน',
    hint: 'ลูกค้าใช้งานอยู่ / รอส่งคืนเอง',
    statuses: ['delivered', 'picked_up'],
  },
  {
    id: 'inbound',
    title: 'ลูกค้าส่งคืนแล้ว — รอรับเข้าคลัง',
    hint: 'ของกำลังมา / ถึงแล้วให้กดรับคืน',
    statuses: ['return_submitted'],
  },
];

const emptyMessenger = () => ({ name: '', phone: '', eta: '', note: '' });

export default function StaffDispatch() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeQueue, setActiveQueue] = useState('ready');
  const [messengerModal, setMessengerModal] = useState(null);
  const [messengerForm, setMessengerForm] = useState(emptyMessenger());
  const [acting, setActing] = useState(false);

  const load = () => {
    setLoading(true);
    bookingAPI.getAll()
      .then((r) => setBookings(r.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const counts = QUEUES.reduce((acc, q) => {
    acc[q.id] = bookings.filter((b) => q.statuses.includes(b.status)).length;
    return acc;
  }, {});

  const queue = QUEUES.find((q) => q.id === activeQueue) || QUEUES[0];
  const list = bookings.filter((b) => queue.statuses.includes(b.status));

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
      alert('กรุณาระบุชื่อแมสเซนเจอร์');
      return;
    }
    await setStatus(messengerModal, 'out_for_delivery', {
      messenger: {
        ...messengerForm,
        dispatchedAt: new Date().toISOString(),
      },
    });
  };

  const acceptReturn = async (booking) => {
    setActing(true);
    try {
      await bookingAPI.return(booking.id, {
        returnImages: booking.returnImages || [],
        penaltyAmount: booking.penaltyAmount || 0,
      });
      load();
      navigate('/staff/refund');
    } catch {
      alert('รับคืนไม่สำเร็จ');
    } finally {
      setActing(false);
    }
  };

  return (
    <DashboardLayout role="staff">
      <div className="staff-ops">
        <div className="staff-page-head">
          <div>
            <h1 className="page-title">คิวส่งแมสฯ / รับคืน</h1>
            <p className="page-subtitle">ส่งด่วนภายในวันเดียว · ลูกค้าส่งคืนเอง แล้วรออัปเดตสถานะ</p>
          </div>
        </div>

        <div className="staff-queue-tabs">
          {QUEUES.map((q) => (
            <button
              key={q.id}
              type="button"
              className={`staff-queue-tab${activeQueue === q.id ? ' is-active' : ''}`}
              onClick={() => setActiveQueue(q.id)}
            >
              <strong>{q.title}</strong>
              <span>{counts[q.id] || 0}</span>
            </button>
          ))}
        </div>

        <div className="staff-panel">
          <div className="staff-panel-head">
            <h3>{queue.title}</h3>
            <span className="staff-panel-count">{list.length} รายการ</span>
          </div>
          <p style={{ margin: 0, padding: '0.75rem 1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--staff-line)' }}>
            {queue.hint}
          </p>

          {loading ? (
            <div className="staff-empty">กำลังโหลด...</div>
          ) : list.length === 0 ? (
            <div className="staff-empty">ไม่มีรายการในคิวนี้</div>
          ) : (
            <div className="staff-booking-list">
              {list.map((b) => (
                <div key={b.id} className="staff-booking-row">
                  <div className="staff-booking-main">
                    <div className="staff-booking-title">
                      <strong>{b.user?.name || '-'}</strong>
                      <StatusBadge status={b.status} size="sm" />
                    </div>
                    <div className="staff-booking-meta">
                      <span>{b.costume?.name}</span>
                      <span>{b.user?.phone || b.user?.email}</span>
                    </div>
                    <div className="staff-booking-meta" style={{ marginTop: 4 }}>
                      <span className="staff-code">{b.id}</span>
                      {b.messenger?.name && (
                        <span>แมสฯ {b.messenger.name}{b.messenger.phone ? ` (${b.messenger.phone})` : ''}</span>
                      )}
                      {b.messenger?.eta && <span>ช่วงเวลา {b.messenger.eta}</span>}
                    </div>
                    {(b.deliveryAddressText || b.user?.addressText) && (
                      <div className="staff-booking-meta" style={{ marginTop: 4 }}>
                        <span>ส่งที่: {b.deliveryAddressText || b.user?.addressText}</span>
                      </div>
                    )}
                    {!b.deliveryAddressText && !b.user?.addressText && (
                      <div className="staff-booking-meta" style={{ marginTop: 4, color: '#E17055' }}>
                        <span>ยังไม่มีที่อยู่จัดส่ง — ให้ลูกค้ากรอกในโปรไฟล์</span>
                      </div>
                    )}
                    {b.returnNote && (
                      <div className="staff-booking-meta" style={{ marginTop: 4 }}>
                        <span>หมายเหตุคืน: {b.returnNote}</span>
                      </div>
                    )}
                  </div>
                  <div className="staff-booking-side">
                    <span className="amount">฿{(b.totalPrice || 0).toLocaleString()}</span>
                    {new Date(b.startDate).toLocaleDateString('th-TH')}
                    {' – '}
                    {new Date(b.endDate).toLocaleDateString('th-TH')}
                  </div>
                  <div className="staff-actions">
                    {(b.status === 'ready_to_ship' || b.status === 'ready_for_pickup') && (
                      <button type="button" className="btn btn-primary btn-sm" disabled={acting} onClick={() => openDispatch(b)}>
                        จัดแมสฯ ออกส่ง
                      </button>
                    )}
                    {b.status === 'out_for_delivery' && (
                      <button
                        type="button"
                        className="btn btn-success btn-sm"
                        disabled={acting}
                        onClick={() => setStatus(b, 'delivered')}
                      >
                        ส่งถึงแล้ว
                      </button>
                    )}
                    {(b.status === 'delivered' || b.status === 'picked_up') && (
                      <span className="staff-muted-action">รอลูกค้าส่งคืนเอง</span>
                    )}
                    {b.status === 'return_submitted' && (
                      <>
                        <button type="button" className="btn btn-primary btn-sm" disabled={acting} onClick={() => acceptReturn(b)}>
                          รับคืนเข้าคลัง
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/staff/refund')}>
                          ไปคืนมัดจำ
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {messengerModal && (
          <div className="modal-overlay" onClick={() => !acting && setMessengerModal(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
              <h3>จัดแมสเซนเจอร์ออกส่ง</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                {messengerModal.user?.name} — {messengerModal.costume?.name}
              </p>
              <div className="form-group">
                <label>ชื่อแมสฯ *</label>
                <input
                  className="form-input"
                  value={messengerForm.name}
                  onChange={(e) => setMessengerForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="ชื่อคนส่ง"
                />
              </div>
              <div className="form-group">
                <label>เบอร์โทรแมสฯ</label>
                <input
                  className="form-input"
                  value={messengerForm.phone}
                  onChange={(e) => setMessengerForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="08x-xxx-xxxx"
                />
              </div>
              <div className="form-group">
                <label>ช่วงเวลาส่ง (วันนี้)</label>
                <input
                  className="form-input"
                  value={messengerForm.eta}
                  onChange={(e) => setMessengerForm((p) => ({ ...p, eta: e.target.value }))}
                  placeholder="เช่น 13:00–15:00"
                />
              </div>
              <div className="form-group">
                <label>หมายเหตุ</label>
                <input
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
      </div>
    </DashboardLayout>
  );
}
