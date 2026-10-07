# 🛵 Gas Rental - Aplikasi Rental Motor Harian

Aplikasi CRUD Web untuk pengelolaan rental motor harian milik Bayu (**Gas Rental**), dibangun untuk memenuhi **Tugas Mandiri Sesi 3 - Bootcamp Web Programming with AI by Plan Indonesia**.

---

## 🚀 Fitur Utama

1. **Modul Motor (Master Data):**
   - Melihat daftar armada motor beserta plat nomor, harga per hari, dan status ketersediaan (*Tersedia* / *Disewa*).
   - Menambah & mengubah unit motor.
   - Menghapus motor dengan modal konfirmasi.
   - 3-State UI (*Loading*, *Empty*, *Error*).

2. **Modul Penyewa (Orang):**
   - Melihat dan mencari penyewa berdasarkan nama atau nomor WhatsApp secara *real-time*.
   - Menambah & mengubah data penyewa (nama, nomor WhatsApp, kota asal, jaminan: KTP / SIM / Paspor).
   - Pencegahan nomor WhatsApp duplikat (menggunakan nomor WhatsApp sebagai ID dokumen).
   - Menghapus penyewa dengan modal konfirmasi & 3-state UI.

3. **Modul Sewa (Transaksi):**
   - Membuat sewa baru: memilih motor yang sedang tersedia, memilih penyewa, menentukan tanggal mulai dan lama hari (1–30 hari).
   - Perhitungan total otomatis ($harga\_per\_hari \times lama\_hari$) dan pencatatan *snapshot* nama motor, plat nomor, nama penyewa, dan harga sewa.
   - Filter tab status: *Semua*, *Dipesan*, *Berjalan*, *Selesai*, *Dibatalkan*.
   - Alur status terkontrol:
     - `dipesan` $\rightarrow$ `berjalan` *(motor otomatis ditandai tidak tersedia)* atau `dibatalkan`.
     - `berjalan` $\rightarrow$ `selesai` *(motor otomatis ditandai tersedia kembali)*.
     - Penolakan lompatan status yang tidak sah (misal langsung ke selesai).

4. **Modul Dasbor:**
   - Kartu metrik: Jumlah motor tersedia, jumlah motor disewa, dan total pendapatan sewa yang berstatus `selesai` pada tanggal terpilih.
   - Daftar sewa yang sedang aktif berjalan di jalanan.

---

## 🛠️ Struktur File Proyek

```
4_TugasMandiri/
├── index.html                  # Antarmuka utama aplikasi
├── style.css                   # Sistem desain visual, glassmorphism, responsive mobile
├── app.js                      # Logika aplikasi, state management, alur status, CRUD
├── firebase-config.js          # Inisialisasi Firebase v10 SDK & Mock data fallback
├── firestore.rules             # Aturan Firestore Security Rules
├── README.md                   # Dokumentasi & Lembar Uji Mandiri
└── Tugas-Mandiri-Sesi-3.docx.md# Panduan tugas mandiri
```

---

## 📋 Lembar Uji Mandiri (6 Skenario Data Tidak Sah)

Sesuai kriteria di PRD Bagian 9 dan Skema Bagian 7:

| No | Skenario Uji | Masukan Tidak Sah | Hasil yang Diharapkan | Status |
| :--- | :--- | :--- | :--- | :---: |
| 1 | **Harga motor negatif** | Koleksi `motor`: `harga_per_hari: -50000` | Ditolak oleh formulir & *Security Rules* | ✅ Lolos |
| 2 | **Plat nomor kosong / tidak sesuai** | Koleksi `motor`: `plat_nomor: ""` | Ditolak karena panjang karakter $< 3$ | ✅ Lolos |
| 3 | **Nomor WhatsApp tidak diawali 08** | Koleksi `penyewa`: `no_whatsapp: "0712345678"` | Ditolak oleh regex validasi & rules | ✅ Lolos |
| 4 | **Jenis jaminan di luar pilihan sah** | Koleksi `penyewa`: `jenis_jaminan: "Kartu Pelajar"` | Ditolak (hanya boleh KTP, SIM, Paspor) | ✅ Lolos |
| 5 | **Lama hari sewa nol / di luar batas** | Koleksi `sewa`: `lama_hari: 0` atau `lama_hari: 40` | Ditolak (harus bulat 1 sampai 30 hari) | ✅ Lolos |
| 6 | **Lompat status tidak sah** | Mengubah status langsung dari `dipesan` ke `selesai` | Ditolak oleh alur aplikasi & *Security Rules* | ✅ Lolos |

---

## 🌐 Cara Menjalankan & Menghubungkan Firebase

1. Buka file `index.html` langsung di peramban, atau jalankan dengan ekstensi *Live Server*.
2. Secara bawaan, aplikasi berjalan dengan **Mock Data Lokal** lengkap sehingga semua alur dapat langsung dicoba tanpa konfigurasi awal.
3. Untuk menghubungkan ke **Firebase Cloud Firestore**:
   - Buka Firebase Console, salin konfigurasi web app (`firebaseConfig`).
   - Klik badge status di kanan atas aplikasi ("Mock Data (Lokal)") dan tempel konfigurasi JSON Anda.
   - Salin isi `firestore.rules` ke tab **Rules** di Firebase Firestore Console.

---

## 📦 Publikasi ke Netlify

1. Simpan dan push repository ke GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: complete gas rental app with CRUD and firestore rules"
   git branch -M main
   git remote add origin https://github.com/<username>/<nama-repo>.git
   git push -u origin main
   ```
2. Buka dashboard Netlify $\rightarrow$ **Add new site** $\rightarrow$ **Import an existing project** dari GitHub.
3. Karena proyek ini murni HTML/CSS/JS statis, biarkan *Build command* dan *Publish directory* kosong (default root).
4. Klik **Deploy Site** dan salin URL publik Netlify untuk dikumpulkan.
