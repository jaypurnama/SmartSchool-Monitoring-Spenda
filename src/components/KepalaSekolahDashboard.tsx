import React, { useState, useEffect } from 'react';
import { User, MonitoringClassStatus, JurnalMengajar, AbsensiHarian } from '../types';
import { GasService } from '../services/gasService';
import { RefreshCw, Users, AlertTriangle, UserX, BookOpen, CheckCircle, Clock, Search, Eye, Camera, MapPin, Calendar } from 'lucide-react';

interface KepalaSekolahDashboardProps {
  user: User;
}

export const KepalaSekolahDashboard: React.FC<KepalaSekolahDashboardProps> = ({ user }) => {
  const [monitoringClasses, setMonitoringClasses] = useState<MonitoringClassStatus[]>([]);
  const [totalTerlambat, setTotalTerlambat] = useState<number>(0);
  const [totalTanpaAbsen, setTotalTanpaAbsen] = useState<number>(0);
  const [journals, setJournals] = useState<JurnalMengajar[]>([]);
  const [absensiList, setAbsensiList] = useState<AbsensiHarian[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'grid' | 'jurnal' | 'rekapAbsen'>('grid');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const fetchRealtimeData = async () => {
    setLoading(true);
    try {
      const res = await GasService.getRealtimeMonitoringData();
      if (res && res.success) {
        setMonitoringClasses(res.classes || []);
        setTotalTerlambat(res.totalGuruTerlambatHariIni || 0);
        setTotalTanpaAbsen(res.totalGuruTanpaAbsenBulanIni || 0);
        if (res.journals) setJournals(res.journals);
        if (res.absensi) setAbsensiList(res.absensi);
      }
    } catch (err) {
      console.error("Failed to fetch monitoring data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealtimeData();
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchRealtimeData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filtering
  const filteredClasses = monitoringClasses.filter(c =>
    c.namaKelas.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.namaGuru && c.namaGuru.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.mapel && c.mapel.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      
      {/* Header Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Real-time Monitoring Dashboard</h2>
            <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-[10px] font-bold rounded-full border border-rose-200 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              Live Tracking
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Dashboard Kepala Sekolah — Pantau ketersediaan guru dan proses KBM kelas secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchRealtimeData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : 'text-emerald-400'}`} />
            <span>Refresh Live Data</span>
          </button>
        </div>
      </div>

      {/* SUMMARY STAT CARDS (4-Column High Density Grid) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Guru Terlambat Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">Guru Terlambat</div>
          <div className="text-2xl font-bold text-amber-600">
            {String(totalTerlambat).padStart(2, '0')} <span className="text-xs font-normal text-slate-400 ml-1">Personel</span>
          </div>
        </div>

        {/* Guru Belum Masuk Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">Guru Belum Masuk</div>
          <div className="text-2xl font-bold text-rose-600">
            {String(monitoringClasses.filter(c => c.status === 'Guru Belum Masuk').length).padStart(2, '0')} <span className="text-xs font-normal text-slate-400 ml-1">Kelas</span>
          </div>
        </div>

        {/* Sedang KBM Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">Sedang KBM</div>
          <div className="text-2xl font-bold text-emerald-600">
            {String(monitoringClasses.filter(c => c.status === 'Sedang KBM' || c.status === 'Sedang Belajar').length).padStart(2, '0')} <span className="text-xs font-normal text-slate-400 ml-1">Kelas</span>
          </div>
        </div>

        {/* Sudah KBM Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">Sudah KBM</div>
          <div className="text-2xl font-bold text-indigo-600">
            {String(monitoringClasses.filter(c => c.status === 'Sudah KBM' || c.status === 'Selesai').length).padStart(2, '0')} <span className="text-xs font-normal text-slate-400 ml-1">Kelas</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('grid')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'grid'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
          <span>Grid Monitoring Kelas</span>
        </button>
        <button
          onClick={() => setActiveTab('jurnal')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'jurnal'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          <span>Jurnal Mengajar Guru</span>
        </button>
        <button
          onClick={() => setActiveTab('rekapAbsen')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'rekapAbsen'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-emerald-400" />
          <span>Rekap Absensi Harian Guru</span>
        </button>
      </div>

      {/* TAB 1: REAL-TIME CLASSROOM MONITORING GRID */}
      {activeTab === 'grid' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
          {/* Header Controls & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600 uppercase tracking-tighter">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span>Sedang KBM</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                <span>Sudah KBM</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span>Terlambat</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                <span>Guru Belum Masuk</span>
              </div>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter kelas, guru, mapel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>
          </div>

          {/* High Density Class Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredClasses.map((item) => {
              if (item.status === 'Guru Belum Masuk') {
                return (
                  <div
                    key={item.kelasId}
                    className="bg-rose-50/80 border-2 border-rose-500 rounded-xl p-4 flex flex-col justify-between transition-all hover:shadow-md"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-lg font-black text-rose-800">{item.namaKelas}</span>
                        <span className="text-[9px] bg-rose-500 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                          BELUM MASUK
                        </span>
                      </div>
                      <div className="text-xs font-bold text-rose-900 truncate">{item.namaGuru || 'Belum Mengisi Jurnal'}</div>
                      <div className="text-[10px] text-rose-700 italic mt-0.5">{item.mapel || 'Jadwal Hari Ini'}</div>
                    </div>
                    <div className="text-[10px] font-bold text-rose-600 mt-3 border-t border-rose-200 pt-2 flex items-center justify-between">
                      <span>BELUM SCAN QR KELAS</span>
                      <span className="font-mono text-rose-700">{item.jamMulai || '07:30'}</span>
                    </div>
                  </div>
                );
              }

              if (item.status === 'Terlambat') {
                return (
                  <div
                    key={item.kelasId}
                    className="bg-amber-50/80 border-2 border-amber-500 rounded-xl p-4 flex flex-col justify-between transition-all hover:shadow-md"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-lg font-black text-amber-800">{item.namaKelas}</span>
                        <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                          TERLAMBAT
                        </span>
                      </div>
                      <div className="text-xs font-bold text-amber-900 truncate">{item.namaGuru}</div>
                      <div className="text-[10px] text-amber-700 mt-0.5">{item.mapel || 'Mata Pelajaran'}</div>
                    </div>
                    <div className="text-[10px] font-bold text-amber-600 mt-3 border-t border-amber-200 pt-2 flex justify-between items-center">
                      <span>Terlambat {item.terlambatMenit || 10}m</span>
                      <span className="animate-pulse text-amber-700 font-black italic">! WAIT</span>
                    </div>
                  </div>
                );
              }

              if (item.status === 'Sudah KBM' || item.status === 'Selesai') {
                return (
                  <div
                    key={item.kelasId}
                    className="bg-indigo-50/60 border-2 border-indigo-400 rounded-xl p-4 flex flex-col justify-between transition-all hover:shadow-md"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-lg font-black text-indigo-900">{item.namaKelas}</span>
                        <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                          SUDAH KBM
                        </span>
                      </div>
                      <div className="text-xs font-bold text-indigo-950 truncate">{item.namaGuru}</div>
                      <div className="text-[11px] text-indigo-800 mt-1 whitespace-pre-wrap line-clamp-2">
                        {item.mapel} {item.subBabMateri ? ` — ${item.subBabMateri}` : ''}
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-indigo-700 mt-3 border-t border-indigo-200 pt-2 flex justify-between">
                      <span>Selesai: {item.jamSelesai || '16:00'}</span>
                      <span className="font-bold">{item.jumlahSiswaHadir || 0} Siswa</span>
                    </div>
                  </div>
                );
              }

              // Active / Sedang KBM
              return (
                <div
                  key={item.kelasId}
                  className="bg-emerald-50/60 border-2 border-emerald-500 rounded-xl p-4 flex flex-col justify-between transition-all hover:shadow-md"
                >
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-lg font-black text-emerald-900">{item.namaKelas}</span>
                      <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider animate-pulse">
                        SEDANG KBM
                      </span>
                    </div>
                    <div className="text-xs font-bold text-emerald-950 truncate">{item.namaGuru}</div>
                    <div className="text-[11px] text-emerald-800 mt-1 whitespace-pre-wrap line-clamp-2">
                      {item.mapel} {item.subBabMateri ? ` — ${item.subBabMateri}` : ''}
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-emerald-700 mt-3 border-t border-emerald-200 pt-2 flex justify-between">
                    <span>{item.jamMulai || '07:30'} - {item.jamSelesai || '09:00'}</span>
                    <span className="font-bold">{item.jumlahSiswaHadir || 0} Siswa</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: JURNAL MENGAJAR VIEWER */}
      {activeTab === 'jurnal' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Daftar Jurnal Mengajar Hari Ini</h3>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{journals.length} Jurnal Terdaftar</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Waktu</th>
                  <th className="p-3">Kelas</th>
                  <th className="p-3">Mata Pelajaran</th>
                  <th className="p-3">Sub-Bab Materi</th>
                  <th className="p-3">Siswa Hadir</th>
                  <th className="p-3">Status KBM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {journals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Belum ada jurnal mengajar yang diisi hari ini.
                    </td>
                  </tr>
                ) : (
                  journals.map((j) => (
                    <tr key={j.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-mono font-bold text-slate-900">{j.jam}</td>
                      <td className="p-3 font-bold text-emerald-700">{j.kelasNama || j.kelasId}</td>
                      <td className="p-3 font-semibold">{j.mapel}</td>
                      <td className="p-3 text-slate-800 whitespace-pre-wrap max-w-xs leading-relaxed">{j.subBabMateri}</td>
                      <td className="p-3 font-mono text-slate-600">{j.jumlahSiswaHadir} Siswa</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          j.status === 'Sudah KBM' || j.status === 'Selesai'
                            ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}>
                          {j.status || 'Sedang KBM'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: REKAP ABSENSI HARIAN GURU */}
      {activeTab === 'rekapAbsen' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Rekap Absensi Selfie &amp; GPS Guru</h3>
            <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">{absensiList.length} Catatan Absen</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Guru ID</th>
                  <th className="p-3">Jam Masuk</th>
                  <th className="p-3">Foto Masuk</th>
                  <th className="p-3">Jam Pulang</th>
                  <th className="p-3">GPS Lat/Long</th>
                  <th className="p-3">Status Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {absensiList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Belum ada data absensi selfie hari ini.
                    </td>
                  </tr>
                ) : (
                  absensiList.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/80">
                      <td className="p-3">{a.tanggal}</td>
                      <td className="p-3 font-bold text-slate-900">{a.guruId}</td>
                      <td className="p-3 font-mono text-emerald-600 font-bold">{a.jamMasuk || '-'}</td>
                      <td className="p-3">
                        {a.fotoMasuk ? (
                          <button
                            onClick={() => setSelectedPhoto(a.fotoMasuk || null)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-bold text-slate-700 flex items-center gap-1 border border-slate-200"
                          >
                            <Camera className="w-3 h-3 text-emerald-600" /> Lihat Foto
                          </button>
                        ) : '-'}
                      </td>
                      <td className="p-3 font-mono text-amber-600 font-bold">{a.jamPulang || '-'}</td>
                      <td className="p-3 font-mono text-[11px] text-slate-500">
                        {a.latLongMasuk ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-red-500" />
                            {a.latLongMasuk}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          a.status === 'Terlambat'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SYSTEM LOGS FOOTER BAR */}
      <div className="bg-[#0f172a] text-slate-300 p-3 rounded-xl border border-slate-800 text-[10px] flex items-center gap-3 overflow-hidden shadow-sm">
        <span className="text-emerald-400 font-bold uppercase tracking-wider shrink-0 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          System Logs
        </span>
        <div className="flex gap-6 text-slate-400 font-mono overflow-x-auto whitespace-nowrap">
          <span>[LIVE DB]: Realtime sheet polling active.</span>
          <span>[GPS VALIDATION]: Auto-radius check tolerance set to 50m.</span>
          <span>[STATUS]: {monitoringClasses.filter(c => c.status === 'Sedang Belajar').length} Active, {monitoringClasses.filter(c => c.status === 'Guru Belum Masuk').length} Vacant.</span>
        </div>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Foto Selfie Absensi Guru</h3>
            <div className="w-full h-60 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
              <img src={selectedPhoto} alt="Foto Selfie" className="w-full h-full object-cover" />
            </div>
            <button
              onClick={() => setSelectedPhoto(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs"
            >
              Tutup Modal
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
