import React, { useState, useRef, useEffect } from 'react';
import {
  Camera, RefreshCw, Download, Image as ImageIcon, Sparkles,
  Check, ChevronLeft, Trash2, Sliders, LayoutGrid, Heart,
  FlipHorizontal, Clock, Star, ArrowRight, Eye, Undo2
} from 'lucide-react';
import confetti from 'canvas-confetti';

// ═══════════════ TEMPLATES COLLECTION ═══════════════
const TEMPLATES = [
  {
    id: 'lany-xxl-3',
    title: 'Lany - XXL (3)',
    category: 'LANY',
    badge: '🔥 Paling Dicari',
    photoCount: 3,
    layout: 'strip',
    ratio: 'strip-3',
    tags: ['#lany', '#aesthetic', '#cobalt', '#lyrics'],
    theme: {
      style: 'lany-blue',
      bg: '#1a44e8', // Vibrant Cobalt Blue
      secondary: '#090a10', // Deep Black
      accent: '#38bdf8',
      textMain: '#ffffff',
      lyricsTop: 'I STILL REMEMBER',
      lyricsMid: 'I WILL FOREVER',
      lyricsBot: 'I MISS YOU DOUBLE-XL',
      quote: "backseat secrets we won't ever tell"
    }
  },
  {
    id: 'lany-xxl-6',
    title: 'Lany - XXL (2 × 3 Grid)',
    category: 'LANY',
    badge: '✨ Viral TikTok',
    photoCount: 6,
    layout: 'grid-6',
    ratio: 'grid-6',
    tags: ['#lany', '#grid', '#bestie', '#couple'],
    theme: {
      style: 'lany-blue-grid',
      bg: '#1a44e8',
      secondary: '#090a10',
      accent: '#38bdf8',
      textMain: '#ffffff',
      lyricsTop: 'I STILL REMEMBER',
      lyricsMid: 'I WILL FOREVER',
      lyricsBot: 'I MISS YOU DOUBLE-XL',
      quote: "backseat secrets we won't ever tell"
    }
  },
  {
    id: 'lany-sky-3',
    title: 'XXL Frame - Lany Sky',
    category: 'LANY',
    badge: '💙 Aesthetic',
    photoCount: 3,
    layout: 'strip',
    ratio: 'strip-3',
    tags: ['#lany', '#sky', '#stars', '#denim'],
    theme: {
      style: 'lany-sky',
      bg: '#dcf0fa', // Soft Sky Blue
      secondary: '#1e3a8a', // Deep Navy
      accent: '#0284c7',
      textMain: '#1e3a8a',
      lyricsTop: "backseat secrets we won't ever tell",
      lyricsMid: 'i miss you double-XL',
      lyricsBot: 'XXL • L A N Y',
      quote: '2 ★ 25'
    }
  },
  {
    id: 'lany-vintage-3',
    title: 'Lany XXL Vintage Denim',
    category: 'LANY',
    badge: '🎸 Retro Rock',
    photoCount: 3,
    layout: 'strip',
    ratio: 'strip-3',
    tags: ['#lany', '#vintage', '#denim', '#film'],
    theme: {
      style: 'lany-vintage',
      bg: '#f1f0ea', // Vintage paper
      secondary: '#1a2b49', // Indigo wave
      accent: '#64748b',
      textMain: '#1a2b49',
      lyricsTop: 'L A N Y  —  X X L',
      lyricsMid: 'I STILL REMEMBER',
      lyricsBot: 'BACKSEAT SECRETS',
      quote: 'MALIBU NIGHTS'
    }
  },
  {
    id: 'classic-photoism',
    title: 'Korean Photoism Burgundy',
    category: 'Korean',
    badge: '🇰🇷 Klasik',
    photoCount: 4,
    layout: 'strip',
    ratio: 'strip-4',
    tags: ['#korean', '#photoism', '#vintage', '#strip'],
    theme: {
      style: 'classic',
      bg: '#4c1d27',
      secondary: '#772535',
      accent: '#f5d5b8',
      textMain: '#f5e8d8',
      lyricsTop: 'OUR LITTLE MEMORIES',
      lyricsMid: '• LIFEFOURCUTS •',
      lyricsBot: 'AUTHENTIC MOMENTS',
      quote: 'WITH LOVE, ALWAYS'
    }
  },
  {
    id: 'y2k-cyber',
    title: 'Y2K Cyber Silver Stars',
    category: 'Y2K',
    badge: '⭐ Retro Y2K',
    photoCount: 3,
    layout: 'strip',
    ratio: 'strip-3',
    tags: ['#y2k', '#cyber', '#silver', '#chrome'],
    theme: {
      style: 'y2k',
      bg: '#0f172a',
      secondary: '#334155',
      accent: '#38bdf8',
      textMain: '#f8fafc',
      lyricsTop: '★ CYBER ANGEL ★',
      lyricsMid: 'TOO COOL FOR U',
      lyricsBot: '2000s DIGITAL VAULT',
      quote: '✨ HIGH VOLTAGE ✨'
    }
  },
  {
    id: 'sweetheart-pink',
    title: 'Sweetheart Pastel Pink',
    category: 'Cute',
    badge: '🎀 Cute',
    photoCount: 4,
    layout: 'strip',
    ratio: 'strip-4',
    tags: ['#cute', '#pink', '#sweet', '#heart'],
    theme: {
      style: 'pink',
      bg: '#fce7f3',
      secondary: '#be185d',
      accent: '#f472b6',
      textMain: '#9d174d',
      lyricsTop: 'SWEET LITTLE MOMENTS',
      lyricsMid: '♥ YOU & ME ♥',
      lyricsBot: 'FOREVER SPECIAL',
      quote: 'WITH LOVE · ALWAYS'
    }
  },
  {
    id: 'minimal-cream',
    title: 'Minimalist Clean Polaroid',
    category: 'Minimal',
    badge: '🤍 Simpel',
    photoCount: 4,
    layout: 'strip',
    ratio: 'strip-4',
    tags: ['#minimal', '#clean', '#polaroid', '#aesthetic'],
    theme: {
      style: 'minimal',
      bg: '#fafaf9',
      secondary: '#e7e5e4',
      accent: '#78716c',
      textMain: '#292524',
      lyricsTop: 'MOMENTS & STORIES',
      lyricsMid: 'AUTHENTIC VAULT',
      lyricsBot: 'MEMORIES DON\'T DIE',
      quote: 'CHAPTER 01'
    }
  }
];

