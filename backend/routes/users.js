import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { readJSON, updateById, findById, addItem, deleteById } from '../utils/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logActivity, generateId, normalizeRefundAccount, validateRefundAccount } from '../utils/helpers.js';

const router = Router();

const sanitizeUser = ({
  password,
  emailOtpHash,
  emailOtpExpiresAt,
  emailOtpLastSentAt,
  emailOtpAttempts,
  passwordResetHash,
  passwordResetExpiresAt,
  passwordResetLastSentAt,
  passwordResetAttempts,
  ...user
}) => user;

router.get('/', authenticate, authorize('admin'), (req, res) => {
  const users = readJSON('users.json').map(sanitizeUser);
  res.json(users);
});

router.post('/', authenticate, authorize('admin'), async (req, res) => {
  const { name, email, password, phone, role } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!name?.trim() || !normalizedEmail || !password) {
    return res.status(400).json({ error: 'กรุณากรอกชื่อ อีเมล และรหัสผ่าน' });
  }
  if (!['customer', 'staff', 'admin'].includes(role || 'customer')) {
    return res.status(400).json({ error: 'สิทธิ์ไม่ถูกต้อง' });
  }
  const users = readJSON('users.json');
  if (users.find((u) => String(u.email || '').trim().toLowerCase() === normalizedEmail)) {
    return res.status(400).json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' });
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = {
    id: generateId(),
    name: name.trim(),
    email: normalizedEmail,
    password: hashed,
    phone: (phone || '').trim(),
    role: role || 'customer',
    avatar: null,
    emailVerified: true,
    emailVerifiedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  addItem('users.json', user);
  logActivity('create_user', `สร้างผู้ใช้ ${user.email} (${user.role})`, req.user.id);
  res.status(201).json(sanitizeUser(user));
});

router.get('/:id', authenticate, (req, res) => {
  const user = findById('users.json', req.params.id);
  if (!user) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
  if (req.user.id !== user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'ไม่มีสิทธิ์' });
  }
  res.json(sanitizeUser(user));
});

router.put('/:id', authenticate, async (req, res) => {
  const user = findById('users.json', req.params.id);
  if (!user) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
  if (req.user.id !== user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'ไม่มีสิทธิ์' });
  }
  const { name, phone, email, currentPassword, newPassword, role, address, refundAccount } = req.body;
  const updates = {};
  if (name !== undefined) {
    const nextName = String(name || '').trim();
    if (!nextName) return res.status(400).json({ error: 'กรุณากรอกชื่อ-นามสกุล' });
    updates.name = nextName;
  }
  if (phone !== undefined) {
    const nextPhone = String(phone || '').trim();
    if (nextPhone && !/^[0-9+\-\s]{9,15}$/.test(nextPhone)) {
      return res.status(400).json({ error: 'เบอร์โทรไม่ถูกต้อง' });
    }
    updates.phone = nextPhone;
  }
  if (email) {
    const nextEmail = String(email).trim().toLowerCase();
    if (nextEmail !== String(user.email || '').trim().toLowerCase()) {
      if (req.user.role !== 'admin') {
        return res.status(400).json({ error: 'ไม่สามารถเปลี่ยนอีเมลที่ยืนยันแล้วได้ กรุณาติดต่อผู้ดูแลระบบ' });
      }
      updates.email = nextEmail;
      updates.emailVerified = true;
      updates.emailVerifiedAt = new Date().toISOString();
    }
  }
  if (address !== undefined) updates.address = address;
  if (refundAccount !== undefined) {
    if (refundAccount === null) {
      updates.refundAccount = null;
    } else {
      const err = validateRefundAccount(refundAccount);
      if (err) return res.status(400).json({ error: err });
      updates.refundAccount = normalizeRefundAccount(refundAccount);
    }
  }
  if (role && req.user.role === 'admin') updates.role = role;
  if (newPassword) {
    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });
    }
    if (!currentPassword || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
    }
    updates.password = await bcrypt.hash(newPassword, 10);
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'ไม่มีข้อมูลที่จะอัปเดต' });
  }
  const updated = updateById('users.json', req.params.id, updates);
  logActivity('update_profile', `อัปเดตโปรไฟล์ ${updated.email}`, req.user.id);
  res.json(sanitizeUser(updated));
});

router.post('/:id/avatar', authenticate, (req, res) => {
  const { avatar } = req.body;
  const user = findById('users.json', req.params.id);
  if (!user) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
  if (req.user.id !== user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'ไม่มีสิทธิ์' });
  }
  const updated = updateById('users.json', req.params.id, { avatar });
  res.json(sanitizeUser(updated));
});

router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  const user = findById('users.json', req.params.id);
  if (!user) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
  if (user.id === req.user.id) {
    return res.status(400).json({ error: 'ไม่สามารถลบบัญชีของตัวเองได้' });
  }
  if (user.role === 'admin') {
    const adminCount = readJSON('users.json').filter((u) => u.role === 'admin').length;
    if (adminCount <= 1) {
      return res.status(400).json({ error: 'ต้องเหลือแอดมินอย่างน้อย 1 คนในระบบ' });
    }
  }
  deleteById('users.json', req.params.id);
  logActivity('delete_user', `ลบผู้ใช้ ${user.email} (${user.role})`, req.user.id);
  res.json({ message: 'ลบผู้ใช้สำเร็จ', id: user.id });
});

export default router;
