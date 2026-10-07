/**
 * GAS RENTAL - MAIN APPLICATION LOGIC
 * Manages UI, Navigation, CRUD Operations, 3-States, and Firestore/Mock Integration
 */

import {
  firebaseState,
  INITIAL_MOCK_DATA,
  saveFirebaseConfig,
  clearFirebaseConfig,
  loadSavedFirebaseConfig,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  limit,
  serverTimestamp
} from "./firebase-config.js";

// Local Mock Storage Key
const LOCAL_MOCK_KEY = "GAS_RENTAL_MOCK_STORAGE";

// Application State
const appState = {
  currentTab: "dasbor",
  sewaStatusFilter: "semua",
  penyewaSearchQuery: "",
  dasborTanggalFilter: new Date().toISOString().split("T")[0],
  motorList: [],
  penyewaList: [],
  sewaList: [],
  loadingStates: {
    motor: false,
    penyewa: false,
    sewa: false,
    dasbor: false
  },
  errorStates: {
    motor: null,
    penyewa: null,
    sewa: null,
    dasbor: null
  },
  // Modal Confirm Callback
  pendingConfirmAction: null
};

// ================= LOCAL MOCK STORAGE HELPERS =================
function getMockData() {
  const stored = localStorage.getItem(LOCAL_MOCK_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Gagal membaca mock data dari storage, reset ke default:", e);
    }
  }
  localStorage.setItem(LOCAL_MOCK_KEY, JSON.stringify(INITIAL_MOCK_DATA));
  return JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
}

function saveMockData(data) {
  localStorage.setItem(LOCAL_MOCK_KEY, JSON.stringify(data));
}