const FILTERS = [
  { id: 'normal', name: 'Original', css: 'none' },
  { id: 'bw', name: 'B&W Film', css: 'grayscale(100%) contrast(115%)' },
  { id: 'warm', name: 'Warm 90s', css: 'sepia(30%) saturate(120%) contrast(105%)' },
  { id: 'cool', name: 'Cool Lany', css: 'hue-rotate(185deg) saturate(110%)' },
  { id: 'rosy', name: 'Rosy Pink', css: 'hue-rotate(330deg) saturate(130%)' }
];

export default function Photobooth({ onBack }) {
  // Navigation / View State
  const [currentView, setCurrentView] = useState('camera'); // 'templates' | 'camera' | 'preview'
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [filterCategory, setFilterCategory] = useState('Semua');

  // Photo state
  const [photos, setPhotos] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);

  // Camera Settings (Jepreto-style)
  const [cameraActive, setCameraActive] = useState(false);
  const [delaySec, setDelaySec] = useState(3); // 1, 3, 5
  const [mirror, setMirror] = useState(true);
  const [facingMode, setFacingMode] = useState('user');
  const [countdown, setCountdown] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  // References
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const stripCanvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const targetCount = selectedTemplate.photoCount;

  // Initialize Camera
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
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      setCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(err => console.log('play error:', err));
      }
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('Gagal mengakses kamera. Pastikan izin kamera telah diberikan di browser Anda.');
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
    return () => stopCamera();
  }, []);

  // When changing template, reset photos if photoCount doesn't match
  const handleSelectTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    if (photos.length > tpl.photoCount) {
      setPhotos(photos.slice(0, tpl.photoCount));
    }
    setCurrentView('camera');
  };

  // Capture Single Photo
  const takeSinglePhoto = () => {
    if (!videoRef.current || photos.length >= targetCount) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');

    if (mirror && facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    if (selectedFilter.css !== 'none') {
      ctx.filter = selectedFilter.css;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const updated = [...photos, dataUrl];
    setPhotos(updated);

    if (updated.length === targetCount) {
      confetti({ particleCount: 50, spread: 60 });
      setTimeout(() => setCurrentView('preview'), 600);
    }
  };

  // Auto Countdown Trigger
  const handleTriggerShutter = () => {
    if (countdown !== null || photos.length >= targetCount) return;

    if (delaySec === 0) {
      takeSinglePhoto();
      return;
    }

    setCountdown(delaySec);
    let count = delaySec;
    const timer = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(timer);
        setCountdown(null);
        takeSinglePhoto();
      }
    }, 1000);
  };

  // File Upload Fallback
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = targetCount - photos.length;
    const selectedFiles = files.slice(0, remaining);

    selectedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setPhotos(prev => {
          if (prev.length >= targetCount) return prev;
          const updated = [...prev, evt.target.result];
          if (updated.length === targetCount) {
            setTimeout(() => setCurrentView('preview'), 500);
          }
          return updated;
        });
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ═══════════════ CANVAS RENDERER FOR TEMPLATES ═══════════════
  const renderStripToCanvas = () => {
    const canvas = stripCanvasRef.current;
    if (!canvas || photos.length === 0) return null;
    const ctx = canvas.getContext('2d');
    const tpl = selectedTemplate;
    const isGrid6 = tpl.layout === 'grid-6';

    const canvasWidth = isGrid6 ? 840 : 480;
    const photoWidth = isGrid6 ? 360 : 410;
    const photoHeight = isGrid6 ? 340 : 320;
    const gap = isGrid6 ? 20 : 18;
    const topPadding = 110;
    const bottomPadding = 150;

    const totalHeight = isGrid6
      ? topPadding + (photoHeight * 3) + (gap * 2) + bottomPadding
      : topPadding + (photos.length * photoHeight) + ((photos.length - 1) * gap) + bottomPadding;

    canvas.width = canvasWidth;
    canvas.height = totalHeight;

    // 1. DRAW BACKGROUND & ORGANIC BLOBS
    if (tpl.theme.style === 'lany-blue' || tpl.theme.style === 'lany-blue-grid') {
      // Solid Cobalt Blue Base
      ctx.fillStyle = tpl.theme.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Deep Black Organic Waves (matching LANY album aesthetic)
      ctx.fillStyle = tpl.theme.secondary;
      
      // Top wave
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(canvas.width, 0);
      ctx.lineTo(canvas.width, 100);
      ctx.bezierCurveTo(canvas.width * 0.7, 140, canvas.width * 0.3, 60, 0, 110);
      ctx.closePath();
      ctx.fill();

      // Middle wavy cutout (left side)
      ctx.beginPath();
      ctx.moveTo(0, canvas.height * 0.35);
      ctx.bezierCurveTo(80, canvas.height * 0.38, 90, canvas.height * 0.52, 0, canvas.height * 0.58);
      ctx.closePath();
      ctx.fill();

      // Bottom organic black wave
      ctx.beginPath();
      ctx.moveTo(0, canvas.height - 180);
      ctx.bezierCurveTo(canvas.width * 0.3, canvas.height - 230, canvas.width * 0.7, canvas.height - 130, canvas.width, canvas.height - 160);
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();
      ctx.fill();

    } else if (tpl.theme.style === 'lany-sky') {
      // Soft Sky Blue with subtle dot grid
      ctx.fillStyle = tpl.theme.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'rgba(2, 132, 199, 0.08)';
      for (let x = 15; x < canvas.width; x += 25) {
        for (let y = 15; y < canvas.height; y += 25) {
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (tpl.theme.style === 'lany-vintage') {
      // Vintage Canvas Paper
      ctx.fillStyle = tpl.theme.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Bottom Indigo Torn Wave
      ctx.fillStyle = tpl.theme.secondary;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height - 120);
      ctx.bezierCurveTo(120, canvas.height - 150, 280, canvas.height - 110, canvas.width, canvas.height - 140);
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();
      ctx.fill();
    } else {
      // Classic / Y2K / Pastel
      ctx.fillStyle = tpl.theme.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 2. HEADER GRAPHICS & BRANDING
    ctx.textAlign = 'center';
    if (tpl.category === 'LANY') {
      // LANY Branding Header
      ctx.font = '900 24px "Plus Jakarta Sans", sans-serif';
      ctx.letterSpacing = '6px';
      ctx.fillStyle = tpl.theme.textMain;
      ctx.fillText('L A N Y', canvas.width / 2, 55);

      ctx.font = '700 11px monospace';
      ctx.letterSpacing = '3px';
      ctx.fillStyle = tpl.theme.accent;
      ctx.fillText('• DOUBLE-XL PHOTO VAULT •', canvas.width / 2, 78);
    } else {
      ctx.font = '800 18px "Plus Jakarta Sans", sans-serif';
      ctx.letterSpacing = '4px';
      ctx.fillStyle = tpl.theme.textMain;
      ctx.fillText(tpl.theme.lyricsTop, canvas.width / 2, 55);
    }

    // 3. RENDER PHOTOS WITH ROUNDED FRAMES
    const imagePromises = photos.map(src => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = src;
      });
    });

    return Promise.all(imagePromises).then(images => {
      let currentY = topPadding;

      if (isGrid6) {
        images.forEach((img, idx) => {
          const col = idx % 2;
          const row = Math.floor(idx / 2);
          const x = 30 + col * (photoWidth + gap);
          const y = topPadding + row * (photoHeight + gap);

          drawRoundedPhotoCard(ctx, img, x, y, photoWidth, photoHeight, 22, tpl.theme);
        });
        currentY += (photoHeight * 3) + (gap * 2);
      } else {
        images.forEach((img) => {
          const x = (canvasWidth - photoWidth) / 2;
          drawRoundedPhotoCard(ctx, img, x, currentY, photoWidth, photoHeight, 20, tpl.theme);
          currentY += photoHeight + gap;
        });
      }

      // 4. DRAW DECORATIVE SLOGANS & STICKERS (LANY VIBE)
      drawTemplateOverlays(ctx, canvas, tpl, currentY);

      return canvas;
    });
  };

  // Helper: Draw photo card with rounded corners and clean white border
  const drawRoundedPhotoCard = (ctx, img, x, y, w, h, radius, theme) => {
    ctx.save();

    // White Card Background & Outline
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(x - 4, y - 4, w + 8, h + 8, radius + 2);
    ctx.fill();

    // Subtle Drop Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;

    // Clip to rounded photo inner
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.clip();

    // Draw Image (Cover Crop)
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
    ctx.restore();
  };

  // Helper: Draw lyric banners and icons
  const drawTemplateOverlays = (ctx, canvas, tpl, endY) => {
    ctx.save();

    if (tpl.category === 'LANY') {
      // Slanted Slanted Banner 1 ("I STILL REMEMBER")
      drawLyricBadge(ctx, 45, 175, tpl.theme.lyricsTop, '#1a44e8', '#ffffff');

      // Slanted Banner 2 ("I WILL FOREVER")
      drawLyricBadge(ctx, canvas.width - 190, canvas.height * 0.55, tpl.theme.lyricsMid, '#1a44e8', '#ffffff');

      // Big Distressed Typography at Footer: "I MISS YOU DOUBLE-XL"
      ctx.textAlign = 'center';
      ctx.font = '900 28px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.letterSpacing = '1px';
      ctx.fillText(tpl.theme.lyricsBot, canvas.width / 2, canvas.height - 75);

      // Quote & Stars
      ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = tpl.theme.accent;
      ctx.fillText(tpl.theme.quote.toUpperCase(), canvas.width / 2, canvas.height - 45);

      // Date Stamp
      const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      ctx.font = '500 11px monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(`★ ${todayStr} • FNYKIDS PHOTOBOOTH ★`, canvas.width / 2, canvas.height - 24);

      // Aesthetic Hearts
      drawHeart(ctx, 35, canvas.height - 85, 14, '#38bdf8');
      drawHeart(ctx, canvas.width - 45, canvas.height - 85, 14, '#38bdf8');
    } else {
      // Classic / Y2K Footer
      ctx.textAlign = 'center';
      ctx.font = '700 15px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = tpl.theme.textMain;
      ctx.fillText(tpl.theme.lyricsMid, canvas.width / 2, canvas.height - 75);

      ctx.font = '500 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = tpl.theme.accent;
      ctx.fillText(tpl.theme.quote, canvas.width / 2, canvas.height - 50);

      const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      ctx.font = '400 11px monospace';
      ctx.fillText(`• ${todayStr} • FNYKIDS •`, canvas.width / 2, canvas.height - 26);
    }

    ctx.restore();
  };

  const drawLyricBadge = (ctx, x, y, text, bg, color) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.06); // subtle aesthetic slant

    ctx.font = '800 11px "Plus Jakarta Sans", sans-serif';
    const textWidth = ctx.measureText(text).width;
    const padX = 10, padY = 5;

    ctx.fillStyle = bg;
    ctx.roundRect(-padX, -padY - 8, textWidth + (padX * 2), 20, 6);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.fillText(text, 0, 5);
    ctx.restore();
  };

  const drawHeart = (ctx, x, y, size, color) => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    const d = size;
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x - d / 2, y - d / 2, x - d, y + d / 3, x, y + d);
    ctx.bezierCurveTo(x + d, y + d / 3, x + d / 2, y - d / 2, x, y);
    ctx.fill();
    ctx.restore();
  };

  // Download Trigger
  const handleDownloadStrip = async () => {
    if (photos.length === 0) return;
    await renderStripToCanvas();
    const canvas = stripCanvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `fnykids-${selectedTemplate.id}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png', 0.95);
    link.click();
    confetti({ particleCount: 70, spread: 80 });
  };

  // Filter templates
  const categories = ['Semua', 'LANY', 'Korean', 'Y2K', 'Cute'];
  const filteredTemplates = filterCategory === 'Semua'
    ? TEMPLATES
    : TEMPLATES.filter(t => t.category === filterCategory);

  return (
    <div className="animate-fade" style={{ maxWidth: '1060px', margin: '0 auto', paddingBottom: '80px' }}>
      
      {/* ═══════════════ TOP NAVIGATION BAR ═══════════════ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
        <button onClick={onBack} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
          <ChevronLeft size={16} /> Kembali
        </button>

        {/* View Switcher: Templates vs Camera */}
        <div className="seg-control">
          <button
            className={`seg-btn ${currentView === 'templates' ? 'active' : ''}`}
            onClick={() => setCurrentView('templates')}
          >
            <LayoutGrid size={15} /> Pilih Template
          </button>
          <button
            className={`seg-btn ${currentView === 'camera' ? 'active' : ''}`}
            onClick={() => setCurrentView('camera')}
          >
            <Camera size={15} /> Booth Kamera
          </button>
          {photos.length > 0 && (
            <button
              className={`seg-btn ${currentView === 'preview' ? 'active' : ''}`}
              onClick={() => { renderStripToCanvas(); setCurrentView('preview'); }}
            >
              <Eye size={15} /> Hasil ({photos.length}/{targetCount})
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {photos.length > 0 && (
            <button
              onClick={() => setPhotos([])}
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: '0.78rem', color: '#ef4444' }}
              title="Reset Semua Foto"
            >
              <Trash2 size={14} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════ VIEW 1: TEMPLATE SELECTION GALLERY ═══════════════ */}
      {currentView === 'templates' && (
        <div className="animate-fade">
          <div style={{ textAlign: 'center', marginBottom: '22px' }}>
            <h1 style={{ fontSize: 'clamp(1.3rem, 4vw, 1.6rem)', fontWeight: 900, color: 'var(--ink)', margin: '0 0 6px' }}>
              Pilih Template Photobooth
            </h1>
            <p style={{ fontSize: '0.84rem', color: 'var(--muted)', margin: 0 }}>
              Koleksi frame viral estetik ala Jepreto & LANY double-XL. Pilih frame favoritmu dan mulai foto!
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="category-scroll-container" style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '22px' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`btn ${filterCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.8rem', padding: '6px 16px' }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Templates Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 230px), 1fr))',
            gap: '18px'
          }}>
            {filteredTemplates.map(tpl => {
              const isSelected = selectedTemplate.id === tpl.id;
              return (
                <div
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl)}
                  className="card"
                  style={{
                    cursor: 'pointer',
                    padding: '14px',
                    borderRadius: '16px',
                    border: isSelected ? '2.5px solid var(--purple)' : '1px solid var(--line)',
                    background: 'var(--card)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {/* Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 800, padding: '3px 8px',
                      borderRadius: '12px', background: 'var(--purple-light)', color: 'var(--purple)'
                    }}>
                      {tpl.badge}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 600 }}>
                      {tpl.photoCount} Foto
                    </span>
                  </div>

                  {/* Frame Visual Preview Mockup */}
                  <div style={{
                    height: '240px',
                    borderRadius: '12px',
                    background: tpl.theme.bg,
                    padding: '12px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.2)'
                  }}>
                    {/* Top Branding */}
                    <div style={{ textAlign: 'center', color: tpl.theme.textMain, fontWeight: 900, fontSize: '0.74rem', letterSpacing: '2px' }}>
                      {tpl.category === 'LANY' ? 'LANY • XXL' : tpl.title.split(' ')[0]}
                    </div>

                    {/* Photo Cutout Slots */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: tpl.layout === 'grid-6' ? '1fr 1fr' : '1fr',
                      gap: '6px',
                      flex: 1,
                      margin: '8px 0'
                    }}>
                      {Array.from({ length: Math.min(tpl.photoCount, 4) }).map((_, i) => (
                        <div key={i} style={{
                          background: '#ffffff',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.68rem',
                          color: '#94a3b8',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                        }}>
                          {i + 1}
                        </div>
                      ))}
                    </div>

                    {/* Bottom Lyric Badge Mockup */}
                    <div style={{
                      textAlign: 'center',
                      background: 'rgba(0,0,0,0.25)',
                      padding: '3px 6px',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '0.62rem',
                      fontWeight: 800
                    }}>
                      {tpl.theme.lyricsTop || tpl.title}
                    </div>
                  </div>

                  {/* Card Info */}
                  <div>
                    <h3 style={{ fontSize: '0.94rem', fontWeight: 800, margin: '0 0 4px', color: 'var(--ink)' }}>
                      {tpl.title}
                    </h3>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {tpl.tags.map((tg, idx) => (
                        <span key={idx} style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>
                          {tg}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ width: '100%', padding: '8px', fontSize: '0.8rem', fontWeight: 700 }}
                  >
                    {isSelected ? '✓ Terpilih' : 'Gunakan Frame Ini'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════ VIEW 2: CAMERA BOOTH (JEPRETO STYLE) ═══════════════ */}
      {currentView === 'camera' && (
        <div className="animate-fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '20px', alignItems: 'start' }}>
          
          {/* LEFT: CONTROLS & SETTINGS SIDEBAR */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Active Template Card */}
            <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--purple)', background: 'var(--purple-light)', padding: '2px 8px', borderRadius: '6px' }}>
                  Template Aktif
                </span>
                <h3 style={{ fontSize: '1.02rem', fontWeight: 900, margin: '4px 0 2px' }}>
                  {selectedTemplate.title}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: 0 }}>
                  Target: {targetCount} Foto ({photos.length}/{targetCount} terambil)
                </p>
              </div>

              <button
                onClick={() => setCurrentView('templates')}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              >
                Ganti Frame
              </button>
            </div>

            {/* Delay Timer (Jepreto-style: 1s, 3s, 5s) */}
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <Clock size={16} color="var(--purple)" />
                <span style={{ fontSize: '0.84rem', fontWeight: 800 }}>Timer / Hitung Mundur</span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { sec: 1, label: '1 Detik' },
                  { sec: 3, label: '3 Detik' },
                  { sec: 5, label: '5 Detik' }
                ].map(item => (
                  <button
                    key={item.sec}
                    onClick={() => setDelaySec(item.sec)}
                    className={`btn ${delaySec === item.sec ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '8px', fontSize: '0.8rem', fontWeight: 700 }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Color Presets */}
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <Sparkles size={16} color="var(--purple)" />
                <span style={{ fontSize: '0.84rem', fontWeight: 800 }}>Efek Warna Kamera</span>
              </div>
              <div className="category-scroll-container" style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
                {FILTERS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFilter(f)}
                    className={`btn ${selectedFilter.id === f.id ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '6px 12px', fontSize: '0.76rem', fontWeight: 700, flexShrink: 0 }}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Mirror & Camera Switches */}
            <div className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FlipHorizontal size={16} color="var(--muted)" />
                <span style={{ fontSize: '0.84rem', fontWeight: 700 }}>Cermin (Mirror Video)</span>
              </div>
              <input
                type="checkbox"
                checked={mirror}
                onChange={e => setMirror(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

            {/* File Upload Option */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '10px', fontSize: '0.84rem' }}
            >
              <ImageIcon size={16} /> Atau Upload Foto dari Galeri HP/Laptop
            </button>
          </div>

          {/* RIGHT: VIEWPORT KAMERA & THUMBNAILS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Camera Viewport */}
            <div className="card" style={{
              position: 'relative', overflow: 'hidden', padding: 0,
              background: '#090a10', minHeight: '340px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '18px'
            }}>
              {/* Video Element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={() => videoRef.current?.play().catch(() => {})}
                style={{
                  width: '100%',
                  maxHeight: '420px',
                  objectFit: 'cover',
                  transform: mirror && facingMode === 'user' ? 'scaleX(-1)' : 'none',
                  filter: selectedFilter.css,
                  display: cameraActive ? 'block' : 'none'
                }}
              />

              {/* Tag Header Over Video (Jepreto-style) */}
              {cameraActive && (
                <div style={{
                  position: 'absolute', top: '14px', right: '14px',
                  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                  color: '#fff', padding: '5px 12px', borderRadius: '12px',
                  fontSize: '0.74rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  <Star size={13} color="#38bdf8" fill="#38bdf8" />
                  <span>{selectedTemplate.title} ({photos.length}/{targetCount})</span>
                </div>
              )}

              {/* Countdown Overlay */}
              {cameraActive && countdown !== null && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '6rem', fontWeight: 900
                }}>
                  {countdown}
                </div>
              )}

              {/* Camera Offline Placeholder */}
              {!cameraActive && (
                <div style={{ textAlign: 'center', padding: '36px 20px', color: '#fff' }}>
                  <div style={{
                    width: '60px', height: '60px', borderRadius: '20px',
                    background: 'rgba(255,255,255,0.1)', color: 'var(--purple-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 14px'
                  }}>
                    <Camera size={30} />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 6px' }}>Kamera Belum Aktif</h3>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', maxWidth: '300px', margin: '0 auto 18px' }}>
                    Nyalakan kamera untuk mengambil {targetCount} foto strip secara langsung dengan frame <b>{selectedTemplate.title}</b>.
                  </p>
                  <button onClick={() => startCamera()} className="btn btn-primary" style={{ padding: '10px 22px' }}>
                    <Camera size={16} /> Aktifkan Kamera Sekarang
                  </button>
                </div>
              )}
            </div>

            {cameraError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: '10px', fontSize: '0.82rem' }}>
                {cameraError}
              </div>
            )}

            {/* Shutter Button & Camera Controls Bar */}
            {cameraActive && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    const next = facingMode === 'user' ? 'environment' : 'user';
                    setFacingMode(next);
                    startCamera(next);
                  }}
                  className="btn btn-secondary"
                  title="Putar Kamera Depan / Belakang"
                >
                  <RefreshCw size={16} /> Balik
                </button>

                {/* Big Shutter Button */}
                <button
                  onClick={handleTriggerShutter}
                  disabled={countdown !== null || photos.length >= targetCount}
                  className="btn btn-primary"
                  style={{
                    padding: '12px 30px', fontSize: '1rem', fontWeight: 900,
                    borderRadius: 'var(--radius-full)',
                    background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)',
                    boxShadow: '0 4px 18px rgba(37,99,235,0.4)'
                  }}
                >
                  <Camera size={20} /> Jepret ({photos.length}/{targetCount})
                </button>

                <button onClick={stopCamera} className="btn btn-secondary" style={{ color: '#ef4444' }}>
                  Matikan
                </button>
              </div>
            )}

            {/* Captured Photos Slots Progress Bar (Jepreto-style) */}
            <div className="card" style={{ padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>Progres Foto ({photos.length}/{targetCount})</span>
                {photos.length === targetCount && (
                  <button
                    onClick={() => { renderStripToCanvas(); setCurrentView('preview'); }}
                    className="btn btn-primary"
                    style={{ padding: '4px 12px', fontSize: '0.74rem' }}
                  >
                    Lihat Hasil Akhir <ArrowRight size={13} />
                  </button>
                )}
              </div>

              {/* Photo Slot Boxes */}
              <div style={{ gridTemplateColumns: `repeat(${targetCount}, 1fr)`, display: 'grid', gap: '8px' }}>
                {Array.from({ length: targetCount }).map((_, idx) => {
                  const photoSrc = photos[idx];
                  return (
                    <div
                      key={idx}
                      style={{
                        aspectRatio: '1 / 1',
                        borderRadius: '10px',
                        border: photoSrc ? '2px solid var(--purple)' : '2px dashed var(--line)',
                        background: photoSrc ? 'none' : 'var(--bg)',
                        overflow: 'hidden',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: photoSrc ? 'var(--shadow-sm)' : 'none'
                      }}
                    >
                      {photoSrc ? (
                        <>
                          <img src={photoSrc} alt={`Capture ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                            style={{
                              position: 'absolute', top: '3px', right: '3px',
                              background: 'rgba(0,0,0,0.6)', color: '#fff',
                              border: 'none', borderRadius: '50%', width: '20px', height: '20px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                            }}
                            title="Hapus foto ini"
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--muted)' }}>
                          {idx + 1}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ═══════════════ VIEW 3: FINAL PREVIEW & DOWNLOAD ═══════════════ */}
      {currentView === 'preview' && (
        <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--purple)', background: 'var(--purple-light)', padding: '3px 12px', borderRadius: '20px' }}>
              🎉 Siap Diunduh
            </span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '6px 0 2px' }}>
              Hasil Photobooth {selectedTemplate.title}
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: 0 }}>
              Frame resmi beresolusi tinggi, siap simpan ke galeri atau posting ke Instagram/TikTok!
            </p>
          </div>

          {/* Action Toolbar */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => setCurrentView('camera')}
              className="btn btn-secondary"
              style={{ padding: '10px 18px', fontSize: '0.84rem' }}
            >
              <Camera size={16} /> Foto Ulang / Tambah
            </button>
            <button
              onClick={() => setCurrentView('templates')}
              className="btn btn-secondary"
              style={{ padding: '10px 18px', fontSize: '0.84rem' }}
            >
              <LayoutGrid size={16} /> Ganti Frame Lain
            </button>
            <button
              onClick={handleDownloadStrip}
              className="btn btn-primary"
              style={{
                padding: '11px 24px', fontSize: '0.9rem', fontWeight: 800,
                background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)',
                boxShadow: '0 4px 18px rgba(37,99,235,0.35)'
              }}
            >
              <Download size={18} /> Download Gambar PNG
            </button>
          </div>

          {/* Canvas Render Element */}
          <div className="card" style={{ padding: '14px', background: 'var(--card)', borderRadius: '18px', boxShadow: 'var(--shadow-md)', maxWidth: '100%', overflow: 'hidden' }}>
            <canvas
              ref={stripCanvasRef}
              style={{
                display: 'block',
                maxWidth: '100%',
                maxHeight: '75vh',
                height: 'auto',
                borderRadius: '12px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.18)'
              }}
            />
          </div>

        </div>
      )}

      {/* Hidden canvas for background rendering */}
      {currentView !== 'preview' && (
        <canvas ref={stripCanvasRef} style={{ display: 'none' }} />
      )}

    </div>
  );
}
