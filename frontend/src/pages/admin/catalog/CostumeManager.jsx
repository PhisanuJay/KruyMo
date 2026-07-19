import { useState, useEffect, useMemo } from 'react';
import {
  Eye, Search, Plus, RotateCcw, Pencil, Trash2, Shirt,
  CheckCircle2, Clock, Droplets, Wrench, PackageX,
} from 'lucide-react';
import { costumeAPI, masterDataAPI, uploadAPI, bookingAPI } from '../../../services/api';
import DashboardLayout from '../../../components/DashboardLayout';
import UploadBox from '../../../components/UploadBox';

const DEGREE_SHORT = { bachelor: 'ป.ตรี', master: 'ป.โท', doctoral: 'ป.เอก' };
const DEGREE_BADGE = {
  bachelor: { bg: '#DCFCE7', color: '#16A34A' },
  master: { bg: '#DBEAFE', color: '#2563EB' },
  doctoral: { bg: '#EDE9FE', color: '#7C3AED' },
};

function formatCostumeCode(id) {
  const num = String(id || '').replace(/\D/g, '').slice(-3) || '000';
  return `GRD-${num.padStart(3, '0')}`;
}

function occupancyForCostume(bookings, costumeId) {
  const list = bookings.filter((b) => b.costumeId === costumeId);
  const rented = list.filter((b) => ['delivered', 'picked_up', 'out_for_delivery'].includes(b.status)).length;
  const cleaning = list.filter((b) => b.status === 'returned' && !(b.penaltyAmount > 0)).length;
  const repair = list.filter((b) => b.status === 'returned' && (b.penaltyAmount || 0) > 0).length;
  const reserved = list.filter((b) => (
    ['approved', 'preparing', 'ready_to_ship', 'ready_for_pickup'].includes(b.status)
  )).length;
  return { rented, cleaning, repair, reserved };
}

function deriveRowStatus({ available, rented, cleaning, repair, stock }) {
  if (stock <= 0) {
    return { key: 'unavailable', label: 'ไม่พร้อมใช้', color: '#DC2626', bg: '#FEE2E2' };
  }
  if (repair > 0 && available === 0) {
    return { key: 'repair', label: 'ซ่อมแซม', color: '#7C3AED', bg: '#EDE9FE' };
  }
  if (cleaning > 0 && available === 0 && rented === 0) {
    return { key: 'cleaning', label: 'ซักทำความสะอาด', color: '#D97706', bg: '#FEF3C7' };
  }
  if (rented > 0 && available === 0) {
    return { key: 'rented', label: 'กำลังเช่า', color: '#2563EB', bg: '#DBEAFE' };
  }
  return { key: 'available', label: 'พร้อมให้เช่า', color: '#16A34A', bg: '#DCFCE7' };
}

function SummaryCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="booking-sum-card">
      <div className="booking-sum-icon" style={{ color, background: bg }}>
        <Icon size={20} />
      </div>
      <div>
        <div className="booking-sum-label">{label}</div>
        <div className="booking-sum-value">
          {value}
          <span className="costume-sum-unit"> ชุด</span>
        </div>
      </div>
    </div>
  );
}

