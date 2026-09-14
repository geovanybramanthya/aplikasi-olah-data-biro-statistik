# BEM UNDIP Survey Analytics & Visualization Platform

> **Biro Statistika BEM Universitas Diponegoro 2026**  
> Platform Otomatisasi Olah Data Survei & Visualisasi Eksekutif (McKinsey / Datawrapper Standard)

---

## 🌐 Akses Aplikasi
- **Akses Jaringan Lokal (Satu Wi-Fi/Hotspot)**: `http://172.20.10.6:4173/`
- **Akses Publik Internet**: `https://bem-undip-stat.loca.lt` (Password: `104.28.219.241`)
- **Repositori GitHub**: `https://github.com/geovanybramanthya-bot/bem-undip-stat-app`

---

## 🌟 Executive Summary

Platform aplikasi web analitik dan visualisasi survei otomatis untuk **Biro Statistika BEM Universitas Diponegoro** telah selesai dibangun dan diverifikasi secara menyeluruh.

Aplikasi ini mengotomasi alur kerja rutin pengolahan data survei Google Forms dari format spreadsheet/Excel (`.xlsx`, `.csv`) menjadi rangkaian grafik presentasi berkualitas eksekutif (*McKinsey / Datawrapper aesthetic*) yang siap dipresentasikan di depan perwakilan BEM fakultas se-UNDIP.

---

## 🏛️ Fitur Utama yang Telah Diimplementasikan

### 1. Ingesti Data & Profiling Skema Cerdas
- **Parser RFC 4180 & SheetJS**: Mendukung upload berkas `.xlsx`, `.xls`, dan `.csv` hasil unduhan Google Sheets/Google Forms.
- **Filter Privasi PII Otomatis**: Secara otomatis memindai dan menyaring kolom sensitif seperti `Timestamp`, `Nama Lengkap`, `NIM / NPM`, `Email`, dan `Nomor Telepon` sehingga data privasi mahasiswa terlindungi 100%.
- **Token Repeat Ratio (>3.0)**: Algoritma cerdas yang membedakan jawaban *multi-select checkbox* pilihan ganda berpemisah koma (misal: *"Komunikasi, Koordinasi, Motivasi"*) dari teks bebas/esai.
- **1-Klik Demo Data BEM UNDIP**: Pre-load dataset survei riil untuk demonstrasi instan saat presentasi:
  1. *Survei Upgrading Fungsionaris BEM UNDIP* (134 responden, 27 kolom).
  2. *Survei Persepsi Keamanan & Catcalling Kampus* (197 responden, 15 kolom).

### 2. AI Recommendation & Curation Studio
- **Rekomendasi Chart Publik yang Intuitif**:
  - Pertanyaan Biner / Dikotomi (Ya/Tidak) $\rightarrow$ **Donut Chart** dengan badge persentase.
  - Kategori Banyak / Label Panjang (misal: 12 Fakultas) $\rightarrow$ **Horizontal Bar Chart** (mencegah teks terpotong).
  - Checkbox Pilihan Ganda $\rightarrow$ **Ranked Horizontal Bar Chart** (% terhadap total N responden).
  - Skala Likert (1–4 atau 1–5) $\rightarrow$ **Ordered Likert Frequency Bar Chart** dengan perhitungan *Net Positive Agreement / Top-Box*.
  - Jawaban Kualitatif $\rightarrow$ **Text Feed Viewer**.
- **Aturan Tegas Anti-Chart Membingungkan (`prohibitedRules.ts`)**: Memblokir visualisasi yang sulit dicerna publik umum (seperti radar/spider charts, 3D pie miring, dual-axis spaghetti plots).
- **Tabel Kurasi Interaktif**: Pengguna bebas mengganti tipe chart, menyunting judul/subjudul presentasi, mengubah urutan tampilan, atau mematikan grafik tertentu.
- **Hybrid Insight Engine**: Ringkasan statistik deskriptif berbahasa Indonesia secara offline 100%, ditambah toggle integrasi Google Gemini API untuk ringkasan naratif otomatis jika diinginkan.

