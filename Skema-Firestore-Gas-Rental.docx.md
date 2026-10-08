**Skema Firestore Gas Rental**

Daftar koleksi dan *field* yang dibuat di Cloud Firestore untuk Gas Rental (Rental Motor) · Tugas Mandiri Sesi 3

# **1\. Gambaran Umum**

Gas Rental memakai tiga koleksi. Nama koleksi dan *field* di dokumen ini dipakai apa adanya. Usulan nama berbeda dari agen AI wajib diperiksa dulu.

| Koleksi | Isi | ID dokumen |
| :---- | :---- | :---- |
| motor | Unit motor, harga per hari, dan ketersediaan | Otomatis |
| penyewa | Nama, nomor WhatsApp, asal kota, dan jenis jaminan | Nomor WhatsApp |
| sewa | Transaksi sewa, total biaya, dan status | Otomatis |

Hubungan antarkoleksi:

| penyewa (1) ──── (banyak) sewa (banyak) ──── (1) motor |
| :---- |

Satu penyewa dapat memiliki banyak sewa. Satu motor dapat muncul di banyak sewa, tetapi hanya satu sewa berjalan pada satu waktu. Satu sewa hanya berisi satu motor.

Dasbor tidak memakai koleksi sendiri. Dasbor dihitung dari koleksi motor dan sewa.

# **2\. Aturan Penulisan**

| Aturan | Contoh |
| :---- | :---- |
| Nama koleksi huruf kecil, bentuk tunggal | motor, penyewa, sewa |
| Nama *field* huruf kecil dengan garis bawah | nama\_penyewa, harga\_per\_hari |
| Uang disimpan sebagai angka bulat rupiah, tanpa titik | 25000, bukan "25.000" |
| Tanggal disimpan sebagai teks | "2026-10-01" |
| Waktu pembuatan diisi oleh server Firestore | serverTimestamp() |
| Nilai status ditulis huruf kecil dengan garis bawah | dipesan |

# **3\. Koleksi motor**

Menyimpan setiap unit motor yang disewakan. ID dokumen dibuat otomatis oleh Firestore.

| Field | Tipe | Wajib | Keterangan |
| :---- | :---- | :---- | :---- |
| merek\_tipe | string | Ya | Merek dan tipe motor, 1 sampai 40 karakter |
| plat\_nomor | string | Ya | Huruf kapital, 3 sampai 12 karakter, contoh DK 1234 AB |
| harga\_per\_hari | number (bulat) | Ya | Harga sewa per hari, minimal 0 |
| tersedia | boolean | Ya | true bisa disewa, false sedang disewa atau perawatan |
| dibuat\_pada | timestamp | Ya | Waktu dokumen dibuat |

## **Contoh dokumen motor/Mt45bRw**

| {   "merek\_tipe": "Honda Vario 125",   "plat\_nomor": "DK 1234 AB",   "harga\_per\_hari": 80000,   "tersedia": true,   "dibuat\_pada": 1 Oktober 2026 08.00 } |
| :---- |

# **4\. Koleksi penyewa**

Menyimpan data penyewa. ID dokumen memakai nomor WhatsApp, sehingga satu nomor hanya dapat dipakai satu penyewa.

| Field | Tipe | Wajib | Keterangan |
| :---- | :---- | :---- | :---- |
| nama | string | Ya | Nama penyewa, 1 sampai 60 karakter |
| no\_whatsapp | string | Ya | Sama dengan ID dokumen. Diawali 08, total 10 sampai 13 angka |
| asal\_kota | string | Ya | Kota asal penyewa, 1 sampai 40 karakter |
| jenis\_jaminan | string | Ya | Hanya KTP, SIM, atau Paspor |
| dibuat\_pada | timestamp | Ya | Waktu dokumen dibuat |

## **Contoh dokumen penyewa/085712345678**

| {   "nama": "Putri Lestari",   "no\_whatsapp": "085712345678",   "asal\_kota": "Surabaya",   "jenis\_jaminan": "KTP",   "dibuat\_pada": 1 Oktober 2026 08.20 } |
| :---- |

Hanya jenis jaminan yang dicatat. Nomor KTP, SIM, atau paspor tidak disimpan di aplikasi.

Sebelum menyimpan penyewa baru, periksa dokumen dengan getDoc. Jika sudah ada, tampilkan "Nomor WhatsApp sudah terdaftar".

# **5\. Koleksi sewa**

