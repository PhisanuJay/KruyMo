import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { costumeAPI, masterDataAPI } from '../../services/api';
import CustomerLayout from '../../components/CustomerLayout';
import CostumeCard from '../../components/CostumeCard';
import { uniqueCostumesByFaculty } from '../../utils/costumes';

export default function Catalog() {
  const [searchParams] = useSearchParams();
  const [costumes, setCostumes] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [filters, setFilters] = useState({
    universityId: searchParams.get('universityId') || 'uni-spu',
    facultyId: searchParams.get('facultyId') || '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      masterDataAPI.universities.getAll(),
      masterDataAPI.faculties.getAll(),
    ]).then(([u, f]) => {
      setUniversities(u.data);
      setFaculties(f.data);
    });
  }, []);

  useEffect(() => {
    const uni = searchParams.get('universityId') || 'uni-spu';
    const fac = searchParams.get('facultyId') || '';
    setFilters((prev) => (
      prev.universityId === uni && prev.facultyId === fac
        ? prev
        : { universityId: uni, facultyId: fac }
    ));
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    const params = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    costumeAPI.getAll(params)
      .then((r) => setCostumes(uniqueCostumesByFaculty(Array.isArray(r.data) ? r.data : [])))
      .catch(() => setCostumes([]))
      .finally(() => setLoading(false));
  }, [filters]);

  const filteredFaculties = filters.universityId
    ? faculties.filter((f) => f.universityId === filters.universityId)
    : faculties;

  return (
    <CustomerLayout>
      <div className="container" style={{ padding: '2rem 20px' }}>
        <h1 className="page-title">ชุดครุยศรีปทุม</h1>
        <p className="page-subtitle">เลือกคณะและสายสี — เลือกระดับปริญญาตอนจอง</p>

        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>มหาวิทยาลัย</label>
              <select className="form-input" value={filters.universityId}
                onChange={(e) => setFilters({ ...filters, universityId: e.target.value, facultyId: '' })}>
                <option value="">ทั้งหมด</option>
                {universities.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>คณะ</label>
              <select className="form-input" value={filters.facultyId}
                onChange={(e) => setFilters({ ...filters, facultyId: e.target.value })}>
                <option value="">ทั้งหมด</option>
                {filteredFaculties.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading">กำลังโหลด...</div>
        ) : costumes.length === 0 ? (
          <div className="empty-state">ไม่พบชุดครุยที่ตรงกับเงื่อนไข</div>
        ) : (
          <div className="grid-4">
            {costumes.map((c) => <CostumeCard key={c.id} costume={c} />)}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
