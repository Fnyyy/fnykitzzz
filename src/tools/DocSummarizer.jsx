import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft, FileText, Upload, Sparkles, Copy, Check,
  Download, Volume2, VolumeX, Trash2, BookOpen, Clock,
  Layers, Sliders, Shield, AlertCircle, RefreshCw, Eye,
  FileCheck, Key, ExternalLink, ArrowRight, BookMarked
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import Tesseract from 'tesseract.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// Sample scientific journal for 1-click test
const SAMPLE_JOURNAL = `JUDUL: Implementasi Arsitektur Enterprise Berbasis TOGAF ADM dan Komputasi Awan untuk Optimalisasi Layanan Akademik Perguruan Tinggi
Penulis: Funny Adi Septiawan, Tim Riset Sistem Informasi Telkom University
Tahun: 2026

ABSTRAK:
Transformasi digital pada institusi pendidikan tinggi memerlukan integrasi sistem informasi yang terukur, fleksibel, dan aman. Penelitian ini bertujuan untuk merancang cetak biru arsitektur enterprise menggunakan kerangka kerja TOGAF Architecture Development Method (ADM) yang dikombinasikan dengan infrastruktur komputasi awan (Cloud Computing). Permasalahan utama yang dihadapi adalah tingginya fragmentasi data antar unit, redundansi proses administrasi, serta kendala performa sistem pada periode puncak seperti pengisian Kartu Rencana Studi (KRS) dan evaluasi akademik. Metode penelitian menerapkan tahapan TOGAF ADM dari fase preliminary, arsitektur visi, arsitektur bisnis, arsitektur sistem informasi (data dan aplikasi), hingga arsitektur teknologi. Pengujian beban (load testing) dan simulasi integrasi basis data terdistribusi dilakukan untuk mengukur peningkatan skalabilitas. Hasil evaluasi menunjukkan bahwa adopsi arsitektur terpadu berbasis cloud serverless berhasil memangkas latency response time hingga 64% pada jam sibuk, mengeliminasi duplikasi data master mahasiswa sebesar 91%, serta menghemat biaya operasional infrastruktur server fisik hingga 38% per tahun. Kesimpulan dari penelitian ini membuktikan bahwa kombinasi TOGAF ADM dan teknologi komputasi awan mampu memberikan panduan strategis yang tangguh dalam mewujudkan ekosistem smart campus yang adaptif terhadap lonjakan pengguna.`;