export default function CostumeManager() {
  const [costumes, setCostumes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [images, setImages] = useState([]);
  const [viewing, setViewing] = useState(null);

  const [search, setSearch] = useState('');
  const [universityFilter, setUniversityFilter] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const load = () => {
    setLoading(true);
    Promise.all([
      costumeAPI.getAll(),
      bookingAPI.getAll(),
      masterDataAPI.universities.getAll(),
      masterDataAPI.faculties.getAll(),
      masterDataAPI.sizes.getAll(),
    ])
      .then(([c, b, u, f, s]) => {
        setCostumes(c.data || []);
        setBookings(b.data || []);
        setUniversities(u.data || []);
        setFaculties(f.data || []);
        setSizes(s.data || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const enriched = useMemo(() => costumes.map((c) => {
    const occ = occupancyForCostume(bookings, c.id);
    const total = c.stock || 0;
    const available = Math.max(0, total - occ.rented - occ.cleaning - occ.repair - occ.reserved);
    const status = deriveRowStatus({ available, ...occ, stock: total });
    return {
      ...c,
      code: formatCostumeCode(c.id),
      qty: {
        total,
        available,
        rented: occ.rented,
        cleaning: occ.cleaning,
        repair: occ.repair,
      },
      rowStatus: status,
    };
  }), [costumes, bookings]);

  const facultyOptions = useMemo(() => {
    const list = universityFilter
      ? faculties.filter((f) => f.universityId === universityFilter)
      : faculties;
    return list;
  }, [faculties, universityFilter]);

  const summary = useMemo(() => {
    const totals = enriched.reduce((acc, c) => {
      acc.total += c.qty.total;
      acc.available += c.qty.available;
      acc.rented += c.qty.rented;
      acc.cleaning += c.qty.cleaning;
      acc.repair += c.qty.repair;
      if (c.rowStatus.key === 'unavailable') acc.unavailable += c.qty.total;
      return acc;
    }, { total: 0, available: 0, rented: 0, cleaning: 0, repair: 0, unavailable: 0 });
    return totals;
  }, [enriched]);

  const filtered = useMemo(() => {
    let list = [...enriched];
    if (universityFilter) list = list.filter((c) => c.universityId === universityFilter);
    if (facultyFilter) list = list.filter((c) => c.facultyId === facultyFilter);
    if (statusFilter) list = list.filter((c) => c.rowStatus.key === statusFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => {
        const hay = [c.code, c.id, c.name, c.faculty?.name, c.university?.name]
          .filter(Boolean).join(' ').toLowerCase();
        return hay.includes(q);
      });
    }
    return list;
  }, [enriched, universityFilter, facultyFilter, statusFilter, search]);

  useEffect(() => { setPage(1); }, [
    search, universityFilter, facultyFilter, statusFilter, perPage,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageSafe = Math.min(page, totalPages);
  const pageItems = filtered.slice((pageSafe - 1) * perPage, pageSafe * perPage);
  const from = filtered.length === 0 ? 0 : (pageSafe - 1) * perPage + 1;
  const to = Math.min(pageSafe * perPage, filtered.length);

  const openForm = (costume = null) => {
    if (costume) {
      setForm(costume);
      setImages(costume.images || []);
    } else {
      setForm({
        name: '', universityId: '', facultyId: '',
        pricePerDay: 300, deposit: 1000, stock: 1, description: '',
      });
      setImages([]);
    }
    setEditing(costume?.id || 'new');
  };

  const handleImageUpload = async (files) => {
    const fileArr = Array.isArray(files) ? files : [files];
    const { data } = await uploadAPI.multiple(fileArr);
    setImages((prev) => [...prev, ...data.urls]);
  };

  const handleSave = async () => {
    const payload = { ...form, images };
    if (editing === 'new') await costumeAPI.create(payload);
    else await costumeAPI.update(editing, payload);
    setEditing(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('ยืนยันลบ?')) return;
    await costumeAPI.delete(id);
    load();
  };

  const resetFilters = () => {
    setSearch('');
    setUniversityFilter('');
    setDegreeFilter('');
    setFacultyFilter('');
    setSizeFilter('');
    setStatusFilter('');
  };

  const filteredFaculties = form.universityId
    ? faculties.filter((f) => f.universityId === form.universityId)
    : faculties;

  return (
    <DashboardLayout role="admin">
      <div className="booking-page-head">
        <div>
          <h1 className="page-title">จัดการชุดครุย</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>เพิ่ม แก้ไข และติดตามสถานะชุดครุยในคลัง</p>
        </div>
      </div>

      <div className="costume-sum-grid">
        <SummaryCard icon={Shirt} label="ชุดทั้งหมด" value={summary.total} color="#E63946" bg="#FFE4E6" />
        <SummaryCard icon={CheckCircle2} label="พร้อมให้เช่า" value={summary.available} color="#16A34A" bg="#DCFCE7" />
        <SummaryCard icon={Clock} label="กำลังเช่า" value={summary.rented} color="#2563EB" bg="#DBEAFE" />
        <SummaryCard icon={Droplets} label="ซักทำความสะอาด" value={summary.cleaning} color="#D97706" bg="#FEF3C7" />
        <SummaryCard icon={Wrench} label="ซ่อมแซม" value={summary.repair} color="#7C3AED" bg="#EDE9FE" />
        <SummaryCard icon={PackageX} label="ไม่พร้อมใช้" value={summary.unavailable} color="#DC2626" bg="#FEE2E2" />
      </div>

      <div className="booking-filter-bar costume-filter-bar">
        <div className="booking-filter-fields">
          <label>
            มหาวิทยาลัย
            <select
              className="form-input"
              value={universityFilter}
              onChange={(e) => {
                setUniversityFilter(e.target.value);
                setFacultyFilter('');
              }}
            >
              <option value="">ทั้งหมด</option>
              {universities.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </label>
          <label>
            คณะ
            <select
              className="form-input"
              value={facultyFilter}
              onChange={(e) => setFacultyFilter(e.target.value)}
            >
              <option value="">ทั้งหมด</option>
              {facultyOptions.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </label>
          <label>
            สถานะ
            <select className="form-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">ทั้งหมด</option>
              <option value="available">พร้อมให้เช่า</option>
              <option value="rented">กำลังเช่า</option>
              <option value="cleaning">ซักทำความสะอาด</option>
              <option value="repair">ซ่อมแซม</option>
              <option value="unavailable">ไม่พร้อมใช้</option>
            </select>
          </label>
        </div>
        <div className="costume-filter-right">
          <div className="booking-head-search" style={{ minWidth: 220 }}>
            <Search size={16} />
            <input
              placeholder="ค้นหารหัสชุด ชื่อชุด..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="button" className="btn btn-outline btn-sm" onClick={resetFilters}>
            <RotateCcw size={16} /> รีเซ็ต
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => openForm()}>
            <Plus size={16} /> เพิ่มชุดครุย
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">กำลังโหลด...</div>
      ) : (
        <>
          <div className="card table-wrapper">
            <table className="costume-admin-table">
              <thead>
                <tr>
                  <th>รหัสชุด</th>
                  <th>รูปภาพ</th>
                  <th>ชื่อชุดครุย</th>
                  <th>มหาวิทยาลัย</th>
                  <th>คณะ</th>
                  <th colSpan={5} className="qty-group-head">จำนวนชุด</th>
                  <th>สถานะ</th>
                  <th>จัดการ</th>
                </tr>
                <tr className="qty-subhead">
                  <th colSpan={5} />
                  <th>ทั้งหมด</th>
                  <th>พร้อมใช้</th>
                  <th>กำลังเช่า</th>
                  <th>ซัก</th>
                  <th>ซ่อม</th>
                  <th colSpan={2} />
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 && (
                  <tr>
                    <td colSpan={14} style={{ textAlign: 'center', color: '#6B7280' }}>ไม่พบชุดครุย</td>
                  </tr>
                )}
                {pageItems.map((c) => (
                    <tr key={c.id}>
                      <td className="dash-order-id">{c.code}</td>
                      <td>
                        <div className="costume-thumb">
                          {c.images?.[0] ? (
                            <img src={c.images[0]} alt={c.name} />
                          ) : (
                            <Shirt size={18} color="#9CA3AF" />
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="costume-name">{c.name}</div>
                      </td>
                      <td>{c.university?.shortName || c.university?.name || '—'}</td>
                      <td>{c.faculty?.name || '—'}</td>
                      <td className="qty-cell">{c.qty.total}</td>
                      <td className="qty-cell">{c.qty.available}</td>
                      <td className="qty-cell">{c.qty.rented}</td>
                      <td className="qty-cell">{c.qty.cleaning}</td>
                      <td className="qty-cell">{c.qty.repair}</td>
                      <td>
                        <span
                          className="degree-chip"
                          style={{ background: c.rowStatus.bg, color: c.rowStatus.color }}
                        >
                          {c.rowStatus.label}
                        </span>
                      </td>
                      <td>
                        <div className="booking-row-actions">
                          <button type="button" className="dash-view-btn" title="ดู" onClick={() => setViewing(c)}>
                            <Eye size={16} />
                          </button>
                          <button type="button" className="dash-view-btn" title="แก้ไข" onClick={() => openForm(c)}>
                            <Pencil size={16} />
                          </button>
                          <button type="button" className="dash-view-btn" title="ลบ" onClick={() => handleDelete(c.id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="booking-pagination">
            <span>แสดง {from} - {to} จาก {filtered.length} รายการ</span>
            <div className="booking-pagination-controls">
              <select
                className="form-input"
                style={{ width: 'auto', minWidth: 90 }}
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
              >
                <option value={10}>10 / หน้า</option>
                <option value={20}>20 / หน้า</option>
                <option value={50}>50 / หน้า</option>
              </select>
              <button type="button" className="btn btn-ghost btn-sm" disabled={pageSafe <= 1} onClick={() => setPage(pageSafe - 1)}>
                ก่อนหน้า
              </button>
              <span className="booking-page-num">{pageSafe} / {totalPages}</span>
              <button type="button" className="btn btn-ghost btn-sm" disabled={pageSafe >= totalPages} onClick={() => setPage(pageSafe + 1)}>
                ถัดไป
              </button>
            </div>
          </div>
        </>
      )}

      {viewing && (
        <div className="modal-overlay" onClick={() => setViewing(null)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <h3>{viewing.name}</h3>
            {viewing.images?.[0] && (
              <img src={viewing.images[0]} alt="" style={{ width: '100%', borderRadius: 12, marginBottom: 12 }} />
            )}
            <p><strong>รหัส:</strong> {viewing.code}</p>
            <p><strong>มหาวิทยาลัย:</strong> {viewing.university?.name}</p>
            <p><strong>คณะ:</strong> {viewing.faculty?.name}</p>
            <p><strong>คงเหลือ:</strong> {viewing.qty.available} / {viewing.qty.total}</p>
            <p style={{ color: '#666', marginTop: 8 }}>{viewing.description}</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setViewing(null)}>ปิด</button>
              <button className="btn btn-primary" onClick={() => { setViewing(null); openForm(viewing); }}>แก้ไข</button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            <h3>{editing === 'new' ? 'เพิ่มชุดครุย' : 'แก้ไขชุดครุย'}</h3>
            <div className="form-group">
              <label>ชื่อ</label>
              <input className="form-input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>มหาวิทยาลัย</label>
                <select className="form-input" value={form.universityId || ''} onChange={(e) => setForm({ ...form, universityId: e.target.value, facultyId: '' })}>
                  <option value="">เลือก</option>
                  {universities.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>คณะ</label>
                <select className="form-input" value={form.facultyId || ''} onChange={(e) => setForm({ ...form, facultyId: e.target.value })}>
                  <option value="">เลือก</option>
                  {filteredFaculties.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid-3">
              <div className="form-group">
                <label>ราคา/วัน</label>
                <input className="form-input" type="number" value={form.pricePerDay || ''} onChange={(e) => setForm({ ...form, pricePerDay: Number(e.target.value) })} />
              </div>
              <div className="form-group">
                <label>มัดจำ</label>
                <input className="form-input" type="number" value={form.deposit || ''} onChange={(e) => setForm({ ...form, deposit: Number(e.target.value) })} />
              </div>
              <div className="form-group">
                <label>จำนวนชุด (stock)</label>
                <input className="form-input" type="number" value={form.stock || ''} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
              </div>
            </div>
            <div className="form-group">
              <label>รายละเอียด</label>
              <textarea className="form-input" rows={2} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <UploadBox
              label="อัปโหลดรูปชุดครุย (หลายรูป)"
              preview={images}
              onUpload={handleImageUpload}
              multiple
              onRemove={(i) => setImages((prev) => prev.filter((_, idx) => idx !== i))}
            />
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setEditing(null)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleSave}>บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
