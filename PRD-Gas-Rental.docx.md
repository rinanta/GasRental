**PRD: Gas Rental (Rental Motor)**

Product Requirements Document · Tugas Mandiri Sesi 3

# **1\. Ringkasan Eksekutif**

Gas Rental adalah usaha sewa motor harian milik Bayu untuk wisatawan. Jadwal sewa dicatat di grup WhatsApp staf. Satu motor pernah dijanjikan ke dua penyewa pada hari yang sama, staf tidak tahu motor mana yang sedang keluar, total sewa dihitung manual, dan sewa dengan lama nol hari tetap tercatat. Aplikasi dibangun untuk mengelola motor, penyewa, transaksi sewa, ketersediaan, dan pendapatan dalam satu alur data.

Pada tugas mandiri ini, aplikasi dibangun dalam konteks satu peran untuk latihan CRUD. Pemisahan hak pemilik, staf, dan penyewa belum diterapkan.

| Keterangan | Isian |
| :---- | :---- |
| Nama aplikasi | Gas Rental (Rental Motor) |
| Status | Tugas mandiri Sesi 3 |
| Basis data | Cloud Firestore |
| Platform publikasi | Netlify |
| Dokumen pendamping | Skema-Firestore-Gas-Rental.docx |

## **Masalah yang Diselesaikan**

| No | Masalah | Akibat |
| :---- | :---- | :---- |
| 1 | Jadwal sewa tersebar di grup WhatsApp | Satu motor dijanjikan ke dua penyewa. |
| 2 | Ketersediaan motor tidak diketahui | Staf harus mengecek garasi setiap ada pertanyaan. |
| 3 | Total sewa dihitung manual | Tagihan salah dan pendapatan tidak dapat dicocokkan. |
| 4 | Sewa dengan lama nol hari tetap tercatat | Data transaksi tidak sah masuk ke laporan. |

# **2\. Pengguna dan Peran**

Usaha ini memiliki tiga peran. Tugas mandiri menyederhanakan akses menjadi satu peran agar peserta fokus pada CRUD dan aturan data.

| Peran | Kewenangan | Status pada tugas |
| :---- | :---- | :---- |
| Pemilik · Bayu | Seluruh fitur dan dasbor | Digabung ke satu peran latihan |
| Staf · Rina | Mencatat penyewa, membuat sewa, serah terima motor | Digabung ke satu peran latihan |
| Penyewa · Wisatawan | Menyewa dan mengembalikan motor, tidak membuka aplikasi | Tidak memakai aplikasi |

# **3\. Lingkup Produk**

Aplikasi web responsif untuk layar telepon genggam. Pengguna membuka aplikasi melalui peramban dan mengelola data melalui UI CRUD.

## **3.1 Modul**

| Modul | Menu | Tujuan |
| :---- | :---- | :---- |
| Motor | Daftar dan formulir motor | Mengelola unit motor, plat nomor, harga per hari, dan ketersediaan. |
| Penyewa | Daftar, pencarian, dan formulir penyewa | Mengelola nama, nomor WhatsApp, asal kota, dan jenis jaminan. |
| Sewa | Daftar, detail, formulir, dan ubah status | Mencatat sewa, total biaya, dan status serah terima. |
| Dasbor | Ringkasan ketersediaan dan pendapatan | Membaca jumlah motor tersedia, sewa berjalan, dan pendapatan. |

## **3.2 Fitur v1**

| Termasuk | Tidak termasuk |
| :---- | :---- |
| CRUD motor, penyewa, dan sewa; validasi; alur status; penanda ketersediaan; dasbor | Pemesanan daring oleh penyewa; pembayaran daring; pelacakan GPS; denda keterlambatan otomatis |

# **4\. Alur Penggunaan**

Alur ini menggambarkan cara usaha berjalan dengan aplikasi. Setiap langkah menjadi dasar *acceptance criteria* pada Bagian 5\.

1. **Pemilik** mendaftarkan setiap motor: merek dan tipe, plat nomor, harga per hari. Motor baru berstatus tersedia.

2. **Penyewa** datang atau menghubungi lewat WhatsApp. **Staf** mencari penyewa berdasarkan nomor WhatsApp. Bila belum terdaftar, staf menambah data penyewa beserta jenis jaminan yang dititipkan.

3. **Staf** membuat sewa: memilih motor yang tersedia, memilih penyewa, mengisi tanggal mulai dan lama hari. Aplikasi menghitung total secara otomatis. Status awal dipesan.

4. Saat motor diserahkan, **staf** mengubah status menjadi berjalan. Aplikasi menandai motor tidak tersedia.

5. Saat motor dikembalikan, **staf** mengubah status menjadi selesai. Aplikasi menandai motor tersedia kembali.

