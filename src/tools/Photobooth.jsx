import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Download, Image as ImageIcon, Sparkles, Check, ChevronLeft, Trash2, Sliders } from 'lucide-react';
import confetti from 'canvas-confetti';

const THEMES = [
  { id: 'classic', name: 'Classic Burgundy', bg: '#5f1d2b', ink: '#f5e4c3', accent: '#a65459', title: 'OUR LITTLE MEMORIES', sub: 'THE PHOTO CLUB' },
  { id: 'candy', name: 'Sweetheart Pink', bg: '#f7cfe1', ink: '#8e365e', accent: '#dca4bd', title: 'SWEET LITTLE MOMENTS', sub: 'WITH LOVE · ALWAYS' },
  { id: 'film', name: '35mm Film Noir', bg: '#20201e', ink: '#ede9dc', accent: '#7a7c6f', title: 'ONE GOOD DAY', sub: '35MM FILM · MEMORY VAULT' },
  { id: 'ticket', name: 'Blue Ticket', bg: '#dce8f5', ink: '#224263', accent: '#8ca9c4', title: 'A TICKET TO US', sub: 'ADMIT ONE · MEMORY CLUB' },
  { id: 'garden', name: 'Matcha Garden', bg: '#dce8c6', ink: '#375225', accent: '#8ea879', title: 'SECRET GARDEN', sub: 'SPRING BOTANICAL' },
  { id: 'lavender', name: 'Lavender Mist', bg: '#e5ddf5', ink: '#4b3970', accent: '#9b88bd', title: 'PASTEL NOSTALGIA', sub: 'GOOD VIBES ONLY' },
  { id: 'minimal', name: 'Clean Cream', bg: '#f8f6ee', ink: '#292b27', accent: '#c4c2b5', title: 'MOMENTS & STORIES', sub: 'AUTHENTIC MEMORIES' }
];

const STICKERS = ['✨', '❤️', '🌸', '🎀', '🧸', '☕', '🍀', '⭐', '✌️', '💫', '🌻', '🍒'];

