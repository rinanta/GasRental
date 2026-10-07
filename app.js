/**
 * GAS RENTAL - APLIKASI CRUD RENTAL MOTOR
 * Sesuai Dokumen PRD & Skema Firestore Gas Rental
 * Tampilan Profesional, Bersih, Tanpa Emotikon, Tanpa Efek Bubble
 */

// Data contoh dari Skema Firestore Gas Rental (Bagian 3)
const initialMotorData = [
  {
    id: "Mt45bRw",
    merek_tipe: "Honda Vario 125",
    plat_nomor: "DK 1234 AB",
    harga_per_hari: 80000,
    tersedia: true,
    dibuat_pada: "1 Oktober 2026 08.00"
  },
  {
    id: "Mt67kLm",
    merek_tipe: "Yamaha NMAX 155",
    plat_nomor: "DK 5678 CD",
    harga_per_hari: 120000,
    tersedia: false,
    dibuat_pada: "1 Oktober 2026 08.30"
  },
  {
    id: "Mt89xYz",
    merek_tipe: "Honda Scoopy",
    plat_nomor: "DK 9012 EF",
    harga_per_hari: 75000,
    tersedia: true,
    dibuat_pada: "1 Oktober 2026 09.00"
  }
];

// State lokal
let motorList = [...initialMotorData];
let pendingDeleteId = null;
let isSimulatingError = false;

// Format Rupiah
function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(number);
}

// Notifikasi Toast Ringkas & Bebas Emotikon
function showToast(message) {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.25s ease";
    setTimeout(() => toast.remove(), 250);
  }, 2800);
}

// ================= TIGA STATE (MINIMALIS & PROFESIONAL) =================

// 1. Loading State
function renderLoadingState(container, text = "Memuat data armada motor...") {
  container.innerHTML = `
    <div class="state-box">
      <div class="spinner"></div>
      <h3 class="state-title">${text}</h3>
      <p class="state-desc">Mohon tunggu sebentar, sistem sedang memproses data.</p>
    </div>
  `;
}

// 2. Empty State
function renderEmptyState(container) {
  container.innerHTML = `
    <div class="state-box">
      <h3 class="state-title">Belum ada motor</h3>
      <p class="state-desc">Belum ada unit motor yang terdaftar di sistem. Silakan tambahkan unit motor pertama.</p>
      <button class="btn btn-primary" id="btnEmptyTambahMotor">Tambah Motor</button>
    </div>
  `;

  const btn = container.querySelector("#btnEmptyTambahMotor");
  if (btn) {
    btn.addEventListener("click", openTambahMotor);
  }
}

// 3. Error State
function renderErrorState(container, errorMsg, onRetry) {
  container.innerHTML = `
    <div class="state-box">
      <h3 class="state-title">Terjadi Kesalahan</h3>
      <p class="state-desc">${errorMsg || "Gagal memuat data. Silakan periksa koneksi jaringan Anda."}</p>
      <button class="btn btn-secondary" id="btnErrorRetry">Coba Lagi</button>
    </div>
  `;

  const retryBtn = container.querySelector("#btnErrorRetry");
  if (retryBtn && onRetry) {
    retryBtn.addEventListener("click", onRetry);
  }
}

// ================= RENDER DAFTAR MOTOR =================

