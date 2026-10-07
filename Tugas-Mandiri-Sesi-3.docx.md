**Tugas Mandiri: Aplikasi CRUD**

Bootcamp Web Programming with AI by Plan Indonesia · Sesi 3

# **Latar Belakang**

Di kelas, kamu membangun UI CRUD Dapur Nia dengan data contoh pada Praktik 1, lalu menghubungkannya ke Firestore, memasang *security rules*, dan menayangkannya di Netlify pada Praktik 2\.

Tugas mandiri ini menggabungkan kedua praktik tersebut. Kamu mengulang seluruh alurnya sendiri di rumah, pada aplikasi baru yang kamu pilih.

# **Tugas Peserta**

Pilih **satu** dari tiga aplikasi di bawah. Bangun aplikasinya dari PRD dan skema Firestore yang tersedia sampai tayang di URL publik Netlify.

Ketentuan wajib untuk semua pilihan:

* **CRUD lengkap** (tambah, lihat, ubah, hapus) pada ketiga koleksi.

* **Tiga state** (*loading*, *empty*, dan *error*) pada setiap halaman daftar.

* **Alur status** pada koleksi transaksi berjalan sesuai tabel status di PRD.

* **Security rules** menolak data tidak sah sesuai skema.

* **Tayang di Netlify** dan dapat dibuka lewat URL publik.

# **Pilihan Aplikasi**

| No | Aplikasi | Konteks | Koleksi |
| :---- | :---- | :---- | :---- |
| 1 | **Cuci Kilat** Laundry Kiloan | Cuci Kilat adalah usaha laundry kiloan milik Sari di dekat kampus. Setiap cucian dicatat di nota kertas rangkap dua. | layanan, pelanggan, order |
| 2 | **Gas Rental** Rental Motor | Gas Rental adalah usaha sewa motor harian milik Bayu untuk wisatawan. Jadwal sewa dicatat di grup WhatsApp staf. | motor, penyewa, sewa |
| 3 | **Karsa Tiket** Tiketing Event | Karsa Tiket adalah layanan tiket milik komunitas kreatif yang dikelola Laras. Komunitas rutin mengadakan workshop dan konser kecil. | event, pembeli, tiket |

Ketiga aplikasi memiliki tingkat kesulitan yang setara. Pilih konteks yang paling dekat dengan keseharianmu.

# **Dokumen Masukan**

Unduh dua berkas sesuai aplikasi yang kamu pilih.