export default function Photobooth({ onBack }) {
  const [photos, setPhotos] = useState([]);
  const [photoTarget, setPhotoTarget] = useState(4); // 3 or 4 photos
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [customTitle, setCustomTitle] = useState(THEMES[0].title);
  const [customSub, setCustomSub] = useState(THEMES[0].sub);
  const [dateStamp, setDateStamp] = useState(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }));
  const [selectedSticker, setSelectedSticker] = useState('✨');
  const [layoutMode, setLayoutMode] = useState('strip'); // 'strip' or 'grid'

  // Camera states
  const [cameraActive, setCameraActive] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  const [cameraError, setCameraError] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const stripCanvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize camera
  const startCamera = async (overrideFacing) => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      const targetFacing = overrideFacing || facingMode;
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: targetFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
      } catch (e) {
        console.warn('Strict constraints failed, fallback to basic video:', e);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      streamRef.current = stream;
      setCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(err => console.log('play error:', err));
      }
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('Gagal mengakses kamera. Pastikan browser diizinkan mengakses kamera di setelan.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch(e => console.log('play error:', e));
    }
  }, [cameraActive]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Update title/sub when theme changes
  const handleThemeSelect = (theme) => {
    setSelectedTheme(theme);
    setCustomTitle(theme.title);
    setCustomSub(theme.sub);
  };

  // Capture single photo from webcam
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    const v = videoRef.current;
    canvas.width = v.videoWidth || 640;
    canvas.height = v.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    
    // Mirror if selfie
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    setPhotos(prev => [...prev, dataUrl]);
    
    if (photos.length + 1 >= photoTarget) {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    }
  };

  // Start automatic sequence with countdown
  const startAutoCapture = () => {
    if (photos.length >= photoTarget) setPhotos([]);
    let count = 3;
    setCountdown(count);

    const timer = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(timer);
        setCountdown(null);
        capturePhoto();
      }
    }, 1000);
  };

  // Upload photo from disk
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const readers = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.readAsDataURL(file);
      });
    });
    Promise.all(readers).then(results => {
      setPhotos(prev => [...prev, ...results].slice(0, photoTarget));
    });
    e.target.value = '';
  };

  // Remove photo
  const removePhoto = (idx) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  // Render high-res strip to canvas for export
  const renderStripToCanvas = () => {
    const canvas = stripCanvasRef.current;
    if (!canvas || photos.length === 0) return null;

    const ctx = canvas.getContext('2d');
    const isGrid = layoutMode === 'grid' && photos.length === 4;

    const stripWidth = isGrid ? 800 : 480;
    const photoWidth = isGrid ? 360 : 420;
    const photoHeight = isGrid ? 360 : 315;
    const padding = 30;
    const gap = 16;
    const headerHeight = 70;
    const footerHeight = 110;

    const totalHeight = isGrid
      ? padding * 2 + headerHeight + (photoHeight * 2) + gap + footerHeight
      : padding * 2 + headerHeight + (photos.length * photoHeight) + ((photos.length - 1) * gap) + footerHeight;

    canvas.width = stripWidth;
    canvas.height = totalHeight;

    // Background
    ctx.fillStyle = selectedTheme.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle texture border
    ctx.strokeStyle = selectedTheme.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);

    // Header Text
    ctx.fillStyle = selectedTheme.ink;
    ctx.textAlign = 'center';
    ctx.font = '700 18px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText(customTitle.toUpperCase(), canvas.width / 2, padding + 35);

    // Render each photo
    const imagePromises = photos.map(src => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = src;
      });
    });

    return Promise.all(imagePromises).then(images => {
      let currentY = padding + headerHeight;

      if (isGrid) {
        images.forEach((img, idx) => {
          const col = idx % 2;
          const row = Math.floor(idx / 2);
          const x = padding + col * (photoWidth + gap) + 5;
          const y = currentY + row * (photoHeight + gap);

          // Draw white photo border
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x - 4, y - 4, photoWidth + 8, photoHeight + 8);

          // Draw image cropped to center
          drawCoverImage(ctx, img, x, y, photoWidth, photoHeight);
        });
        currentY += (photoHeight * 2) + gap;
      } else {
        images.forEach((img) => {
          const x = (stripWidth - photoWidth) / 2;
          // Draw white photo border
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x - 4, currentY - 4, photoWidth + 8, photoHeight + 8);

          // Draw image
          drawCoverImage(ctx, img, x, currentY, photoWidth, photoHeight);
          currentY += photoHeight + gap;
        });
      }

      // Footer
      const footerY = currentY + 30;
      ctx.fillStyle = selectedTheme.ink;
      ctx.textAlign = 'center';
      ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
      ctx.letterSpacing = '2px';
      ctx.fillText(customSub.toUpperCase(), canvas.width / 2, footerY);

      // Date & Sticker
      ctx.font = '400 11px monospace';
      ctx.fillStyle = selectedTheme.accent;
      ctx.fillText(`• ${dateStamp} • ${selectedSticker} • FNYKIDS BOOTH`, canvas.width / 2, footerY + 24);

      return canvas;
    });
  };

  const drawCoverImage = (ctx, img, x, y, w, h) => {
    const imgRatio = img.width / img.height;
    const targetRatio = w / h;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;

    if (imgRatio > targetRatio) {
      sw = img.height * targetRatio;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / targetRatio;
      sy = (img.height - sh) / 2;
    }

    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  };

  const handleDownload = async () => {
    if (photos.length === 0) return;
    await renderStripToCanvas();
    const canvas = stripCanvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `fnykids-booth-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    confetti({ particleCount: 70, spread: 80 });
  };

  return (
    <div className="animate-fade" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <button onClick={onBack} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
          <ChevronLeft size={18} /> Kembali
        </button>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Photobooth Strip</h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Foto strip bergaya photobox Korea & vintage retro by fnykids</p>
        </div>
        <div style={{ width: '80px' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Left Column: Camera & Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Camera Viewport */}
          <div className="card" style={{ position: 'relative', overflow: 'hidden', padding: 0, background: '#1c1c1c', minHeight: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Video element ALWAYS mounted to guarantee ref and stream binding */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => {
                videoRef.current?.play().catch(() => {});
              }}
              style={{
                width: '100%',
                height: '100%',
                maxHeight: '380px',
                objectFit: 'cover',
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                display: cameraActive ? 'block' : 'none'
              }}
            />

            {cameraActive && countdown !== null && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '5rem',
                fontWeight: 900,
                animation: 'popIn 0.3s'
              }}>
                {countdown}
              </div>
            )}

            {cameraActive && (
              <div style={{
                position: 'absolute',
                inset: '20px',
                border: '1.5px dashed rgba(255,255,255,0.4)',
                borderRadius: '12px',
                pointerEvents: 'none'
              }} />
            )}

            {!cameraActive && (
              <div style={{ textAlign: 'center', padding: '30px', color: '#fff' }}>
                <Camera size={44} style={{ opacity: 0.6, marginBottom: '12px' }} />
                <p style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '6px' }}>Kamera Belum Aktif</p>
                <p style={{ fontSize: '0.8rem', color: '#aaa', maxWidth: '260px', margin: '0 auto 16px' }}>
                  Buka kamera untuk mengambil foto secara langsung, atau unggah foto dari komputermu.
                </p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button onClick={() => startCamera()} className="btn btn-accent">
                    <Camera size={16} /> Buka Kamera
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="btn" style={{ background: '#333', color: '#fff' }}>
                    <ImageIcon size={16} /> Unggah Foto
                  </button>
                </div>
              </div>
            )}
          </div>

          {cameraError && (
            <div style={{ background: '#fdf0f0', border: '1px solid #f8c2c2', color: '#a33', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem' }}>
              {cameraError}
            </div>
          )}

          {/* Camera Buttons */}
          {cameraActive && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  const nextFacing = facingMode === 'user' ? 'environment' : 'user';
                  setFacingMode(nextFacing);
                  startCamera(nextFacing);
                }}
                className="btn btn-secondary"
                title="Ganti Kamera"
              >
                <RefreshCw size={16} /> Balik
              </button>
              <button
                onClick={startAutoCapture}
                disabled={countdown !== null}
                className="btn btn-accent"
                style={{ padding: '12px 28px', fontSize: '1rem', fontWeight: 700 }}
              >
                <Camera size={20} /> Jepret ({photos.length}/{photoTarget})
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-secondary"
                title="Unggah Foto dari Berkas"
              >
                <ImageIcon size={16} />
              </button>
              <button onClick={stopCamera} className="btn btn-secondary" style={{ color: '#c33' }}>
                Matikan
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />

          {/* Customization Options */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} /> Pengaturan Photostrip
            </h3>

            {/* Target photos & Layout */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Jumlah Frame</label>
                <div className="seg-control" style={{ width: '100%', justifyContent: 'space-around' }}>
                  <button className={`seg-btn ${photoTarget === 3 ? 'active' : ''}`} onClick={() => setPhotoTarget(3)}>3 Frame</button>
                  <button className={`seg-btn ${photoTarget === 4 ? 'active' : ''}`} onClick={() => setPhotoTarget(4)}>4 Frame</button>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Tampilan Layout</label>
                <div className="seg-control" style={{ width: '100%', justifyContent: 'space-around' }}>
                  <button className={`seg-btn ${layoutMode === 'strip' ? 'active' : ''}`} onClick={() => setLayoutMode('strip')}>Vertikal Strip</button>
                  <button className={`seg-btn ${layoutMode === 'grid' ? 'active' : ''}`} onClick={() => setLayoutMode('grid')} disabled={photoTarget !== 4}>2x2 Grid</button>
                </div>
              </div>
            </div>

            {/* Theme / Frame Colors */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>Pilihan Tema & Warna Frame</label>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {THEMES.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => handleThemeSelect(theme)}
                    style={{
                      flexShrink: 0,
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: theme.bg,
                      border: selectedTheme.id === theme.id ? '3px solid var(--ink)' : '1px solid var(--line)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: theme.ink,
                      fontSize: '12px',
                      fontWeight: 700,
                      transition: 'transform 0.15s'
                    }}
                    title={theme.name}
                  >
                    {selectedTheme.id === theme.id && <Check size={16} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Title & Subtitle */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Judul Atas</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={e => setCustomTitle(e.target.value)}
                  className="input-field"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Teks Bawah</label>
                <input
                  type="text"
                  value={customSub}
                  onChange={e => setCustomSub(e.target.value)}
                  className="input-field"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {/* Date & Stickers */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Tanggal Cap</label>
                <input
                  type="text"
                  value={dateStamp}
                  onChange={e => setDateStamp(e.target.value)}
                  className="input-field"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Stiker</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {STICKERS.slice(0, 5).map(s => (
                    <button
                      key={s}
                      onClick={() => setSelectedSticker(s)}
                      style={{
                        fontSize: '1.1rem',
                        padding: '4px 6px',
                        borderRadius: '8px',
                        background: selectedSticker === s ? 'var(--yellow)' : 'var(--line-light)'
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Strip Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Pratinjau Hasil Cetak</span>
            {photos.length > 0 && (
              <button onClick={() => setPhotos([])} className="btn" style={{ fontSize: '0.8rem', color: '#c33', padding: '4px 10px' }}>
                <Trash2 size={14} /> Hapus Semua
              </button>
            )}
          </div>

          {/* Interactive Strip Visualizer */}
          <div
            style={{
              background: selectedTheme.bg,
              color: selectedTheme.ink,
              borderRadius: '16px',
              padding: '24px 20px',
              boxShadow: 'var(--shadow-lg)',
              width: layoutMode === 'grid' ? '360px' : '260px',
              border: `2px solid ${selectedTheme.accent}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transition: 'var(--transition)'
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '16px', letterSpacing: '2px', fontWeight: 800, fontSize: '0.78rem' }}>
              {customTitle.toUpperCase()}
            </div>

            {/* Photo slots */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: layoutMode === 'grid' ? 'repeat(2, 1fr)' : '1fr',
              gap: '10px',
              width: '100%'
            }}>
              {Array.from({ length: photoTarget }).map((_, idx) => {
                const photo = photos[idx];
                return (
                  <div
                    key={idx}
                    style={{
                      position: 'relative',
                      background: '#fff',
                      padding: '4px',
                      borderRadius: '4px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                      aspectRatio: '4/3',
                      overflow: 'hidden'
                    }}
                  >
                    {photo ? (
                      <>
                        <img
                          src={photo}
                          alt={`Slot ${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                        <button
                          onClick={() => removePhoto(idx)}
                          style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            background: 'rgba(0,0,0,0.6)',
                            color: '#fff',
                            borderRadius: '50%',
                            width: '22px',
                            height: '22px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px'
                          }}
                          title="Hapus foto ini"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        border: '1.5px dashed #ccc',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#999',
                        fontSize: '0.75rem'
                      }}>
                        <Camera size={20} style={{ opacity: 0.4, marginBottom: '4px' }} />
                        Frame {idx + 1}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.75rem', letterSpacing: '1.5px', marginBottom: '4px' }}>
                {customSub.toUpperCase()}
              </div>
              <div style={{ fontSize: '0.68rem', opacity: 0.8, fontFamily: 'monospace' }}>
                • {dateStamp} • {selectedSticker} •
              </div>
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={handleDownload}
            disabled={photos.length === 0}
            className="btn btn-primary"
            style={{ width: '100%', maxWidth: '320px', padding: '12px', fontSize: '0.95rem' }}
          >
            <Download size={18} /> Simpan Foto Strip (PNG Resolusi Tinggi)
          </button>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', textAlign: 'center' }}>
            🔒 Semua foto diproses langsung di browser lokal Anda tanpa dikirim ke server manapun.
          </p>

          {/* Hidden Canvas for High-Res Output */}
          <canvas ref={stripCanvasRef} style={{ display: 'none' }} />
        </div>
      </div>
    </div>
  );
}

