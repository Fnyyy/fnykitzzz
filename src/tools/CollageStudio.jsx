import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Download, Plus, Trash2, LayoutGrid, Sliders, Palette, Save, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

const RATIOS = [
  { id: '1:1', name: '1:1 Square', w: 1, h: 1 },
  { id: '4:5', name: '4:5 IG Feed', w: 4, h: 5 },
  { id: '9:16', name: '9:16 Story/Reels', w: 9, h: 16 },
  { id: '3:4', name: '3:4 Portrait', w: 3, h: 4 },
  { id: '16:9', name: '16:9 Landscape', w: 16, h: 9 }
];

const LAYOUTS = {
  1: [{ slots: [{ x: 0, y: 0, w: 1, h: 1 }] }],
  2: [
    { name: 'Vertikal (2 baris)', slots: [{ x: 0, y: 0, w: 1, h: 0.5 }, { x: 0, y: 0.5, w: 1, h: 0.5 }] },
    { name: 'Horizontal (2 kolom)', slots: [{ x: 0, y: 0, w: 0.5, h: 1 }, { x: 0.5, y: 0, w: 0.5, h: 1 }] }
  ],
  3: [
    { name: '1 Atas, 2 Bawah', slots: [{ x: 0, y: 0, w: 1, h: 0.5 }, { x: 0, y: 0.5, w: 0.5, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.5, h: 0.5 }] },
    { name: '2 Atas, 1 Bawah', slots: [{ x: 0, y: 0, w: 0.5, h: 0.5 }, { x: 0.5, y: 0, w: 0.5, h: 0.5 }, { x: 0, y: 0.5, w: 1, h: 0.5 }] },
    { name: '3 Kolom', slots: [{ x: 0, y: 0, w: 0.333, h: 1 }, { x: 0.333, y: 0, w: 0.333, h: 1 }, { x: 0.666, y: 0, w: 0.334, h: 1 }] }
  ],
  4: [
    { name: '2x2 Grid', slots: [{ x: 0, y: 0, w: 0.5, h: 0.5 }, { x: 0.5, y: 0, w: 0.5, h: 0.5 }, { x: 0, y: 0.5, w: 0.5, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.5, h: 0.5 }] },
    { name: '1 Kiri Besar, 3 Kanan', slots: [{ x: 0, y: 0, w: 0.6, h: 1 }, { x: 0.6, y: 0, w: 0.4, h: 0.333 }, { x: 0.6, y: 0.333, w: 0.4, h: 0.333 }, { x: 0.6, y: 0.666, w: 0.4, h: 0.334 }] }
  ],
  6: [
    { name: '2 Kolom x 3 Baris', slots: [
      { x: 0, y: 0, w: 0.5, h: 0.333 }, { x: 0.5, y: 0, w: 0.5, h: 0.333 },
      { x: 0, y: 0.333, w: 0.5, h: 0.333 }, { x: 0.5, y: 0.333, w: 0.5, h: 0.333 },
      { x: 0, y: 0.666, w: 0.5, h: 0.334 }, { x: 0.5, y: 0.666, w: 0.5, h: 0.334 }
    ]}
  ]
};

const BG_COLORS = ['#f8f7f2', '#ffffff', '#292b27', '#f4dcdc', '#e5ddf5', '#dcece1', '#f4df86', '#dfebf5'];

