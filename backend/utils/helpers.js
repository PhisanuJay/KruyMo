import { v4 as uuidv4 } from 'uuid';
import { addItem } from './db.js';

export const generateId = () => uuidv4();

export const logActivity = (action, details, userId = null) => {
  addItem('activityLog.json', {
    id: generateId(),
    action,
    details,
    userId,
    createdAt: new Date().toISOString(),
  });
};

export const calculateRentalPrice = (costume, startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
  const rentalPrice = costume.pricePerDay * days;
  return {
    days,
    rentalPrice,
    deposit: costume.deposit,
    total: rentalPrice + costume.deposit,
  };
};

export const BOOKING_STATUSES = [
  'pending',
  'payment_pending',
  'payment_verified',
  'approved',
  'rejected',
  'preparing',
  'ready_for_pickup',
  'picked_up',
  'returned',
  'deposit_refunded',
  'cancelled',
];

export const STATUS_LABELS = {
  pending: 'รอดำเนินการ',
  payment_pending: 'รอชำระเงิน',
  payment_verified: 'ตรวจสอบการชำระแล้ว',
  approved: 'อนุมัติแล้ว',
  rejected: 'ปฏิเสธ',
  preparing: 'กำลังเตรียมชุด',
  ready_for_pickup: 'พร้อมรับชุด',
  picked_up: 'รับชุดแล้ว',
  returned: 'คืนชุดแล้ว',
  deposit_refunded: 'คืนเงินมัดจำแล้ว',
  cancelled: 'ยกเลิก',
};

export const ACTIVE_BOOKING_STATUSES = [
  'pending',
  'payment_pending',
  'payment_verified',
  'approved',
  'preparing',
  'ready_for_pickup',
  'picked_up',
];

export const datesOverlap = (startA, endA, startB, endB) => {
  const aStart = new Date(startA);
  const aEnd = new Date(endA);
  const bStart = new Date(startB);
  const bEnd = new Date(endB);
  return aStart <= bEnd && bStart <= aEnd;
};

export const countBookedUnits = (bookings, { costumeId, sizeId, degreeLevel, startDate, endDate }) => (
  bookings.filter((b) => (
    b.costumeId === costumeId
    && b.sizeId === sizeId
    && b.degreeLevel === degreeLevel
    && ACTIVE_BOOKING_STATUSES.includes(b.status)
    && datesOverlap(b.startDate, b.endDate, startDate, endDate)
  )).length
);
