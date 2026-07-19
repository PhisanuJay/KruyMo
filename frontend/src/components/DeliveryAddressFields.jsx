import { getAmphoes, getDistricts, getPostalCodes, BANGKOK } from '../utils/thaiAddress';
import { searchAddressByDistrict } from 'thai-address-database';

export const emptyDeliveryAddress = () => ({
  recipientName: '',
  recipientPhone: '',
  line1: '',
  amphoe: '',
  district: '',
  province: BANGKOK,
  postalCode: '',
});

/** เดาเขตจากแขวง (ที่อยู่เก่าที่ยังไม่มี amphoe) — เฉพาะกรุงเทพฯ */
function inferAmphoe({ amphoe, district }) {
  if (amphoe) return amphoe;
  if (!district) return '';
  const matches = (searchAddressByDistrict(district, 10000) || [])
    .filter((row) => row.province === BANGKOK && row.district === district);
  const amphoes = [...new Set(matches.map((row) => row.amphoe))];
  return amphoes.length === 1 ? amphoes[0] : '';
}

/** ดึงค่าเริ่มต้นจากโปรไฟล์ผู้ใช้ (ยังแก้ในฟอร์มได้) — จังหวัดบังคับกรุงเทพฯ */
export function deliveryAddressFromUser(user) {
  const address = user?.address && typeof user.address === 'object' ? user.address : {};
  const district = (address.district || '').trim();
  const amphoe = inferAmphoe({
    amphoe: (address.amphoe || '').trim(),
    district,
  });
  return {
    recipientName: (user?.name || address.recipientName || '').trim(),
    recipientPhone: (user?.phone || address.recipientPhone || '').trim(),
    line1: (address.line1 || '').trim(),
    amphoe,
    district,
    province: BANGKOK,
    postalCode: (address.postalCode || '').trim(),
  };
}

export function validateDeliveryAddress(address) {
  if (!address?.recipientName?.trim()) return 'กรุณากรอกชื่อผู้รับ';
  if (!address?.recipientPhone?.trim()) return 'กรุณากรอกเบอร์ผู้รับ';
  if (!address?.line1?.trim()) return 'กรุณากรอกที่อยู่จัดส่ง';
  if ((address?.province || '').trim() !== BANGKOK) return 'จัดส่งเฉพาะกรุงเทพมหานครเท่านั้น';
  if (!address?.amphoe?.trim()) return 'กรุณาเลือกเขต';
  if (!address?.district?.trim()) return 'กรุณาเลือกแขวง';
  if (!address?.postalCode?.trim()) return 'กรุณาเลือกรหัสไปรษณีย์';
  return '';
}

export function normalizeDeliveryAddress(address) {
  return {
    recipientName: (address?.recipientName || '').trim(),
    recipientPhone: (address?.recipientPhone || '').trim(),
    line1: (address?.line1 || '').trim(),
    amphoe: (address?.amphoe || '').trim(),
    district: (address?.district || '').trim(),
    province: BANGKOK,
    postalCode: (address?.postalCode || '').trim(),
  };
}

export default function DeliveryAddressFields({ value, onChange, compact = false }) {
  const set = (key, v) => onChange({ ...value, province: BANGKOK, [key]: v });

  const amphoeOptions = getAmphoes(BANGKOK);
  const districtOptions = value.amphoe
    ? getDistricts(BANGKOK, value.amphoe)
    : [];
  const postalOptions = value.amphoe && value.district
    ? getPostalCodes(BANGKOK, value.amphoe, value.district)
    : [];

  const handleAmphoeChange = (amphoe) => {
    onChange({
      ...value,
      province: BANGKOK,
      amphoe,
      district: '',
      postalCode: '',
    });
  };

  const handleDistrictChange = (district) => {
    const codes = value.amphoe
      ? getPostalCodes(BANGKOK, value.amphoe, district)
      : [];
    onChange({
      ...value,
      province: BANGKOK,
      district,
      postalCode: codes.length === 1 ? codes[0] : '',
    });
  };

  return (
    <div className="card" style={{ padding: compact ? '1rem 1.15rem' : '1.25rem 1.35rem', marginBottom: compact ? 0 : '1.25rem' }}>
      {!compact && (
        <>
          <h3 style={{ fontWeight: 700, marginBottom: '0.35rem' }}>ที่อยู่จัดส่งแมสฯ</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            จัดส่งเฉพาะกรุงเทพมหานคร — เลือกเขต แขวง และรหัสไปรษณีย์จากรายการ
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
        <div className="form-group" style={{ marginBottom: compact ? '0.75rem' : undefined }}>
          <label htmlFor="delivery-province">จังหวัด *</label>
          <input
            id="delivery-province"
            className="form-input"
            value={BANGKOK}
            readOnly
            disabled
          />
        </div>
        <div className="form-group" style={{ marginBottom: compact ? '0.75rem' : undefined }}>
          <label htmlFor="delivery-amphoe">เขต *</label>
          <select
            id="delivery-amphoe"
            className="form-input"
            value={value.amphoe || ''}
            onChange={(e) => handleAmphoeChange(e.target.value)}
            required
          >
            <option value="">เลือกเขต</option>
            {amphoeOptions.map((amphoe) => (
              <option key={amphoe} value={amphoe}>{amphoe}</option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: compact ? '0.75rem' : undefined }}>
          <label htmlFor="delivery-district">แขวง *</label>
          <select
            id="delivery-district"
            className="form-input"
            value={value.district || ''}
            onChange={(e) => handleDistrictChange(e.target.value)}
            disabled={!value.amphoe}
            required
          >
            <option value="">{value.amphoe ? 'เลือกแขวง' : 'เลือกเขตก่อน'}</option>
            {districtOptions.map((district) => (
              <option key={district} value={district}>{district}</option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label htmlFor="delivery-postal">รหัสไปรษณีย์ *</label>
          <select
            id="delivery-postal"
            className="form-input"
            value={value.postalCode || ''}
            onChange={(e) => set('postalCode', e.target.value)}
            disabled={!value.district || postalOptions.length === 0}
            required
          >
            <option value="">
              {!value.district
                ? 'เลือกแขวงก่อน'
                : postalOptions.length === 0
                  ? 'ไม่พบรหัส'
                  : 'เลือกรหัสไปรษณีย์'}
            </option>
            {postalOptions.map((code) => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
