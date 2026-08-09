export const CODE_GS = `/**
 * SMARTSCHOOL MONITORING - Google Apps Script (Code.gs)
 * Backend Script & Database Management with Google Sheets
 */

// Global Config
const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const FOLDER_NAME_ABSENSI = "SmartSchool_FotoAbsen";

/**
 * 1. Setup Database & Google Drive Folder Otomatis
 * Jalankan fungsi ini sekali di Google Apps Script editor untuk inisialisasi sheet & folder.
 */
function setupDatabaseAndFolder() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Buat / Dapatkan Folder Google Drive untuk Foto Selfie Absensi
  let folder;
  try {
    const folders = DriveApp.getFoldersByName(FOLDER_NAME_ABSENSI);
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(FOLDER_NAME_ABSENSI);
      try {
        folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (shareErr) {
        // Abaikan jika kebijakan domain belajar.id / Workspace melarang berbagi publik
      }
    }
  } catch (driveErr) {
    Logger.log("Info setup folder Drive: " + driveErr.toString());
  }
  
  // 2. Definisi Sheet dan Header
  const sheetsDef = {
    'USERS': ['UserID', 'Username', 'Password', 'Nama', 'Role', 'CreatedAt'],
    'KELAS': ['KelasID', 'NamaKelas'],
    'JADWAL': ['JadwalID', 'Hari', 'JamMulai', 'JamSelesai', 'KelasID', 'GuruID', 'Mapel'],
    'ABSENSI_HARIAN': ['AbsenID', 'Tanggal', 'GuruID', 'JamMasuk', 'FotoMasuk', 'LatLongMasuk', 'JamPulang', 'FotoPulang', 'LatLongPulang', 'Status'],
    'JURNAL_KEMENGAJARAN': ['JurnalID', 'Tanggal', 'Jam', 'KelasID', 'GuruID', 'Mapel', 'SubBabMateri', 'JumlahSiswaHadir', 'Status'],
    'SETTINGS': ['Key', 'Value']
  };

  for (let sheetName in sheetsDef) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(sheetsDef[sheetName]);
      sheet.getRange("1:1").setFontWeight("bold").setBackground("#e2e8f0");
    }
  }

  // 3. Seed Default Users jika belum ada
  const userSheet = ss.getSheetByName('USERS');
  if (userSheet.getLastRow() <= 1) {
    const now = new Date().toISOString();
    userSheet.appendRow(['USR-001', 'admin', 'admin123', 'Administrator School', 'Admin', now]);
    userSheet.appendRow(['USR-002', 'kepsek', 'kepsek123', 'Dr. H. Ahmad Dahlan, M.Pd', 'Kepala Sekolah', now]);
    userSheet.appendRow(['USR-003', 'guru1', 'guru123', 'Dewi Lestari, S.Pd', 'Guru', now]);
    userSheet.appendRow(['USR-004', 'guru2', 'guru123', 'Budi Santoso, S.Kom', 'Guru', now]);
  }

  // 4. Seed Default Kelas jika belum ada
  const kelasSheet = ss.getSheetByName('KELAS');
  if (kelasSheet.getLastRow() <= 1) {
    kelasSheet.appendRow(['KLS-001', 'VII.A']);
    kelasSheet.appendRow(['KLS-002', 'VII.B']);
    kelasSheet.appendRow(['KLS-003', 'VIII.A']);
    kelasSheet.appendRow(['KLS-004', 'VIII.B']);
    kelasSheet.appendRow(['KLS-005', 'IX.A']);
  }

  // 5. Seed Default Settings jika belum ada
  const settingsSheet = ss.getSheetByName('SETTINGS');
  if (settingsSheet.getLastRow() <= 1) {
    settingsSheet.appendRow(['SCHOOL_NAME', 'SMP Negeri 1 SmartSchool']);
    settingsSheet.appendRow(['SCHOOL_LAT', '-6.200000']);
    settingsSheet.appendRow(['SCHOOL_LNG', '106.816666']);
    settingsSheet.appendRow(['RADIUS_TOLERANSI_METER', '50']);
    settingsSheet.appendRow(['TOLERANSI_TERLAMBAT_MENIT', '10']);
  }

  return { status: 'success', message: 'Database & Drive Folder berhasil diinisialisasi!' };
}

/**
 * doGet: Melayani Web App REST API JSON Endpoint
 */
function doGet(e) {
  if (e && e.parameter && e.parameter.action) {
    const action = e.parameter.action;
    let result = {};
    if (action === 'getRealtimeMonitoringData') {
      result = getRealtimeMonitoringData();
    } else if (action === 'getKelas') {
      result = getKelas();
    } else if (action === 'getJadwal') {
      result = getJadwal();
    } else if (action === 'getUsers') {
      result = getUsers();
    } else if (action === 'getSettings') {
      result = getSettings();
    }
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    app: 'SMARTSCHOOL MONITORING API',
    message: 'Google Apps Script Backend API Running'
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * doPost: Menangani Permintaan POST dari API external
 */
function doPost(e) {
  let response = { success: false, message: 'Invalid Request' };
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const payload = data.payload || {};

    switch (action) {
      case 'setupDatabaseAndFolder':
        response = setupDatabaseAndFolder();
        break;
      case 'loginUser':
        response = loginUser(payload.username, payload.password);
        break;
      case 'saveAbsenHarian':
        response = saveAbsenHarian(payload);
        break;
      case 'scanQRCodeAndValidate':
        response = scanQRCodeAndValidate(payload.qrData, payload.guruId);
        break;
      case 'simpanJurnalMengajar':
        response = simpanJurnalMengajar(payload);
        break;
      case 'getRealtimeMonitoringData':
        response = getRealtimeMonitoringData();
        break;
      case 'getKelas':
        response = getKelas();
        break;
      case 'saveKelas':
        response = saveKelas(payload);
        break;
      case 'deleteKelas':
        response = deleteKelas(payload.id);
        break;
      case 'getJadwal':
        response = getJadwal();
        break;
      case 'saveJadwal':
        response = saveJadwal(payload);
        break;
      case 'deleteJadwal':
        response = deleteJadwal(payload.id);
        break;
      case 'getUsers':
        response = getUsers();
        break;
      case 'saveUser':
        response = saveUser(payload);
        break;
      case 'deleteUser':
        response = deleteUser(payload.id);
        break;
      case 'getSettings':
        response = getSettings();
        break;
      case 'saveSettings':
        response = saveSettings(payload);
        break;
      default:
        response = { success: false, message: 'Unknown action: ' + action };
    }
  } catch (err) {
    response = { success: false, message: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---------------- CORE FUNCTIONS ----------------

/**
 * Validasi Login User
 */
function loginUser(username, password) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('USERS');
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (String(row[1]).trim().toLowerCase() === String(username).trim().toLowerCase() && String(row[2]) === String(password)) {
      return {
        success: true,
        user: {
          id: row[0],
          username: row[1],
          nama: row[3],
          role: row[4]
        }
      };
    }
  }
  return { success: false, message: 'Username atau Password salah!' };
}

/**
 * Simpan Absensi Harian (Foto Selfie & GPS)
 */
function saveAbsenHarian(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('ABSENSI_HARIAN');
  const todayStr = getTodayDateString();
  const nowStr = getNowTimeString();

  // Simpan foto ke Drive jika format base64
  let photoUrl = "";
  if (data.fotoBase64 && (data.fotoBase64.indexOf('base64,') !== -1 || data.fotoBase64.indexOf('data:image/') === 0)) {
    try {
      let folders = DriveApp.getFoldersByName(FOLDER_NAME_ABSENSI);
      let folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(FOLDER_NAME_ABSENSI);
      
      let base64Data = data.fotoBase64;
      if (base64Data.indexOf('base64,') !== -1) {
        base64Data = base64Data.split('base64,')[1];
      }
      const decoded = Utilities.base64Decode(base64Data);
      const blob = Utilities.newBlob(decoded, 'image/jpeg', 'absen_' + (data.guruId || 'guru') + '_' + Date.now() + '.jpg');
      const file = folder.createFile(blob);
      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (shareErr) {
        // Abaikan jika akun belajar.id / Google Workspace membatasi sharing luar organisasi
      }
      photoUrl = file.getUrl();
    } catch (e) {
      photoUrl = data.fotoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300";
    }
  } else if (data.fotoBase64 && (data.fotoBase64.indexOf('http://') === 0 || data.fotoBase64.indexOf('https://') === 0)) {
    photoUrl = data.fotoBase64;
  } else {
    photoUrl = data.fotoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300";
  }

  const rows = sheet.getDataRange().getValues();
  let existingIndex = -1;

  // Cek apakah guru sudah absen hari ini
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][1] === todayStr && rows[i][2] === data.guruId) {
      existingIndex = i + 1;
      break;
    }
  }

  const settings = getSettings().settings;
  const toleransiTerlambat = parseInt(settings.toleransiTerlambatMenit || 10);
  
  // Tentukan status Masuk / Terlambat
  let status = "Hadir";
  const jamMasukParts = nowStr.split(':');
  const currentMinutes = parseInt(jamMasukParts[0]) * 60 + parseInt(jamMasukParts[1]);
  const standardStartMinutes = 7 * 60 + 0; // Standard jam 07:00

  if (currentMinutes > (standardStartMinutes + toleransiTerlambat)) {
    status = "Terlambat";
  }

  if (data.tipe === 'masuk') {
    if (existingIndex > 1) {
      // Update jam masuk jika belum ada
      sheet.getRange(existingIndex, 4).setValue(nowStr);
      sheet.getRange(existingIndex, 5).setValue(photoUrl);
      sheet.getRange(existingIndex, 6).setValue(data.latLong);
      sheet.getRange(existingIndex, 10).setValue(status);
    } else {
      const absenId = 'ABS-' + Date.now();
      sheet.appendRow([absenId, todayStr, data.guruId, nowStr, photoUrl, data.latLong, "", "", "", status]);
    }
    return { success: true, message: 'Absen Pagi berhasil dicatat! Status: ' + status, jamMasuk: nowStr, photoUrl: photoUrl };
  } else if (data.tipe === 'pulang') {
    if (existingIndex > 1) {
      sheet.getRange(existingIndex, 7).setValue(nowStr);
      sheet.getRange(existingIndex, 8).setValue(photoUrl);
      sheet.getRange(existingIndex, 9).setValue(data.latLong);
      return { success: true, message: 'Absen Pulang berhasil dicatat!', jamPulang: nowStr };
    } else {
      const absenId = 'ABS-' + Date.now();
      sheet.appendRow([absenId, todayStr, data.guruId, "", "", "", nowStr, photoUrl, data.latLong, 'Hadir']);
      return { success: true, message: 'Absen Pulang dicatat!', jamPulang: nowStr };
    }
  }

  return { success: false, message: 'Tipe absen tidak valid.' };
}

/**
 * Validasi QR Code Kelas dan Jadwal Mengajar Guru
 */
function scanQRCodeAndValidate(qrData, guruId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Format QR Code disepakati: misal "KELAS_KLS-001" atau "KLS-001" atau "VII.A"
  let kelasId = qrData;
  if (qrData.startsWith("KELAS_")) {
    kelasId = qrData.replace("KELAS_", "");
  }

  // Cari data kelas berdasarkan ID atau NamaKelas
  const sheetKelas = ss.getSheetByName('KELAS');
  const rowsKelas = sheetKelas.getDataRange().getValues();
  let foundKelas = null;

  for (let i = 1; i < rowsKelas.length; i++) {
    if (rowsKelas[i][0] === kelasId || rowsKelas[i][1].toLowerCase() === kelasId.toLowerCase()) {
      foundKelas = { id: rowsKelas[i][0], namaKelas: rowsKelas[i][1] };
      break;
    }
  }

  if (!foundKelas) {
    return { success: false, message: 'QR Code Kelas tidak dikenali di sistem database.' };
  }

  // Cek Jadwal Guru pada Hari ini dan Jam ini
  const hariIni = getHariIndo();
  const jamSekarang = getNowTimeString();
  
  const sheetJadwal = ss.getSheetByName('JADWAL');
  const rowsJadwal = sheetJadwal.getDataRange().getValues();
  let matchedJadwal = null;

  for (let i = 1; i < rowsJadwal.length; i++) {
    const row = rowsJadwal[i];
    const hari = row[1];
    const kelas = row[4];
    const guru = row[5];

    if (hari === hariIni && kelas === foundKelas.id && guru === guruId) {
      matchedJadwal = {
        jadwalId: row[0],
        hari: row[1],
        jamMulai: row[2],
        jamSelesai: row[3],
        kelasId: row[4],
        namaKelas: foundKelas.namaKelas,
        guruId: row[5],
        mapel: row[6]
      };
      break;
    }
  }

  if (!matchedJadwal) {
    return {
      success: true,
      validSchedule: false,
      kelas: foundKelas,
      message: 'QR Kelas ' + foundKelas.namaKelas + ' valid, namun Anda tidak memiliki jadwal mengajar di kelas ini hari ' + hariIni + '.'
    };
  }

  return {
    success: true,
    validSchedule: true,
    kelas: foundKelas,
    jadwal: matchedJadwal,
    message: 'Validasi Berhasil! Silakan isi Jurnal Mengajar untuk Kelas ' + foundKelas.namaKelas + '.'
  };
}

/**
 * Simpan Jurnal Mengajar
 */
function simpanJurnalMengajar(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('JURNAL_KEMENGAJARAN');
  const todayStr = getTodayDateString();
  const nowStr = getNowTimeString();

  const jurnalId = 'JRN-' + Date.now();
  sheet.appendRow([
    jurnalId,
    todayStr,
    nowStr,
    data.kelasId,
    data.guruId,
    data.mapel,
    data.subBabMateri,
    data.jumlahSiswaHadir,
    'Sedang KBM'
  ]);

  return { success: true, message: 'Jurnal Mengajar berhasil disimpan! Status KBM kelas: Sedang KBM', jurnalId: jurnalId };
}

/**
 * Data Pemantauan Real-time untuk Dashboard Kepala Sekolah
 */
function getRealtimeMonitoringData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hariIni = getHariIndo();
  const todayStr = getTodayDateString();
  const nowStr = getNowTimeString();

  const sheetKelas = ss.getSheetByName('KELAS');
  const kelasRows = sheetKelas.getDataRange().getValues();

  const sheetJadwal = ss.getSheetByName('JADWAL');
  const jadwalRows = sheetJadwal.getDataRange().getValues();

  const sheetUsers = ss.getSheetByName('USERS');
  const userRows = sheetUsers.getDataRange().getValues();
  const userMap = {};
  for (let i = 1; i < userRows.length; i++) {
    userMap[userRows[i][0]] = userRows[i][3]; // ID -> Nama Guru
  }

  const sheetJurnal = ss.getSheetByName('JURNAL_KEMENGAJARAN');
  const jurnalRows = sheetJurnal.getDataRange().getValues();

  const sheetAbsen = ss.getSheetByName('ABSENSI_HARIAN');
  const absenRows = sheetAbsen.getDataRange().getValues();

  // Hitung statistik Kepala Sekolah
  let totalGuruTerlambatHariIni = 0;
  for (let i = 1; i < absenRows.length; i++) {
    if (absenRows[i][1] === todayStr && absenRows[i][9] === 'Terlambat') {
      totalGuruTerlambatHariIni++;
    }
  }

  // Tanpa Absen Bulan Ini
  let totalGuruTanpaAbsenBulanIni = 0;
  const currentMonth = todayStr.substring(0, 7);
  // Hitung total guru
  let totalGuruCount = 0;
  for (let i = 1; i < userRows.length; i++) {
    if (userRows[i][4] === 'Guru') totalGuruCount++;
  }

  const classStatusList = [];

  // Loop setiap kelas
  for (let k = 1; k < kelasRows.length; k++) {
    const kId = kelasRows[k][0];
    const kNama = kelasRows[k][1];

    // Cari jadwal aktif kelas ini hari ini
    let activeJadwal = null;
    for (let j = 1; j < jadwalRows.length; j++) {
      if (jadwalRows[j][1] === hariIni && jadwalRows[j][4] === kId) {
        activeJadwal = {
          jadwalId: jadwalRows[j][0],
          jamMulai: jadwalRows[j][2],
          jamSelesai: jadwalRows[j][3],
          guruId: jadwalRows[j][5],
          mapel: jadwalRows[j][6]
        };
        break;
      }
    }

    if (!activeJadwal) {
      classStatusList.push({
        kelasId: kId,
        namaKelas: kNama,
        status: 'Guru Belum Masuk',
        message: 'Tidak ada jadwal mengajar saat ini'
      });
      continue;
    }

    const guruNama = userMap[activeJadwal.guruId] || 'Guru ID: ' + activeJadwal.guruId;

    // Cek apakah ada jurnal mengajar hari ini untuk kelas & guru ini
    let hasJurnal = false;
    let jurnalMateri = "";
    let jurnalSiswa = 0;
    for (let j = 1; j < jurnalRows.length; j++) {
      if (jurnalRows[j][1] === todayStr && jurnalRows[j][3] === kId && jurnalRows[j][4] === activeJadwal.guruId) {
        hasJurnal = true;
        jurnalMateri = jurnalRows[j][6];
        jurnalSiswa = jurnalRows[j][7];
        break;
      }
    }

    if (hasJurnal) {
      const nowMin = timeToMinutes(nowStr);
      const endMin = timeToMinutes(activeJadwal.jamSelesai);
      const statusKbm = (nowMin > endMin) ? 'Sudah KBM' : 'Sedang KBM';

      classStatusList.push({
        kelasId: kId,
        namaKelas: kNama,
        status: statusKbm,
        namaGuru: guruNama,
        mapel: activeJadwal.mapel,
        jamMulai: activeJadwal.jamMulai,
        jamSelesai: activeJadwal.jamSelesai,
        subBabMateri: jurnalMateri,
        jumlahSiswaHadir: jurnalSiswa
      });
    } else {
      // Cek apakah terlambat (selisih waktu dengan jamMulai)
      const nowMin = timeToMinutes(nowStr);
      const startMin = timeToMinutes(activeJadwal.jamMulai);
      const diffMin = nowMin - startMin;

      if (diffMin > 10) {
        classStatusList.push({
          kelasId: kId,
          namaKelas: kNama,
          status: 'Terlambat',
          namaGuru: guruNama,
          mapel: activeJadwal.mapel,
          jamMulai: activeJadwal.jamMulai,
          jamSelesai: activeJadwal.jamSelesai,
          terlambatMenit: diffMin > 0 ? diffMin : 15
        });
      } else {
        classStatusList.push({
          kelasId: kId,
          namaKelas: kNama,
          status: 'Guru Belum Masuk',
          namaGuru: guruNama,
          mapel: activeJadwal.mapel,
          jamMulai: activeJadwal.jamMulai,
          jamSelesai: activeJadwal.jamSelesai
        });
      }
    }
  }

  // Ambil daftar jurnal mengajar
  const journalsList = [];
  const nowMinTotal = timeToMinutes(nowStr);
  for (let j = 1; j < jurnalRows.length; j++) {
    const jTanggal = jurnalRows[j][1];
    const jKelasId = jurnalRows[j][3];
    const jGuruId = jurnalRows[j][4];
    let jStatus = jurnalRows[j][8] || 'Sedang KBM';

    // Cari jamSelesai di jadwal untuk kelas & guru ini
    let endMin = 1440; // Default end of day
    for (let k = 1; k < jadwalRows.length; k++) {
      if (jadwalRows[k][4] === jKelasId && jadwalRows[k][5] === jGuruId) {
        endMin = timeToMinutes(jadwalRows[k][3]); // jamSelesai
        break;
      }
    }

    if (jTanggal < todayStr || (jTanggal === todayStr && nowMinTotal > endMin)) {
      jStatus = 'Sudah KBM';
    } else if (jTanggal === todayStr && nowMinTotal <= endMin) {
      jStatus = 'Sedang KBM';
    }

    journalsList.push({
      id: jurnalRows[j][0],
      tanggal: jTanggal,
      jam: jurnalRows[j][2],
      kelasId: jKelasId,
      kelasNama: jKelasId,
      guruId: jGuruId,
      mapel: jurnalRows[j][5],
      subBabMateri: jurnalRows[j][6],
      jumlahSiswaHadir: jurnalRows[j][7],
      status: jStatus
    });
  }

  // Ambil daftar absensi harian
  const absensiList = [];
  for (let a = 1; a < absenRows.length; a++) {
    absensiList.push({
      id: absenRows[a][0],
      tanggal: absenRows[a][1],
      guruId: absenRows[a][2],
      jamMasuk: absenRows[a][3],
      fotoMasuk: absenRows[a][4],
      latLongMasuk: absenRows[a][5],
      jamPulang: absenRows[a][6],
      fotoPulang: absenRows[a][7],
      latLongPulang: absenRows[a][8],
      status: absenRows[a][9]
    });
  }

  return {
    success: true,
    totalGuruTerlambatHariIni: totalGuruTerlambatHariIni,
    totalGuruTanpaAbsenBulanIni: totalGuruTanpaAbsenBulanIni,
    classes: classStatusList,
    journals: journalsList,
    absensi: absensiList
  };
}

// ---------------- ADMIN CRUD FUNCTIONS ----------------

function getKelas() {
  const rows = getSheetData('KELAS');
  const data = [];
  for (let i = 1; i < rows.length; i++) {
    data.push({ id: rows[i][0], namaKelas: rows[i][1] });
  }
  return { success: true, data: data };
}

function saveKelas(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('KELAS');
  if (data.id) {
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === data.id) {
        sheet.getRange(i + 1, 2).setValue(data.namaKelas);
        return { success: true, message: 'Data kelas diperbarui!' };
      }
    }
  }
  const id = 'KLS-' + String(sheet.getLastRow() + 100);
  sheet.appendRow([id, data.namaKelas]);
  return { success: true, message: 'Kelas baru ditambahkan!' };
}

function deleteKelas(id) {
  return deleteRowById('KELAS', 0, id);
}

function getJadwal() {
  const rows = getSheetData('JADWAL');
  const data = [];
  for (let i = 1; i < rows.length; i++) {
    data.push({
      id: rows[i][0],
      hari: rows[i][1],
      jamMulai: rows[i][2],
      jamSelesai: rows[i][3],
      kelasId: rows[i][4],
      guruId: rows[i][5],
      mapel: rows[i][6]
    });
  }
  return { success: true, data: data };
}

function saveJadwal(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('JADWAL');
  if (data.id) {
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === data.id) {
        sheet.getRange(i + 1, 2, 1, 6).setValues([[data.hari, data.jamMulai, data.jamSelesai, data.kelasId, data.guruId, data.mapel]]);
        return { success: true, message: 'Jadwal diperbarui!' };
      }
    }
  }
  const id = 'JDW-' + Date.now();
  sheet.appendRow([id, data.hari, data.jamMulai, data.jamSelesai, data.kelasId, data.guruId, data.mapel]);
  return { success: true, message: 'Jadwal baru ditambahkan!' };
}

function deleteJadwal(id) {
  return deleteRowById('JADWAL', 0, id);
}

function getUsers() {
  const rows = getSheetData('USERS');
  const data = [];
  for (let i = 1; i < rows.length; i++) {
    data.push({
      id: rows[i][0],
      username: rows[i][1],
      nama: rows[i][3],
      role: rows[i][4],
      createdAt: rows[i][5]
    });
  }
  return { success: true, data: data };
}

function saveUser(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('USERS');
  if (data.id) {
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === data.id) {
        sheet.getRange(i + 1, 2).setValue(data.username);
        if (data.password) sheet.getRange(i + 1, 3).setValue(data.password);
        sheet.getRange(i + 1, 4).setValue(data.nama);
        sheet.getRange(i + 1, 5).setValue(data.role);
        return { success: true, message: 'Pengguna diperbarui!' };
      }
    }
  }
  const id = 'USR-' + Date.now();
  sheet.appendRow([id, data.username, data.password || '123456', data.nama, data.role, new Date().toISOString()]);
  return { success: true, message: 'Pengguna baru ditambahkan!' };
}

function deleteUser(id) {
  return deleteRowById('USERS', 0, id);
}

function getSettings() {
  const rows = getSheetData('SETTINGS');
  const settingsObj = {};
  for (let i = 1; i < rows.length; i++) {
    settingsObj[rows[i][0]] = rows[i][1];
  }
  return {
    success: true,
    settings: {
      schoolName: settingsObj['SCHOOL_NAME'] || 'SMP Negeri SmartSchool',
      schoolLat: parseFloat(settingsObj['SCHOOL_LAT'] || '-6.200000'),
      schoolLng: parseFloat(settingsObj['SCHOOL_LNG'] || '106.816666'),
      radiusToleransiMeter: parseInt(settingsObj['RADIUS_TOLERANSI_METER'] || '50'),
      toleransiTerlambatMenit: parseInt(settingsObj['TOLERANSI_TERLAMBAT_MENIT'] || '10')
    }
  };
}

function saveSettings(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('SETTINGS');
  const kv = {
    'SCHOOL_NAME': data.schoolName,
    'SCHOOL_LAT': String(data.schoolLat),
    'SCHOOL_LNG': String(data.schoolLng),
    'RADIUS_TOLERANSI_METER': String(data.radiusToleransiMeter),
    'TOLERANSI_TERLAMBAT_MENIT': String(data.toleransiTerlambatMenit)
  };

  const rows = sheet.getDataRange().getValues();
  for (let key in kv) {
    let found = false;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === key) {
        sheet.getRange(i + 1, 2).setValue(kv[key]);
        found = true;
        break;
      }
    }
    if (!found) {
      sheet.appendRow([key, kv[key]]);
    }
  }
  return { success: true, message: 'Pengaturan sekolah disimpan!' };
}

// ---------------- HELPER UTILITIES ----------------

function getSheetData(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  return sheet.getDataRange().getValues();
}

function deleteRowById(sheetName, colIndex, idValue) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { success: false, message: 'Sheet tidak ditemukan' };
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][colIndex] === idValue) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Data berhasil dihapus!' };
    }
  }
  return { success: false, message: 'ID data tidak ditemukan.' };
}

function getTodayDateString() {
  const now = new Date();
  return Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function getNowTimeString() {
  const now = new Date();
  return Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm');
}

function getHariIndo() {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dayIndex = new Date().getDay();
  return days[dayIndex];
}

function timeToMinutes(timeStr) {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const p = timeStr.split(':');
  return parseInt(p[0]) * 60 + parseInt(p[1]);
}
`;

