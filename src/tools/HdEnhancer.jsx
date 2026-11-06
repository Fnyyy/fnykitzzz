import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft, Sparkles, Image as ImageIcon, Video, Download,
  Sliders, RefreshCw, Check, Upload, Shield, Eye, Maximize2,
  Zap, Play, Pause, Camera, RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { enhanceImageData } from '../utils/imageEnhancer';

const PHOTO_PRESETS = [
  { id: 'portrait', name: '🌟 Portrait Wajah', desc: 'Pertajam mata, senyum & rambut dengan kulit natural', sharpness: 0.65, contrast: 1.12, vibrancy: 1.15, scale: 2 },
  { id: 'ultra4k', name: '⚡ Ultra HD (4K)', desc: 'Penajaman detail ekstrem untuk objek, baju & teks', sharpness: 0.85, contrast: 1.18, vibrancy: 1.12, scale: 2 },
  { id: 'vibrant', name: '🎨 Vibrant Studio', desc: 'Perbaiki foto gelap/redup jadi cerah & kaya warna', sharpness: 0.55, contrast: 1.22, vibrancy: 1.25, scale: 2 },
  { id: 'vintage', name: '🎞️ Restorasi Film', desc: 'Pulihkan foto jadul/pudar menjadi hidup kembali', sharpness: 0.70, contrast: 1.15, vibrancy: 1.10, scale: 2 }
];