### 3. Theming & Visual Craftsmanship Studio
- **Library Tipografi Presentasi**: 6 font berstandar slide (Poppins, Montserrat, Inter, Plus Jakarta Sans, Roboto, Merriweather) dengan 3 skala ukuran (Small, Medium, Large).
- **Palet Warna Institusional**:
  - *UNDIP Navy & Gold* (`#002D62`, `#D4AF37`, `#1B4F72`, `#F1C40F`, `#2C3E50`, `#BDC3C7`)
  - *Modern Emerald* (`#0E6251`, `#1ABC9C`, `#16A085`, `#48C9B0`, `#27AE60`, `#A3E4D7`)
  - *Executive Pastel* (`#6C88C4`, `#F6A6B2`, `#9ED2C6`, `#F8C4B4`, `#BCE29E`, `#E5E0FF`)
  - *Warm Sunset* (`#C0392B`, `#E67E22`, `#F39C12`, `#D35400`, `#E74C3C`, `#FAD7A0`)
- **Custom Palette Builder**: Pembuat palet warna kustom dengan validasi ketat minimal $\ge 5$ kode hex (`#RRGGBB` atau `#RGB`), dilengkapi auto-prefix `#` dan normalisasi uppercase.
- **Dimensi 2D vs 3D**:
  - *2D Modern Flat*: Sudut bar membulat halus (*soft rounded corners*), geometri donut bersih, badge kontras tinggi.
  - *2.5D Isometric 3D Visual*: Gradien prisma berbayang, efek kedalaman terarah, dan pencahayaan estetik.
  - *Override Per-Chart*: Pengaturan 2D/3D bisa berlaku global maupun di-override per-kartu grafik.
- **Watermark Resmi**: Footer resmi *"Biro Statistika BEM Universitas Diponegoro"* terpasang di setiap kartu visualisasi.

### 4. Ekspor Resolusi Tinggi & Batch Packaging
- **Resolusi Kanvas ~300 DPI**: Render grafik ECharts dengan `devicePixelRatio: 3` (resolusi 2400 x 1500 px), sangat tajam saat disalin ke PowerPoint atau Canva tanpa pecah.
- **Anti-Clipping Geometry**: Perhitungan margin kiri dinamis otomatis menyesuaikan panjang nama fakultas di UNDIP agar label tidak terpotong.
- **Ekspor Mandiri & Masal**: Unduh individual PNG atau unduh seluruh grafik sekaligus dalam 1 file `.zip` terstruktur via JSZip, lengkap dengan manifest audit `SURVEY_SUMMARY_AUDIT.txt`.

---

## 📊 Hasil Uji Mutu & Verifikasi Empiris

Semua pengujian telah dieksekusi secara otomatis dan **lulus 100% (603 assertions passed, 0 failures)**:

```
========================================================================= 
   BIRO STATISTIKA BEM UNIVERSITAS DIPONEGORO - E2E TEST RUNNER            
========================================================================= 
  Tier 1: Feature Coverage (F1-F29)    : 145 passed,  0 failed  [PASS]
  Tier 2: Boundary & Corner Cases      : 145 passed,  0 failed  [PASS]
  Tier 3: Cross-Feature Interactions   :  29 passed,  0 failed  [PASS]
  Tier 4: Real-World Workloads         :   5 passed,  0 failed  [PASS]
-------------------------------------------------------------------------
TOTAL E2E TESTS: 324 | PASSED: 324 | FAILED: 0 | DURATION: 3402 ms
-------------------------------------------------------------------------

Unit & Adversarial Verification:
- Milestone 1 (Ingestion & Profiler)     : 24/24 PASSED
- Milestone 2 (Recommender & Curation)   : 36/36 PASSED
- Milestone 3 (Theming & Visual Studio)  : 53/53 PASSED
- Milestone 4 (Export & ZIP Packager)    : 46/46 PASSED
- Challenger M2 (Adversarial Stress)     : 97/97 PASSED
- Challenger M3 (Adversarial Stress)     : 23/23 PASSED
- TypeScript & Vite Production Build     : BUILT CLEAN (7.13s, 0 errors)
```

---

## 🚀 Panduan Menjalankan Aplikasi

1. Buka terminal di:
   ```bash
   cd C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app
   ```
2. Jalankan server preview (siap presentasi):
   ```bash
   npm run preview
   ```
3. Buka browser pada alamat `http://localhost:4173` (tekan `F11` untuk mode layar penuh).
4. Klik tombol **"Muat Demo Upgrading BEM UNDIP"** atau **"Muat Demo Keamanan Kampus"** untuk langsung mendemonstrasikan aplikasi tanpa perlu mencari file Excel.
>>>>>>> c201fdd (feat: BEM UNDIP Survey Analytics Platform with Breathing Room and Full Card Export)
