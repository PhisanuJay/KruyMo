import { useState, useEffect } from 'react';
import { bookingAPI } from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import './staff.css';

const DEDUCT_PRESETS = [
  { label: 'ไม่หัก', amount: 0 },
  { label: 'รอยเปื้อน', amount: 200 },
  { label: 'เสียหายเล็กน้อย', amount: 500 },
  { label: 'เสียหายปานกลาง', amount: 800 },
  { label: 'เสียหายหนัก', amount: 1500 },
];

export default function DepositRefund() {
  const [bookings, setBookings] = useState([]);
  const [penalties, setPenalties] = useState({});
  const [reasons, setReasons] = useState({});
  const [actingId, setActingId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingAPI.getAll({ status: 'returned' })
      .then((r) => {
        setBookings(r.data);
        const initial = {};
        r.data.forEach((b) => {
          initial[b.id] = Number(b.penaltyAmount || 0);
        });
        setPenalties(initial);
      })
      .finally(() => setLoading(false));
  }, []);

  const setPenalty = (id, value) => {
    if (value === '' || value === null || value === undefined) {
      setPenalties((prev) => ({ ...prev, [id]: '' }));
      return;
    }
    const n = Number(value);
    if (Number.isNaN(n) || n < 0) return;
    setPenalties((prev) => ({ ...prev, [id]: n }));
  };

  const penaltyOf = (b) => {
    const raw = penalties[b.id];
    if (raw === '' || raw === null || raw === undefined) return 0;
    const deposit = Number(b.deposit || 0);
    return Math.min(deposit, Math.max(0, Number(raw) || 0));
  };

  const handleRefund = async (b) => {
    const penalty = penaltyOf(b);
    const deposit = Number(b.deposit || 0);
    const refund = Math.max(0, deposit - penalty);
    const reason = (reasons[b.id] || '').trim();

    if (penalty > deposit) {
      alert('ยอดหักต้องไม่เกินมัดจำ');
      return;
    }

    const confirmMsg = penalty > 0
      ? `หัก ฿${penalty.toLocaleString()} แล้วคืนมัดจำ ฿${refund.toLocaleString()}?\n${reason ? `เหตุผล: ${reason}` : ''}`
      : `คืนมัดจำเต็มจำนวน ฿${refund.toLocaleString()}?`;

    if (!confirm(confirmMsg.trim())) return;

    setActingId(b.id);
    try {
      await bookingAPI.return(b.id, {
        returnImages: b.returnImages || [],
        penaltyAmount: penalty,
        penaltyReason: reason || undefined,
      });
      await bookingAPI.refund(b.id, {
        penaltyAmount: penalty,
        penaltyReason: reason || undefined,
      });
      setBookings((prev) => prev.filter((x) => x.id !== b.id));
    } catch {
      alert('คืนมัดจำไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setActingId(null);
    }
  };

  return (
    <DashboardLayout role="staff">
      <div className="staff-ops">
        <div className="staff-page-head">
          <div>
            <h1 className="page-title">คืนเงินมัดจำ</h1>
            <p className="page-subtitle">
              กำหนดยอดหักกรณีชุดเสียหาย/เปื้อน แล้วยืนยันคืนมัดจำ
            </p>
          </div>
          {!loading && (
            <div className="staff-head-meta">{bookings.length} รายการรอคืน</div>
          )}
        </div>

        {loading ? (
          <div className="staff-empty">กำลังโหลด...</div>
        ) : bookings.length === 0 ? (
          <div className="staff-panel">
            <div className="staff-empty">ไม่มีรายการรอคืนเงินมัดจำ</div>
          </div>
        ) : (
          <div className="staff-refund-grid">
            {bookings.map((b) => {
              const deposit = Number(b.deposit || 0);
              const penalty = penaltyOf(b);
              const refund = Math.max(0, deposit - penalty);
              const busy = actingId === b.id;
              const inputValue = penalties[b.id] === undefined ? 0 : penalties[b.id];

              return (
                <article key={b.id} className="staff-refund-card">
                  <header className="staff-refund-card-top">
                    <div className="staff-refund-who">
                      <h3>{b.user?.name || 'ลูกค้า'}</h3>
                      <p>{b.user?.phone || b.user?.email || 'ไม่มีเบอร์ติดต่อ'}</p>
                    </div>
                    <StatusBadge status={b.status} size="sm" />
                  </header>

                  <div className="staff-refund-body">
                    <div className="staff-costume-box">
                      <div className="label">ชุดที่เช่า</div>
                      <div className="name">{b.costume?.name || '-'}</div>
                      <div className="staff-id-chips">
                        <div className="staff-id-chip">
                          <span>เลขจอง</span>
                          <code>{b.id}</code>
                        </div>
                        <div className="staff-id-chip">
                          <span>รหัสชุด</span>
                          <code>{b.costumeId || b.costume?.id || '-'}</code>
                        </div>
                      </div>
                    </div>

                    {b.returnImages?.length > 0 && (
                      <div>
                        <div className="staff-section-label">รูปสภาพชุดตอนคืน</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {b.returnImages.map((url, i) => (
                            <a key={`${b.id}-img-${i}`} href={url} target="_blank" rel="noreferrer" className="staff-thumb">
                              <img src={url} alt={`สภาพชุด ${i + 1}`} />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="staff-deduct-block">
                      <div className="staff-section-label">หักค่าเสียหาย / ค่าปรับ</div>
                      <div className="form-group">
                        <label htmlFor={`penalty-${b.id}`}>จำนวนเงินที่หัก (บาท)</label>
                        <input
                          id={`penalty-${b.id}`}
                          className="form-input"
                          type="number"
                          min={0}
                          max={deposit}
                          step={1}
                          inputMode="numeric"
                          value={inputValue}
                          onChange={(e) => setPenalty(b.id, e.target.value)}
                          onFocus={(e) => e.target.select()}
                          disabled={busy}
                        />
                        <div className="staff-preset-row">
                          {DEDUCT_PRESETS.map((p) => (
                            <button
                              key={p.label}
                              type="button"
                              className={`staff-preset-btn${Number(penalties[b.id] ?? 0) === p.amount ? ' is-active' : ''}`}
                              disabled={busy || p.amount > deposit}
                              onClick={() => setPenalty(b.id, Math.min(p.amount, deposit))}
                            >
                              {p.label}
                              {p.amount > 0 ? ` ฿${p.amount}` : ''}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="form-group" style={{ marginTop: '0.75rem' }}>
                        <label htmlFor={`reason-${b.id}`}>เหตุผลที่หัก</label>
                        <input
                          id={`reason-${b.id}`}
                          className="form-input"
                          placeholder="เช่น ชุดมีรอยขาด / เปื้อนสี"
                          value={reasons[b.id] || ''}
                          onChange={(e) => setReasons((prev) => ({ ...prev, [b.id]: e.target.value }))}
                          disabled={busy}
                        />
                      </div>
                    </div>

                    <div className="staff-settle">
                      <div className="staff-settle-row">
                        <span>มัดจำที่รับไว้</span>
                        <strong>฿{deposit.toLocaleString()}</strong>
                      </div>
                      <div className="staff-settle-row is-deduct">
                        <span>หักค่าเสียหาย</span>
                        <strong>−฿{penalty.toLocaleString()}</strong>
                      </div>
                      <div className="staff-settle-row is-refund">
                        <span>ยอดคืนสุทธิ</span>
                        <strong>฿{refund.toLocaleString()}</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-success"
                      disabled={busy}
                      onClick={() => handleRefund(b)}
                    >
                      {busy
                        ? 'กำลังดำเนินการ...'
                        : penalty > 0
                          ? `ยืนยันหักแล้วคืน ฿${refund.toLocaleString()}`
                          : `ยืนยันคืนมัดจำ ฿${refund.toLocaleString()}`}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
