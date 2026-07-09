export default function UniversityTag({ name, color, size = 'md', textColor }) {
  const fontSize = size === 'sm' ? '0.75rem' : '0.85rem';
  const padding = size === 'sm' ? '4px 10px' : '6px 14px';
  const bg = color || '#636E72';
  const fg = textColor || (
    ['#f5f5f5', '#e8e8e8', '#ffffff', '#ffd700', '#f4c430'].includes(bg.toLowerCase())
      ? '#111'
      : 'white'
  );

  return (
    <span style={{
      display: 'inline-block',
      padding,
      borderRadius: '8px',
      fontSize,
      fontWeight: 700,
      color: fg,
      background: bg,
      whiteSpace: 'nowrap',
      border: fg === '#111' ? '1px solid rgba(0,0,0,0.08)' : 'none',
    }}>
      {name}
    </span>
  );
}
