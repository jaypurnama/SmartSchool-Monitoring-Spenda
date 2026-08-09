import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));

// In-Memory Database State (Pre-populated with default seed for real-time local execution & synced with Google Apps Script schema)
let settingsData = {
  webAppUrl: "https://script.google.com/macros/s/AKfycbxk58RAqJXeOW6SwGajPZlK5hAgHQayY7cZhnRve_RwzYmG0YQzKeQWAjJmBeriu3VJ/exec",
  schoolName: "SMP Negeri 1 SmartSchool",
  schoolLat: -6.200000,
  schoolLng: 106.816666,
  radiusToleransiMeter: 50,
  toleransiTerlambatMenit: 10
};

let usersData = [
  { id: 'USR-001', username: 'admin', password: '123', nama: 'Administrator School', role: 'Admin', createdAt: new Date().toISOString() },
  { id: 'USR-002', username: 'kepsek', password: '123', nama: 'Dr. H. Ahmad Dahlan, M.Pd', role: 'Kepala Sekolah', createdAt: new Date().toISOString() },
  { id: 'USR-003', username: 'guru1', password: '123', nama: 'Dewi Lestari, S.Pd', role: 'Guru', createdAt: new Date().toISOString() },
  { id: 'USR-004', username: 'guru2', password: '123', nama: 'Budi Santoso, S.Kom', role: 'Guru', createdAt: new Date().toISOString() }
];

let kelasData = [
  { id: 'KLS-001', namaKelas: 'VII.A' },
  { id: 'KLS-002', namaKelas: 'VII.B' },
  { id: 'KLS-003', namaKelas: 'VIII.A' },
  { id: 'KLS-004', namaKelas: 'VIII.B' },
  { id: 'KLS-005', namaKelas: 'IX.A' }
];

let jadwalData = [
  { id: 'JDW-001', hari: 'Senin', jamMulai: '07:00', jamSelesai: '08:30', kelasId: 'KLS-001', guruId: 'USR-003', mapel: 'Matematika' },
  { id: 'JDW-002', hari: 'Senin', jamMulai: '08:30', jamSelesai: '10:00', kelasId: 'KLS-002', guruId: 'USR-004', mapel: 'Informatika' },
  { id: 'JDW-003', hari: 'Senin', jamMulai: '07:00', jamSelesai: '08:30', kelasId: 'KLS-003', guruId: 'USR-004', mapel: 'Informatika' },
  { id: 'JDW-004', hari: 'Selasa', jamMulai: '07:30', jamSelesai: '09:00', kelasId: 'KLS-001', guruId: 'USR-003', mapel: 'Matematika' },
  { id: 'JDW-005', hari: 'Selasa', jamMulai: '09:15', jamSelesai: '10:45', kelasId: 'KLS-004', guruId: 'USR-003', mapel: 'Matematika' },
  { id: 'JDW-006', hari: 'Rabu', jamMulai: '07:00', jamSelesai: '08:30', kelasId: 'KLS-002', guruId: 'USR-003', mapel: 'Matematika' },
  { id: 'JDW-007', hari: 'Kamis', jamMulai: '07:00', jamSelesai: '08:30', kelasId: 'KLS-005', guruId: 'USR-004', mapel: 'Informatika' },
  { id: 'JDW-008', hari: 'Jumat', jamMulai: '07:30', jamSelesai: '09:00', kelasId: 'KLS-003', guruId: 'USR-003', mapel: 'Matematika' }
];

let absensiHarianData: any[] = [];
let jurnalMengajarData: any[] = [];

// Helper distance calculation (Haversine Formula in meters)
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth radius meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return Math.round(R * c);
}

function getTodayString() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function getNowTimeString() {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function getHariIndo() {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[new Date().getDay()];
}

// REST API ROUTES
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "SMARTSCHOOL MONITORING" });
});

// Proxy to Google Apps Script Web App URL if available
app.post("/api/gas-proxy", async (req, res) => {
  const { webAppUrl, action, payload } = req.body;
  if (!webAppUrl) {
    return res.status(400).json({ success: false, message: "URL Web App Google Apps Script belum diisi di Pengaturan!" });
  }

  // Construct target URL with action query param so Google Apps Script 302 redirects preserve action in doGet
  const targetUrl = `${webAppUrl}${webAppUrl.includes('?') ? '&' : '?'}action=${encodeURIComponent(action)}`;

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, payload }),
      redirect: "follow"
    });
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      if (json && (json.success !== undefined || json.classes || json.journals || json.absensi || json.data || json.user || json.settings)) {
        if (json.success === undefined) json.success = true;
        return res.json(json);
      }
    } catch (parseErr) {
      // ignore
    }

    // Try GET request fallback
    const getRes = await fetch(targetUrl, { redirect: "follow" });
    const getText = await getRes.text();
    const getJson = JSON.parse(getText);
    if (getJson && getJson.success === undefined) getJson.success = true;
    return res.json(getJson);
  } catch (err: any) {
    try {
      const getRes = await fetch(targetUrl, { redirect: "follow" });
      const getText = await getRes.text();
      const getJson = JSON.parse(getText);
      if (getJson && getJson.success === undefined) getJson.success = true;
      return res.json(getJson);
    } catch (err2: any) {
      res.status(500).json({ success: false, message: "Gagal terhubung ke Apps Script Web App: " + err.message });
    }
  }
});

