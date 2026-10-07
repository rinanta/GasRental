/**
 * GAS RENTAL - FIREBASE & FIRESTORE CONFIGURATION
 * Modular Firebase SDK integration with intelligent Mock Fallback
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getFirestore, 
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
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Initial Mock Seed Data (based on Skema Firestore Gas Rental)
export const INITIAL_MOCK_DATA = {
  motor: [
    {
      id: "Mt45bRw",
      merek_tipe: "Honda Vario 125",
      plat_nomor: "DK 1234 AB",
      harga_per_hari: 80000,
      tersedia: false, // Sedang dipesan/berjalan di sewa Sw19cTn
      dibuat_pada: new Date("2026-10-01T08:00:00Z")
    },
    {
      id: "Mt67kLm",
      merek_tipe: "Yamaha NMAX 155",
      plat_nomor: "DK 5678 CD",
      harga_per_hari: 120000,
      tersedia: true,
      dibuat_pada: new Date("2026-10-01T08:30:00Z")
    },
    {
      id: "Mt89xYz",
      merek_tipe: "Honda Scoopy",
      plat_nomor: "DK 9012 EF",
      harga_per_hari: 75000,
      tersedia: true,
      dibuat_pada: new Date("2026-10-01T09:00:00Z")
    }
  ],
  penyewa: [
    {
      id: "085712345678",
      nama: "Putri Lestari",
      no_whatsapp: "085712345678",
      asal_kota: "Surabaya",
      jenis_jaminan: "KTP",
      dibuat_pada: new Date("2026-10-01T08:20:00Z")
    },
    {
      id: "081298765432",
      nama: "Dimas Pratama",
      no_whatsapp: "081298765432",
      asal_kota: "Bandung",
      jenis_jaminan: "SIM",
      dibuat_pada: new Date("2026-10-01T09:15:00Z")
    }
  ],
  sewa: [
    {
      id: "Sw19cTn",
      motor_id: "Mt45bRw",
      nama_motor: "Honda Vario 125",
      plat_nomor: "DK 1234 AB",
      penyewa_id: "085712345678",
      nama_penyewa: "Putri Lestari",
      harga_per_hari: 80000,
      tanggal_mulai: "2026-10-02",
      lama_hari: 3,
      total: 240000,
      status: "dipesan",
      dibuat_pada: new Date("2026-10-01T09:00:00Z")
    },
    {
      id: "Sw22aBq",
      motor_id: "Mt67kLm",
      nama_motor: "Yamaha NMAX 155",
      plat_nomor: "DK 5678 CD",
      penyewa_id: "081298765432",
      nama_penyewa: "Dimas Pratama",
      harga_per_hari: 120000,
      tanggal_mulai: "2026-10-01",
      lama_hari: 2,
      total: 240000,
      status: "selesai",
      dibuat_pada: new Date("2026-10-01T07:00:00Z")
    }
  ]
};

// Check stored configuration
const STORAGE_KEY = "GAS_RENTAL_FIREBASE_CONFIG";
let firebaseApp = null;
let firestoreDb = null;
let isConnected = false;

export function loadSavedFirebaseConfig() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch (e) {
    return null;
  }
}

export function saveFirebaseConfig(configObj) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configObj));
}

export function clearFirebaseConfig() {
  localStorage.removeItem(STORAGE_KEY);
}

// Initialize Firebase if configuration exists
const savedConfig = loadSavedFirebaseConfig();
if (savedConfig && savedConfig.projectId && savedConfig.apiKey) {
  try {
    firebaseApp = initializeApp(savedConfig);
    firestoreDb = getFirestore(firebaseApp);
    isConnected = true;
    console.log("🔥 Terhubung ke Cloud Firestore:", savedConfig.projectId);
  } catch (err) {
    console.error("Gagal inisialisasi Firebase:", err);
    isConnected = false;
  }
}

export const firebaseState = {
  get isConnected() { return isConnected; },
  get db() { return firestoreDb; },
  get app() { return firebaseApp; }
};

export {
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
};
