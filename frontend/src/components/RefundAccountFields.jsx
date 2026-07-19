import { normalizeRefundAccount, validateRefundAccount } from '../utils/refundAccount';

export { normalizeRefundAccount, validateRefundAccount };

const emptyRefundAccount = () => ({
  method: 'promptpay',
  promptpay: '',
  bankName: '',
  accountNumber: '',
  accountName: '',
});

export function refundAccountFromUser(user) {
  const saved = user?.refundAccount && typeof user.refundAccount === 'object'
    ? user.refundAccount
    : null;
  return {
    method: saved?.method === 'bank' ? 'bank' : 'promptpay',
    promptpay: (saved?.promptpay || user?.phone || '').trim(),
    bankName: (saved?.bankName || '').trim(),
    accountNumber: (saved?.accountNumber || '').trim(),
    accountName: (saved?.accountName || user?.name || '').trim(),
  };
}

export default function RefundAccountFields({
  value,
  onChange,
  compact = false,
  title = 'บัญชีรับเงินคืนมัดจำ',
  hint = 'เลือกพร้อมเพย์หรือบัญชีธนาคารสำหรับรับเงินมัดจำคืน',
}) {
  const account = value || emptyRefundAccount();
  const set = (patch) => onChange({ ...account, ...patch });

  return (
    <div style={{ marginBottom: compact ? 0 : '1rem' }}>
      {!compact && (
        <>
          <h3 style={{ fontWeight: 700, marginBottom: '0.35rem' }}>{title}</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            {hint}
          </p>
        </>
      )}
      {compact && hint && (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          {hint}
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: '0.85rem', flexWrap: 'wrap' }}>
        {[
          { v: 'promptpay', l: 'พร้อมเพย์' },
          { v: 'bank', l: 'บัญชีธนาคาร' },
        ].map((opt) => (
          <button
            key={opt.v}
            type="button"
            className={`btn btn-sm ${account.method === opt.v ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => set({ method: opt.v })}
          >
            {opt.l}
          </button>
        ))}
      </div>

      {account.method === 'promptpay' ? (
        <div className="form-group">
          <label>เบอร์พร้อมเพย์ *</label>
          <input
            className="form-input"
            value={account.promptpay}
            onChange={(e) => set({ promptpay: e.target.value })}
            placeholder="08x-xxx-xxxx"
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label>ธนาคาร *</label>
            <input
              className="form-input"
              value={account.bankName}
              onChange={(e) => set({ bankName: e.target.value })}
              placeholder="เช่น กสิกรไทย"
            />
          </div>
          <div className="form-group">
            <label>เลขบัญชี *</label>
            <input
              className="form-input"
              value={account.accountNumber}
              onChange={(e) => set({ accountNumber: e.target.value })}
              placeholder="xxx-x-xxxxx-x"
            />
          </div>
        </div>
      )}

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>ชื่อบัญชี *</label>
        <input
          className="form-input"
          value={account.accountName}
          onChange={(e) => set({ accountName: e.target.value })}
          placeholder="ชื่อ-นามสกุลเจ้าของบัญชี"
        />
      </div>
    </div>
  );
}
