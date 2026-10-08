import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Searchable dropdown (combobox) component
function SearchableSelect({ options, value, onChange, placeholder, labelRenderer, isOptionDisabled }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedItem = options.find((opt) => opt.id === value);

  // Filter options based on query
  const filtered = options.filter((opt) => {
    if (!query) return true;
    return labelRenderer(opt).toLowerCase().includes(query.toLowerCase());
  });

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  const handleSelect = (opt) => {
    onChange(opt.id);
    setQuery('');
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
    setIsOpen(false);
  };

  // When dropdown is closed, show selected item's label or empty
  // When dropdown is open, if user is typing show query; otherwise show empty or selected label
  const inputValue = isOpen ? query : (selectedItem ? labelRenderer(selectedItem) : '');

  return (
    <div
      className="combobox-container"
      ref={containerRef}
      style={{ position: 'relative', width: '100%' }}
    >
      <div className="combobox-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
        <input
          type="text"
          placeholder={selectedItem ? labelRenderer(selectedItem) : placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            setIsOpen(true);
          }}
          className="combobox-input"
        />
        <div className="combobox-icons">
          {value ? (
            <button
              type="button"
              className="combobox-clear-btn"
              onClick={handleClear}
              title="Hapus pilihan"
            >
              ×
            </button>
          ) : null}
          <span className="combobox-arrow">▼</span>
        </div>
      </div>

      {isOpen && (
        <ul
          className="combobox-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            width: '100%',
            zIndex: 50,
            backgroundColor: '#ffffff',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            maxHeight: '240px',
            overflowY: 'auto',
            listStyle: 'none',
            listStyleType: 'none',
            margin: 0,
            padding: '4px 0'
          }}
        >
          {filtered.length > 0 ? (
            filtered.map((opt) => {
              const isSelected = opt.id === value;
              const isOptionDis = isOptionDisabled ? Boolean(isOptionDisabled(opt)) : false;
              return (
                <li
                  key={opt.id}
                  className={`combobox-item ${isSelected ? 'selected' : ''}`}
                  style={{
                    listStyle: 'none',
                    listStyleType: 'none',
                    padding: '8px 12px',
                    cursor: isOptionDis ? 'not-allowed' : 'pointer',
                    fontSize: '0.86rem',
                    backgroundColor: isSelected ? '#fef2f2' : isOptionDis ? '#f9fafb' : 'transparent',
                    color: isOptionDis ? '#9ca3af' : isSelected ? '#b91c1c' : '#111827',
                    fontWeight: isSelected ? 700 : 400,
                    opacity: isOptionDis ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (isOptionDis) return;
                    handleSelect(opt);
                  }}
                  title={isOptionDis ? "Unit motor ini sedang disewa oleh orang lain" : ""}
                >
                  <span>{labelRenderer(opt)}</span>
                  {isOptionDis && (
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      marginLeft: '8px',
                      whiteSpace: 'nowrap'
                    }}>
                      DISEWA
                    </span>
                  )}
                </li>
              );
            })
          ) : (
            <li
              className="combobox-empty"
              style={{
                listStyle: 'none',
                listStyleType: 'none',
                padding: '10px 12px',
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '0.84rem'
              }}
            >
              Tidak ada hasil yang cocok
            </li>
          )}
        </ul>
      )}
    </div>
  );
}


