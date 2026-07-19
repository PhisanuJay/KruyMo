import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, ArrowLeft } from 'lucide-react';
import { cartAPI, userAPI } from '../../services/api';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';
import CustomerLayout from '../../components/CustomerLayout';
import DeliveryAddressFields, {
  deliveryAddressFromUser,
  validateDeliveryAddress,
  normalizeDeliveryAddress,
} from '../../components/DeliveryAddressFields';

const DEGREE_LABELS = {
  bachelor: 'ปริญญาตรี',
  master: 'ปริญญาโท',
  doctoral: 'ปริญญาเอก',
};

export default function Cart() {
  const [step, setStep] = useState('cart'); // cart | confirm
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { user, updateUser } = useAuth();
  const [deliveryAddress, setDeliveryAddress] = useState(() => deliveryAddressFromUser(user));
  const { refreshCartCount, setCartCount } = useShop();
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await cartAPI.getAll();
      setItems(data);
      setCartCount(data.length);
      setSelectedIds(data.map((i) => i.id));
    } catch (err) {
      setError(err.response?.data?.error || 'โหลดตะกร้าไม่สำเร็จ');
      setItems([]);
      setSelectedIds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const prefillsAddress = () => {
    if (!user?.id) {
      setDeliveryAddress(deliveryAddressFromUser(user));
      return;
    }
    userAPI.get(user.id)
      .then(({ data }) => {
        updateUser(data);
        setDeliveryAddress(deliveryAddressFromUser(data));
      })
      .catch(() => {
        setDeliveryAddress(deliveryAddressFromUser(user));
      });
  };

  const handleRemove = async (id) => {
    try {
      await cartAPI.remove(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setSelectedIds((prev) => prev.filter((sid) => sid !== id));
      setCartCount((c) => Math.max(0, c - 1));
    } catch (err) {
      setError(err.response?.data?.error || 'ลบรายการไม่สำเร็จ');
    }
  };

  const handleClear = async () => {
    if (!window.confirm('ล้างตะกร้าทั้งหมดหรือไม่?')) return;
    try {
      await cartAPI.clear();
      setItems([]);
      setSelectedIds([]);
      setCartCount(0);
    } catch (err) {
      setError(err.response?.data?.error || 'ล้างตะกร้าไม่สำเร็จ');
    }
  };

  const toggleOne = (id) => {
    setSelectedIds((prev) => (
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    ));
  };

  const allSelected = items.length > 0 && selectedIds.length === items.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < items.length;

  const toggleAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(items.map((i) => i.id));
  };

  const selectedItems = items.filter((i) => selectedIds.includes(i.id));
  const totalRental = selectedItems.reduce((s, i) => s + (i.pricing?.rentalPrice || 0), 0);
  const totalDeposit = selectedItems.reduce((s, i) => s + (i.pricing?.deposit || 0), 0);
  const grandTotal = totalRental + totalDeposit;

  const goConfirm = () => {
    if (selectedItems.length === 0) {
      setError('กรุณาเลือกรายการในตะกร้าอย่างน้อย 1 รายการ');
      return;
    }
    setError('');
    setMessage('');
    prefillsAddress();
    setStep('confirm');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCheckout = async () => {
    if (selectedItems.length === 0) {
      setError('กรุณาเลือกรายการในตะกร้าอย่างน้อย 1 รายการ');
      return;
    }

    const addrError = validateDeliveryAddress(deliveryAddress);
    if (addrError) {
      setError(addrError);
      return;
    }

    setCheckingOut(true);
    setError('');
    setMessage('');
    try {
      const { data } = await cartAPI.checkout({
        deliveryAddress: normalizeDeliveryAddress(deliveryAddress),
        cartIds: selectedIds,
      });
      await refreshCartCount();
      setMessage(data.message);
      window.dispatchEvent(new Event('kruymo:notifications-refresh'));

      if (data.bookings?.length >= 1) {
        navigate(`/payment/${data.bookings[0].id}`, { replace: true });
        return;
      }
      setStep('cart');
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'ยืนยันจองไม่สำเร็จ');
    } finally {
      setCheckingOut(false);
    }
  };

  if (step === 'confirm' && selectedItems.length > 0) {
    return (
      <CustomerLayout>
        <div className="container" style={{ padding: '2rem 20px', maxWidth: 900 }}>
          <button
            type="button"
            className="booking-back"
            onClick={() => {
              setStep('cart');
              setError('');
            }}
          >
            <ArrowLeft size={16} />
            กลับไปตะกร้า
          </button>

          <h1 className="page-title">ยืนยันการจอง</h1>
          <p className="page-subtitle">
            กรอกที่อยู่จัดส่ง ตรวจสอบรายการที่เลือก แล้วยืนยันเพื่อชำระเงิน
          </p>
          {error && <div className="alert alert-error">{error}</div>}

          <DeliveryAddressFields value={deliveryAddress} onChange={setDeliveryAddress} />

          <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
            {selectedItems.map((item) => (
              <div
                key={item.id}
                className="card"
                style={{
                  padding: '1.15rem',
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr auto',
                  gap: '1rem',
                  alignItems: 'center',
                }}
              >
                <div style={{
                  width: 80, height: 96, borderRadius: 10, overflow: 'hidden',
                  background: '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {item.costume?.images?.[0] ? (
                    <img
                      src={item.costume.images[0]}
                      alt={item.costume.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                    />
                  ) : (
                    <span style={{ fontSize: '1.5rem', opacity: 0.4 }}>🎓</span>
                  )}
                </div>
                <div>
                  <strong>{item.costume?.name || 'ชุดครุย'}</strong>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {DEGREE_LABELS[item.degreeLevel] || item.degreeLevel}
                    {' · '}ไซส์ {item.size?.label || item.sizeId}
                  </p>
                  <p style={{ fontSize: '0.88rem', marginTop: 2 }}>
                    {new Date(item.startDate).toLocaleDateString('th-TH')}
                    {' – '}
                    {new Date(item.endDate).toLocaleDateString('th-TH')}
                    {item.pricing ? ` · ${item.pricing.days} วัน` : ''}
                  </p>
                </div>
                {item.pricing && (
                  <strong style={{ color: 'var(--primary)' }}>
                    ฿{item.pricing.total.toLocaleString()}
                  </strong>
                )}
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>ค่าเช่ารวม ({selectedItems.length} รายการ)</span>
              <strong>฿{totalRental.toLocaleString()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>มัดจำรวม</span>
              <strong>฿{totalDeposit.toLocaleString()}</strong>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', marginBottom: '1.25rem' }}>
              <strong>ยอดรวมทั้งสิ้น</strong>
              <strong style={{ color: 'var(--primary)' }}>฿{grandTotal.toLocaleString()}</strong>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={checkingOut}
                onClick={handleCheckout}
              >
                {checkingOut ? 'กำลังสร้างการจอง...' : 'ยืนยันการจองและชำระเงิน'}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                style={{ width: '100%' }}
                disabled={checkingOut}
                onClick={() => {
                  setStep('cart');
                  setError('');
                }}
              >
                กลับไปแก้ไขรายการ
              </button>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem', textAlign: 'center' }}>
              ที่อยู่ด้านบนจะใช้จัดส่งแมสฯ ให้ทุกรายการที่เลือก
            </p>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="container" style={{ padding: '2rem 20px', maxWidth: 900 }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShoppingCart size={28} color="var(--primary)" />
          ตะกร้าจองชุดครุย
        </h1>
        <p className="page-subtitle">ติ๊กรายการที่ต้องการ แล้วกดยืนยันจองเพื่อกรอกที่อยู่จัดส่ง</p>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        {loading ? (
          <div className="loading">กำลังโหลด...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            ตะกร้าว่าง{' '}
            <Link to="/catalog" style={{ color: 'var(--primary)' }}>ไปเลือกชุดครุย</Link>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: 12, flexWrap: 'wrap' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={toggleAll}
                  style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                />
                เลือกทั้งหมด ({selectedIds.length}/{items.length})
              </label>
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleClear}>
                ล้างตะกร้า
              </button>
            </div>

            <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
              {items.map((item) => {
                const checked = selectedIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className="card"
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleOne(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleOne(item.id);
                      }
                    }}
                    style={{
                      padding: '1.25rem',
                      display: 'grid',
                      gridTemplateColumns: 'auto 100px 1fr auto',
                      gap: '1rem',
                      alignItems: 'center',
                      cursor: 'pointer',
                      outline: checked ? '2px solid var(--primary)' : '2px solid transparent',
                      background: checked ? 'rgba(230, 57, 70, 0.03)' : '#fff',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleOne(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`เลือกรายการ ${item.costume?.name || ''}`}
                      style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                    />

                    <div style={{
                      width: 100, height: 120, borderRadius: 12, overflow: 'hidden',
                      background: '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {item.costume?.images?.[0] ? (
                        <img
                          src={item.costume.images[0]}
                          alt={item.costume.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                        />
                      ) : (
                        <span style={{ fontSize: '2rem', opacity: 0.4 }}>🎓</span>
                      )}
                    </div>

                    <div>
                      <Link
                        to={`/costume/${item.costumeId}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{ fontWeight: 700, color: 'inherit', textDecoration: 'none' }}
                      >
                        {item.costume?.name || 'ชุดครุย'}
                      </Link>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: 6 }}>
                        {DEGREE_LABELS[item.degreeLevel] || item.degreeLevel}
                        {' · '}ไซส์ {item.size?.label || item.sizeId}
                        {item.size?.description ? ` (${item.size.description})` : ''}
                      </p>
                      <p style={{ fontSize: '0.9rem', marginTop: 4 }}>
                        เริ่ม {new Date(item.startDate).toLocaleDateString('th-TH')}
                        {' – '}
                        คืน {new Date(item.endDate).toLocaleDateString('th-TH')}
                        {item.pricing ? ` · ${item.pricing.days} วัน` : ''}
                      </p>
                      {item.pricing && (
                        <p style={{ marginTop: 8, fontWeight: 700, color: 'var(--primary)' }}>
                          ฿{item.pricing.total.toLocaleString()}
                          <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {' '}(เช่า ฿{item.pricing.rentalPrice.toLocaleString()} + มัดจำ ฿{item.pricing.deposit.toLocaleString()})
                          </span>
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(item.id);
                      }}
                      aria-label="ลบออกจากตะกร้า"
                      title="ลบออกจากตะกร้า"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>ค่าเช่ารวม ({selectedItems.length} รายการ)</span>
                <strong>฿{totalRental.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>มัดจำรวม</span>
                <strong>฿{totalDeposit.toLocaleString()}</strong>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', marginBottom: '1.25rem' }}>
                <strong>ยอดรวมที่เลือก</strong>
                <strong style={{ color: 'var(--primary)' }}>฿{grandTotal.toLocaleString()}</strong>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={selectedItems.length === 0}
                onClick={goConfirm}
              >
                {selectedItems.length === 0
                  ? 'เลือกรายการก่อน'
                  : `ยืนยันจองรายการที่เลือก (${selectedItems.length})`}
              </button>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem', textAlign: 'center' }}>
                ขั้นถัดไปจะให้กรอกที่อยู่จัดส่งก่อนชำระเงิน
              </p>
            </div>
          </>
        )}
      </div>
    </CustomerLayout>
  );
}
