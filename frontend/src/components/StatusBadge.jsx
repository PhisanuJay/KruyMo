const STATUS_CONFIG = {
  pending: { label: 'รออนุมัติ', color: '#E17055', bg: '#FFF3E0' },
  payment_pending: { label: 'รอชำระเงิน', color: '#FDCB6E', bg: '#FFF8E1' },
  payment_verified: { label: 'ตรวจสอบการชำระแล้ว', color: '#74B9FF', bg: '#E3F2FD' },
  approved: { label: 'อนุมัติแล้ว', color: '#00B894', bg: '#E8F5E9' },
  rejected: { label: 'ปฏิเสธ', color: '#E17055', bg: '#FFEBEE' },
  preparing: { label: 'กำลังเตรียมชุด', color: '#A29BFE', bg: '#F3E5F5' },
  ready_for_pickup: { label: 'พร้อมรับชุด', color: '#00CEC9', bg: '#E0F7FA' },
  picked_up: { label: 'รับชุดแล้ว', color: '#6C5CE7', bg: '#EDE7F6' },
  returned: { label: 'คืนชุดแล้ว', color: '#00B894', bg: '#E8F5E9' },
  deposit_refunded: { label: 'คืนเงินมัดจำแล้ว', color: '#00B894', bg: '#E8F5E9' },
  cancelled: { label: 'ยกเลิก', color: '#E17055', bg: '#FFEBEE' },
  verified: { label: 'สำเร็จ', color: '#00B894', bg: '#E8F5E9' },
  failed: { label: 'ไม่สำเร็จ', color: '#E17055', bg: '#FFEBEE' },
};

export default function StatusBadge({ status, size = 'md' }) {
  const config = STATUS_CONFIG[status] || { label: status, color: '#636E72', bg: '#F5F5F5' };
  const fontSize = size === 'sm' ? '0.75rem' : '0.85rem';
  const padding = size === 'sm' ? '4px 10px' : '6px 14px';

  return (
    <span style={{
      display: 'inline-block',
      padding,
      borderRadius: '50px',
      fontSize,
      fontWeight: 600,
      color: config.color,
      background: config.bg,
      whiteSpace: 'nowrap',
    }}>
      {config.label}
    </span>
  );
}
