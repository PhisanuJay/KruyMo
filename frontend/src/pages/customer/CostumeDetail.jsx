import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import { costumeAPI, masterDataAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useShop } from '../../context/ShopContext';
import CustomerLayout from '../../components/CustomerLayout';
import UniversityTag from '../../components/UniversityTag';
import DateRangePicker from '../../components/DateRangePicker';

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
  const [degreeLevel, setDegreeLevel] = useState('');
  const [availability, setAvailability] = useState(null);
  const [checking, setChecking] = useState(false);
  const [availError, setAvailError] = useState('');
  const [cartMsg, setCartMsg] = useState('');
  const [cartError, setCartError] = useState('');
  const [addingCart, setAddingCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { isFavorite, toggleFavorite, addToCart } = useShop();
  const navigate = useNavigate();
  const favorited = isFavorite(id);

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
    if (!degreeLevel || !startDate || !endDate) {
      setAvailability(null);
      setAvailError('');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setAvailability(null);
      setAvailError('วันคืนชุดต้องไม่ก่อนวันเริ่มเช่า');
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

  const handleFavorite = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      await toggleFavorite(id);
    } catch {
      // ignore
    }
  };

  const handleAddToCart = async () => {
    if (!user) { navigate('/login'); return; }
    if (!canBook) return;
    setAddingCart(true);
    setCartMsg('');
    setCartError('');
    try {
      const result = await addToCart({ costumeId: id, startDate, endDate, sizeId, degreeLevel });
      if (result?.needsLogin) {
        navigate('/login');
        return;
      }
      setCartMsg('เพิ่มลงตะกร้าแล้ว');
    } catch (err) {
      setCartError(err.response?.data?.error || 'เพิ่มตะกร้าไม่สำเร็จ');
    } finally {
      setAddingCart(false);
    }
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
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: '0.5rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, flex: 1, margin: 0 }}>{costume.name}</h1>
              <button
                type="button"
                className={`fav-btn detail ${favorited ? 'is-active' : ''}`}
                onClick={handleFavorite}
                aria-label={favorited ? 'ลบจากรายการโปรด' : 'เพิ่มรายการโปรด'}
                title={favorited ? 'ลบจากรายการโปรด' : 'เพิ่มรายการโปรด'}
              >
                <Heart size={20} fill={favorited ? 'currentColor' : 'none'} />
              </button>
            </div>
            <p style={{ color: '#636E72', marginBottom: '1rem' }}>{costume.description}</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1.5rem' }}>
              ฿{costume.pricePerDay}/วัน · มัดจำ ฿{costume.deposit}
            </p>

            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '0.35rem' }}>1) เลือกระดับปริญญา</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                เลือกระดับชั้นก่อน แล้วค่อยเลือกวันเช่าและไซส์
              </p>

              <div className="form-group">
                <label>ระดับปริญญา *</label>
                <select
                  className="form-input"
                  value={degreeLevel}
                  onChange={(e) => {
                    setDegreeLevel(e.target.value);
                    setSizeId('');
                    setAvailability(null);
                  }}
                >
                  <option value="">เลือกระดับปริญญา</option>
                  {DEGREE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {degreeLevel && (
                <>
                  <h3 style={{ fontWeight: 700, marginBottom: '0.35rem', marginTop: '0.5rem' }}>2) เลือกวันจอง</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    เลือกช่วงวันเช่า ระบบจะเช็คไซส์ที่ว่างในช่วงนั้น
                  </p>

                  <DateRangePicker
                    startDate={startDate}
                    endDate={endDate}
                    minDate={new Date().toISOString().split('T')[0]}
                    onChange={({ startDate: s, endDate: e }) => {
                      setStartDate(s);
                      setEndDate(e);
                      setSizeId('');
                    }}
                  />

                  {days > 0 && (
                    <div style={{ background: '#f8f9fa', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                      <p>จำนวน {days} วัน × ฿{costume.pricePerDay} = <strong>฿{rentalPrice}</strong></p>
                      <p>เงินมัดจำ = <strong>฿{costume.deposit}</strong></p>
                      <p style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)', marginTop: '8px' }}>
                        รวมทั้งสิ้น ฿{total}
                      </p>
                    </div>
                  )}
                </>
              )}

              {degreeLevel && datesReady && (
                <>
                  <h3 style={{ fontWeight: 700, marginBottom: '0.35rem' }}>3) เลือกไซส์</h3>
                  {availError && <div className="alert alert-error">{availError}</div>}
                  {checking && <div className="alert alert-info">กำลังเช็คคงเหลือตามวันที่เลือก...</div>}

                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label>ไซส์ — คลิกแถวในตารางเพื่อเลือก</label>
                  </div>

                  <div className="size-chart" style={{ marginBottom: '1rem' }}>
                    <div className="size-chart-head">
                      <strong>ตารางไซส์ชุดครุย</strong>
                      <span>คงเหลือตามวันที่เลือก</span>
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
                                if (!s.inStock) return;
                                setSizeId(s.sizeId);
                              }}
                              style={{ cursor: s.inStock ? 'pointer' : 'default', opacity: !s.inStock ? 0.45 : 1 }}
                            >
                              <td><strong>{s.label}</strong></td>
                              <td>{s.heightMin}-{s.heightMax}</td>
                              <td>
                                {checking && '...'}
                                {!checking && (s.inStock ? s.available : 'เต็ม')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                      คลิกแถวที่ยังว่างเพื่อเลือกไซส์ · ไม่ใช้เกณฑ์น้ำหนัก
                    </p>
                  </div>

                  {selectedSize && (
                    <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: selectedSize.inStock ? 'var(--success)' : 'var(--danger)' }}>
                      {selectedSize.inStock
                        ? `เลือกไซส์ ${selectedSize.label} แล้ว · ว่าง ${selectedSize.available} ชุด ในช่วงวันที่เลือก`
                        : `ไซส์ ${selectedSize.label} เต็มในช่วงวันที่เลือก`}
                    </p>
                  )}
                  {!sizeId && !checking && (
                    <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>
                      ยังไม่ได้เลือกไซส์ — คลิกแถวในตารางด้านบน
                    </p>
                  )}
                </>
              )}

              {degreeLevel && !datesReady && (
                <div className="alert alert-info" style={{ marginTop: '0.5rem' }}>
                  กรุณาเลือกวันเริ่มเช่าและวันคืนชุดก่อน เพื่อดูตารางไซส์
                </div>
              )}
              {!degreeLevel && (
                <div className="alert alert-info">กรุณาเลือกระดับปริญญาก่อน</div>
              )}
              {availError && !datesReady && <div className="alert alert-error">{availError}</div>}

              {cartMsg && <div className="alert alert-success">{cartMsg} <Link to="/cart">ดูตะกร้า</Link></div>}
              {cartError && <div className="alert alert-error">{cartError}</div>}

              <div style={{ display: 'grid', gap: 10, marginTop: '1rem' }}>
                <button className="btn btn-primary" style={{ width: '100%' }}
                  disabled={!canBook} onClick={handleBook}>
                  {!degreeLevel
                    ? 'เลือกระดับปริญญาก่อน'
                    : !datesReady
                      ? 'เลือกวันจองก่อน'
                      : !sizeId
                        ? 'เลือกไซส์จากตาราง'
                        : 'จองชุดครุยเลย'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  disabled={!canBook || addingCart}
                  onClick={handleAddToCart}
                >
                  <ShoppingCart size={18} />
                  {addingCart ? 'กำลังเพิ่ม...' : 'เพิ่มลงตะกร้า'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
