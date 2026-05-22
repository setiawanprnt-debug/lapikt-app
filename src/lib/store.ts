import { useState, useEffect, useCallback, useSyncExternalStore } from "react";

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
  const reports = useSyncExternalStore(subscribe, getSnapshot);

  const addReport = useCallback(
    (
      report: Omit<Report, "id" | "createdAt" | "tanggal"> & {
        id?: string;
        createdAt?: string;
        tanggal?: string;
      }
    ) => {
      const newReport: Report = {
        ...report,
        id: report.id || crypto.randomUUID(),
        createdAt: report.createdAt || new Date().toISOString(),
        tanggal:
          report.tanggal ||
          new Date().toLocaleString("id-ID", {
            dateStyle: "full",
            timeStyle: "short",
          }),
      };
      writeReports([newReport, ...readReports()]);
      return newReport;
    },
    []
  );

  const updateReport = useCallback(
    (id: string, updates: Partial<Report>) => {
      writeReports(
        readReports().map((r) => (r.id === id ? { ...r, ...updates } : r))
      );
    },
    []
  );

  const deleteReport = useCallback((id: string) => {
    writeReports(readReports().filter((r) => r.id !== id));
  }, []);

  const getReport = useCallback(
    (id: string) => {
      return reports.find((r) => r.id === id);
    },
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
