import React, { useState } from 'react';
import { ChevronLeft, Utensils, Shuffle, Sparkles, Plus, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';

const INITIAL_FOODS = [
  { name: 'Ayam Geprek Sambal Bawang', cat: 'Ayam', price: 'Rp 15.000 - 20.000', emoji: '🍗' },
  { name: 'Nasi Padang (Rendang + Daun Singkong)', cat: 'Nasi', price: 'Rp 18.000 - 28.000', emoji: '🍛' },
  { name: 'Mie Ayam Bakso Urat', cat: 'Mie & Bakso', price: 'Rp 15.000 - 22.000', emoji: '🍜' },
  { name: 'Nasi Goreng Spesial + Telur Ceplok', cat: 'Nasi', price: 'Rp 15.000 - 20.000', emoji: '🍳' },
  { name: 'Sate Ayam Madura Bumbu Kacang', cat: 'Ayam', price: 'Rp 20.000 - 30.000', emoji: '🍢' },
  { name: 'Seblak Ceker Komplit Pedas', cat: 'Pedas / Gurih', price: 'Rp 12.000 - 18.000', emoji: '🌶️' },
  { name: 'Soto Ayam Lamongan Koya', cat: 'Nasi', price: 'Rp 15.000 - 20.000', emoji: '🍲' },
  { name: 'Indomie Telur Kornet (Warmindo)', cat: 'Hemat Anak Kost', price: 'Rp 10.000 - 15.000', emoji: '🥢' },
  { name: 'Bebek Goreng Sambal Korek', cat: 'Pedas / Gurih', price: 'Rp 25.000 - 35.000', emoji: '🦆' },
  { name: 'Batagor & Siomay Bumbu Kacang', cat: 'Hemat Anak Kost', price: 'Rp 10.000 - 15.000', emoji: '🥟' },
  { name: 'Ayam Bakar Taliwang', cat: 'Ayam', price: 'Rp 22.000 - 30.000', emoji: '🍗' },
  { name: 'Gado-Gado Siram Lontong', cat: 'Nasi', price: 'Rp 14.000 - 18.000', emoji: '🥗' }
];

export default function FoodRoulette({ onBack }) {
  const [foods, setFoods] = useState(INITIAL_FOODS);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [result, setResult] = useState(null);
  const [isPicking, setIsPicking] = useState(false);
  const [newFoodName, setNewFoodName] = useState('');

  const categories = ['Semua', 'Ayam', 'Nasi', 'Mie & Bakso', 'Pedas / Gurih', 'Hemat Anak Kost'];

  const filteredFoods = selectedCategory === 'Semua'
    ? foods
    : foods.filter(f => f.cat === selectedCategory);

  const pickFood = () => {
    if (filteredFoods.length === 0 || isPicking) return;
    setIsPicking(true);
    setResult(null);

    let counter = 0;
    const interval = setInterval(() => {
      const tempPick = filteredFoods[Math.floor(Math.random() * filteredFoods.length)];
      setResult(tempPick);
      counter++;

      if (counter > 15) {
        clearInterval(interval);
        setIsPicking(false);
        const finalPick = filteredFoods[Math.floor(Math.random() * filteredFoods.length)];
        setResult(finalPick);
        confetti({ particleCount: 60, spread: 70 });
      }
    }, 90);
  };

  const addCustomFood = (e) => {
    e.preventDefault();
    if (!newFoodName.trim()) return;
    setFoods(prev => [
      ...prev,
      {
        name: newFoodName.trim(),
        cat: selectedCategory === 'Semua' ? 'Nasi' : selectedCategory,
        price: 'Sesuai Porsi',
        emoji: '🍽️'
      }
    ]);
    setNewFoodName('');
  };

  return (
    <div className="animate-fade" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <button onClick={onBack} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
          <ChevronLeft size={18} /> Kembali
        </button>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Mau Makan Apa?</h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Rekomendasi & roulette acak makanan harian by fnykids</p>
        </div>
        <div style={{ width: '80px' }} />
      </div>

      {/* Categories */}
      <div className="category-scroll-container" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '20px' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.82rem', padding: '6px 14px', flexShrink: 0 }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Roulette Box */}
      <div
        className="card"
        style={{
          textAlign: 'center',
          padding: '40px 24px',
          background: 'linear-gradient(180deg, #ffffff 0%, var(--yellow-light) 100%)',
          border: '2px solid var(--yellow)',
          marginBottom: '24px'
        }}
      >
        {result ? (
          <div className="animate-pop">
            <div style={{ fontSize: '4.5rem', marginBottom: '8px' }}>{result.emoji}</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Rekomendasi Menu Terpilih:
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '4px', marginBottom: '8px' }}>
              {result.name}
            </h2>
            <div style={{ display: 'inline-flex', gap: '10px', background: 'var(--cream-card)', padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--line)', fontSize: '0.82rem', fontWeight: 600 }}>
              <span>🏷️ {result.cat}</span>
              <span>💰 {result.price}</span>
            </div>
          </div>
        ) : (
          <div>
            <Utensils size={54} color="var(--muted)" style={{ opacity: 0.5, marginBottom: '14px' }} />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '6px' }}>Lapar tapi bingung mau makan apa?</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', maxWidth: '380px', margin: '0 auto' }}>
              Klik tombol di bawah ini dan biarkan roulette yang menentukan santapanmu hari ini!
            </p>
          </div>
        )}

        <div style={{ marginTop: '28px' }}>
          <button
            onClick={pickFood}
            disabled={isPicking || filteredFoods.length === 0}
            className="btn btn-accent"
            style={{ padding: '14px 44px', fontSize: '1.1rem', fontWeight: 800 }}
          >
            <Shuffle size={20} /> {isPicking ? 'Sedang Memilih...' : result ? 'Pilih Menu Lain' : 'Acak Makanan Sekarang!'}
          </button>
        </div>
      </div>

      {/* Custom Food Adder */}
      <div className="card">
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px' }}>Daftar Opsi Makanan ({filteredFoods.length})</h3>
        <form onSubmit={addCustomFood} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Tambah menu favoritmu..."
            value={newFoodName}
            onChange={e => setNewFoodName(e.target.value)}
            className="input-field"
            style={{ fontSize: '0.85rem' }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0 18px' }}>
            <Plus size={18} />
          </button>
        </form>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
          {filteredFoods.map((f, i) => (
            <div
              key={i}
              style={{
                background: 'var(--line-light)',
                padding: '8px 12px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.85rem',
                fontWeight: 600
              }}
            >
              <span>{f.emoji || '🍽️'}</span>
              <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

