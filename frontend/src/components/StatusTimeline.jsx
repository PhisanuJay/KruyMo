const STEPS = [
  { key: 'payment_pending', label: 'จองแล้ว' },
  { key: 'payment_verified', label: 'ชำระเงิน' },
  { key: 'approved', label: 'อนุมัติ' },
  { key: 'ready_for_pickup', label: 'พร้อมรับ' },
  { key: 'picked_up', label: 'รับชุด' },
  { key: 'returned', label: 'คืนชุด' },
  { key: 'deposit_refunded', label: 'คืนมัดจำ' },
];

const STATUS_ORDER = STEPS.map((s) => s.key);

export default function StatusTimeline({ status }) {
  const currentIndex = STATUS_ORDER.indexOf(status);
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
