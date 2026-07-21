const DEGREE_RANK = { bachelor: 0, master: 1, doctoral: 2 };

export const DEGREE_OPTIONS = [
  { value: 'bachelor', label: 'ปริญญาตรี' },
  { value: 'master', label: 'ปริญญาโท' },
  { value: 'doctoral', label: 'ปริญญาเอก' },
];

/** สลับไฟล์รูปตามระดับชั้น โดยคงสีสาย (เช่น gown-bachelor-yellow → gown-master-yellow) */
export function gownImageForDegree(imagePath, degreeLevel, sashColor) {
  const color = sashColor
    || (String(imagePath || '').match(/\/images\/gowns\/gown-(?:bachelor|master|doctoral)-([a-z]+)\./i)?.[1]);
  if (!color) return imagePath || null;
  if (!degreeLevel) return imagePath || `/images/gowns/gown-bachelor-${color}.jpg`;
  return `/images/gowns/gown-${degreeLevel}-${color}.jpg`;
}

/** แคตตาล็อกลูกค้า: คณะละหนึ่งชุด (prefer ปริญญาตรี) — เลือกระดับตอนจอง */
export function uniqueCostumesByFaculty(costumes = []) {
  const best = new Map();
  for (const c of costumes) {
    const key = `${c.universityId || ''}:${c.facultyId || c.id}`;
    const prev = best.get(key);
    const rank = DEGREE_RANK[c.degreeLevel] ?? 9;
    const prevRank = prev ? (DEGREE_RANK[prev.degreeLevel] ?? 9) : 99;
    if (!prev || rank < prevRank) best.set(key, c);
  }
  return [...best.values()];
}

/** ชื่อแสดงในแคตตาล็อก — ไม่ระบุระดับชั้น */
export function catalogCostumeName(costume) {
  if (costume?.faculty?.name) {
    const uni = costume.university?.shortName || costume.university?.name || 'ศรีปทุม';
    return `ชุดครุย${uni} ${costume.faculty.name}`;
  }
  return String(costume?.name || '').replace(/ปริญญา(ตรี|โท|เอก)\s*/g, '') || 'ชุดครุย';
}

/** ชื่อตามระดับที่เลือก (หน้า detail / พรีวิวแอดมิน) */
export function costumeDisplayName(costume, degreeLevel) {
  const degreeLabel = DEGREE_OPTIONS.find((o) => o.value === degreeLevel)?.label;
  if (degreeLabel) {
    return `ชุดครุย${degreeLabel} ${costume?.university?.shortName || 'ศรีปทุม'} ${costume?.faculty?.name || ''}`.trim();
  }
  return catalogCostumeName(costume);
}
