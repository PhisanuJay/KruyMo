/**
 * รายงานฉบับสมบูรณ์ KruyMo — เนื้อหาตามระบบจริง + เกณฑ์ CSI204
 * node docs/generate-final-report-docx.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, PageBreak, HeadingLevel,
} from 'docx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT = 'TH Sarabun New';

const t = (text, opts = {}) => new TextRun({
  text: String(text ?? ''),
  font: FONT,
  size: opts.size ?? 28,
  bold: !!opts.bold,
  italics: !!opts.italics,
});

const center = (text, opts = {}) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: opts.after ?? 60, before: opts.before ?? 0, line: 360 },
  children: [t(text, opts)],
});

const body = (text) => new Paragraph({
  alignment: AlignmentType.BOTH,
  spacing: { after: 140, line: 360 },
  indent: { firstLine: 480 },
  children: [t(text)],
});

const bodyNoIndent = (text) => new Paragraph({
  alignment: AlignmentType.BOTH,
  spacing: { after: 140, line: 360 },
  children: [t(text)],
});

const bullet = (text) => new Paragraph({
  alignment: AlignmentType.BOTH,
  spacing: { after: 80, line: 360 },
  indent: { left: 480 },
  children: [t(`• ${text}`)],
});

const blank = () => new Paragraph({ spacing: { after: 120 }, children: [] });

const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 280, after: 160 },
  children: [t(text, { size: 32, bold: true })],
});

const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 220, after: 120 },
  children: [t(text, { size: 30, bold: true })],
});

const h3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 160, after: 100 },
  children: [t(text, { size: 28, bold: true })],
});

const border = { style: BorderStyle.SINGLE, size: 4, color: '666666' };
const borders = { top: border, bottom: border, left: border, right: border };
const cell = (text, width, bold = false) => new TableCell({
  borders,
  width: { size: width, type: WidthType.DXA },
  children: [new Paragraph({
    spacing: { after: 40 },
    children: [t(text, { size: 24, bold })],
  })],
});

function table(rows) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    rows: rows.map((cols, i) => new TableRow({
      children: cols.map((c) => cell(c.text, c.w, i === 0 || c.bold)),
    })),
  });
}

const cover = [
  center('โครงงานระบบเช่าชุดครุยออนไลน์', { size: 44, bold: true, before: 1600, after: 400 }),
  center('จัดทำโดย', { size: 28, before: 200, after: 120 }),
  center('67142629 นางสาวสุพิชฌาย์ แสนทวีสุข', { size: 28 }),
  center('67131764 นายพิษณุ ศิวพรพิทักษ์', { size: 28 }),
  center('67155508 นางสาวฐิตินันท์ ดุจจานุทัศน์', { size: 28 }),
  center('67156678 นางสาวปรายฟ้า สุขเกษม', { size: 28, after: 280 }),
  center('เสนอ', { size: 28, before: 200, after: 120 }),
  center('อาจารย์ณัฐพล พุทธจรรยาวงศ์', { size: 28, after: 480 }),
  center('รายงานนี้เป็นส่วนหนึ่งของวิชา CSI 204 คณะเทคโนโลยีสารสนเทศ', { size: 26, before: 600 }),
  center('มหาวิทยาลัยศรีปทุม', { size: 26, after: 200 }),
  new Paragraph({ children: [new PageBreak()] }),
];

const children = [
  ...cover,
  center('ระบบเว็บไซต์สำหรับเช่าชุดครุยออนไลน์ (KruyMo)', { size: 36, bold: true, before: 120, after: 200 }),
  center('ครุยโม้ — ระบบเช่าชุดครุยบัณฑิตออนไลน์สำหรับนักศึกษา มหาวิทยาลัยศรีปทุม', { size: 26, after: 240 }),

  h1('ตารางเกณฑ์ประเมิน Final Project (อ้างอิงเอกสาร S13-15)'),
  bodyNoIndent('ตารางประเมินผลโครงงาน 100 คะแนน จะคิดเป็น 40% ของรายวิชา โดยรายงานฉบับนี้จัดทำเนื้อหาจากระบบจริงที่พัฒนาแล้ว และครอบคลุมทุกหมวดดังนี้'),
  table([
    [{ text: 'หมวด', w: 900 }, { text: 'รายละเอียด', w: 5200 }, { text: 'คะแนน', w: 1100 }, { text: 'เอกสารในเล่ม', w: 2160 }],
    [{ text: '1', w: 900 }, { text: 'การเสนอและอนุมัติโครงงาน', w: 5200 }, { text: '5', w: 1100 }, { text: 'บทที่ 1–2', w: 2160 }],
    [{ text: '2', w: 900 }, { text: 'วิเคราะห์และออกแบบระบบ (UML)', w: 5200 }, { text: '20', w: 1100 }, { text: 'บทที่ 4–5', w: 2160 }],
    [{ text: '3', w: 900 }, { text: 'พัฒนาระบบ FE / BE / JSON', w: 5200 }, { text: '30', w: 1100 }, { text: 'บทที่ 6–8', w: 2160 }],
    [{ text: '4', w: 900 }, { text: 'ทดสอบระบบ (Workshop #7 / UAT)', w: 5200 }, { text: '10', w: 1100 }, { text: 'บทที่ 9', w: 2160 }],
    [{ text: '5', w: 900 }, { text: 'บริหารจัดการโครงงาน + GitHub', w: 5200 }, { text: '10', w: 1100 }, { text: 'บทที่ 10', w: 2160 }],
    [{ text: '6', w: 900 }, { text: 'Progress Review', w: 5200 }, { text: '10', w: 1100 }, { text: 'บทที่ 10', w: 2160 }],
    [{ text: '7', w: 900 }, { text: 'Final Project Evaluation', w: 5200 }, { text: '15', w: 1100 }, { text: 'บทที่ 12', w: 2160 }],
  ]),
  blank(),

  h1('1. บทคัดย่อ (Abstract)'),
  body('โครงงานนี้พัฒนา KruyMo (ครุยโม้) ซึ่งเป็นระบบเว็บไซต์สำหรับเช่าชุดครุยบัณฑิตออนไลน์ของมหาวิทยาลัยศรีปทุม โดยมุ่งแก้ปัญหาการเช่าชุดครุยแบบดั้งเดิมที่ลูกค้าต้องเดินทางมาหน้าร้านหลายครั้งเพื่อเลือกชุด ตรวจสอบขนาด จองคิว และติดตามสถานะ ขณะที่ร้านยังบันทึกข้อมูลแบบแมนนวล ทำให้เกิดความล่าช้า ความผิดพลาดด้านสต็อก และการติดตามออเดอร์ที่ยากในช่วงฤดูกาลรับปริญญา'),
  body('ระบบที่พัฒนาแล้วใช้งานได้จริงในลักษณะ Full-stack Web Application ประกอบด้วย Frontend ด้วย React และ Vite Backend ด้วย Node.js และ Express และจัดเก็บข้อมูลด้วยไฟล์ JSON ภายใต้โฟลเดอร์ backend/data โดยรองรับผู้ใช้ 3 บทบาท ได้แก่ ลูกค้า (customer) พนักงาน (staff) และผู้ดูแลระบบ (admin) กระบวนการหลักครอบคลุมการสมัครสมาชิกและยืนยันอีเมลด้วย OTP การค้นหาชุดครุยตาม 7 คณะของศรีปทุม การเลือกไซส์และระดับปริญญาตรี/โท/เอก การจองช่วงวันเช่า การชำระเงิน PromptPay พร้อมอัปโหลดสลิป การจัดส่งด้วยแมสเซนเจอร์ในพื้นที่กรุงเทพมหานคร การแจ้งคืนชุด และการคืนเงินมัดจำ'),
  body('ผลลัพธ์ที่ได้คือระบบที่ช่วยให้ลูกค้าจองและติดตามสถานะได้ตลอด 24 ชั่วโมง พนักงานทำงานเป็นคิวปฏิบัติการตั้งแต่ตรวจสลิปจนถึงคืนมัดจำได้ชัดเจน และแอดมินบริหารสต็อก รายงานรายได้ และข้อมูลหลักของร้านได้อย่างเป็นระบบ สอดคล้องกับแนวทาง Software Development Life Cycle (SDLC) ของรายวิชา CSI 204'),

  h1('2. บทนำ (Introduction)'),
  h2('2.1 ความเป็นมาและความสำคัญของโครงงาน'),
  body('การเข้าร่วมพิธีรับปริญญาจำเป็นต้องสวมชุดครุยตามระเบียบของมหาวิทยาลัย นักศึกษาส่วนใหญ่นิยมเช่าชุดครุยเพราะคุ้มค่ากว่าการซื้อชุดใหม่ แต่ร้านเช่าชุดครุยหลายแห่งยังทำงานแบบหน้าร้านเป็นหลัก ทำให้บัณฑิตเสียเวลาเดินทาง โดยเฉพาะช่วงก่อนวันรับปริญญาที่มีคิวหนาแน่น'),
  body('ฝั่งร้านก็เผชิญปัญหาการจองซ้ำซ้อน สต็อกไม่ตรงกับของจริง การตรวจสลิปโอนเงินที่กระจัดกระจาย และการติดตามสถานะจัดส่ง–รับคืน–คืนมัดจำที่ยังไม่เป็นระบบ จากปัญหานี้ คณะผู้จัดทำจึงพัฒนา KruyMo ให้เป็นช่องทางออนไลน์เฉพาะสำหรับชุดครุยมหาวิทยาลัยศรีปทุม โดยร้านตั้งอยู่ใกล้วิทยาเขตบางเขน และให้บริการจอง–ชำระเงิน–จัดส่งด้วยแมสเซนเจอร์–คืนมัดจำผ่านเว็บไซต์'),
  body('ปัจจุบันระบบมีสโลแกนว่า “ระบบเช่าชุดครุยบัณฑิตออนไลน์สำหรับนักศึกษา มหาวิทยาลัยศรีปทุม” และเผยแพร่โค้ดบน GitHub ที่ https://github.com/PhisanuJay/KruyMo สามารถรัน Frontend ที่พอร์ต 5173 และ Backend ที่พอร์ต 3001 เพื่อสาธิตการทำงานจริง'),

  h2('2.2 วัตถุประสงค์'),
  bodyNoIndent('1. เพื่อวิเคราะห์ ออกแบบ และพัฒนาระบบเว็บไซต์เช่าชุดครุยออนไลน์ KruyMo ที่ใช้งานได้จริงครบวงจร'),
  bodyNoIndent('2. เพื่อให้ลูกค้าเลือกชุดตามคณะ ไซส์ และระดับปริญญา จองวันเช่า ชำระเงิน และติดตามสถานะได้จากทุกที่'),
  bodyNoIndent('3. เพื่อลดความผิดพลาดจากการบันทึกคิวและสต็อกแบบแมนนวล ด้วยการคำนวณความว่างของชุดตามวันจองจริง'),
  bodyNoIndent('4. เพื่อให้พนักงานและแอดมินบริหารคิวตรวจสลิป จัดส่ง รับคืน คืนมัดจำ สต็อก และรายงานรายได้อย่างเป็นระบบ'),

  h2('2.3 ขอบเขตของระบบ (System Scope)'),
  body('ระบบมุ่งบริการชุดครุยของมหาวิทยาลัยศรีปทุมเพียงแห่งเดียว (uni-spu) ครอบคลุม 7 คณะ ได้แก่ นิเทศศาสตร์ บริหารธุรกิจ วิศวกรรมศาสตร์ เทคโนโลยีสารสนเทศ ศิลปศาสตร์ บัญชี และนิติศาสตร์ โดยแต่ละคณะมีสีครุยเฉพาะ และมีชุดครุย 1 รายการต่อคณะ การจัดส่งจำกัดพื้นที่กรุงเทพมหานคร และการชำระเงินใช้ PromptPay แบบแมนนวลพร้อมอัปโหลดสลิป'),

  h3('2.3.1 ขอบเขตด้านผู้ใช้งาน (User Roles)'),
  bullet('Customer: สมัครสมาชิก ยืนยันอีเมลด้วย OTP เข้าสู่ระบบ ค้นหาชุดในแคตตาล็อก ดูรายละเอียด เพิ่มรายการโปรดและตะกร้า จองชุด ชำระเงิน อัปโหลดสลิป บันทึกบัญชีรับเงินมัดจำคืน ติดตามสถานะ ยืนยันรับชุด แจ้งส่งคืนพร้อมรูปภาพ และจัดการโปรไฟล์/ที่อยู่จัดส่ง'),
  bullet('Staff: ดูแดชบอร์ดปฏิบัติการ ตรวจ/ปฏิเสธสลิป จัดเตรียมชุด มอบแมสเซนเจอร์ อัปเดตสถานะจัดส่ง รับคืนเข้าคลัง บันทึกค่าปรับ และอัปโหลดสลิปคืนมัดจำ'),
  bullet('Admin: ทำทุกอย่างของพนักงานได้ และเพิ่มสิทธิ์จัดการชุดครุย/สต็อกแบบเมทริกซ์ไซส์×ระดับปริญญา ข้อมูลหลัก (มหาวิทยาลัย คณะ ไซส์) ผู้ใช้ รายงานรายได้ บันทึกกิจกรรม และเทมเพลตการแจ้งเตือน'),

  h3('2.3.2 ขอบเขตด้านฟังก์ชันหลักที่พัฒนาแล้ว'),
  bullet('ระบบสมาชิกและความปลอดภัย: JWT อายุ 7 วัน รหัสผ่านเข้ารหัสด้วย bcrypt และ OTP ยืนยันอีเมล/รีเซ็ตรหัสผ่าน'),
  bullet('ระบบแคตตาล็อกและสต็อก: เลือกไซส์ 38–50 และระดับ bachelor / master / doctoral คำนวณจำนวนว่างจากสต็อกหักการจองที่ยังแอ็กทีฟ'),
  bullet('ระบบจองและตะกร้า: จองเดี่ยวหรือเช็คเอาต์หลายรายการพร้อมกัน (checkoutBatchId)'),
  bullet('ระบบชำระเงิน PromptPay: แสดง QR และหมายเลข 097-070-9141 ในนาม KruyMo พร้อมอัปโหลดสลิป'),
  bullet('ระบบปฏิบัติการจัดส่ง–รับคืน–คืนมัดจำ: คิวงานแยกตามสถานะ และคืนมัดจำหลังหักค่าปรับ'),

  h1('3. การศึกษาที่เกี่ยวข้อง (Literature Review)'),
  body('คณะผู้จัดทำศึกษาแนวทาง E-Commerce และการจองบริการออนไลน์ เพื่อออกแบบขั้นตอนเลือกสินค้า กรอกที่อยู่ อัปโหลดสลิป และติดตามสถานะให้สั้นและเข้าใจง่าย และเลือกเครื่องมือดังนี้'),
  bullet('Figma: ออกแบบ High-Fidelity Prototype ก่อนลงมือเขียนโค้ด'),
  bullet('Visual Studio Code: สภาพแวดล้อมหลักในการพัฒนา'),
  bullet('Git / GitHub: ควบคุมเวอร์ชันและทำงานเป็นทีม'),
  bullet('React + Vite + React Router + Axios: พัฒนา Frontend'),
  bullet('Node.js + Express + Multer + Nodemailer: พัฒนา Backend API อัปโหลดไฟล์ และส่งอีเมล'),
  bullet('JWT + bcryptjs: ยืนยันตัวตนและเข้ารหัสรหัสผ่าน'),
  bullet('thai-address-database: ช่วยกรอกที่อยู่จัดส่งในกรุงเทพฯ'),
  bullet('JSON File Storage: จัดเก็บข้อมูลโดยไม่ต้องติดตั้งฐานข้อมูลภายนอก ตามขอบเขตโครงงานรายวิชา'),

  h1('4. การวิเคราะห์ระบบ (System Analysis)'),
  h2('4.1 Problem Statement'),
  body('ระบบเดิมของร้านเช่าชุดครุยพึ่งพาการสื่อสารด้วยโทรศัพท์และบันทึกกระดาษ ทำให้ค้นหาออเดอร์เก่าได้ยาก สต็อกไม่อัปเดตทันที และเสี่ยงปล่อยเช่าเกินจำนวนจริง (Inventory Over-allocation) โดยเฉพาะช่วงวันรับปริญญาที่คำสั่งซื้อพุ่งสูง'),

  h2('4.2 Requirement Analysis'),
  h3('Functional Requirements (จากระบบจริง)'),
  bullet('สมัครสมาชิก ยืนยันอีเมลด้วยรหัส OTP 6 หลัก อายุ 10 นาที พยายามได้ไม่เกิน 5 ครั้ง และส่งซ้ำได้ทุก 60 วินาที'),
  bullet('เข้าสู่ระบบด้วยอีเมล/รหัสผ่าน และบังคับยืนยันอีเมลก่อนใช้งาน'),
  bullet('ลืมรหัสผ่านและตั้งรหัสผ่านใหม่ด้วย OTP ทางอีเมล'),
  bullet('แสดงแคตตาล็อกชุดครุยศรีปทุม ค้นหา/กรองตามคณะ และดูรายละเอียดชุด'),
  bullet('เลือกระดับปริญญา ไซส์ วันเริ่ม–วันสิ้นสุด และตรวจสอบความว่างก่อนจอง'),
  bullet('เพิ่มลงตะกร้าหรือรายการโปรด และเช็คเอาต์หลายชุดได้'),
  bullet('สร้างการจองพร้อมคำนวณราคา = (ราคาต่อวัน × จำนวนวัน) + มัดจำ'),
  bullet('ชำระเงิน PromptPay อัปโหลดสลิป และระบุบัญชีรับเงินมัดจำคืน (PromptPay หรือบัญชีธนาคาร)'),
  bullet('ยกเลิกการจองที่ยังไม่ชำระ และระบบยกเลิกอัตโนมัติหากค้างชำระเกิน 24 ชั่วโมง'),
  bullet('พนักงานตรวจสลิป อนุมัติหรือปฏิเสธ พร้อมเหตุผลเมื่อปฏิเสธ'),
  bullet('พนักงานจัดเตรียมชุด มอบแมสเซนเจอร์ (ชื่อ เบอร์ ช่วงเวลาส่ง หมายเหตุ) และอัปเดตสถานะจัดส่ง'),
  bullet('ลูกค้ายืนยันรับชุด แจ้งส่งคืนพร้อมรูปภาพ และพนักงานรับเข้าคลังพร้อมบันทึกค่าปรับ'),
  bullet('พนักงานคืนมัดจำโดยอัปโหลดสลิปโอนคืน และคำนวณยอดสุทธิ = มัดจำ − ค่าปรับ'),
  bullet('แอดมินจัดการชุดครุย สต็อก ผู้ใช้ ข้อมูลหลัก รายงานรายได้ (ส่งออก CSV) บันทึกกิจกรรม และเทมเพลตแจ้งเตือน'),

  h3('Non-functional Requirements'),
  bullet('Usability: UI รองรับเดสก์ท็อปและมือถือ มีเมนูแยกตามบทบาท และป้ายสถานะภาษาไทย'),
  bullet('Performance: การค้นหาแคตตาล็อกและตรวจความว่างทำบนข้อมูล JSON ในเครื่องเซิร์ฟเวอร์ ตอบสนองเร็วเพียงพอสำหรับสาธิตและใช้งานจริงในขอบเขตรายวิชา'),
  bullet('Security: รหัสผ่านเข้ารหัส bcrypt รอบ 10 โทเค็น JWT อายุ 7 วัน OTP เก็บเป็นแฮช SHA-256 และไฟล์ users.json ไม่เผยแพร่บน GitHub'),
  bullet('Reliability: มีการจำกัดการเปลี่ยนสถานะด้วย STATUS_TRANSITIONS เพื่อไม่ให้ข้ามขั้นตอนผิดลำดับ'),

  h2('4.3 Persona Design'),
  bullet('Persona 1 ลูกค้าบัณฑิตศรีปทุม: ต้องการจองชุดคณะตนเองให้ทันวันรับปริญญา ใช้มือถือเป็นหลัก ต้องการเห็นสถานะจัดส่งและคืนมัดจำชัดเจน'),
  bullet('Persona 2 พนักงานร้านใกล้ SPU: ต้องการคิวงานรวมสำหรับตรวจสลิป เตรียมชุด ส่งแมสเซนเจอร์ รับคืน และคืนมัดจำ'),
  bullet('Persona 3 ผู้ดูแลระบบ: ต้องการคุมสต็อกไซส์×ระดับปริญญา จัดการผู้ใช้ และดูรายงานรายได้/ความจุคลัง'),

  h1('5. การออกแบบระบบ (System Design)'),
  h2('5.1 Use Case Diagram'),
  body('Actor หลักได้แก่ Customer, Staff, Admin และ System Use Case ของลูกค้าครอบคลุม Register, Verify Email, Login, Browse Catalog, Manage Cart/Favorites, Create Booking, Pay with Slip, Track Status, Confirm Delivery และ Submit Return ส่วนพนักงานครอบคลุม Verify Payment, Prepare Costume, Assign Messenger, Update Delivery, Receive Return และ Refund Deposit ส่วนแอดมินครอบคลุม Manage Costumes/Inventory, Master Data, Users, Reports, Activity Log และ Notification Templates'),
  bodyNoIndent('ไฟล์แผนภาพ: docs/diagrams/KruyMo-usecase-TH.drawio'),

  h2('5.2 Class Diagram'),
  body('คลาสหลักของระบบได้แก่ User, Booking, Payment, Costume, InventoryItem, Faculty, University, Size, CartItem, Favorite และ Notification โดย User 1 คนมีการจองได้หลายรายการ Booking อ้างอิง Costume + Size + DegreeLevel และเชื่อมกับ Payment และข้อมูล Messenger / RefundAccount ส่วน Costume 1 รายการมี InventoryItem หลายแถวตามไซส์และระดับปริญญา'),
  bodyNoIndent('ไฟล์แผนภาพ: docs/diagrams/KruyMo-class-TH.drawio'),

  h2('5.3 Sequence Diagram (Happy Path จริงของระบบ)'),
  body('ลำดับจริงของระบบเริ่มจากลูกค้าสร้างการจองสถานะ payment_pending จากนั้นชำระเงินและอัปโหลดสลิปทำให้สถานะเป็น pending พนักงานตรวจสลิปแล้วระบบเปลี่ยนสถานะเป็น preparing จากนั้น ready_to_ship → out_for_delivery → delivered เมื่อลูกค้าแจ้งคืนจะเป็น return_submitted พนักงานรับเข้าคลังเป็น returned และปิดงานด้วย deposit_refunded'),
  bodyNoIndent('ไฟล์แผนภาพ: docs/diagrams/KruyMo-sequence-booking-TH.drawio'),

  h2('5.4 สถานะการจองทั้งหมด (Booking Lifecycle)'),
  bodyNoIndent('ระบบกำหนดสถานะดังนี้ พร้อมป้ายภาษาไทยในหน้าเว็บ'),
  table([
    [{ text: 'สถานะในระบบ', w: 3200 }, { text: 'ความหมายบนหน้าเว็บ', w: 6160 }],
    [{ text: 'payment_pending', w: 3200 }, { text: 'รอชำระเงิน', w: 6160 }],
    [{ text: 'pending', w: 3200 }, { text: 'รอตรวจสลิป', w: 6160 }],
    [{ text: 'payment_verified / approved', w: 3200 }, { text: 'ตรวจสอบการชำระแล้ว / อนุมัติแล้ว', w: 6160 }],
    [{ text: 'preparing', w: 3200 }, { text: 'จัดเตรียมชุด', w: 6160 }],
    [{ text: 'ready_to_ship / ready_for_pickup', w: 3200 }, { text: 'พร้อมจัดส่ง', w: 6160 }],
    [{ text: 'out_for_delivery', w: 3200 }, { text: 'กำลังจัดส่ง', w: 6160 }],
    [{ text: 'delivered / picked_up', w: 3200 }, { text: 'ส่งถึงแล้ว', w: 6160 }],
    [{ text: 'return_submitted', w: 3200 }, { text: 'ลูกค้าส่งคืนแล้ว', w: 6160 }],
    [{ text: 'returned', w: 3200 }, { text: 'รับคืนแล้ว', w: 6160 }],
    [{ text: 'deposit_refunded', w: 3200 }, { text: 'คืนเงินมัดจำแล้ว', w: 6160 }],
    [{ text: 'rejected / cancelled', w: 3200 }, { text: 'ปฏิเสธ / ยกเลิก', w: 6160 }],
  ]),
  blank(),

  h2('5.5 Wireframe / หน้าจอจริงของเว็บไซต์'),
  body('คณะผู้พัฒนาออกแบบด้วย Figma แล้วพัฒนาระบบจริงด้วย React ครอบคลุมหน้าจอดังนี้'),
  h3('ฝั่งลูกค้า'),
  bullet('หน้าแรก (/) แนะนำแบรนด์และลิงก์ไปแคตตาล็อก / วิธีเช่า'),
  bullet('วิธีเช่า (/how-to-rent) อธิบายขั้นตอนเลือกชุด → จอง → PromptPay → แมสเซนเจอร์ → คืนชุด'),
  bullet('เกี่ยวกับเรา (/about) เล่าเรื่องร้าน ช่องทางติดต่อ แผนที่ และเวลาทำการ จันทร์–เสาร์ 09:00–18:00'),
  bullet('แคตตาล็อก (/catalog) และรายละเอียดชุด (/costume/:id)'),
  bullet('ฟอร์มจอง (/booking/:id) กรอกที่อยู่จัดส่งกรุงเทพฯ'),
  bullet('ชำระเงิน (/payment/:bookingId) แสดง QR PromptPay และอัปโหลดสลิป'),
  bullet('ประวัติและรายละเอียดการจอง (/bookings, /bookings/:id)'),
  bullet('ตะกร้า (/cart) รายการโปรด (/favorites) และโปรไฟล์ (/profile)'),
  h3('ฝั่งพนักงาน'),
  bullet('แดชบอร์ด (/staff) คำสั่งเช่า (/staff/bookings) จัดส่ง–รับคืน (/staff/dispatch) คืนมัดจำ (/staff/refund)'),
  h3('ฝั่งแอดมิน'),
  bullet('แดชบอร์ด (/admin) คำสั่งเช่า (/admin/bookings) จัดการชุดครุยและสต็อก (/admin/costumes)'),
  bullet('ข้อมูลหลัก (/admin/master-data) ผู้ใช้ (/admin/users) รายงาน (/admin/reports)'),
  bullet('บันทึกกิจกรรม (/admin/activity) เทมเพลตแจ้งเตือน (/admin/notifications)'),
  bullet('แอดมินใช้หน้าจัดส่ง–รับคืนและคืนมัดจำชุดเดียวกับพนักงานได้ที่ /admin/dispatch และ /admin/refund'),

  h2('5.6 System Architecture'),
  body('สถาปัตยกรรมแบ่งเป็น Presentation Layer (React SPA) Application Layer (REST API Express + JWT + Multer) และ Data Layer (ไฟล์ JSON + โฟลเดอร์ uploads) มีบริการภายนอก Gmail SMTP สำหรับ OTP และ PromptPay แบบแมนนวลสำหรับการชำระเงิน'),
  bodyNoIndent('ไฟล์แผนภาพ: docs/diagrams/ (Use Case, Class, Sequence)'),

  h1('6. เทคโนโลยีที่ใช้จริงในโปรเจกต์'),
  table([
    [{ text: 'ส่วนงาน', w: 3200 }, { text: 'เทคโนโลยี / แพ็กเกจ', w: 6160 }],
    [{ text: 'Frontend', w: 3200 }, { text: 'React 18, Vite 6, React Router 7, Axios, Lucide React, thai-address-database', w: 6160 }],
    [{ text: 'Backend', w: 3200 }, { text: 'Node.js, Express 4, Multer, UUID, dotenv, cors', w: 6160 }],
    [{ text: 'Authentication', w: 3200 }, { text: 'jsonwebtoken, bcryptjs', w: 6160 }],
    [{ text: 'Email', w: 3200 }, { text: 'Nodemailer (Gmail SMTP พอร์ต 465)', w: 6160 }],
    [{ text: 'Data Storage', w: 3200 }, { text: 'JSON files ใน backend/data และไฟล์สลิป/รูปใน uploads/', w: 6160 }],
    [{ text: 'Design / IDE / VCS', w: 3200 }, { text: 'Figma, Visual Studio Code, Git / GitHub', w: 6160 }],
  ]),
  blank(),

  h1('7. Data Schema (JSON) ของระบบจริง'),
  body('ข้อมูลทั้งหมดอยู่ที่ backend/data โดยโครงสร้างสำคัญมีดังนี้'),
  bullet('users.json: id, name, email, password (hash), phone, role, emailVerified, address, refundAccount และฟิลด์ OTP'),
  bullet('universities.json / faculties.json / sizes.json: ข้อมูลหลักของศรีปทุม 7 คณะ และไซส์ 38–50 พร้อมช่วงส่วนสูง'),
  bullet('costumes.json: ชุดครุยต่อคณะ ราคาต่อวัน (ค่าเริ่มต้น 350 บาท) มัดจำ (1,500 บาท) รูปภาพ และคำอธิบาย'),
  bullet('inventory.json: แถวสต็อก { costumeId, sizeId, degreeLevel, quantity } โดยค่าเริ่มต้น 10 ตัวต่อไซส์ต่อระดับ รวมประมาณ 390 ตัวต่อคณะ'),
  bullet('bookings.json: การจองครบวงจร รวม deliveryAddress, messenger, refundAccount, returnImages, penaltyAmount, refundSlipImage, checkoutBatchId'),
  bullet('payments.json: สลิปและสถานะ pending / verified / rejected'),
  bullet('cart.json, favorites.json, notifications.json, notificationTemplates.json, activityLog.json: ฟังก์ชันเสริม'),
  body('หมายเหตุด้านความปลอดภัย: ไฟล์ users.json ไม่ถูกอัปโหลดขึ้น GitHub และมีสคริปต์รีเซ็ตข้อมูลทดลองสำหรับสาธิต'),

  h1('8. การพัฒนาระบบ (System Development) — เกณฑ์หมวดที่ 3'),
  h2('8.1 Frontend Interface (10 คะแนน)'),
  body('Frontend พัฒนาด้วย React และ Vite แยก Layout และหน้าจอตามบทบาท มี ProtectedRoute ป้องกันสิทธิ์ มีหน้าจอครบทั้งลูกค้า พนักงาน และแอดมิน รวมถึงหน้าชำระเงินที่บังคับให้อัปโหลดสลิปหรือยกเลิกก่อนออกจากหน้า และหน้าจัดส่งที่ทำงานเป็นคิวตามสถานะ'),
  h2('8.2 Backend API (10 คะแนน)'),
  body('Backend พัฒนาด้วย Express มีเส้นทางหลัก /api/auth /api/costumes /api/bookings /api/payments /api/cart /api/favorites /api/users /api/reports และเส้นทางอัปโหลดไฟล์ มี middleware authenticate / authorize มีงานพื้นหลังใน jobs.js สำหรับยกเลิกการจองค้างชำระเกิน 24 ชั่วโมง และส่งการแจ้งเตือนใกล้วันคืนชุด'),
  h2('8.3 Database ในรูปแบบ JSON (10 คะแนน)'),
  body('ระบบอ่าน–เขียนไฟล์ JSON ผ่านยูทิลิตีของเซิร์ฟเวอร์ ทำให้จัดการข้อมูลจริงได้โดยไม่ต้องติดตั้งฐานข้อมูลภายนอก ซึ่งเหมาะสมกับขอบเขตโครงงานรายวิชานี้ และยังรองรับการอัปโหลดไฟล์สลิป/รูปคืนชุดไปยังโฟลเดอร์ uploads'),
  bodyNoIndent('คลังโค้ด: https://github.com/PhisanuJay/KruyMo'),

  h1('9. การทดสอบระบบ (System Testing) — เกณฑ์หมวดที่ 4'),
  body('คณะผู้จัดทำทดสอบแบบ Manual Testing และ User Acceptance Testing ตามเอกสาร docs/User_Acceptance_Testing.pdf โดยครอบคลุมลูกค้า พนักงาน แอดมิน และกรณีเชิงลบ เช่น เข้าหน้าผิดบทบาท หรืออัปโหลดสลิปซ้ำหลังถูกปฏิเสธ'),
  h3('บัญชีทดสอบสำหรับสาธิต'),
  table([
    [{ text: 'บทบาท', w: 2400 }, { text: 'อีเมล', w: 4200 }, { text: 'รหัสผ่าน', w: 2760 }],
    [{ text: 'Admin', w: 2400 }, { text: 'admin@gmail.com', w: 4200 }, { text: '12345678', w: 2760 }],
    [{ text: 'Staff', w: 2400 }, { text: 'staff@gmail.com', w: 4200 }, { text: '12345678', w: 2760 }],
    [{ text: 'Customer', w: 2400 }, { text: 'customer@gmail.com', w: 4200 }, { text: '12345678', w: 2760 }],
  ]),
  blank(),
  h3('กรณีทดสอบหลักที่ผ่านแล้ว'),
  bullet('ลูกค้าจองชุดคณะเทคโนโลยีสารสนเทศ เลือกไซส์และระดับปริญญา แล้วชำระเงินด้วยสลิป'),
  bullet('พนักงานตรวจสลิป ผ่านคิวจัดเตรียม มอบแมสเซนเจอร์ และอัปเดตจัดส่งจนถึงลูกค้า'),
  bullet('ลูกค้าแจ้งคืนชุด พนักงานรับเข้าคลัง บันทึกค่าปรับ (เช่น 0 / 200 / 500 / 800 / 1,500) แล้วคืนมัดจำ'),
  bullet('แอดมินปรับจำนวนสต็อกในเมทริกซ์ไซส์×ระดับปริญญา และดูรายงานรายได้'),
  body('คะแนนหมวดนี้ให้อ้างอิงหลักฐานและคะแนนจากกิจกรรม Workshop #7 ตามที่อาจารย์กำหนด'),

  h1('10. การบริหารจัดการโครงงานและ Progress Report — เกณฑ์หมวดที่ 5 และ 6'),
  h2('10.1 การแบ่งงานในทีม'),
  body('ทีมแบ่งงานตามความเชี่ยวชาญ ได้แก่ Frontend ฝั่งลูกค้า Backend และการเชื่อมต่อ API ระบบ Admin/Staff และเอกสารทดสอบ/นำเสนอ โดยใช้ GitHub เป็นศูนย์กลางรวมงาน'),
  h2('10.2 ความก้าวหน้าตามแผน'),
  bullet('ระยะข้อเสนอโครงงาน: วิเคราะห์ปัญหาและกำหนดขอบเขต — เสร็จสมบูรณ์'),
  bullet('ระยะออกแบบ: Persona, Use Case, Class, Sequence, Architecture, Data Schema — เสร็จสมบูรณ์'),
  bullet('ระยะพัฒนาลูกค้า: แคตตาล็อก จอง ตะกร้า ชำระเงิน ติดตามสถานะ — เสร็จสมบูรณ์'),
  bullet('ระยะพัฒนาพนักงาน/แอดมิน: ตรวจสลิป จัดส่ง รับคืน คืนมัดจำ สต็อก รายงาน — เสร็จสมบูรณ์'),
  bullet('ระยะทดสอบและเอกสาร: UAT รายงานฉบับสมบูรณ์ และเตรียมสาธิต — เสร็จสมบูรณ์'),
  h2('10.3 การใช้ Git / GitHub'),
  body('โปรเจกต์เผยแพร่ที่ https://github.com/PhisanuJay/KruyMo มีประวัติการพัฒนาฟีเจอร์สำคัญ เช่น ระบบจอง ระบบปฏิบัติการพนักงาน การจัดการสต็อก และการจัดทำเอกสารสถาปัตยกรรม'),
  h2('10.4 ปัญหาที่พบและแนวทางแก้ไขระหว่างพัฒนา'),
  bullet('ชื่อเมนูที่ใกล้กันทำให้สับสน → ปรับเป็น “คำสั่งเช่า” และ “จัดส่ง–รับคืน”'),
  bullet('ผู้ใช้สับสนระหว่างจำนวนในคลังกับความว่างตามวันจอง → แยกสูตรคำนวณและเขียนคำอธิบายในหน้าจอ'),
  bullet('ข้อมูลผู้ใช้ไม่ควรเผยแพร่สาธารณะ → ไม่อัปโหลด users.json และทำสคริปต์รีเซ็ตบัญชีทดลอง'),
  bullet('การชำระเงินยังไม่เชื่อมธนาคารอัตโนมัติ → ใช้ PromptPay QR แบบแมนนวลพร้อมตรวจสลิปโดยพนักงาน ซึ่งเหมาะสมกับขอบเขตโครงงาน'),

  h1('11. ผลที่คาดว่าจะได้รับ / ผลที่ได้รับจริง'),
  bullet('ลูกค้าจองชุดครุยศรีปทุมออนไลน์ได้ตลอด 24 ชั่วโมง และติดตามสถานะได้เอง'),
  bullet('ร้านลดเวลาประสานงานด้วยโทรศัพท์ เพราะมีคิวงานและสถานะชัดเจน'),
  bullet('สต็อกถูกควบคุมตามคณะ ไซส์ และระดับปริญญา ลดความเสี่ยงเช่าเกินจำนวน'),
  bullet('การคืนมัดจำโปร่งใส เพราะมีบัญชีรับเงิน ค่าปรับ และสลิปโอนคืนบันทึกในระบบ'),

  h1('12. บทสรุปและการประเมินผลตามแนวทาง SDLC — เกณฑ์หมวดที่ 7'),
  body('โครงงาน KruyMo ดำเนินการตามแนวทาง Software Development Life Cycle ครบทุกขั้นตอน ตั้งแต่การเสนอหัวข้อ การวิเคราะห์และออกแบบด้วยเอกสาร UML การพัฒนาระบบ Frontend Backend และ JSON การทดสอบด้วย UAT การบริหารจัดการด้วย GitHub และการเตรียมสาธิตระบบจริง'),
  body('ระบบที่พัฒนาแล้วรองรับผู้ใช้สามบทบาทครบวงจร ตั้งแต่เลือกชุดครุยคณะศรีปทุม จองและชำระเงิน จัดส่งด้วยแมสเซนเจอร์ จนถึงคืนมัดจำ ซึ่งสอดคล้องกับวัตถุประสงค์รายวิชา CSI 204 และเกณฑ์ประเมินโครงงานฉบับสมบูรณ์'),
  h2('แนวทางการสาธิตระบบ (แนะนำสำหรับวันนำเสนอ)'),
  bullet('ลูกค้า: เลือกชุดคณะเทคโนโลยีสารสนเทศ → จอง → ชำระเงิน PromptPay → อัปโหลดสลิป'),
  bullet('พนักงาน/แอดมิน: ตรวจสลิป → จัดเตรียม → มอบแมสเซนเจอร์ → อัปเดตจัดส่ง'),
  bullet('ลูกค้า: ยืนยันรับชุด → แจ้งส่งคืน'),
  bullet('พนักงาน/แอดมิน: รับเข้าคลัง → คืนมัดจำ'),
  bullet('แอดมิน: แสดงเมทริกซ์สต็อกและรายงานรายได้'),

  h1('ภาคผนวก'),
  h2('ภาคผนวก ก วิธีรันระบบ'),
  bodyNoIndent('1) เข้าโฟลเดอร์ backend แล้วรันคำสั่ง npm install และ npm start (พอร์ต 3001)'),
  bodyNoIndent('2) เข้าโฟลเดอร์ frontend แล้วรันคำสั่ง npm install และ npm run dev (พอร์ต 5173)'),
  bodyNoIndent('3) เปิดเบราว์เซอร์ที่ http://localhost:5173'),
  h2('ภาคผนวก ข ข้อมูลร้านและช่องทางติดต่อในระบบ'),
  bullet('อีเมล: kruymo@gmail.com'),
  bullet('โทรศัพท์: 081-234-5678'),
  bullet('Instagram / Facebook: @kruymo.spu'),
  bullet('Line: @kruymo'),
  bullet('PromptPay สำหรับรับชำระ: 097-070-9141 (ชื่อบัญชี KruyMo)'),
  bullet('เวลาทำการ: จันทร์–เสาร์ 09:00–18:00'),
  h2('ภาคผนวก ค ไฟล์ประกอบการประเมิน'),
  bullet('docs/diagrams/KruyMo-usecase-TH.drawio'),
  bullet('docs/diagrams/KruyMo-class-TH.drawio'),
  bullet('docs/diagrams/KruyMo-sequence-booking-TH.drawio'),
  bullet('docs/diagrams/'),
  bullet('docs/User_Acceptance_Testing.pdf'),
  bullet('https://github.com/PhisanuJay/KruyMo'),
];

const doc = new Document({
  creator: 'KruyMo Team',
  title: 'โครงงานระบบเช่าชุดครุยออนไลน์ (KruyMo)',
  sections: [{
    properties: {
      page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } },
    },
    children,
  }],
});

const outThai = path.join(__dirname, 'ข้อเสนอโครงงาน_KruyMo_ฉบับสมบูรณ์.docx');
const outEn = path.join(__dirname, 'Final_Project_Report_KruyMo.docx');
const buf = await Packer.toBuffer(doc);
fs.writeFileSync(outThai, buf);
try {
  fs.writeFileSync(outEn, buf);
} catch (e) {
  console.warn('ข้าม Final_Project_Report_KruyMo.docx (อาจเปิดอยู่):', e.message);
}
console.log('✅ สร้างไฟล์แล้ว:', outThai);
