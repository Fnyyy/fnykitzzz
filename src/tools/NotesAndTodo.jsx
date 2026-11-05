import React, { useState, useEffect } from 'react';
import { ChevronLeft, CheckSquare, Square, Trash2, Plus, FileText, Check, Copy } from 'lucide-react';

export default function NotesAndTodo({ onBack }) {
  const [tab, setTab] = useState('todo'); // 'todo' or 'notes'

  // Todo state
  const [todos, setTodos] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fny_todos') || localStorage.getItem('hdz_todos') || '[]');
    } catch {
      return [];
    }
  });
  const [todoInput, setTodoInput] = useState('');
  const [todoTag, setTodoTag] = useState('Tugas');
  const [filter, setFilter] = useState('all');

  // Notes state
  const [notes, setNotes] = useState(() => {
    return localStorage.getItem('fny_notes') || localStorage.getItem('hdz_notes') || '';
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    localStorage.setItem('fny_todos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem('fny_notes', notes);
  }, [notes]);

  // Add Todo
  const addTodo = (e) => {
    e.preventDefault();
    if (!todoInput.trim()) return;
    setTodos(prev => [
      { id: Date.now(), text: todoInput.trim(), tag: todoTag, done: false },
      ...prev
    ]);
    setTodoInput('');
  };

  const toggleTodo = (id) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const removeTodo = (id) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  const filteredTodos = todos.filter(t => {
    if (filter === 'active') return !t.done;
    if (filter === 'done') return t.done;
    return true;
  });

  // Notes Stats
  const wordCount = notes.trim() ? notes.trim().split(/\s+/).length : 0;
  const charCount = notes.length;

  const copyNotes = () => {
    navigator.clipboard.writeText(notes);
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
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Tugas & Catatan</h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Tersimpan otomatis di penyimpanan lokal browser Anda</p>
        </div>
        <div style={{ width: '80px' }} />
      </div>

      {/* Segmented Tab */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <div className="seg-control">
          <button
            className={`seg-btn ${tab === 'todo' ? 'active' : ''}`}
            onClick={() => setTab('todo')}
          >
            <CheckSquare size={16} /> Daftar Tugas ({todos.filter(t => !t.done).length})
          </button>
          <button
            className={`seg-btn ${tab === 'notes' ? 'active' : ''}`}
            onClick={() => setTab('notes')}
          >
            <FileText size={16} /> Catatan Cepat (Scratchpad)
          </button>
        </div>
      </div>

      {tab === 'todo' ? (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Add Todo Form */}
          <form onSubmit={addTodo} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Tulis tugas baru..."
              value={todoInput}
              onChange={e => setTodoInput(e.target.value)}
              className="input-field"
              style={{ flex: 1, minWidth: '220px' }}
            />
            <select
              value={todoTag}
              onChange={e => setTodoTag(e.target.value)}
              className="input-field"
              style={{ width: 'auto', padding: '0 12px' }}
            >
              <option value="Tugas">📚 Tugas</option>
              <option value="Kuliah">🎓 Kuliah</option>
              <option value="Proyek">💻 Proyek</option>
              <option value="Pribadi">⭐ Pribadi</option>
            </select>
            <button type="submit" className="btn btn-primary" style={{ padding: '0 18px' }}>
              <Plus size={18} /> Tambah
            </button>
          </form>

          {/* Filter Pills */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['all', 'active', 'done'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                >
                  {f === 'all' ? 'Semua' : f === 'active' ? 'Belum Selesai' : 'Selesai'}
                </button>
              ))}
            </div>
            {todos.length > 0 && (
              <button
                onClick={() => setTodos([])}
                className="btn"
                style={{ fontSize: '0.75rem', color: '#c33', padding: '4px 8px' }}
              >
                Hapus Semua
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '180px' }}>
            {filteredTodos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
                Tidak ada tugas yang terdaftar 🎉
              </div>
            ) : (
              filteredTodos.map(t => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: t.done ? '#f9f9f6' : 'var(--line-light)',
                    opacity: t.done ? 0.6 : 1,
                    transition: 'var(--transition)'
                  }}
                >
                  <div
                    onClick={() => toggleTodo(t.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}
                  >
                    {t.done ? <CheckSquare size={18} color="#16a34a" /> : <Square size={18} color="var(--muted)" />}
                    <span style={{ fontSize: '0.9rem', textDecoration: t.done ? 'line-through' : 'none', fontWeight: 500 }}>
                      {t.text}
                    </span>
                    <span style={{ fontSize: '0.72rem', background: 'var(--cream-card)', padding: '2px 8px', borderRadius: '10px', border: '1px solid var(--line)', fontWeight: 600 }}>
                      {t.tag}
                    </span>
                  </div>
                  <button onClick={() => removeTodo(t.id)} style={{ color: '#aaa', padding: '4px' }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Notes View */
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'flex', gap: '12px' }}>
              <span>{wordCount} kata</span>
              <span>•</span>
              <span>{charCount} karakter</span>
              <span>•</span>
              <span style={{ color: '#16a34a' }}>✓ Tersimpan otomatis</span>
            </div>
            <button onClick={copyNotes} className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '6px 12px' }}>
              {copied ? <><Check size={14} /> Tersalin!</> : <><Copy size={14} /> Salin Catatan</>}
            </button>
          </div>

          <textarea
            rows={14}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Tulis ide, draft, atau catatan kuliah apa saja di sini..."
            className="input-field"
            style={{ fontSize: '0.95rem', lineHeight: 1.6, resize: 'vertical' }}
          />
        </div>
      )}
    </div>
  );
}

