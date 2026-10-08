import React, { useState, useEffect, useCallback } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  limit,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import './index.css';

export default function Penyewa() {
  // State management
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState({ open: false, editing: null });
  const [confirmDelete, setConfirmDelete] = useState(null);

  // ---------- Load Penyewa ----------
  const loadPenyewa = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(
        collection(db, 'penyewa'),
        orderBy('nama'),
        limit(20)
      );
      const snap = await getDocs(q);
      setList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
      setError('Gagal memuat data penyewa.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPenyewa();
  }, [loadPenyewa]);

  // ---------- Search ----------
  const filtered = list.filter(p =>
    p.nama?.toLowerCase().includes(search.toLowerCase()) ||
    p.no_whatsapp?.toLowerCase().includes(search.toLowerCase())
  );

  // ---------- Modal handling ----------
  const openForm = (penyewa = null) => {
    setModal({ open: true, editing: penyewa });
  };
  const closeForm = () => setModal({ open: false, editing: null });

  // ---------- Form submit ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      nama: form.nama.value.trim(),
      no_whatsapp: form.no_whatsapp.value.trim(),
      asal_kota: form.asal_kota.value.trim(),
      jenis_jaminan: form.jenis_jaminan.value,
    };

    // ---- Validation ----
    if (!data.nama) return alert('Nama wajib diisi.');
    if (!data.no_whatsapp) return alert('No. WhatsApp wajib diisi.');
    if (!['KTP', 'Paspor'].includes(data.jenis_jaminan)) {
      return alert('Jenis jaminan harus KTP, atau Paspor.');
    }

    try {
      if (modal.editing) {
        // Update existing
        await setDoc(doc(db, 'penyewa', modal.editing.id), data, { merge: true });
      } else {
        // Check uniqueness of WhatsApp
        const dupSnap = await getDocs(
          query(
            collection(db, 'penyewa'),
            where('no_whatsapp', '==', data.no_whatsapp)
          )
        );
        if (!dupSnap.empty) {
          alert('Nomor WhatsApp sudah terdaftar.');
          return;
        }
        await setDoc(doc(db, 'penyewa', data.no_whatsapp), data);
      }
      closeForm();
      loadPenyewa();
    } catch (e) {
      console.error(e);
      alert('Gagal menyimpan data penyewa.');
    }
  };

  // ---------- Delete ----------
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'penyewa', id));
      loadPenyewa();
    } catch (e) {
      console.error(e);
      alert('Gagal menghapus penyewa.');
    }
  };

  // ---------- UI ----------
  return (
    <section className="view-panel active">
      <div className="panel-header">
        <div className="panel-title-group">
          <h1 className="panel-title">Data Penyewa</h1>
          <p className="panel-desc">
            Kelola data penyewa: nama, nomor WhatsApp, kota asal, dan jenis jaminan.
          </p>
        </div>
        <div className="panel-actions">
          <button className="btn btn-primary" onClick={() => openForm()}>
            + Tambah Penyewa
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ marginBottom: '1rem' }}>
        <input
          className="form-input"
          placeholder="Cari nama / WhatsApp"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* UI states */}
      {loading ? (
        <div className="state-box">
          <div className="spinner"></div>
          <h3 className="state-title">Memuat data penyewa…</h3>
        </div>
      ) : error ? (
        <div className="state-box">
          <h3 className="state-title">Kesalahan</h3>
          <p className="state-desc">{error}</p>
          <button className="btn btn-secondary" onClick={loadPenyewa}>
            Coba Lagi
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="state-box">
          <h3 className="state-title">Tidak ada penyewa</h3>
          <p className="state-desc">Gunakan tombol “+ Tambah Penyewa” untuk menambah data.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="card">
            <table className="penyewa-table">
              <thead className="table-header">
                <tr>
                  <th>Nama</th>
                  <th>WhatsApp</th>
                  <th>Kota Asal</th>
                  <th>Jaminan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="table-row">
                    <td className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50">{p.nama}</td>
                    <td className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50">{p.no_whatsapp}</td>
                    <td className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50">{p.asal_kota}</td>
                    <td className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50">{p.jenis_jaminan}</td>
                    <td className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50">
                      <button className="btn btn-edit btn-sm" onClick={() => openForm(p)}>
                        Edit
                      </button>
                      <button className="btn btn-delete btn-sm" onClick={() => setConfirmDelete(p)}>
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {modal.open && (
        <div className="modal-backdrop show">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3 className="modal-title">
                {modal.editing ? 'Ubah Penyewa' : 'Tambah Penyewa'}
              </h3>
              <button className="modal-close" type="button" onClick={closeForm}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label className="form-label">Nama *</label>
                <input
                  name="nama"
                  className="form-input"
                  defaultValue={modal.editing?.nama || ''}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">No. WhatsApp *</label>
                <input
                  name="no_whatsapp"
                  className="form-input"
                  defaultValue={modal.editing?.no_whatsapp || ''}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Kota Asal</label>
                <input
                  name="asal_kota"
                  className="form-input"
                  defaultValue={modal.editing?.asal_kota || ''}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Jenis Jaminan *</label>
                <select
                  name="jenis_jaminan"
                  className="form-input"
                  defaultValue={modal.editing?.jenis_jaminan || ''}
                  required
                >
                  <option value="">Pilih…</option>
                  <option value="KTP">KTP</option>
                  <option value="Paspor">Paspor</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeForm}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  {modal.editing ? 'Simpan Perubahan' : 'Simpan Penyewa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div className="modal-backdrop show">
          <div className="modal-dialog modal-dialog-sm">
            <div className="modal-header">
              <h3 className="modal-title">Konfirmasi Hapus</h3>
              <button className="modal-close" type="button" onClick={() => setConfirmDelete(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="confirm-message">
                Apakah Anda yakin ingin menghapus penyewa "{confirmDelete.nama}"?
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>
                Batal
              </button>
              <button className="btn btn-danger" onClick={() => { handleDelete(confirmDelete.id); setConfirmDelete(null); }}>
                Hapus Penyewa
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
