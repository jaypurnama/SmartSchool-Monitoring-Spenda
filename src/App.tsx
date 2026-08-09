import React, { useState, useEffect } from 'react';
import { User, Settings } from './types';
import { Header } from './components/Header';
import { Login } from './components/Login';
import { KepalaSekolahDashboard } from './components/KepalaSekolahDashboard';
import { GuruDashboard } from './components/GuruDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { GasService } from './services/gasService';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [schoolSettings, setSchoolSettings] = useState<Settings>({
    webAppUrl: '',
    schoolName: 'SMP Negeri 1 SmartSchool',
    schoolLat: -6.200000,
    schoolLng: 106.816666,
    radiusToleransiMeter: 50,
    toleransiTerlambatMenit: 10
  });

  useEffect(() => {
    // Load stored user session if any
    const storedUser = localStorage.getItem('smartschool_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {}
    }

    // Load initial settings
    GasService.getSettings().then(res => {
      if (res && res.success && res.settings) {
        setSchoolSettings(res.settings);
      }
    });
  }, []);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('smartschool_user', JSON.stringify(loggedInUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('smartschool_user');
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white">
      <Header
        user={user}
        onLogout={handleLogout}
        schoolName={schoolSettings.schoolName}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {user.role === 'Kepala Sekolah' && <KepalaSekolahDashboard user={user} />}
        {user.role === 'Guru' && <GuruDashboard user={user} />}
        {user.role === 'Admin' && <AdminDashboard user={user} />}
      </main>

      <footer className="bg-white border-t border-slate-200/80 py-3 text-center text-[11px] text-slate-500 font-medium">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="flex items-center gap-1.5">
            <span className="font-bold text-slate-700">SMARTSCHOOL MONITORING</span>
            <span>—</span>
            <span className="text-emerald-600 font-semibold">Google Apps Script &amp; Google Sheets Architecture</span>
          </p>
          <p className="text-slate-400 font-mono text-[10px]">Real-time Sync Active</p>
        </div>
      </footer>
    </div>
  );
}
