import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { supabase } from "./supabase";
import { saveReport, getReports } from "./api";  // pastikan path benar


export type Role = "admin" | "umum";
export type User = {
  username: string;
  role: Role;
};

export type Status = "Perlu Tindaklanjut" | "Selesai";

export type Report = {
  id: string;
  createdAt: string;
  foto: string[];
  tanggal: string;
  lokasi: string;
  petugas: string;
  targetKinerja: string;
  sasaran: string;
  indikator: string;
  judulKegiatan: string;
  arahanTemuan: string;
  status: Status;
  tindakLanjut: string;
};

const STORAGE_KEY = "lapikt_reports";
const AUTH_STORAGE_KEY = "lapikt_auth";

// ── Auth store singleton ────────────────────────────────────────────

let authListeners: Array<() => void> = [];
let cachedUser: User | null = null;
let authInitialized = false;

function readAuth(): User | null {
  if (authInitialized) return cachedUser;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    cachedUser = raw ? JSON.parse(raw) : null;
  } catch {
    cachedUser = null;
  }
  authInitialized = true;
  return cachedUser;
}

function writeAuth(user: User | null) {
  cachedUser = user;
  try {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (e) {
    console.error("Failed to save auth", e);
  }
  for (const cb of authListeners) cb();
}

function subscribeAuth(cb: () => void) {
  authListeners.push(cb);
  return () => {
    authListeners = authListeners.filter((l) => l !== cb);
  };
}

function getAuthSnapshot(): User | null {
  return readAuth();
}

export function useAuth() {
  const user = useSyncExternalStore(subscribeAuth, getAuthSnapshot);

  const login = useCallback((user: User) => {
    writeAuth(user);
  }, []);

  const logout = useCallback(() => {
    writeAuth(null);
  }, []);

  return { user, login, logout };
}

// ── Shared report store singleton ───────────────────────────────────
// This ensures every component that calls useReports() shares the
// exact same data and reacts to changes instantly.

let listeners: Array<() => void> = [];
let cachedReports: Report[] | null = null;

/**
 * Migrate legacy report data where `foto` was a single string.
 * Converts it into an array so the rest of the app can rely on `string[]`.
 */
function migrateReport(raw: any): Report {
  if (raw && typeof raw.foto === "string") {
    raw.foto = raw.foto ? [raw.foto] : [];
  } else if (raw && !Array.isArray(raw.foto)) {
    raw.foto = [];
  }
  return raw as Report;
}

function readReports(): Report[] {
  if (cachedReports !== null) return cachedReports;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: any[] = raw ? JSON.parse(raw) : [];
    cachedReports = parsed.map(migrateReport);
  } catch {
    cachedReports = [];
  }
  return cachedReports!;
}

function writeReports(next: Report[]) {
  cachedReports = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (e) {
    console.error("Failed to save reports", e);
  }
  // Notify every subscriber (every mounted component using the hook)
  for (const cb of listeners) cb();
}

function subscribe(cb: () => void) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

function getSnapshot(): Report[] {
  return readReports();
}

// ── Public hook ─────────────────────────────────────────────────────

export function useReports() {
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const data = await getReports();
    setReports(data);
  }

  const addReport = useCallback(async (report: any) => {
    const savedReport = await saveReport(report);
    if (savedReport) {
      await loadData();
    }
    return savedReport;
  }, []);

  const updateReport = useCallback((id: string, report: any) => {
    alert("Update belum aktif");
  }, []);

  const deleteReport = useCallback(() => {
    alert("Delete belum aktif");
  }, []);

  const getReport = useCallback(
    (id: string) => reports.find((r) => r.id === id),
    [reports]
  );

  return {
    reports,
    addReport,
    updateReport,
    deleteReport,
    getReport,
  };
}