| Aplikasi | PRD | Skema Firestore |
| :---- | :---- | :---- |
| Cuci Kilat | [PRD-Cuci-Kilat.docx](https://docs.google.com/document/d/1i_p3XXn5BwyPA_2a1pB51-xsauhuNHWe/edit?usp=drive_link&ouid=117487934105322587482&rtpof=true&sd=true) | [Skema-Firestore-Cuci-Kilat.docx](https://docs.google.com/document/d/1tMfz639csn8yamFvBXZBB07CeeWnVVsY/edit?usp=drive_link&ouid=117487934105322587482&rtpof=true&sd=true) |
| Gas Rental | [PRD-Gas-Rental.docx](https://docs.google.com/document/d/1EcHV_VsKZGhLrJoayNYKQI3gSW4KjpsI/edit?usp=drive_link&ouid=117487934105322587482&rtpof=true&sd=true) | [Skema-Firestore-Gas-Rental.docx](https://docs.google.com/document/d/11nyePpw5D9wkPDcqE98CMfeaMMaAnnE-/edit?usp=drive_link&ouid=117487934105322587482&rtpof=true&sd=true) |
| Karsa Tiket | [PRD-Karsa-Tiket.docx](https://docs.google.com/document/d/19Zrzj-wpdSA2okdc3cbOaZuzm08S8bbO/edit?usp=drive_link&ouid=117487934105322587482&rtpof=true&sd=true) | [Skema-Firestore-Karsa-Tiket.docx](https://docs.google.com/document/d/1KP9i46ra8cGRfPhbawd7UE1tRGaQtCH-/edit?usp=drive_link&ouid=117487934105322587482&rtpof=true&sd=true) |

PRD dan skema menjadi acuan tugas. Jangan menambah koleksi, *field*, atau fitur yang tidak tercantum di kedua dokumen.

# **Dokumen Keluaran**

| No | Keluaran | Bentuk |
| :---- | :---- | :---- |
| 1 | Aplikasi tayang | URL publik Netlify. |
| 2 | Repository | Link GitHub berisi kode aplikasi dan berkas firestore.rules. |

# **Materi dan Keterampilan yang Dipraktikkan**

| Materi | Keterampilan |
| :---- | :---- |
| Membaca PRD dan skema | Menentukan halaman, komponen, dan data dari kebutuhan. |
| Prompt bertahap | Meminta AI membangun aplikasi sedikit demi sedikit dan memeriksa hasilnya. |
| UI CRUD dan tiga *state* | Membangun daftar, formulir, ubah, hapus, serta *loading*, *empty*, dan *error*. |
| Design system dan skill | Menjaga tampilan konsisten di semua halaman. |
| Koneksi Firestore | Mengganti data contoh dengan data dari Firestore. |
| *Security rules* | Menolak *field* kosong, tipe salah, panjang berlebih, dan nilai tidak sah. |
| *Deploy* | Menerbitkan repository ke Netlify dan menguji lewat URL publik. |

# **Langkah Pengerjaan**

Bagian A sama dengan Praktik 1\. Bagian B sama dengan Praktik 2\. Selesaikan Bagian A untuk satu koleksi dulu sampai berjalan, baru lanjut ke koleksi berikutnya.

## **Bagian A · Membangun UI dengan data contoh**

### **Tahap 1: Menyiapkan acuan**

* Baca PRD aplikasi pilihanmu, terutama Bagian 4 (Alur Penggunaan) dan Bagian 5 (Kebutuhan Fungsional).

* Baca skema Firestore dan perhatikan nama koleksi, nama *field*, dan contoh dokumen.

* Tentukan urutan pengerjaan koleksi: master dulu, lalu orang, terakhir transaksi.

### **Tahap 2: Membangun UI**

* Buat proyek baru di Antigravity

* Minta AI membuat navbar dan halaman untuk setiap modul pada PRD.

* Bangun daftar dan formulir tambah untuk koleksi pertama, memakai contoh dokumen dari skema.

* Tambahkan aksi ubah dan hapus dengan dialog konfirmasi.

* Ulangi untuk koleksi kedua dan ketiga. Pada koleksi transaksi, tambahkan tombol ubah status.

* Simpan perubahan (*commit*).

### **Tahap 3: Memasang tiga state**

* Tampilkan *loading state* saat data sedang diambil.

* Tampilkan *empty state* saat daftar belum memiliki data, lengkap dengan tombol tambah.

* Tampilkan *error state* dengan tombol Coba Lagi saat proses gagal.

* Bandingkan UI dengan PRD dan skema, perbaiki yang menyimpang, lalu *commit*.

## **Bagian B · Menghubungkan data dan menayangkan**

### **Tahap 4: Menghubungkan Firestore**

* Buat proyek Firebase baru dan aktifkan Firestore.

* Pasang konfigurasi Firebase di proyek. Jangan menyimpan kunci rahasia layanan di repository.

* Ganti data contoh dengan data dari Firestore, mulai dari *read* dan *create*.

* Hubungkan *update* dan *delete*, lalu periksa setiap perubahan di konsol Firestore.

* Pastikan total transaksi dihitung otomatis dan nilai salinan (nama, harga) ikut tersimpan.

### **Tahap 5: Aturan data**

* Tambahkan validasi formulir sesuai *acceptance criteria* di PRD.

* Tulis *security rules* berdasarkan Bagian 7 skema. Gunakan rules Dapur Nia dari kelas sebagai pola.

* Uji rules dengan enam masukan tidak sah lewat konsol browser, lalu catat di Lembar Uji Mandiri.

* Simpan rules di berkas firestore.rules dan *commit*.

### **Tahap 6: Deploy**

* Hubungkan repository GitHub ke Netlify.

* Buka URL publik dan ulangi tambah, ubah, hapus, dan ubah status.

* Ulangi minimal dua uji tidak sah lewat URL publik.

# **Contoh Prompt Bertahap**

Sesuaikan nama aplikasi, koleksi, dan *field* dengan pilihanmu. Kirim satu prompt, periksa hasilnya, baru lanjut ke prompt berikutnya.

| 1\. Baca PRD-\[Aplikasi\].docx dan Skema-Firestore-\[Aplikasi\].docx.    Buat navbar dan halaman kosong untuk setiap modul di PRD.    Jangan menambah fitur di luar PRD. 2\. Buat halaman daftar dan formulir tambah untuk koleksi \[koleksi pertama\].    Pakai nama field persis seperti skema. Gunakan data contoh dari skema. 3\. Tambahkan tombol ubah dan hapus. Hapus harus memakai dialog konfirmasi. 4\. Pasang loading, empty, dan error state di halaman daftar. 5\. Hubungkan halaman \[koleksi\] ke Firestore. Ganti data contoh dengan    getDocs yang dibatasi limit(20). Simpan data baru dengan addDoc. |
| :---- |

# **Kriteria Selesai**

| No | Kriteria | Cara memeriksa |
| :---- | :---- | :---- |
| 1 | CRUD berjalan di ketiga koleksi | Tambah, ubah, dan hapus satu data per koleksi, lalu cek konsol Firestore. |
| 2 | Nama koleksi dan *field* sesuai skema | Bandingkan dokumen di konsol Firestore dengan contoh dokumen di skema. |
| 3 | Total transaksi benar | Hitung manual satu transaksi dan cocokkan dengan nilai total. |
| 4 | Alur status sesuai PRD | Coba ubah status yang melompat. Hasilnya harus ditolak. |
| 5 | Tiga *state* tampil tepat | Kosongkan satu koleksi untuk *empty state*. Matikan internet untuk *error state*. |
| 6 | Hapus selalu dikonfirmasi | Tekan Hapus lalu Batal. Data harus tetap ada. |
| 7 | *Security rules* menolak data tidak sah | Isi Lembar Uji Mandiri dengan enam masukan tidak sah. |
| 8 | Aplikasi tayang | Buka URL Netlify dari telepon genggam. |

# **Pengumpulan**

* Kumpulkan URL Netlify, link repository GitHub, di LMS.

* Pastikan repository dapat dibuka oleh mentor (publik, atau mentor diundang sebagai kolaborator).

* Sertakan nama aplikasi yang kamu pilih pada pesan pengumpulan.

# **Tips Pengerjaan**

* Kerjakan satu koleksi sampai benar-benar jalan sebelum pindah ke koleksi berikutnya.

* *Commit* setiap selesai satu tahap, supaya mudah kembali bila hasil AI merusak kode.

* Jika AI mengusulkan nama *field* yang berbeda dari skema, tolak dan minta AI mengikuti skema.

* Saat macet, salin pesan galat ke AI dan minta penjelasan dalam bahasa sederhana sebelum meminta perbaikan.

# **Dokumen dan Alat Bantu**

| Jenis | Bahan |
| :---- | :---- |
| Dokumen kebutuhan | PRD aplikasi pilihan |
| Skema data | Skema Firestore aplikasi pilihan |
| Pola dari kelas | PRD, skema, dan rules Dapur Nia |
| Alat kerja | Antigravity, Firebase, Git, GitHub, dan Netlify |

