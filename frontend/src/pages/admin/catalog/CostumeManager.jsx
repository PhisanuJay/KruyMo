import { useState, useEffect, useMemo } from 'react';
import {
  Eye, Search, Plus, RotateCcw, Pencil, Trash2, Shirt, Package,
  Boxes, Save,
} from 'lucide-react';
import { costumeAPI, masterDataAPI, uploadAPI } from '../../../services/api';
import DashboardLayout from '../../../components/DashboardLayout';
import UploadBox from '../../../components/UploadBox';
import UniversityTag from '../../../components/UniversityTag';
import {
  catalogCostumeName,
  costumeDisplayName,
  DEGREE_OPTIONS,
  gownImageForDegree,
} from '../../../utils/costumes';

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

function qtyForDegree(cells, sizeId, degree) {
  return cells.find((c) => c.sizeId === sizeId && c.degreeLevel === degree)?.quantity ?? 0;
}

export default function CostumeManager() {
  const [costumes, setCostumes] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [images, setImages] = useState([]);
  const [viewing, setViewing] = useState(null);
  const [previewDegree, setPreviewDegree] = useState('bachelor');
  const [stockEditor, setStockEditor] = useState(null);
  const [stockMatrix, setStockMatrix] = useState(null);
  const [stockDraft, setStockDraft] = useState({});
  const [stockSaving, setStockSaving] = useState(false);
  const [stockError, setStockError] = useState('');
  const [stockMsg, setStockMsg] = useState('');
  const [saveError, setSaveError] = useState('');

  const [search, setSearch] = useState('');
  const [universityFilter, setUniversityFilter] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const load = () => {
    setLoading(true);
    Promise.all([
      costumeAPI.getAll(),
      masterDataAPI.universities.getAll(),
      masterDataAPI.faculties.getAll(),
    ])
      .then(([c, u, f]) => {
        setCostumes(c.data || []);
        setUniversities(u.data || []);
        setFaculties(f.data || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const facultyOptions = useMemo(() => (
    universityFilter
      ? faculties.filter((f) => f.universityId === universityFilter)
      : faculties
  ), [faculties, universityFilter]);

  const summary = useMemo(() => (
    costumes.reduce((acc, c) => {
      acc.items += 1;
      acc.inventory += c.inventoryQty ?? c.stock ?? 0;
      acc.booked += c.bookedQty ?? 0;
      acc.available += c.availableQty ?? Math.max(0, (c.inventoryQty ?? 0) - (c.bookedQty ?? 0));
      return acc;
    }, { items: 0, inventory: 0, booked: 0, available: 0 })
  ), [costumes]);

  const filtered = useMemo(() => {
    let list = [...costumes];
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
  }, [costumes, universityFilter, facultyFilter, search]);

  useEffect(() => { setPage(1); }, [search, universityFilter, facultyFilter, perPage]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageSafe = Math.min(page, totalPages);
  const pageItems = filtered.slice((pageSafe - 1) * perPage, pageSafe * perPage);
  const from = filtered.length === 0 ? 0 : (pageSafe - 1) * perPage + 1;
  const to = Math.min(pageSafe * perPage, filtered.length);

  const openForm = (costume = null) => {
    setSaveError('');
    if (costume) {
      setForm({
        name: costume.name,
        universityId: costume.universityId,
        facultyId: costume.facultyId,
        pricePerDay: costume.pricePerDay,
        deposit: costume.deposit,
        description: costume.description || '',
      });
      setImages(costume.images || []);
      setEditing(costume.id);
    } else {
      setForm({
        name: '',
        universityId: universities[0]?.id || '',
        facultyId: '',
        pricePerDay: 350,
        deposit: 1500,
        description: '',
      });
      setImages([]);
      setEditing('new');
    }
  };

  const handleFacultyPick = (facultyId) => {
    const fac = faculties.find((f) => f.id === facultyId);
    const uni = universities.find((u) => u.id === (fac?.universityId || form.universityId));
    const autoName = fac
      ? `ชุดครุย${uni?.shortName || uni?.name || 'ศรีปทุม'} ${fac.name}`
      : form.name;
    setForm((prev) => ({
      ...prev,
      facultyId,
      universityId: fac?.universityId || prev.universityId,
      name: prev.name?.trim() ? prev.name : autoName,
    }));
  };

  const handleImageUpload = async (files) => {
    const fileArr = Array.isArray(files) ? files : [files];
    const { data } = await uploadAPI.multiple(fileArr);
    const urls = Array.isArray(data?.urls) ? data.urls : [];
    if (urls.length) setImages((prev) => [...prev, ...urls]);
  };

  const handleSave = async () => {
    setSaveError('');
    if (!form.name?.trim() || !form.universityId || !form.facultyId) {
      setSaveError('กรุณากรอกชื่อ มหาวิทยาลัย และคณะ');
      return;
    }
    const payload = {
      name: form.name.trim(),
      universityId: form.universityId,
      facultyId: form.facultyId,
      pricePerDay: Number(form.pricePerDay) || 0,
      deposit: Number(form.deposit) || 0,
      description: form.description || '',
      images,
    };
    try {
      if (editing === 'new') await costumeAPI.create(payload);
      else await costumeAPI.update(editing, payload);
      setEditing(null);
      load();
    } catch (err) {
      setSaveError(err.response?.data?.error || 'บันทึกไม่สำเร็จ');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('ยืนยันลบชุดครุยและสต็อกของคณะนี้?')) return;
    await costumeAPI.delete(id);
    load();
  };

  const openStock = async (costume) => {
    setStockEditor(costume);
    setStockError('');
    setStockMsg('');
    setStockMatrix(null);
    setStockDraft({});
    try {
      const { data } = await costumeAPI.getInventory(costume.id);
      setStockMatrix(data);
      const draft = {};
      data.cells.forEach((cell) => {
        draft[`${cell.sizeId}:${cell.degreeLevel}`] = cell.quantity;
      });
      setStockDraft(draft);
    } catch (err) {
      setStockError(err.response?.data?.error || 'โหลดสต็อกไม่สำเร็จ');
    }
  };

  const setDraftQty = (sizeId, degree, value) => {
    // อนุญาตให้ว่างชั่วคราวตอนพิมพ์ — ไม่บังคับเป็น 0 ทันที
    if (value === '' || value === null || value === undefined) {
      setStockDraft((prev) => ({ ...prev, [`${sizeId}:${degree}`]: '' }));
      return;
    }
    const digits = String(value).replace(/[^\d]/g, '');
    if (digits === '') {
      setStockDraft((prev) => ({ ...prev, [`${sizeId}:${degree}`]: '' }));
      return;
    }
    const n = Math.max(0, Math.min(999, Number(digits)));
    setStockDraft((prev) => ({ ...prev, [`${sizeId}:${degree}`]: n }));
  };

  const commitDraftQty = (sizeId, degree) => {
    const key = `${sizeId}:${degree}`;
    setStockDraft((prev) => {
      const raw = prev[key];
      const n = Math.max(0, Math.min(999, Number(raw) || 0));
      return { ...prev, [key]: n };
    });
  };

  const saveStock = async () => {
    if (!stockEditor || !stockMatrix) return;
    setStockSaving(true);
    setStockError('');
    setStockMsg('');
    try {
      const items = stockMatrix.sizes.flatMap((size) => (
        stockMatrix.degrees.map((deg) => ({
          sizeId: size.id,
          degreeLevel: deg.value,
          quantity: Number(stockDraft[`${size.id}:${deg.value}`]) || 0,
        }))
      ));
      const { data } = await costumeAPI.updateInventory(stockEditor.id, { items });
      setStockMatrix(data);
      const draft = {};
      data.cells.forEach((cell) => {
        draft[`${cell.sizeId}:${cell.degreeLevel}`] = cell.quantity;
      });
      setStockDraft(draft);
      setStockMsg('บันทึกสต็อกแล้ว');
      load();
    } catch (err) {
      setStockError(err.response?.data?.error || 'บันทึกสต็อกไม่สำเร็จ');
    } finally {
      setStockSaving(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setUniversityFilter('');
    setFacultyFilter('');
  };

  const filteredFaculties = form.universityId
    ? faculties.filter((f) => f.universityId === form.universityId)
    : faculties;

  const usedFacultyIds = useMemo(
    () => new Set(costumes.map((c) => c.facultyId).filter(Boolean)),
    [costumes],
  );

  return (
    <DashboardLayout role="admin">
      <div className="booking-page-head">
        <div>
          <h1 className="page-title">จัดการชุดครุย</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>
            คณะละ 1 ชุด — แก้สต็อกแยกไซส์ × ระดับตรี/โท/เอก ได้จากปุ่มคลัง
          </p>
        </div>
      </div>

      <div className="costume-sum-grid costume-sum-grid-4">
        <SummaryCard icon={Shirt} label="รายการชุด (คณะ)" value={summary.items} color="#E63946" bg="#FFE4E6" />
        <SummaryCard icon={Package} label="จำนวนในคลัง" value={summary.inventory} color="#111" bg="#F3F4F6" />
        <SummaryCard icon={Boxes} label="จองครอง" value={summary.booked} color="#2563EB" bg="#DBEAFE" />
        <SummaryCard icon={Package} label="เหลือในคลัง" value={summary.available} color="#16A34A" bg="#DCFCE7" />
      </div>
      <p className="form-hint costume-stock-overview-hint">
        ตัวเลขด้านบน = สรุปคลังเท่านั้น (จำนวนในคลัง − จองครอง)
        · การว่างตอนลูกค้าจองคำนวณแยกจากช่วงวัน + ไซส์ + ระดับ หน้าเลือกวัน
      </p>

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
              placeholder="ค้นหาชื่อชุด / คณะ..."
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
                  <th>คณะ / สายสี</th>
                  <th>จำนวนในคลัง</th>
                  <th>จองครอง</th>
                  <th>เหลือในคลัง</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: '#6B7280' }}>ไม่พบชุดครุย</td>
                  </tr>
                )}
                {pageItems.map((c) => {
                  const total = c.inventoryQty ?? c.stock ?? 0;
                  const booked = c.bookedQty ?? 0;
                  const available = c.availableQty ?? Math.max(0, total - booked);
                  return (
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
                        <div className="costume-name">{catalogCostumeName(c) || c.name}</div>
                        <div className="costume-meta-line">
                          ฿{c.pricePerDay}/วัน · มัดจำ ฿{c.deposit}
                        </div>
                      </td>
                      <td>
                        <div>{c.faculty?.name || '—'}</div>
                        <div className="costume-meta-line">{c.faculty?.sashLabel || c.university?.shortName || '—'}</div>
                      </td>
                      <td className="qty-cell">{total}</td>
                      <td className="qty-cell">{booked}</td>
                      <td className="qty-cell qty-available">{available}</td>
                      <td>
                        <div className="booking-row-actions">
                          <button
                            type="button"
                            className="dash-view-btn"
                            title="ดูแบบลูกค้า"
                            onClick={() => {
                              setPreviewDegree('bachelor');
                              setViewing(c);
                            }}
                          >
                            <Eye size={16} />
                          </button>
                          <button type="button" className="dash-view-btn" title="แก้สต็อก" onClick={() => openStock(c)}>
                            <Boxes size={16} />
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
                  );
                })}
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

      {viewing && (() => {
        const facultyColor = viewing.faculty?.color || '#636E72';
        const displayName = costumeDisplayName(viewing, previewDegree);
        const displayImage = gownImageForDegree(
          viewing.images?.[0],
          previewDegree,
          viewing.faculty?.sashColor,
        );
        const total = viewing.inventoryQty ?? 0;
        const booked = viewing.bookedQty ?? 0;
        const available = viewing.availableQty ?? Math.max(0, total - booked);
        return (
          <div className="modal-overlay" onClick={() => setViewing(null)}>
            <div className="modal costume-preview-modal" onClick={(e) => e.stopPropagation()}>
              <header className="costume-preview-top">
                <div>
                  <p className="costume-preview-kicker">มุมมองลูกค้า</p>
                  <p className="costume-preview-sash">{viewing.faculty?.sashLabel || 'ชุดครุยศรีปทุม'}</p>
                </div>
                <button type="button" className="costume-preview-close" onClick={() => setViewing(null)} aria-label="ปิด">
                  ×
                </button>
              </header>

              <div className="costume-preview-grid">
                <div
                  className="costume-preview-media"
                  style={{ '--preview-accent': facultyColor }}
                >
                  {displayImage ? (
                    <img key={displayImage} src={displayImage} alt={displayName} />
                  ) : (
                    <span className="costume-preview-fallback">🎓</span>
                  )}
                </div>

                <div className="costume-preview-info">
                  <div className="costume-preview-tags">
                    {viewing.university && (
                      <UniversityTag name={viewing.university.shortName || viewing.university.name} color={viewing.university.color} />
                    )}
                    {viewing.faculty && (
                      <UniversityTag
                        name={viewing.faculty.name.replace(/^คณะ/, '')}
                        color={facultyColor}
                      />
                    )}
                  </div>

                  <h2>{displayName}</h2>
                  <p className="costume-preview-desc">{viewing.description}</p>

                  <div className="costume-preview-price-row">
                    <div>
                      <span className="costume-preview-price-label">ราคาเช่า</span>
                      <p className="costume-preview-price">฿{viewing.pricePerDay}<small>/วัน</small></p>
                    </div>
                    <div>
                      <span className="costume-preview-price-label">มัดจำ</span>
                      <p className="costume-preview-deposit">฿{viewing.deposit}</p>
                    </div>
                  </div>

                  <div className="costume-preview-degree">
                    <p className="costume-preview-degree-label">ระดับปริญญา</p>
                    <div className="costume-preview-degree-tabs" role="tablist">
                      {DEGREE_OPTIONS.map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          role="tab"
                          aria-selected={previewDegree === o.value}
                          className={`costume-preview-degree-tab${previewDegree === o.value ? ' is-active' : ''}`}
                          onClick={() => setPreviewDegree(o.value)}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                    <p className="costume-preview-degree-hint">สลับระดับเพื่อดูรูปชุดแบบลูกค้าตอนจอง</p>
                  </div>

                  <div className="costume-preview-stock">
                    <div>
                      <span>จำนวนในคลัง</span>
                      <strong>{total}</strong>
                    </div>
                    <div>
                      <span>จองครอง</span>
                      <strong>{booked}</strong>
                    </div>
                    <div className="is-available">
                      <span>เหลือในคลัง</span>
                      <strong>{available}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="costume-preview-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setViewing(null)}>ปิด</button>
                <div className="costume-preview-actions-right">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => { setViewing(null); openStock(viewing); }}
                  >
                    แก้สต็อก
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => { setViewing(null); openForm(viewing); }}
                  >
                    แก้ไขข้อมูล
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {editing && (() => {
        const editFaculty = faculties.find((f) => f.id === form.facultyId);
        const editUni = universities.find((u) => u.id === form.universityId);
        const accent = editFaculty?.color || '#E63946';
        const previewSrc = images[0] || null;
        const isNew = editing === 'new';
        return (
          <div className="modal-overlay" onClick={() => setEditing(null)}>
            <div className="modal costume-edit-modal" onClick={(e) => e.stopPropagation()}>
              <header className="costume-edit-top">
                <div>
                  <p className="costume-edit-kicker">{isNew ? 'เพิ่มชุดใหม่' : 'แก้ไขชุดครุย'}</p>
                  <h3>{form.name?.trim() || (isNew ? 'ชุดครุยคณะใหม่' : 'แก้ไขข้อมูลชุด')}</h3>
                  <p className="costume-edit-sub">
                    {[editFaculty?.name, editFaculty?.sashLabel].filter(Boolean).join(' · ') || 'เลือกคณะและอัปโหลดรูปด้านล่าง'}
                  </p>
                </div>
                <button type="button" className="costume-preview-close" onClick={() => setEditing(null)} aria-label="ปิด">
                  ×
                </button>
              </header>

              {saveError && <div className="alert alert-error costume-edit-alert">{saveError}</div>}

              <div className="costume-edit-grid">
                <div className="costume-edit-media" style={{ '--edit-accent': accent }}>
                  {previewSrc ? (
                    <img src={previewSrc} alt="" />
                  ) : (
                    <div className="costume-edit-media-empty">
                      <Shirt size={36} strokeWidth={1.5} />
                      <span>ยังไม่มีรูปชุด</span>
                    </div>
                  )}
                  {(editUni || editFaculty) && (
                    <div className="costume-edit-media-tags">
                      {editUni && <UniversityTag name={editUni.shortName || editUni.name} color={editUni.color} size="sm" />}
                      {editFaculty && (
                        <UniversityTag
                          name={editFaculty.name.replace(/^คณะ/, '')}
                          color={accent}
                          size="sm"
                        />
                      )}
                    </div>
                  )}
                </div>

                <div className="costume-edit-form">
                  <div className="form-group">
                    <label>ชื่อชุด</label>
                    <input
                      className="form-input"
                      value={form.name || ''}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="เช่น ชุดครุยศรีปทุม คณะนิเทศศาสตร์"
                    />
                  </div>
                  <div className="grid-2">
                    <div className="form-group">
                      <label>มหาวิทยาลัย</label>
                      <select
                        className="form-input"
                        value={form.universityId || ''}
                        onChange={(e) => setForm({ ...form, universityId: e.target.value, facultyId: '' })}
                      >
                        <option value="">เลือก</option>
                        {universities.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>คณะ</label>
                      <select
                        className="form-input"
                        value={form.facultyId || ''}
                        onChange={(e) => handleFacultyPick(e.target.value)}
                      >
                        <option value="">เลือก</option>
                        {filteredFaculties.map((f) => (
                          <option
                            key={f.id}
                            value={f.id}
                            disabled={isNew && usedFacultyIds.has(f.id)}
                          >
                            {f.name}{isNew && usedFacultyIds.has(f.id) ? ' (มีแล้ว)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid-2">
                    <div className="form-group">
                      <label>ราคา/วัน (บาท)</label>
                      <input
                        className="form-input"
                        type="number"
                        min={0}
                        value={form.pricePerDay || ''}
                        onChange={(e) => setForm({ ...form, pricePerDay: Number(e.target.value) })}
                      />
                    </div>
                    <div className="form-group">
                      <label>มัดจำ (บาท)</label>
                      <input
                        className="form-input"
                        type="number"
                        min={0}
                        value={form.deposit || ''}
                        onChange={(e) => setForm({ ...form, deposit: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>รายละเอียด</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={form.description || ''}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="คำอธิบายที่ลูกค้าจะเห็นในหน้ารายละเอียดชุด"
                    />
                  </div>
                  <div className="costume-edit-upload">
                    <label>รูปชุดครุย</label>
                    <UploadBox
                      label="ลากรูปมาวาง หรือคลิกเพื่ออัปโหลด"
                      preview={images}
                      onUpload={handleImageUpload}
                      multiple
                      onRemove={(i) => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                    />
                  </div>
                  <p className="form-hint">
                    รูปแรกจะเป็นรูปหลักในแคตตาล็อก · ตั้งจำนวนสต็อกแยกไซส์ × ตรี/โท/เอก ได้จากปุ่มกล่อง
                  </p>
                </div>
              </div>

              <div className="costume-edit-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>ยกเลิก</button>
                <button type="button" className="btn btn-primary" onClick={handleSave}>
                  {isNew ? 'เพิ่มชุดครุย' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {stockEditor && (
        <div className="modal-overlay" onClick={() => !stockSaving && setStockEditor(null)}>
          <div className="modal stock-modal" onClick={(e) => e.stopPropagation()}>
            <div className="stock-modal-head">
              <div>
                <p className="stock-modal-kicker">สต็อกคลัง</p>
                <h3>{catalogCostumeName(stockEditor) || stockEditor.name}</h3>
                <p className="stock-modal-sub">
                  {stockEditor.faculty?.name}
                  {stockEditor.faculty?.sashLabel ? ` · ${stockEditor.faculty.sashLabel}` : ''}
                </p>
              </div>
              {stockMatrix && (
                <div className="stock-totals">
                  <div><span>จำนวนในคลัง</span><strong>{stockMatrix.totals.total}</strong></div>
                  <div><span>จองครอง</span><strong>{stockMatrix.totals.booked}</strong></div>
                  <div><span>เหลือในคลัง</span><strong>{stockMatrix.totals.available}</strong></div>
                </div>
              )}
            </div>

            {stockError && <div className="alert alert-error">{stockError}</div>}
            {stockMsg && <div className="alert alert-success">{stockMsg}</div>}

            {!stockMatrix ? (
              <div className="loading">กำลังโหลดตารางสต็อก...</div>
            ) : (
              <div className="stock-grid-wrap">
                <table className="stock-grid-table">
                  <thead>
                    <tr>
                      <th>ไซส์</th>
                      <th>สูง (ซม.)</th>
                      {stockMatrix.degrees.map((d) => (
                        <th key={d.value}>{d.label}</th>
                      ))}
                      <th>จองครอง</th>
                      <th>เหลือในคลัง</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockMatrix.sizes.map((size) => {
                      const rowCells = stockMatrix.degrees.map((d) => (
                        stockMatrix.cells.find((c) => c.sizeId === size.id && c.degreeLevel === d.value)
                      ));
                      const bookedSum = rowCells.reduce((s, c) => s + (c?.booked || 0), 0);
                      const availSum = rowCells.reduce((s, c) => s + (c?.available || 0), 0);
                      return (
                        <tr key={size.id}>
                          <td><strong>{size.label}</strong></td>
                          <td className="stock-muted">{size.heightMin}-{size.heightMax}</td>
                          {stockMatrix.degrees.map((d) => {
                            const key = `${size.id}:${d.value}`;
                            const cell = rowCells.find((c) => c?.degreeLevel === d.value);
                            return (
                              <td key={d.value}>
                                <input
                                  className="form-input stock-qty-input"
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  value={stockDraft[key] ?? qtyForDegree(stockMatrix.cells, size.id, d.value)}
                                  onChange={(e) => setDraftQty(size.id, d.value, e.target.value)}
                                  onBlur={() => commitDraftQty(size.id, d.value)}
                                  title={cell ? `จองครอง ${cell.booked} · เหลือในคลัง ${cell.available}` : ''}
                                />
                              </td>
                            );
                          })}
                          <td className="qty-cell">{bookedSum}</td>
                          <td className="qty-cell qty-available">{availSum}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="form-hint">
                  ช่องกรอก = จำนวนในคลังต่อไซส์ × ระดับ
                  · จองครอง = ออเดอร์ที่ยังไม่ปิด
                  · เหลือในคลัง = จำนวนในคลัง − จองครอง
                  · ลูกค้าเช็คว่างจริงจากช่วงวันจอง + ไซส์ + ระดับ (คนละสูตรกับหน้านี้)
                </p>
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" disabled={stockSaving} onClick={() => setStockEditor(null)}>
                ปิด
              </button>
              <button type="button" className="btn btn-primary" disabled={stockSaving || !stockMatrix} onClick={saveStock}>
                <Save size={16} />
                {stockSaving ? 'กำลังบันทึก...' : 'บันทึกสต็อก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
