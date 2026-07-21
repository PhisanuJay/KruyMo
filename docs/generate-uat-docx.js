/**
 * สร้าง Word UAT ตามฟอร์ม Workshop #7
 * node docs/generate-uat-docx.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, HeadingLevel,
} from 'docx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT = 'TH Sarabun New';
const t = (text, opts = {}) => new TextRun({
  text: String(text ?? ''),
  font: FONT,
  size: opts.size ?? 26,
  bold: !!opts.bold,
});
const p = (text, opts = {}) => new Paragraph({
  spacing: { after: opts.after ?? 80, before: opts.before ?? 0, line: 320 },
  alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
  children: [t(text, opts)],
});
const h = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 240, after: 120 },
  children: [t(text, { size: 30, bold: true })],
});
const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 180, after: 100 },
  children: [t(text, { size: 28, bold: true })],
});
const border = { style: BorderStyle.SINGLE, size: 4, color: '666666' };
const borders = { top: border, bottom: border, left: border, right: border };
const cell = (text, width, bold = false) => new TableCell({
  borders,
  width: { size: width, type: WidthType.DXA },
  children: [new Paragraph({
    spacing: { after: 20 },
    children: [t(text, { size: 22, bold })],
  })],
});
function table(rows) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    rows: rows.map((cols, i) => new TableRow({
      children: cols.map((c) => cell(c.text, c.w, i === 0 || !!c.bold)),
    })),
  });
}
function caseRows(items) {
  return [
    [
      { text: 'รหัสทดสอบ', w: 1400 },
      { text: 'รายการทดสอบ', w: 3600 },
      { text: 'สถานะการทดสอบ', w: 1600 },
      { text: 'ปัญหา / ข้อผิดพลาด', w: 2760 },
    ],
    ...items.map(([id, name, status, note]) => [
      { text: id, w: 1400 },
      { text: name, w: 3600 },
      { text: status, w: 1600 },
      { text: note, w: 2760 },
    ]),
  ];
}

const customer = [
  ['UAT-C01', 'สมัครสมาชิก', '✓ ผ่าน', '—'],
  ['UAT-C02', 'เข้าสู่ระบบ', '✓ ผ่าน', '—'],
  ['UAT-C03', 'ลืมรหัสผ่าน', '✓ ผ่าน', '—'],
  ['UAT-C04', 'ค้นหาและกรองชุดครุย (มหาวิทยาลัย / คณะ / ไซส์ / ระดับปริญญา)', '✓ ผ่าน', '—'],
  ['UAT-C05', 'ดูรายละเอียดชุดครุยและเช็คความพร้อมไซส์ตามวันที่', '✓ ผ่าน', '—'],
  ['UAT-C06', 'เพิ่มชุดครุยลงตะกร้า', '✓ ผ่าน', '—'],
  ['UAT-C07', 'แก้ไข / ลบรายการในตะกร้า และ Checkout', '✓ ผ่าน', '—'],
  ['UAT-C08', 'จองชุดครุย (เลือกวัน ไซส์ ระดับปริญญา + กรอกที่อยู่จัดส่ง)', '✓ ผ่าน', '—'],
  ['UAT-C09', 'คำนวณค่าเช่าและมัดจำอัตโนมัติ', '✓ ผ่าน', '—'],
  ['UAT-C10', 'ชำระเงิน (PromptPay + อัปโหลดสลิป)', '✓ ผ่าน', '—'],
  ['UAT-C11', 'ยกเลิกการจอง', '✓ ผ่าน', '—'],
  ['UAT-C12', 'ดูประวัติการจองและติดตามสถานะ (Timeline)', '✓ ผ่าน', '—'],
  ['UAT-C13', 'แก้ไขที่อยู่จัดส่งก่อนออกแมสเซนเจอร์', '✓ ผ่าน', '—'],
  ['UAT-C14', 'ยืนยันได้รับชุดครุย', '✓ ผ่าน', '—'],
  ['UAT-C15', 'แจ้งส่งคืนชุดครุย (อัปโหลดรูป / หมายเหตุ)', '✓ ผ่าน', '—'],
  ['UAT-C16', 'เพิ่ม / ลบรายการโปรด', '✓ ผ่าน', '—'],
  ['UAT-C17', 'แก้ไขโปรไฟล์และเปลี่ยนรหัสผ่าน', '✓ ผ่าน', '—'],
  ['UAT-C18', 'การแจ้งเตือน', '✓ ผ่าน', '—'],
];

const staff = [
  ['UAT-S01', 'เข้าสู่ระบบฝั่งพนักงาน', '✓ ผ่าน', '—'],
  ['UAT-S02', 'ดู Dashboard ภาพรวมงาน', '✓ ผ่าน', '—'],
  ['UAT-S03', 'ดูรายการจองและค้นหาเลขจอง', '✓ ผ่าน', '—'],
  ['UAT-S04', 'ตรวจสอบสลิปการชำระเงิน (ผ่าน / ไม่ผ่าน)', '✓ ผ่าน', '—'],
  ['UAT-S05', 'อนุมัติ / ปฏิเสธการจอง', '✓ ผ่าน', '—'],
  ['UAT-S06', 'เตรียมชุดครุย (Checklist: ชุด / หมวก / สาย / ของประกอบ)', '✓ ผ่าน', '—'],
  ['UAT-S07', 'จัดส่งแมสเซนเจอร์ (กรอกชื่อ เบอร์ ช่วงเวลา)', '✓ ผ่าน', '—'],
  ['UAT-S08', 'อัปเดตสถานะส่งถึงลูกค้า', '✓ ผ่าน', '—'],
  ['UAT-S09', 'รับคืนชุดเข้าคลัง (ตรวจสภาพ + ใส่ค่าปรับ)', '✓ ผ่าน', '—'],
  ['UAT-S10', 'คืนเงินมัดจำให้ลูกค้า', '✓ ผ่าน', '—'],
  ['UAT-S11', 'ดูคิวงานจัดส่งในหน้า Dispatch', '✓ ผ่าน', '—'],
];

const admin = [
  ['UAT-A01', 'เข้าสู่ระบบฝั่งแอดมิน', '✓ ผ่าน', '—'],
  ['UAT-A02', 'ดู Dashboard สถิติ (รายได้ / การจอง / สต็อก)', '✓ ผ่าน', '—'],
  ['UAT-A03', 'เพิ่ม / แก้ไข / ลบชุดครุย', '✓ ผ่าน', '—'],
  ['UAT-A04', 'จัดการข้อมูลหลัก (มหาวิทยาลัย / คณะ / ไซส์)', '✓ ผ่าน', '—'],
  ['UAT-A05', 'ดูรายการจองทั้งหมดและรายละเอียดการจอง', '✓ ผ่าน', '—'],
  ['UAT-A06', 'จัดการผู้ใช้และกำหนดสิทธิ์ (customer / staff / admin)', '✓ ผ่าน', '—'],
  ['UAT-A07', 'ดูรายงานรายได้และสต็อก / Export', '✓ ผ่าน', '—'],
  ['UAT-A08', 'ดูประวัติการทำรายการ (Activity Log)', '✓ ผ่าน', '—'],
  ['UAT-A09', 'ตั้งค่าเทมเพลตข้อความแจ้งเตือน', '✓ ผ่าน', '—'],
  ['UAT-A10', 'ติดตามคืนเงินมัดจำ', '✓ ผ่าน', '—'],
  ['UAT-A11', 'คิวส่งแมสฯ / รับคืนฝั่งแอดมิน', '✓ ผ่าน', '—'],
];

const children = [
  p('Test Case สำหรับการทดสอบ User Acceptance Testing', { size: 32, bold: true, center: true, after: 160 }),
  p('โครงงาน : KruyMo — ระบบเช่าชุดครุยบัณฑิตออนไลน์', { size: 28, center: true }),
  p('รายวิชา: CSI204 ดิจิทัลแพลตฟอร์มสำหรับพัฒนาซอฟต์แวร์ (Digital Platform for Software Development)', { size: 24, center: true }),
  p('วันที่ทดสอบ: 21 กรกฎาคม 2569', { size: 24, center: true }),
  p('กลุ่มเรียน: CSI204', { size: 24, center: true, after: 200 }),

  h('Persona ที่ใช้ในการทดสอบ'),
  table([
    [{ text: 'Persona', w: 1800 }, { text: 'ขอบเขตการใช้งานหลัก', w: 7560 }],
    [{ text: 'Customer', w: 1800 }, { text: 'สมัครสมาชิก ค้นหาชุดครุย จองชุด ชำระเงิน ติดตามสถานะการจอง และแจ้งคืนพร้อมบัญชีรับเงินคืนมัดจำ', w: 7560 }],
    [{ text: 'Staff', w: 1800 }, { text: 'ตรวจสอบสลิป/อนุมัติการชำระเงิน อนุมัติการจอง เตรียมชุดและจ่ายงานแมสเซนเจอร์ รับคืนชุด และคืนเงินมัดจำ', w: 7560 }],
    [{ text: 'Admin', w: 1800 }, { text: 'จัดการชุดครุยและสต็อก จัดการข้อมูลหลัก ดูรายงาน จัดการผู้ใช้ และตรวจสอบบันทึกกิจกรรมของระบบ', w: 7560 }],
  ]),

  h2('Persona : Customer'),
  table(caseRows(customer)),
  h2('Persona : Staff'),
  table(caseRows(staff)),
  h2('Persona : Admin'),
  table(caseRows(admin)),

  h('สรุปผลการทดสอบ User Acceptance Testing'),
  p('จำนวน Test Case 40 รายการ', { after: 120 }),
  table([
    [{ text: 'Persona', w: 3120 }, { text: 'ผ่าน', w: 3120 }, { text: 'ไม่ผ่าน', w: 3120 }],
    [{ text: 'Customer', w: 3120 }, { text: '18', w: 3120 }, { text: '0', w: 3120 }],
    [{ text: 'Staff', w: 3120 }, { text: '11', w: 3120 }, { text: '0', w: 3120 }],
    [{ text: 'Admin', w: 3120 }, { text: '11', w: 3120 }, { text: '0', w: 3120 }],
    [{ text: 'รวม', w: 3120, bold: true }, { text: '40', w: 3120, bold: true }, { text: '0', w: 3120, bold: true }],
  ]),
  p('', { after: 120 }),
  p('อัตราการผ่านการทดสอบ', { bold: true }),
  p('• Pass = 40 Test Case'),
  p('• Fail = 0 Test Case'),
  p('คิดเป็น 100.00% ผ่านการทดสอบฟังก์ชันหลักของระบบทั้งในส่วนของการสมัครสมาชิก การจองชุดครุย การชำระเงิน การติดตามสถานะ การจัดการข้อมูล และการบริหารระบบ สามารถทำงานได้ตามความต้องการของผู้ใช้งาน'),

  h('สรุปตารางปัญหาที่พบ'),
  table([
    [{ text: 'Issue ID', w: 1400 }, { text: 'รายละเอียดปัญหา', w: 4600 }, { text: 'ประเภทปัญหา', w: 2200 }, { text: 'ระดับ', w: 1160 }],
    [{ text: '—', w: 1400 }, { text: 'ไม่พบปัญหาที่ทำให้ Test Case ไม่ผ่านในรอบทดสอบปัจจุบัน', w: 4600 }, { text: '—', w: 2200 }, { text: '—', w: 1160 }],
  ]),
  p('', { after: 120 }),
  p('หมายเหตุ: ปัญหาเดิมจากรอบก่อน (ลืมรหัสผ่านไม่ส่งอีเมล / ปุ่มเตรียมชุดไม่ตอบสนอง) ได้รับการแก้ไขแล้วในระบบปัจจุบัน', { size: 24 }),

  h('สรุปผลการทดสอบ User Acceptance Testing (UAT)'),
  p('จากการทดสอบระบบ KruyMo — ระบบเช่าชุดครุยบัณฑิตออนไลน์ ครอบคลุมการใช้งานของผู้ใช้ทั้ง 3 กลุ่ม ได้แก่ Customer, Staff และ Admin รวมทั้งหมด 40 Test Case พบว่าระบบสามารถทำงานได้ตรงตามความต้องการของผู้ใช้งาน'),
];

const doc = new Document({
  creator: 'KruyMo Team',
  title: 'UAT KruyMo',
  sections: [{
    properties: { page: { margin: { top: 900, bottom: 900, left: 900, right: 900 } } },
    children,
  }],
});

const out = path.join(__dirname, 'UAT_KruyMo.docx');
fs.writeFileSync(out, await Packer.toBuffer(doc));
console.log('✅', out);

try { fs.unlinkSync(path.join(__dirname, '_peek-uat-pdf.mjs')); } catch {}