6. Jika penyewa batal sebelum motor diserahkan, **staf** mengubah status menjadi dibatalkan.

7. **Pemilik** membuka dasbor untuk melihat motor tersedia, sewa yang sedang berjalan, dan pendapatan.

Alur status pada koleksi sewa:

| Status | Arti | Boleh berubah ke |
| :---- | :---- | :---- |
| dipesan | Sewa dicatat, motor belum diserahkan | berjalan atau dibatalkan |
| berjalan | Motor sedang dibawa penyewa | selesai |
| selesai | Motor sudah dikembalikan | Tidak ada |
| dibatalkan | Sewa batal sebelum motor diserahkan | Tidak ada |

Data baru selalu dimulai dari dipesan. Status tidak boleh melompat atau mundur.

# **5\. Kebutuhan Fungsional**

Nama koleksi dan *field* pada bagian ini mengikuti Skema-Firestore-Gas-Rental. Setiap *acceptance criteria* menjadi bahan uji pada tahap pengujian.

## **5.1 Modul Motor**

Pengguna melihat daftar motor beserta plat nomor, harga per hari, dan status tersedia.

**User story:** Sebagai pemilik, saya ingin menambah, melihat, mengubah, dan menghapus data motor, sehingga armada yang disewakan selalu tercatat.

### **Komponen UI**

| Komponen | Fungsi |
| :---- | :---- |
| Kartu motor | Menampilkan unit beserta label Tersedia atau Disewa |
| Formulir | Menambah dan mengubah motor |
| Checkbox | Menandai motor tersedia |
| Dialog konfirmasi | Memastikan sebelum menghapus |

### **Operasi Firestore · koleksi motor**

| Operasi | Perintah |
| :---- | :---- |
| Create | addDoc(collection(db, "motor"), {...}) |
| Read | getDocs(query(collection(db, "motor"), orderBy("merek\_tipe"), limit(20))) |
| Update | updateDoc(doc(db, "motor", id), {...}) |
| Delete | deleteDoc(doc(db, "motor", id)) |

### **Acceptance criteria**

| No | Acceptance criteria |
| :---- | :---- |
| 1 | Given merek dan tipe, plat nomor, dan harga per hari terisi dengan sah, When pengguna menekan Simpan Motor, Then satu dokumen motor tersimpan dengan tersedia bernilai true. |
| 2 | Given belum ada motor, When daftar dibuka, Then aplikasi menampilkan *empty state* "Belum ada motor" dengan tombol Tambah Motor. |
| 3 | Given motor sedang disewa, When daftar dibuka, Then motor tampil dengan label Disewa dan tidak bisa dipilih di formulir sewa. |
| 4 | Given pengguna menekan Hapus, When dialog konfirmasi muncul dan pengguna memilih Batal, Then motor tidak terhapus. |
| 5 | Given harga negatif atau plat nomor kosong, When data dikirim, Then permintaan ditolak dan data tidak berubah. |

## **5.2 Modul Penyewa**

Pengguna melihat dan mencari data penyewa berdasarkan nama atau nomor WhatsApp.

**User story:** Sebagai staf, saya ingin mengelola data penyewa, sehingga setiap sewa terhubung dengan orang dan jaminan yang jelas.

### **Komponen UI**

| Komponen | Fungsi |
| :---- | :---- |
| Kolom cari | Menyaring daftar berdasarkan nama atau nomor |
| Tabel atau daftar | Menampilkan penyewa |
| Formulir dengan select | Mengisi data dan memilih jenis jaminan |
| Dialog konfirmasi | Memastikan sebelum menghapus |

### **Operasi Firestore · koleksi penyewa**

| Operasi | Perintah |
| :---- | :---- |
| Create | getDoc lalu setDoc(doc(db, "penyewa", noWhatsapp), {...}) |
| Read | getDocs(query(collection(db, "penyewa"), orderBy("nama"), limit(20))) |
| Update | updateDoc(doc(db, "penyewa", noWhatsapp), {...}) |
| Delete | deleteDoc(doc(db, "penyewa", noWhatsapp)) |

### **Acceptance criteria**

| No | Acceptance criteria |
| :---- | :---- |
| 1 | Given nama, nomor WhatsApp, asal kota, dan jenis jaminan terisi, When pengguna menekan Simpan Penyewa, Then data penyewa tersimpan. |
| 2 | Given nomor WhatsApp sudah terdaftar, When data baru dikirim, Then aplikasi menampilkan pesan "Nomor WhatsApp sudah terdaftar" dan data lama tidak tertimpa. |
| 3 | Given jenis jaminan di luar KTP, SIM, atau Paspor, When data dikirim, Then permintaan ditolak. |
| 4 | Given pengguna mengetik sebagian nama di kolom cari, When daftar diperbarui, Then hanya penyewa yang cocok yang tampil. |
| 5 | Given pengguna menekan Hapus, When konfirmasi disetujui, Then penyewa hilang dari daftar. |

