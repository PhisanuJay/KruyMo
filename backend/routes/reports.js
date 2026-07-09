import { Router } from 'express';
import { readJSON, writeJSON } from '../utils/db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/revenue', authenticate, authorize('admin', 'staff'), (req, res) => {
  const bookings = readJSON('bookings.json');
  const { from, to } = req.query;
  let filtered = bookings.filter((b) =>
    ['approved', 'picked_up', 'returned', 'deposit_refunded'].includes(b.status)
  );
  if (from) filtered = filtered.filter((b) => b.createdAt >= from);
  if (to) filtered = filtered.filter((b) => b.createdAt <= to);

  const totalRevenue = filtered.reduce((sum, b) => sum + (b.rentalPrice || 0), 0);
  const totalDeposits = filtered.reduce((sum, b) => sum + (b.deposit || 0), 0);
  const totalPenalties = filtered.reduce((sum, b) => sum + (b.penaltyAmount || 0), 0);

  const byMonth = {};
  filtered.forEach((b) => {
    const month = b.createdAt.substring(0, 7);
    byMonth[month] = (byMonth[month] || 0) + (b.rentalPrice || 0);
  });

  const byDay = {};
  filtered.forEach((b) => {
    const day = b.createdAt.substring(0, 10);
    byDay[day] = (byDay[day] || 0) + 1;
  });

  res.json({ totalRevenue, totalDeposits, totalPenalties, count: filtered.length, byMonth, byDay });
});

router.get('/stock', authenticate, authorize('admin', 'staff'), (req, res) => {
  const costumes = readJSON('costumes.json');
  const universities = readJSON('universities.json');
  const faculties = readJSON('faculties.json');

  const byUniversity = universities.map((uni) => ({
    university: uni,
    totalStock: costumes.filter((c) => c.universityId === uni.id).reduce((s, c) => s + c.stock, 0),
    costumes: costumes.filter((c) => c.universityId === uni.id),
  }));

  const byFaculty = faculties.map((fac) => ({
    faculty: fac,
    totalStock: costumes.filter((c) => c.facultyId === fac.id).reduce((s, c) => s + c.stock, 0),
  }));

  res.json({ totalStock: costumes.reduce((s, c) => s + c.stock, 0), byUniversity, byFaculty });
});

router.get('/dashboard', authenticate, authorize('admin'), (req, res) => {
  const bookings = readJSON('bookings.json');
  const costumes = readJSON('costumes.json');
  const today = new Date().toISOString().substring(0, 10);

  const todayBookings = bookings.filter((b) => b.createdAt.startsWith(today));
  const pendingApproval = bookings.filter((b) => b.status === 'payment_verified');
  const totalRevenue = bookings
    .filter((b) => ['approved', 'picked_up', 'returned', 'deposit_refunded'].includes(b.status))
    .reduce((s, b) => s + (b.rentalPrice || 0), 0);

  res.json({
    totalRevenue,
    todayRentals: todayBookings.length,
    totalStock: costumes.reduce((s, c) => s + c.stock, 0),
    pendingApproval: pendingApproval.length,
    recentBookings: bookings.slice(-5).reverse(),
  });
});

router.get('/activity-log', authenticate, authorize('admin'), (req, res) => {
  const logs = readJSON('activityLog.json').reverse();
  res.json(logs);
});

export default router;
