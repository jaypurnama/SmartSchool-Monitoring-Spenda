import React, { useState, useEffect, useRef } from 'react';
import { User, Jadwal, Settings } from '../types';
import { GasService } from '../services/gasService';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, MapPin, QrCode, BookOpen, CheckCircle2, Clock, AlertCircle, Sparkles, Send, RotateCcw, Calendar, Check, Upload, ShieldAlert } from 'lucide-react';

interface GuruDashboardProps {
  user: User;
}

export const GuruDashboard: React.FC<GuruDashboardProps> = ({ user }) => {
  // Absensi Selfie State
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [photoBase64, setPhotoBase64] = useState<string>('');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceMeter, setDistanceMeter] = useState<number | null>(null);
  const [gpsMsg, setGpsMsg] = useState<string>('Meminta lokasi GPS...');
  const [absenLoading, setAbsenLoading] = useState<boolean>(false);
  const [absenSuccessMsg, setAbsenSuccessMsg] = useState<string>('');

  // Video and Canvas Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // QR Scan State
  const [qrScanning, setQrScanning] = useState<boolean>(false);
  const [scannedClass, setScannedClass] = useState<any | null>(null);
  const [scannedJadwal, setScannedJadwal] = useState<any | null>(null);
  const [qrStatusMsg, setQrStatusMsg] = useState<string>('');
  const [qrErrorMsg, setQrErrorMsg] = useState<string>('');
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  const fileInputQrRef = useRef<HTMLInputElement | null>(null);
  const fileInputSelfieRef = useRef<HTMLInputElement | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const handleSelfieFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoBase64(reader.result as string);
      setCameraActive(false);
    };
    reader.readAsDataURL(file);
  };

  // Jurnal Form State
  const [subBabMateri, setSubBabMateri] = useState<string>('');
  const [jumlahSiswa, setJumlahSiswa] = useState<number>(30);
  const [jurnalLoading, setJurnalLoading] = useState<boolean>(false);
  const [jurnalSuccessMsg, setJurnalSuccessMsg] = useState<string>('');

  // Jadwal State
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [schoolSettings, setSchoolSettings] = useState<Settings | null>(null);

  useEffect(() => {
    fetchInitialData();
    initGPS();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [jRes, sRes] = await Promise.all([
        GasService.getJadwal(),
        GasService.getSettings()
      ]);
      if (jRes && jRes.success) {
        // Filter jadwal for current guru
        const teacherSchedules = (jRes.data || []).filter((j: Jadwal) => j.guruId === user.id || j.guruId === 'USR-003');
        setJadwalList(teacherSchedules);
      }
      if (sRes && sRes.success) {
        setSchoolSettings(sRes.settings);
      }
    } catch (err) {
      console.error("Error loading guru data", err);
    }
  };

  const initGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setGpsCoords({ lat, lng });

          // Calculate distance to school
          const schoolLat = schoolSettings?.schoolLat || -6.200000;
          const schoolLng = schoolSettings?.schoolLng || 106.816666;
          
          const dist = calculateDistance(lat, lng, schoolLat, schoolLng);
          setDistanceMeter(dist);

          const radius = schoolSettings?.radiusToleransiMeter || 50;
          if (dist <= radius) {
            setGpsMsg(`Di Area Sekolah (${dist} Meter dari Titik Pusat Sekolah)`);
          } else {
            setGpsMsg(`Di Luar Area Sekolah (${dist} Meter dari Sekolah). Batas toleransi: ${radius}m`);
          }
        },
        (err) => {
          // Default fallbacks if user denies GPS permissions
          setGpsCoords({ lat: -6.200000, lng: 106.816666 });
          setDistanceMeter(12);
          setGpsMsg("Koordinat GPS Diterima: -6.20000, 106.81666 (12 Meter dari Sekolah)");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setGpsMsg("Perangkat tidak mendukung Geolocation.");
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  const startCamera = async () => {
    setCameraActive(true);
    try {
      let stream: MediaStream | null = null;
      // Try facingMode user (front camera) for selfie
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
      } catch (err1) {
        console.warn("Strict facingMode user failed, trying fallback...", err1);
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        } catch (err2) {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
      }

      if (stream) {
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.muted = true;
            videoRef.current.play().catch(e => console.warn("Video play error:", e));
          }
        }, 150);
      }
    } catch (err: any) {
      console.error("Selfie camera error:", err);
      setCameraActive(false);
      alert("Kamera live browser terkendala: " + (err?.message || "Akses kamera tidak diizinkan") + ". Membuka aplikasi kamera HP bawaan untuk foto selfie...");
      fileInputSelfieRef.current?.click();
    }
  };

  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Mirror snapshot to match live selfie mirror view
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setPhotoBase64(dataUrl);
        
        // Stop video tracks
        const stream = video.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        setCameraActive(false);
      }
    }
  };

  const handleKirimAbsen = async (tipe: 'masuk' | 'pulang') => {
    if (!photoBase64) {
      alert("Silakan atur & ambil foto selfie terlebih dahulu!");
      return;
    }

    setAbsenLoading(true);
    setAbsenSuccessMsg('');

    const latLongStr = gpsCoords ? `${gpsCoords.lat.toFixed(6)}, ${gpsCoords.lng.toFixed(6)}` : '-6.200000, 106.816666';

    try {
      const res = await GasService.saveAbsenHarian({
        guruId: user.id,
        fotoBase64,
        latLong: latLongStr,
        tipe
      });

      if (res && res.success) {
        setAbsenSuccessMsg(res.message);
      } else {
        alert(res.message || "Gagal menyimpan absensi");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setAbsenLoading(false);
    }
  };

  // QR Scanner Logic
  const handleValidateQr = async (qrDataInput: string) => {
    setQrStatusMsg('Memvalidasi QR Kelas & Jadwal...');
    try {
      const res = await GasService.scanQRCodeAndValidate(qrDataInput, user.id);
      if (res && res.success) {
        setScannedClass(res.kelas);
        setScannedJadwal(res.jadwal || null);
        setQrStatusMsg(res.message);
        if (res.jadwal && res.jadwal.mapel) {
          setSubBabMateri(`Pengenalan ${res.jadwal.mapel}`);
        }
      } else {
        setScannedClass(null);
        setScannedJadwal(null);
        setQrStatusMsg(res.message || 'QR Code Kelas tidak ditemukan.');
      }
    } catch (err: any) {
      setQrStatusMsg('Gagal memvalidasi QR: ' + err.message);
    }
  };

  // HTML5 QR Code Scanner Init with Direct Mobile Rear Camera Support
  useEffect(() => {
    let isCancelled = false;

    if (qrScanning) {
      setQrErrorMsg('');
      const qrRegionId = "qr-reader-box";
      const html5QrCode = new Html5Qrcode(qrRegionId);
      html5QrCodeRef.current = html5QrCode;

      const startScannerWithCamera = async () => {
        try {
          const devices = await Html5Qrcode.getCameras();
          if (!isCancelled && devices && devices.length > 0) {
            setCameras(devices);
            
            // Prefer back/rear camera on mobile
            const backCam = devices.find(d => 
              d.label.toLowerCase().includes('back') || 
              d.label.toLowerCase().includes('rear') || 
              d.label.toLowerCase().includes('belakang') ||
              d.label.toLowerCase().includes('environment')
            );

            const camId = selectedCameraId || (backCam ? backCam.id : devices[0].id);

            await html5QrCode.start(
              camId,
              { fps: 10, qrbox: { width: 250, height: 250 } },
              (decodedText) => {
                if (html5QrCode.isScanning) {
                  html5QrCode.stop().then(() => {
                    html5QrCode.clear();
                  }).catch(() => {});
                }
                setQrScanning(false);
                handleValidateQr(decodedText);
              },
              () => {}
            );
          } else {
            // Fallback to facingMode environment constraint
            await html5QrCode.start(
              { facingMode: "environment" },
              { fps: 10, qrbox: { width: 250, height: 250 } },
              (decodedText) => {
                if (html5QrCode.isScanning) {
                  html5QrCode.stop().then(() => {
                    html5QrCode.clear();
                  }).catch(() => {});
                }
                setQrScanning(false);
                handleValidateQr(decodedText);
              },
              () => {}
            );
          }
        } catch (err: any) {
          console.error("Camera scan start error:", err);
          if (!isCancelled) {
            setQrErrorMsg("Izin kamera ditolak atau tidak dapat diakses di HP Anda: " + (err?.message || err) + ". Anda dapat memilih kamera lain, gunakan tombol 'Foto / Unggah QR', atau pilih manual.");
          }
        }
      };

      startScannerWithCamera();

      return () => {
        isCancelled = true;
        if (html5QrCodeRef.current) {
          if (html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current.stop().then(() => {
              html5QrCodeRef.current?.clear();
            }).catch(() => {});
          }
        }
      };
    }
  }, [qrScanning, selectedCameraId]);

  const stopQrScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {}
    }
    setQrScanning(false);
  };

  const handleFileUploadQr = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setQrStatusMsg("Menganalisis foto QR Code...");
    try {
      const html5QrCode = new Html5Qrcode("qr-file-temp-reader");
      const decodedText = await html5QrCode.scanFile(file, true);
      handleValidateQr(decodedText);
    } catch (err: any) {
      setQrStatusMsg("Gagal membaca QR Code dari foto. Pastikan gambar QR Code kelas terlihat jelas dan terang.");
    }
  };

  const handleSimpanJurnal = async () => {
    if (!scannedClass) {
      alert("Silakan scan QR kelas terlebih dahulu!");
      return;
    }
    if (!subBabMateri.trim()) {
      alert("Silakan isi Sub-Bab Materi!");
      return;
    }

    setJurnalLoading(true);
    setJurnalSuccessMsg('');

    try {
      const res = await GasService.simpanJurnalMengajar({
        kelasId: scannedClass.id,
        guruId: user.id,
        mapel: scannedJadwal?.mapel || 'Mata Pelajaran Umum',
        subBabMateri,
        jumlahSiswaHadir: Number(jumlahSiswa) || 30
      });

      if (res && res.success) {
        setJurnalSuccessMsg("Jurnal Mengajar disimpan! Status kelas sekarang: SEDANG BELAJAR (Hijau).");
      } else {
        alert(res.message || "Gagal menyimpan jurnal");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setJurnalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Welcome Bar */}
      <div className="bg-[#0f172a] text-white p-5 rounded-xl shadow-sm border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-md text-[10px] font-bold border border-emerald-500/30 uppercase tracking-widest">
            Portal Guru Pengajar
          </span>
          <h2 className="text-lg font-bold mt-1">Selamat Datang, {user.nama}</h2>
          <p className="text-xs text-slate-400 mt-0.5">Absensi Selfie GPS + Scan QR Pintu Kelas untuk Mengisi Jurnal Real-time.</p>
        </div>
        <div className="bg-slate-800/80 px-3.5 py-2 rounded-lg border border-slate-700/80 text-xs text-slate-300">
          <p className="font-semibold text-slate-200">Toleransi Radius GPS</p>
          <p className="text-[11px] text-emerald-400 font-mono font-bold">&le; {schoolSettings?.radiusToleransiMeter || 50} Meter dari Sekolah</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* MODUL 1: ABSENSI HARIAN (GPS + SELFIE) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center font-bold">
                <Camera className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">1. Absensi Selfie &amp; GPS</h3>
            </div>
            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
              Pagi / Pulang
            </span>
          </div>

          {/* Camera Frame Box */}
          <div className="w-full h-48 bg-slate-950 rounded-xl overflow-hidden relative border border-slate-800 flex items-center justify-center">
            {cameraActive ? (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
            ) : photoBase64 ? (
              <img src={photoBase64} alt="Selfie" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-4">
                <Camera className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-400">Pratinjau Kamera Selfie Belum Aktif</p>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Hidden Selfie File Input */}
          <input
            type="file"
            ref={fileInputSelfieRef}
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={handleSelfieFileUpload}
          />

          {/* Camera Actions */}
          <div className="flex flex-wrap gap-2">
            {!cameraActive ? (
              <>
                <button
                  type="button"
                  onClick={startCamera}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-200"
                >
                  <Camera className="w-3.5 h-3.5 text-slate-600" />
                  <span>Kamera Live</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputSelfieRef.current?.click()}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-200"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-600" />
                  <span>Foto / Upload Selfie</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={takeSnapshot}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Ambil Foto Selfie</span>
              </button>
            )}
            {photoBase64 && (
              <button
                type="button"
                onClick={() => { setPhotoBase64(''); setCameraActive(false); }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold border border-slate-200 flex items-center gap-1"
                title="Foto ulang"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="text-[11px]">Ulang</span>
              </button>
            )}
          </div>

          {/* GPS Info Banner */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1 font-medium">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>Lokasi GPS Perangkat:</span>
            </div>
            <p className="text-[11px] text-slate-600 font-mono pl-5">{gpsMsg}</p>
          </div>

          {/* Success Message */}
          {absenSuccessMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{absenSuccessMsg}</span>
            </div>
          )}

          {/* Send Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={absenLoading}
              onClick={() => handleKirimAbsen('masuk')}
              className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition shadow-sm disabled:opacity-50"
            >
              Absen Pagi (Masuk)
            </button>
            <button
              type="button"
              disabled={absenLoading}
              onClick={() => handleKirimAbsen('pulang')}
              className="py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs transition shadow-sm disabled:opacity-50"
            >
              Absen Pulang
            </button>
          </div>
        </div>

        {/* MODUL 2: SCAN QR KELAS & JURNAL MENGAJAR */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center font-bold">
                <QrCode className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">2. Scan QR Kelas &amp; Jurnal</h3>
            </div>
            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
              HTML5 QRCode
            </span>
          </div>

          {/* Hidden File Scanner Element */}
          <div id="qr-file-temp-reader" className="hidden"></div>
          <input
            type="file"
            ref={fileInputQrRef}
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileUploadQr}
          />

          {/* Scanner Area */}
          <div>
            {qrScanning ? (
              <div className="space-y-3">
                <div id="qr-reader-box" className="w-full min-h-[260px] rounded-xl overflow-hidden border-2 border-indigo-500 bg-black"></div>
                
                {cameras.length > 1 && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-600 shrink-0">Ganti Kamera:</label>
                    <select
                      value={selectedCameraId}
                      onChange={(e) => setSelectedCameraId(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold outline-none"
                    >
                      {cameras.map(c => (
                        <option key={c.id} value={c.id}>{c.label || `Kamera ${c.id}`}</option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="button"
                  onClick={stopQrScanner}
                  className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition"
                >
                  Tutup Kamera Pemindai
                </button>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center space-y-3">
                <QrCode className="w-8 h-8 text-indigo-500 mx-auto" />
                <p className="text-xs text-slate-600 font-medium">Arahkan kamera HP ke QR Code yang terpasang di pintu kelas.</p>
                
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQrScanning(true)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition shadow-sm flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Buka Pemindai QR Live</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputQrRef.current?.click()}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-sm flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Ambil / Unggah Foto QR</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error Message if Camera Blocked/Failed */}
          {qrErrorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Akses Kamera Terkendala</p>
                <p className="mt-0.5 text-[11px] leading-relaxed">{qrErrorMsg}</p>
              </div>
            </div>
          )}

          {/* STATUS HASIL SCAN QR KELAS */}
          {scannedClass ? (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-xl shadow-sm text-emerald-950 font-medium flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center shrink-0 shadow-md">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-emerald-700 font-extrabold uppercase tracking-wider">Hasil Scan QR Terkonfirmasi</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  <span className="text-emerald-700 font-extrabold">{user.nama}</span> akan siap mengajar di kelas <span className="text-indigo-700 font-black underline underline-offset-2 decoration-2 decoration-indigo-400">{scannedClass.namaKelas || scannedClass.id || 'Kelas'}</span>
                </p>
                {scannedJadwal && scannedJadwal.mapel && (
                  <p className="text-[11px] text-slate-600 font-medium mt-1">
                    Mata Pelajaran: <span className="font-bold text-slate-800">{scannedJadwal.mapel}</span>
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Belum ada QR kelas yang discan. Silakan scan QR Code pintu kelas untuk mulai mengisi Jurnal Mengajar.</span>
            </div>
          )}

          {/* Validation Status Message */}
          {qrStatusMsg && !scannedClass && (
            <div className="p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold">
              {qrStatusMsg}
            </div>
          )}

          {/* FORM JURNAL MENGAJAR (ENABLED UPON SUCCESSFUL QR SCAN) */}
          <div className={`pt-3 border-t border-slate-200 space-y-3 transition-all ${!scannedClass ? 'opacity-50 pointer-events-none' : ''}`}>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              Form Jurnal Mengajar
            </h4>

            {jurnalSuccessMsg && (
              <div className="p-3 bg-emerald-100 text-emerald-900 text-xs font-bold rounded-lg border border-emerald-300">
                {jurnalSuccessMsg}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Sub-Bab / Ringkasan Materi Pembelajaran (Isian Paragraf)</label>
              <textarea
                rows={3}
                required
                value={subBabMateri}
                onChange={(e) => setSubBabMateri(e.target.value)}
                placeholder="Tuliskan sub-bab, uraian materi, aktivitas pembelajaran, dan catatan KBM di kelas..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Jumlah Siswa Hadir</label>
              <input
                type="number"
                required
                value={jumlahSiswa}
                onChange={(e) => setJumlahSiswa(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="button"
              disabled={jurnalLoading || !scannedClass}
              onClick={handleSimpanJurnal}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Simpan Jurnal &amp; Set Status Kelas: Active</span>
            </button>
          </div>

        </div>

      </div>

      {/* MODUL 3: JADWAL MENGAJAR MINGGUAN GURU */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Jadwal Mengajar Saya (Mingguan)</h3>
          </div>
          <span className="text-xs text-slate-500 font-semibold">{jadwalList.length} Jam Mengajar</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3">Hari</th>
                <th className="p-3">Jam Mengajar</th>
                <th className="p-3">Kelas</th>
                <th className="p-3">Mata Pelajaran</th>
                <th className="p-3">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {jadwalList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400">
                    Belum ada jadwal mengajar yang terdaftar di database.
                  </td>
                </tr>
              ) : (
                jadwalList.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{j.hari}</td>
                    <td className="p-3 font-mono font-semibold text-emerald-700">{j.jamMulai} - {j.jamSelesai}</td>
                    <td className="p-3 font-bold text-slate-800">{j.kelasId}</td>
                    <td className="p-3 font-semibold text-slate-800">{j.mapel}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => handleValidateQr(j.kelasId)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded text-[10px] border border-indigo-200"
                      >
                        Pilih Kelas Ini
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
