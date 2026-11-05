import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft, QrCode, Download, Upload, Copy, Check,
  Camera, RefreshCw, ExternalLink, Wifi, MessageCircle,
  Globe, Type, Phone, Mail, Sparkles, Volume2
} from 'lucide-react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import confetti from 'canvas-confetti';

const PRESET_COLORS = [
  { name: 'Classic Ink', dark: '#1a1a2e', light: '#ffffff' },
  { name: 'Purple Dream', dark: '#7c5cfc', light: '#ffffff' },
  { name: 'Midnight Blue', dark: '#1e3a8a', light: '#eff6ff' },
  { name: 'Emerald Mint', dark: '#047857', light: '#ecfdf5' },
  { name: 'Sunset Glow', dark: '#c2410c', light: '#fff7ed' },
  { name: 'Berry Pink', dark: '#be185d', light: '#fdf2f8' }
];

export default function QrStudio({ onBack }) {
  const [tab, setTab] = useState('generate'); // 'generate' or 'scan'
  const [qrType, setQrType] = useState('url'); // 'url', 'wa', 'wifi', 'text', 'email'

  // Generator fields
  const [content, setContent] = useState('https://fnykids.local');
  const [qrColor, setQrColor] = useState('#1a1a2e');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [qrDataUrl, setQrDataUrl] = useState('');

  // Special fields
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPass, setWifiPass] = useState('');
  const [wifiType, setWifiType] = useState('WPA');
  const [wifiHidden, setWifiHidden] = useState(false);

  const [waNumber, setWaNumber] = useState('628');
  const [waMessage, setWaMessage] = useState('Halo dari fnykids!');

  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');

  // Scanner states
  const [scanResult, setScanResult] = useState('');
  const [isLiveScanning, setIsLiveScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [copied, setCopied] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animScanRef = useRef(null);
  const fileInputRef = useRef(null);
  const scanCanvasRef = useRef(null);

  // Generate QR Code
  useEffect(() => {
    let textToEncode = content;

    if (qrType === 'wifi') {
      textToEncode = `WIFI:S:${wifiSsid};T:${wifiType};P:${wifiPass};${wifiHidden ? 'H:true;' : ''};`;
    } else if (qrType === 'wa') {
      const cleanNum = waNumber.replace(/[^0-9]/g, '');
      textToEncode = `https://wa.me/${cleanNum}?text=${encodeURIComponent(waMessage)}`;
    } else if (qrType === 'email') {
      textToEncode = `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}`;
    }

    if (!textToEncode.trim()) {
      setQrDataUrl('');
      return;
    }

    QRCode.toDataURL(textToEncode, {
      width: 480,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: qrColor,
        light: bgColor
      }
    }).then(url => {
      setQrDataUrl(url);
    }).catch(err => {
      console.error(err);
    });
  }, [content, qrType, wifiSsid, wifiPass, wifiType, wifiHidden, waNumber, waMessage, emailTo, emailSubject, qrColor, bgColor]);

  // Clean up camera on unmount or tab change
  useEffect(() => {
    return () => {
      stopCameraScan();
    };
  }, []);

  const stopCameraScan = () => {
    if (animScanRef.current) {
      cancelAnimationFrame(animScanRef.current);
      animScanRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsLiveScanning(false);
  };

  // Start Live Camera Scanning
  const startCameraScan = async () => {
    try {
      setScanError(null);
      setScanResult('');
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
        });
      } catch (e) {
        console.warn('Fallback to basic video for scanner:', e);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
      }
      streamRef.current = stream;
      setIsLiveScanning(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().then(() => {
          requestAnimationFrame(scanVideoLoop);
        }).catch(e => console.log('play error:', e));
      }
    } catch (err) {
      console.error(err);
      setScanError('Gagal mengakses kamera. Pastikan browser diizinkan mengakses kamera di setelan.');
      setIsLiveScanning(false);
    }
  };

  useEffect(() => {
    if (isLiveScanning && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().then(() => {
        requestAnimationFrame(scanVideoLoop);
      }).catch(e => console.log('play error:', e));
    }
  }, [isLiveScanning]);

  const scanVideoLoop = () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animScanRef.current = requestAnimationFrame(scanVideoLoop);
      return;
    }

    const video = videoRef.current;
    const canvas = scanCanvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imgData.data, imgData.width, imgData.height, {
      inversionAttempts: 'dontInvert'
    });

    if (code && code.data) {
      setScanResult(code.data);
      stopCameraScan();
      confetti({ particleCount: 40, spread: 60 });
    } else {
      animScanRef.current = requestAnimationFrame(scanVideoLoop);
    }
  };

  // Scan from uploaded file
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height);

        if (code && code.data) {
          setScanResult(code.data);
          confetti({ particleCount: 40, spread: 60 });
        } else {
          setScanResult('');
          setScanError('Tidak ditemukan kode QR pada gambar ini. Pastikan gambar jelas dan tidak buram.');
        }
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const downloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `fnykids-qr-${Date.now()}.png`;
    link.href = qrDataUrl;
    link.click();
    confetti({ particleCount: 40, spread: 60 });
  };

  const copyScanResult = () => {
    navigator.clipboard.writeText(scanResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUrl = (str) => {
    return /^https?:\/\//i.test(str);
  };

  return (
    <div className="animate-fade" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <button onClick={onBack} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
          <ChevronLeft size={18} /> Kembali
        </button>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900 }}>QR Code Studio</h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Buat & baca kode QR cepat 100% lokal di browser</p>
        </div>
        <div style={{ width: '80px' }} />
      </div>

      {/* Segmented Tab */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <div className="seg-control">
          <button
            className={`seg-btn ${tab === 'generate' ? 'active' : ''}`}
            onClick={() => { setTab('generate'); stopCameraScan(); }}
          >
            <QrCode size={16} /> Buat QR Code
          </button>
          <button
            className={`seg-btn ${tab === 'scan' ? 'active' : ''}`}
            onClick={() => setTab('scan')}
          >
            <Camera size={16} /> Pindai / Scan QR
          </button>
        </div>
      </div>

      {tab === 'generate' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>
          {/* Controls Column */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Category Selector */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>
                Tipe Kode QR
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {[
                  { id: 'url', label: 'Tautan', icon: Globe },
                  { id: 'wa', label: 'WhatsApp', icon: MessageCircle },
                  { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
                  { id: 'text', label: 'Teks', icon: Type }
                ].map(t => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setQrType(t.id)}
                      className={`btn ${qrType === t.id ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.78rem', padding: '8px 4px', flexDirection: 'column', gap: '4px' }}
                    >
                      <Icon size={16} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inputs based on type */}
            {qrType === 'url' && (
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  Alamat Website (URL)
                </label>
                <input
                  type="url"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="input-field"
                  placeholder="https://example.com"
                />
              </div>
            )}

            {qrType === 'text' && (
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  Konten Teks
                </label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="input-field"
                  placeholder="Ketik catatan atau teks rahasia..."
                />
              </div>
            )}

            {qrType === 'wa' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    Nomor WhatsApp (Awali 62)
                  </label>
                  <input
                    type="text"
                    value={waNumber}
                    onChange={e => setWaNumber(e.target.value)}
                    className="input-field"
                    placeholder="6281234567890"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    Pesan Otomatis (Opsional)
                  </label>
                  <input
                    type="text"
                    value={waMessage}
                    onChange={e => setWaMessage(e.target.value)}
                    className="input-field"
                    placeholder="Halo, saya ingin bertanya..."
                  />
                </div>
              </div>
            )}

            {qrType === 'wifi' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    Nama Wi-Fi (SSID)
                  </label>
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={e => setWifiSsid(e.target.value)}
                    className="input-field"
                    placeholder="Contoh: Cafe_Free_Wifi"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    Kata Sandi Wi-Fi
                  </label>
                  <input
                    type="text"
                    value={wifiPass}
                    onChange={e => setWifiPass(e.target.value)}
                    className="input-field"
                    placeholder="Password Wi-Fi"
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Tipe Keamanan:</label>
                  <select
                    value={wifiType}
                    onChange={e => setWifiType(e.target.value)}
                    className="input-field"
                    style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8rem' }}
                  >
                    <option value="WPA">WPA / WPA2</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">Tanpa Password</option>
                  </select>
                </div>
              </div>
            )}

            {/* Color Palette Presets */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>
                Tema Warna QR
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {PRESET_COLORS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => { setQrColor(p.dark); setBgColor(p.light); }}
                    title={p.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      background: p.light,
                      border: qrColor === p.dark ? '2px solid var(--purple)' : '1px solid var(--line)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: p.dark
                    }}
                  >
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: p.dark }} />
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Color Pickers */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="color"
                  value={qrColor}
                  onChange={e => setQrColor(e.target.value)}
                  style={{ width: '34px', height: '34px', borderRadius: '8px', cursor: 'pointer', border: 'none' }}
                />
                <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>Warna Pola</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="color"
                  value={bgColor}
                  onChange={e => setBgColor(e.target.value)}
                  style={{ width: '34px', height: '34px', borderRadius: '8px', cursor: 'pointer', border: 'none' }}
                />
                <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>Warna Latar</span>
              </div>
            </div>
          </div>

          {/* Preview & Download */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '16px' }}>
              Pratinjau Kode QR
            </span>

            {qrDataUrl ? (
              <div style={{
                background: bgColor,
                padding: '20px',
                borderRadius: '20px',
                boxShadow: 'var(--shadow-lg)',
                marginBottom: '24px',
                border: '1px solid var(--line)'
              }}>
                <img src={qrDataUrl} alt="QR Code" style={{ width: '260px', height: '260px', display: 'block' }} />
              </div>
            ) : (
              <div style={{
                width: '260px', height: '260px',
                background: 'var(--line-light)',
                borderRadius: '20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--muted)', marginBottom: '24px'
              }}>
                Masukkan konten untuk membuat QR
              </div>
            )}

            <button
              onClick={downloadQr}
              disabled={!qrDataUrl}
              className="btn btn-accent"
              style={{ width: '100%', maxWidth: '280px', padding: '12px', fontWeight: 800 }}
            >
              <Download size={18} /> Unduh QR Code (PNG)
            </button>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '12px' }}>
              Resolusi tinggi (480x480) dengan koreksi error level H
            </p>
          </div>
        </div>
      ) : (
        /* Scanner Tab */
        <div style={{ maxWidth: '580px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="card" style={{ textAlign: 'center', padding: '28px' }}>
            {!isLiveScanning && (
              <div>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '20px',
                  background: 'var(--purple-light)', color: 'var(--purple)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <Camera size={32} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px' }}>
                  Pindai Kode QR
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', maxWidth: '400px', margin: '0 auto 20px' }}>
                  Pindai menggunakan kamera perangkat Anda atau pilih berkas gambar QR Code dari penyimpanan.
                </p>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button onClick={startCameraScan} className="btn btn-accent" style={{ padding: '12px 24px' }}>
                    <Camera size={18} /> Buka Kamera
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="btn btn-secondary" style={{ padding: '12px 24px' }}>
                    <Upload size={18} /> Unggah Gambar QR
                  </button>
                </div>
              </div>
            )}

            {/* Live Camera Scanner View - Always mounted to guarantee ref */}
            <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '16px', background: '#000', display: isLiveScanning ? 'block' : 'none' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={() => {
                  videoRef.current?.play().then(() => {
                    requestAnimationFrame(scanVideoLoop);
                  }).catch(() => {});
                }}
                style={{ width: '100%', maxHeight: '360px', objectFit: 'cover' }}
              />
              {/* Visual Target Reticle */}
              <div style={{
                position: 'absolute',
                inset: '40px',
                border: '2.5px solid rgba(255, 107, 157, 0.8)',
                borderRadius: '16px',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                pointerEvents: 'none'
              }}>
                <div style={{
                  position: 'absolute', top: '50%', left: 0, right: 0, height: '2px',
                  background: 'linear-gradient(90deg, transparent, #ff6b9d, transparent)',
                  animation: 'pulseGlow 1.5s infinite'
                }} />
              </div>

              <div style={{
                position: 'absolute', bottom: '14px', left: 0, right: 0,
                display: 'flex', justifyContent: 'center', gap: '10px'
              }}>
                <button onClick={stopCameraScan} className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.92)' }}>
                  Matikan Kamera
                </button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />

            {scanError && (
              <div style={{ marginTop: '16px', background: '#fdf0f0', border: '1px solid #f8c2c2', color: '#c33', padding: '10px 14px', borderRadius: '12px', fontSize: '0.85rem' }}>
                {scanError}
              </div>
            )}
          </div>

          {/* Scan Result Card */}
          {scanResult && (
            <div className="card animate-pop" style={{ borderLeft: '5px solid var(--cyan)' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--cyan-dark)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                🎉 Hasil Pindaian Berhasil:
              </div>
              <div style={{
                background: 'var(--line-light)',
                padding: '12px 14px',
                borderRadius: '12px',
                fontSize: '0.95rem',
                wordBreak: 'break-all',
                fontWeight: 600,
                fontFamily: isUrl(scanResult) ? 'inherit' : 'monospace',
                marginBottom: '14px'
              }}>
                {scanResult}
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {isUrl(scanResult) && (
                  <a
                    href={scanResult}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-accent"
                    style={{ fontSize: '0.82rem', padding: '8px 16px', textDecoration: 'none' }}
                  >
                    <ExternalLink size={15} /> Buka Tautan
                  </a>
                )}
                <button
                  onClick={copyScanResult}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.82rem', padding: '8px 16px' }}
                >
                  {copied ? <><Check size={15} color="#16a34a" /> Tersalin!</> : <><Copy size={15} /> Salin Hasil</>}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
