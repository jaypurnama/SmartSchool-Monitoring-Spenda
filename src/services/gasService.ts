import { Settings } from "../types";

// Dynamic API Service Handler for Apps Script & Browser Environment
export class GasService {
  public static getStoredWebAppUrl(): string {
    return localStorage.getItem("gas_web_app_url") || "";
  }

  public static setStoredWebAppUrl(url: string) {
    if (url && url.trim()) {
      localStorage.setItem("gas_web_app_url", url.trim());
    } else {
      localStorage.removeItem("gas_web_app_url");
    }
  }

  // Universal API proxy call to Google Apps Script Web App
  private static async callGasProxy(action: string, payload: any = {}) {
    const webAppUrl = this.getStoredWebAppUrl();
    if (!webAppUrl) {
      return null;
    }

    // 1. First try Express server proxy endpoint (/api/gas-proxy)
    try {
      const res = await fetch("/api/gas-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webAppUrl, action, payload })
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.success !== undefined) {
          return json;
        }
      }
    } catch (e) {
      // Server proxy unavailable (e.g. static host like Vercel / GitHub Pages)
    }

    // 2. Direct client-side fetch to Google Apps Script Web App URL
    try {
      const res = await fetch(webAppUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action, payload })
      });
      return await res.json();
    } catch (err: any) {
      console.error("Direct fetch to Google Apps Script Web App failed:", err);
      return { success: false, message: "Gagal terhubung ke Google Apps Script: " + err.message };
    }
  }

  public static async login(username: string, password: string) {
    const gasRes = await this.callGasProxy("loginUser", { username, password });
    if (gasRes) return gasRes;

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    return res.json();
  }

  public static async saveAbsenHarian(data: {
    guruId: string;
    fotoBase64: string;
    latLong: string;
    tipe: 'masuk' | 'pulang';
  }) {
    const gasRes = await this.callGasProxy("saveAbsenHarian", data);
    if (gasRes) return gasRes;

    const res = await fetch("/api/absen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return res.json();
  }

  public static async scanQRCodeAndValidate(qrData: string, guruId: string) {
    const gasRes = await this.callGasProxy("scanQRCodeAndValidate", { qrData, guruId });
    if (gasRes) return gasRes;

    const res = await fetch("/api/scan-qr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qrData, guruId })
    });
    return res.json();
  }

  public static async simpanJurnalMengajar(data: {
    kelasId: string;
    guruId: string;
    mapel: string;
    subBabMateri: string;
    jumlahSiswaHadir: number;
  }) {
    const gasRes = await this.callGasProxy("simpanJurnalMengajar", data);
    if (gasRes) return gasRes;

    const res = await fetch("/api/jurnal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return res.json();
  }

  public static async getRealtimeMonitoringData() {
    const gasRes = await this.callGasProxy("getRealtimeMonitoringData", {});
    if (gasRes) return gasRes;

    const res = await fetch("/api/monitoring");
    return res.json();
  }

  public static async getKelas() {
    const gasRes = await this.callGasProxy("getKelas", {});
    if (gasRes) return gasRes;

    const res = await fetch("/api/kelas");
    return res.json();
  }

  public static async saveKelas(data: { id?: string; namaKelas: string }) {
    const gasRes = await this.callGasProxy("saveKelas", data);
    if (gasRes) return gasRes;

    const res = await fetch("/api/kelas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return res.json();
  }

  public static async deleteKelas(id: string) {
    const gasRes = await this.callGasProxy("deleteKelas", { id });
    if (gasRes) return gasRes;

    const res = await fetch(`/api/kelas/${id}`, { method: "DELETE" });
    return res.json();
  }

  public static async getJadwal() {
    const gasRes = await this.callGasProxy("getJadwal", {});
    if (gasRes) return gasRes;

    const res = await fetch("/api/jadwal");
    return res.json();
  }

  public static async saveJadwal(data: any) {
    const gasRes = await this.callGasProxy("saveJadwal", data);
    if (gasRes) return gasRes;

    const res = await fetch("/api/jadwal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return res.json();
  }

  public static async deleteJadwal(id: string) {
    const gasRes = await this.callGasProxy("deleteJadwal", { id });
    if (gasRes) return gasRes;

    const res = await fetch(`/api/jadwal/${id}`, { method: "DELETE" });
    return res.json();
  }

  public static async getUsers() {
    const gasRes = await this.callGasProxy("getUsers", {});
    if (gasRes) return gasRes;

    const res = await fetch("/api/users");
    return res.json();
  }

  public static async saveUser(data: any) {
    const gasRes = await this.callGasProxy("saveUser", data);
    if (gasRes) return gasRes;

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return res.json();
  }

  public static async deleteUser(id: string) {
    const gasRes = await this.callGasProxy("deleteUser", { id });
    if (gasRes) return gasRes;

    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    return res.json();
  }

  public static async getSettings() {
    const gasRes = await this.callGasProxy("getSettings", {});
    if (gasRes && gasRes.settings) {
      gasRes.settings.webAppUrl = this.getStoredWebAppUrl();
      return gasRes;
    }

    const res = await fetch("/api/settings");
    const json = await res.json();
    if (json.settings) {
      json.settings.webAppUrl = this.getStoredWebAppUrl();
    }
    return json;
  }

  public static async saveSettings(data: Settings) {
    if (data.webAppUrl !== undefined) {
      this.setStoredWebAppUrl(data.webAppUrl);
    }
    const gasRes = await this.callGasProxy("saveSettings", data);
    if (gasRes) return gasRes;

    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return res.json();
  }

  public static async setupDatabaseAndFolder() {
    const gasRes = await this.callGasProxy("setupDatabaseAndFolder", {});
    if (gasRes) return gasRes;

    const res = await fetch("/api/setup-db", { method: "POST" });
    return res.json();
  }
}