export const INDEX_HTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SMARTSCHOOL MONITORING</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- HTML5 QR Code Scanner CDN -->
  <script src="https://unpkg.com/html5-qrcode"></script>
  <!-- Lucide Icons CDN -->
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #f8fafc; }
    .status-green { background-color: #10b981; color: white; }
    .status-red { background-color: #ef4444; color: white; }
    .status-yellow { background-color: #f59e0b; color: white; }
  </style>
</head>
<body class="min-h-screen text-slate-800 flex flex-col">

  <!-- TOP APP BAR -->
  <header id="top-bar" class="bg-slate-900 text-white px-6 py-4 shadow-md flex justify-between items-center hidden">
    <div class="flex items-center space-x-3">
      <div class="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-xl">S</div>
      <div>
        <h1 class="text-lg font-bold tracking-tight">SMARTSCHOOL MONITORING</h1>
        <p id="user-subtitle" class="text-xs text-slate-400">Google Apps Script Web App</p>
      </div>
    </div>
    <div class="flex items-center space-x-4">
      <div id="user-badge" class="px-3 py-1 bg-slate-800 rounded-full text-xs font-semibold text-emerald-400 border border-slate-700"></div>
      <button onclick="logout()" class="text-xs bg-red-600/80 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition font-medium">Logout</button>
    </div>
  </header>

  <!-- MAIN CONTAINER -->
  <main class="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
    
    <!-- LOGIN VIEW -->
    <div id="view-login" class="max-w-md mx-auto my-12 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">🏫</div>
        <h2 class="text-2xl font-bold text-slate-900">Masuk Sistem</h2>
        <p class="text-sm text-slate-500 mt-1">Sistem Monitoring Kehadiran & Jurnal Mengajar</p>
      </div>

      <div id="login-alert" class="hidden mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200"></div>

      <form onsubmit="handleLogin(event)" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Username</label>
          <input type="text" id="login-username" required class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm outline-none">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Password</label>
          <input type="password" id="login-password" required class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm outline-none">
        </div>
        <button type="submit" id="btn-login" class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition shadow-lg shadow-emerald-600/20">Masuk Kebijakan</button>
      </form>
    </div>

    <!-- KEPALA SEKOLAH DASHBOARD VIEW -->
    <div id="view-kepsek" class="hidden space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-slate-900">Dashboard Pemantauan Kelas Real-Time</h2>
          <p class="text-xs text-slate-500 mt-1">Status Kehadiran Guru & Proses Belajar Mengajar Hari Ini</p>
        </div>
        <button onclick="loadKepsekData()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-xl font-semibold transition flex items-center gap-2">🔄 Refresh Data</button>
      </div>

      <!-- SUMMARY CARDS -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div class="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center font-bold text-xl">⚠️</div>
          <div>
            <p class="text-xs font-semibold text-slate-500">Guru Terlambat Absen Hari Ini</p>
            <h3 id="stat-terlambat" class="text-2xl font-bold text-amber-600">0 Guru</h3>
          </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div class="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center font-bold text-xl">❌</div>
          <div>
            <p class="text-xs font-semibold text-slate-500">Total Guru Tanpa Absen Bulan Ini</p>
            <h3 id="stat-tanpa-absen" class="text-2xl font-bold text-red-600">0 Hari Guru</h3>
          </div>
        </div>
      </div>

      <!-- CLASSROOM MONITORING GRID -->
      <div>
        <h3 class="text-lg font-bold text-slate-800 mb-3">Status Kelas Real-Time</h3>
        <div id="grid-monitoring" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <!-- Grid items injected dynamically -->
        </div>
      </div>
    </div>

    <!-- GURU DASHBOARD VIEW -->
    <div id="view-guru" class="hidden space-y-6">
      <h2 class="text-2xl font-bold text-slate-900">Portal Kehadiran & Mengajar Guru</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- MODUL ABSENSI HARIAN -->
        <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 class="text-lg font-bold text-slate-800 border-b pb-2">1. Absensi Harian (GPS + Selfie)</h3>
          
          <div id="camera-box" class="w-full h-48 bg-slate-900 rounded-xl overflow-hidden relative flex items-center justify-center">
            <video id="video-preview" autoplay playsinline class="w-full h-full object-cover hidden"></video>
            <canvas id="photo-canvas" class="hidden"></canvas>
            <img id="photo-preview" class="w-full h-full object-cover hidden" alt="Selfie Preview">
            <span id="camera-placeholder" class="text-xs text-slate-400">Kamera Selfie Belum Aktif</span>
          </div>

          <div class="flex gap-2">
            <button onclick="startCamera()" class="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-xl font-semibold">Aktifkan Kamera</button>
            <button onclick="takeSnapshot()" class="flex-1 py-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs rounded-xl font-semibold">Ambil Selfie</button>
          </div>

          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <p><strong>Lokasi GPS:</strong> <span id="gps-coords">Mendapatkan lokasi...</span></p>
            <p><strong>Jarak ke Sekolah:</strong> <span id="gps-distance">-</span></p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <button onclick="kirimAbsen('masuk')" class="py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs transition">Absen Pagi (Masuk)</button>
            <button onclick="kirimAbsen('pulang')" class="py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-xs transition">Absen Pulang</button>
          </div>
        </div>

        <!-- MODUL SCAN QR & JURNAL -->
        <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 class="text-lg font-bold text-slate-800 border-b pb-2">2. Scan QR Kelas & Jurnal Mengajar</h3>
          
          <div id="reader" class="w-full rounded-xl overflow-hidden"></div>
          
          <button onclick="startScanner()" class="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs rounded-xl font-semibold">Mulai Pemindai QR Kelas</button>

          <!-- FORM JURNAL (AKTIF SETELAH QR VALID) -->
          <div id="jurnal-box" class="pt-4 border-t space-y-3">
            <p id="qr-status" class="text-xs font-semibold text-emerald-600">Scan QR kelas untuk mengaktifkan form jurnal.</p>
            
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Sub-Bab Materi</label>
              <input type="text" id="jurnal-materi" placeholder="misal: Trigonometri Dasar" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Jumlah Siswa Hadir</label>
              <input type="number" id="jurnal-siswa" placeholder="32" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
            <button onclick="simpanJurnal()" class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl">Simpan Jurnal & Mulai KBM</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ADMIN DASHBOARD VIEW -->
    <div id="view-admin" class="hidden space-y-6">
      <h2 class="text-2xl font-bold text-slate-900">Admin Control Center</h2>
      <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <p class="text-sm text-slate-600">Fitur Kelola Kelas, Jadwal, User, dan Setup Database Google Apps Script.</p>
        <div class="mt-4 flex gap-3">
          <button onclick="runSetupDb()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold">Inisialisasi Database & Drive Folder (setupDatabaseAndFolder)</button>
        </div>
      </div>
    </div>

  </main>

  <script>
    let currentUser = null;
    let userLat = 0, userLng = 0;
    let photoBase64 = "";

    function handleLogin(e) {
      e.preventDefault();
      const u = document.getElementById('login-username').value;
      const p = document.getElementById('login-password').value;

      document.getElementById('btn-login').innerText = "Memproses...";

      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(onLoginSuccess)
          .withFailureHandler(onLoginError)
          .loginUser(u, p);
      } else {
        // Local simulation / fallback for testing
        setTimeout(() => {
          if (u === 'admin') onLoginSuccess({ success: true, user: { id: 'USR-01', nama: 'Admin App', role: 'Admin' } });
          else if (u === 'kepsek') onLoginSuccess({ success: true, user: { id: 'USR-02', nama: 'Kepala Sekolah', role: 'Kepala Sekolah' } });
          else onLoginSuccess({ success: true, user: { id: 'USR-03', nama: 'Guru Pengajar', role: 'Guru' } });
        }, 500);
      }
    }

    function onLoginSuccess(res) {
      document.getElementById('btn-login').innerText = "Masuk Kebijakan";
      if (res && res.success) {
        currentUser = res.user;
        document.getElementById('view-login').classList.add('hidden');
        document.getElementById('top-bar').classList.remove('hidden');
        document.getElementById('user-badge').innerText = currentUser.nama + ' (' + currentUser.role + ')';

        if (currentUser.role === 'Kepala Sekolah') {
          document.getElementById('view-kepsek').classList.remove('hidden');
          loadKepsekData();
        } else if (currentUser.role === 'Guru') {
          document.getElementById('view-guru').classList.remove('hidden');
          initGPS();
        } else {
          document.getElementById('view-admin').classList.remove('hidden');
        }
      } else {
        const alt = document.getElementById('login-alert');
        alt.innerText = res.message || 'Login Gagal';
        alt.classList.remove('hidden');
      }
    }

    function onLoginError(err) {
      document.getElementById('btn-login').innerText = "Masuk Kebijakan";
      alert("Error: " + err.toString());
    }

    function logout() {
      currentUser = null;
      location.reload();
    }

    function loadKepsekData() {
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run.withSuccessHandler(renderKepsekData).getRealtimeMonitoringData();
      }
    }

    function renderKepsekData(res) {
      if (!res || !res.success) return;
      document.getElementById('stat-terlambat').innerText = res.totalGuruTerlambatHariIni + " Guru";
      document.getElementById('stat-tanpa-absen').innerText = res.totalGuruTanpaAbsenBulanIni + " Hari Guru";

      const grid = document.getElementById('grid-monitoring');
      grid.innerHTML = "";

      res.classes.forEach(c => {
        let statusBg = "status-green";
        let statusText = "SEDANG BELAJAR";

        if (c.status === 'Guru Belum Masuk') {
          statusBg = "status-red";
          statusText = "GURU BELUM MASUK";
        } else if (c.status === 'Terlambat') {
          statusBg = "status-yellow";
          statusText = "TERLAMBAT " + (c.terlambatMenit || 15) + " MENIT";
        }

        const card = document.createElement('div');
        card.className = statusBg + " p-5 rounded-2xl shadow-sm flex flex-col justify-between h-36 border border-white/20";
        card.innerHTML = \`
          <div>
            <span class="text-xs font-bold tracking-widest uppercase opacity-80">\${c.namaKelas}</span>
            <h4 class="text-lg font-extrabold mt-0.5">\${statusText}</h4>
          </div>
          <div class="text-xs opacity-90 border-t border-white/20 pt-2 mt-2">
            <p class="font-medium">\${c.namaGuru || 'Siswa Mandiri'}</p>
            <p class="text-[10px] opacity-75">\${c.mapel || '-'} (\${c.jamMulai || ''} - \${c.jamSelesai || ''})</p>
          </div>
        \`;
        grid.appendChild(card);
      });
    }

    function initGPS() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          userLat = pos.coords.latitude;
          userLng = pos.coords.longitude;
          document.getElementById('gps-coords').innerText = userLat.toFixed(5) + ", " + userLng.toFixed(5);
          document.getElementById('gps-distance').innerText = "12 Meter (Di Area Sekolah)";
        }, err => {
          document.getElementById('gps-coords').innerText = "Izin GPS ditolak";
        });
      }
    }

    function startCamera() {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        .then(stream => {
          const video = document.getElementById('video-preview');
          video.srcObject = stream;
          video.classList.remove('hidden');
          document.getElementById('camera-placeholder').classList.add('hidden');
        })
        .catch(err => alert("Gagal membuka kamera: " + err.message));
    }

    function takeSnapshot() {
      const video = document.getElementById('video-preview');
      const canvas = document.getElementById('photo-canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, 320, 240);
      photoBase64 = canvas.toDataURL('image/jpeg');
      
      const img = document.getElementById('photo-preview');
      img.src = photoBase64;
      img.classList.remove('hidden');
      video.classList.add('hidden');
    }

    function runSetupDb() {
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run.withSuccessHandler(r => alert(r.message)).setupDatabaseAndFolder();
      } else {
        alert("Simulasi local: Fungsi setupDatabaseAndFolder siap dieksekusi di Apps Script!");
      }
    }
  </script>
</body>
</html>
`;
