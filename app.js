/**
 * GAS RENTAL - APLIKASI CRUD RENTAL MOTOR
 * Tahap 1: Pengendali Navigasi & Halaman Kosong Modul PRD
 */

document.addEventListener("DOMContentLoaded", () => {
  const navButtons = document.querySelectorAll(".nav-btn, .bnav-btn");
  const viewPanels = document.querySelectorAll(".view-panel");

  function switchTab(targetId) {
    // Perbarui status aktif pada tombol navbar desktop dan mobile
    navButtons.forEach(btn => {
      if (btn.dataset.target === targetId) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Tampilkan panel modul yang dipilih dan sembunyikan yang lain
    viewPanels.forEach(panel => {
      if (panel.id === `view-${targetId}`) {
        panel.classList.add("active");
      } else {
        panel.classList.remove("active");
      }
    });
  }

  // Pasang event listener untuk semua tombol navigasi
  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.target;
      switchTab(target);
    });
  });

  // Default awal: Modul Motor
  switchTab("motor");
});
