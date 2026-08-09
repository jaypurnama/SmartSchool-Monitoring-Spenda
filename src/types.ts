export type Role = 'Admin' | 'Kepala Sekolah' | 'Guru';

export interface User {
  id: string;
  username: string;
  password?: string;
  nama: string;
  role: Role;
  createdAt?: string;
  nip?: string;
}

export interface Kelas {
  id: string;
  namaKelas: string;
}

export interface Jadwal {
  id: string;
  hari: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
  jamMulai: string; // HH:mm format, e.g. "07:00"
  jamSelesai: string; // HH:mm format, e.g. "08:30"
  kelasId: string;
  guruId: string;
  mapel: string;
}

export interface AbsensiHarian {
  id: string;
  tanggal: string; // YYYY-MM-DD
  guruId: string;
  guruNama?: string;
  jamMasuk?: string;
  fotoMasuk?: string;
  latLongMasuk?: string;
  jamPulang?: string;
  fotoPulang?: string;
  latLongPulang?: string;
  status: 'Hadir' | 'Terlambat' | 'Tanpa Absen';
}

export interface JurnalMengajar {
  id: string;
  tanggal: string; // YYYY-MM-DD
  jam: string;
  kelasId: string;
  kelasNama?: string;
  guruId: string;
  guruNama?: string;
  mapel: string;
  subBabMateri: string;
  jumlahSiswaHadir: number;
  status: 'Sedang KBM' | 'Sudah KBM' | 'Sedang Belajar' | 'Selesai' | string;
}

export interface Settings {
  webAppUrl: string;
  schoolLat: number;
  schoolLng: number;
  radiusToleransiMeter: number;
  toleransiTerlambatMenit: number;
  schoolName: string;
}

export interface MonitoringClassStatus {
  kelasId: string;
  namaKelas: string;
  status: 'Sedang KBM' | 'Sudah KBM' | 'Sedang Belajar' | 'Guru Belum Masuk' | 'Terlambat' | string;
  namaGuru?: string;
  guruId?: string;
  mapel?: string;
  jamMulai?: string;
  jamSelesai?: string;
  terlambatMenit?: number;
  jurnalId?: string;
  subBabMateri?: string;
  jumlahSiswaHadir?: number;
}

export interface RealtimeMonitoringSummary {
  totalGuruTerlambatHariIni: number;
  totalGuruTanpaAbsenBulanIni: number;
  classes: MonitoringClassStatus[];
}
