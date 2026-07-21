/**
 * ล้างประวัติธุรกรรมทั้งหมด + รีเซ็ตบัญชีหลัก 3 ตัว
 * คงข้อมูลหลัก: universities / faculties / sizes / costumes / inventory / notificationTemplates
 *
 * รัน: node backend/scripts/reset-demo-data.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');

const write = (filename, data) => {
  fs.writeFileSync(path.join(dataDir, filename), `${JSON.stringify(data, null, 2)}\n`);
};

const PASSWORD = '12345678';
const now = new Date().toISOString();
const hashed = await bcrypt.hash(PASSWORD, 10);

const users = [
  {
    id: uuidv4(),
    name: 'แอดมิน KruyMo',
    email: 'admin@gmail.com',
    password: hashed,
    phone: '0812345678',
    role: 'admin',
    avatar: null,
    emailVerified: true,
    emailVerifiedAt: now,
    createdAt: now,
  },
  {
    id: uuidv4(),
    name: 'พนักงาน KruyMo',
    email: 'staff@gmail.com',
    password: hashed,
    phone: '0812345678',
    role: 'staff',
    avatar: null,
    emailVerified: true,
    emailVerifiedAt: now,
    createdAt: now,
  },
  {
    id: uuidv4(),
    name: 'ลูกค้าทดสอบ',
    email: 'customer@gmail.com',
    password: hashed,
    phone: '0812345678',
    role: 'customer',
    avatar: null,
    emailVerified: true,
    emailVerifiedAt: now,
    createdAt: now,
  },
];

write('users.json', users);
write('bookings.json', []);
write('payments.json', []);
write('notifications.json', []);
write('cart.json', []);
write('favorites.json', []);
write('activityLog.json', []);
write('feedback.json', []);

console.log('✅ ล้างประวัติแล้ว — คงชุดครุย/คลัง/ข้อมูลหลักไว้');
console.log('บัญชีหลัก (รหัสผ่านทั้งหมด: 12345678)');
users.forEach((u) => console.log(`  ${u.role.padEnd(8)} ${u.email}`));