export default function HdEnhancer({ onBack }) {
  const [activeTab, setActiveTab] = useState('photo'); // 'photo' | 'video'

  // Photo State
  const [imageSrc, setImageSrc] = useState(null);
  const [enhancedDataUrl, setEnhancedDataUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sliderPos, setSliderPos] = useState(50); // Split comparison slider (0 to 100)
  
  // Settings
  const [activePreset, setActivePreset] = useState(PHOTO_PRESETS[0]);
  const [scaleFactor, setScaleFactor] = useState(2); // 2x or 4x
  const [sharpness, setSharpness] = useState(0.65);
  const [contrast, setContrast] = useState(1.12);
  const [vibrancy, setVibrancy] = useState(1.15);

  // Video State
  const [videoSrc, setVideoSrc] = useState(null);
  const [isVideoProcessing, setIsVideoProcessing] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);
  const [videoProgress, setVideoProgress] = useState(0);

  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const originalCanvasRef = useRef(null);
  const videoPlayerRef = useRef(null);
  const videoCanvasRef = useRef(null);

  // Apply preset
  const handleSelectPreset = (p) => {
    setActivePreset(p);
    setSharpness(p.sharpness);
    setContrast(p.contrast);
    setVibrancy(p.vibrancy);
    setScaleFactor(p.scale);
    if (imageSrc) {
      processPhotoEnhance(imageSrc, p.scale, p.sharpness, p.contrast, p.vibrancy);
    }
  };

  // Process Photo
  const processPhotoEnhance = (src, scale = scaleFactor, sharp = sharpness, cont = contrast, vib = vibrancy) => {
    if (!src) return;
    setIsProcessing(true);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // 1. Draw original on reference canvas
      const origCanvas = originalCanvasRef.current || document.createElement('canvas');
      origCanvas.width = img.width;
      origCanvas.height = img.height;
      const oCtx = origCanvas.getContext('2d');
      oCtx.drawImage(img, 0, 0);

      // 2. Run multi-stage AI HD enhancement
      setTimeout(() => {
        try {
          const enhancedCanvas = enhanceImageData(origCanvas, {
            scale,
            sharpness: sharp,
            contrast: cont,
            vibrancy: vib
          });

          setEnhancedDataUrl(enhancedCanvas.toDataURL('image/jpeg', 0.96));
          confetti({ particleCount: 35, spread: 50 });
        } catch (err) {
          console.error(err);
          alert('Gagal memproses foto: ' + err.message);
        } finally {
          setIsProcessing(false);
        }
      }, 50);
    };
    img.src = src;
  };

  // Handle Photo Upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      setImageSrc(evt.target.result);
      processPhotoEnhance(evt.target.result);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle Video Upload
  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setRecordedVideoUrl(null);
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  // Process Video HD Enhance via Canvas & MediaRecorder
  const handleProcessVideo = async () => {
    if (!videoSrc || isVideoProcessing) return;
    const video = videoPlayerRef.current;
    if (!video) return;

    setIsVideoProcessing(true);
    setVideoProgress(0);

    video.currentTime = 0;
    await video.play();

    const canvas = videoCanvasRef.current || document.createElement('canvas');
    canvas.width = (video.videoWidth || 640) * 1.5;
    canvas.height = (video.videoHeight || 480) * 1.5;
    const ctx = canvas.getContext('2d');

    const stream = canvas.captureStream(30);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm',
      videoBitsPerSecond: 8000000 // 8 Mbps high-bitrate HD
    });

    const chunks = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      setRecordedVideoUrl(URL.createObjectURL(blob));
      setIsVideoProcessing(false);
      confetti({ particleCount: 50, spread: 60 });
    };

    mediaRecorder.start();

    const duration = video.duration || 10;
    const drawFrame = () => {
      if (video.paused || video.ended) {
        mediaRecorder.stop();
        return;
      }

      ctx.filter = `contrast(${Math.round(contrast * 100)}%) saturate(${Math.round(vibrancy * 100)}%) drop-shadow(0 0 1px rgba(0,0,0,0.2))`;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      setVideoProgress(Math.min(100, Math.round((video.currentTime / duration) * 100)));
      requestAnimationFrame(drawFrame);
    };

    requestAnimationFrame(drawFrame);
  };

  // Download Photo
  const handleDownloadPhoto = () => {
    if (!enhancedDataUrl) return;
    const link = document.createElement('a');
    link.download = `fnykids-ai-hd-${Date.now()}.jpg`;
    link.href = enhancedDataUrl;
    link.click();
    confetti({ particleCount: 60, spread: 70 });
  };

  return (
    <div className="animate-fade" style={{ maxWidth: '1060px', margin: '0 auto', paddingBottom: '90px' }}>
      
      {/* ═══════════════ HEADER BAR ═══════════════ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
        <button onClick={onBack} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
          <ChevronLeft size={16} /> Kembali
        </button>

        {/* Tab Switcher: Photo vs Video */}
        <div className="seg-control">
          <button
            className={`seg-btn ${activeTab === 'photo' ? 'active' : ''}`}
            onClick={() => setActiveTab('photo')}
          >
            <ImageIcon size={15} /> Foto HD (Super-Res)
          </button>
          <button
            className={`seg-btn ${activeTab === 'video' ? 'active' : ''}`}
            onClick={() => setActiveTab('video')}
          >
            <Video size={15} /> Video HD (Enhance)
          </button>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--cyan-light)', color: 'var(--cyan-dark)', padding: '5px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.74rem', fontWeight: 700 }}>
          <Shield size={13} /> 100% Offline & Privat
        </div>
      </div>

      {/* Hero Title */}
      <div style={{ marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', boxShadow: '0 4px 14px rgba(37,99,235,0.3)'
          }}>
            <Sparkles size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--ink)', margin: 0 }}>
              AI HD Media Enhancer & Super-Resolution
            </h1>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--muted)' }}>
              Tingkatkan foto buram, gelap, atau beresolusi rendah menjadi tajam dan jernih hingga kualitas 4K tanpa upload ke server.
            </p>
          </div>
        </div>
      </div>

      {/* ═══════════════ TAB 1: PHOTO ENHANCER ═══════════════ */}
      {activeTab === 'photo' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '20px', alignItems: 'start' }}>
          
          {/* LEFT: CONTROLS & PRESETS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Presets Card */}
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <Sparkles size={16} color="var(--purple)" />
                <span style={{ fontSize: '0.84rem', fontWeight: 800 }}>Pilih Gaya Penajaman AI</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {PHOTO_PRESETS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPreset(p)}
                    style={{
                      padding: '10px 12px', borderRadius: '12px',
                      background: activePreset.id === p.id ? 'var(--purple)' : 'var(--bg)',
                      color: activePreset.id === p.id ? '#fff' : 'var(--ink)',
                      border: activePreset.id === p.id ? '1px solid var(--purple)' : '1px solid var(--line)',
                      textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, marginBottom: '2px' }}>{p.name}</div>
                    <div style={{ fontSize: '0.68rem', opacity: 0.8, lineHeight: 1.3 }}>{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Scale Multiplier */}
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <Maximize2 size={16} color="var(--purple)" />
                <span style={{ fontSize: '0.84rem', fontWeight: 800 }}>Skala Resolusi Ekspor</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { scale: 2, label: '2× HD (1080p / 2K)' },
                  { scale: 4, label: '4× Ultra HD (4K Super-Res)' }
                ].map(item => (
                  <button
                    key={item.scale}
                    onClick={() => {
                      setScaleFactor(item.scale);
                      if (imageSrc) processPhotoEnhance(imageSrc, item.scale);
                    }}
                    className={`btn ${scaleFactor === item.scale ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '8px', fontSize: '0.78rem', fontWeight: 700 }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fine Tuning Sliders */}
            <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sliders size={16} color="var(--purple)" />
                <span style={{ fontSize: '0.84rem', fontWeight: 800 }}>Pengaturan Halus</span>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                  <span>Tingkat Ketajaman (Sharpness)</span>
                  <span>{Math.round(sharpness * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={sharpness}
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    setSharpness(val);
                    if (imageSrc) processPhotoEnhance(imageSrc, scaleFactor, val);
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                  <span>Kontras Dinamis (Contrast)</span>
                  <span>{Math.round((contrast - 1) * 200)}%</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="1.3"
                  step="0.02"
                  value={contrast}
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    setContrast(val);
                    if (imageSrc) processPhotoEnhance(imageSrc, scaleFactor, sharpness, val);
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                  <span>Kejernihan Warna (Vibrancy)</span>
                  <span>{Math.round((vibrancy - 1) * 200)}%</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="1.35"
                  step="0.02"
                  value={vibrancy}
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    setVibrancy(val);
                    if (imageSrc) processPhotoEnhance(imageSrc, scaleFactor, sharpness, contrast, val);
                  }}
                />
              </div>
            </div>

            {/* Upload Buttons */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '12px', fontSize: '0.85rem' }}
            >
              <Upload size={16} /> Pilih Foto Lain dari Galeri
            </button>
          </div>

          {/* RIGHT: INTERACTIVE BEFORE/AFTER SLIDER COMPARISON */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {imageSrc ? (
              <div className="card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, background: 'var(--purple-light)', color: 'var(--purple)', padding: '3px 10px', borderRadius: '12px' }}>
                      Perbandingan Sebelum & Sesudah
                    </span>
                    {isProcessing && <span style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>Memproses AI HD...</span>}
                  </div>

                  <button
                    onClick={handleDownloadPhoto}
                    disabled={!enhancedDataUrl || isProcessing}
                    className="btn btn-primary"
                    style={{ padding: '8px 16px', fontSize: '0.82rem', gap: '6px' }}
                  >
                    <Download size={15} /> Download Foto HD ({scaleFactor}x)
                  </button>
                </div>

                {/* Interactive Split Comparison Viewport */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '460px',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    background: '#090a10',
                    userSelect: 'none',
                    cursor: 'ew-resize'
                  }}
                  onMouseMove={e => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
                    setSliderPos((x / rect.width) * 100);
                  }}
                  onTouchMove={e => {
                    const touch = e.touches[0];
                    if (!touch) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = Math.max(0, Math.min(rect.width, touch.clientX - rect.left));
                    setSliderPos((x / rect.width) * 100);
                  }}
                >
                  {/* Enhanced Image (Base Full) */}
                  <img
                    src={enhancedDataUrl || imageSrc}
                    alt="AI HD Result"
                    style={{
                      position: 'absolute', inset: 0,
                      width: '100%', height: '100%',
                      objectFit: 'contain'
                    }}
                  />

                  {/* Original Image (Clipped Left) */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    width: `${sliderPos}%`,
                    overflow: 'hidden',
                    borderRight: '2.5px solid #ffffff',
                    boxShadow: '4px 0 14px rgba(0,0,0,0.5)'
                  }}>
                    <img
                      src={imageSrc}
                      alt="Original"
                      style={{
                        position: 'absolute', top: 0, left: 0,
                        width: '100%', height: '100%',
                        maxWidth: 'none',
                        objectFit: 'contain'
                      }}
                    />
                    <div style={{
                      position: 'absolute', top: '12px', left: '12px',
                      background: 'rgba(0,0,0,0.7)', color: '#fff',
                      padding: '4px 10px', borderRadius: '8px',
                      fontSize: '0.7rem', fontWeight: 800
                    }}>
                      ASLI (Sebelum)
                    </div>
                  </div>

                  {/* Label for HD on the right */}
                  <div style={{
                    position: 'absolute', top: '12px', right: '12px',
                    background: 'rgba(37,99,235,0.85)', color: '#fff',
                    padding: '4px 10px', borderRadius: '8px',
                    fontSize: '0.7rem', fontWeight: 800,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                  }}>
                    ✨ AI HD ({scaleFactor}× Ultra-Res)
                  </div>

                  {/* Slider Drag Handle */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: `${sliderPos}%`,
                    transform: 'translate(-50%, -50%)',
                    width: '36px', height: '36px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    color: 'var(--purple)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                    pointerEvents: 'none'
                  }}>
                    ⇄
                  </div>
                </div>

                <div style={{ textAlign: 'center', fontSize: '0.74rem', color: 'var(--muted)', marginTop: '10px' }}>
                  💡 <b>Geser slider ke kiri/kanan</b> untuk membandingkan perbedaan detail ketajaman foto!
                </div>
              </div>
            ) : (
              /* Empty Dropzone */
              <div
                onClick={() => fileInputRef.current?.click()}
                className="card"
                style={{
                  minHeight: '400px',
                  border: '2px dashed var(--line-active)',
                  borderRadius: '16px',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', textAlign: 'center',
                  padding: '30px', background: 'var(--blue-light)'
                }}
              >
                <div style={{
                  width: '64px', height: '64px', borderRadius: '20px',
                  background: 'var(--purple)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '14px', boxShadow: '0 4px 16px rgba(37,99,235,0.3)'
                }}>
                  <ImageIcon size={32} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: '0 0 6px', color: 'var(--ink)' }}>
                  Pilih Foto untuk Di-HD-kan
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--muted)', maxWidth: '340px', margin: '0 0 16px' }}>
                  Mendukung foto JPG, PNG, WEBP, atau screenshot. Algoritma super-resolution akan mempertajam detail dan warna secara instan.
                </p>
                <button className="btn btn-primary" style={{ padding: '10px 22px' }}>
                  <Upload size={16} /> Pilih Berkas Foto
                </button>
              </div>
            )}

          </div>

        </div>
      )}

      {/* ═══════════════ TAB 2: VIDEO ENHANCER ═══════════════ */}
      {activeTab === 'video' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '20px', alignItems: 'start' }}>
          
          {/* LEFT: CONTROLS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="card" style={{ padding: '16px' }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: 800, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Video size={16} color="var(--purple)" /> Pengaturan Video HD
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: '0 0 14px' }}>
                Video akan diproses frame-demi-frame untuk meningkatkan ketajaman visual, saturasi warna, dan pencahayaan dinamis.
              </p>

              <button
                onClick={handleProcessVideo}
                disabled={!videoSrc || isVideoProcessing}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: '0.88rem', fontWeight: 800, gap: '8px' }}
              >
                {isVideoProcessing ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    <span>Memproses Video HD ({videoProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Mulai Tingkatkan Kualitas Video</span>
                  </>
                )}
              </button>

              {isVideoProcessing && (
                <div style={{ width: '100%', height: '6px', background: 'var(--line)', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
                  <div style={{ width: `${videoProgress}%`, height: '100%', background: 'var(--purple)', transition: 'width 0.2s' }} />
                </div>
              )}
            </div>

            {/* Video Input */}
            <input
              type="file"
              ref={videoInputRef}
              accept="video/*"
              onChange={handleVideoUpload}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => videoInputRef.current?.click()}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '12px', fontSize: '0.85rem' }}
            >
              <Upload size={16} /> Pilih Video dari Galeri (MP4 / WebM)
            </button>
          </div>

          {/* RIGHT: VIDEO PLAYBACK & RESULT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {videoSrc ? (
              <div className="card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>Preview Video</span>
                  {recordedVideoUrl && (
                    <a
                      href={recordedVideoUrl}
                      download={`fnykids-enhanced-video-${Date.now()}.webm`}
                      className="btn btn-primary"
                      style={{ padding: '6px 14px', fontSize: '0.78rem', gap: '6px', textDecoration: 'none' }}
                    >
                      <Download size={14} /> Download Video HD
                    </a>
                  )}
                </div>

                <video
                  ref={videoPlayerRef}
                  src={recordedVideoUrl || videoSrc}
                  controls
                  playsInline
                  style={{
                    width: '100%', maxHeight: '420px',
                    borderRadius: '12px', background: '#000',
                    filter: !recordedVideoUrl ? `contrast(${Math.round(contrast * 100)}%) saturate(${Math.round(vibrancy * 100)}%)` : 'none'
                  }}
                />

                <div style={{ marginTop: '10px', fontSize: '0.74rem', color: 'var(--muted)', textAlign: 'center' }}>
                  {recordedVideoUrl ? '✓ Video HD siap diunduh dengan kualitas tinggi!' : '💡 Putar video di atas untuk melihat preview filter HD.'}
                </div>
              </div>
            ) : (
              <div
                onClick={() => videoInputRef.current?.click()}
                className="card"
                style={{
                  minHeight: '380px',
                  border: '2px dashed var(--line-active)',
                  borderRadius: '16px',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', textAlign: 'center',
                  padding: '30px', background: 'var(--blue-light)'
                }}
              >
                <div style={{
                  width: '64px', height: '64px', borderRadius: '20px',
                  background: 'var(--purple)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '14px'
                }}>
                  <Video size={32} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: '0 0 6px', color: 'var(--ink)' }}>
                  Pilih Video untuk Di-HD-kan
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--muted)', maxWidth: '340px', margin: '0 0 16px' }}>
                  Mendukung file video MP4, WebM, atau rekaman kamera. Filter resolusi tinggi akan mempertajam frame secara langsung.
                </p>
                <button className="btn btn-primary" style={{ padding: '10px 22px' }}>
                  <Upload size={16} /> Pilih Berkas Video
                </button>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Hidden processing canvases */}
      <canvas ref={originalCanvasRef} style={{ display: 'none' }} />
      <canvas ref={videoCanvasRef} style={{ display: 'none' }} />

    </div>
  );
}