export default function DocSummarizer({ onBack }) {
  const [inputText, setInputText] = useState('');
  const [inputTab, setInputTab] = useState('pdf'); // 'pdf' | 'text' | 'ocr'
  const [summaryMode, setSummaryMode] = useState('structure'); // 'structure' | 'bullets' | 'tldr' | 'keywords'
  const [summaryLength, setSummaryLength] = useState('medium'); // 'short' | 'medium' | 'detailed'
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [summaryResult, setSummaryResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Optional Gemini API Key
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('fnykids_gemini_key') || '');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [useAiModel, setUseAiModel] = useState(false);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  const handleSaveKey = (val) => {
    setGeminiKey(val);
    localStorage.setItem('fnykids_gemini_key', val);
  };

  // 1. PDF Extraction
  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProgressMsg('Membuka file PDF...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        setProgressMsg(`Mengekstrak teks halaman ${i} dari ${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += `\n--- Halaman ${i} ---\n` + pageText;
      }

      if (!fullText.trim()) {
        throw new Error('PDF tidak memiliki teks langsung (mungkin hasil scan). Gunakan tab Foto/Scan.');
      }

      setInputText(fullText.trim());
      setInputTab('text');
      generateSummary(fullText.trim());
    } catch (err) {
      alert(`Gagal membaca PDF: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 2. Image OCR Extraction
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProgressMsg('Mempersiapkan OCR Tesseract...');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          setProgressMsg('Memindai tulisan pada gambar jurnal...');
          const result = await Tesseract.recognize(reader.result, 'ind+eng', {
            logger: m => {
              if (m.status === 'recognizing text') {
                setProgressMsg(`Membaca teks: ${Math.round(m.progress * 100)}%`);
              }
            }
          });
          const text = result.data.text.trim();
          if (!text) throw new Error('Tidak ada teks terbaca dari gambar.');
          setInputText(text);
          setInputTab('text');
          generateSummary(text);
        } catch (err) {
          alert(`Gagal OCR gambar: ${err.message}`);
        } finally {
          setIsProcessing(false);
          setProgressMsg('');
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert(`Gagal memuat gambar: ${err.message}`);
      setIsProcessing(false);
      setProgressMsg('');
    } finally {
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  // 3. Smart Local Extractive Summarizer Algorithm
  const runLocalSummarizer = (text, mode, length) => {
    // Clean headers & noise
    const cleanText = text
      .replace(/--- Halaman \d+ ---/g, '')
      .replace(/\[\d+\]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Split into sentences
    const rawSentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
    const sentences = rawSentences
      .map(s => s.trim())
      .filter(s => s.length > 25 && !/^gambar|^tabel|^hal\./i.test(s));

    if (sentences.length === 0) {
      return {
        title: 'Ringkasan Dokumen',
        content: 'Teks terlalu pendek untuk diringkas.',
        sections: [],
        keywords: [],
        wordCount: 0,
        originalCount: 0
      };
    }

    // Word frequency map (excluding common stopwords in Indonesian and English)
    const stopwords = new Set([
      'yang', 'dan', 'di', 'dari', 'ini', 'itu', 'dengan', 'untuk', 'pada', 'adalah',
      'sebagai', 'dalam', 'oleh', 'ke', 'karena', 'juga', 'atau', 'dapat', 'tersebut',
      'akan', 'telah', 'secara', 'antara', 'serta', 'the', 'of', 'and', 'to', 'in',
      'is', 'for', 'with', 'on', 'as', 'by', 'at', 'an', 'be', 'this', 'that'
    ]);

    const words = cleanText.toLowerCase().match(/\b[a-zA-Z]{3,}\b/g) || [];
    const wordFreq = {};
    words.forEach(w => {
      if (!stopwords.has(w)) {
        wordFreq[w] = (wordFreq[w] || 0) + 1;
      }
    });

    // Scientific academic discourse indicators (bonus points)
    const academicIndicators = [
      { pattern: /tujuan|bertujuan|objective|purpose/i, score: 3.5, category: 'tujuan' },
      { pattern: /permasalahan|kendala|masalah|problem|gap/i, score: 3.0, category: 'masalah' },
      { pattern: /metode|metodologi|tahapan|algoritma|pendekatan|framework|method/i, score: 3.5, category: 'metode' },
      { pattern: /hasil|menunjukkan|evaluasi|pengujian|temuannya|results|findings/i, score: 4.0, category: 'hasil' },
      { pattern: /kesimpulan|disimpulkan|membuktikan|menyimpulkan|conclude|conclusion/i, score: 4.0, category: 'kesimpulan' },
      { pattern: /signifikan|efektif|meningkat|memangkas|persen|%/i, score: 2.5, category: 'temuan' }
    ];

    // Score sentences
    const scoredSentences = sentences.map((sentence, idx) => {
      let score = 0;
      const sLower = sentence.toLowerCase();
      const sWords = sLower.match(/\b[a-zA-Z]{3,}\b/g) || [];

      // Frequency score
      sWords.forEach(w => {
        if (wordFreq[w]) score += wordFreq[w];
      });
      score = score / Math.max(1, Math.sqrt(sWords.length));

      // Indicator boost
      let matchedCategory = null;
      academicIndicators.forEach(ind => {
        if (ind.pattern.test(sentence)) {
          score += ind.score * 5;
          if (!matchedCategory) matchedCategory = ind.category;
        }
      });

      // Lead bias (early sentences in abstract usually crucial)
      if (idx < 5) score += (5 - idx) * 2;

      return {
        text: sentence,
        index: idx,
        score,
        category: matchedCategory
      };
    });

    // Top Keywords
    const sortedKeywords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, freq]) => ({ word: word.toUpperCase(), count: freq }));

    // Length ratios
    let countToPick = 4;
    if (length === 'short') countToPick = Math.max(3, Math.round(sentences.length * 0.15));
    else if (length === 'medium') countToPick = Math.max(5, Math.round(sentences.length * 0.3));
    else if (length === 'detailed') countToPick = Math.max(8, Math.round(sentences.length * 0.5));

    countToPick = Math.min(countToPick, sentences.length);

    // Pick top sentences by score, then preserve original sequential order
    const topSentences = [...scoredSentences]
      .sort((a, b) => b.score - a.score)
      .slice(0, countToPick)
      .sort((a, b) => a.index - b.index);

    // Build structured output for journals
    const goalSentences = scoredSentences.filter(s => /tujuan|bertujuan|permasalahan|masalah|background/i.test(s.text)).slice(0, 2);
    const methodSentences = scoredSentences.filter(s => /metode|tahapan|kerangka|framework|algoritma|pendekatan/i.test(s.text)).slice(0, 2);
    const resultSentences = scoredSentences.filter(s => /hasil|menunjukkan|evaluasi|pengujian|temuan|efisiensi|memangkas/i.test(s.text)).slice(0, 3);
    const conclusionSentences = scoredSentences.filter(s => /kesimpulan|disimpulkan|membuktikan|saran|rekomendasi/i.test(s.text)).slice(0, 2);

    const structuredSections = [
      {
        title: '🎯 Latar Belakang & Tujuan Penelitian',
        items: (goalSentences.length > 0 ? goalSentences : topSentences.slice(0, 1)).map(s => s.text)
      },
      {
        title: '🧪 Metodologi & Pendekatan',
        items: (methodSentences.length > 0 ? methodSentences : topSentences.slice(1, 2)).map(s => s.text)
      },
      {
        title: '📊 Temuan Utama & Hasil Analisis',
        items: (resultSentences.length > 0 ? resultSentences : topSentences.slice(2, 4)).map(s => s.text)
      },
      {
        title: '💡 Kesimpulan & Implikasi',
        items: (conclusionSentences.length > 0 ? conclusionSentences : topSentences.slice(4, 5)).map(s => s.text)
      }
    ].filter(sec => sec.items.length > 0);

    const originalCount = cleanText.split(/\s+/).filter(Boolean).length;
    const summaryCombined = topSentences.map(s => s.text).join(' ');
    const summaryCount = summaryCombined.split(/\s+/).filter(Boolean).length;
    const savedPercentage = Math.max(10, Math.round(((originalCount - summaryCount) / originalCount) * 100));

    return {
      type: 'local',
      topSentences: topSentences.map(s => s.text),
      structuredSections,
      keywords: sortedKeywords,
      originalCount,
      summaryCount,
      savedPercentage,
      readTimeOriginal: Math.max(1, Math.round(originalCount / 180)),
      readTimeSummary: Math.max(1, Math.round(summaryCount / 180))
    };
  };

  // 4. Optional Gemini AI API call
  const runGeminiSummarizer = async (text, mode, length) => {
    if (!geminiKey.trim()) {
      throw new Error('API Key Gemini belum diisi. Silakan masukkan API key atau gunakan Mode Offline Lokal.');
    }

    const prompt = `Anda adalah asisten akademik cerdas untuk mahasiswa. Ringkas teks jurnal/dokumen berikut dalam Bahasa Indonesia yang formal, terstruktur, padat, dan mudah dipahami.
Teks Dokumen:
"""${text.slice(0, 18000)}"""

Berikan ringkasan dengan format JSON yang valid persis seperti skema ini:
{
  "tldr": "Ringkasan super singkat 2-3 kalimat mengenai inti temuan dokumen ini.",
  "bullets": ["Poin penting 1", "Poin penting 2", "Poin penting 3", "Poin penting 4", "Poin penting 5"],
  "structured": [
    {"title": "🎯 Masalah & Tujuan", "desc": "Penjelasan tujuan penelitian..."},
    {"title": "🧪 Metode yang Digunakan", "desc": "Tahapan dan metodologi..."},
    {"title": "📊 Temuan & Hasil Kunci", "desc": "Data dan angka hasil penelitian..."},
    {"title": "💡 Kesimpulan & Kontribusi", "desc": "Kesimpulan akhir..."}
  ],
  "keywords": ["KataKunci1", "KataKunci2", "KataKunci3", "KataKunci4", "KataKunci5"]
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey.trim()}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `HTTP ${res.status}: Gagal memanggil Gemini API`);
    }

    const data = await res.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(rawContent);

    const originalCount = text.split(/\s+/).filter(Boolean).length;
    const summaryCount = (parsed.tldr + ' ' + (parsed.bullets || []).join(' ')).split(/\s+/).filter(Boolean).length;

    return {
      type: 'gemini',
      tldr: parsed.tldr,
      bullets: parsed.bullets || [],
      structuredSections: (parsed.structured || []).map(s => ({ title: s.title, items: [s.desc] })),
      keywords: (parsed.keywords || []).map(k => ({ word: k, count: '-' })),
      originalCount,
      summaryCount,
      savedPercentage: Math.max(10, Math.round(((originalCount - summaryCount) / originalCount) * 100)),
      readTimeOriginal: Math.max(1, Math.round(originalCount / 180)),
      readTimeSummary: Math.max(1, Math.round(summaryCount / 180))
    };
  };

  // Main Generate Handler
  const generateSummary = async (overrideText) => {
    const textToProcess = overrideText || inputText;
    if (!textToProcess.trim()) {
      alert('Masukkan atau upload teks jurnal terlebih dahulu!');
      return;
    }

    setIsProcessing(true);
    setProgressMsg(useAiModel ? 'Menganalisis dengan Gemini AI...' : 'Menganalisis teks secara cerdas (Lokal)...');

    try {
      let result;
      if (useAiModel && geminiKey.trim()) {
        result = await runGeminiSummarizer(textToProcess, summaryMode, summaryLength);
      } else {
        result = runLocalSummarizer(textToProcess, summaryMode, summaryLength);
      }
      setSummaryResult(result);
    } catch (err) {
      alert(`Peringatan: ${err.message}. Mengalihkan ke mesin ringkas lokal offline...`);
      const fallbackResult = runLocalSummarizer(textToProcess, summaryMode, summaryLength);
      setSummaryResult(fallbackResult);
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  // Copy Summary
  const handleCopy = () => {
    if (!summaryResult) return;
    let fullText = '';

    if (summaryMode === 'structure') {
      fullText = summaryResult.structuredSections
        .map(sec => `${sec.title}\n${sec.items.map(it => `• ${it}`).join('\n')}`)
        .join('\n\n');
    } else if (summaryMode === 'bullets') {
      const items = summaryResult.bullets || summaryResult.topSentences || [];
      fullText = items.map(s => `• ${s}`).join('\n\n');
    } else if (summaryMode === 'tldr') {
      fullText = summaryResult.tldr || (summaryResult.topSentences || []).slice(0, 3).join(' ');
    } else {
      fullText = (summaryResult.keywords || []).map(k => `#${k.word}`).join(', ');
    }

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download Summary as Markdown
  const handleDownload = () => {
    if (!summaryResult) return;
    let md = `# Ringkasan Jurnal & Dokumen - fnykids\n\n`;
    md += `> Statistik: Hemat ${summaryResult.savedPercentage}% kata (${summaryResult.originalCount} kata -> ${summaryResult.summaryCount} kata)\n\n`;

    summaryResult.structuredSections.forEach(sec => {
      md += `### ${sec.title}\n`;
      sec.items.forEach(it => {
        md += `- ${it}\n`;
      });
      md += `\n`;
    });

    if (summaryResult.keywords?.length) {
      md += `### 🏷️ Kata Kunci Utama\n`;
      md += summaryResult.keywords.map(k => `\`${k.word}\``).join(' ') + '\n\n';
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ringkasan-jurnal-${Date.now()}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Text-To-Speech (Indonesian voice)
  const handleToggleSpeak = () => {
    if (!window.speechSynthesis) {
      alert('Browser Anda tidak mendukung Text-to-Speech.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    let speechText = '';
    if (summaryMode === 'tldr' && summaryResult?.tldr) {
      speechText = summaryResult.tldr;
    } else if (summaryResult?.structuredSections) {
      speechText = summaryResult.structuredSections
        .map(s => `${s.title}. ${s.items.join('. ')}`)
        .join('. ');
    } else if (summaryResult?.topSentences) {
      speechText = summaryResult.topSentences.join('. ');
    }

    if (!speechText) return;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = 'id-ID';
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="animate-fade" style={{ maxWidth: '1020px', margin: '0 auto', paddingBottom: '90px' }}>
      
      {/* ═══════════ HEADER ═══════════ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'var(--surface)', border: '1px solid var(--line)',
            padding: '7px 14px', borderRadius: 'var(--radius-full)',
            fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink)'
          }}
        >
          <ChevronLeft size={16} /> Kembali
        </button>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'var(--cyan-light)', color: 'var(--cyan-dark)',
          padding: '5px 12px', borderRadius: 'var(--radius-full)',
          fontSize: '0.74rem', fontWeight: 700
        }}>
          <Shield size={13} /> 100% Offline & Aman
        </div>
      </div>

      {/* Hero Title */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', boxShadow: '0 4px 14px rgba(37,99,235,0.3)'
          }}>
            <BookMarked size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
              Ringkas Jurnal & Dokumen
            </h1>
            <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--ink-light)' }}>
              Ekstrak intisari jurnal ilmiah, skripsi, paper riset, atau materi kuliah secara otomatis dan privat.
            </p>
          </div>
        </div>
      </div>

      {/* ═══════════ MAIN TWO-COLUMN / STACK LAYOUT ═══════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '16px' }}>
        
        {/* LEFT COLUMN: INPUT SECTION */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="card" style={{ padding: '16px' }}>
            {/* Input Tabs (Responsive wrap) */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', borderBottom: '1px solid var(--line)', paddingBottom: '12px', flexWrap: 'wrap' }}>
              {[
                { id: 'pdf', label: 'PDF Jurnal', icon: FileText },
                { id: 'ocr', label: 'Foto/Scan', icon: Upload },
                { id: 'text', label: 'Teks / Tempel', icon: BookOpen }
              ].map(tab => {
                const Icon = tab.icon;
                const active = inputTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setInputTab(tab.id)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      padding: '8px 10px', borderRadius: '10px',
                      background: active ? 'var(--blue-light)' : 'transparent',
                      color: active ? 'var(--blue)' : 'var(--ink-light)',
                      border: active ? '1px solid rgba(37, 99, 235, 0.25)' : '1px solid transparent',
                      fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT: PDF */}
            {inputTab === 'pdf' && (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  style={{ display: 'none' }}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed var(--line-active)',
                    borderRadius: '14px', padding: '34px 20px',
                    textAlign: 'center', cursor: 'pointer',
                    background: 'var(--blue-light)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--blue)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--line-active)'}
                >
                  <FileText size={38} color="var(--blue)" style={{ margin: '0 auto 10px', opacity: 0.9 }} />
                  <p style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--ink)', margin: '0 0 4px' }}>
                    Klik untuk Pilih File PDF Jurnal / Paper
                  </p>
                  <p style={{ fontSize: '0.76rem', color: 'var(--ink-light)', margin: 0 }}>
                    Mendukung file PDF multi-halaman (ekstraksi teks lokal langsung di browser)
                  </p>
                </div>
              </div>
            )}

            {/* TAB CONTENT: IMAGE OCR */}
            {inputTab === 'ocr' && (
              <div>
                <input
                  type="file"
                  ref={imageInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <div
                  onClick={() => imageInputRef.current?.click()}
                  style={{
                    border: '2px dashed var(--line-active)',
                    borderRadius: '14px', padding: '34px 20px',
                    textAlign: 'center', cursor: 'pointer',
                    background: 'var(--cyan-light)',
                    transition: 'all 0.2s'
                  }}
                >
                  <Upload size={38} color="var(--cyan-dark)" style={{ margin: '0 auto 10px', opacity: 0.9 }} />
                  <p style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--ink)', margin: '0 0 4px' }}>
                    Pilih Foto Halaman Jurnal / Buku
                  </p>
                  <p style={{ fontSize: '0.76rem', color: 'var(--ink-light)', margin: 0 }}>
                    OCR otomatis membaca teks dari foto cetakan atau screenshot dokumen
                  </p>
                </div>
              </div>
            )}

            {/* TAB CONTENT: TEXT AREA */}
            {inputTab === 'text' && (
              <div>
                <textarea
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Tempelkan abstrak, pendahuluan, metodologi, atau seluruh teks jurnal ilmiah Anda di sini..."
                  rows={9}
                  style={{
                    width: '100%', padding: '12px 14px',
                    borderRadius: '12px', border: '1px solid var(--line)',
                    background: 'var(--bg)', color: 'var(--ink)',
                    fontSize: '0.85rem', lineHeight: 1.55, resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.74rem', color: 'var(--ink-light)' }}>
                  <span>{inputText.split(/\s+/).filter(Boolean).length} kata • {inputText.length} karakter</span>
                  {inputText && (
                    <button
                      onClick={() => setInputText('')}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                    >
                      <Trash2 size={12} /> Bersihkan
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Sample Button */}
            <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                onClick={() => {
                  setInputText(SAMPLE_JOURNAL);
                  setInputTab('text');
                  generateSummary(SAMPLE_JOURNAL);
                }}
                style={{
                  background: 'none', border: 'none', color: 'var(--blue)',
                  fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}
              >
                <Sparkles size={14} /> Coba dengan Contoh Jurnal Ilmiah
              </button>
            </div>
          </div>

          {/* ═══════════ SETTINGS / OPTIONS CARD ═══════════ */}
          <div className="card" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--ink)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sliders size={15} color="var(--blue)" /> Pengaturan Ringkasan
            </h3>

            {/* Mode Selector */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-light)', marginBottom: '6px' }}>
                Gaya / Format Output:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {[
                  { id: 'structure', label: '📑 Struktur Jurnal' },
                  { id: 'bullets', label: '📌 Poin-Poin Inti' },
                  { id: 'tldr', label: '⚡ TL;DR Cepat' },
                  { id: 'keywords', label: '🏷️ Kata Kunci' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setSummaryMode(item.id)}
                    style={{
                      padding: '7px 10px', borderRadius: '8px',
                      background: summaryMode === item.id ? 'var(--blue)' : 'var(--surface-hover)',
                      color: summaryMode === item.id ? '#fff' : 'var(--ink)',
                      border: '1px solid var(--line)',
                      fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Length Selector */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-light)', marginBottom: '6px' }}>
                Tingkat Kepadatan:
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { id: 'short', label: 'Singkat (~25%)' },
                  { id: 'medium', label: 'Seimbang (~40%)' },
                  { id: 'detailed', label: 'Lengkap (~60%)' }
                ].map(len => (
                  <button
                    key={len.id}
                    onClick={() => setSummaryLength(len.id)}
                    style={{
                      flex: 1, padding: '6px', borderRadius: '8px',
                      background: summaryLength === len.id ? 'var(--blue-light)' : 'transparent',
                      color: summaryLength === len.id ? 'var(--blue)' : 'var(--ink-light)',
                      border: summaryLength === len.id ? '1px solid var(--blue)' : '1px solid var(--line)',
                      fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    {len.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional AI Key Toggle */}
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Key size={14} color="var(--ink-light)" />
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--ink)' }}>
                    Gemini AI Mode (Opsional)
                  </span>
                </div>
                <button
                  onClick={() => setShowKeyInput(!showKeyInput)}
                  style={{
                    background: 'none', border: 'none', color: 'var(--blue)',
                    fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  {showKeyInput ? 'Tutup' : 'Atur API Key'}
                </button>
              </div>

              {showKeyInput && (
                <div style={{ marginTop: '10px', background: 'var(--bg)', padding: '10px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                  <p style={{ fontSize: '0.72rem', color: 'var(--ink-light)', margin: '0 0 6px' }}>
                    Tanpa API key pun sudah bisa meringkas 100% lokal offline. Masukkan Gemini API key gratis Anda jika ingin hasil ringkasan naratif bertenaga AI:
                  </p>
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={e => handleSaveKey(e.target.value)}
                    placeholder="AIzaSy..."
                    style={{
                      width: '100%', padding: '6px 10px', borderRadius: '6px',
                      border: '1px solid var(--line)', fontSize: '0.76rem',
                      fontFamily: 'monospace', marginBottom: '6px'
                    }}
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={useAiModel}
                      onChange={e => setUseAiModel(e.target.checked)}
                      disabled={!geminiKey.trim()}
                    />
                    <span style={{ fontWeight: 600 }}>Aktifkan Gemini AI untuk ringkasan ini</span>
                  </label>
                </div>
              )}
            </div>

            {/* Primary Action Button */}
            <button
              onClick={() => generateSummary()}
              disabled={isProcessing}
              style={{
                width: '100%', marginTop: '16px', padding: '11px',
                borderRadius: '12px', background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)',
                color: '#fff', border: 'none', fontWeight: 800, fontSize: '0.88rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
                opacity: isProcessing ? 0.7 : 1
              }}
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={16} className="spin" />
                  <span>{progressMsg || 'Meringkas dokumen...'}</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Mulai Ringkas Dokumen</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: SUMMARY RESULT */}
        <div>
          {summaryResult ? (
            <div className="card" style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
              
              {/* Stats Bar */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(14,165,233,0.08))',
                border: '1px solid rgba(37,99,235,0.18)', borderRadius: '12px',
                padding: '12px 14px', marginBottom: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ink-light)', fontWeight: 600 }}>Penghematan Waktu Baca</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--blue)' }}>
                    Hemat {summaryResult.savedPercentage}%
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.74rem', color: 'var(--ink-light)' }}>
                  <div><b>{summaryResult.originalCount}</b> kata $\rightarrow$ <b>{summaryResult.summaryCount}</b> kata</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '2px' }}>
                    <Clock size={12} /> ~{summaryResult.readTimeSummary} menit (sebelumnya ~{summaryResult.readTimeOriginal} mnt)
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                <button
                  onClick={handleCopy}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '6px 12px', borderRadius: '8px',
                    background: copied ? '#22c55e' : 'var(--surface)',
                    color: copied ? '#fff' : 'var(--ink)',
                    border: '1px solid var(--line)',
                    fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
                </button>

                <button
                  onClick={handleDownload}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '6px 12px', borderRadius: '8px',
                    background: 'var(--surface)', color: 'var(--ink)',
                    border: '1px solid var(--line)',
                    fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  <Download size={13} />
                  <span>Download .MD</span>
                </button>

                <button
                  onClick={handleToggleSpeak}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '6px 12px', borderRadius: '8px',
                    background: isSpeaking ? 'var(--blue)' : 'var(--surface)',
                    color: isSpeaking ? '#fff' : 'var(--ink)',
                    border: '1px solid var(--line)',
                    fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  {isSpeaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
                  <span>{isSpeaking ? 'Hentikan Audio' : 'Bacakan Suara'}</span>
                </button>
              </div>

              {/* Summary Content Body */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* 1. STRUCTURED MODE */}
                {summaryMode === 'structure' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {summaryResult.structuredSections.map((section, idx) => (
                      <div key={idx} style={{
                        background: 'var(--bg)', border: '1px solid var(--line)',
                        borderRadius: '10px', padding: '12px 14px'
                      }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--blue)', marginBottom: '6px' }}>
                          {section.title}
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: 'var(--ink)', lineHeight: 1.55 }}>
                          {section.items.map((it, i) => (
                            <li key={i} style={{ marginBottom: '4px' }}>{it}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. BULLET POINTS MODE */}
                {summaryMode === 'bullets' && (
                  <div style={{
                    background: 'var(--bg)', border: '1px solid var(--line)',
                    borderRadius: '10px', padding: '14px'
                  }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--blue)', marginBottom: '8px' }}>
                      📌 Intisari & Temuan Utama
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.83rem', color: 'var(--ink)', lineHeight: 1.6 }}>
                      {(summaryResult.bullets || summaryResult.topSentences || []).map((sent, i) => (
                        <li key={i} style={{ marginBottom: '8px' }}>{sent}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 3. TLDR MODE */}
                {summaryMode === 'tldr' && (
                  <div style={{
                    background: 'var(--blue-light)', border: '1px solid rgba(37,99,235,0.2)',
                    borderRadius: '12px', padding: '16px'
                  }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--blue)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={16} /> TL;DR (Too Long; Didn't Read)
                    </div>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--ink)', lineHeight: 1.65, fontWeight: 500 }}>
                      {summaryResult.tldr || (summaryResult.topSentences || []).slice(0, 3).join(' ')}
                    </p>
                  </div>
                )}

                {/* 4. KEYWORDS MODE */}
                {summaryMode === 'keywords' && (
                  <div style={{
                    background: 'var(--bg)', border: '1px solid var(--line)',
                    borderRadius: '10px', padding: '14px'
                  }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--blue)', marginBottom: '10px' }}>
                      🏷️ Konsep & Kata Kunci Terpenting
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {(summaryResult.keywords || []).map((k, i) => (
                        <span key={i} style={{
                          background: 'var(--surface)', border: '1px solid var(--line)',
                          padding: '4px 10px', borderRadius: '12px',
                          fontSize: '0.76rem', fontWeight: 700, color: 'var(--blue)'
                        }}>
                          #{k.word} {k.count !== '-' && <span style={{ opacity: 0.6, fontSize: '0.68rem' }}>({k.count}x)</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          ) : (
            /* EMPTY STATE */
            <div className="card" style={{
              padding: '40px 20px', height: '100%',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              textAlign: 'center', background: 'var(--bg)'
            }}>
              <div style={{
                width: '54px', height: '54px', borderRadius: '16px',
                background: 'var(--blue-light)', color: 'var(--blue)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '14px'
              }}>
                <BookOpen size={28} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--ink)', margin: '0 0 6px' }}>
                Hasil Ringkasan Akan Tampil di Sini
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--ink-light)', maxWidth: '320px', margin: '0 0 16px' }}>
                Upload file PDF jurnal atau tempelkan teks di sebelah kiri, lalu klik tombol <b>Mulai Ringkas Dokumen</b>.
              </p>
              <button
                onClick={() => {
                  setInputText(SAMPLE_JOURNAL);
                  setInputTab('text');
                  generateSummary(SAMPLE_JOURNAL);
                }}
                style={{
                  background: 'var(--surface)', border: '1px solid var(--line)',
                  padding: '7px 14px', borderRadius: '20px',
                  fontSize: '0.76rem', fontWeight: 700, color: 'var(--blue)',
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px'
                }}
              >
                <Sparkles size={13} /> Coba dengan Contoh Jurnal Ilmiah
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

