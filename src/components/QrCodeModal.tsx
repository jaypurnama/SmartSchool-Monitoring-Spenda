import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { QrCode, Download, X } from 'lucide-react';

interface QrCodeModalProps {
  kelasId: string;
  namaKelas: string;
  onClose: () => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ kelasId, namaKelas, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        `KELAS_${kelasId}`,
        { width: 220, margin: 2, color: { dark: '#0f172a', light: '#ffffff' } },
        (error) => {
          if (error) console.error("QR Code Generation Error", error);
        }
      );
    }
  }, [kelasId]);

  const downloadQr = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `QR_Kelas_${namaKelas}.png`;
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative space-y-4 text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center mx-auto text-xl font-bold">
          <QrCode className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-lg font-black text-slate-900">QR Code Kelas {namaKelas}</h3>
          <p className="text-xs text-slate-500 mt-0.5">Kode QR Resmi Pintu Kelas (ID: {kelasId})</p>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block mx-auto">
          <canvas ref={canvasRef} className="mx-auto" />
          <p className="text-[11px] font-mono font-bold text-slate-700 mt-2">KELAS_{kelasId}</p>
        </div>

        <p className="text-[11px] text-slate-500 font-medium">Cetak dan tempelkan QR Code ini di depan pintu kelas {namaKelas} untuk di-scan oleh guru sebelum mengajar.</p>

        <div className="flex gap-2">
          <button
            onClick={downloadQr}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
          >
            <Download className="w-4 h-4" />
            <span>Unduh QR (PNG)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
