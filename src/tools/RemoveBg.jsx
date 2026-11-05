import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft, Download, Upload, Eraser, Paintbrush,
  Pipette, RotateCcw, Sliders, Wand2, Eye, EyeOff, Sparkles,
  Undo2, ZoomIn, ZoomOut, Check, ShieldCheck
} from 'lucide-react';
import { removeBackground } from '@imgly/background-removal';
import confetti from 'canvas-confetti';

export default function RemoveBg({ onBack }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [mode, setMode] = useState('none'); // 'none', 'wand', 'erase', 'restore'
  const [tolerance, setTolerance] = useState(30);
  const [brushSize, setBrushSize] = useState(28);
  const [outputBg, setOutputBg] = useState('transparent');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [progressPercent, setProgressPercent] = useState(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [history, setHistory] = useState([]);

  const editCanvasRef = useRef(null);
  const originalCanvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const isDrawingRef = useRef(false);
  const loadedImgRef = useRef(null);

  // Initialize canvases when imageSrc changes
  useEffect(() => {
    if (!imageSrc || !loadedImgRef.current) return;
    const img = loadedImgRef.current;
    const edit = editCanvasRef.current;
    const orig = originalCanvasRef.current;
    if (!edit || !orig) return;

    edit.width = img.width;
    edit.height = img.height;
    orig.width = img.width;
    orig.height = img.height;

    const eCtx = edit.getContext('2d');
    const oCtx = orig.getContext('2d');

    oCtx.clearRect(0, 0, orig.width, orig.height);
    oCtx.drawImage(img, 0, 0);

    eCtx.clearRect(0, 0, edit.width, edit.height);
    eCtx.drawImage(img, 0, 0);

    // Save initial history
    saveHistorySnapshot(eCtx, img.width, img.height);
  }, [imageSrc]);

  const saveHistorySnapshot = (ctx, w, h) => {
    try {
      const snap = ctx.getImageData(0, 0, w, h);
      setHistory(prev => [...prev.slice(-8), snap]);
    } catch (e) {
      console.warn('History save error', e);
    }
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const edit = editCanvasRef.current;
    if (!edit) return;
    const ctx = edit.getContext('2d');
    const newHist = [...history];
    newHist.pop(); // remove current
    const prevSnap = newHist[newHist.length - 1];
    if (prevSnap) {
      ctx.putImageData(prevSnap, 0, 0);
      setHistory(newHist);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        loadedImgRef.current = img;
        setHistory([]);
        setImageSrc(ev.target.result);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Color distance Euclidean
  const colorDist = (r1, g1, b1, r2, g2, b2) => {
    return Math.hypot(r1 - r2, g1 - g2, b1 - b2);
  };

  // 1. SMART AI BACKGROUND REMOVAL (Model-based, neat edges, preserves clothes & face)
  const handleAiRemove = async () => {
    if (!imageSrc) return;
    setIsProcessing(true);
    setProgressText('Memulai AI lokal...');
    setProgressPercent(null);

    try {
      // Use imgly AI model running client-side
      const blob = await removeBackground(imageSrc, {
        progress: (key, current, total) => {
          if (total > 0) {
            const pct = Math.round((current / total) * 100);
            setProgressPercent(pct);
            setProgressText(`Menganalisis objek (${pct}%)...`);
          } else {
            setProgressText('Memproses objek foto...');
          }
        }
      });

      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const edit = editCanvasRef.current;
        if (edit) {
          const ctx = edit.getContext('2d');
          ctx.clearRect(0, 0, edit.width, edit.height);
          ctx.drawImage(img, 0, 0, edit.width, edit.height);
          saveHistorySnapshot(ctx, edit.width, edit.height);
        }
        setIsProcessing(false);
        setProgressText('');
        setProgressPercent(null);
        confetti({ particleCount: 60, spread: 75 });
      };
      img.src = url;
    } catch (err) {
      console.warn('AI offline fallback to Flood-Fill BFS:', err);
      // Seamlessly fall back to Flood-Fill BFS if WebAssembly cannot load
      setIsProcessing(false);
      setProgressText('');
      setProgressPercent(null);
      handleBorderFloodFill();
    }
  };

  // 2. SMART FLOOD-FILL BFS (Edge-Connected Masking from borders)
  // Crucial: Only traverses from outside perimeter.
  // Internal white t-shirt, face, reflections will NEVER be touched!
  const handleBorderFloodFill = () => {
    const edit = editCanvasRef.current;
    const orig = originalCanvasRef.current;
    if (!edit || !orig) return;

    setIsProcessing(true);
    setProgressText('Menghapus latar dari tepi...');

    setTimeout(() => {
      const ctx = edit.getContext('2d');
      const w = edit.width;
      const h = edit.height;

      // Start from original
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(orig, 0, 0);

      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      const totalPixels = w * h;

      // Visited array
      const visited = new Uint8Array(totalPixels);
      // Queue for BFS
      const queue = new Int32Array(totalPixels);
      let head = 0;
      let tail = 0;

      // Sample 4 corner colors
      const cornerSamples = [
        [data[0], data[1], data[2]],
        [data[(w - 1) * 4], data[(w - 1) * 4 + 1], data[(w - 1) * 4 + 2]],
        [data[(h - 1) * w * 4], data[(h - 1) * w * 4 + 1], data[(h - 1) * w * 4 + 2]],
        [data[((h - 1) * w + (w - 1)) * 4], data[((h - 1) * w + (w - 1)) * 4 + 1], data[((h - 1) * w + (w - 1)) * 4 + 2]]
      ];

      const threshold = tolerance * 2.2;

      const matchesBackground = (r, g, b) => {
        return cornerSamples.some(sample => colorDist(r, g, b, sample[0], sample[1], sample[2]) <= threshold);
      };

      const pushPixel = (idx) => {
        if (visited[idx]) return;
        visited[idx] = 1;
        const pi = idx * 4;
        if (matchesBackground(data[pi], data[pi + 1], data[pi + 2])) {
          queue[tail++] = idx;
        }
      };

      // Push all 4 outer borders only!
      for (let x = 0; x < w; x++) {
        pushPixel(x); // top row
        pushPixel((h - 1) * w + x); // bottom row
      }
      for (let y = 0; y < h; y++) {
        pushPixel(y * w); // left column
        pushPixel(y * w + (w - 1)); // right column
      }

      // BFS traversal
      while (head < tail) {
        const curr = queue[head++];
        data[curr * 4 + 3] = 0; // Make transparent

        const cx = curr % w;
        const cy = Math.floor(curr / w);

        // 4-neighborhood
        if (cx > 0) pushPixel(curr - 1);
        if (cx < w - 1) pushPixel(curr + 1);
        if (cy > 0) pushPixel(curr - w);
        if (cy < h - 1) pushPixel(curr + w);
      }

      ctx.putImageData(imgData, 0, 0);
      saveHistorySnapshot(ctx, w, h);
      setIsProcessing(false);
      setProgressText('');
      confetti({ particleCount: 35, spread: 60 });
    }, 60);
  };

  // 3. MAGIC WAND (Click-to-flood-fill at specific background point)
  const handleCanvasClick = (e) => {
    if (mode !== 'wand') return;
    const edit = editCanvasRef.current;
    if (!edit) return;

    const rect = edit.getBoundingClientRect();
    const scaleX = edit.width / rect.width;
    const scaleY = edit.height / rect.height;
    const startX = Math.floor((e.clientX - rect.left) * scaleX);
    const startY = Math.floor((e.clientY - rect.top) * scaleY);

    const ctx = edit.getContext('2d');
    const w = edit.width;
    const h = edit.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    const startIdx = startY * w + startX;
    const startR = data[startIdx * 4];
    const startG = data[startIdx * 4 + 1];
    const startB = data[startIdx * 4 + 2];
    const startA = data[startIdx * 4 + 3];

    if (startA === 0) return;

    setIsProcessing(true);
    setTimeout(() => {
      const visited = new Uint8Array(w * h);
      const queue = new Int32Array(w * h);
      let head = 0;
      let tail = 0;

      const threshold = tolerance * 2.2;

      queue[tail++] = startIdx;
      visited[startIdx] = 1;

      while (head < tail) {
        const curr = queue[head++];
        data[curr * 4 + 3] = 0;

        const cx = curr % w;
        const cy = Math.floor(curr / w);

        const checkNeighbor = (nIdx) => {
          if (visited[nIdx]) return;
          visited[nIdx] = 1;
          const pi = nIdx * 4;
          if (data[pi + 3] !== 0 && colorDist(data[pi], data[pi + 1], data[pi + 2], startR, startG, startB) <= threshold) {
            queue[tail++] = nIdx;
          }
        };

        if (cx > 0) checkNeighbor(curr - 1);
        if (cx < w - 1) checkNeighbor(curr + 1);
        if (cy > 0) checkNeighbor(curr - w);
        if (cy < h - 1) checkNeighbor(curr + w);
      }

      ctx.putImageData(imgData, 0, 0);
      saveHistorySnapshot(ctx, w, h);
      setIsProcessing(false);
    }, 40);
  };

  // 4. MANUAL ERASER & RESTORE BRUSH
  const handleMouseDown = (e) => {
    if (mode !== 'erase' && mode !== 'restore') return;
    isDrawingRef.current = true;
    applyBrush(e);
  };

  const handleMouseMove = (e) => {
    if (!isDrawingRef.current) return;
    applyBrush(e);
  };

  const handleMouseUp = () => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      const edit = editCanvasRef.current;
      if (edit) saveHistorySnapshot(edit.getContext('2d'), edit.width, edit.height);
    }
  };

  const applyBrush = (e) => {
    const edit = editCanvasRef.current;
    const orig = originalCanvasRef.current;
    if (!edit || !orig) return;

    const rect = edit.getBoundingClientRect();
    const scaleX = edit.width / rect.width;
    const scaleY = edit.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const ctx = edit.getContext('2d');

    if (mode === 'erase') {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, brushSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (mode === 'restore') {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, brushSize, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(orig, 0, 0);
      ctx.restore();
    }
  };

  // Reset to original photo
  const handleReset = () => {
    const edit = editCanvasRef.current;
    const orig = originalCanvasRef.current;
    if (!edit || !orig) return;
    const ctx = edit.getContext('2d');
    ctx.clearRect(0, 0, edit.width, edit.height);
    ctx.drawImage(orig, 0, 0);
    saveHistorySnapshot(ctx, edit.width, edit.height);
  };

  // Download Output PNG
  const handleDownload = () => {
    const edit = editCanvasRef.current;
    if (!edit) return;

    const outCanvas = document.createElement('canvas');
    outCanvas.width = edit.width;
    outCanvas.height = edit.height;
    const ctx = outCanvas.getContext('2d');

    if (outputBg !== 'transparent') {
      ctx.fillStyle = outputBg;
      ctx.fillRect(0, 0, outCanvas.width, outCanvas.height);
    }
    ctx.drawImage(edit, 0, 0);

    const link = document.createElement('a');
    link.download = `fnykids-cutout-${Date.now()}.png`;
    link.href = outCanvas.toDataURL('image/png');
    link.click();
    confetti({ particleCount: 50, spread: 70 });
  };

  return (
    <div className="animate-fade" style={{ maxWidth: '1080px', margin: '0 auto', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <button onClick={onBack} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
          <ChevronLeft size={18} /> Kembali
        </button>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900 }}>Hapus Background</h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>AI & Smart Edge Cutout — Rapi, Presisi & 100% Lokal di Browser</p>
        </div>
        <div style={{ width: '80px' }} />
      </div>

      {!imageSrc ? (
        /* Upload Card */
        <div
          onClick={() => fileInputRef.current?.click()}
          className="card"
          style={{
            minHeight: '380px',
            border: '2px dashed var(--line)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            textAlign: 'center',
            gap: '14px',
            background: 'var(--card)'
          }}
        >
          <div style={{
            width: '72px', height: '72px', borderRadius: '22px',
            background: 'var(--purple-light)', color: 'var(--purple)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Wand2 size={34} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900 }}>Pilih Foto untuk Dihapus Background</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', maxWidth: '440px', marginTop: '6px' }}>
              Didukung AI Person Segmentation & Smart Flood-Fill. Pakaian, wajah, kacamata, dan rambut tetap terlindungi rapi!
            </p>
          </div>
          <button className="btn btn-accent" style={{ marginTop: '8px', padding: '12px 28px', fontWeight: 800 }}>
            <Upload size={18} /> Pilih Berkas Foto
          </button>
        </div>
      ) : (
        /* Editor Studio */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '16px', alignItems: 'start' }}>
          {/* Controls Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>Peralatan Edit</h3>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={handleUndo}
                    disabled={history.length <= 1}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '5px 10px' }}
                    title="Undo / Batalkan editan terakhir"
                  >
                    <Undo2 size={13} /> Undo
                  </button>
                  <button onClick={handleReset} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '5px 10px' }}>
                    <RotateCcw size={13} /> Reset Asli
                  </button>
                </div>
              </div>

              {/* Primary AI Button */}
              <button
                onClick={handleAiRemove}
                disabled={isProcessing}
                className="btn btn-accent"
                style={{
                  width: '100%', padding: '14px', fontWeight: 900, fontSize: '0.95rem',
                  boxShadow: '0 4px 18px rgba(124, 92, 252, 0.35)'
                }}
              >
                <Sparkles size={18} /> {isProcessing ? (progressText || 'Memproses AI...') : '✨ Hapus Background Otomatis (AI Rapi)'}
              </button>

              {/* Secondary Edge Flood Fill Button */}
              <button
                onClick={handleBorderFloodFill}
                disabled={isProcessing}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '10px', fontSize: '0.85rem', fontWeight: 700 }}
              >
                <Wand2 size={16} /> Mode Smart Flood-Fill (Cepat)
              </button>

              {/* Manual Tools Mode */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>
                  Peralatan Manual & Koreksi
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  <button
                    onClick={() => setMode(mode === 'wand' ? 'none' : 'wand')}
                    className={`btn ${mode === 'wand' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.78rem', padding: '8px 4px', flexDirection: 'column', gap: '4px' }}
                  >
                    <Pipette size={18} />
                    <span>Klik Hapus</span>
                  </button>
                  <button
                    onClick={() => setMode(mode === 'erase' ? 'none' : 'erase')}
                    className={`btn ${mode === 'erase' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.78rem', padding: '8px 4px', flexDirection: 'column', gap: '4px' }}
                  >
                    <Eraser size={18} />
                    <span>Kuas Hapus</span>
                  </button>
                  <button
                    onClick={() => setMode(mode === 'restore' ? 'none' : 'restore')}
                    className={`btn ${mode === 'restore' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.78rem', padding: '8px 4px', flexDirection: 'column', gap: '4px' }}
                  >
                    <Paintbrush size={18} />
                    <span>Kuas Pulihkan</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Guidance Note */}
              <div style={{ background: 'var(--line-light)', padding: '10px 12px', borderRadius: '12px', fontSize: '0.78rem', color: 'var(--ink)' }}>
                {mode === 'wand' && '🎯 Klik di bagian latar belakang mana saja untuk menghapus area warna tersebut.'}
                {mode === 'erase' && '🧹 Sapukan kuas pada sisa objek/latar yang masih tertinggal.'}
                {mode === 'restore' && '🖌️ Sapukan kuas pada baju atau wajah untuk memulihkan bagian yang terhapus.'}
                {mode === 'none' && '💡 Klik tombol "Hapus Background Otomatis" untuk hasil potongan rapi instan.'}
              </div>

              {/* Brush Size / Tolerance */}
              {(mode === 'erase' || mode === 'restore') ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                    <span>Ukuran Kuas</span>
                    <span>{brushSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="100"
                    value={brushSize}
                    onChange={e => setBrushSize(Number(e.target.value))}
                  />
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                    <span>Sensitivitas Toleransi Tepi</span>
                    <span>{tolerance}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    value={tolerance}
                    onChange={e => setTolerance(Number(e.target.value))}
                  />
                </div>
              )}

              {/* Color Replacement (Pasfoto red/blue included!) */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>
                  Warna Latar Baru / Pasfoto
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'transparent', label: 'Transparan', style: { background: 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 8px 8px' } },
                    { id: '#ffffff', label: 'Putih Bersih', style: { background: '#ffffff' } },
                    { id: '#dc2626', label: 'Merah Pasfoto (KTP)', style: { background: '#dc2626' } },
                    { id: '#2563eb', label: 'Biru Pasfoto (KTP)', style: { background: '#2563eb' } },
                    { id: '#1a1a2e', label: 'Hitam Studio', style: { background: '#1a1a2e' } },
                    { id: '#ff6b9d', label: 'Pink Pastel', style: { background: '#ff6b9d' } },
                    { id: '#7c5cfc', label: 'Ungu fnykids', style: { background: '#7c5cfc' } },
                    { id: '#00d4aa', label: 'Mint Soft', style: { background: '#00d4aa' } }
                  ].map(c => (
                    <button
                      key={c.id}
                      onClick={() => setOutputBg(c.id)}
                      title={c.label}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: outputBg === c.id ? '3px solid var(--purple)' : '1px solid var(--line)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                        cursor: 'pointer',
                        ...c.style
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Ganti Foto
              </button>
              <button
                onClick={handleDownload}
                className="btn btn-primary"
                style={{ flex: 1.5, fontWeight: 800 }}
              >
                <Download size={16} /> Simpan PNG
              </button>
            </div>
          </div>

          {/* Canvas Viewport */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>
                {showOriginal ? 'Foto Asli' : 'Pratinjau Hasil Potongan'}
              </span>
              <button
                onMouseDown={() => setShowOriginal(true)}
                onMouseUp={() => setShowOriginal(false)}
                onTouchStart={() => setShowOriginal(true)}
                onTouchEnd={() => setShowOriginal(false)}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                title="Tahan untuk membandingkan dengan foto asli"
              >
                {showOriginal ? <Eye size={13} /> : <EyeOff size={13} />} Tahan untuk Intip Asli
              </button>
            </div>

            <div
              style={{
                width: '100%',
                maxHeight: '480px',
                minHeight: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: outputBg === 'transparent'
                  ? 'repeating-conic-gradient(#e8e6f2 0% 25%, #ffffff 0% 50%) 50% / 18px 18px'
                  : outputBg,
                borderRadius: '16px',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)'
              }}
            >
              {/* Working Editable Canvas */}
              <canvas
                ref={editCanvasRef}
                onClick={handleCanvasClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                  maxWidth: '100%',
                  maxHeight: '460px',
                  objectFit: 'contain',
                  cursor: mode === 'erase' ? 'crosshair' : mode === 'restore' ? 'cell' : mode === 'wand' ? 'pointer' : 'default',
                  display: showOriginal ? 'none' : 'block'
                }}
              />

              {/* Original Preview */}
              <canvas
                ref={originalCanvasRef}
                style={{
                  maxWidth: '100%',
                  maxHeight: '460px',
                  objectFit: 'contain',
                  display: showOriginal ? 'block' : 'none'
                }}
              />

              {/* Processing Overlay */}
              {isProcessing && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  gap: '10px'
                }}>
                  <Sparkles size={28} className="animate-spin" color="var(--purple)" />
                  <div>{progressText || 'Memproses foto...'}</div>
                  {progressPercent !== null && (
                    <div style={{ width: '180px', height: '6px', background: 'var(--line)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--purple)', transition: 'width 0.2s' }} />
                    </div>
                  )}
                </div>
              )}
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '12px', textAlign: 'center' }}>
              🔒 Diproses 100% lokal di browser Anda. Foto tidak pernah dikirim ke internet/cloud.
            </p>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />
    </div>
  );
}
