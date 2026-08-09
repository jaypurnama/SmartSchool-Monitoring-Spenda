import React, { useState, useEffect } from 'react';
import { User, Kelas, Jadwal, Settings } from '../types';
import { GasService } from '../services/gasService';
import { QrCodeModal } from './QrCodeModal';
import { GasCodeExport } from './GasCodeExport';
import { LayoutDashboard, School, Calendar, Users, Settings as SettingsIcon, Database, Plus, Trash2, Edit, QrCode, CheckCircle2, Save, MapPin, Globe } from 'lucide-react';

interface AdminDashboardProps {
  user: User;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'kelas' | 'jadwal' | 'users' | 'settings' | 'setupDb'>('overview');
  
  // Data State
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [userList, setUserList] = useState<User[]>([]);
  const [settings, setSettings] = useState<Settings>({
    webAppUrl: GasService.getStoredWebAppUrl(),
    schoolName: 'SMP Negeri 1 SmartSchool',
    schoolLat: -6.200000,
    schoolLng: 106.816666,
    radiusToleransiMeter: 50,
    toleransiTerlambatMenit: 10
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [selectedQrKelas, setSelectedQrKelas] = useState<Kelas | null>(null);

  // Form Modals
  const [showKelasModal, setShowKelasModal] = useState<boolean>(false);
  const [editKelasData, setEditKelasData] = useState<{ id?: string; namaKelas: string }>({ namaKelas: '' });

  const [showJadwalModal, setShowJadwalModal] = useState<boolean>(false);
  const [editJadwalData, setEditJadwalData] = useState<any>({
    hari: 'Senin',
    jamMulai: '07:00',
    jamSelesai: '08:30',
    kelasId: 'KLS-001',
    guruId: 'USR-003',
    mapel: 'Matematika'
  });

  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [editUserData, setEditUserData] = useState<any>({
    username: '',
    password: '123',
    nama: '',
    role: 'Guru'
  });

  const [settingsSavedMsg, setSettingsSavedMsg] = useState<string>('');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [kRes, jRes, uRes, sRes] = await Promise.all([
        GasService.getKelas(),
        GasService.getJadwal(),
        GasService.getUsers(),
        GasService.getSettings()
      ]);

      if (kRes && kRes.success) setKelasList(kRes.data || []);
      if (jRes && jRes.success) setJadwalList(jRes.data || []);
      if (uRes && uRes.success) setUserList(uRes.data || []);
      if (sRes && sRes.success && sRes.settings) {
        setSettings({
          ...sRes.settings,
          webAppUrl: sRes.settings.webAppUrl || GasService.getStoredWebAppUrl()
        });
      }
    } catch (err) {
      console.error("Error loading admin data", err);
    } finally {
      setLoading(false);
    }
  };

  // KELAS CRUD
  const handleSaveKelas = async (e: React.FormEvent) => {
    e.preventDefault();
    await GasService.saveKelas(editKelasData);
    setShowKelasModal(false);
    setEditKelasData({ namaKelas: '' });
    loadAllData();
  };

  const handleDeleteKelas = async (id: string) => {
    if (confirm("Hapus kelas ini dari database?")) {
      await GasService.deleteKelas(id);
      loadAllData();
    }
  };

  // JADWAL CRUD
  const handleSaveJadwal = async (e: React.FormEvent) => {
    e.preventDefault();
    await GasService.saveJadwal(editJadwalData);
    setShowJadwalModal(false);
    loadAllData();
  };

  const handleDeleteJadwal = async (id: string) => {
    if (confirm("Hapus jadwal mengajar ini?")) {
      await GasService.deleteJadwal(id);
      loadAllData();
    }
  };

