import { useState, useEffect, useMemo } from 'react';
import {
  Eye, Search, Plus, RotateCcw, Pencil, Trash2, Shirt, Package,
} from 'lucide-react';
import { costumeAPI, masterDataAPI, uploadAPI, bookingAPI } from '../../../services/api';
import DashboardLayout from '../../../components/DashboardLayout';
import UploadBox from '../../../components/UploadBox';

/** สถานะที่ยังครองสล็อตคลัง (สอดคล้อง backend ACTIVE_BOOKING_STATUSES) */
const ACTIVE_BOOKING_STATUSES = [
  'pending', 'payment_pending', 'payment_verified', 'approved', 'preparing',
  'ready_to_ship', 'out_for_delivery', 'delivered', 'return_submitted',
  'ready_for_pickup', 'picked_up',
];

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
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [images, setImages] = useState([]);
  const [viewing, setViewing] = useState(null);

  const [search, setSearch] = useState('');
  const [universityFilter, setUniversityFilter] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const load = () => {
    setLoading(true);
    Promise.all([
      costumeAPI.getAll(),
      bookingAPI.getAll(),
      masterDataAPI.universities.getAll(),
      masterDataAPI.faculties.getAll(),
    ])
      .then(([c, b, u, f]) => {
        setCostumes(c.data || []);
        setBookings(b.data || []);
        setUniversities(u.data || []);
        setFaculties(f.data || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const enriched = useMemo(() => {
    const activeByCostume = {};
    bookings.forEach((b) => {
      if (!ACTIVE_BOOKING_STATUSES.includes(b.status)) return;
      activeByCostume[b.costumeId] = (activeByCostume[b.costumeId] || 0) + 1;
    });
    return costumes.map((c) => {
      const inventoryQty = c.inventoryQty ?? c.stock ?? 0;
      const booked = activeByCostume[c.id] || 0;
      return {
        ...c,
        qty: {
          inventory: inventoryQty,
          booked,
        },
      };
    });
  }, [costumes, bookings]);

  const facultyOptions = useMemo(() => {
    const list = universityFilter
      ? faculties.filter((f) => f.universityId === universityFilter)
      : faculties;
    return list;
  }, [faculties, universityFilter]);

  const summary = useMemo(() => {
    return enriched.reduce((acc, c) => {
      acc.items += 1;
      acc.inventory += c.qty.inventory;
      acc.booked += c.qty.booked;
      return acc;
    }, { items: 0, inventory: 0, booked: 0 });
  }, [enriched]);

  const filtered = useMemo(() => {
    let list = [...enriched];
    if (universityFilter) list = list.filter((c) => c.universityId === universityFilter);
    if (facultyFilter) list = list.filter((c) => c.facultyId === facultyFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => {
        const hay = [c.id, c.name, c.faculty?.name, c.university?.name]
          .filter(Boolean).join(' ').toLowerCase();
        return hay.includes(q);
      });
    }
    return list;
  }, [enriched, universityFilter, facultyFilter, search]);

  useEffect(() => { setPage(1); }, [search, universityFilter, facultyFilter, perPage]);

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
        pricePerDay: 300, deposit: 1000, description: '',
      });
      setImages([]);
    }
    setEditing(costume?.id || 'new');
  };

  const handleImageUpload = async (files) => {
    const fileArr = Array.isArray(files) ? files : [files];
    const { data } = await uploadAPI.multiple(fileArr);
    const urls = Array.isArray(data?.urls) ? data.urls : [];
    if (urls.length) setImages((prev) => [...prev, ...urls]);
  };

  const handleSave = async () => {
    const { stock, inventoryQty, university, faculty, size, qty, ...rest } = form;
    const payload = { ...rest, images };
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
    setFacultyFilter('');
  };

  const filteredFaculties = form.universityId
    ? faculties.filter((f) => f.universityId === form.universityId)
    : faculties;

  return (
    <DashboardLayout role="admin">
      <div className="booking-page-head">
        <div>
          <h1 className="page-title">จัดการชุดครุย</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>เพิ่ม แก้ไขชุดครุย และดูจำนวนในคลัง (ตามไซส์/ปริญญา)</p>
        </div>
      </div>

      <div className="costume-sum-grid">
        <SummaryCard icon={Shirt} label="รายการชุด" value={summary.items} color="#E63946" bg="#FFE4E6" />
        <SummaryCard icon={Package} label="หน่วยในคลัง" value={summary.inventory} color="#16A34A" bg="#DCFCE7" />
        <SummaryCard icon={Package} label="จองครองสล็อต" value={summary.booked} color="#2563EB" bg="#DBEAFE" />
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
        </div>
        <div className="costume-filter-right">
          <div className="booking-head-search" style={{ minWidth: 220 }}>
            <Search size={16} />
            <input
              placeholder="ค้นหาชื่อชุด..."
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
                  <th>รูปภาพ</th>
                  <th>ชื่อชุดครุย</th>
                  <th>มหาวิทยาลัย</th>
                  <th>คณะ</th>
                  <th>หน่วยในคลัง</th>
                  <th>จองครองสล็อต</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: '#6B7280' }}>ไม่พบชุดครุย</td>
                  </tr>
                )}
                {pageItems.map((c) => (
                  <tr key={c.id}>
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
                    <td className="qty-cell">{c.qty.inventory}</td>
                    <td className="qty-cell">{c.qty.booked}</td>
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
            <p><strong>มหาวิทยาลัย:</strong> {viewing.university?.name}</p>
            <p><strong>คณะ:</strong> {viewing.faculty?.name}</p>
            <p><strong>หน่วยในคลัง:</strong> {viewing.qty.inventory}</p>
            <p><strong>จองครองสล็อต:</strong> {viewing.qty.booked}</p>
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
            <div className="grid-2">
              <div className="form-group">
                <label>ราคา/วัน</label>
                <input className="form-input" type="number" value={form.pricePerDay || ''} onChange={(e) => setForm({ ...form, pricePerDay: Number(e.target.value) })} />
              </div>
              <div className="form-group">
                <label>มัดจำ</label>
                <input className="form-input" type="number" value={form.deposit || ''} onChange={(e) => setForm({ ...form, deposit: Number(e.target.value) })} />
              </div>
            </div>
            {editing !== 'new' && (
              <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '1rem' }}>
                จำนวนในคลังมาจาก inventory ตามไซส์/ระดับปริญญา — แก้ผ่านสคริปต์ seed หรือไฟล์ inventory
              </p>
            )}
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
