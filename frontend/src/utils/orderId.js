/** เลขคำสั่งแบบสั้นสำหรับแสดงผล เช่น #A1B2C3 */
export function shortOrderCode(id = '') {
  const hex = String(id || '').replace(/-/g, '');
  if (!hex) return '';
  return hex.slice(-6).toUpperCase();
}

/** รับ booking object หรือ id string → "#A1B2C3" */
export function formatOrderId(bookingOrId) {
  const id = typeof bookingOrId === 'string' ? bookingOrId : bookingOrId?.id;
  const code = shortOrderCode(id);
  return code ? `#${code}` : '—';
}
