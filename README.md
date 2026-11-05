# fnykids 🔒✨
> Aplikasi tools seru, estetik & produktif untuk foto, kolase, spin wheel, pembagian kelompok, dan utilitas harian. **100% Offline-First & Client-Side**, seluruh data dan gambar diproses langsung di komputer Anda tanpa dikirim ke server manapun.

---

## 🚀 Cara Menjalankan

### Cara Cepat (Windows):
Cukup **klik dua kali** file:
```
start.bat
```
Browser akan otomatis terbuka ke `http://localhost:3000`.

### Cara Manual via Terminal:
```bash
npm run dev
```
Buka browser di alamat: `http://localhost:3000`

---

## 🛠️ Fitur & Tools di fnykids

### 1. 📸 Photobooth Strip
- Mengambil 3 atau 4 foto langsung lewat webcam (atau unggah foto dari komputer).
- Pilihan frame estetik: *Classic Burgundy, Sweetheart Pink, 35mm Film Noir, Blue Ticket, Matcha Garden, Lavender Mist, Clean Cream*.
- Mode vertikal photostrip atau 2x2 grid.
- Countdown timer (3s / 5s), custom judul, subtitle, stiker (✨, ❤️, 🌸, dll), dan tanggal.
- Unduh hasil dalam format PNG resolusi tinggi.

### 2. ✨ Collage Studio
- Pilihan rasio aspek: **1:1 (Square), 4:5 (Instagram Feed), 9:16 (Story/Reels), 3:4 (Portrait), 16:9 (Landscape)**.
- Layout grid fleksibel untuk 1, 2, 3, 4, hingga 6 foto.
- Pengaturan jarak antar foto (gap), sudut membulat (radius), dan batas tepi (padding).
- Pilihan warna background kanvas (pastel & netral).
- Simpan proyek kolase ke koleksi lokal browser dan unduh PNG resolusi tinggi.

### 3. ✂️ Hapus Background (100% Offline)
- Hapus latar belakang foto menggunakan canvas processing langsung di browser.
- **🪄 Tombol Hapus Background Otomatis**: Mendeteksi dan menghapus latar dengan algoritma smart edge sampling.
- **🎯 Mode Klik Hapus (Magic Wand)**: Klik bagian warna latar belakang mana saja untuk menghapusnya seketika.
- **🧹 Kuas Hapus & 🖌️ Kuas Pulihkan**: Kontrol manual dengan slider ukuran kuas.
- **🎨 Ganti Background**: Transparan, Putih, Hitam, atau warna pastel estetik.
- **👁️ Tombol Intip Asli**: Tahan untuk membandingkan hasil dengan foto asli.
- Unduh hasil PNG transparan.

### 4. ⚡ Kompres Gambar
- Konversi antara format **WEBP, JPEG, dan PNG**.
- Slider kualitas kompresi (10% - 100%) & resize resolusi maksimal.
- Live perbandingan ukuran file asli vs hasil kompresi (hemat hingga 80-90%).

### 5. 🎯 Spin Wheel (Roda Putar Keberuntungan)
- Roda acak interaktif dengan deselerasi fisik halus.
- Efek suara putaran (*native Web Audio*) dan selebrasi confetti saat menang.
- Preset siap pakai: *Makan Apa Hari Ini?, Giliran Siapa?, Ya atau Tidak?* + bebas tambah/edit opsi.

### 6. 👥 Generator Kelompok
- Masukkan daftar nama (bisa copy-paste dari WhatsApp / Excel).
- Pilihan metode: Bagi jadi N kelompok atau maksimal N orang per kelompok.
- Algoritma acak adil (Fisher-Yates shuffle).
- Tombol 1-klik salin format rapi ke WhatsApp.

### 7. 🍜 Mau Makan Apa? (Food Roulette)
- Roulette acak menu makanan khas Indonesia saat bingung memilih santapan.
- Kategori lengkap: *Ayam, Nasi, Mie & Bakso, Pedas / Gurih, Hemat Anak Kost*.
- Estimasi harga dan opsi menambah menu kustom.

### 8. 📲 QR Code Studio
- Buat kode QR untuk Tautan Web, Nomor WhatsApp dengan pesan otomatis, Jaringan Wi-Fi, atau Teks biasa.
- Kustomisasi warna QR & warna latar.
- Pindai QR Code langsung dari file gambar.

### 9. 📝 Tugas & Catatan Cepat
- Checklist To-Do harian dengan kategori (Tugas, Kuliah, Proyek, Pribadi).
- Scratchpad catatan bebas dengan hitungan kata & karakter, tersimpan otomatis di localStorage.

### 10. 🎓 Jadwal Kuliah Mingguan
- Jadwal perkuliahan Senin sampai Sabtu.
- Informasi mata kuliah, jam, ruang kelas, dosen pengampu, dan SKS.

### 11. ⚙️ Encoding & Hash Utility
- Base64 Encode / Decode.
- URL Encode / Decode.
- SHA-256 Hash generator (Web Crypto API).
- JSON Prettifier & Validator.

---

## 🔒 Privasi & Keamanan Data
- **Zero Cloud Upload**: Tidak ada gambar, webcam stream, catatan, atau teks yang dikirim ke server luar.
- **Offline Capable**: Dapat berjalan tanpa koneksi internet setelah dependensi terpasang.
- **Penyimpanan Lokal**: Data proyek kolase, jadwal kuliah, catatan, dan to-do list disimpan di browser penyimpanan lokal Anda (`localStorage`).
