import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { cartAPI } from '../../services/api';
import { useShop } from '../../context/ShopContext';
import CustomerLayout from '../../components/CustomerLayout';
import DeliveryAddressFields, {
  emptyDeliveryAddress,
  validateDeliveryAddress,
  normalizeDeliveryAddress,
} from '../../components/DeliveryAddressFields';

const DEGREE_LABELS = {
  bachelor: 'ปริญญาตรี',
  master: 'ปริญญาโท',
  doctoral: 'ปริญญาเอก',
};

export default function Cart() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState(emptyDeliveryAddress());
  const { refreshCartCount, setCartCount } = useShop();
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await cartAPI.getAll();
      setItems(data);
      setCartCount(data.length);
    } catch (err) {
      setError(err.response?.data?.error || 'โหลดตะกร้าไม่สำเร็จ');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRemove = async (id) => {
    try {
      await cartAPI.remove(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
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
      setCartCount(0);
    } catch (err) {
      setError(err.response?.data?.error || 'ล้างตะกร้าไม่สำเร็จ');
    }
  };

  const handleCheckout = async () => {
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
      });
      await refreshCartCount();
      setMessage(data.message);
      window.dispatchEvent(new Event('kruymo:notifications-refresh'));

      if (data.bookings?.length === 1) {
        navigate(`/payment/${data.bookings[0].id}`);
        return;
      }
      if (data.bookings?.length > 1) {
        navigate('/bookings');
        return;
      }
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'ยืนยันจองไม่สำเร็จ');
      await load();
    } finally {
      setCheckingOut(false);
    }
  };

  const totalRental = items.reduce((s, i) => s + (i.pricing?.rentalPrice || 0), 0);
  const totalDeposit = items.reduce((s, i) => s + (i.pricing?.deposit || 0), 0);
  const grandTotal = totalRental + totalDeposit;

  return (
    <CustomerLayout>
      <div className="container" style={{ padding: '2rem 20px', maxWidth: 900 }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShoppingCart size={28} color="var(--primary)" />
          ตะกร้าจองชุดครุย
        </h1>
        <p className="page-subtitle">สั่งจองหลายชุดพร้อมกัน แล้วชำระเงินทีละรายการ</p>

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
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleClear}>
                ล้างตะกร้า
              </button>
            </div>

            <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  className="card"
                  style={{
                    padding: '1.25rem',
                    display: 'grid',
                    gridTemplateColumns: '100px 1fr auto',
                    gap: '1rem',
                    alignItems: 'center',
                  }}
                >
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
                    onClick={() => handleRemove(item.id)}
                    aria-label="ลบออกจากตะกร้า"
                    title="ลบออกจากตะกร้า"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <DeliveryAddressFields value={deliveryAddress} onChange={setDeliveryAddress} />

            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>ค่าเช่ารวม</span>
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
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={checkingOut}
                onClick={handleCheckout}
              >
                {checkingOut ? 'กำลังสร้างการจอง...' : `ยืนยันจองทั้งหมด (${items.length} รายการ)`}
              </button>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem', textAlign: 'center' }}>
                ที่อยู่ด้านบนจะใช้จัดส่งแมสฯ ให้ทุกรายการในตะกร้านี้
              </p>
            </div>
          </>
        )}
      </div>
    </CustomerLayout>
  );
}
