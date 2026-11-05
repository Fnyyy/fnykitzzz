import React, { useState } from 'react';
import { ChevronLeft, Users, Shuffle, Copy, Check, Download, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

const SAMPLE_NAMES = `Aditya Pratama
Budi Santoso
Citra Lestari
Dewi Anggraini
Eko Saputra
Fajar Ramadhan
Gita Novita
Hadi Hamar
Indah Permata
Joko Widodo
Kevin Sanjaya
Larasati Putri`;

export default function GroupGenerator({ onBack }) {
  const [inputText, setInputText] = useState(SAMPLE_NAMES);
  const [mode, setMode] = useState('byGroups'); // 'byGroups' or 'byMembers'
  const [targetNumber, setTargetNumber] = useState(3);
  const [groups, setGroups] = useState([]);
  const [copied, setCopied] = useState(false);

  // Parse names
  const getNamesList = () => {
    return inputText
      .split(/[\n,;]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  };

  const generateGroups = () => {
    const list = getNamesList();
    if (list.length === 0) return;

    // Fisher-Yates shuffle
    const shuffled = [...list];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    let numGroups = targetNumber;
    if (mode === 'byMembers') {
      const perGroup = Math.max(1, targetNumber);
      numGroups = Math.ceil(shuffled.length / perGroup);
    }
    numGroups = Math.max(1, Math.min(numGroups, shuffled.length));

    const result = Array.from({ length: numGroups }, () => []);
    shuffled.forEach((name, idx) => {
      result[idx % numGroups].push(name);
    });

    setGroups(result);
    confetti({ particleCount: 45, spread: 60 });
  };

  const getFormattedText = () => {
    if (groups.length === 0) return '';
    return groups
      .map((g, i) => `📌 *Kelompok ${i + 1}* (${g.length} Orang)\n` + g.map((m, mi) => `  ${mi + 1}. ${m}`).join('\n'))
      .join('\n\n') + '\n\n— fnykids 🔒';
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getFormattedText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const namesCount = getNamesList().length;

  return (
    <div className="animate-fade" style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <button onClick={onBack} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
          <ChevronLeft size={18} /> Kembali
        </button>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Generator Kelompok</h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Bagi tim & kelompok secara adil, acak, dan cepat</p>
        </div>
        <div style={{ width: '80px' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>
        {/* Left: Input & Options */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Daftar Nama Anggota</h3>
            <span style={{ fontSize: '0.78rem', background: 'var(--line-light)', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
              {namesCount} Orang
            </span>
          </div>

          <textarea
            rows={8}
            className="input-field"
            placeholder="Ketik atau tempel nama di sini (satu baris per nama)..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            style={{ fontSize: '0.88rem', resize: 'vertical' }}
          />

          {/* Mode Switcher */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Metode Pembagian</label>
            <div className="seg-control" style={{ width: '100%', justifyContent: 'space-around' }}>
              <button
                className={`seg-btn ${mode === 'byGroups' ? 'active' : ''}`}
                onClick={() => setMode('byGroups')}
              >
                Bagi Jadi N Kelompok
              </button>
              <button
                className={`seg-btn ${mode === 'byMembers' ? 'active' : ''}`}
                onClick={() => setMode('byMembers')}
              >
                Maksimal N Orang / Kelompok
              </button>
            </div>
          </div>

          {/* Target Number */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
              {mode === 'byGroups' ? 'Jumlah Kelompok yang Diinginkan' : 'Jumlah Anggota per Kelompok'}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="number"
                min="1"
                max={Math.max(1, namesCount)}
                value={targetNumber}
                onChange={e => setTargetNumber(Math.max(1, parseInt(e.target.value) || 1))}
                className="input-field"
                style={{ width: '100px', textAlign: 'center', fontWeight: 700 }}
              />
              <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                {mode === 'byGroups'
                  ? `~${Math.ceil(namesCount / (targetNumber || 1))} orang per kelompok`
                  : `~${Math.ceil(namesCount / (targetNumber || 1))} total kelompok`}
              </span>
            </div>
          </div>

          <button
            onClick={generateGroups}
            disabled={namesCount === 0}
            className="btn btn-accent"
            style={{ padding: '12px', fontSize: '0.95rem', fontWeight: 700 }}
          >
            <Shuffle size={18} /> Acak & Buat Kelompok
          </button>
        </div>

        {/* Right: Output Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Hasil Pembagian ({groups.length} Kelompok)</h3>
            {groups.length > 0 && (
              <button
                onClick={copyToClipboard}
                className="btn btn-primary"
                style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              >
                {copied ? <><Check size={14} /> Tersalin ke WhatsApp!</> : <><Copy size={14} /> Salin Format WA</>}
              </button>
            )}
          </div>

          {groups.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
              <Users size={38} style={{ opacity: 0.4, marginBottom: '10px' }} />
              <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Belum ada kelompok yang dibuat</p>
              <p style={{ fontSize: '0.78rem', marginTop: '4px' }}>Masukkan daftar nama dan klik tombol Acak untuk memulai.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
              {groups.map((group, idx) => (
                <div
                  key={idx}
                  className="card animate-pop"
                  style={{
                    padding: '16px',
                    borderTop: `4px solid ${['#f4df86', '#e5ddf5', '#dcece1', '#f4dcdc', '#dfebf5', '#fad4c0'][idx % 6]}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>Kelompok {idx + 1}</span>
                    <span style={{ fontSize: '0.72rem', background: 'var(--line-light)', padding: '2px 6px', borderRadius: '10px', fontWeight: 600 }}>
                      {group.length} orang
                    </span>
                  </div>
                  <ol style={{ paddingLeft: '18px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {group.map((member, mi) => (
                      <li key={mi} style={{ fontWeight: 500 }}>
                        {member}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

