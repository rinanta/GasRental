import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

// Helper to get today's date formatted as YYYY-MM-DD
function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to extract YYYY-MM-DD from string, timestamp, or Date
function extractDateStr(val) {
  if (!val) return '';
  if (typeof val === 'string') {
    if (val.includes('T')) return val.split('T')[0];
    if (val.includes(' ')) return val.split(' ')[0];
    return val.trim();
  }
  if (typeof val === 'object') {
    if (typeof val.toDate === 'function') {
      const d = val.toDate();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    if (val instanceof Date) {
      const yyyy = val.getFullYear();
      const mm = String(val.getMonth() + 1).padStart(2, '0');
      const dd = String(val.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
  }
  return '';
}

// Helper to format date into human-readable Indonesian format (e.g. 08 Okt 2026)
function formatDateIndo(dateStr) {
  if (!dateStr) return '-';
  const cleanStr = extractDateStr(dateStr);
  if (!cleanStr) return '-';
  const parts = cleanStr.split('-');
  if (parts.length !== 3) return cleanStr;
  const [yyyy, mm, dd] = parts;
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
  ];
  const monthIdx = parseInt(mm, 10) - 1;
  const monthName = months[monthIdx] || mm;
  return `${dd} ${monthName} ${yyyy}`;
}

// Helper to parse numeric amount from number or string
function parseAmount(val) {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.-]+/g, '');
    const num = Number(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

// Helper to format currency in Rupiah, e.g. Rp540.000
function formatRupiah(amount) {
  const num = parseAmount(amount);
  return 'Rp' + new Intl.NumberFormat('id-ID').format(num);
}

// Helper to calculate rental duration in days
function calculateRentalDays(sewa) {
  if (sewa.lama_hari) {
    return `${sewa.lama_hari} hari`;
  }
  const startStr = extractDateStr(sewa.tanggal_mulai || sewa.start_date || sewa.tanggal);
  const endStr = extractDateStr(sewa.tanggal_selesai || sewa.tanggal_akhir || sewa.end_date);
  if (!startStr || !endStr) return '-';
  const start = new Date(startStr);
  const end = new Date(endStr);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? `${diffDays} hari` : '-';
}

// Helper to get estimated return date / due date
function getDueDate(sewa) {
  const endStr = extractDateStr(sewa.tanggal_selesai || sewa.tanggal_akhir || sewa.end_date || sewa.tanggal_pengembalian);
  if (endStr) {
    return formatDateIndo(endStr);
  }
  const startStr = extractDateStr(sewa.tanggal_mulai || sewa.start_date || sewa.tanggal);
  const duration = parseInt(sewa.lama_hari, 10);
  if (startStr && !isNaN(duration) && duration > 0) {
    const d = new Date(startStr);
    d.setDate(d.getDate() + (duration - 1));
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return formatDateIndo(`${yyyy}-${mm}-${dd}`);
  }
  return '-';
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const [motorList, setMotorList] = useState([]);
  const [penyewaList, setPenyewaList] = useState([]);
  const [sewaList, setSewaList] = useState([]);

  // Filter & Search states
  const [tabStatus, setTabStatus] = useState('berjalan'); // 'berjalan' | 'selesai'
  const [searchKeyword, setSearchKeyword] = useState('');

  // Date picker state for Pendapatan Card (defaults to today)
  const [selectedDate, setSelectedDate] = useState(getTodayString);

  // Fetch all collections in parallel from Cloud Firestore
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [motorSnap, penyewaSnap, sewaSnap] = await Promise.all([
        getDocs(collection(db, 'motor')),
        getDocs(collection(db, 'penyewa')),
        getDocs(collection(db, 'sewa'))
      ]);

      setMotorList(motorSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setPenyewaList(penyewaSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setSewaList(sewaSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Gagal memuat data dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Lookup Maps for resolving motor_id and penyewa_id
  const motorMap = useMemo(() => {
    const map = new Map();
    motorList.forEach(m => map.set(m.id, m));
    return map;
  }, [motorList]);

  const penyewaMap = useMemo(() => {
    const map = new Map();
    penyewaList.forEach(p => map.set(p.id, p));
    return map;
  }, [penyewaList]);

  // 1. Daftar Sewa Berjalan (status == "berjalan" atau "aktif")
  const sewaBerjalanList = useMemo(() => {
    return sewaList.filter(s => {
      const status = String(s.status || '').toLowerCase().trim();
      return status === 'berjalan' || status === 'aktif';
    });
  }, [sewaList]);

  // 2. Daftar Sewa Selesai (status == "selesai")
  const sewaSelesaiList = useMemo(() => {
    return sewaList.filter(s => {
      const status = String(s.status || '').toLowerCase().trim();
      return status === 'selesai';
    });
  }, [sewaList]);

  // 3. Card 'Sedang Disewa': Hitung total transaksi yang statusnya 'Berjalan'/aktif
  const motorSedangDisewaCount = useMemo(() => {
    return sewaBerjalanList.length;
  }, [sewaBerjalanList]);

  // 4. Card 'Motor Tersedia': Total Semua Motor - Motor Sedang Disewa
  const motorTersediaCount = useMemo(() => {
    return Math.max(0, motorList.length - motorSedangDisewaCount);
  }, [motorList.length, motorSedangDisewaCount]);

  // 5. Card 'Pendapatan': Transaksi yang aktif atau selesai pada tanggal terpilih
  const totalPendapatan = useMemo(() => {
    return sewaList
      .filter(s => {
        const status = String(s.status || '').toLowerCase().trim();
        const isValidStatus = status === 'aktif' || status === 'berjalan' || status === 'selesai';
        if (!isValidStatus) return false;

        const startDate = extractDateStr(s.tanggal_mulai || s.start_date || s.tanggal);
        const endDate = extractDateStr(s.tanggal_selesai || s.tanggal_akhir || s.end_date);
        const dibuatDate = extractDateStr(s.dibuat_pada || s.createdAt);

        const matchesDate =
          startDate === selectedDate ||
          dibuatDate === selectedDate ||
          (startDate && endDate && startDate <= selectedDate && selectedDate <= endDate);

        return matchesDate;
      })
      .reduce((sum, s) => {
        const val = parseAmount(s.total ?? s.total_harga ?? s.total_biaya ?? s.harga_total ?? s.biaya);
        return sum + val;
      }, 0);
  }, [sewaList, selectedDate]);

  // Filter daftar berdasarkan tab terpilih dan kata kunci pencarian
  const displayedList = useMemo(() => {
    const baseList = tabStatus === 'selesai' ? sewaSelesaiList : sewaBerjalanList;
    const query = searchKeyword.toLowerCase().trim();
    if (!query) return baseList;

    return baseList.filter(item => {
      const penyewaObj = penyewaMap.get(item.penyewa_id);
      const namaPenyewa = (item.nama_penyewa || item.penyewa_nama || penyewaObj?.nama || '').toLowerCase();
      const noWa = (penyewaObj?.no_whatsapp || '').toLowerCase();

      const motorObj = motorMap.get(item.motor_id);
      const merek = (motorObj?.merek_tipe || item.motor || '').toLowerCase();
      const plat = (motorObj?.plat_nomor || '').toLowerCase();

      const tglMulai = (item.tanggal_mulai || item.start_date || item.tanggal || '').toLowerCase();
      const tglSelesai = (item.tanggal_selesai || item.tanggal_akhir || item.end_date || item.tanggal_pengembalian || '').toLowerCase();

      return (
        namaPenyewa.includes(query) ||
        noWa.includes(query) ||
        merek.includes(query) ||
        plat.includes(query) ||
        tglMulai.includes(query) ||
        tglSelesai.includes(query)
      );
    });
  }, [tabStatus, sewaBerjalanList, sewaSelesaiList, searchKeyword, penyewaMap, motorMap]);

  // Handler untuk menyelesaikan transaksi sewa saat unit motor dikembalikan
  const handleSelesaikanSewa = async (item) => {
    const penyewaObj = penyewaMap.get(item.penyewa_id);
    const namaPenyewa = item.nama_penyewa || item.penyewa_nama || penyewaObj?.nama || 'penyewa';
    if (!window.confirm(`Konfirmasi: Selesaikan sewa untuk ${namaPenyewa} dan kembalikan unit motor?`)) {
      return;
    }

    setProcessingId(item.id);
    try {
      // 1. Update status transaksi sewa menjadi 'selesai'
      await updateDoc(doc(db, 'sewa', item.id), {
        status: 'selesai',
        tanggal_pengembalian: getTodayString()
      });

      // 2. Jika ada motor_id, set status unit motor kembali tersedia
      if (item.motor_id) {
        try {
          await updateDoc(doc(db, 'motor', item.motor_id), {
            tersedia: true
          });
        } catch (motorErr) {
          console.warn('Gagal memperbarui status unit motor:', motorErr);
        }
      }

      // 3. Muat ulang data dashboard
      await fetchDashboardData();
    } catch (err) {
      console.error('Error saat menyelesaikan sewa:', err);
      alert('Gagal menyelesaikan transaksi sewa. Silakan coba lagi.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <section className="view-panel active">
      {/* 1. Header */}
      <div className="panel-header">
        <div className="panel-title-group">
          <h1 className="panel-title">Dashboard</h1>
          <p className="panel-desc">Ringkasan kondisi rental motor</p>
        </div>
      </div>

      {/* Error State */}
      {error && !loading && (
        <div className="state-box" style={{ marginTop: '1rem' }}>
          <h3 className="state-title">Kesalahan</h3>
          <p className="state-desc">{error}</p>
          <button className="btn btn-secondary" onClick={fetchDashboardData}>
            Coba Lagi
          </button>
        </div>
      )}

      {/* Ringkasan Statistik */}
      {!error && (
        <>
          <div className="dashboard-stats-grid">
            {/* Card Motor Tersedia */}
            <div className="dashboard-stat-card card-tersedia">
              <div className="dashboard-stat-header">
                <span className="dashboard-stat-label">Motor Tersedia</span>
                <span className="status-tag tersedia">Tersedia</span>
              </div>
              {loading ? (
                <div className="skeleton-stat" />
              ) : (
                <div className="dashboard-stat-value">{motorTersediaCount}</div>
              )}
              <div className="dashboard-stat-footer">
                <span>{motorList.length} total armada - {motorSedangDisewaCount} disewa</span>
              </div>
            </div>

            {/* Card Sedang Disewa */}
            <div className="dashboard-stat-card card-disewa">
              <div className="dashboard-stat-header">
                <span className="dashboard-stat-label">Sedang Disewa</span>
                <span className="status-tag disewa">Disewa</span>
              </div>
              {loading ? (
                <div className="skeleton-stat" />
              ) : (
                <div className="dashboard-stat-value">{motorSedangDisewaCount}</div>
              )}
              <div className="dashboard-stat-footer">
                <span>{sewaBerjalanList.length} transaksi sewa berjalan/aktif</span>
              </div>
            </div>

            {/* Card Pendapatan */}
            <div className="dashboard-stat-card card-pendapatan">
              <div className="dashboard-stat-header">
                <span className="dashboard-stat-label">Pendapatan</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="dashboard-date-picker"
                  title="Pilih tanggal pendapatan"
                />
              </div>
              {loading ? (
                <div className="skeleton-stat" style={{ width: '130px' }} />
              ) : (
                <div className="dashboard-stat-value" style={{ color: '#b45309' }}>
                  {formatRupiah(totalPendapatan)}
                </div>
              )}
              <div className="dashboard-stat-footer">
                <span>Transaksi pada {formatDateIndo(selectedDate)}</span>
              </div>
            </div>
          </div>

          {/* Bagian Transaksi Sewa & Pencarian */}
          <div className="sewa-berjalan-section">
            <div className="dashboard-filter-toolbar">
              {/* Tab Switcher: Berjalan vs Selesai */}
              <div className="tab-filter-pills">
                <button
                  type="button"
                  className={`tab-filter-pill ${tabStatus === 'berjalan' ? 'active' : ''}`}
                  onClick={() => setTabStatus('berjalan')}
                >
                  Sewa Berjalan
                  <span className="tab-pill-badge">{sewaBerjalanList.length}</span>
                </button>
                <button
                  type="button"
                  className={`tab-filter-pill ${tabStatus === 'selesai' ? 'active' : ''}`}
                  onClick={() => setTabStatus('selesai')}
                >
                  Sewa Selesai
                  <span className="tab-pill-badge">{sewaSelesaiList.length}</span>
                </button>
              </div>

              {/* Kolom Pencarian */}
              <div className="dashboard-search-wrapper">
                <span className="dashboard-search-icon" aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder={
                    tabStatus === 'selesai'
                      ? 'Cari yang sudah selesai...'
                      : 'Cari penyewa / motor...'
                  }
                  value={searchKeyword}
                  onChange={e => setSearchKeyword(e.target.value)}
                  className="dashboard-search-input"
                />
                {searchKeyword && (
                  <button
                    type="button"
                    className="dashboard-search-clear"
                    onClick={() => setSearchKeyword('')}
                    title="Hapus pencarian"
                    aria-label="Hapus pencarian"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="sewa-berjalan-list">
                <div className="skeleton-card">
                  <div className="skeleton-text" style={{ width: '40%', marginBottom: '0.6rem' }} />
                  <div className="skeleton-text" style={{ width: '70%', marginBottom: '0.4rem' }} />
                  <div className="skeleton-text" style={{ width: '50%' }} />
                </div>
                <div className="skeleton-card">
                  <div className="skeleton-text" style={{ width: '45%', marginBottom: '0.6rem' }} />
                  <div className="skeleton-text" style={{ width: '65%', marginBottom: '0.4rem' }} />
                  <div className="skeleton-text" style={{ width: '55%' }} />
                </div>
              </div>
            ) : displayedList.length === 0 ? (
              <div className="state-box" style={{ padding: '2.5rem 1.5rem' }}>
                <p className="state-desc" style={{ marginBottom: 0 }}>
                  {searchKeyword
                    ? `Tidak ada transaksi ${tabStatus === 'selesai' ? 'selesai' : 'berjalan'} yang cocok dengan "${searchKeyword}".`
                    : tabStatus === 'selesai'
                      ? 'Belum ada sewa yang selesai.'
                      : 'Belum ada sewa yang sedang berjalan.'}
                </p>
              </div>
            ) : (
              <div className="sewa-berjalan-list">
                {displayedList.map(item => {
                  const isSelesai = String(item.status || '').toLowerCase().trim() === 'selesai';

                  // Resolve nama penyewa
                  const penyewaObj = penyewaMap.get(item.penyewa_id);
                  const namaPenyewa =
                    item.nama_penyewa ||
                    item.penyewa_nama ||
                    penyewaObj?.nama ||
                    (item.penyewa_id ? `Penyewa ID: ${item.penyewa_id}` : '-');

                  // Resolve motor
                  const motorObj = motorMap.get(item.motor_id);
                  const infoMotor =
                    item.motor ||
                    (motorObj ? `${motorObj.merek_tipe} (${motorObj.plat_nomor})` : (item.motor_id ? `Motor ID: ${item.motor_id}` : '-'));

                  // Tanggal mulai
                  const tglMulaiRaw = extractDateStr(item.tanggal_mulai || item.start_date || item.tanggal);
                  const tglMulaiFormatted = formatDateIndo(tglMulaiRaw);

                  // Tanggal selesai / jatuh tempo
                  const tglSelesaiFormatted = getDueDate(item);

                  // Lama hari
                  const lamaHari = calculateRentalDays(item);

                  // Total
                  const totalFormatted = formatRupiah(item.total ?? item.total_harga ?? item.total_biaya ?? item.harga_total ?? item.biaya ?? 0);

                  return (
                    <div key={item.id} className="sewa-berjalan-card">
                      <div className="sewa-card-top">
                        <div className="sewa-penyewa-name">{namaPenyewa}</div>
                        <div className="sewa-actions-group">
                          {isSelesai ? (
                            <span className="status-badge-selesai">Selesai</span>
                          ) : (
                            <>
                              <span className="status-badge-berjalan">Berjalan</span>
                              <button
                                type="button"
                                className="btn-selesai-sewa"
                                onClick={() => handleSelesaikanSewa(item)}
                                disabled={processingId === item.id}
                                title="Selesaikan transaksi sewa & unit dikembalikan"
                              >
                                {processingId === item.id ? (
                                  'Menyimpan...'
                                ) : (
                                  <>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    <span>Selesaikan Sewa</span>
                                  </>
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="sewa-grid-details">
                        <div className="sewa-detail-item">
                          <span className="sewa-detail-label">Motor</span>
                          <span className="sewa-detail-value">{infoMotor}</span>
                        </div>

                        <div className="sewa-detail-item">
                          <span className="sewa-detail-label">Lama Sewa</span>
                          <span className="sewa-detail-value">{lamaHari}</span>
                        </div>

                        <div className="sewa-detail-item">
                          <span className="sewa-detail-label">Tanggal Mulai</span>
                          <span className="sewa-detail-value">{tglMulaiFormatted}</span>
                        </div>

                        <div className="sewa-detail-item">
                          <span className="sewa-detail-label">
                            {isSelesai ? 'Tanggal Selesai' : 'Jatuh Tempo / Selesai'}
                          </span>
                          <span
                            className="sewa-detail-value"
                            style={{ color: isSelesai ? '#166534' : '#b91c1c' }}
                          >
                            {tglSelesaiFormatted}
                          </span>
                        </div>

                        <div className="sewa-detail-item" style={{ gridColumn: '1 / -1' }}>
                          <span className="sewa-detail-label">Total Biaya</span>
                          <span className="sewa-detail-total">{totalFormatted}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