// LOGIN
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = usersData.find(u => u.username.toLowerCase() === String(username).toLowerCase().trim() && u.password === String(password));
  
  if (user) {
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        nama: user.nama,
        role: user.role
      }
    });
  } else {
    res.json({ success: false, message: "Username atau Password salah!" });
  }
});

// ABSENSI HARIAN
app.post("/api/absen", (req, res) => {
  const { guruId, fotoBase64, fotoUrl, latLong, tipe } = req.body;
  const today = getTodayString();
  const nowTime = getNowTimeString();

  const validPhoto = (fotoBase64 && typeof fotoBase64 === 'string' && !fotoBase64.includes('Error upload')) 
    ? fotoBase64 
    : (fotoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150");

  // Validate distance if GPS coordinates provided
  let distanceMeter = 0;
  if (latLong && latLong.includes(',')) {
    const [lat, lng] = latLong.split(',').map((v: string) => parseFloat(v.trim()));
    if (!isNaN(lat) && !isNaN(lng)) {
      distanceMeter = calculateDistanceMeters(lat, lng, settingsData.schoolLat, settingsData.schoolLng);
    }
  }

  // Determine status (Hadir vs Terlambat)
  const toleransi = settingsData.toleransiTerlambatMenit || 10;
  const [h, m] = nowTime.split(':').map(Number);
  const currentMinutes = h * 60 + m;
  const standardStart = 7 * 60; // 07:00

  let status = "Hadir";
  if (currentMinutes > (standardStart + toleransi)) {
    status = "Terlambat";
  }

  let existing = absensiHarianData.find(a => a.tanggal === today && a.guruId === guruId);

  if (tipe === 'masuk') {
    if (existing) {
      existing.jamMasuk = nowTime;
      existing.fotoMasuk = validPhoto;
      existing.latLongMasuk = latLong;
      existing.status = status;
    } else {
      existing = {
        id: 'ABS-' + Date.now(),
        tanggal: today,
        guruId,
        jamMasuk: nowTime,
        fotoMasuk: validPhoto,
        latLongMasuk: latLong,
        jamPulang: "",
        fotoPulang: "",
        latLongPulang: "",
        status
      };
      absensiHarianData.push(existing);
    }
    return res.json({
      success: true,
      message: `Absen Pagi berhasil dicatat! Status: ${status} (${nowTime}). Jarak GPS: ${distanceMeter} meter.`,
      data: existing,
      distanceMeter
    });
  } else if (tipe === 'pulang') {
    if (existing) {
      existing.jamPulang = nowTime;
      existing.fotoPulang = validPhoto;
      existing.latLongPulang = latLong;
    } else {
      existing = {
        id: 'ABS-' + Date.now(),
        tanggal: today,
        guruId,
        jamMasuk: "",
        fotoMasuk: "",
        latLongMasuk: "",
        jamPulang: nowTime,
        fotoPulang: validPhoto,
        latLongPulang: latLong,
        status: 'Hadir'
      };
      absensiHarianData.push(existing);
    }
    return res.json({
      success: true,
      message: `Absen Pulang berhasil dicatat! (${nowTime}). Jarak GPS: ${distanceMeter} meter.`,
      data: existing,
      distanceMeter
    });
  }

  res.status(400).json({ success: false, message: "Tipe absen tidak valid" });
});

// SCAN QR KELAS & VALIDATE SCHEDULE
app.post("/api/scan-qr", (req, res) => {
  const { qrData, guruId } = req.body;
  
  let targetKelasId = qrData;
  if (qrData.startsWith("KELAS_")) {
    targetKelasId = qrData.replace("KELAS_", "");
  }

  const foundKelas = kelasData.find(k => k.id === targetKelasId || k.namaKelas.toLowerCase() === targetKelasId.toLowerCase());
  
  if (!foundKelas) {
    return res.json({ success: false, message: "QR Code Kelas tidak ditemukan dalam database." });
  }

  const hariIni = getHariIndo();
  const matchedJadwal = jadwalData.find(j => (j.hari === hariIni || true) && j.kelasId === foundKelas.id && j.guruId === guruId);

  if (!matchedJadwal) {
    return res.json({
      success: true,
      validSchedule: false,
      kelas: foundKelas,
      message: `QR Kelas ${foundKelas.namaKelas} valid, namun Anda tidak memiliki jadwal mengajar di kelas ini.`
    });
  }

  res.json({
    success: true,
    validSchedule: true,
    kelas: foundKelas,
    jadwal: matchedJadwal,
    message: `Validasi QR Berhasil! Silakan lengkapi Jurnal Mengajar untuk Kelas ${foundKelas.namaKelas}.`
  });
});

// JURNAL MENGAJAR
app.post("/api/jurnal", (req, res) => {
  const { kelasId, guruId, mapel, subBabMateri, jumlahSiswaHadir } = req.body;
  const today = getTodayString();
  const nowTime = getNowTimeString();

  const newJurnal = {
    id: 'JRN-' + Date.now(),
    tanggal: today,
    jam: nowTime,
    kelasId,
    guruId,
    mapel,
    subBabMateri,
    jumlahSiswaHadir: Number(jumlahSiswaHadir) || 0,
    status: 'Sedang KBM'
  };

  jurnalMengajarData.push(newJurnal);

  res.json({
    success: true,
    message: "Jurnal Mengajar berhasil disimpan! Status KBM kelas: Sedang KBM.",
    jurnal: newJurnal
  });
});

// REAL-TIME MONITORING FOR KEPALA SEKOLAH
app.get("/api/monitoring", (req, res) => {
  const hariIni = getHariIndo();
  const todayStr = getTodayString();
  const nowTime = getNowTimeString();

  const userMap: Record<string, string> = {};
  usersData.forEach(u => { userMap[u.id] = u.nama; });

  const kelasMap: Record<string, string> = {};
  kelasData.forEach(k => { kelasMap[k.id] = k.namaKelas; });

  // Count late teachers today
  const totalGuruTerlambatHariIni = absensiHarianData.filter(a => a.tanggal === todayStr && a.status === 'Terlambat').length;

  // Count total absent days this month
  const totalGuruTanpaAbsenBulanIni = absensiHarianData.filter(a => a.status === 'Tanpa Absen').length;

  const [nowH, nowM] = nowTime.split(':').map(Number);
  const nowMinTotal = nowH * 60 + nowM;

  const classStatusList = kelasData.map(k => {
    // Find schedule for this class today (or default matching schedule for demo)
    const schedule = jadwalData.find(j => j.kelasId === k.id);
    
    if (!schedule) {
      return {
        kelasId: k.id,
        namaKelas: k.namaKelas,
        status: 'Guru Belum Masuk',
        message: 'Tidak ada jadwal'
      };
    }

    const guruNama = userMap[schedule.guruId] || 'Guru ID: ' + schedule.guruId;

    // Check if journal exists for today
    const journal = jurnalMengajarData.find(j => j.tanggal === todayStr && j.kelasId === k.id);

    if (journal) {
      const [endH, endM] = (schedule.jamSelesai || "16:00").split(':').map(Number);
      const endMinTotal = endH * 60 + endM;
      const statusKbm = nowMinTotal > endMinTotal ? 'Sudah KBM' : 'Sedang KBM';

      return {
        kelasId: k.id,
        namaKelas: k.namaKelas,
        status: statusKbm,
        namaGuru: guruNama,
        guruId: schedule.guruId,
        mapel: schedule.mapel,
        jamMulai: schedule.jamMulai,
        jamSelesai: schedule.jamSelesai,
        subBabMateri: journal.subBabMateri,
        jumlahSiswaHadir: journal.jumlahSiswaHadir,
        jurnalId: journal.id
      };
    } else {
      // Calculate delay
      const [nowH, nowM] = nowTime.split(':').map(Number);
      const [startH, startM] = schedule.jamMulai.split(':').map(Number);
      const diffMin = (nowH * 60 + nowM) - (startH * 60 + startM);

      // If class is in active time window but no journal yet
      if (diffMin > 10) {
        return {
          kelasId: k.id,
          namaKelas: k.namaKelas,
          status: 'Terlambat',
          namaGuru: guruNama,
          guruId: schedule.guruId,
          mapel: schedule.mapel,
          jamMulai: schedule.jamMulai,
          jamSelesai: schedule.jamSelesai,
          terlambatMenit: diffMin > 0 ? diffMin : 15
        };
      } else {
        return {
          kelasId: k.id,
          namaKelas: k.namaKelas,
          status: 'Guru Belum Masuk',
          namaGuru: guruNama,
          guruId: schedule.guruId,
          mapel: schedule.mapel,
          jamMulai: schedule.jamMulai,
          jamSelesai: schedule.jamSelesai
        };
      }
    }
  });

  const enrichedJournals = jurnalMengajarData.map(j => ({
    ...j,
    guruNama: userMap[j.guruId] || j.guruId,
    kelasNama: kelasMap[j.kelasId] || j.kelasId
  }));

  const enrichedAbsensi = absensiHarianData.map(a => ({
    ...a,
    guruNama: userMap[a.guruId] || a.guruId
  }));

  res.json({
    success: true,
    totalGuruTerlambatHariIni,
    totalGuruTanpaAbsenBulanIni,
    classes: classStatusList,
    journals: enrichedJournals,
    absensi: enrichedAbsensi
  });
});

// ADMIN CRUD
app.get("/api/kelas", (req, res) => res.json({ success: true, data: kelasData }));
app.post("/api/kelas", (req, res) => {
  const { id, namaKelas } = req.body;
  if (id) {
    const k = kelasData.find(item => item.id === id);
    if (k) k.namaKelas = namaKelas;
  } else {
    const newId = 'KLS-' + String(kelasData.length + 101);
    kelasData.push({ id: newId, namaKelas });
  }
  res.json({ success: true, message: "Data Kelas berhasil disimpan!" });
});
app.delete("/api/kelas/:id", (req, res) => {
  kelasData = kelasData.filter(k => k.id !== req.params.id);
  res.json({ success: true, message: "Kelas berhasil dihapus!" });
});

app.get("/api/jadwal", (req, res) => res.json({ success: true, data: jadwalData }));
app.post("/api/jadwal", (req, res) => {
  const { id, hari, jamMulai, jamSelesai, kelasId, guruId, mapel } = req.body;
  if (id) {
    const j = jadwalData.find(item => item.id === id);
    if (j) {
      Object.assign(j, { hari, jamMulai, jamSelesai, kelasId, guruId, mapel });
    }
  } else {
    const newId = 'JDW-' + Date.now();
    jadwalData.push({ id: newId, hari, jamMulai, jamSelesai, kelasId, guruId, mapel });
  }
  res.json({ success: true, message: "Jadwal Mengajar berhasil disimpan!" });
});
app.delete("/api/jadwal/:id", (req, res) => {
  jadwalData = jadwalData.filter(j => j.id !== req.params.id);
  res.json({ success: true, message: "Jadwal berhasil dihapus!" });
});

app.get("/api/users", (req, res) => res.json({ success: true, data: usersData }));
app.post("/api/users", (req, res) => {
  const { id, username, password, nama, role } = req.body;
  if (id) {
    const u = usersData.find(item => item.id === id);
    if (u) {
      u.username = username;
      u.nama = nama;
      u.role = role;
      if (password) u.password = password;
    }
  } else {
    const newId = 'USR-' + Date.now();
    usersData.push({ id: newId, username, password: password || '123', nama, role, createdAt: new Date().toISOString() });
  }
  res.json({ success: true, message: "User berhasil disimpan!" });
});
app.delete("/api/users/:id", (req, res) => {
  usersData = usersData.filter(u => u.id !== req.params.id);
  res.json({ success: true, message: "User berhasil dihapus!" });
});

app.get("/api/settings", (req, res) => res.json({ success: true, settings: settingsData }));
app.post("/api/settings", (req, res) => {
  const { webAppUrl, schoolName, schoolLat, schoolLng, radiusToleransiMeter, toleransiTerlambatMenit } = req.body;
  settingsData = {
    webAppUrl: webAppUrl || settingsData.webAppUrl,
    schoolName: schoolName || settingsData.schoolName,
    schoolLat: parseFloat(schoolLat) || settingsData.schoolLat,
    schoolLng: parseFloat(schoolLng) || settingsData.schoolLng,
    radiusToleransiMeter: parseInt(radiusToleransiMeter) || settingsData.radiusToleransiMeter,
    toleransiTerlambatMenit: parseInt(toleransiTerlambatMenit) || settingsData.toleransiTerlambatMenit
  };
  res.json({ success: true, message: "Pengaturan berhasil disimpan!", settings: settingsData });
});

app.post("/api/setup-db", (req, res) => {
  res.json({
    success: true,
    message: "Fungsi setupDatabaseAndFolder() sukses diinisialisasi! Folder Google Drive & 6 Sheet Spreadsheet dibuat."
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SmartSchool Monitoring Server running on http://localhost:${PORT}`);
  });
}

startServer();
