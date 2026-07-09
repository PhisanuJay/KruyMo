import { useState, useEffect } from 'react';
import { costumeAPI, masterDataAPI, uploadAPI } from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';
import UploadBox from '../../components/UploadBox';
import UniversityTag from '../../components/UniversityTag';

export default function CostumeManager() {
  const [costumes, setCostumes] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [images, setImages] = useState([]);

  const load = () => {
    costumeAPI.getAll().then((r) => setCostumes(r.data));
    masterDataAPI.universities.getAll().then((r) => setUniversities(r.data));
    masterDataAPI.faculties.getAll().then((r) => setFaculties(r.data));
    masterDataAPI.sizes.getAll().then((r) => setSizes(r.data));
  };

  useEffect(() => { load(); }, []);

  const openForm = (costume = null) => {
    if (costume) {
      setForm(costume);
      setImages(costume.images || []);
    } else {
      setForm({ name: '', universityId: '', facultyId: '', sizeId: '', degreeLevel: 'bachelor', pricePerDay: 300, deposit: 1000, stock: 1, description: '' });
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
    if (editing === 'new') {
      await costumeAPI.create(payload);
    } else {
      await costumeAPI.update(editing, payload);
    }
    setEditing(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('ยืนยันลบ?')) return;
    await costumeAPI.delete(id);
    load();
  };

  const filteredFaculties = form.universityId
    ? faculties.filter((f) => f.universityId === form.universityId)
    : faculties;

  return (
    <DashboardLayout role="admin">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">จัดการชุดครุย</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>เพิ่ม แก้ไข ลบชุดครุย</p>
        </div>
        <button className="btn btn-primary" onClick={() => openForm()}>+ เพิ่มชุดครุย</button>
      </div>

      <div className="card table-wrapper">
        <table>
          <thead>
            <tr><th>ชื่อ</th><th>มหาวิทยาลัย</th><th>คณะ</th><th>ไซส์</th><th>ราคา/วัน</th><th>คงเหลือ</th><th>จัดการ</th></tr>
          </thead>
          <tbody>
            {costumes.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.university && <UniversityTag name={c.university.shortName} color={c.university.color} size="sm" />}</td>
                <td>{c.faculty?.name}</td>
                <td>{c.size?.label}</td>
                <td>฿{c.pricePerDay}</td>
                <td>{c.stock}</td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => openForm(c)}>แก้ไข</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>ลบ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
                <label>ไซส์</label>
                <select className="form-input" value={form.sizeId || ''} onChange={(e) => setForm({ ...form, sizeId: e.target.value })}>
                  <option value="">เลือก</option>
                  {sizes.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>ระดับปริญญา</label>
                <select className="form-input" value={form.degreeLevel || 'bachelor'} onChange={(e) => setForm({ ...form, degreeLevel: e.target.value })}>
                  <option value="bachelor">ปริญญาตรี</option>
                  <option value="master">ปริญญาโท</option>
                  <option value="doctoral">ปริญญาเอก</option>
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
                <label>คงเหลือ</label>
                <input className="form-input" type="number" value={form.stock || ''} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
              </div>
            </div>
            <div className="form-group">
              <label>รายละเอียด</label>
              <textarea className="form-input" rows={2} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <UploadBox label="อัปโหลดรูปชุดครุย (หลายรูป)" preview={images} onUpload={handleImageUpload} multiple
              onRemove={(i) => setImages((prev) => prev.filter((_, idx) => idx !== i))} />
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
