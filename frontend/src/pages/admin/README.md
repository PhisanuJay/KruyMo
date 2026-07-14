# Admin — แบ่งงาน 2 คน

โครงสร้างนี้แยกหน้าแอดมินตามโดเมน เพื่อทำงานคู่ขนานแล้ว conflict น้อย

| คน | โฟลเดอร์ | หน้าที่ |
|----|----------|---------|
| **คนที่ 1** | `catalog/` | คลังสินค้า / ชุดครุย / ข้อมูลหลัก / แดชบอร์ด |
| **คนที่ 2** | `system/` | ผู้ใช้ / รายงาน / ประวัติ / แจ้งเตือน |

---

## คนที่ 1 — Catalog (คลัง & ข้อมูลหลัก)

### Frontend
| ไฟล์ | Route |
|------|-------|
| `catalog/AdminDashboard.jsx` | `/admin` |
| `catalog/AllBookings.jsx` | `/admin/bookings` |
| `catalog/CostumeManager.jsx` | `/admin/costumes` |
| `catalog/MasterDataManager.jsx` | `/admin/master-data` |

### Backend ที่เกี่ยวข้อง
- `backend/routes/costumes.js`
- `backend/routes/masterData.js`
- `backend/routes/upload.js`
- `backend/data/costumes.json`, `inventory.json`, `universities.json`, `faculties.json`, `sizes.json`

### API ใน `services/api.js`
- `costumeAPI`
- `masterDataAPI`
- `uploadAPI`
- `reportAPI.dashboard` / `reportAPI.stock` (ใช้ในแดชบอร์ด)

---

## คนที่ 2 — System (ระบบ & รายงาน)

### Frontend
| ไฟล์ | Route |
|------|-------|
| `system/UserManager.jsx` | `/admin/users` |
| `system/Reports.jsx` | `/admin/reports` |
| `system/ActivityLog.jsx` | `/admin/activity` |
| `system/NotificationTemplates.jsx` | `/admin/notifications` |

### Backend ที่เกี่ยวข้อง
- `backend/routes/users.js`
- `backend/routes/reports.js`
- `backend/routes/notifications.js`
- `backend/data/users.json`, `activityLog.json`, `notificationTemplates.json`, `notifications.json`

### API ใน `services/api.js`
- `userAPI`
- `reportAPI` (โดยเฉพาะ `revenue`, `activityLog`)
- `notificationAPI`

---

## ไฟล์ที่ใช้ร่วมกัน (อย่าแก้พร้อมกันถ้าไม่จำเป็น)

- `frontend/src/App.jsx` — เพิ่ม/ย้าย route
- `frontend/src/components/DashboardLayout.jsx` — เมนู sidebar แอดมิน
- `frontend/src/services/api.js` — แก้เฉพาะบล็อก API ของตัวเอง
- `backend/server.js` — mount route
- `backend/middleware/auth.js`

---

## แนวทางทำงานคู่กัน

1. คนละโฟลเดอร์ (`catalog/` vs `system/`) และคนละ route ฝั่ง backend
2. ถ้าต้องแตะไฟล์ร่วม → คุยหรือ merge ทีละ commit สั้นๆ
3. ทดสอบด้วยบัญชี `admin@kruymo.com` / `admin123`
