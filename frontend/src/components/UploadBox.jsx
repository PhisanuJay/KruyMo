import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

export default function UploadBox({
  onUpload,
  preview,
  onRemove,
  multiple = false,
  label = 'ลากไฟล์มาวาง หรือคลิกเพื่อเลือก',
  accept = 'image/*',
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      await onUpload(multiple ? Array.from(files) : files[0]);
    } finally {
      setUploading(false);
    }
  };

  const previews = Array.isArray(preview) ? preview : preview ? [preview] : [];

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        style={{
          border: `2px dashed ${dragging ? '#FF6B6B' : '#E8ECEF'}`,
          borderRadius: '16px',
          padding: '2rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? '#FFF5F5' : '#FAFAFA',
          transition: 'all 0.2s',
        }}
      >
        <Upload size={32} color="#FF6B6B" style={{ margin: '0 auto 12px' }} />
        <p style={{ color: '#636E72', fontSize: '0.9rem' }}>
          {uploading ? 'กำลังอัปโหลด...' : label}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {previews.length > 0 && (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
          {previews.map((url, i) => (
            <div key={i} style={{ position: 'relative', width: 100, height: 100 }}>
              {url ? (
                <img
                  src={url}
                  alt="preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }}
                />
              ) : (
                <div style={{
                  width: '100%', height: '100%', background: '#f0f0f0',
                  borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ImageIcon size={24} color="#ccc" />
                </div>
              )}
              {onRemove && (
                <button
                  onClick={() => onRemove(i)}
                  style={{
                    position: 'absolute', top: -6, right: -6,
                    background: '#E17055', color: 'white', borderRadius: '50%',
                    width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
