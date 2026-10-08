import React, { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import Penyewa from './Penyewa';
import Sewa from './Sewa';
import Dashboard from './Dashboard';

function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(number);
}

export default function App() {
  const [activeTab, setActiveTab] = useState('motor');
  const [motorList, setMotorList] = useState([]);
  const [activeRentedMotorIds, setActiveRentedMotorIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDeleteMotor, setConfirmDeleteMotor] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    merek_tipe: '',
    plat_nomor: '',
    harga_per_hari: '',
    tersedia: true
  });
  const [formErrors, setFormErrors] = useState({});

  // Toast State
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 2800);
  };

  // Ambil daftar motor dan sinkronkan dengan data sewa aktif dari Firestore
  const loadMotor = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const qMotor = query(collection(db, "motor"), orderBy("merek_tipe"), limit(100));
      const [snapshotMotor, snapshotSewa] = await Promise.all([
        getDocs(qMotor),
        getDocs(collection(db, "sewa"))
      ]);

      // Kumpulkan ID motor yang sedang memiliki transaksi aktif / berjalan
      const ongoingMotorIds = new Set();
      snapshotSewa.docs.forEach(docSnap => {
        const data = docSnap.data();
        const status = String(data.status || '').toLowerCase().trim();
        if ((status === 'berjalan' || status === 'aktif') && data.motor_id) {
          ongoingMotorIds.add(data.motor_id);
        }
      });

      setActiveRentedMotorIds(ongoingMotorIds);
      setMotorList(snapshotMotor.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      setErrorMessage("Data motor gagal dimuat. Periksa koneksi internet, lalu coba lagi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMotor();
  }, [loadMotor]);

  const handleRefresh = () => {
    loadMotor();
  };

  // Open Form Modal (Add)
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      merek_tipe: '',
      plat_nomor: '',
      harga_per_hari: '',
      tersedia: true
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Form Modal (Edit)
  const handleOpenEdit = (motor) => {
    setEditingId(motor.id);
    setFormData({
      merek_tipe: motor.merek_tipe,
      plat_nomor: motor.plat_nomor,
      harga_per_hari: motor.harga_per_hari,
      tersedia: Boolean(motor.tersedia)
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Delete Confirmation Dialog
  const handleOpenDelete = (motor) => {
    const isDisewa = activeRentedMotorIds.has(motor.id) || motor.tersedia === false;
    if (isDisewa) {
      alert(`Motor "${motor.merek_tipe}" sedang dalam transaksi sewa aktif dan tidak dapat dihapus.`);
      return;
    }
    setConfirmDeleteMotor(motor);
  };

  // Confirm Delete Action
  const handleExecuteDelete = async () => {
    if (!confirmDeleteMotor) return;
    const { id, merek_tipe } = confirmDeleteMotor;
    if (activeRentedMotorIds.has(id)) {
      alert(`Motor "${merek_tipe}" sedang dalam transaksi sewa aktif dan tidak dapat dihapus.`);
      setConfirmDeleteMotor(null);
      return;
    }
    try {
      await deleteDoc(doc(db, "motor", id));
      setConfirmDeleteMotor(null);
      showToast(`Motor "${merek_tipe}" berhasil dihapus.`);
      loadMotor();
    } catch (err) {
      console.error(err);
      setConfirmDeleteMotor(null);
      showToast("Motor gagal dihapus. Silakan coba lagi.");
    }
  };

  // Form Submit (Tambah / Ubah)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    const errors = {};

    const merek_tipe = formData.merek_tipe.trim();
    const plat_nomor = formData.plat_nomor.trim().toUpperCase();
    const harga_per_hari = parseInt(formData.harga_per_hari, 10);
    const tersedia = formData.tersedia;

    if (!merek_tipe || merek_tipe.length < 1 || merek_tipe.length > 40) {
      errors.merek_tipe = 'Merek dan tipe wajib diisi (1 sampai 40 karakter).';
    }
    if (!plat_nomor || plat_nomor.length < 3 || plat_nomor.length > 12) {
      errors.plat_nomor = 'Plat nomor wajib diisi (3 sampai 12 karakter).';
    }
    if (isNaN(harga_per_hari) || harga_per_hari < 0) {
      errors.harga_per_hari = 'Harga per hari harus angka bulat minimal 0.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        // Ubah Motor
        await updateDoc(doc(db, "motor", editingId), {
          merek_tipe,
          plat_nomor,
          harga_per_hari,
          tersedia
        });
        showToast(`Data motor "${merek_tipe}" berhasil diperbarui.`);
      } else {
        // Tambah Motor Baru
        await addDoc(collection(db, "motor"), {
          merek_tipe,
          plat_nomor,
          harga_per_hari,
          tersedia,
          dibuat_pada: serverTimestamp()
        });
        showToast(`Motor "${merek_tipe}" berhasil ditambahkan.`);
      }
      setIsModalOpen(false);
      loadMotor();
    } catch (err) {
      console.error(err);
      showToast("Data motor gagal disimpan. Periksa isian dan koneksi, lalu coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-layout">

      {/* Top Header Navbar */}
      <header className="navbar">
        <div className="nav-brand">
          <div className="brand-badge">GR</div>
          <div className="brand-text">
            <span className="brand-title">GAS RENTAL</span>
            <span className="brand-sub">Sistem Rental Motor Harian</span>
          </div>
        </div>

        <nav className="nav-links">
          <button
            className={`nav-btn ${activeTab === 'motor' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('motor');
              loadMotor();
            }}
          >
            Motor
          </button>
          <button
            className={`nav-btn ${activeTab === 'penyewa' ? 'active' : ''}`}
            onClick={() => setActiveTab('penyewa')}
          >
            Penyewa
          </button>
          <button
            className={`nav-btn ${activeTab === 'sewa' ? 'active' : ''}`}
            onClick={() => setActiveTab('sewa')}
          >
            Sewa
          </button>
          <button
            className={`nav-btn ${activeTab === 'dasbor' ? 'active' : ''}`}
            onClick={() => setActiveTab('dasbor')}
          >
            Dasbor
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="main-content">

        {/* ================= MODUL 1: MOTOR ================= */}
        {activeTab === 'motor' && (
          <section className="view-panel active">
            <div className="panel-header">
              <div className="panel-title-group">
                <h1 className="panel-title">Armada Motor</h1>
                <p className="panel-desc">Kelola unit motor, plat nomor kendaraan, tarif sewa harian, dan status unit.</p>
              </div>
              <div className="panel-actions">
                <button className="btn btn-secondary" onClick={handleRefresh}>
                  Segarkan
                </button>
                <button className="btn btn-primary" onClick={handleOpenAdd}>
                  Tambah Motor
                </button>
              </div>
            </div>

            {/* 3-State Conditionals */}
            {loading ? (
              // 1. Loading State
              <div className="state-box">
                <div className="spinner"></div>
                <h3 className="state-title">Memuat armada motor...</h3>
                <p className="state-desc">Mohon tunggu sebentar, sistem sedang memproses data.</p>
              </div>
            ) : errorMessage ? (
              // 2. Error State
              <div className="state-box">
                <h3 className="state-title">Terjadi Kesalahan</h3>
                <p className="state-desc">{errorMessage}</p>
                <button className="btn btn-secondary" onClick={handleRefresh}>
                  Coba Lagi
                </button>
              </div>
            ) : motorList.length === 0 ? (
              // 3. Empty State (Acceptance Criteria PRD: "Belum ada motor" + Tombol Tambah Motor)
              <div className="state-box">
                <h3 className="state-title">Belum ada motor</h3>
                <p className="state-desc">Belum ada unit motor yang terdaftar di sistem. Silakan tambahkan unit motor pertama.</p>
                <button className="btn btn-primary" onClick={handleOpenAdd}>
                  Tambah Motor
                </button>
              </div>
            ) : (
              // Normal List
              <div className="motor-grid">
                {motorList.map(item => {
                  const isDisewa = activeRentedMotorIds.has(item.id) || item.tersedia === false;
                  return (
                    <div key={item.id} className="motor-card">
                      <div>
                        <div className="motor-card-header">
                          <div>
                            <h2 className="motor-card-title">{item.merek_tipe}</h2>
                            <span className="motor-plate">{item.plat_nomor}</span>
                          </div>
                          <span className={`status-tag ${isDisewa ? 'disewa' : 'tersedia'}`}>
                            {isDisewa ? 'DISEWA' : 'TERSEDIA'}
                          </span>
                        </div>

                        <div className="motor-meta">
                          <div className="motor-meta-row">
                            <span>Tarif Sewa:</span>
                            <strong>{formatRupiah(item.harga_per_hari)} / hari</strong>
                          </div>
                          <div className="motor-meta-row">
                            <span>Status Unit:</span>
                            <span style={{ fontWeight: isDisewa ? 700 : 500, color: isDisewa ? 'var(--primary-red)' : 'inherit' }}>
                              {isDisewa ? 'Sedang Digunakan' : 'Siap Disewakan'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="motor-actions">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEdit(item)}
                        >
                          Ubah
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleOpenDelete(item)}
                          disabled={isDisewa}
                          title={isDisewa ? "Motor sedang disewa dan tidak dapat dihapus" : "Hapus motor"}
                          style={isDisewa ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ================= MODUL 2: PENYEWA ================= */}
        {activeTab === 'penyewa' && (
          <section className="view-panel active">
            <div className="panel-header">
              <div className="panel-title-group">
              </div>
            </div>

            <Penyewa />
          </section>
        )}

        {/* ================= MODUL 3: SEWA ================= */}
        {activeTab === 'sewa' && (
          <section className="view-panel active">
            <div className="panel-header">
              <div className="panel-title-group">
                <h1 className="panel-title">Transaksi Sewa</h1>
                <p className="panel-desc">Pencatatan transaksi sewa motor, total pembayaran, dan alur status pengembalian.</p>
              </div>
            </div>

                    <Sewa />
          </section>
        )}

        {/* ================= MODUL 4: DASBOR ================= */}
        {activeTab === 'dasbor' && (
          <Dashboard />
        )}

      </main>

      {/* Navigasi Bawah Mobile */}
      <nav className="bottom-nav">
        <button
          className={`bnav-btn ${activeTab === 'motor' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('motor');
            loadMotor();
          }}
        >
          Motor
        </button>
        <button
          className={`bnav-btn ${activeTab === 'penyewa' ? 'active' : ''}`}
          onClick={() => setActiveTab('penyewa')}
        >
          Penyewa
        </button>
        <button
          className={`bnav-btn ${activeTab === 'sewa' ? 'active' : ''}`}
          onClick={() => setActiveTab('sewa')}
        >
          Sewa
        </button>
        <button
          className={`bnav-btn ${activeTab === 'dasbor' ? 'active' : ''}`}
          onClick={() => setActiveTab('dasbor')}
        >
          Dasbor
        </button>
      </nav>

      {/* Modal Formulir Motor (Tambah / Ubah) */}
      {isModalOpen && (
        <div className="modal-backdrop show">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingId ? 'Ubah Motor' : 'Tambah Motor'}
              </h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setIsModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitForm} noValidate>
              <div className="form-group">
                <label className="form-label">Merek dan Tipe Motor *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Honda Vario 125"
                  maxLength={40}
                  value={formData.merek_tipe}
                  onChange={e => setFormData({ ...formData, merek_tipe: e.target.value })}
                  required
                />
                <span className="form-hint">Maksimal 40 karakter.</span>
                {formErrors.merek_tipe && (
                  <span className="form-error">{formErrors.merek_tipe}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Plat Nomor Kendaraan *</label>
                <input
                  type="text"
                  className="form-input text-uppercase"
                  placeholder="Contoh: DK 1234 AB"
                  minLength={3}
                  maxLength={12}
                  value={formData.plat_nomor}
                  onChange={e => setFormData({ ...formData, plat_nomor: e.target.value })}
                  required
                />
                <span className="form-hint">Huruf kapital, 3 sampai 12 karakter.</span>
                {formErrors.plat_nomor && (
                  <span className="form-error">{formErrors.plat_nomor}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Harga Sewa per Hari (Rp) *</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Contoh: 80000"
                  min={0}
                  step={1000}
                  value={formData.harga_per_hari}
                  onChange={e => setFormData({ ...formData, harga_per_hari: e.target.value })}
                  required
                />
                <span className="form-hint">Angka bulat rupiah tanpa tanda titik.</span>
                {formErrors.harga_per_hari && (
                  <span className="form-error">{formErrors.harga_per_hari}</span>
                )}
              </div>

              <div className="form-group">
                <label className="custom-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.tersedia}
                    onChange={e => setFormData({ ...formData, tersedia: e.target.checked })}
                  />
                  <span className="checkbox-box"></span>
                  <span className="checkbox-text">Unit motor siap / tersedia untuk disewakan</span>
                </label>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Simpan Motor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog Konfirmasi Hapus */}
      {confirmDeleteMotor && (
        <div className="modal-backdrop show">
          <div className="modal-dialog modal-dialog-sm">
            <div className="modal-header">
              <h3 className="modal-title">Konfirmasi Hapus</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setConfirmDeleteMotor(null)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p className="confirm-message">
                Apakah Anda yakin ingin menghapus data motor "{confirmDeleteMotor.merek_tipe}"?
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmDeleteMotor(null)}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleExecuteDelete}
              >
                Hapus Motor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="toast-container">
          <div className="toast">{toast}</div>
        </div>
      )}

    </div>
  );
}