export default function Sewa() {
  // State
  const [motorList, setMotorList] = useState([]);
  const [penyewaList, setPenyewaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    motorId: '',
    penyewaId: '',
    startDate: '',
    endDate: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  // search terms for dropdowns
  const [motorSearch, setMotorSearch] = useState('');
  const [penyewaSearch, setPenyewaSearch] = useState('');

  // Load motor options & sinkronkan ketersediaan dengan sewa aktif
  const loadMotor = useCallback(async () => {
    try {
      const qMotor = query(collection(db, 'motor'), orderBy('merek_tipe'), limit(100));
      const [snapMotor, snapSewa] = await Promise.all([
        getDocs(qMotor),
        getDocs(collection(db, 'sewa'))
      ]);

      // Kumpulkan ID motor yang sedang memiliki transaksi sewa aktif/berjalan
      const ongoingMotorIds = new Set();
      snapSewa.docs.forEach(d => {
        const data = d.data();
        const status = String(data.status || '').toLowerCase().trim();
        if ((status === 'berjalan' || status === 'aktif') && data.motor_id) {
          ongoingMotorIds.add(data.motor_id);
        }
      });

      setMotorList(snapMotor.docs.map(d => {
        const data = d.data();
        const isRented = ongoingMotorIds.has(d.id) || data.tersedia === false;
        return {
          id: d.id,
          ...data,
          isRented
        };
      }));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Load penyewa options
  const loadPenyewa = useCallback(async () => {
    try {
      const q = query(collection(db, 'penyewa'), orderBy('nama'), limit(100));
      const snap = await getDocs(q);
      setPenyewaList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      await Promise.all([loadMotor(), loadPenyewa()]);
      setLoading(false);
    };
    fetchAll();
  }, [loadMotor, loadPenyewa]);

  const calculateDays = () => {
    if (!form.startDate || !form.endDate) return 0;
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    const diff = (end - start) / (1000 * 60 * 60 * 24) + 1; // inclusive
    return diff > 0 ? diff : 0;
  };

  const selectedMotor = () => motorList.find(m => m.id === form.motorId);
  const totalPrice = () => {
    const motor = selectedMotor();
    const days = calculateDays();
    return motor ? motor.harga_per_hari * days : 0;
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = {};
    if (!form.motorId) {
      errs.motorId = 'Pilih motor.';
    } else {
      const chosenMotor = motorList.find(m => m.id === form.motorId);
      if (chosenMotor && chosenMotor.isRented) {
        errs.motorId = 'Motor ini sedang disewa oleh orang lain.';
      }
    }
    if (!form.penyewaId) errs.penyewaId = 'Pilih penyewa.';
    if (!form.startDate) errs.startDate = 'Tanggal mulai diperlukan.';
    if (!form.endDate) errs.endDate = 'Tanggal akhir diperlukan.';
    if (calculateDays() <= 0) errs.endDate = 'Tanggal akhir harus setelah atau sama dengan tanggal mulai.';
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, 'sewa'), {
        motor_id: form.motorId,
        penyewa_id: form.penyewaId,
        start_date: form.startDate,
        tanggal_mulai: form.startDate,
        end_date: form.endDate,
        tanggal_selesai: form.endDate,
        total_harga: totalPrice(),
        total: totalPrice(),
        status: 'berjalan',
        dibuat_pada: serverTimestamp()
      });
      // Sinkronkan status unit motor menjadi tidak tersedia (disewa)
      try {
        await updateDoc(doc(db, 'motor', form.motorId), {
          tersedia: false
        });
      } catch (errMotor) {
        console.warn('Gagal sinkron status motor:', errMotor);
      }
      setForm({ motorId: '', penyewaId: '', startDate: '', endDate: '' });
      alert('Transaksi sewa berhasil disimpan.');
      await loadMotor();
    } catch (e) {
      console.error(e);
      alert('Gagal menyimpan transaksi sewa.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="state-box">
        <h3 className="state-title">Memuat data...</h3>
        {error && <p className="state-desc">{error}</p>}
      </div>
    );
  }

  return (
    <div className="card sewa-card">
      <h2 className="panel-title" style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>Buat Transaksi Sewa</h2>
      <form onSubmit={handleSubmit}>
        {/* Row 1: Motor & Penyewa */}
        <div className="sewa-form-row">
          <div className="sewa-form-col">
            <label className="form-label">Motor</label>
            <SearchableSelect
              placeholder="Cari atau pilih motor..."
              options={motorList}
              value={form.motorId}
              onChange={(id) => setForm(prev => ({ ...prev, motorId: id }))}
              labelRenderer={(m) => `${m.merek_tipe} (${m.plat_nomor}) - ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(m.harga_per_hari)}/hari`}
              isOptionDisabled={(m) => m.isRented}
            />
            {formErrors.motorId && <p className="form-error">{formErrors.motorId}</p>}
          </div>
          <div className="sewa-form-col">
            <label className="form-label">Penyewa</label>
            <SearchableSelect
              placeholder="Cari atau pilih penyewa..."
              options={penyewaList}
              value={form.penyewaId}
              onChange={(id) => setForm(prev => ({ ...prev, penyewaId: id }))}
              labelRenderer={(p) => `${p.nama} - ${p.no_whatsapp}`}
            />
            {formErrors.penyewaId && <p className="form-error">{formErrors.penyewaId}</p>}
          </div>
        </div>

        {/* Row 2: Tanggal */}
        <div className="sewa-form-row">
          <div className="sewa-form-col">
            <label className="form-label">Tanggal Mulai</label>
            <input type="date" name="startDate" value={form.startDate} onChange={handleChange} className="form-input" />
            {formErrors.startDate && <p className="form-error">{formErrors.startDate}</p>}
          </div>
          <div className="sewa-form-col">
            <label className="form-label">Tanggal Akhir</label>
            <input type="date" name="endDate" value={form.endDate} onChange={handleChange} className="form-input" />
            {formErrors.endDate && <p className="form-error">{formErrors.endDate}</p>}
          </div>
        </div>

        {/* Summary */}
        <div className="sewa-summary">
          <span className="sewa-summary-days">Durasi Sewa: <strong>{calculateDays()}</strong> hari</span>
          <span className="sewa-summary-price">Total Bayar: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalPrice())}</span>
        </div>

        <button type="submit" disabled={saving} className="sewa-btn">
          {saving ? 'Menyimpan...' : 'Buat Transaksi Sewa'}
        </button>
      </form>
    </div>
  );
}
