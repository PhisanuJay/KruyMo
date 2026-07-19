/** ข้อมูลร้านสำหรับแสดงฝั่งลูกค้า (จุดส่งคืนชุด) */
export const STORE_INFO = {
  name: 'KruyMo',
  returnAddress: '123/4 ถ.พหลโยธิน แขวงสามเสนใน เขตพญาไท กรุงเทพฯ 10400',
  returnHours: 'จันทร์–เสาร์ 09:00–18:00',
  returnPhone: '081-234-5678',
  returnNotes: [
    'แพ็คชุดครบทุกชิ้น (ชุด หมวก สาย และอุปกรณ์)',
    'ส่งชุดกลับมาตามที่อยู่ร้านด้านบน (ไปรษณีย์/ขนส่ง) ภายในวันที่กำหนดในการจอง',
    'หลังส่งชุดกลับมาแล้ว กด "แจ้งว่าส่งคืนแล้ว" ในระบบ',
  ],
};

/** ข้อมูลติดต่อหน้า “เกี่ยวกับเรา” (mock ชั่วคราว) */
export const ABOUT_CONTACT = {
  brand: 'KruyMo',
  tagline: 'ระบบเช่าชุดครุยบัณฑิตออนไลน์สำหรับนักศึกษา มหาวิทยาลัยศรีปทุม',
  blurb:
    'KruyMo ช่วยให้การเช่าชุดครุยง่ายขึ้น ตั้งแต่เลือกคณะ/ไซส์ จองออนไลน์ ชำระเงิน จัดส่งแมสฯ จนถึงคืนมัดจำ — ร้านจำลองอยู่บริเวณ ม.ศรีปทุม บางเขน',
  hours: 'จันทร์–เสาร์ 09:00–18:00 น. (อาทิตย์หยุด)',
  phone: '081-234-5678',
  email: 'hello@kruymo.com',
  instagram: {
    handle: '@kruymo.spu',
    url: 'https://instagram.com/kruymo.spu',
  },
  line: {
    id: '@kruymo',
    url: 'https://line.me/R/ti/p/@kruymo',
  },
  facebook: {
    name: 'KruyMo เช่าชุดครุยศรีปทุม',
    url: 'https://facebook.com/kruymo.spu',
  },
  address: 'ใกล้ มหาวิทยาลัยศรีปทุม บางเขน ถนนพหลโยธิน แขวงเสนานิคม เขตจตุจักร กรุงเทพฯ 10900',
  /** พิกัด/แผนที่ — ปักที่ ม.ศรีปทุม บางเขน */
  mapEmbedUrl:
    'https://maps.google.com/maps?q=%E0%B8%A1%E0%B8%AB%E0%B8%B2%E0%B8%A7%E0%B8%B4%E0%B8%97%E0%B8%A2%E0%B8%B2%E0%B8%A5%E0%B8%B1%E0%B8%A2%E0%B8%A8%E0%B8%A3%E0%B8%B5%E0%B8%9B%E0%B8%97%E0%B8%B8%E0%B8%A1+%E0%B8%9A%E0%B8%B2%E0%B8%87%E0%B9%80%E0%B8%82%E0%B8%99&hl=th&z=16&output=embed',
  mapExternalUrl:
    'https://www.google.com/maps/search/?api=1&query=มหาวิทยาลัยศรีปทุม+บางเขน',
};