  // USER CRUD
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await GasService.saveUser(editUserData);
    setShowUserModal(false);
    setEditUserData({ username: '', password: '123', nama: '', role: 'Guru' });
    loadAllData();
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm("Hapus pengguna ini dari database?")) {
      await GasService.deleteUser(id);
      loadAllData();
    }
  };

  // SETTINGS SAVE
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (settings.webAppUrl !== undefined) {
      GasService.setStoredWebAppUrl(settings.webAppUrl);
    }
    const res = await GasService.saveSettings(settings);
    if (res && res.success) {
      setSettingsSavedMsg("Pengaturan sekolah & Web App URL berhasil disimpan!");
      setTimeout(() => setSettingsSavedMsg(''), 3000);
    }
  };

  const handleSetupDatabase = async () => {
    const res = await GasService.setupDatabaseAndFolder();
    alert(res.message || "Database & Drive Folder diinisialisasi!");
    loadAllData();
  };

  return (
    <div className="space-y-6">
      
      {/* Navigation Tabs Bar */}
      <div className="flex flex-wrap items-center gap-1.5 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'overview' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" /> Ringkasan Admin
        </button>
        <button
          onClick={() => setActiveTab('kelas')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'kelas' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <School className="w-3.5 h-3.5 text-emerald-400" /> Kelola Kelas &amp; QR Code
        </button>
        <button
          onClick={() => setActiveTab('jadwal')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'jadwal' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Jadwal Mengajar Guru
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'users' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-emerald-400" /> Data Pengguna (Users)
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'settings' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <SettingsIcon className="w-3.5 h-3.5 text-emerald-400" /> Profil Sekolah &amp; GPS
        </button>
        <button
          onClick={() => setActiveTab('setupDb')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'setupDb' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          <Database className="w-3.5 h-3.5" /> Setup Apps Script
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Kelas</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{kelasList.length}</h3>
              </div>
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                <School className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jadwal Mengajar</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{jadwalList.length}</h3>
              </div>
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                <Calendar className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pengguna</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{userList.length}</h3>
              </div>
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">URL Apps Script</p>
                <p className="text-xs font-bold text-emerald-600 mt-1">{settings.webAppUrl ? 'Terkoneksi' : 'Lokal Mode'}</p>
              </div>
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">
                <Globe className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Status Database & Google Sheets Integration</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Seluruh data sekolah (Kelas, Jadwal, User, Absensi Harian Selfie, dan Jurnal Mengajar) terintegrasi langsung dengan struktur tabel Google Sheets berikut:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-50 border rounded-xl font-semibold text-slate-700">📄 Sheet: USERS</div>
              <div className="p-3 bg-slate-50 border rounded-xl font-semibold text-slate-700">📄 Sheet: KELAS</div>
              <div className="p-3 bg-slate-50 border rounded-xl font-semibold text-slate-700">📄 Sheet: JADWAL</div>
              <div className="p-3 bg-slate-50 border rounded-xl font-semibold text-slate-700">📄 Sheet: ABSENSI_HARIAN</div>
              <div className="p-3 bg-slate-50 border rounded-xl font-semibold text-slate-700">📄 Sheet: JURNAL_KEMENGAJARAN</div>
              <div className="p-3 bg-slate-50 border rounded-xl font-semibold text-slate-700">📄 Sheet: SETTINGS</div>
            </div>
          </div>
        </div>
      )}

      {/* KELAS TAB */}
      {activeTab === 'kelas' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Kelola Data Kelas & QR Code Pintu Kelas</h3>
            <button
              onClick={() => { setEditKelasData({ namaKelas: '' }); setShowKelasModal(true); }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" /> Tambah Kelas
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5">ID Kelas</th>
                  <th className="p-3.5">Nama Kelas</th>
                  <th className="p-3.5">Cetak QR Code</th>
                  <th className="p-3.5">Aksi Hapus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {kelasList.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-mono font-bold text-slate-900">{k.id}</td>
                    <td className="p-3.5 font-bold text-emerald-700 text-sm">{k.namaKelas}</td>
                    <td className="p-3.5">
                      <button
                        onClick={() => setSelectedQrKelas(k)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-[11px] border border-indigo-200 flex items-center gap-1.5"
                      >
                        <QrCode className="w-3.5 h-3.5" /> Pratinjau QR Code
                      </button>
                    </td>
                    <td className="p-3.5">
                      <button
                        onClick={() => handleDeleteKelas(k.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Hapus Kelas"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* JADWAL TAB */}
      {activeTab === 'jadwal' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Jadwal Mengajar Mingguan Seluruh Guru</h3>
            <button
              onClick={() => setShowJadwalModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" /> Tambah Jadwal Mengajar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Hari</th>
                  <th className="p-3.5">Jam Mengajar</th>
                  <th className="p-3.5">Kelas</th>
                  <th className="p-3.5">Guru ID</th>
                  <th className="p-3.5">Mata Pelajaran</th>
                  <th className="p-3.5">Hapus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {jadwalList.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-bold text-slate-900">{j.hari}</td>
                    <td className="p-3.5 font-mono text-emerald-700 font-semibold">{j.jamMulai} - {j.jamSelesai}</td>
                    <td className="p-3.5 font-bold text-slate-800">{j.kelasId}</td>
                    <td className="p-3.5 font-bold text-purple-700">{j.guruId}</td>
                    <td className="p-3.5 font-semibold">{j.mapel}</td>
                    <td className="p-3.5">
                      <button
                        onClick={() => handleDeleteJadwal(j.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Kelola Data Pengguna (Users &amp; Roles)</h3>
            <button
              onClick={() => setShowUserModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" /> Tambah User Baru
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5">User ID</th>
                  <th className="p-3.5">Username</th>
                  <th className="p-3.5">Nama Lengkap</th>
                  <th className="p-3.5">Role Aksen</th>
                  <th className="p-3.5">Hapus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {userList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-mono font-bold text-slate-900">{u.id}</td>
                    <td className="p-3.5 font-bold text-slate-800">{u.username}</td>
                    <td className="p-3.5 font-semibold text-slate-900">{u.nama}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        u.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                        u.role === 'Kepala Sekolah' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 max-w-2xl space-y-6">
          <h3 className="text-base font-bold text-slate-900 border-b pb-3">Profil Sekolah &amp; Konfigurasi Google Apps Script</h3>

          {settingsSavedMsg && (
            <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{settingsSavedMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Sekolah / Instansi</label>
              <input
                type="text"
                value={settings.schoolName}
                onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Web App URL Google Apps Script (Sesuai Deploy)</label>
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={settings.webAppUrl}
                onChange={(e) => setSettings({ ...settings, webAppUrl: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Masukkan URL Web App GAS jika ingin menghubungkan front-end ini secara langsung ke Google Apps Script.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Koordinat GPS Lat Sekolah</label>
                <input
                  type="number"
                  step="any"
                  value={settings.schoolLat}
                  onChange={(e) => setSettings({ ...settings, schoolLat: parseFloat(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Koordinat GPS Long Sekolah</label>
                <input
                  type="number"
                  step="any"
                  value={settings.schoolLng}
                  onChange={(e) => setSettings({ ...settings, schoolLng: parseFloat(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Radius Toleransi Jarak Absen (Meter)</label>
                <input
                  type="number"
                  value={settings.radiusToleransiMeter}
                  onChange={(e) => setSettings({ ...settings, radiusToleransiMeter: parseInt(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Toleransi Waktu Terlambat (Menit)</label>
                <input
                  type="number"
                  value={settings.toleransiTerlambatMenit}
                  onChange={(e) => setSettings({ ...settings, toleransiTerlambatMenit: parseInt(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Simpan Pengaturan Sekolah
            </button>
          </form>
        </div>
      )}

      {/* SETUP DB & CODE EXPORT TAB */}
      {activeTab === 'setupDb' && (
        <div className="space-y-6">
          <div className="bg-emerald-900 text-white p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black">Inisialisasi Database Google Sheets Auto-Setup</h3>
              <p className="text-xs text-emerald-200 mt-1">Eksekusi fungsi `setupDatabaseAndFolder()` untuk membentuk 6 tabel Sheet & Drive Folder secara otomatis.</p>
            </div>
            <button
              onClick={handleSetupDatabase}
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl transition shadow-lg shadow-emerald-500/30 shrink-0"
            >
              Jalankan setupDatabaseAndFolder()
            </button>
          </div>

          <GasCodeExport />
        </div>
      )}

      {/* QR MODAL */}
      {selectedQrKelas && (
        <QrCodeModal
          kelasId={selectedQrKelas.id}
          namaKelas={selectedQrKelas.namaKelas}
          onClose={() => setSelectedQrKelas(null)}
        />
      )}

      {/* KELAS MODAL */}
      {showKelasModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Tambah Kelas Baru</h3>
            <form onSubmit={handleSaveKelas} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Kelas (misal: VII.A, IX.B)</label>
                <input
                  type="text"
                  required
                  value={editKelasData.namaKelas}
                  onChange={(e) => setEditKelasData({ ...editKelasData, namaKelas: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowKelasModal(false)} className="flex-1 py-2 bg-slate-100 text-xs font-semibold rounded-xl">Batal</button>
                <button type="submit" className="flex-1 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JADWAL MODAL */}
      {showJadwalModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Tambah Jadwal Mengajar</h3>
            <form onSubmit={handleSaveJadwal} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Hari</label>
                  <select
                    value={editJadwalData.hari}
                    onChange={(e) => setEditJadwalData({ ...editJadwalData, hari: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  >
                    <option value="Senin">Senin</option>
                    <option value="Selasa">Selasa</option>
                    <option value="Rabu">Rabu</option>
                    <option value="Kamis">Kamis</option>
                    <option value="Jumat">Jumat</option>
                    <option value="Sabtu">Sabtu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Mata Pelajaran</label>
                  <input
                    type="text"
                    required
                    value={editJadwalData.mapel}
                    onChange={(e) => setEditJadwalData({ ...editJadwalData, mapel: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Jam Mulai</label>
                  <input
                    type="text"
                    placeholder="07:00"
                    value={editJadwalData.jamMulai}
                    onChange={(e) => setEditJadwalData({ ...editJadwalData, jamMulai: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Jam Selesai</label>
                  <input
                    type="text"
                    placeholder="08:30"
                    value={editJadwalData.jamSelesai}
                    onChange={(e) => setEditJadwalData({ ...editJadwalData, jamSelesai: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Pilih Kelas</label>
                  <select
                    value={editJadwalData.kelasId}
                    onChange={(e) => setEditJadwalData({ ...editJadwalData, kelasId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  >
                    {kelasList.map(k => <option key={k.id} value={k.id}>{k.namaKelas} ({k.id})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Pilih Guru</label>
                  <select
                    value={editJadwalData.guruId}
                    onChange={(e) => setEditJadwalData({ ...editJadwalData, guruId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  >
                    {userList.filter(u => u.role === 'Guru').map(u => <option key={u.id} value={u.id}>{u.nama}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowJadwalModal(false)} className="flex-1 py-2 bg-slate-100 text-xs font-semibold rounded-xl">Batal</button>
                <button type="submit" className="flex-1 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl">Simpan Jadwal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER MODAL */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Tambah User Pengguna Baru</h3>
            <form onSubmit={handleSaveUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={editUserData.username}
                  onChange={(e) => setEditUserData({ ...editUserData, username: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={editUserData.nama}
                  onChange={(e) => setEditUserData({ ...editUserData, nama: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role Pengguna</label>
                <select
                  value={editUserData.role}
                  onChange={(e) => setEditUserData({ ...editUserData, role: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border text-xs outline-none"
                >
                  <option value="Admin">Admin</option>
                  <option value="Kepala Sekolah">Kepala Sekolah</option>
                  <option value="Guru">Guru</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={editUserData.password}
                  onChange={(e) => setEditUserData({ ...editUserData, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-xs outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 py-2 bg-slate-100 text-xs font-semibold rounded-xl">Batal</button>
                <button type="submit" className="flex-1 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl">Simpan User</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