// Generate simple mock ID
function generateId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}`;
}

// Format Rupiah
function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(number);
}

// Format Tanggal
function formatTanggal(dateStr) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  } catch (e) {
    return dateStr;
  }
}

// Show Toast
function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const icon = type === "success" ? "✅" : type === "danger" ? "❌" : "⚠️";
  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ================= MODAL HANDLERS =================
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add("show");
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("show");
}

function showConfirmModal(title, message, onConfirm) {
  document.getElementById("confirmModalTitle").textContent = title;
  document.getElementById("confirmModalMessage").textContent = message;
  appState.pendingConfirmAction = onConfirm;
  openModal("modalConfirm");
}

// ================= NAVIGATION =================
function switchTab(targetTab) {
  appState.currentTab = targetTab;

  // Update nav buttons
  document.querySelectorAll(".nav-btn, .bnav-btn").forEach(btn => {
    if (btn.dataset.target === targetTab) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  // Update views
  document.querySelectorAll(".view-panel").forEach(panel => {
    if (panel.id === `view-${targetTab}`) {
      panel.classList.add("active");
    } else {
      panel.classList.remove("active");
    }
  });

  // Refresh data for the active view
  if (targetTab === "dasbor") loadDasborData();
  if (targetTab === "motor") loadMotorData();
  if (targetTab === "penyewa") loadPenyewaData();
  if (targetTab === "sewa") loadSewaData();
}

// ================= DATA MODE STATUS =================
function updateConnectionBadge() {
  const badge = document.getElementById("dataModeBadge");
  const dot = badge.querySelector(".mode-dot");
  const text = document.getElementById("modeText");

  if (firebaseState.isConnected) {
    dot.className = "mode-dot connected";
    text.textContent = "Firestore Online";
    badge.title = "Terhubung ke Google Cloud Firestore. Klik untuk ubah.";
  } else {
    dot.className = "mode-dot";
    text.textContent = "Mock Data (Lokal)";
    badge.title = "Berjalan dengan Mock Data lokal. Klik untuk menghubungkan ke Firebase.";
  }
}

// ================= 3-STATE RENDERERS =================
function renderLoadingState(container, text = "Memuat data...") {
  container.innerHTML = `
    <div class="state-container">
      <div class="spinner"></div>
      <h4 class="state-title">${text}</h4>
      <p class="state-desc">Mohon tunggu sebentar, sistem sedang mengambil data terbaru.</p>
    </div>
  `;
}

function renderEmptyState(container, title, desc, btnText, btnAction) {
  container.innerHTML = `
    <div class="state-container">
      <div class="state-icon">📭</div>
      <h4 class="state-title">${title}</h4>
      <p class="state-desc">${desc}</p>
      ${btnText ? `<button class="btn btn-primary" id="btnEmptyAction">${btnText}</button>` : ""}
    </div>
  `;
  if (btnText && btnAction) {
    const btn = container.querySelector("#btnEmptyAction");
    if (btn) btn.addEventListener("click", btnAction);
  }
}

function renderErrorState(container, errorMsg, onRetry) {
  container.innerHTML = `
    <div class="state-container">
      <div class="state-icon">⚠️</div>
      <h4 class="state-title">Terjadi Kesalahan</h4>
      <p class="state-desc">${errorMsg || "Gagal memuat data dari server."}</p>
      <button class="btn btn-secondary" id="btnErrorRetry">🔄 Coba Lagi</button>
    </div>
  `;
  const retryBtn = container.querySelector("#btnErrorRetry");
  if (retryBtn && onRetry) {
    retryBtn.addEventListener("click", onRetry);
  }
}

// ================= MODUL 1: MOTOR =================
async function loadMotorData() {
  const container = document.getElementById("motorListContainer");
  renderLoadingState(container, "Memuat armada motor...");

  try {
    if (firebaseState.isConnected) {
      const q = query(collection(firebaseState.db, "motor"), orderBy("merek_tipe"), limit(20));
      const snapshot = await getDocs(q);
      appState.motorList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      // Mock data
      await new Promise(r => setTimeout(r, 200)); // micro delay
      const mock = getMockData();
      appState.motorList = mock.motor || [];
    }

    renderMotorList();
  } catch (err) {
    console.error("Gagal load motor:", err);
    renderErrorState(container, err.message, loadMotorData);
  }
}

function renderMotorList() {
  const container = document.getElementById("motorListContainer");
  if (!appState.motorList || appState.motorList.length === 0) {
    renderEmptyState(
      container,
      "Belum ada motor",
      "Belum ada armada motor yang terdaftar di sistem. Mulai tambahkan unit pertama sekarang.",
      "➕ Tambah Motor",
      () => openTambahMotor()
    );
    return;
  }

  container.innerHTML = appState.motorList.map(item => `
    <div class="item-card" data-id="${item.id}">
      <div>
        <div class="card-top">
          <h4 class="card-title">${escapeHtml(item.merek_tipe)}</h4>
          <span class="card-badge-plate">${escapeHtml(item.plat_nomor)}</span>
        </div>
        <div class="card-meta-list">
          <div class="card-meta-row">
            <span>Harga Sewa:</span>
            <strong>${formatRupiah(item.harga_per_hari)} / hari</strong>
          </div>
          <div class="card-meta-row">
            <span>Status Ketersediaan:</span>
            ${item.tersedia 
              ? `<span class="badge badge-success">● Tersedia</span>` 
              : `<span class="badge badge-warning">● Disewa</span>`}
          </div>
        </div>
      </div>
      <div class="card-actions">
        <button class="btn btn-secondary btn-sm btn-edit-motor" data-id="${item.id}">✏️ Ubah</button>
        <button class="btn btn-outline-danger btn-sm btn-delete-motor" data-id="${item.id}" data-name="${escapeHtml(item.merek_tipe)}">🗑️ Hapus</button>
      </div>
    </div>
  `).join("");

  // Event listeners for Edit & Delete
  container.querySelectorAll(".btn-edit-motor").forEach(btn => {
    btn.addEventListener("click", () => openEditMotor(btn.dataset.id));
  });

  container.querySelectorAll(".btn-delete-motor").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      showConfirmModal(
        "Hapus Motor",
        `Apakah Anda yakin ingin menghapus motor "${name}"? Tindakan ini tidak dapat dibatalkan.`,
        () => executeDeleteMotor(id)
      );
    });
  });
}

function openTambahMotor() {
  document.getElementById("modalMotorTitle").textContent = "Tambah Motor";
  document.getElementById("motorId").value = "";
  document.getElementById("motorMerekTipe").value = "";
  document.getElementById("motorPlatNomor").value = "";
  document.getElementById("motorHargaPerHari").value = "";
  document.getElementById("motorTersedia").checked = true;
  clearErrors("formMotor");
  openModal("modalMotor");
}

function openEditMotor(id) {
  const motor = appState.motorList.find(m => m.id === id);
  if (!motor) return;

  document.getElementById("modalMotorTitle").textContent = "Ubah Motor";
  document.getElementById("motorId").value = motor.id;
  document.getElementById("motorMerekTipe").value = motor.merek_tipe;
  document.getElementById("motorPlatNomor").value = motor.plat_nomor;
  document.getElementById("motorHargaPerHari").value = motor.harga_per_hari;
  document.getElementById("motorTersedia").checked = Boolean(motor.tersedia);
  clearErrors("formMotor");
  openModal("modalMotor");
}

async function handleSaveMotor(e) {
  e.preventDefault();
  clearErrors("formMotor");

  const id = document.getElementById("motorId").value;
  const merek_tipe = document.getElementById("motorMerekTipe").value.trim();
  const plat_nomor = document.getElementById("motorPlatNomor").value.trim().toUpperCase();
  const harga_per_hari = parseInt(document.getElementById("motorHargaPerHari").value, 10);
  const tersedia = document.getElementById("motorTersedia").checked;

  // Acceptance Criteria & Schema Validation
  let hasError = false;
  if (!merek_tipe || merek_tipe.length < 1 || merek_tipe.length > 40) {
    showFieldError("err-motorMerekTipe", "Merek dan tipe wajib diisi (1 sampai 40 karakter).");
    hasError = true;
  }
  if (!plat_nomor || plat_nomor.length < 3 || plat_nomor.length > 12) {
    showFieldError("err-motorPlatNomor", "Plat nomor wajib diisi (3 sampai 12 karakter).");
    hasError = true;
  }
  if (isNaN(harga_per_hari) || harga_per_hari < 0) {
    showFieldError("err-motorHargaPerHari", "Harga sewa per hari harus angka bulat minimal 0.");
    hasError = true;
  }

  if (hasError) return;

  const btnSubmit = document.getElementById("btnSubmitMotor");
  btnSubmit.disabled = true;
  btnSubmit.textContent = "Menyimpan...";

  try {
    const motorData = {
      merek_tipe,
      plat_nomor,
      harga_per_hari,
      tersedia
    };

    if (firebaseState.isConnected) {
      if (id) {
        await updateDoc(doc(firebaseState.db, "motor", id), motorData);
        showToast("Motor berhasil diperbarui");
      } else {
        motorData.dibuat_pada = serverTimestamp();
        await addDoc(collection(firebaseState.db, "motor"), motorData);
        showToast("Motor berhasil ditambahkan");
      }
    } else {
      // Mock Storage
      const mock = getMockData();
      if (id) {
        const index = mock.motor.findIndex(m => m.id === id);
        if (index !== -1) {
          mock.motor[index] = { ...mock.motor[index], ...motorData };
        }
        showToast("Motor berhasil diperbarui (Mock)");
      } else {
        const newMotor = {
          id: generateId("Mt"),
          ...motorData,
          dibuat_pada: new Date()
        };
        mock.motor.push(newMotor);
        showToast("Motor berhasil ditambahkan (Mock)");
      }
      saveMockData(mock);
    }

    closeModal("modalMotor");
    await loadMotorData();
    if (appState.currentTab === "dasbor") loadDasborData();
  } catch (err) {
    console.error("Gagal simpan motor:", err);
    showToast(`Gagal menyimpan: ${err.message}`, "danger");
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = "Simpan Motor";
  }
}

async function executeDeleteMotor(id) {
  try {
    if (firebaseState.isConnected) {
      await deleteDoc(doc(firebaseState.db, "motor", id));
    } else {
      const mock = getMockData();
      mock.motor = mock.motor.filter(m => m.id !== id);
      saveMockData(mock);
    }
    showToast("Motor berhasil dihapus");
    closeModal("modalConfirm");
    await loadMotorData();
  } catch (err) {
    console.error("Gagal menghapus motor:", err);
    showToast(`Gagal menghapus: ${err.message}`, "danger");
  }
}

// ================= MODUL 2: PENYEWA =================
async function loadPenyewaData() {
  const container = document.getElementById("penyewaListContainer");
  renderLoadingState(container, "Memuat data penyewa...");

  try {
    if (firebaseState.isConnected) {
      const q = query(collection(firebaseState.db, "penyewa"), orderBy("nama"), limit(20));
      const snapshot = await getDocs(q);
      appState.penyewaList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      await new Promise(r => setTimeout(r, 200));
      const mock = getMockData();
      appState.penyewaList = mock.penyewa || [];
    }

    renderPenyewaList();
  } catch (err) {
    console.error("Gagal load penyewa:", err);
    renderErrorState(container, err.message, loadPenyewaData);
  }
}

function renderPenyewaList() {
  const container = document.getElementById("penyewaListContainer");
  const queryText = (appState.penyewaSearchQuery || "").toLowerCase();

  const filtered = (appState.penyewaList || []).filter(item => {
    if (!queryText) return true;
    return (
      (item.nama && item.nama.toLowerCase().includes(queryText)) ||
      (item.no_whatsapp && item.no_whatsapp.includes(queryText))
    );
  });

  if (filtered.length === 0) {
    if (queryText) {
      container.innerHTML = `
        <div class="state-container">
          <div class="state-icon">🔍</div>
          <h4 class="state-title">Tidak Ditemukan</h4>
          <p class="state-desc">Tidak ada data penyewa yang cocok dengan kata kunci "<strong>${escapeHtml(queryText)}</strong>".</p>
        </div>
      `;
    } else {
      renderEmptyState(
        container,
        "Belum ada penyewa",
        "Belum ada data pelanggan penyewa yang terdaftar. Tambahkan penyewa pertama untuk mulai transaksi sewa.",
        "➕ Tambah Penyewa",
        () => openTambahPenyewa()
      );
    }
    return;
  }

  container.innerHTML = filtered.map(item => `
    <div class="item-card" data-id="${item.id}">
      <div>
        <div class="card-top">
          <h4 class="card-title">${escapeHtml(item.nama)}</h4>
          <span class="badge badge-info">Jaminan: ${escapeHtml(item.jenis_jaminan)}</span>
        </div>
        <div class="card-meta-list">
          <div class="card-meta-row">
            <span>Nomor WhatsApp:</span>
            <strong>📱 ${escapeHtml(item.no_whatsapp)}</strong>
          </div>
          <div class="card-meta-row">
            <span>Kota Asal:</span>
            <span>📍 ${escapeHtml(item.asal_kota)}</span>
          </div>
        </div>
      </div>
      <div class="card-actions">
        <button class="btn btn-secondary btn-sm btn-edit-penyewa" data-id="${item.id}">✏️ Ubah</button>
        <button class="btn btn-outline-danger btn-sm btn-delete-penyewa" data-id="${item.id}" data-name="${escapeHtml(item.nama)}">🗑️ Hapus</button>
      </div>
    </div>
  `).join("");

  // Event Listeners
  container.querySelectorAll(".btn-edit-penyewa").forEach(btn => {
    btn.addEventListener("click", () => openEditPenyewa(btn.dataset.id));
  });

  container.querySelectorAll(".btn-delete-penyewa").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      showConfirmModal(
        "Hapus Penyewa",
        `Apakah Anda yakin ingin menghapus data penyewa "${name}" (${id})?`,
        () => executeDeletePenyewa(id)
      );
    });
  });
}

function openTambahPenyewa() {
  document.getElementById("modalPenyewaTitle").textContent = "Tambah Penyewa";
  document.getElementById("isEditPenyewa").value = "false";
  document.getElementById("penyewaNama").value = "";
  const noWhatsappInput = document.getElementById("penyewaNoWhatsapp");
  noWhatsappInput.value = "";
  noWhatsappInput.disabled = false;
  document.getElementById("penyewaAsalKota").value = "";
  document.getElementById("penyewaJenisJaminan").value = "";
  clearErrors("formPenyewa");
  openModal("modalPenyewa");
}

function openEditPenyewa(id) {
  const penyewa = appState.penyewaList.find(p => p.id === id);
  if (!penyewa) return;

  document.getElementById("modalPenyewaTitle").textContent = "Ubah Data Penyewa";
  document.getElementById("isEditPenyewa").value = "true";
  document.getElementById("penyewaNama").value = penyewa.nama;
  const noWhatsappInput = document.getElementById("penyewaNoWhatsapp");
  noWhatsappInput.value = penyewa.no_whatsapp;
  noWhatsappInput.disabled = true; // Sesuai skema: ID adalah nomor WhatsApp
  document.getElementById("penyewaAsalKota").value = penyewa.asal_kota;
  document.getElementById("penyewaJenisJaminan").value = penyewa.jenis_jaminan;
  clearErrors("formPenyewa");
  openModal("modalPenyewa");
}

async function handleSavePenyewa(e) {
  e.preventDefault();
  clearErrors("formPenyewa");

  const isEdit = document.getElementById("isEditPenyewa").value === "true";
  const nama = document.getElementById("penyewaNama").value.trim();
  const no_whatsapp = document.getElementById("penyewaNoWhatsapp").value.trim();
  const asal_kota = document.getElementById("penyewaAsalKota").value.trim();
  const jenis_jaminan = document.getElementById("penyewaJenisJaminan").value;

  // Validasi Skema & Acceptance Criteria
  let hasError = false;
  if (!nama || nama.length < 1 || nama.length > 60) {
    showFieldError("err-penyewaNama", "Nama wajib diisi (1 sampai 60 karakter).");
    hasError = true;
  }
  // WhatsApp: Diawali 08, total 10 sampai 13 angka
  const waRegex = /^08\d{8,11}$/;
  if (!no_whatsapp || !waRegex.test(no_whatsapp)) {
    showFieldError("err-penyewaNoWhatsapp", "Nomor WhatsApp wajib diawali 08 dan memiliki total 10 sampai 13 digit angka.");
    hasError = true;
  }
  if (!asal_kota || asal_kota.length < 1 || asal_kota.length > 40) {
    showFieldError("err-penyewaAsalKota", "Kota asal wajib diisi (1 sampai 40 karakter).");
    hasError = true;
  }
  if (!["KTP", "SIM", "Paspor"].includes(jenis_jaminan)) {
    showFieldError("err-penyewaJenisJaminan", "Jenis jaminan hanya boleh KTP, SIM, atau Paspor.");
    hasError = true;
  }

  if (hasError) return;

  const btnSubmit = document.getElementById("btnSubmitPenyewa");
  btnSubmit.disabled = true;
  btnSubmit.textContent = "Menyimpan...";

  try {
    const penyewaData = {
      nama,
      no_whatsapp,
      asal_kota,
      jenis_jaminan
    };

    if (firebaseState.isConnected) {
      if (!isEdit) {
        // Cek duplikasi nomor WhatsApp dengan getDoc
        const docRef = doc(firebaseState.db, "penyewa", no_whatsapp);
        const existing = await getDoc(docRef);
        if (existing.exists()) {
          showFieldError("err-penyewaNoWhatsapp", "Nomor WhatsApp sudah terdaftar.");
          btnSubmit.disabled = false;
          btnSubmit.textContent = "Simpan Penyewa";
          return;
        }
        penyewaData.dibuat_pada = serverTimestamp();
        await setDoc(docRef, penyewaData);
        showToast("Penyewa baru berhasil disimpan");
      } else {
        await updateDoc(doc(firebaseState.db, "penyewa", no_whatsapp), {
          nama,
          asal_kota,
          jenis_jaminan
        });
        showToast("Data penyewa berhasil diperbarui");
      }
    } else {
      // Mock Storage
      const mock = getMockData();
      if (!isEdit) {
        const existing = mock.penyewa.find(p => p.no_whatsapp === no_whatsapp);
        if (existing) {
          showFieldError("err-penyewaNoWhatsapp", "Nomor WhatsApp sudah terdaftar.");
          btnSubmit.disabled = false;
          btnSubmit.textContent = "Simpan Penyewa";
          return;
        }
        mock.penyewa.push({
          id: no_whatsapp,
          ...penyewaData,
          dibuat_pada: new Date()
        });
        showToast("Penyewa baru disimpan (Mock)");
      } else {
        const index = mock.penyewa.findIndex(p => p.id === no_whatsapp);
        if (index !== -1) {
          mock.penyewa[index] = { ...mock.penyewa[index], ...penyewaData };
        }
        showToast("Data penyewa diperbarui (Mock)");
      }
      saveMockData(mock);
    }

    closeModal("modalPenyewa");
    await loadPenyewaData();
  } catch (err) {
    console.error("Gagal simpan penyewa:", err);
    showToast(`Gagal menyimpan: ${err.message}`, "danger");
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = "Simpan Penyewa";
  }
}

async function executeDeletePenyewa(id) {
  try {
    if (firebaseState.isConnected) {
      await deleteDoc(doc(firebaseState.db, "penyewa", id));
    } else {
      const mock = getMockData();
      mock.penyewa = mock.penyewa.filter(p => p.id !== id);
      saveMockData(mock);
    }
    showToast("Data penyewa berhasil dihapus");
    closeModal("modalConfirm");
    await loadPenyewaData();
  } catch (err) {
    console.error("Gagal menghapus penyewa:", err);
    showToast(`Gagal menghapus: ${err.message}`, "danger");
  }
}

// ================= MODUL 3: SEWA =================
async function loadSewaData() {
  const container = document.getElementById("sewaListContainer");
  renderLoadingState(container, "Memuat riwayat transaksi sewa...");

  try {
    if (firebaseState.isConnected) {
      const q = query(collection(firebaseState.db, "sewa"), orderBy("dibuat_pada", "desc"), limit(20));
      const snapshot = await getDocs(q);
      appState.sewaList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      await new Promise(r => setTimeout(r, 200));
      const mock = getMockData();
      appState.sewaList = mock.sewa || [];
    }

    renderSewaList();
  } catch (err) {
    console.error("Gagal load sewa:", err);
    renderErrorState(container, err.message, loadSewaData);
  }
}

function renderSewaList() {
  const container = document.getElementById("sewaListContainer");
  const filter = appState.sewaStatusFilter;

  const filtered = (appState.sewaList || []).filter(item => {
    if (filter === "semua") return true;
    return item.status === filter;
  });

  if (filtered.length === 0) {
    renderEmptyState(
      container,
      filter === "semua" ? "Belum ada transaksi sewa" : `Belum ada sewa dengan status "${filter}"`,
      "Catat sewa baru untuk unit motor yang tersedia kepada tamu wisatawan.",
      "➕ Buat Sewa Baru",
      () => openTambahSewa()
    );
    return;
  }

  container.innerHTML = filtered.map(item => {
    const statusBadge = getStatusBadge(item.status);
    const actionButtons = renderStatusActionButtons(item);

    return `
      <div class="item-card" data-id="${item.id}">
        <div>
          <div class="card-top">
            <div>
              <h4 class="card-title">${escapeHtml(item.nama_motor || "Motor")}</h4>
              <span class="card-badge-plate">${escapeHtml(item.plat_nomor || "-")}</span>
            </div>
            ${statusBadge}
          </div>
          
          <div class="card-meta-list">
            <div class="card-meta-row">
              <span>Penyewa:</span>
              <strong>👤 ${escapeHtml(item.nama_penyewa || "-")} (${escapeHtml(item.penyewa_id || "-")})</strong>
            </div>
            <div class="card-meta-row">
              <span>Tanggal Mulai:</span>
              <span>📅 ${formatTanggal(item.tanggal_mulai)}</span>
            </div>
            <div class="card-meta-row">
              <span>Durasi & Tarif:</span>
              <span>${item.lama_hari} hari × ${formatRupiah(item.harga_per_hari)}</span>
            </div>
            <div class="card-meta-row" style="font-size: 0.95rem; margin-top: 0.25rem;">
              <span>Total Tagihan:</span>
              <strong style="color: var(--success);">${formatRupiah(item.total)}</strong>
            </div>
          </div>
        </div>

        <div class="card-actions">
          ${actionButtons}
        </div>
      </div>
    `;
  }).join("");

  // Event Listeners for Status Transitions
  container.querySelectorAll(".btn-status-change").forEach(btn => {
    btn.addEventListener("click", () => {
      const sewaId = btn.dataset.sewaId;
      const targetStatus = btn.dataset.targetStatus;
      const motorId = btn.dataset.motorId;
      handleChangeSewaStatus(sewaId, targetStatus, motorId);
    });
  });
}

function getStatusBadge(status) {
  switch (status) {
    case "dipesan":
      return `<span class="badge badge-warning">🕒 Dipesan</span>`;
    case "berjalan":
      return `<span class="badge badge-info">🛵 Berjalan</span>`;
    case "selesai":
      return `<span class="badge badge-success">✅ Selesai</span>`;
    case "dibatalkan":
      return `<span class="badge badge-danger">❌ Dibatalkan</span>`;
    default:
      return `<span class="badge badge-neutral">${escapeHtml(status)}</span>`;
  }
}

function renderStatusActionButtons(item) {
  // Sesuai tabel status di PRD:
  // - dipesan -> berjalan ATAU dibatalkan
  // - berjalan -> selesai
  // - selesai & dibatalkan -> tidak ada aksi
  if (item.status === "dipesan") {
    return `
      <button class="btn btn-secondary btn-sm btn-status-change" data-sewa-id="${item.id}" data-target-status="dibatalkan" data-motor-id="${item.motor_id}">
        🚫 Batalkan
      </button>
      <button class="btn btn-primary btn-sm btn-status-change" data-sewa-id="${item.id}" data-target-status="berjalan" data-motor-id="${item.motor_id}">
        🔑 Serahkan (Berjalan)
      </button>
    `;
  } else if (item.status === "berjalan") {
    return `
      <button class="btn btn-primary btn-sm btn-status-change" data-sewa-id="${item.id}" data-target-status="selesai" data-motor-id="${item.motor_id}">
        🏁 Kembalikan (Selesai)
      </button>
    `;
  } else {
    return `<span class="form-hint" style="margin: 0;">Selesai / Ditutup</span>`;
  }
}

async function openTambahSewa() {
  clearErrors("formSewa");
  
  // Ambil daftar motor dan penyewa terbaru
  if (firebaseState.isConnected) {
    const qMotor = query(collection(firebaseState.db, "motor"), orderBy("merek_tipe"), limit(30));
    const snapMotor = await getDocs(qMotor);
    appState.motorList = snapMotor.docs.map(d => ({ id: d.id, ...d.data() }));

    const qPenyewa = query(collection(firebaseState.db, "penyewa"), orderBy("nama"), limit(30));
    const snapPenyewa = await getDocs(qPenyewa);
    appState.penyewaList = snapPenyewa.docs.map(d => ({ id: d.id, ...d.data() }));
  } else {
    const mock = getMockData();
    appState.motorList = mock.motor || [];
    appState.penyewaList = mock.penyewa || [];
  }

  // Populate Motor Select (Hanya motor yang tersedia == true)
  const motorSelect = document.getElementById("sewaMotorSelect");
  const availableMotors = appState.motorList.filter(m => m.tersedia === true);
  
  motorSelect.innerHTML = `<option value="">-- Pilih Unit Motor --</option>` +
    availableMotors.map(m => `
      <option value="${m.id}" data-harga="${m.harga_per_hari}" data-nama="${escapeHtml(m.merek_tipe)}" data-plat="${escapeHtml(m.plat_nomor)}">
        ${escapeHtml(m.merek_tipe)} (${escapeHtml(m.plat_nomor)}) - ${formatRupiah(m.harga_per_hari)}/hari
      </option>
    `).join("");

  // Populate Penyewa Select
  const penyewaSelect = document.getElementById("sewaPenyewaSelect");
  penyewaSelect.innerHTML = `<option value="">-- Pilih Penyewa --</option>` +
    appState.penyewaList.map(p => `
      <option value="${p.id}" data-nama="${escapeHtml(p.nama)}">
        ${escapeHtml(p.nama)} (${p.no_whatsapp})
      </option>
    `).join("");

  // Default tanggal hari ini
  document.getElementById("sewaTanggalMulai").value = new Date().toISOString().split("T")[0];
  document.getElementById("sewaLamaHari").value = "1";

  updateSewaCalculation();
  openModal("modalSewa");
}

function updateSewaCalculation() {
  const motorSelect = document.getElementById("sewaMotorSelect");
  const selectedOption = motorSelect.options[motorSelect.selectedIndex];
  const harga = selectedOption && selectedOption.dataset.harga ? parseInt(selectedOption.dataset.harga, 10) : 0;
  const durasi = parseInt(document.getElementById("sewaLamaHari").value, 10) || 1;
  const total = harga * durasi;

  document.getElementById("sewaCalcHargaHari").textContent = formatRupiah(harga);
  document.getElementById("sewaCalcDurasi").textContent = `${durasi} Hari`;
  document.getElementById("sewaCalcTotal").textContent = formatRupiah(total);
}

async function handleSaveSewa(e) {
  e.preventDefault();
  clearErrors("formSewa");

  const motorSelect = document.getElementById("sewaMotorSelect");
  const penyewaSelect = document.getElementById("sewaPenyewaSelect");
  const motorOption = motorSelect.options[motorSelect.selectedIndex];
  const penyewaOption = penyewaSelect.options[penyewaSelect.selectedIndex];

  const motor_id = motorSelect.value;
  const penyewa_id = penyewaSelect.value;
  const tanggal_mulai = document.getElementById("sewaTanggalMulai").value;
  const lama_hari = parseInt(document.getElementById("sewaLamaHari").value, 10);

  // Validasi
  let hasError = false;
  if (!motor_id) {
    showFieldError("err-sewaMotorSelect", "Silakan pilih motor yang tersedia.");
    hasError = true;
  }
  if (!penyewa_id) {
    showFieldError("err-sewaPenyewaSelect", "Silakan pilih data penyewa.");
    hasError = true;
  }
  if (!tanggal_mulai) {
    showFieldError("err-sewaTanggalMulai", "Tanggal mulai sewa wajib diisi.");
    hasError = true;
  }
  if (isNaN(lama_hari) || lama_hari < 1 || lama_hari > 30) {
    showFieldError("err-sewaLamaHari", "Lama hari sewa harus antara 1 sampai 30 hari.");
    hasError = true;
  }

  if (hasError) return;

  const nama_motor = motorOption.dataset.nama;
  const plat_nomor = motorOption.dataset.plat;
  const harga_per_hari = parseInt(motorOption.dataset.harga, 10);
  const nama_penyewa = penyewaOption.dataset.nama;
  const total = harga_per_hari * lama_hari;

  const btnSubmit = document.getElementById("btnSubmitSewa");
  btnSubmit.disabled = true;
  btnSubmit.textContent = "Menyimpan Transaksi...";

  try {
    const sewaData = {
      motor_id,
      nama_motor,
      plat_nomor,
      penyewa_id,
      nama_penyewa,
      harga_per_hari,
      tanggal_mulai,
      lama_hari,
      total,
      status: "dipesan" // Status awal selalu dipesan
    };

    if (firebaseState.isConnected) {
      sewaData.dibuat_pada = serverTimestamp();
      await addDoc(collection(firebaseState.db, "sewa"), sewaData);
      showToast("Sewa baru berhasil dibuat");
    } else {
      const mock = getMockData();
      mock.sewa.push({
        id: generateId("Sw"),
        ...sewaData,
        dibuat_pada: new Date()
      });
      saveMockData(mock);
      showToast("Sewa baru berhasil dibuat (Mock)");
    }

    closeModal("modalSewa");
    await loadSewaData();
    if (appState.currentTab === "dasbor") loadDasborData();
  } catch (err) {
    console.error("Gagal simpan sewa:", err);
    showToast(`Gagal menyimpan: ${err.message}`, "danger");
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = "Simpan Sewa";
  }
}

async function handleChangeSewaStatus(sewaId, targetStatus, motorId) {
  // Validasi alur status sesuai PRD
  const sewa = appState.sewaList.find(s => s.id === sewaId);
  if (!sewa) return;

  const currentStatus = sewa.status;
  const validTransitions = {
    dipesan: ["berjalan", "dibatalkan"],
    berjalan: ["selesai"],
    selesai: [],
    dibatalkan: []
  };

  if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(targetStatus)) {
    showToast(`Transisi status tidak sah dari ${currentStatus} ke ${targetStatus}!`, "danger");
    return;
  }

  try {
    if (firebaseState.isConnected) {
      // Update status sewa
      await updateDoc(doc(firebaseState.db, "sewa", sewaId), { status: targetStatus });

      // Update ketersediaan motor:
      // berjalan -> motor tidak tersedia (false)
      // selesai atau dibatalkan -> motor tersedia kembali (true)
      if (targetStatus === "berjalan") {
        await updateDoc(doc(firebaseState.db, "motor", motorId), { tersedia: false });
      } else if (targetStatus === "selesai" || targetStatus === "dibatalkan") {
        await updateDoc(doc(firebaseState.db, "motor", motorId), { tersedia: true });
      }
    } else {
      // Mock Storage
      const mock = getMockData();
      const sIdx = mock.sewa.findIndex(s => s.id === sewaId);
      if (sIdx !== -1) {
        mock.sewa[sIdx].status = targetStatus;
      }

      const mIdx = mock.motor.findIndex(m => m.id === motorId);
      if (mIdx !== -1) {
        if (targetStatus === "berjalan") {
          mock.motor[mIdx].tersedia = false;
        } else if (targetStatus === "selesai" || targetStatus === "dibatalkan") {
          mock.motor[mIdx].tersedia = true;
        }
      }
      saveMockData(mock);
    }

    showToast(`Status sewa berhasil diubah ke "${targetStatus}"`);
    await loadSewaData();
    if (appState.currentTab === "dasbor") loadDasborData();
  } catch (err) {
    console.error("Gagal ubah status:", err);
    showToast(`Gagal mengubah status: ${err.message}`, "danger");
  }
}

// ================= MODUL 4: DASBOR =================
async function loadDasborData() {
  const container = document.getElementById("dasborSewaBerjalanContainer");
  renderLoadingState(container, "Menghitung ringkasan dasbor...");

  try {
    let motors = [];
    let sewas = [];

    if (firebaseState.isConnected) {
      const snapM = await getDocs(collection(firebaseState.db, "motor"));
      motors = snapM.docs.map(d => ({ id: d.id, ...d.data() }));

      const snapS = await getDocs(collection(firebaseState.db, "sewa"));
      sewas = snapS.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      await new Promise(r => setTimeout(r, 200));
      const mock = getMockData();
      motors = mock.motor || [];
      sewas = mock.sewa || [];
    }

    // 1. Hitung unit tersedia & disewa
    const countTersedia = motors.filter(m => m.tersedia === true).length;
    const countDisewa = motors.filter(m => m.tersedia === false).length;

    document.getElementById("statMotorTersedia").textContent = `${countTersedia} Unit`;
    document.getElementById("statMotorDisewa").textContent = `${countDisewa} Unit`;

    // 2. Hitung Pendapatan dari sewa berstatus 'selesai' pada tanggal terpilih
    const selectedDate = document.getElementById("filterTanggalDasbor").value || appState.dasborTanggalFilter;
    const selesaiPadaTanggal = sewas.filter(s => s.status === "selesai" && s.tanggal_mulai === selectedDate);
    const totalPendapatan = selesaiPadaTanggal.reduce((acc, curr) => acc + (curr.total || 0), 0);

    document.getElementById("statPendapatan").textContent = formatRupiah(totalPendapatan);
    document.getElementById("statPendapatanDateHint").textContent = `Mulai sewa tanggal ${formatTanggal(selectedDate)}`;

    // 3. Sewa yang sedang Berjalan
    const sewaBerjalan = sewas.filter(s => s.status === "berjalan");
    document.getElementById("countSewaBerjalan").textContent = `${sewaBerjalan.length} unit`;

    if (sewaBerjalan.length === 0) {
      renderEmptyState(
        container,
        "Tidak ada sewa berjalan",
        "Saat ini tidak ada unit motor yang sedang dibawa penyewa di jalanan.",
        null,
        null
      );
    } else {
      container.innerHTML = sewaBerjalan.map(item => `
        <div class="item-card">
          <div class="card-top">
            <div>
              <h4 class="card-title">${escapeHtml(item.nama_motor)}</h4>
              <span class="card-badge-plate">${escapeHtml(item.plat_nomor)}</span>
            </div>
            <span class="badge badge-info">🛵 Sedang Jalan</span>
          </div>
          <div class="card-meta-list">
            <div class="card-meta-row">
              <span>Penyewa:</span>
              <strong>${escapeHtml(item.nama_penyewa)}</strong>
            </div>
            <div class="card-meta-row">
              <span>Mulai Sewa:</span>
              <span>${formatTanggal(item.tanggal_mulai)} (${item.lama_hari} hari)</span>
            </div>
            <div class="card-meta-row">
              <span>Nilai Kontrak:</span>
              <strong style="color: var(--success);">${formatRupiah(item.total)}</strong>
            </div>
          </div>
          <div class="card-actions">
            <button class="btn btn-primary btn-sm btn-status-change" data-sewa-id="${item.id}" data-target-status="selesai" data-motor-id="${item.motor_id}">
              🏁 Kembalikan (Selesai)
            </button>
          </div>
        </div>
      `).join("");

      container.querySelectorAll(".btn-status-change").forEach(btn => {
        btn.addEventListener("click", () => {
          handleChangeSewaStatus(btn.dataset.sewaId, btn.dataset.targetStatus, btn.dataset.motorId);
        });
      });
    }

  } catch (err) {
    console.error("Gagal load dasbor:", err);
    renderErrorState(container, err.message, loadDasborData);
  }
}

// ================= UTILITIES & HELPERS =================
function escapeHtml(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showFieldError(errorElementId, message) {
  const el = document.getElementById(errorElementId);
  if (el) el.textContent = message;
}

function clearErrors(formId) {
  const form = document.getElementById(formId);
  if (form) {
    form.querySelectorAll(".form-error").forEach(el => el.textContent = "");
  }
}

// ================= EVENT LISTENERS INITIALIZATION =================
document.addEventListener("DOMContentLoaded", () => {
  // Set default dasbor filter date
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("filterTanggalDasbor").value = today;

  // Initialize Connection status
  updateConnectionBadge();

  // Navigation clicks (Desktop & Bottom Mobile)
  document.querySelectorAll(".nav-btn, .bnav-btn").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.target));
  });

  // Modal Close buttons
  document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => closeModal(btn.dataset.close));
  });

  // Close modals clicking outside backdrop
  document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) backdrop.classList.remove("show");
    });
  });

  // Connection badge click -> open Firebase config modal
  document.getElementById("dataModeBadge").addEventListener("click", () => {
    const saved = loadSavedFirebaseConfig();
    const textarea = document.getElementById("inputFirebaseConfigJson");
    if (saved) {
      textarea.value = JSON.stringify(saved, null, 2);
    }
    openModal("modalFirebaseConfig");
  });

  // Save Firebase Config
  document.getElementById("btnSaveFirebaseConfig").addEventListener("click", () => {
    const val = document.getElementById("inputFirebaseConfigJson").value.trim();
    try {
      const parsed = JSON.parse(val);
      saveFirebaseConfig(parsed);
      showToast("Konfigurasi Firebase disimpan. Me-reload aplikasi...");
      setTimeout(() => window.location.reload(), 1000);
    } catch (e) {
      alert("Format JSON tidak valid. Pastikan format object JSON lengkap dengan tanda kutip dua.");
    }
  });

  // Reset to Mock
  document.getElementById("btnResetToMock").addEventListener("click", () => {
    clearFirebaseConfig();
    showToast("Beralih ke mode Mock Data. Me-reload...");
    setTimeout(() => window.location.reload(), 800);
  });

  // Confirm Modal Action
  document.getElementById("btnConfirmAction").addEventListener("click", () => {
    if (typeof appState.pendingConfirmAction === "function") {
      appState.pendingConfirmAction();
    }
  });

  // Motor Buttons & Form
  document.getElementById("btnOpenTambahMotor").addEventListener("click", openTambahMotor);
  document.getElementById("formMotor").addEventListener("submit", handleSaveMotor);

  // Penyewa Buttons & Form
  document.getElementById("btnOpenTambahPenyewa").addEventListener("click", openTambahPenyewa);
  document.getElementById("formPenyewa").addEventListener("submit", handleSavePenyewa);

  // Penyewa Search
  const searchInput = document.getElementById("inputSearchPenyewa");
  const btnClearSearch = document.getElementById("btnClearSearchPenyewa");

  searchInput.addEventListener("input", (e) => {
    appState.penyewaSearchQuery = e.target.value.trim();
    btnClearSearch.style.display = appState.penyewaSearchQuery ? "block" : "none";
    renderPenyewaList();
  });

  btnClearSearch.addEventListener("click", () => {
    searchInput.value = "";
    appState.penyewaSearchQuery = "";
    btnClearSearch.style.display = "none";
    renderPenyewaList();
  });

  // Sewa Buttons & Form
  document.getElementById("btnOpenTambahSewa").addEventListener("click", openTambahSewa);
  document.getElementById("formSewa").addEventListener("submit", handleSaveSewa);
  document.getElementById("sewaMotorSelect").addEventListener("change", updateSewaCalculation);
  document.getElementById("sewaLamaHari").addEventListener("input", updateSewaCalculation);

  // Sewa Status Tabs
  document.querySelectorAll("#sewaTabs .tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#sewaTabs .tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      appState.sewaStatusFilter = btn.dataset.status;
      renderSewaList();
    });
  });

  // Dasbor Filter & Refresh
  document.getElementById("btnTerapkanFilterDasbor").addEventListener("click", loadDasborData);
  document.getElementById("btnRefreshDasbor").addEventListener("click", loadDasborData);

  // Initial load view
  switchTab("dasbor");
});
