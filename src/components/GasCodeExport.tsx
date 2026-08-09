import React, { useState } from 'react';
import { CODE_GS } from '../data/gasCodeRaw';
import { FileCode, Copy, Download, Check, ExternalLink, Terminal } from 'lucide-react';

export const GasCodeExport: React.FC = () => {
  const [copiedGs, setCopiedGs] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedGs(true);
    setTimeout(() => setCopiedGs(false), 2000);
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-black text-slate-900">Google Apps Script Backend Source Code (`Code.gs`)</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Salin / Unduh kode resmi Google Apps Script (<code className="font-bold text-slate-700">Code.gs</code>) untuk menghubungkan aplikasi front-end React ini (AI Studio / Vercel / GitHub) dengan Google Sheets Database.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => downloadFile(CODE_GS, 'Code.gs')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4 text-slate-600" /> Unduh Code.gs
          </button>
          <button
            onClick={() => copyToClipboard(CODE_GS)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
          >
            {copiedGs ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedGs ? 'Tersalin!' : 'Salin Code.gs'}</span>
          </button>
        </div>
      </div>

      {/* Code Header Bar */}
      <div className="flex items-center justify-between bg-slate-900 text-slate-300 px-4 py-2.5 rounded-t-2xl font-mono text-xs border border-slate-800">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-white">Code.gs</span>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">Google Apps Script Backend</span>
        </div>
        <button
          onClick={() => copyToClipboard(CODE_GS)}
          className="text-emerald-400 hover:text-emerald-300 text-[11px] font-bold flex items-center gap-1"
        >
          {copiedGs ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedGs ? 'Tersalin' : 'Salin Semua'}</span>
        </button>
      </div>

      {/* Code Display Box */}
      <div className="bg-slate-950 text-slate-200 p-4 rounded-b-2xl overflow-x-auto max-h-[500px] border-x border-b border-slate-800 font-mono text-xs leading-relaxed -mt-6">
        <pre>{CODE_GS}</pre>
      </div>

      {/* Deployment Instructions Box */}
      <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-3">
        <h4 className="font-extrabold flex items-center gap-2 text-emerald-900 text-sm">
          <ExternalLink className="w-4 h-4 text-emerald-600" />
          Langkah Mudah Menghubungkan Front-End React ke Google Sheets:
        </h4>
        <ol className="list-decimal list-inside space-y-2 font-medium pl-1 text-emerald-950">
          <li>
            Buka Google Sheets baru di <a href="https://sheets.new" target="_blank" rel="noreferrer" className="underline font-bold text-emerald-800 hover:text-emerald-950">sheets.new</a>.
          </li>
          <li>
            Buka menu <strong>Ekstensi &gt; Apps Script</strong>.
          </li>
          <li>
            Hapus kode bawaan, lalu <strong>salin &amp; tempel seluruh kode <code className="bg-emerald-200/80 px-1.5 py-0.5 rounded font-bold">Code.gs</code> terbaru di atas</strong>.
          </li>
          <li>
            Pilih fungsi <code className="bg-emerald-200/80 px-1.5 py-0.5 rounded font-bold">setupDatabaseAndFolder</code> pada dropdown bagian atas editor Apps Script, lalu klik <strong>Jalankan / Run</strong>. (Membuka izin Google Drive &amp; otomatis membuat folder <code className="font-bold text-slate-800">SmartSchool_FotoAbsen</code> di Google Drive Anda).
          </li>
          <li>
            Klik tombol <strong>Deploy &gt; New deployment</strong> (atau <strong>Manage Deployments &gt; Edit &gt; New Version</strong> jika memperbarui):
            <ul className="list-disc list-inside ml-5 mt-1 space-y-1 font-normal text-emerald-900">
              <li>Pilih tipe: <strong>Web app</strong></li>
              <li>Execute as: <strong>Me (email Anda)</strong></li>
              <li>Who has access: <strong>Anyone (Siapa saja)</strong></li>
            </ul>
          </li>
          <li>
            Salin <strong>Web App URL</strong> yang dihasilkan (berawalan <code className="bg-emerald-200/80 px-1.5 py-0.5 rounded text-[11px] font-mono">https://script.google.com/macros/s/.../exec</code>).
          </li>
          <li>
            Tempelkan URL tersebut ke kolom <strong>Google Apps Script Web App URL</strong> di bawah ini atau pada menu <strong>Pengaturan</strong> aplikasi.
          </li>
        </ol>

        <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
          <strong> Catatan Penting Akun Akun Google Workspace / belajar.id:</strong><br/>
          Pesan error <code className="font-mono font-bold text-rose-700">Exception: 存取遭拒：DriveApp</code> sebelumnya terjadi karena akun Google Workspace (<code className="font-bold">belajar.id</code>) secara otomatis membatasi pengaturan berbagi file publik (<code className="font-mono">ANYONE_WITH_LINK</code>). Kode <code className="font-bold">Code.gs</code> terbaru di atas telah diperbarui dengan <code className="font-mono font-bold">try-catch</code> khusus domain Workspace agar folder <code className="font-bold">SmartSchool_FotoAbsen</code> tetap otomatis dibuat dan penyimpanan foto selfie ke Google Drive berjalan lancar tanpa error!
        </div>
      </div>

    </div>
  );
};
