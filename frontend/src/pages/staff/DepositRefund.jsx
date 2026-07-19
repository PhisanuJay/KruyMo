import { useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Wallet, Clock, CheckCircle2, Banknote, Building2, Smartphone,
  Image as ImageIcon, ArrowRight, AlertTriangle,
} from 'lucide-react';
import { bookingAPI, uploadAPI } from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import UploadBox from '../../components/UploadBox';
import './staff.css';

const DEDUCT_PRESETS = [
  { label: 'ไม่หัก', amount: 0 },
  { label: 'รอยเปื้อน', amount: 200 },
  { label: 'เสียหายเล็กน้อย', amount: 500 },
  { label: 'เสียหายปานกลาง', amount: 800 },
  { label: 'เสียหายหนัก', amount: 1500 },
];

const REFUND_QUEUE_STATUSES = ['return_submitted', 'returned'];

function refundNet(b) {
  if (b.refundAmount != null) return Number(b.refundAmount);
  return Math.max(0, Number(b.deposit || 0) - Number(b.penaltyAmount || 0));
}

function formatWhen(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function shortId(id = '') {
  return id.replace(/-/g, '').slice(0, 8).toUpperCase();
}

function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function AccountBlock({ account, emptyHint }) {
  if (!account) {
    return (
      <div className="refund-account is-missing">
        <AlertTriangle size={16} />
        <span>{emptyHint}</span>
      </div>
    );
  }
  const isBank = account.method === 'bank';
  return (
    <div className="refund-account">
      <div className="refund-account-method">
        {isBank ? <Building2 size={15} /> : <Smartphone size={15} />}
        <span>{isBank ? 'บัญชีธนาคาร' : 'พร้อมเพย์'}</span>
      </div>
      <div className="refund-account-grid">
        {isBank ? (
          <>
            <div>
              <span>ธนาคาร</span>
              <strong>{account.bankName || '—'}</strong>
            </div>
            <div>
              <span>เลขบัญชี</span>
              <strong className="is-mono">{account.accountNumber || '—'}</strong>
            </div>
          </>
        ) : (
          <div>
            <span>พร้อมเพย์</span>
            <strong className="is-mono">{account.promptpay || '—'}</strong>
          </div>
        )}
        <div>
          <span>ชื่อบัญชี</span>
          <strong>{account.accountName || '—'}</strong>
        </div>
      </div>
    </div>
  );
}

export default function DepositRefund() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'done' ? 'done' : 'pending';
  const [pending, setPending] = useState([]);
  const [done, setDone] = useState([]);
  const [penalties, setPenalties] = useState({});
  const [reasons, setReasons] = useState({});
  const [refundSlips, setRefundSlips] = useState({});
  const [actingId, setActingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const setTab = (next) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'pending') params.delete('tab');
    else params.set('tab', next);
    setSearchParams(params, { replace: true });
  };

  const load = () => {
    setLoading(true);
    bookingAPI.getAll()
      .then((r) => {
        const all = r.data || [];
        const waitList = all.filter((b) => REFUND_QUEUE_STATUSES.includes(b.status));
        waitList.sort((a, b) => {
          const rank = (s) => (s === 'returned' ? 0 : 1);
          const dr = rank(a.status) - rank(b.status);
          if (dr !== 0) return dr;
          return new Date(b.returnSubmittedAt || b.returnedAt || b.updatedAt || 0)
            - new Date(a.returnSubmittedAt || a.returnedAt || a.updatedAt || 0);
        });
        const doneList = all
          .filter((b) => b.status === 'deposit_refunded')
          .sort((a, b) => new Date(b.refundedAt || b.updatedAt || 0) - new Date(a.refundedAt || a.updatedAt || 0));

        setPending(waitList);
        setDone(doneList);
        const initial = {};
        waitList.forEach((b) => {
          initial[b.id] = Number(b.penaltyAmount || 0);
        });
        setPenalties(initial);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const summary = useMemo(() => {
    const pendingTotal = pending.reduce((s, b) => s + refundNet(b), 0);
    const thisMonth = new Date().toISOString().slice(0, 7);
    const doneMonth = done.filter((b) => (b.refundedAt || '').startsWith(thisMonth));
    const doneMonthTotal = doneMonth.reduce((s, b) => s + refundNet(b), 0);
    return {
      pendingCount: pending.length,
      pendingTotal,
      doneCount: done.length,
      doneMonthCount: doneMonth.length,
      doneMonthTotal,
    };
  }, [pending, done]);

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

  const handleSlipUpload = async (bookingId, file) => {
    const { data } = await uploadAPI.single(file);
    setRefundSlips((prev) => ({ ...prev, [bookingId]: data.url }));
    return data.url;
  };

  const handleRefund = async (b) => {
    const penalty = penaltyOf(b);
    const deposit = Number(b.deposit || 0);
    const refund = Math.max(0, deposit - penalty);
    const reason = (reasons[b.id] || '').trim();
    const slip = refundSlips[b.id];

    if (!slip) {
      alert('กรุณาแนบสลิปการโอนคืนมัดจำก่อนยืนยัน');
      return;
    }
    if (penalty > deposit) {
      alert('ยอดหักต้องไม่เกินมัดจำ');
      return;
    }
    if (!b.refundAccount) {
      alert('ลูกค้ายังไม่มีบัญชีรับเงินคืน — ติดต่อลูกค้าก่อนโอน');
      return;
    }

    const confirmMsg = penalty > 0
      ? `หัก ฿${penalty.toLocaleString()} แล้วคืนมัดจำ ฿${refund.toLocaleString()}?\n${reason ? `เหตุผล: ${reason}` : ''}`
      : `คืนมัดจำเต็มจำนวน ฿${refund.toLocaleString()}?`;
    if (!confirm(confirmMsg.trim())) return;

    setActingId(b.id);
    try {
      if (b.status === 'return_submitted') {
        await bookingAPI.return(b.id, {
          returnImages: b.returnImages || [],
          penaltyAmount: penalty,
          penaltyReason: reason || undefined,
        });
      }
      const { data: updated } = await bookingAPI.refund(b.id, {
        penaltyAmount: penalty,
        penaltyReason: reason || undefined,
        refundSlipImage: slip,
      });
      setPending((prev) => prev.filter((x) => x.id !== b.id));
      setDone((prev) => [updated, ...prev.filter((x) => x.id !== b.id)]);
      setRefundSlips((prev) => {
        const next = { ...prev };
        delete next[b.id];
        return next;
      });
      setTab('done');
    } catch (e) {
      alert(e.response?.data?.error || 'คืนมัดจำไม่สำเร็จ กรุณาลองใหม่');
      load();
    } finally {
      setActingId(null);
    }
  };

  return (
    <DashboardLayout role="staff">
      <div className="staff-ops staff-refund-desk">
        <header className="refund-hero">
          <div className="refund-hero-copy">
            <p className="refund-hero-kicker">Finance desk</p>
            <h1>คืนเงินมัดจำ</h1>
            <p>
              ตรวจสภาพชุด กำหนดยอดหัก โอนคืนตามบัญชีลูกค้า แล้วแนบสลิปยืนยันก่อนปิดงาน
            </p>
          </div>
          <div className="refund-hero-aside">
            <Wallet size={22} strokeWidth={1.75} />
            <span>Settlement</span>
          </div>
        </header>

        <section className="refund-kpi-row" aria-label="สรุปคิวคืนมัดจำ">
          <article className="refund-kpi is-pending">
            <div className="refund-kpi-icon"><Clock size={18} /></div>
            <div>
              <span>รอคืน</span>
              <strong>{loading ? '—' : summary.pendingCount}</strong>
              <small>รวม ฿{(summary.pendingTotal || 0).toLocaleString()}</small>
            </div>
          </article>
          <article className="refund-kpi is-month">
            <div className="refund-kpi-icon"><Banknote size={18} /></div>
            <div>
              <span>คืนแล้วเดือนนี้</span>
              <strong>{loading ? '—' : summary.doneMonthCount}</strong>
              <small>รวม ฿{(summary.doneMonthTotal || 0).toLocaleString()}</small>
            </div>
          </article>
          <article className="refund-kpi is-done">
            <div className="refund-kpi-icon"><CheckCircle2 size={18} /></div>
            <div>
              <span>ปิดงานทั้งหมด</span>
              <strong>{loading ? '—' : summary.doneCount}</strong>
              <small>รายการในประวัติ</small>
            </div>
          </article>
        </section>

        <div className="refund-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'pending'}
            className={tab === 'pending' ? 'is-active' : ''}
            onClick={() => setTab('pending')}
          >
            คิวรอคืน
            <em>{pending.length}</em>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'done'}
            className={tab === 'done' ? 'is-active' : ''}
            onClick={() => setTab('done')}
          >
            ประวัติคืนแล้ว
            <em>{done.length}</em>
          </button>
        </div>

        {loading ? (
          <div className="refund-empty">กำลังโหลดคิวคืนมัดจำ...</div>
        ) : tab === 'pending' && pending.length === 0 ? (
          <div className="refund-empty">
            <CheckCircle2 size={28} strokeWidth={1.5} />
            <h3>ไม่มีรายการรอคืน</h3>
            <p>
              คิวจะขึ้นเมื่อลูกค้าแจ้งส่งคืนแล้ว หรือเมื่อรับเข้าคลังจาก
              {' '}
              <Link to="/staff/dispatch?queue=inbound">จัดส่งและรับคืน · รอรับคืน</Link>
            </p>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTab('done')}>
              ดูประวัติคืนแล้ว
              <ArrowRight size={14} />
            </button>
          </div>
        ) : tab === 'done' && done.length === 0 ? (
          <div className="refund-empty">
            <Wallet size={28} strokeWidth={1.5} />
            <h3>ยังไม่มีประวัติคืนมัดจำ</h3>
            <p>เมื่อยืนยันโอนคืนสำเร็จ รายการจะถูกเก็บไว้ที่นี่สำหรับตรวจย้อนหลัง</p>
          </div>
        ) : tab === 'done' ? (
          <div className="refund-ledger">
            <div className="refund-ledger-head">
              <span>ลูกค้า / คำสั่ง</span>
              <span>ยอดคืน</span>
              <span>บัญชีปลายทาง</span>
              <span>สลิป</span>
              <span>วันเวลา</span>
            </div>
            {done.map((b) => {
              const refund = refundNet(b);
              const penalty = Number(b.penaltyAmount || 0);
              return (
                <article key={b.id} className="refund-ledger-row">
                  <div className="refund-ledger-who">
                    <div className="refund-avatar" aria-hidden>{initials(b.user?.name)}</div>
                    <div>
                      <strong>{b.user?.name || 'ลูกค้า'}</strong>
                      <p>
                        {b.costume?.name || '—'}
                        {' · '}
                        <code>#{shortId(b.id)}</code>
                      </p>
                      {penalty > 0 && (
                        <small className="is-deduct">
                          หัก ฿{penalty.toLocaleString()}
                          {b.penaltyReason ? ` — ${b.penaltyReason}` : ''}
                        </small>
                      )}
                    </div>
                  </div>
                  <div className="refund-ledger-amount">
                    <strong>฿{refund.toLocaleString()}</strong>
                    <span>จากมัดจำ ฿{(b.deposit || 0).toLocaleString()}</span>
                  </div>
                  <div className="refund-ledger-account">
                    {b.refundAccount ? (
                      b.refundAccount.method === 'bank' ? (
                        <>
                          <strong>{b.refundAccount.bankName}</strong>
                          <span>{b.refundAccount.accountNumber}</span>
                          <span>{b.refundAccount.accountName}</span>
                        </>
                      ) : (
                        <>
                          <strong>พร้อมเพย์</strong>
                          <span>{b.refundAccount.promptpay}</span>
                          <span>{b.refundAccount.accountName}</span>
                        </>
                      )
                    ) : (
                      <span className="is-muted">ไม่ระบุ</span>
                    )}
                  </div>
                  <div className="refund-ledger-slip">
                    {b.refundSlipImage ? (
                      <a href={b.refundSlipImage} target="_blank" rel="noreferrer" className="refund-slip-thumb">
                        <img src={b.refundSlipImage} alt="สลิปโอนคืน" />
                      </a>
                    ) : (
                      <span className="is-muted">ไม่มีสลิป</span>
                    )}
                  </div>
                  <div className="refund-ledger-when">
                    <StatusBadge status={b.status} size="sm" />
                    <time>{formatWhen(b.refundedAt)}</time>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="refund-ticket-list">
            {pending.map((b, index) => {
              const deposit = Number(b.deposit || 0);
              const penalty = penaltyOf(b);
              const refund = Math.max(0, deposit - penalty);
              const busy = actingId === b.id;
              const inputValue = penalties[b.id] === undefined ? 0 : penalties[b.id];
              const slip = refundSlips[b.id] || '';
              const canConfirm = Boolean(slip && b.refundAccount && !busy);

              return (
                <article key={b.id} className="refund-ticket">
                  <aside className="refund-ticket-rail">
                    <span className="refund-ticket-index">{String(index + 1).padStart(2, '0')}</span>
                    <div className="refund-avatar lg" aria-hidden>{initials(b.user?.name)}</div>
                    <div className="refund-ticket-who">
                      <h2>{b.user?.name || 'ลูกค้า'}</h2>
                      <p>{b.user?.phone || b.user?.email || 'ไม่มีเบอร์ติดต่อ'}</p>
                      <StatusBadge status={b.status} size="sm" />
                    </div>
                    <div className="refund-ticket-meta">
                      <div>
                        <span>ชุดครุย</span>
                        <strong>{b.costume?.name || '—'}</strong>
                      </div>
                      <div>
                        <span>เลขจอง</span>
                        <code>#{shortId(b.id)}</code>
                      </div>
                      <div>
                        <span>มัดจำเดิม</span>
                        <strong>฿{deposit.toLocaleString()}</strong>
                      </div>
                    </div>
                    {(b.returnImages?.length > 0 || b.returnNote) && (
                      <div className="refund-evidence">
                        <div className="refund-step-label">
                          <ImageIcon size={14} />
                          หลักฐานส่งคืน
                        </div>
                        {b.returnImages?.length > 0 && (
                          <div className="refund-evidence-thumbs">
                            {b.returnImages.map((url, i) => (
                              <a key={`${b.id}-img-${i}`} href={url} target="_blank" rel="noreferrer">
                                <img src={url} alt={`สภาพชุด ${i + 1}`} />
                              </a>
                            ))}
                          </div>
                        )}
                        {b.returnNote && <p className="refund-note">{b.returnNote}</p>}
                      </div>
                    )}
                  </aside>

                  <div className="refund-ticket-main">
                    {b.status === 'return_submitted' && (
                      <div className="refund-banner">
                        ลูกค้าแจ้งส่งคืนแล้ว — ยืนยันด้านล่างจะรับเข้าคลังและคืนมัดจำในครั้งเดียว
                      </div>
                    )}

                    <section className="refund-step">
                      <header>
                        <em>01</em>
                        <div>
                          <h3>บัญชีรับเงินคืน</h3>
                          <p>ตรวจชื่อบัญชีให้ตรงก่อนโอน</p>
                        </div>
                      </header>
                      <AccountBlock
                        account={b.refundAccount}
                        emptyHint={`ยังไม่มีบัญชีรับเงินคืน — ติดต่อ ${b.user?.phone || b.user?.email || 'ลูกค้า'}`}
                      />
                    </section>

                    <section className="refund-step">
                      <header>
                        <em>02</em>
                        <div>
                          <h3>หักค่าเสียหาย / ค่าปรับ</h3>
                          <p>เลือกยอดสำเร็จรูปหรือกรอกเอง</p>
                        </div>
                      </header>
                      <div className="refund-deduct">
                        <div className="refund-deduct-input">
                          <label htmlFor={`penalty-${b.id}`}>ยอดที่หัก (บาท)</label>
                          <div className="refund-money-field">
                            <span>฿</span>
                            <input
                              id={`penalty-${b.id}`}
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
                          </div>
                        </div>
                        <div className="refund-presets">
                          {DEDUCT_PRESETS.map((p) => (
                            <button
                              key={p.label}
                              type="button"
                              className={Number(penalties[b.id] ?? 0) === p.amount ? 'is-active' : ''}
                              disabled={busy || p.amount > deposit}
                              onClick={() => setPenalty(b.id, Math.min(p.amount, deposit))}
                            >
                              {p.label}
                              {p.amount > 0 ? ` · ฿${p.amount}` : ''}
                            </button>
                          ))}
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label htmlFor={`reason-${b.id}`}>เหตุผลที่หัก (ถ้ามี)</label>
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
                    </section>

                    <section className="refund-step">
                      <header>
                        <em>03</em>
                        <div>
                          <h3>สรุปยอดและแนบสลิปโอน</h3>
                          <p>โอนยอดสุทธิแล้วอัปโหลดหลักฐาน</p>
                        </div>
                      </header>

                      <div className="refund-summary-card">
                        <div className="refund-summary-lines">
                          <div>
                            <span>มัดจำที่รับไว้</span>
                            <strong>฿{deposit.toLocaleString()}</strong>
                          </div>
                          <div className="is-deduct">
                            <span>หักค่าเสียหาย</span>
                            <strong>−฿{penalty.toLocaleString()}</strong>
                          </div>
                        </div>
                        <div className="refund-summary-net">
                          <span>ยอดคืนสุทธิ</span>
                          <strong>฿{refund.toLocaleString()}</strong>
                        </div>
                      </div>

                      <UploadBox
                        label="อัปโหลดสลิปโอนคืนมัดจำ"
                        preview={slip || null}
                        onUpload={(file) => handleSlipUpload(b.id, file)}
                        onRemove={() => setRefundSlips((prev) => ({ ...prev, [b.id]: '' }))}
                      />
                    </section>

                    <footer className="refund-ticket-actions">
                      <div className="refund-ready">
                        {canConfirm ? (
                          <span className="is-ok">พร้อมยืนยันการโอนคืน</span>
                        ) : (
                          <span>
                            {!b.refundAccount
                              ? 'รอบัญชีรับเงินคืน'
                              : !slip
                                ? 'แนบสลิปโอนคืนก่อนยืนยัน'
                                : 'กำลังบันทึก...'}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn btn-success refund-confirm-btn"
                        disabled={!canConfirm}
                        onClick={() => handleRefund(b)}
                      >
                        {busy
                          ? 'กำลังดำเนินการ...'
                          : penalty > 0
                            ? `ยืนยันหักแล้วคืน ฿${refund.toLocaleString()}`
                            : `ยืนยันคืนมัดจำ ฿${refund.toLocaleString()}`}
                      </button>
                    </footer>
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
