import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { favoriteAPI } from '../../services/api';
import { useShop } from '../../context/ShopContext';
import CustomerLayout from '../../components/CustomerLayout';
import CostumeCard from '../../components/CostumeCard';

export default function Favorites() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { favoriteIds } = useShop();

  useEffect(() => {
    setLoading(true);
    favoriteAPI.getAll()
      .then((r) => setItems(Array.isArray(r.data) ? r.data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setItems((prev) => prev.filter((f) => favoriteIds.includes(f.costumeId)));
  }, [favoriteIds]);

  return (
    <CustomerLayout>
      <div className="container" style={{ padding: '2rem 20px' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Heart size={28} color="var(--primary)" fill="var(--primary)" />
          รายการโปรด
        </h1>
        <p className="page-subtitle">ชุดครุยที่คุณกดหัวใจเก็บไว้</p>

        {loading ? (
          <div className="loading">กำลังโหลด...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            ยังไม่มีรายการโปรด{' '}
            <Link to="/catalog" style={{ color: 'var(--primary)' }}>ไปเลือกชุดครุย</Link>
          </div>
        ) : (
          <div className="grid-4">
            {items.map((f) => (
              <CostumeCard key={f.id} costume={f.costume} />
            ))}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