export default function CollageStudio({ onBack }) {
  const [photoCount, setPhotoCount] = useState(4);
  const [selectedRatio, setSelectedRatio] = useState(RATIOS[1]); // 4:5 default
  const [layoutIndex, setLayoutIndex] = useState(0);
  const [photos, setPhotos] = useState({});
  const [gap, setGap] = useState(12);
  const [radius, setRadius] = useState(14);
  const [padding, setPadding] = useState(16);
  const [bgColor, setBgColor] = useState('#f8f7f2');
  const [savedStatus, setSavedStatus] = useState(false);

  const canvasRef = useRef(null);
  const activeSlotRef = useRef(null);
  const fileInputRef = useRef(null);

  const currentLayoutOptions = LAYOUTS[photoCount] || LAYOUTS[4];
  const activeLayout = currentLayoutOptions[layoutIndex % currentLayoutOptions.length];

  // Handle slot upload
  const handleSlotClick = (slotIndex) => {
    activeSlotRef.current = slotIndex;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || activeSlotRef.current === null) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotos(prev => ({ ...prev, [activeSlotRef.current]: ev.target.result }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const clearPhotos = () => {
    setPhotos({});
  };

  // Render to Canvas
  const renderCanvas = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');

    const baseWidth = 1080;
    const baseHeight = (baseWidth / selectedRatio.w) * selectedRatio.h;

    canvas.width = baseWidth;
    canvas.height = baseHeight;

    // Draw background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, baseWidth, baseHeight);

    const innerWidth = baseWidth - (padding * 2);
    const innerHeight = baseHeight - (padding * 2);

    // Load all images
    const loadPromises = activeLayout.slots.map((slot, idx) => {
      const src = photos[idx];
      if (!src) return Promise.resolve({ idx, img: null });
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ idx, img });
        img.onerror = () => resolve({ idx, img: null });
        img.src = src;
      });
    });

    const loadedImages = await Promise.all(loadPromises);

    activeLayout.slots.forEach((slot, idx) => {
      const slotX = padding + (slot.x * innerWidth) + (gap / 2);
      const slotY = padding + (slot.y * innerHeight) + (gap / 2);
      const slotW = (slot.w * innerWidth) - gap;
      const slotH = (slot.h * innerHeight) - gap;

      ctx.save();
      // Rounded rect clipping
      ctx.beginPath();
      ctx.roundRect(slotX, slotY, slotW, slotH, radius);
      ctx.clip();

      const item = loadedImages.find(i => i.idx === idx);
      if (item && item.img) {
        const img = item.img;
        const imgRatio = img.width / img.height;
        const targetRatio = slotW / slotH;
        let sx = 0, sy = 0, sw = img.width, sh = img.height;

        if (imgRatio > targetRatio) {
          sw = img.height * targetRatio;
          sx = (img.width - sw) / 2;
        } else {
          sh = img.width / targetRatio;
          sy = (img.height - sh) / 2;
        }

        ctx.drawImage(img, sx, sy, sw, sh, slotX, slotY, slotW, slotH);
      } else {
        // Placeholder box
        ctx.fillStyle = '#eeece5';
        ctx.fillRect(slotX, slotY, slotW, slotH);
      }
      ctx.restore();
    });

    return canvas;
  };

  const downloadCollage = async () => {
    await renderCanvas();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `fnykids-collage-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png', 0.95);
    link.click();
    confetti({ particleCount: 50, spread: 70 });
  };

  const saveToLocalCollection = () => {
    try {
      const collages = JSON.parse(localStorage.getItem('fny_collages') || '[]');
      const newCollage = {
        id: 'col_' + Date.now(),
        date: new Date().toISOString(),
        photoCount,
        ratio: selectedRatio.id,
        photos
      };
      collages.unshift(newCollage);
      localStorage.setItem('fny_collages', JSON.stringify(collages.slice(0, 20)));
      setSavedStatus(true);
      setTimeout(() => setSavedStatus(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="animate-fade" style={{ maxWidth: '1040px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
        <button onClick={onBack} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
          <ChevronLeft size={16} /> Kembali
        </button>
        <div style={{ textAlign: 'center', flex: 1, minWidth: '180px' }}>
          <h1 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.4rem)', fontWeight: 800, margin: 0 }}>fnykids Collage</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: '2px 0 0' }}>Buat kolase estetik dengan layout fleksibel, 100% lokal</p>
        </div>
        <div style={{ width: '40px' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '20px' }}>
        {/* Controls Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Ratio & Photo Count */}
          <div className="card">
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px' }}>Rasio Aspek</h3>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {RATIOS.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRatio(r)}
                  className={`btn ${selectedRatio.id === r.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                >
                  {r.name}
                </button>
              ))}
            </div>

            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '16px', marginBottom: '10px' }}>Jumlah Foto</h3>
            <div className="seg-control" style={{ width: '100%', justifyContent: 'space-between' }}>
              {[1, 2, 3, 4, 6].map(n => (
                <button
                  key={n}
                  onClick={() => { setPhotoCount(n); setLayoutIndex(0); }}
                  className={`seg-btn ${photoCount === n ? 'active' : ''}`}
                >
                  {n} Foto
                </button>
              ))}
            </div>

            {currentLayoutOptions.length > 1 && (
              <div style={{ marginTop: '14px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Gaya Layout</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {currentLayoutOptions.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setLayoutIndex(i)}
                      className={`btn ${layoutIndex === i ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                    >
                      {opt.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sliders for Gap, Radius, Padding */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sliders size={16} /> Jarak & Sudut
            </h3>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                <span>Jarak Antar Foto (Gap)</span>
                <span>{gap}px</span>
              </div>
              <input type="range" min="0" max="30" value={gap} onChange={e => setGap(Number(e.target.value))} style={{ width: '100%' }} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                <span>Sudut Membulat (Radius)</span>
                <span>{radius}px</span>
              </div>
              <input type="range" min="0" max="40" value={radius} onChange={e => setRadius(Number(e.target.value))} style={{ width: '100%' }} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                <span>Batas Tepi (Padding)</span>
                <span>{padding}px</span>
              </div>
              <input type="range" min="0" max="40" value={padding} onChange={e => setPadding(Number(e.target.value))} style={{ width: '100%' }} />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>Warna Latar (Background)</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {BG_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setBgColor(c)}
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background: c,
                      border: bgColor === c ? '2.5px solid var(--ink)' : '1px solid #ccc',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={clearPhotos} className="btn btn-secondary" style={{ flex: 1 }}>
              <Trash2 size={16} /> Kosongkan Slot
            </button>
            <button onClick={saveToLocalCollection} className="btn btn-secondary" style={{ flex: 1 }}>
              {savedStatus ? <><Check size={16} color="green" /> Tersimpan!</> : <><Save size={16} /> Simpan Proyek</>}
            </button>
          </div>
        </div>

        {/* Live Canvas Interactive Preview Column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          {/* Outer container with background, border, and padding */}
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              aspectRatio: `${selectedRatio.w} / ${selectedRatio.h}`,
              background: bgColor,
              borderRadius: '20px',
              padding: `${padding}px`,
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--line)',
              overflow: 'hidden',
              boxSizing: 'border-box',
              transition: 'var(--transition)'
            }}
          >
            {/* Inner slots area — slots position relative to this */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '100%'
              }}
            >
              {activeLayout.slots.map((slot, idx) => {
                const photo = photos[idx];
                const halfGap = gap / 2;
                return (
                  <div
                    key={idx}
                    onClick={() => handleSlotClick(idx)}
                    style={{
                      position: 'absolute',
                      left: `calc(${slot.x * 100}% + ${halfGap}px)`,
                      top: `calc(${slot.y * 100}% + ${halfGap}px)`,
                      width: `calc(${slot.w * 100}% - ${gap}px)`,
                      height: `calc(${slot.h * 100}% - ${gap}px)`,
                      borderRadius: `${radius}px`,
                      overflow: 'hidden',
                      background: photo ? '#000' : '#eeece5',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'transform 0.15s'
                    }}
                    title="Klik untuk memilih foto"
                  >
                    {photo ? (
                      <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ textAlign: 'center', color: '#888', padding: '10px' }}>
                        <Plus size={24} style={{ opacity: 0.6 }} />
                        <div style={{ fontSize: '0.72rem', fontWeight: 600, marginTop: '4px' }}>Foto {idx + 1}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={downloadCollage}
            className="btn btn-primary"
            style={{ width: '100%', maxWidth: '440px', padding: '12px' }}
          >
            <Download size={18} /> Unduh Kolase (High-Res PNG)
          </button>

          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
        </div>
      </div>
    </div>
  );
}
