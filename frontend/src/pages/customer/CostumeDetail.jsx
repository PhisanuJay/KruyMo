import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { costumeAPI, masterDataAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CustomerLayout from '../../components/CustomerLayout';
import UniversityTag from '../../components/UniversityTag';

const DEGREE_OPTIONS = [
  { value: 'bachelor', label: 'ปริญญาตรี' },
  { value: 'master', label: 'ปริญญาโท' },
  { value: 'doctoral', label: 'ปริญญาเอก' },
];

export default function CostumeDetail() {
  const { id } = useParams();
  const [costume, setCostume] = useState(null);
  const [sizes, setSizes] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sizeId, setSizeId] = useState('');
  const [degreeLevel, setDegreeLevel] = useState('bachelor');
  const [availability, setAvailability] = useState(null);
  const [checking, setChecking] = useState(false);
  const [availError, setAvailError] = useState('');
  const [showSizeChart, setShowSizeChart] = useState(true);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      costumeAPI.get(id),
      masterDataAPI.sizes.getAll(),
    ]).then(([c, s]) => {
      setCostume(c.data);
      setSizes(s.data);
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!startDate || !endDate || !degreeLevel) {
      setAvailability(null);
      setAvailError('');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setAvailability(null);
      setAvailError('วันคืนชุดต้องไม่ก่อนวันรับชุด');
      return;
    }

    let cancelled = false;
    setChecking(true);
    setAvailError('');
    costumeAPI.availability(id, { startDate, endDate, degreeLevel })
      .then((r) => {
        if (cancelled) return;
        setAvailability(r.data);
        const stillOk = r.data.options.find((o) => o.sizeId === sizeId && o.inStock);
        if (!stillOk) setSizeId('');
      })
      .catch((err) => {
        if (cancelled) return;
        setAvailability(null);
        setAvailError(err.response?.data?.error || 'ตรวจสอบคงเหลือไม่สำเร็จ');
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => { cancelled = true; };
  }, [id, startDate, endDate, degreeLevel]);

  const days = startDate && endDate
    ? Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000) + 1)
    : 0;
  const rentalPrice = days * (costume?.pricePerDay || 0);
  const total = rentalPrice + (costume?.deposit || 0);
  const sizeOptions = availability?.options || sizes.map((s) => ({
    sizeId: s.id,
    label: s.label,
    description: s.description,
    heightMin: s.heightMin,
    heightMax: s.heightMax,
    available: null,
    inStock: false,
  }));
  const selectedSize = sizeOptions.find((s) => s.sizeId === sizeId);
  const datesReady = Boolean(startDate && endDate && !availError);
  const canBook = datesReady && sizeId && degreeLevel && selectedSize?.inStock;

  const handleBook = () => {
    if (!user) { navigate('/login'); return; }
    if (!canBook) return;
    navigate(`/booking/${id}`, {
      state: {
        startDate,
        endDate,
        sizeId,
        degreeLevel,
        size: selectedSize,
        costume,
      },
    });
  };

  if (loading) return <CustomerLayout><div className="loading">กำลังโหลด...</div></CustomerLayout>;
  if (!costume) return <CustomerLayout><div className="empty-state">ไม่พบชุดครุย</div></CustomerLayout>;

  const images = costume.images?.length ? costume.images : [null];
  const facultyColor = costume.faculty?.color || '#636E72';

  return (
    <CustomerLayout>
      <div className="container" style={{ padding: '2rem 20px' }}>
        <Link to="/catalog" style={{ color: 'var(--primary)', fontSize: '0.9rem', marginBottom: '1rem', display: 'inline-block' }}>
          ← กลับไปหน้ารายการ
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }} className="grid-2">
          <div>
            <div style={{
              height: 480, borderRadius: '24px', overflow: 'hidden',
              background: '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow)',
            }}>
              {images[activeImage] ? (
                <img
                  src={images[activeImage]}
                  alt={costume.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                />
              ) : (
                <span style={{ fontSize: '6rem', opacity: 0.4 }}>🎓</span>
              )}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              {costume.university && <UniversityTag name={costume.university.name} color={costume.university.color} />}
              {costume.faculty && <UniversityTag name={costume.faculty.name} color={facultyColor} />}
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>{costume.name}</h1>
            <p style={{ color: '#636E72', marginBottom: '1rem' }}>{costume.description}</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1.5rem' }}>
              ฿{costume.pricePerDay}/วัน · มัดจำ ฿{costume.deposit}
            </p>

            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '0.35rem' }}>1) เลือกวันจองก่อน</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                เลือกวันรับ-คืนก่อน ระบบจะเช็คว่าไซส์และระดับไหนยังว่างในช่วงนั้น
              </p>

              <div className="grid-2">
                <div className="form-group">
                  <label>วันรับชุด</label>
                  <input className="form-input" type="date" value={startDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (endDate && e.target.value && endDate < e.target.value) setEndDate('');
                    }} />
                </div>
                <div className="form-group">
                  <label>วันคืนชุด</label>
                  <input className="form-input" type="date" value={endDate}
                    min={startDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>

              {days > 0 && (
                <div style={{ background: '#f8f9fa', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                  <p>จำนวน {days} วัน × ฿{costume.pricePerDay} = <strong>฿{rentalPrice}</strong></p>
                  <p>เงินมัดจำ = <strong>฿{costume.deposit}</strong></p>
                  <p style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)', marginTop: '8px' }}>
                    รวมทั้งสิ้น ฿{total}
                  </p>
                </div>
              )}

              <h3 style={{ fontWeight: 700, marginBottom: '0.35rem' }}>2) เลือกระดับและไซส์</h3>
              {!datesReady && (
                <div className="alert alert-info">กรุณาเลือกวันรับชุดและวันคืนชุดก่อน เพื่อดูคงเหลือจริง</div>
              )}
              {availError && <div className="alert alert-error">{availError}</div>}
              {checking && <div className="alert alert-info">กำลังเช็คคงเหลือตามวันที่เลือก...</div>}

              <div className="form-group">
                <label>ระดับปริญญา</label>
                <select
                  className="form-input"
                  value={degreeLevel}
                  disabled={!datesReady}
                  onChange={(e) => setDegreeLevel(e.target.value)}
                >
                  {DEGREE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>ไซส์</label>
                <select
                  className="form-input"
                  value={sizeId}
                  disabled={!datesReady || checking}
                  onChange={(e) => setSizeId(e.target.value)}
                >
                  <option value="">เลือกไซส์ที่ว่าง</option>
                  {sizeOptions.map((s) => (
                    <option key={s.sizeId} value={s.sizeId} disabled={datesReady && !s.inStock}>
                      {s.label} ({s.description})
                      {datesReady ? (s.inStock ? ` · เหลือ ${s.available}` : ' · เต็มแล้ว') : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSize && datesReady && (
                <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: selectedSize.inStock ? 'var(--success)' : 'var(--danger)' }}>
                  {selectedSize.inStock
                    ? `ไซส์ ${selectedSize.label} ว่าง ${selectedSize.available} ชุด ในช่วงวันที่เลือก`
                    : `ไซส์ ${selectedSize.label} เต็มในช่วงวันที่เลือก`}
                </p>
              )}

              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ marginBottom: '1rem', paddingLeft: 0 }}
                onClick={() => setShowSizeChart((v) => !v)}
              >
                {showSizeChart ? 'ซ่อนตารางไซส์' : 'ดูตารางไซส์ตามส่วนสูง'}
              </button>

              {showSizeChart && (
                <div className="size-chart" style={{ marginBottom: '1.25rem' }}>
                  <div className="size-chart-head">
                    <strong>ตารางไซส์ชุดครุย</strong>
                    <span>{datesReady ? 'คงเหลือตามวันที่เลือก' : 'อ้างอิงตามส่วนสูง (ซม.)'}</span>
                  </div>
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Size</th>
                          <th>Height (cm)</th>
                          <th>คงเหลือ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sizeOptions.map((s) => (
                          <tr
                            key={s.sizeId}
                            className={s.sizeId === sizeId ? 'is-selected' : ''}
                            onClick={() => {
                              if (!datesReady || !s.inStock) return;
                              setSizeId(s.sizeId);
                            }}
                            style={{ cursor: datesReady && s.inStock ? 'pointer' : 'default', opacity: datesReady && !s.inStock ? 0.45 : 1 }}
                          >
                            <td><strong>{s.label}</strong></td>
                            <td>{s.heightMin}-{s.heightMax}</td>
                            <td>
                              {!datesReady && '-'}
                              {datesReady && checking && '...'}
                              {datesReady && !checking && (s.inStock ? s.available : 'เต็ม')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                    เลือกวันก่อน แล้วคลิกแถวที่ยังว่างเพื่อเลือกไซส์ · ไม่ใช้เกณฑ์น้ำหนัก
                  </p>
                </div>
              )}

              <button className="btn btn-primary" style={{ width: '100%' }}
                disabled={!canBook} onClick={handleBook}>
                {!datesReady ? 'เลือกวันจองก่อน' : !sizeId ? 'เลือกไซส์ที่ว่าง' : 'จองชุดครุย'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
