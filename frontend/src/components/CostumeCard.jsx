import { useNavigate, Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import UniversityTag from './UniversityTag';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import { catalogCostumeName } from '../utils/costumes';

export default function CostumeCard({ costume }) {
  const facultyColor = costume.faculty?.color || costume.university?.color || '#6B7280';
  const mainImage = costume.images?.[0];
  const displayName = catalogCostumeName(costume);
  const tagTextColor = ['#f5f5f5', '#e8e8e8', '#ffd700', '#f4c430'].includes((facultyColor || '').toLowerCase())
    ? '#111'
    : undefined;
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useShop();
  const navigate = useNavigate();
  const favorited = isFavorite(costume.id);

  const handleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'customer') return;
    try {
      await toggleFavorite(costume.id);
    } catch {
      // ignore
    }
  };

  return (
    <Link to={`/costume/${costume.id}`} className="product-card">
      <div className="product-card-media">
        {mainImage ? (
          <img src={mainImage} alt={displayName} />
        ) : (
          <span style={{ fontSize: '4rem', opacity: 0.35 }}>🎓</span>
        )}
        <button
          type="button"
          className={`fav-btn ${favorited ? 'is-active' : ''}`}
          onClick={handleFavorite}
          aria-label={favorited ? 'ลบจากรายการโปรด' : 'เพิ่มรายการโปรด'}
          title={favorited ? 'ลบจากรายการโปรด' : 'เพิ่มรายการโปรด'}
        >
          <Heart size={18} fill={favorited ? 'currentColor' : 'none'} />
        </button>
        {costume.stock <= 3 && costume.stock > 0 && (
          <span className="stock-chip">เหลือ {costume.stock}</span>
        )}
        {costume.stock === 0 && (
          <span className="stock-chip out">หมด</span>
        )}
      </div>
      <div className="product-card-body">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {costume.university && (
            <UniversityTag name={costume.university.shortName} color={costume.university.color} size="sm" />
          )}
          {costume.faculty && (
            <UniversityTag
              name={costume.faculty.name.replace('คณะ', '')}
              color={facultyColor}
              size="sm"
              textColor={tagTextColor}
            />
          )}
        </div>
        <h3>{displayName}</h3>
        <p className="product-meta">
          เลือกระดับปริญญาและไซส์ตอนจอง
        </p>
        <div className="product-price-row">
          <span className="product-price">
            ฿{costume.pricePerDay}<small>/วัน</small>
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>มัดจำ ฿{costume.deposit}</span>
        </div>
      </div>
    </Link>
  );
}