async function fetchAndRenderMotorList() {
  const container = document.getElementById("motorListContainer");
  if (!container) return;

  // Tampilkan Loading State
  renderLoadingState(container, "Memuat armada motor...");

  // Waktu proses singkat
  await new Promise(resolve => setTimeout(resolve, 350));

  // Penanganan Error State
  if (isSimulatingError) {
    isSimulatingError = false;
    renderErrorState(
      container,
      "Gagal mengambil data dari server. Silakan coba kembali.",
      () => fetchAndRenderMotorList()
    );
    return;
  }

  // Penanganan Empty State
  if (!motorList || motorList.length === 0) {
    renderEmptyState(container);
    return;
  }

  // Tampilan Daftar Kartu Persegi & Presisi
  container.innerHTML = motorList.map(item => `
    <div class="motor-card" data-id="${item.id}">
      <div>
        <div class="motor-card-header">
          <div>
            <h2 class="motor-card-title">${escapeHtml(item.merek_tipe)}</h2>
            <span class="motor-plate">${escapeHtml(item.plat_nomor)}</span>
          </div>
          <span class="status-tag ${item.tersedia ? 'tersedia' : 'disewa'}">
            ${item.tersedia ? 'Tersedia' : 'Disewa'}
          </span>
        </div>
        
        <div class="motor-meta">
          <div class="motor-meta-row">
            <span>Tarif Sewa:</span>
            <strong>${formatRupiah(item.harga_per_hari)} / hari</strong>
          </div>
          <div class="motor-meta-row">
            <span>Status Unit:</span>
            <span>${item.tersedia ? 'Siap Disewakan' : 'Sedang Dipinjam'}</span>
          </div>
        </div>
      </div>

      <div class="motor-actions">
        <button class="btn btn-secondary btn-sm btn-edit-motor" data-id="${item.id}">
          Ubah
        </button>
        <button class="btn btn-outline-danger btn-sm btn-delete-motor" data-id="${item.id}" data-name="${escapeHtml(item.merek_tipe)}">
          Hapus
        </button>
      </div>
    </div>
  `).join("");

  // Event Listener Tombol Ubah
  container.querySelectorAll(".btn-edit-motor").forEach(btn => {
    btn.addEventListener("click", () => openEditMotor(btn.dataset.id));
  });

  // Event Listener Tombol Hapus (Dialog Konfirmasi)
  container.querySelectorAll(".btn-delete-motor").forEach(btn => {
    btn.addEventListener("click", () => {
      openConfirmHapus(btn.dataset.id, btn.dataset.name);
    });
  });
}

// Escape HTML
function escapeHtml(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Buka Modal Tambah Motor
function openTambahMotor() {
  const modal = document.getElementById("modalMotor");
  if (!modal) return;
  
  document.getElementById("modalMotorTitle").textContent = "Tambah Motor";
  document.getElementById("motorId").value = "";
  document.getElementById("formMotor").reset();
  document.getElementById("motorTersedia").checked = true;
  document.getElementById("btnSubmitMotor").textContent = "Simpan Motor";
  clearErrors();

  modal.classList.add("show");
}

// Buka Modal Ubah Motor
function openEditMotor(id) {
  const motor = motorList.find(m => m.id === id);
  if (!motor) return;

  const modal = document.getElementById("modalMotor");
  if (!modal) return;

  document.getElementById("modalMotorTitle").textContent = "Ubah Motor";
  document.getElementById("motorId").value = motor.id;
  document.getElementById("motorMerekTipe").value = motor.merek_tipe;
  document.getElementById("motorPlatNomor").value = motor.plat_nomor;
  document.getElementById("motorHargaPerHari").value = motor.harga_per_hari;
  document.getElementById("motorTersedia").checked = Boolean(motor.tersedia);
  document.getElementById("btnSubmitMotor").textContent = "Simpan Perubahan";
  clearErrors();

  modal.classList.add("show");
}

// Buka Dialog Konfirmasi Hapus
function openConfirmHapus(id, name) {
  pendingDeleteId = id;
  const msgEl = document.getElementById("confirmModalMessage");
  if (msgEl) {
    msgEl.textContent = `Apakah Anda yakin ingin menghapus data motor "${name}"? Tindakan ini tidak dapat dibatalkan.`;
  }
  const modal = document.getElementById("modalConfirm");
  if (modal) modal.classList.add("show");
}

// Eksekusi Hapus Motor
function handleKonfirmasiHapus() {
  if (!pendingDeleteId) return;

  const deletedMotor = motorList.find(m => m.id === pendingDeleteId);
  motorList = motorList.filter(m => m.id !== pendingDeleteId);
  pendingDeleteId = null;

  closeModal("modalConfirm");
  fetchAndRenderMotorList();
  showToast(`Motor "${deletedMotor ? deletedMotor.merek_tipe : ""}" berhasil dihapus.`);
}

// Tutup Modal
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("show");
  if (modalId === "modalConfirm") {
    pendingDeleteId = null;
  }
}