## **5.3 Modul Sewa**

Pengguna mencatat sewa berdasarkan motor, penyewa, tanggal mulai, dan lama hari, lalu memperbarui status sampai motor kembali.

**User story:** Sebagai staf, saya ingin mencatat dan memperbarui sewa, sehingga setiap motor diketahui posisinya dan tidak disewakan ganda.

### **Komponen UI**

| Komponen | Fungsi |
| :---- | :---- |
| Tabs | Menyaring sewa per status |
| Daftar atau kartu | Menampilkan sewa terbaru |
| Formulir dengan select dan pemilih tanggal | Memilih motor dan penyewa, mengisi tanggal dan lama hari |
| Tombol ubah status | Mencatat serah terima dan pengembalian |
| Dialog konfirmasi | Memastikan sebelum membatalkan |

### **Operasi Firestore · koleksi sewa**

| Operasi | Perintah |
| :---- | :---- |
| Create | addDoc(collection(db, "sewa"), {...}) |
| Read | getDocs(query(collection(db, "sewa"), orderBy("dibuat\_pada", "desc"), limit(20))) |
| Update | updateDoc(doc(db, "sewa", id), { status }) dan updateDoc(doc(db, "motor", motorId), { tersedia }) |
| Delete | deleteDoc(doc(db, "sewa", id)) |

### **Acceptance criteria**

| No | Acceptance criteria |
| :---- | :---- |
| 1 | Given motor tersedia, penyewa, tanggal mulai, dan lama hari sah, When sewa disimpan, Then total sama dengan harga per hari dikali lama hari dan status awal dipesan. |
| 2 | Given lama hari 0 atau lebih dari 30, When sewa dikirim, Then permintaan ditolak. |
| 3 | Given motor bertanda tidak tersedia, When sewa baru dikirim untuk motor itu, Then permintaan ditolak. |
| 4 | Given status diubah menjadi berjalan, When perubahan tersimpan, Then motor bertanda tidak tersedia. Given status diubah menjadi selesai atau dibatalkan, Then motor tersedia kembali. |
| 5 | Given sewa berstatus dipesan, When status diubah, Then status hanya boleh menjadi berjalan atau dibatalkan, tidak bisa langsung selesai. |

## **5.4 Modul Dasbor**

Pengguna melihat jumlah motor tersedia dan disewa, daftar sewa yang sedang berjalan, dan pendapatan dari sewa berstatus selesai pada tanggal yang dipilih.

**User story:** Sebagai pemilik, saya ingin melihat ringkasan armada dan pendapatan, sehingga keputusan menambah motor atau mengubah harga dapat diambil.

### **Komponen UI**

| Komponen | Fungsi |
| :---- | :---- |
| Kartu angka | Menampilkan jumlah tersedia, disewa, dan pendapatan |
| Daftar | Sewa yang sedang berjalan |
| Pemilih tanggal | Menentukan tanggal pendapatan |
| Skeleton | Tampil saat dasbor dimuat |

### **Operasi Firestore · koleksi motor dan sewa**

| Operasi | Perintah |
| :---- | :---- |
| Read | getDocs(query(collection(db, "sewa"), where("status", "==", "berjalan"))) |
| Read | getDocs(query(collection(db, "sewa"), where("tanggal\_mulai", "==", tanggal))) |

### **Acceptance criteria**

| No | Acceptance criteria |
| :---- | :---- |
| 1 | Given ada motor tersedia dan disewa, When dasbor dibuka, Then jumlah masing-masing tampil sesuai data motor. |
| 2 | Given tanggal dipilih, When dasbor dimuat, Then pendapatan dihitung dari sewa berstatus selesai yang dimulai pada tanggal itu. |
| 3 | Given tidak ada sewa berjalan, When dasbor dibuka, Then bagian sewa berjalan menampilkan *empty state*. |
| 4 | Given koneksi terputus, When dasbor gagal dimuat, Then aplikasi menampilkan *error state* dengan tombol Coba Lagi. |

# **6\. Identitas Visual dan Prinsip Antarmuka**

Tampilan mengikuti design system yang dipasang sebagai skill, dengan prioritas keterbacaan pada layar telepon genggam.

| Elemen | Ketentuan |
| :---- | :---- |
| Warna | Gunakan token warna dari design system. Status berhasil, galat, dan label status data harus memiliki pembeda yang jelas. |
| Tipografi | Pilih satu font antarmuka dan fallback sans-serif. |
| Formulir | Letakkan label di atas *field* dan pesan galat di dekat *field*. |
| State | Bedakan *loading*, *empty*, dan *error* pada setiap halaman daftar. |
| Tombol | Gunakan label yang menyebut hasil, misalnya Simpan Sewa atau Hapus Motor. Satu tombol utama per layar. Tombol hapus berwarna bahaya dan selalu dikonfirmasi. |
| Navigasi | Navbar berisi 4 menu sesuai modul: Motor, Penyewa, Sewa, Dasbor. |

