import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { GasService } from '../services/gasService';
import { School, LogOut, Clock, Calendar, Shield, UserCheck, BookOpen, Link2 } from 'lucide-react';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  schoolName: string;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout, schoolName }) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [hasGasUrl, setHasGasUrl] = useState<boolean>(false);

  useEffect(() => {
    setHasGasUrl(Boolean(GasService.getStoredWebAppUrl()));

    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getRoleBadge = () => {
    switch (user.role) {
      case 'Admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20 tracking-wider">
            <Shield className="w-3 h-3" />
            Admin
          </span>
        );
      case 'Kepala Sekolah':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 tracking-wider">
            <UserCheck className="w-3 h-3" />
            Kepala Sekolah
          </span>
        );
      case 'Guru':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 tracking-wider">
            <BookOpen className="w-3 h-3" />
            Guru Pengajar
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="bg-[#0f172a] text-white border-b border-slate-800 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & School Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-white text-lg shadow-sm">
            <School className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white leading-tight">SMARTSCHOOL</h1>
              {hasGasUrl ? (
                <span className="px-2 py-0.5 text-[9px] font-extrabold bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30 uppercase tracking-widest flex items-center gap-1">
                  <Link2 className="w-2.5 h-2.5" />
                  Spreadsheet Active
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[9px] font-extrabold bg-amber-500/20 text-amber-400 rounded border border-amber-500/30 uppercase tracking-widest">
                  Local Mode
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-medium">{schoolName}</p>
          </div>
        </div>

        {/* Real-time Clock & Date */}
        <div className="hidden md:flex items-center gap-4 px-3.5 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700/80 text-xs text-slate-300">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold">{dateStr}</span>
          </div>
          <div className="w-px h-3.5 bg-slate-700" />
          <div className="flex items-center gap-1.5 font-mono text-emerald-400 font-bold text-[11px]">
            <Clock className="w-3.5 h-3.5" />
            <span>{timeStr}</span>
          </div>
          <div className="w-px h-3.5 bg-slate-700" />
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Live</span>
          </div>
        </div>

        {/* User Badge & Logout Button */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white">{user.nama}</p>
            <div className="mt-0.5">{getRoleBadge()}</div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg text-xs font-bold transition-colors border border-rose-500/20"
            title="Keluar dari sistem"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