function clearErrors() {
  document.querySelectorAll(".form-error").forEach(el => el.textContent = "");
}

// Simpan Motor (Tambah / Ubah)
function handleSimpanMotor(e) {
  e.preventDefault();
  clearErrors();

  const id = document.getElementById("motorId").value;
  const merek_tipe = document.getElementById("motorMerekTipe").value.trim();
  const plat_nomor = document.getElementById("motorPlatNomor").value.trim().toUpperCase();
  const harga_per_hari = parseInt(document.getElementById("motorHargaPerHari").value, 10);
  const tersedia = document.getElementById("motorTersedia").checked;

  let hasError = false;

  if (!merek_tipe || merek_tipe.length < 1 || merek_tipe.length > 40) {
    document.getElementById("err-motorMerekTipe").textContent = "Merek dan tipe wajib diisi (1 sampai 40 karakter).";
    hasError = true;
  }
  if (!plat_nomor || plat_nomor.length < 3 || plat_nomor.length > 12) {
    document.getElementById("err-motorPlatNomor").textContent = "Plat nomor wajib diisi (3 sampai 12 karakter).";
    hasError = true;
  }
  if (isNaN(harga_per_hari) || harga_per_hari < 0) {
    document.getElementById("err-motorHargaPerHari").textContent = "Harga per hari harus angka bulat minimal 0.";
    hasError = true;
  }

  if (hasError) return;

  if (id) {
    // Mode Ubah
    const index = motorList.findIndex(m => m.id === id);
    if (index !== -1) {
      motorList[index] = {
        ...motorList[index],
        merek_tipe,
        plat_nomor,
        harga_per_hari,
        tersedia
      };
      showToast(`Data motor "${merek_tipe}" berhasil diperbarui.`);
    }
  } else {
    // Mode Tambah
    const newMotor = {
      id: `Mt${Math.random().toString(36).substring(2, 7)}`,
      merek_tipe,
      plat_nomor,
      harga_per_hari,
      tersedia,
      dibuat_pada: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
    };
    motorList.unshift(newMotor);
    showToast(`Motor "${merek_tipe}" berhasil ditambahkan.`);
  }

  fetchAndRenderMotorList();
  closeModal("modalMotor");
}

// Inisialisasi saat DOM siap
document.addEventListener("DOMContentLoaded", () => {
  // Navigasi Tabs
  const navButtons = document.querySelectorAll(".nav-btn, .bnav-btn");
  const viewPanels = document.querySelectorAll(".view-panel");

  function switchTab(targetId) {
    navButtons.forEach(btn => {
      if (btn.dataset.target === targetId) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    viewPanels.forEach(panel => {
      if (panel.id === `view-${targetId}`) {
        panel.classList.add("active");
      } else {
        panel.classList.remove("active");
      }
    });
  }

  navButtons.forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.target));
  });

  // Tombol Tambah Motor
  const btnOpenTambah = document.getElementById("btnOpenTambahMotor");
  if (btnOpenTambah) {
    btnOpenTambah.addEventListener("click", openTambahMotor);
  }

  // Tombol Segarkan
  const btnRefresh = document.getElementById("btnRefreshMotor");
  if (btnRefresh) {
    btnRefresh.addEventListener("click", () => fetchAndRenderMotorList());
  }

  // Tombol Konfirmasi Hapus Modal
  const btnConfirmHapus = document.getElementById("btnConfirmHapus");
  if (btnConfirmHapus) {
    btnConfirmHapus.addEventListener("click", handleKonfirmasiHapus);
  }

  // Tutup Modal
  document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => closeModal(btn.dataset.close));
  });

  document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) closeModal(backdrop.id);
    });
  });

  // Form Submit
  const formMotor = document.getElementById("formMotor");
  if (formMotor) {
    formMotor.addEventListener("submit", handleSimpanMotor);
  }

  // Render awal
  fetchAndRenderMotorList();
  switchTab("motor");
});