Menyimpan setiap transaksi sewa. ID dokumen dibuat otomatis. Satu sewa berisi satu motor.

| Field | Tipe | Wajib | Keterangan |
| :---- | :---- | :---- | :---- |
| motor\_id | string | Ya | ID dokumen motor |
| nama\_motor | string | Ya | Salinan merek dan tipe saat sewa dibuat |
| plat\_nomor | string | Ya | Salinan plat nomor saat sewa dibuat |
| penyewa\_id | string | Ya | ID dokumen penyewa (nomor WhatsApp) |
| nama\_penyewa | string | Ya | Salinan nama penyewa saat sewa dibuat |
| harga\_per\_hari | number (bulat) | Ya | Salinan harga motor saat sewa dibuat |
| tanggal\_mulai | string | Ya | Tanggal motor diambil, format YYYY-MM-DD |
| lama\_hari | number (bulat) | Ya | 1 sampai 30 hari |
| total | number (bulat) | Ya | harga\_per\_hari × lama\_hari |
| status | string | Ya | Salah satu nilai pada tabel status |
| dibuat\_pada | timestamp | Ya | Waktu dokumen dibuat |

## **Nilai field status**

| Nilai | Arti | Boleh berubah ke |
| :---- | :---- | :---- |
| dipesan | Sewa dicatat, motor belum diserahkan | berjalan atau dibatalkan |
| berjalan | Motor sedang dibawa penyewa | selesai |
| selesai | Motor sudah dikembalikan | Tidak ada |
| dibatalkan | Sewa batal sebelum motor diserahkan | Tidak ada |

Data baru selalu dimulai dari dipesan. Status tidak boleh melompat atau mundur.

## **Contoh dokumen sewa/Sw19cTn**

| {   "motor\_id": "Mt45bRw",   "nama\_motor": "Honda Vario 125",   "plat\_nomor": "DK 1234 AB",   "penyewa\_id": "085712345678",   "nama\_penyewa": "Putri Lestari",   "harga\_per\_hari": 80000,   "tanggal\_mulai": "2026-10-02",   "lama\_hari": 3,   "total": 240000,   "status": "dipesan",   "dibuat\_pada": 1 Oktober 2026 09.00 } |
| :---- |

Perhitungan total: 80.000 × 3 \= 240.000.

Perubahan tersedia pada motor dilakukan terpisah oleh aplikasi saat status sewa berubah. Konsistensi penuh dengan *transaction* termasuk materi pengayaan.

## **Mengapa nama dan harga disalin?**

Jika harga berubah besok, transaksi hari ini tetap menyimpan harga saat transaksi dibuat. Laporan hari sebelumnya tidak ikut berubah.

# **6\. Tiga Aturan Nilai**

Tiga aturan ini harus selalu benar pada data. Aturan ini dijaga oleh formulir dan *security rules*.

| No | Aturan | Koleksi |
| :---- | :---- | :---- |
| 1 | harga\_per\_hari motor tidak pernah negatif | motor |
| 2 | lama\_hari selalu bilangan bulat 1 sampai 30, dan sewa baru hanya untuk motor yang tersedia | sewa |
| 3 | total selalu sama dengan harga\_per\_hari × lama\_hari | sewa |

# **7\. Aturan yang Dijaga Security Rules**

Tulis *security rules* sendiri berdasarkan tabel ini. Gunakan contoh rules Dapur Nia dari kelas sebagai pola.

| Koleksi | Yang wajib ditolak bila tidak terpenuhi |
| :---- | :---- |
| motor | Merek tipe wajib, maksimal 40 karakter. Plat nomor 3 sampai 12 karakter. Harga angka bulat minimal 0\. Tersedia bernilai boolean. |
| penyewa | Nama dan asal kota wajib. No WhatsApp sama dengan ID dokumen dan diawali 08\. Jenis jaminan hanya KTP, SIM, atau Paspor. |
| sewa | Lama hari angka bulat 1 sampai 30\. Motor harus tersedia. Harga sama dengan harga motor. Total sesuai rumus. Status awal dipesan. Status hanya berpindah sesuai tabel. |

# **8\. Arti Tipe Data**

| Tipe | Arti | Contoh |
| :---- | :---- | :---- |
| string | Teks | "Gas Rental" |
| number | Angka | 25000 |
| boolean | Pilihan ya atau tidak | true / false |
| timestamp | Tanggal dan jam | 1 Oktober 2026 08.00 |

