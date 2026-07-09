import { Link } from 'react-router-dom';
import UniversityTag from './UniversityTag';

const DEGREE_LABELS = { bachelor: 'ปริญญาตรี', master: 'ปริญญาโท', doctoral: 'ปริญญาเอก' };

export default function CostumeCard({ costume }) {
  const facultyColor = costume.faculty?.color || costume.university?.color || '#6B7280';
  const mainImage = costume.images?.[0];
  const tagTextColor = ['#f5f5f5', '#e8e8e8', '#ffd700', '#f4c430'].includes((facultyColor || '').toLowerCase())
    ? '#111'
    : undefined;

  return (
    <Link to={`/costume/${costume.id}`} className="product-card">
      <div className="product-card-media">
        {mainImage ? (
          <img src={mainImage} alt={costume.name} />
        ) : (
          <span style={{ fontSize: '4rem', opacity: 0.35 }}>🎓</span>
        )}
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
        <h3>{costume.name}</h3>
        <p className="product-meta">
          {DEGREE_LABELS[costume.degreeLevel] || costume.degreeLevel} · เลือกไซส์ตอนจอง
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