# **7\. Kebutuhan Non-Fungsional**

* Aplikasi dapat dibuka melalui peramban pada layar telepon genggam.

* Data tersimpan di Firestore dan dapat dibaca kembali setelah halaman dimuat ulang.

* Daftar selalu dibatasi dengan limit dan tidak memuat seluruh koleksi.

* Pesan galat menjelaskan masalah dan tindakan berikutnya tanpa menampilkan rincian teknis.

* Sesi tugas mandiri memakai satu peran. *Authentication* dan *authorization* antarperan ditunda.

* Kunci rahasia dan kredensial layanan tidak disimpan di repository.

# **8\. Teknologi yang Digunakan**

| Lapisan | Teknologi | Catatan |
| :---- | :---- | :---- |
| Antarmuka | React | Dibangun bertahap melalui Antigravity, sama seperti App 2 Dapur Nia. |
| Tampilan | Design system Sesi 3 | Token warna, huruf, jarak, dan aturan komponen dipasang sebagai skill di .agents/skills/. |
| Basis data | Cloud Firestore | Firebase JavaScript SDK versi modular: addDoc, setDoc, getDoc, getDocs, updateDoc, deleteDoc. |
| Aturan data | Firestore Security Rules | Disimpan pada berkas firestore.rules di repository. |
| Pengelolaan kode | Git dan GitHub | Simpan perubahan (*commit*) setiap selesai satu tahap. |
| Publikasi | Netlify | Repository GitHub diterbitkan menjadi URL publik. |

## **Teknologi per Modul**

| Modul | Koleksi | Komponen utama | Operasi Firestore |
| :---- | :---- | :---- | :---- |
| Motor | motor | Kartu motor, Formulir, Checkbox | Create, Read, Update, Delete |
| Penyewa | penyewa | Kolom cari, Tabel atau daftar, Formulir dengan select | Create, Read, Update, Delete |
| Sewa | sewa | Tabs, Daftar atau kartu, Formulir dengan select dan pemilih tanggal | Create, Read, Update, Delete |
| Dasbor | motor, sewa | Kartu angka, Daftar, Pemilih tanggal | Read |

# **9\. Pengujian**

Peserta menguji setiap *acceptance criteria* melalui UI, konsol Firestore, dan URL publik. Uji tembus mandiri memakai enam masukan tidak sah: *field* kosong, tipe salah, teks terlalu panjang, nilai negatif, nilai di luar batas, dan perubahan status tidak sah. Hasil dicatat bersama jalur pengiriman dan kondisi data akhir.

# **10\. Batas Lingkup Pekerjaan**

| Tidak termasuk v1 | Alasan |
| :---- | :---- |
| Pemesanan daring oleh penyewa | Sewa dicatat oleh staf. |
| Pembayaran daring | Pembayaran tunai atau transfer dicatat di luar aplikasi. |
| Pelacakan GPS motor | Tidak diperlukan untuk latihan CRUD. |
| Denda keterlambatan otomatis | Memerlukan perhitungan waktu pengembalian yang dibahas sebagai pengayaan. |
| Penyimpanan nomor dokumen jaminan | Data pribadi sensitif tidak disimpan pada aplikasi latihan. |

Setelah PRD dipakai, nama koleksi, *field*, alur inti, dan tiga *invariant* tidak diubah tanpa persetujuan mentor.

# **11\. Kamus Istilah**

| Istilah | Arti |
| :---- | :---- |
| CRUD | Operasi membuat, membaca, mengubah, dan menghapus data. |
| Koleksi | Kelompok dokumen Firestore yang berkaitan. |
| Dokumen | Satu unit data di dalam koleksi. |
| *Field* | Nama dan nilai atribut di dalam dokumen. |
| *Acceptance criteria* | Syarat yang harus terpenuhi agar fitur dianggap selesai, ditulis dengan pola Given, When, Then. |
| *Security rules* | Aturan Firestore yang menentukan permintaan yang boleh diterima atau ditolak. |
| *Invariant* | Aturan yang harus tetap benar sebelum dan sesudah operasi. |
| *Loading state* | Tampilan saat aplikasi menunggu proses. |
| *Empty state* | Tampilan saat pembacaan berhasil tetapi belum ada data. |
| *Error state* | Tampilan saat proses gagal atau ditolak. |
| *Deploy* | Proses menerbitkan aplikasi ke URL publik. |

