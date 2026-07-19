import {
  searchAddressByProvince,
} from 'thai-address-database';

/** จัดส่งเฉพาะกรุงเทพมหานคร */
export const BANGKOK = 'กรุงเทพมหานคร';
export const THAI_PROVINCES = [BANGKOK];

const thSort = (a, b) => String(a).localeCompare(String(b), 'th');

/** ไลบรารี default maxResult=20 — ขอเยอะเพื่อดึงครบทั้งจังหวัด */
const ALL = 10000;

const rowsForProvince = (province = BANGKOK) => {
  const p = province || BANGKOK;
  return (searchAddressByProvince(p, ALL) || []).filter((row) => row.province === p);
};

export const getAmphoes = (province = BANGKOK) => (
  [...new Set(rowsForProvince(province).map((row) => row.amphoe))].sort(thSort)
);

export const getDistricts = (province = BANGKOK, amphoe) => (
  [...new Set(
    rowsForProvince(province)
      .filter((row) => row.amphoe === amphoe)
      .map((row) => row.district),
  )].sort(thSort)
);

export const getPostalCodes = (province = BANGKOK, amphoe, district) => (
  [...new Set(
    rowsForProvince(province)
      .filter((row) => row.amphoe === amphoe && row.district === district)
      .map((row) => String(row.zipcode)),
  )].sort()
);
