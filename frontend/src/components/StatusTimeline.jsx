const STEPS = [
  { key: 'payment_pending', label: 'จองแล้ว' },
  { key: 'pending', label: 'รออนุมัติ' },
  { key: 'approved', label: 'อนุมัติ' },
  { key: 'ready_to_ship', label: 'พร้อมส่ง' },
  { key: 'out_for_delivery', label: 'แมสฯ ส่ง' },
  { key: 'delivered', label: 'ส่งถึง' },
  { key: 'return_submitted', label: 'ส่งคืน' },
  { key: 'returned', label: 'รับคืน' },
  { key: 'deposit_refunded', label: 'คืนมัดจำ' },
];

const STATUS_ORDER = STEPS.map((s) => s.key);

const normalizeStatus = (status) => {
  if (status === 'payment_verified') return 'pending';
  if (status === 'preparing') return 'approved';
  if (status === 'ready_for_pickup') return 'ready_to_ship';
  if (status === 'picked_up') return 'delivered';
  return status;
};

export default function StatusTimeline({ status }) {
  const normalized = normalizeStatus(status);
  const currentIndex = STATUS_ORDER.indexOf(normalized);
  const isCancelled = status === 'cancelled' || status === 'rejected';

  if (isCancelled) {
    return (
      <div className="alert alert-error" style={{ textAlign: 'center' }}>
        การจองถูก{status === 'cancelled' ? 'ยกเลิก' : 'ปฏิเสธ'}
      </div>
    );
  }

  return (
    <div className="stepper">
      {STEPS.map((step, i) => {
        const isDone = currentIndex > i;
        const isActive = currentIndex === i;
        return (
          <div key={step.key} className={`step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}>
            <div className="step-circle">{isDone ? '✓' : i + 1}</div>
            <span className="step-label">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}
