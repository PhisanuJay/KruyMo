export const emptyDeliveryAddress = () => ({
  recipientName: '',
  recipientPhone: '',
  line1: '',
  district: '',
  province: '',
  postalCode: '',
});

export function validateDeliveryAddress(address) {
  if (!address?.recipientName?.trim()) return 'กรุณากรอกชื่อผู้รับ';
  if (!address?.recipientPhone?.trim()) return 'กรุณากรอกเบอร์ผู้รับ';
  if (!address?.line1?.trim()) return 'กรุณากรอกที่อยู่จัดส่ง';
  if (!address?.district?.trim()) return 'กรุณากรอกแขวง/ตำบล';
  if (!address?.province?.trim()) return 'กรุณากรอกเขต/จังหวัด';
  if (!address?.postalCode?.trim()) return 'กรุณากรอกรหัสไปรษณีย์';
  return '';
}

export function normalizeDeliveryAddress(address) {
  return {
    recipientName: (address?.recipientName || '').trim(),
    recipientPhone: (address?.recipientPhone || '').trim(),
    line1: (address?.line1 || '').trim(),
    district: (address?.district || '').trim(),
    province: (address?.province || '').trim(),
    postalCode: (address?.postalCode || '').trim(),
  };
}

export default function DeliveryAddressFields({ value, onChange, compact = false }) {
  const set = (key, v) => onChange({ ...value, [key]: v });

  return (
    <div className="card" style={{ padding: compact ? '1rem 1.15rem' : '1.25rem 1.35rem', marginBottom: compact ? 0 : '1.25rem' }}>
      {!compact && (
        <>
          <h3 style={{ fontWeight: 700, marginBottom: '0.35rem' }}>ที่อยู่จัดส่งแมสฯ</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            กรอกชื่อผู้รับและที่อยู่สำหรับให้แมสเซนเจอร์นำส่งชุดในวันเริ่มเช่า
          </p>
        </>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
        <div className="form-group" style={{ marginBottom: compact ? '0.75rem' : undefined }}>
          <label htmlFor="delivery-recipient">ชื่อผู้รับ *</label>
          <input
            id="delivery-recipient"
            className="form-input"
            value={value.recipientName}
            onChange={(e) => set('recipientName', e.target.value)}
            placeholder="ชื่อ-นามสกุล"
            required
          />
        </div>
        <div className="form-group" style={{ marginBottom: compact ? '0.75rem' : undefined }}>
          <label htmlFor="delivery-phone">เบอร์ผู้รับ *</label>
          <input
            id="delivery-phone"
            className="form-input"
            value={value.recipientPhone}
            onChange={(e) => set('recipientPhone', e.target.value)}
            placeholder="08x-xxx-xxxx"
            required
          />
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="delivery-line1">ที่อยู่ *</label>
        <textarea
          id="delivery-line1"
          className="form-input"
          rows={2}
          value={value.line1}
          onChange={(e) => set('line1', e.target.value)}
          placeholder="บ้านเลขที่ ถนน ซอย หมู่บ้าน"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="delivery-district">แขวง/ตำบล *</label>
        <input
          id="delivery-district"
          className="form-input"
          value={value.district}
          onChange={(e) => set('district', e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="delivery-province">เขต/อำเภอ หรือ จังหวัด *</label>
        <input
          id="delivery-province"
          className="form-input"
          value={value.province}
          onChange={(e) => set('province', e.target.value)}
          placeholder="เช่น กรุงเทพฯ"
          required
        />
      </div>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label htmlFor="delivery-postal">รหัสไปรษณีย์ *</label>
        <input
          id="delivery-postal"
          className="form-input"
          value={value.postalCode}
          onChange={(e) => set('postalCode', e.target.value)}
          placeholder="10110"
          required
        />
      </div>
    </div>
  );
}
