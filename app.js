/**
 * GAS RENTAL - APLIKASI CRUD RENTAL MOTOR
 * Tahap 3: Menambahkan Tombol Ubah dan Hapus dengan Dialog Konfirmasi
 * Sesuai Dokumen PRD & Skema Firestore Gas Rental
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

// State lokal koleksi motor
let motorList = [...initialMotorData];

// ID motor yang sedang menunggu konfirmasi hapus
let pendingDeleteId = null;

// Format Rupiah
function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(number);
}

// Notifikasi Toast
function showToast(message) {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span>✅</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Render Daftar Motor (Termasuk Tombol Ubah & Hapus)
function renderMotorList() {
  const container = document.getElementById("motorListContainer");
  if (!container) return;

  container.innerHTML = motorList.map(item => `
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
            <span>Ketersediaan:</span>
            ${item.tersedia 
              ? `<span class="badge badge-success">● Tersedia</span>` 
              : `<span class="badge badge-warning">● Disewa</span>`}
          </div>
        </div>
      </div>

      <!-- Tombol Ubah dan Hapus -->
      <div class="card-actions">
        <button class="btn btn-secondary btn-sm btn-edit-motor" data-id="${item.id}">
          ✏️ Ubah
        </button>
        <button class="btn btn-outline-danger btn-sm btn-delete-motor" data-id="${item.id}" data-name="${escapeHtml(item.merek_tipe)}">
          🗑️ Hapus
        </button>
      </div>
    </div>
  `).join("");

  // Pasang Event Listener Tombol Ubah
  container.querySelectorAll(".btn-edit-motor").forEach(btn => {
    btn.addEventListener("click", () => {
      openEditMotor(btn.dataset.id);
    });
  });

  // Pasang Event Listener Tombol Hapus (Membuka Dialog Konfirmasi)
  container.querySelectorAll(".btn-delete-motor").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      openConfirmHapus(id, name);
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
    msgEl.textContent = `Apakah Anda yakin ingin menghapus motor "${name}"? Tindakan ini tidak dapat dibatalkan.`;
  }
  const modal = document.getElementById("modalConfirm");
  if (modal) modal.classList.add("show");
}

// Eksekusi Hapus Motor Setelah Konfirmasi
function handleKonfirmasiHapus() {
  if (!pendingDeleteId) return;

  const deletedMotor = motorList.find(m => m.id === pendingDeleteId);
  motorList = motorList.filter(m => m.id !== pendingDeleteId);
  pendingDeleteId = null;

  closeModal("modalConfirm");
  renderMotorList();
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

// Simpan Motor (Tambah Baru atau Perbarui yang Ada)
function handleSimpanMotor(e) {
  e.preventDefault();
  clearErrors();

  const id = document.getElementById("motorId").value;
  const merek_tipe = document.getElementById("motorMerekTipe").value.trim();
  const plat_nomor = document.getElementById("motorPlatNomor").value.trim().toUpperCase();
  const harga_per_hari = parseInt(document.getElementById("motorHargaPerHari").value, 10);
  const tersedia = document.getElementById("motorTersedia").checked;

  let hasError = false;

  // Validasi sesuai Skema Firestore (Koleksi motor)
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
      showToast(`Data motor "${merek_tipe}" berhasil diperbarui!`);
    }
  } else {
    // Mode Tambah Baru
    const newMotor = {
      id: `Mt${Math.random().toString(36).substring(2, 7)}`,
      merek_tipe,
      plat_nomor,
      harga_per_hari,
      tersedia,
      dibuat_pada: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
    };
    motorList.unshift(newMotor);
    showToast(`Motor "${merek_tipe}" berhasil ditambahkan!`);
  }

  renderMotorList();
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

  // Tombol Buka Modal Tambah Motor
  const btnOpenTambah = document.getElementById("btnOpenTambahMotor");
  if (btnOpenTambah) {
    btnOpenTambah.addEventListener("click", openTambahMotor);
  }

  // Tombol Konfirmasi Hapus Modal
  const btnConfirmHapus = document.getElementById("btnConfirmHapus");
  if (btnConfirmHapus) {
    btnConfirmHapus.addEventListener("click", handleKonfirmasiHapus);
  }

  // Event Tutup Modal (Tombol Batal dan X)
  document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => closeModal(btn.dataset.close));
  });

  document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) closeModal(backdrop.id);
    });
  });

  // Submit Formulir Motor
  const formMotor = document.getElementById("formMotor");
  if (formMotor) {
    formMotor.addEventListener("submit", handleSimpanMotor);
  }

  // Render awal daftar motor
  renderMotorList();
  switchTab("motor");
});
