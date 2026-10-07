/**
 * GAS RENTAL - APLIKASI CRUD RENTAL MOTOR
 * Tahap 2: Daftar & Formulir Tambah untuk Koleksi Pertama (motor)
 * Sesuai Dokumen Skema Firestore Gas Rental
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

// Render Daftar Motor
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
    </div>
  `).join("");
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
  
  // Reset form
  document.getElementById("formMotor").reset();
  document.getElementById("motorTersedia").checked = true;
  clearErrors();

  modal.classList.add("show");
}

// Tutup Modal
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("show");
}

function clearErrors() {
  document.querySelectorAll(".form-error").forEach(el => el.textContent = "");
}

// Simpan Motor Baru
function handleSimpanMotor(e) {
  e.preventDefault();
  clearErrors();

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

  // Buat ID baru & Dokumen baru persis sesuai skema
  const newMotor = {
    id: `Mt${Math.random().toString(36).substring(2, 7)}`,
    merek_tipe,
    plat_nomor,
    harga_per_hari,
    tersedia,
    dibuat_pada: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
  };

  motorList.unshift(newMotor);
  renderMotorList();
  closeModal("modalMotor");
  showToast(`Motor "${merek_tipe}" berhasil ditambahkan!`);
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

  // Event Tombol Buka Modal Tambah Motor
  const btnOpenTambah = document.getElementById("btnOpenTambahMotor");
  if (btnOpenTambah) {
    btnOpenTambah.addEventListener("click", openTambahMotor);
  }

  // Event Tutup Modal
  document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => closeModal(btn.dataset.close));
  });

  document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) backdrop.classList.remove("show");
    });
  });

  // Event Submit Formulir Motor
  const formMotor = document.getElementById("formMotor");
  if (formMotor) {
    formMotor.addEventListener("submit", handleSimpanMotor);
  }

  // Render awal daftar motor
  renderMotorList();
  switchTab("motor");
});
