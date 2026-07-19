/** helpers สำหรับบัญชีรับเงินคืนมัดจำ (frontend) */
export function normalizeRefundAccount(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const method = raw.method === 'bank' ? 'bank' : 'promptpay';
  return {
    method,
    promptpay: String(raw.promptpay || '').trim(),
    bankName: String(raw.bankName || '').trim(),
    accountNumber: String(raw.accountNumber || '').trim(),
    accountName: String(raw.accountName || '').trim(),
  };
}

export function validateRefundAccount(raw) {
  const a = normalizeRefundAccount(raw);
  if (!a) return 'กรุณากรอกช่องทางรับเงินคืนมัดจำ';
  if (!a.accountName) return 'กรุณากรอกชื่อบัญชี';
  if (a.method === 'promptpay') {
    if (!a.promptpay) return 'กรุณากรอกเบอร์พร้อมเพย์';
  } else {
    if (!a.bankName) return 'กรุณากรอกชื่อธนาคาร';
    if (!a.accountNumber) return 'กรุณากรอกเลขบัญชี';
  }
  return '';
}
