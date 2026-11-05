import React, { useState } from 'react';
import {
  Camera, LayoutGrid, Scissors, Play, Users, Image,
  QrCode, Utensils, CheckSquare, Code, Calendar, BookMarked,
  Search, ArrowRight, Zap, Shield, Heart
} from 'lucide-react';

export default function Home({ onSelectTool }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');

  const tools = [
    {
      id: 'booth',
      title: 'Photobooth Strip',
      desc: 'Buat foto strip ala photobox Korea & retro vintage. Frame estetik, stiker, dan tanggal.',
      icon: Camera,
      badge: '🔥 Populer',
      category: 'Kreatif',
      gradient: 'linear-gradient(135deg, #2563eb, #38bdf8)'
    },
    {
      id: 'studio',
      title: 'Collage Studio',
      desc: 'Kolase foto dengan rasio IG Feed/Story/Reels, gap & radius slider, warna canvas custom.',
      icon: LayoutGrid,
      badge: '✨ Favorit',
      category: 'Kreatif',
      gradient: 'linear-gradient(135deg, #1d4ed8, #60a5fa)'
    },
    {
      id: 'removebg',
      title: 'Hapus Background',
      desc: 'Hapus latar belakang foto secara otomatis. Kuas manual & warna pengganti.',
      icon: Scissors,
      badge: '🔒 Privat',
      category: 'Kreatif',
      gradient: 'linear-gradient(135deg, #0284c7, #06b6d4)'
    },
    {
      id: 'convert',
      title: 'Kompres Gambar',
      desc: 'Perkecil ukuran file foto, konversi ke WEBP/JPG/PNG dengan live preview.',
      icon: Image,
      badge: '⚡ Cepat',
      category: 'Kreatif',
      gradient: 'linear-gradient(135deg, #0ea5e9, #38bdf8)'
    },
    {
      id: 'wheel',
      title: 'Spin Wheel',
      desc: 'Roda keberuntungan acak dengan suara putar, deselerasi fisik & confetti.',
      icon: Play,
      badge: '🎉 Seru',
      category: 'Fun',
      gradient: 'linear-gradient(135deg, #3b82f6, #0284c7)'
    },
    {
      id: 'groups',
      title: 'Generator Kelompok',
      desc: 'Bagi nama kelompok adil & acak. Format rapi langsung salin ke WhatsApp.',
      icon: Users,
      badge: '👥 Praktis',
      category: 'Fun',
      gradient: 'linear-gradient(135deg, #1e40af, #2563eb)'
    },
    {
      id: 'food',
      title: 'Mau Makan Apa?',
      desc: 'Roulette kuliner menu Indonesia. Filter kategori & tambah menu sendiri.',
      icon: Utensils,
      badge: '🍜 Kuliner',
      category: 'Fun',
      gradient: 'linear-gradient(135deg, #f59e0b, #0ea5e9)'
    },
    {
      id: 'qr',
      title: 'QR Code Studio',
      desc: 'Buat QR untuk URL, WhatsApp, Wi-Fi. Pindai QR dari gambar.',
      icon: QrCode,
      badge: '📲 Utilitas',
      category: 'Tools',
      gradient: 'linear-gradient(135deg, #1d4ed8, #0284c7)'
    },
    {
      id: 'todo',
      title: 'Tugas & Catatan',
      desc: 'To-do list harian dan scratchpad catatan tersimpan otomatis lokal.',
      icon: CheckSquare,
      badge: '📝 Simpel',
      category: 'Tools',
      gradient: 'linear-gradient(135deg, #2563eb, #06b6d4)'
    },
    {
      id: 'schedule',
      title: 'Jadwal Kuliah & Tugas (Notif HP)',
      desc: 'Auto KSM, manajemen tugas & deadline, sinkronisasi kalender HP (Google/Apple) dengan pengingat otomatis.',
      icon: Calendar,
      badge: '⚡ Auto KSM & Notif',
      category: 'Tools',
      gradient: 'linear-gradient(135deg, #1d4ed8, #2563eb)'
    },
    {
      id: 'summarizer',
      title: 'Ringkas Jurnal & Dokumen',
      desc: 'Ringkas jurnal ilmiah, skripsi, PDF, paper riset, atau materi kuliah. Ekstrak masalah, metode, hasil & kesimpulan otomatis.',
      icon: BookMarked,
      badge: '📑 AI Jurnal',
      category: 'Tools',
      gradient: 'linear-gradient(135deg, #0284c7, #2563eb)'
    },
    {
      id: 'encoding',
      title: 'Encoding & Hash',
      desc: 'Base64, URL encode/decode, SHA-256 hash & JSON formatter.',
      icon: Code,
      badge: '⚙️ Dev',
      category: 'Tools',
      gradient: 'linear-gradient(135deg, #475569, #1d4ed8)'
    }
  ];

  const categories = ['Semua', 'Kreatif', 'Fun', 'Tools'];

  const filteredTools = tools.filter(tool => {
    const matchesCat = activeCategory === 'Semua' || tool.category === activeCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      tool.title.toLowerCase().includes(q) ||
      tool.desc.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="animate-fade" style={{ maxWidth: '1060px', margin: '0 auto', paddingBottom: '100px' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '44px 20px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'var(--purple-light)', color: 'var(--purple)',
          padding: '6px 16px', borderRadius: 'var(--radius-full)',
          fontSize: '0.82rem', fontWeight: 700, marginBottom: '18px',
          border: '1px solid #bfdbfe'
        }}>
          <Shield size={15} /> 100% Offline & Lokal — Data Aman
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '2.8rem', fontWeight: 900, letterSpacing: '-1px',
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          fnykids
        </h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--muted)', maxWidth: '520px', lineHeight: 1.5 }}>
          Tools seru untuk foto, kolase, spin wheel, kelompok & produktivitas.
          <br />Semuanya lokal di browser — tanpa upload, tanpa server.
        </p>

        {/* Search */}
        <div style={{ width: '100%', maxWidth: '460px', marginTop: '22px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            type="text"
            placeholder="Cari tools..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '44px', borderRadius: 'var(--radius-full)', background: '#fff', boxShadow: 'var(--shadow-sm)' }}
          />
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '18px' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`btn ${activeCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.82rem', padding: '7px 18px' }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tools Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '18px', padding: '0 8px'
      }}>
        {filteredTools.map(tool => {
          const IconComp = tool.icon;
          return (
            <div
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className="card"
              style={{
                cursor: 'pointer', display: 'flex', flexDirection: 'column',
                justifyContent: 'space-between', padding: '24px',
                position: 'relative', overflow: 'hidden'
              }}
            >
              {/* Top: icon + badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '14px',
                  background: tool.gradient,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
                }}>
                  <IconComp size={22} />
                </div>
                <span style={{
                  fontSize: '0.74rem', fontWeight: 700,
                  background: 'var(--line-light)', padding: '4px 10px',
                  borderRadius: 'var(--radius-full)', color: 'var(--ink-light)'
                }}>
                  {tool.badge}
                </span>
              </div>

              <h3 style={{ fontSize: '1.12rem', fontWeight: 800, marginBottom: '5px' }}>{tool.title}</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--muted)', lineHeight: 1.45, flex: 1 }}>{tool.desc}</p>

              <div style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                fontSize: '0.82rem', fontWeight: 700, marginTop: '18px',
                color: 'var(--purple)'
              }}>
                Buka <ArrowRight size={15} />
              </div>
            </div>
          );
        })}
      </div>

      {filteredTools.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
          <p style={{ fontSize: '1rem', fontWeight: 600 }}>Tidak ditemukan tools yang cocok 🤔</p>
          <button onClick={() => { setSearchQuery(''); setActiveCategory('Semua'); }}
            className="btn btn-secondary" style={{ marginTop: '12px' }}>
            Reset Pencarian
          </button>
        </div>
      )}

      {/* Footer */}
      <div style={{
        textAlign: 'center', marginTop: '50px', padding: '20px',
        borderTop: '1px solid var(--line)', color: 'var(--muted)', fontSize: '0.8rem'
      }}>
        <p style={{ fontWeight: 700, color: 'var(--ink)' }}>fnykids — Tools Seru, Aman & Lokal</p>
        <p style={{ marginTop: '4px' }}>Semua data diproses di perangkat Anda dan tidak dikirim ke server manapun.</p>
      </div>
    </div>
  );
}
