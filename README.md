# KruyMo - ระบบเช่าชุดครุยบัณฑิตออนไลน์

ระบบเช่าชุดครุยออนไลน์ แยก 3 ฝั่งผู้ใช้งาน: **ลูกค้า (Customer)**, **พนักงาน (Staff)**, **แอดมิน (Admin)**

## เอกสารโครงงาน

- ข้อเสนอโครงงาน: [docs/ข้อเสนอโครงงานเช่าชุดครุย.pdf](./docs/ข้อเสนอโครงงานเช่าชุดครุย.pdf)
- Final Project / ข้อเสนอฉบับสมบูรณ์:
  - Word: [docs/ข้อเสนอโครงงาน_KruyMo_ฉบับสมบูรณ์.docx](./docs/ข้อเสนอโครงงาน_KruyMo_ฉบับสมบูรณ์.docx)
  - Markdown: [docs/Final_Project_Report_KruyMo.md](./docs/Final_Project_Report_KruyMo.md)
  - UML / diagrams (5):
    1. [Use Case](./docs/diagrams/KruyMo-usecase.png)
    2. [Class Diagram](./docs/diagrams/KruyMo-class-diagram.png)
    3. [Sequence Diagram](./docs/diagrams/KruyMo-sequence-diagram.png)
    4. [System Architecture](./docs/diagrams/KruyMo-system-architecture.png)
    5. [Data Schema](./docs/diagrams/KruyMo-data-schema.png)
    - draw.io sources: [docs/diagrams/](./docs/diagrams/)
  - SDLC tools: [docs/SDLC_Tools_KruyMo.md](./docs/SDLC_Tools_KruyMo.md)
  - UAT: [docs/User_Acceptance_Testing.pdf](./docs/User_Acceptance_Testing.pdf)

## Tech Stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express (REST API)
- **Storage:** JSON files (ไม่ใช้ database)

## โครงสร้างโปรเจกต์

```
/backend
  /data        <- ไฟล์ JSON ทั้งหมด
  /uploads     <- รูปภาพที่อัปโหลด
  /routes      <- API routes
  server.js
/frontend
  /src
    /pages     <- หน้าเว็บแยกตาม role
    /components
    /services  <- API calls
```

## วิธีรัน

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

API จะรันที่ `http://localhost:3001`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

เว็บจะเปิดที่ `http://localhost:5173`

### เข้าผ่าน IP ในเครือข่าย (มือถือ / เครื่องอื่น)

1. ให้เครื่องที่รัน Backend + Frontend อยู่ Wi‑Fi / LAN เดียวกับเครื่องที่จะเปิดเว็บ
2. หา IP ของเครื่องที่รันระบบ (PowerShell):

```powershell
ipconfig
```

ดูที่ `IPv4 Address` เช่น `192.168.1.25`

3. เปิดบนเครื่องอื่น / มือถือ:

```text
http://192.168.1.25:5173
```

(แทนด้วย IP จริงของเครื่องคุณ)

4. ถ้าเข้าไม่ได้ ให้เปิด Firewall อนุญาตพอร์ต `5173` และ `3001` บน Windows

> Frontend ใช้ proxy ไป Backend ให้แล้ว จึงเปิดแค่พอร์ต `5173` ก็พอสำหรับใช้งานปกติ

## บัญชีทดสอบ

| Role | Email | Password |
|------|-------|----------|
| ลูกค้า | customer@gmail.com | 12345678 |
| พนักงาน | staff@gmail.com | 12345678 |
| แอดมิน | admin@gmail.com | 12345678 |

## ฟีเจอร์หลัก

### ฝั่งลูกค้า
- สมัครสมาชิก / เข้าสู่ระบบ / ลืมรหัสผ่าน
- ค้นหาและกรองชุดครุย (มหาวิทยาลัย, คณะ, ไซส์, ระดับปริญญา)
- จองชุด + คำนวณค่าเช่า/มัดจำอัตโนมัติ
- ชำระเงิน (QR PromptPay + อัปโหลดสลิป)
- ติดตามสถานะ (Timeline/Stepper)
- รับ-คืนชุด + อัปโหลดรูปสภาพชุด
- แจ้งเตือน (Notification Bell)

### ฝั่งพนักงาน
- Dashboard ภาพรวม
- จัดการคำสั่งเช่า (อนุมัติ/ปฏิเสธ)
- รับ-คืนชุด (ค้นหาเลขจอง + อัปโหลดรูป + ค่าปรับ)
- คืนเงินมัดจำ

### ฝั่งแอดมิน
- Dashboard สถิติ (รายได้, การเช่า, สต็อก)
- CRUD ชุดครุย (อัปโหลดหลายรูป)
- CRUD มหาวิทยาลัย/คณะ/ไซส์
- จัดการผู้ใช้ + กำหนด role
- รายงานรายได้ + สต็อก + Export CSV
- ประวัติการทำรายการ (Activity Log)
- ตั้งค่าเทมเพลตแจ้งเตือน

## การออกแบบ UI

- โทนสี **สดใส colorful** แยกตามมหาวิทยาลัย/คณะ
- พื้นหลังขาว/สีอ่อน ให้สีประจำคณะโดดเด่น
- Font: Noto Sans Thai (รองรับภาษาไทย)
- Responsive รองรับมือถือและเดสก์ท็อป
- ป้ายสถานะสี: เหลือง=รอดำเนินการ, เขียว=สำเร็จ, แดง=ยกเลิก/ปฏิเสธ

## API Endpoints

| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| POST | /api/auth/register | สมัครสมาชิก |
| POST | /api/auth/login | เข้าสู่ระบบ |
| GET | /api/costumes | รายการชุดครุย |
| POST | /api/bookings | สร้างการจอง |
| PATCH | /api/bookings/:id/status | อัปเดตสถานะ |
| POST | /api/payments/:bookingId/slip | อัปโหลดสลิป |
| POST | /api/upload | อัปโหลดรูปภาพ |
| GET | /api/reports/dashboard | ข้อมูลแดชบอร์ด |

ดูรายละเอียด API เพิ่มเติมใน source code ที่ `backend/routes/`
