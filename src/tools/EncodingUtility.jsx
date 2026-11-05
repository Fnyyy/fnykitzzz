import React, { useState } from 'react';
import { ChevronLeft, Code, Copy, Check, ArrowRightLeft } from 'lucide-react';

export default function EncodingUtility({ onBack }) {
  const [mode, setMode] = useState('base64'); // 'base64', 'url', 'hash', 'json'
  const [inputVal, setInputVal] = useState('Halo Dunia! Selamat datang di fnykids.');
  const [outputVal, setOutputVal] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Process transformations
  const handleTransform = async (action) => {
    setErrorMsg('');
    try {
      if (mode === 'base64') {
        if (action === 'encode') {
          setOutputVal(btoa(unescape(encodeURIComponent(inputVal))));
        } else {
          setOutputVal(decodeURIComponent(escape(atob(inputVal))));
        }
      } else if (mode === 'url') {
        if (action === 'encode') {
          setOutputVal(encodeURIComponent(inputVal));
        } else {
          setOutputVal(decodeURIComponent(inputVal));
        }
      } else if (mode === 'hash') {
        const msgBuffer = new TextEncoder().encode(inputVal);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        setOutputVal(hashHex);
      } else if (mode === 'json') {
        const parsed = JSON.parse(inputVal);
        setOutputVal(JSON.stringify(parsed, null, 2));
      }
    } catch (err) {
      setErrorMsg('Format input tidak valid untuk operasi ini.');
    }
  };

  const copyResult = () => {
    navigator.clipboard.writeText(outputVal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-fade" style={{ maxWidth: '840px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <button onClick={onBack} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
          <ChevronLeft size={18} /> Kembali
        </button>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Encoding & Hash Utility</h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Konversi Base64, URL, SHA-256, dan JSON Formatter</p>
        </div>
        <div style={{ width: '80px' }} />
      </div>

      {/* Mode selection */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <div className="seg-control">
          {[
            { id: 'base64', label: 'Base64' },
            { id: 'url', label: 'URL Encode' },
            { id: 'hash', label: 'SHA-256 Hash' },
            { id: 'json', label: 'JSON Formatter' }
          ].map(m => (
            <button
              key={m.id}
              className={`seg-btn ${mode === m.id ? 'active' : ''}`}
              onClick={() => { setMode(m.id); setOutputVal(''); setErrorMsg(''); }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Input box */}
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Teks Input</label>
          <textarea
            rows={5}
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            className="input-field"
            placeholder="Masukkan teks di sini..."
            style={{ fontFamily: 'monospace', fontSize: '0.88rem' }}
          />
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {mode === 'hash' ? (
            <button onClick={() => handleTransform('hash')} className="btn btn-primary" style={{ flex: 1 }}>
              Generate SHA-256 Hash
            </button>
          ) : mode === 'json' ? (
            <button onClick={() => handleTransform('format')} className="btn btn-primary" style={{ flex: 1 }}>
              Prettify & Format JSON
            </button>
          ) : (
            <>
              <button onClick={() => handleTransform('encode')} className="btn btn-primary" style={{ flex: 1 }}>
                Encode {mode.toUpperCase()}
              </button>
              <button onClick={() => handleTransform('decode')} className="btn btn-secondary" style={{ flex: 1 }}>
                Decode {mode.toUpperCase()}
              </button>
            </>
          )}
        </div>

        {errorMsg && (
          <div style={{ background: '#fdf0f0', color: '#c33', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem' }}>
            {errorMsg}
          </div>
        )}

        {/* Output box */}
        {outputVal && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Hasil Konversi</label>
              <button onClick={copyResult} className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '4px 10px' }}>
                {copied ? <><Check size={14} /> Tersalin!</> : <><Copy size={14} /> Salin Hasil</>}
              </button>
            </div>
            <textarea
              readOnly
              rows={5}
              value={outputVal}
              className="input-field"
              style={{ fontFamily: 'monospace', fontSize: '0.88rem', background: '#f8f8f8' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
