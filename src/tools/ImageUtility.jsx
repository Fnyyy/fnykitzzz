import React, { useState, useRef } from 'react';
import { ChevronLeft, Download, Upload, Sliders, Image as ImageIcon, ArrowRight } from 'lucide-react';

export default function ImageUtility({ onBack }) {
  const [fileData, setFileData] = useState(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [compressedUrl, setCompressedUrl] = useState(null);
  const [quality, setQuality] = useState(80);
  const [targetFormat, setTargetFormat] = useState('image/webp');
  const [maxWidth, setMaxWidth] = useState(1600);

  const fileInputRef = useRef(null);
  const imgRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOriginalSize(file.size);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        setFileData({
          name: file.name,
          width: img.width,
          height: img.height,
          src: ev.target.result
        });
        processImage(img, quality, targetFormat, maxWidth);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const processImage = (img, q, format, maxDim) => {
    if (!img) return;
    const canvas = document.createElement('canvas');

    let width = img.width;
    let height = img.height;

    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setCompressedSize(blob.size);
        const url = URL.createObjectURL(blob);
        setCompressedUrl(url);
      },
      format,
      q / 100
    );
  };

  const handleQualityChange = (newQ) => {
    setQuality(newQ);
    if (imgRef.current) processImage(imgRef.current, newQ, targetFormat, maxWidth);
  };

  const handleFormatChange = (newF) => {
    setTargetFormat(newF);
    if (imgRef.current) processImage(imgRef.current, quality, newF, maxWidth);
  };

  const handleMaxDimChange = (newDim) => {
    setMaxWidth(newDim);
    if (imgRef.current) processImage(imgRef.current, quality, targetFormat, newDim);
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const downloadImage = () => {
    if (!compressedUrl) return;
    const ext = targetFormat === 'image/webp' ? 'webp' : targetFormat === 'image/jpeg' ? 'jpg' : 'png';
    const link = document.createElement('a');
    link.download = `fnykids-optimized-${Date.now()}.${ext}`;
    link.href = compressedUrl;
    link.click();
  };

  const savedPercent = originalSize > 0 && compressedSize > 0
    ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
    : 0;

  return (
    <div className="animate-fade" style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <button onClick={onBack} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
          <ChevronLeft size={18} /> Kembali
        </button>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Kompres & Konversi Gambar</h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Perkecil ukuran & ubah format gambar 100% lokal by fnykids</p>
        </div>
        <div style={{ width: '80px' }} />
      </div>

      {!fileData ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="card"
          style={{
            minHeight: '340px',
            border: '2px dashed var(--line)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            textAlign: 'center',
            gap: '12px'
          }}
        >
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Upload size={28} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Pilih Gambar untuk Dikompres</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', maxWidth: '380px' }}>
            Mendukung file PNG, JPG, JPEG, WEBP. Aman & tanpa upload ke server eksternal.
          </p>
          <button className="btn btn-accent" style={{ marginTop: '8px' }}>
            Pilih File Gambar
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileSelect} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Controls */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} /> Opsi Optimasi
            </h3>

            {/* Target Format */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Format Target</label>
              <div className="seg-control" style={{ width: '100%', justifyContent: 'space-around' }}>
                <button
                  className={`seg-btn ${targetFormat === 'image/webp' ? 'active' : ''}`}
                  onClick={() => handleFormatChange('image/webp')}
                >
                  WEBP (Hemat & Cepat)
                </button>
                <button
                  className={`seg-btn ${targetFormat === 'image/jpeg' ? 'active' : ''}`}
                  onClick={() => handleFormatChange('image/jpeg')}
                >
                  JPEG / JPG
                </button>
                <button
                  className={`seg-btn ${targetFormat === 'image/png' ? 'active' : ''}`}
                  onClick={() => handleFormatChange('image/png')}
                >
                  PNG
                </button>
              </div>
            </div>

            {/* Quality Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                <span>Kualitas Kompresi</span>
                <span>{quality}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={quality}
                onChange={e => handleQualityChange(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            {/* Max Resolution Dimension */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Resolusi Maksimal</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { label: '800px', val: 800 },
                  { label: '1280px (HD)', val: 1280 },
                  { label: '1920px (FHD)', val: 1920 },
                  { label: 'Asli', val: 4000 }
                ].map(d => (
                  <button
                    key={d.val}
                    onClick={() => handleMaxDimChange(d.val)}
                    className={`btn ${maxWidth === d.val ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.78rem', padding: '6px 10px', flex: 1 }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Savings Comparison Card */}
            <div style={{ background: 'var(--line-light)', borderRadius: '12px', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>Ukuran Asli</div>
                <div style={{ fontSize: '1rem', fontWeight: 700 }}>{formatBytes(originalSize)}</div>
              </div>
              <ArrowRight size={20} color="var(--muted)" />
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>Hasil Kompresi</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#16a34a' }}>{formatBytes(compressedSize)}</div>
              </div>
              {savedPercent > 0 && (
                <div style={{ background: '#dcfce7', color: '#15803d', padding: '4px 8px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800 }}>
                  -{savedPercent}%
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Ganti Gambar
              </button>
              <button
                onClick={downloadImage}
                disabled={!compressedUrl}
                className="btn btn-accent"
                style={{ flex: 1.5, fontWeight: 700 }}
              >
                <Download size={16} /> Unduh Hasil
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileSelect} />
          </div>

          {/* Image Preview */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '340px' }}>
            {compressedUrl && (
              <img
                src={compressedUrl}
                alt="Preview"
                style={{ maxWidth: '100%', maxHeight: '360px', objectFit: 'contain', borderRadius: '10px' }}
              />
            )}
            <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '12px' }}>
              {fileData.name} ({fileData.width} × {fileData.height} px)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

