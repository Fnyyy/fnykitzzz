import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Play, RotateCcw, Plus, Trash2, Sparkles, Volume2, VolumeX } from 'lucide-react';
import confetti from 'canvas-confetti';

const PRESETS = {
  makan: {
    name: 'Makan Apa Hari Ini?',
    items: ['Ayam Geprek', 'Nasi Padang', 'Mie Ayam', 'Bakso Urat', 'Seblak Pedas', 'Soto Ayam', 'Nasi Goreng', 'Salad Buah']
  },
  siapa: {
    name: 'Giliran Siapa?',
    items: ['Kamu', 'Dia', 'Kita Berdua', 'Tunda Dulu', 'Suit Ulang', 'Bebas Pilih']
  },
  yesno: {
    name: 'Ya atau Tidak?',
    items: ['YA! Lakukan Sekarang', 'JANGAN / TIDAK', 'Pikirkan Sekali Lagi', 'Tergantung Mood', 'YA!', 'TIDAK']
  }
};

const PASTEL_PALETTE = [
  '#f4df86', '#e5ddf5', '#dcece1', '#f4dcdc', '#dfebf5', '#fad4c0', '#d0e8f2', '#fbe7c6'
];

export default function SpinWheel({ onBack }) {
  const [items, setItems] = useState(PRESETS.makan.items);
  const [newItemText, setNewItemText] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const canvasRef = useRef(null);
  const rotationRef = useRef(0);
  const animFrameRef = useRef(null);
  const audioCtxRef = useRef(null);

  // Play click tone with Web Audio
  const playTickSound = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {}
  };

  // Draw wheel on canvas
  const drawWheel = (angleOffset = 0) => {
    const canvas = canvasRef.current;
    if (!canvas || items.length === 0) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 16;
    const numSlices = items.length;
    const arc = (2 * Math.PI) / numSlices;

    ctx.clearRect(0, 0, size, size);

    // Draw slices
    items.forEach((item, i) => {
      const angle = angleOffset + i * arc;
      ctx.beginPath();
      ctx.fillStyle = PASTEL_PALETTE[i % PASTEL_PALETTE.length];
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, angle, angle + arc);
      ctx.lineTo(center, center);
      ctx.fill();

      // Border line
      ctx.strokeStyle = '#292b27';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Text label
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(angle + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#292b27';
      ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(item.length > 16 ? item.slice(0, 15) + '…' : item, radius - 20, 5);
      ctx.restore();
    });

    // Center hub
    ctx.beginPath();
    ctx.arc(center, center, 26, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#292b27';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(center, center, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#292b27';
    ctx.fill();
  };

  useEffect(() => {
    drawWheel(rotationRef.current);
  }, [items]);

  const spin = () => {
    if (isSpinning || items.length < 2) return;
    setIsSpinning(true);
    setWinner(null);

    const spinDuration = 4500; // 4.5 seconds
    const totalRotation = Math.PI * 2 * (6 + Math.random() * 4); // 6 to 10 full spins + random
    const startAngle = rotationRef.current;
    const startTime = performance.now();
    let lastTickAngle = startAngle;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / spinDuration, 1);
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentAngle = startAngle + totalRotation * easeOut;

      rotationRef.current = currentAngle;
      drawWheel(currentAngle);

      // Play tick sound when crossing slice boundary
      const arc = (2 * Math.PI) / items.length;
      if (Math.floor(currentAngle / arc) !== Math.floor(lastTickAngle / arc)) {
        playTickSound();
        lastTickAngle = currentAngle;
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        // Calculate winning slice (pointer is at top center, angle = 1.5 * PI)
        const target = (1.5 * Math.PI - (currentAngle % (2 * Math.PI)) + 4 * Math.PI) % (2 * Math.PI);
        const winIdx = Math.floor(target / arc) % items.length;
        setWinner(items[winIdx]);
        confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  };

  const addItem = (e) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    setItems(prev => [...prev, newItemText.trim()]);
    setNewItemText('');
  };

  const removeItem = (idx) => {
    if (items.length <= 2) return;
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="animate-fade" style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <button onClick={onBack} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
          <ChevronLeft size={18} /> Kembali
        </button>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Spin Wheel</h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Roda keberuntungan dan pengambil keputusan acak by fnykids</p>
        </div>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="btn btn-secondary"
          style={{ padding: '8px 12px' }}
          title={soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>
        {/* Left: Wheel Canvas Visualizer */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px', position: 'relative' }}>
          {/* Top Pointer Arrow */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10,
              width: 0,
              height: 0,
              borderLeft: '15px solid transparent',
              borderRight: '15px solid transparent',
              borderTop: '28px solid #ff4757',
              filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.3))'
            }}
          />

          <canvas
            ref={canvasRef}
            width={380}
            height={380}
            style={{
              maxWidth: '100%',
              borderRadius: '50%',
              boxShadow: 'var(--shadow-md)',
              background: '#fff'
            }}
          />

          <button
            onClick={spin}
            disabled={isSpinning || items.length < 2}
            className="btn btn-accent"
            style={{ marginTop: '24px', padding: '14px 40px', fontSize: '1.1rem', fontWeight: 800, letterSpacing: '1px' }}
          >
            <Play size={22} fill="currentColor" /> {isSpinning ? 'MEMUTAR...' : 'PUTAR RODA!'}
          </button>

          {/* Winner Announcement Popup */}
          {winner && (
            <div
              className="animate-pop"
              style={{
                marginTop: '18px',
                background: 'var(--yellow)',
                border: '2px solid #292b27',
                padding: '14px 24px',
                borderRadius: '16px',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Hasil Pilihan:</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, marginTop: '2px' }}>🎉 {winner} 🎉</div>
            </div>
          )}
        </div>

        {/* Right: Items and Presets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Quick Presets */}
          <div className="card">
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px' }}>Pilihan Cepat (Preset)</h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {Object.entries(PRESETS).map(([k, p]) => (
                <button
                  key={k}
                  onClick={() => setItems(p.items)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Item Manager */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Daftar Pilihan ({items.length})</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Min. 2 pilihan</span>
            </div>

            <form onSubmit={addItem} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <input
                type="text"
                placeholder="Tambah opsi baru..."
                value={newItemText}
                onChange={e => setNewItemText(e.target.value)}
                className="input-field"
                style={{ fontSize: '0.85rem' }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0 16px' }}>
                <Plus size={18} />
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px', overflowY: 'auto' }}>
              {items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: 'var(--line-light)',
                    fontSize: '0.88rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: PASTEL_PALETTE[idx % PASTEL_PALETTE.length], border: '1px solid #999' }} />
                    <span style={{ fontWeight: 600 }}>{item}</span>
                  </div>
                  {items.length > 2 && (
                    <button
                      onClick={() => removeItem(idx)}
                      style={{ color: '#999', padding: '4px' }}
                      title="Hapus"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

