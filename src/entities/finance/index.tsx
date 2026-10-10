"use client";
import { api, errorMessage, isOffline, isUnauthorized } from "@/src/shared/api";
import { today } from "@/src/shared/lib/money";
import { offline, type Pending } from "@/src/shared/lib/offline";
import type { Command, Dashboard, Snapshot } from "@/src/shared/types";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createStore, useStore } from "zustand";
import { demo, demoDashboard } from "./demo";
type Model = {
  authenticated: boolean;
  sessionChecked: boolean;
  snapshot: Snapshot;
  dashboard: Dashboard;
  month: string;
  sync: string;
  pending: Pending[];
  toast: string;
  tab: string;
  set: (values: Partial<Model>) => void;
};
function makeStore() {
  return createStore<Model>((set) => ({
    authenticated: false,
    sessionChecked: false,
    snapshot: demo,
    dashboard: demoDashboard,
    month: "2026-10",
    sync: "Демо-режим",
    pending: [],
    toast: "",
    tab: "overview",
    set,
  }));
}
type FinanceStore = ReturnType<typeof makeStore>;
const emptyDashboard: Dashboard = {
  balance: "0",
  available: "0",
  expenses: "0",
  income: "0",
  budget: "0",
  remaining: "0",
  reserved: "0",
  unpaid: "0",
  days: 0,
  daily: "0",
  categories: {},
};
type Actions = {
  refresh: () => Promise<void>;
  command: (path: string, data: Command, key?: string) => Promise<void>;
  auth: (mode: string, data: Command) => Promise<void>;
  logout: () => Promise<void>;
  ensure: () => Promise<Snapshot>;
};
const Context = createContext<{ store: FinanceStore; actions: Actions } | null>(null);
export function FinanceProvider({ children }: { children: ReactNode }) {
  const [store] = useState(makeStore);
  const replaying = useRef(false);
  const active = useRef(true);
  const generation = useRef(0);
  const receive = async (snapshot: Snapshot) => {
    if (!active.current) return;
    const previous = store.getState().snapshot;
    if (previous.profile.id === snapshot.profile.id && previous.revision > snapshot.revision)
      return;
    store.getState().set({
      snapshot,
      ...(previous.profile.id !== snapshot.profile.id ? { dashboard: emptyDashboard } : {}),
    });
    sessionStorage.setItem("izy-user", snapshot.profile.id);
    await offline.save(snapshot).catch(() => undefined);
  };
  const refresh = async () => {
    if (!store.getState().authenticated) return;
    const gen = generation.current;
    try {
      const snapshot = await api.snapshot();
      if (!active.current || gen !== generation.current) return;
      await receive(snapshot);
      const month = store.getState().month;
      const dashboard = await api.dashboard(month);
      const current = store.getState();
      const revision = (dashboard as Dashboard & { revision?: number }).revision;
      if (
        gen === generation.current &&
        month === current.month &&
        (revision === undefined || revision >= current.snapshot.revision)
      ) {
        store.getState().set({
          dashboard,
          sync: current.pending.length ? "Ожидают отправки" : "Синхронизировано",
        });
        await offline.saveDashboard(snapshot.profile.id, month, dashboard).catch(() => undefined);
      }
    } catch (error) {
      if (gen !== generation.current) return;
      if (isUnauthorized(error)) {
        if (store.getState().snapshot.profile.id !== "preview") {
          // Retain this user's unsent commands on session expiry; explicit logout
          // clears them. A new account never reads another account's queue.
          generation.current++;
          store.getState().set({ authenticated: false, sync: "Войдите снова" });
        }
      } else {
        const current = store.getState();
        const cached = await offline
          .loadDashboard(current.snapshot.profile.id, current.month)
          .catch(() => undefined);
        store.getState().set({
          sync: "Нет подключения",
          ...(cached
            ? { dashboard: cached }
            : current.snapshot.profile.id !== "preview"
              ? { dashboard: emptyDashboard }
              : {}),
        });
      }
    }
  };
  const ensure = async () => {
    if (!store.getState().authenticated) throw new Error("Сначала войдите в аккаунт");
    return store.getState().snapshot;
  };
  const command = async (path: string, data: Command, key = crypto.randomUUID()) => {
    const snapshot = await ensure();
    store.getState().set({ sync: "Синхронизация" });
    try {
      await receive(await api.command(path, data, key));
      await refresh();
      store.getState().set({ toast: "Изменения сохранены" });
    } catch (error) {
      if (
        isOffline(error) &&
        path === "/transactions" &&
        !data.id &&
        ["expense", "income"].includes(String(data.kind))
      ) {
        await offline.add({ id: key, user: snapshot.profile.id, path, data });
        store.getState().set({
          pending: await offline.list(snapshot.profile.id),
          sync: "Ожидают отправки",
          toast: "Операция сохранена в очередь. Отправим при подключении.",
        });
      } else {
        store.getState().set({ sync: "Ошибка" });
        throw error;
      }
    }
  };
  const replay = async () => {
    if (replaying.current || !store.getState().authenticated) return;
    replaying.current = true;
    const user = store.getState().snapshot.profile.id;
    try {
      for (const p of await offline.list(user)) {
        if (!store.getState().authenticated || store.getState().snapshot.profile.id !== user) break;
        try {
          await receive(await api.command(p.path, p.data, p.id));
          await offline.remove(p.id);
        } catch (error) {
          if (!isOffline(error)) await offline.add({ ...p, error: errorMessage(error) });
          break;
        }
      }
      store.getState().set({ pending: await offline.list(user) });
      await refresh();
    } finally {
      replaying.current = false;
    }
  };
  const auth = async (mode: string, data: Command) => {
    store.getState().set({ sync: "Вход в аккаунт", toast: "" });
    const snapshot = await api.auth(mode, data);
    generation.current++;
    await receive(snapshot);
    store.getState().set({
      authenticated: true,
      sessionChecked: true,
      month: today(snapshot.profile.timezone).slice(0, 7),
      pending: await offline.list(snapshot.profile.id),
      tab: "overview",
    });
    await refresh();
  };
  const logout = async () => {
    const user = store.getState().snapshot.profile.id;
    await api.logout();
    generation.current++;
    await offline.clear(user);
    sessionStorage.removeItem("izy-user");
    store.getState().set({
      authenticated: false,
      snapshot: demo,
      dashboard: demoDashboard,
      month: "2026-10",
      pending: [],
      sync: "Демо-режим",
      tab: "overview",
    });
  };
  useEffect(() => {
    active.current = true;
    let cancelled = false;
    const restoreSession = async () => {
      try {
        const snapshot = await api.snapshot();
        if (cancelled || !active.current) return;
        await receive(snapshot);

        const pending = await offline.list(snapshot.profile.id);
        if (cancelled || !active.current) return;
        store.getState().set({
          authenticated: true,
          month: today(snapshot.profile.timezone).slice(0, 7),
          pending,
        });
      } catch {
        // No valid session cookie: leave the login screen visible.
      } finally {
        if (!cancelled && active.current) store.getState().set({ sessionChecked: true });
      }
    };
    void restoreSession();

    const focus = () => {
      void replay();
    };
    const lost = () => store.getState().set({ sync: "Нет подключения" });
    window.addEventListener("online", focus);
    window.addEventListener("focus", focus);
    window.addEventListener("offline", lost);
    const timer = setInterval(focus, 30000);
    return () => {
      cancelled = true;
      active.current = false;
      clearInterval(timer);
      window.removeEventListener("online", focus);
      window.removeEventListener("focus", focus);
      window.removeEventListener("offline", lost);
    };
  }, []); // Store and callbacks are bound to this provider instance.
  const authenticated = useStore(store, (state) => state.authenticated);
  const user = useStore(store, (snapshot) => snapshot.snapshot.profile.id);
  const month = useStore(store, (snapshot) => snapshot.month);
  useEffect(() => {
    if (authenticated) void replay();
  }, [month, user, authenticated]);
  useEffect(() => {
    if (!authenticated) return;
    let disposed = false;
    let ws: WebSocket | undefined;
    let timer: ReturnType<typeof setTimeout>;
    const connect = async () => {
      if (disposed) return;
      const configuredWs = process.env.NEXT_PUBLIC_WS_URL?.trim();
      const baseUrl =
        configuredWs || `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`;
      let ticket: string | undefined;
      try {
        ticket = await api.wsTicket();
      } catch {
        // Fall back to cookie-based auth if ticket call fails or user is offline
      }
      if (disposed) return;
      const wsUrl = ticket
        ? `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}ticket=${encodeURIComponent(ticket)}`
        : baseUrl;
      try {
        ws = new WebSocket(wsUrl);
      } catch {
        if (!disposed) timer = setTimeout(connect, 3000);
        return;
      }
      ws.onopen = () => {
        void refresh();
      };
      ws.onmessage = () => {
        void refresh();
      };
      ws.onclose = () => {
        if (!disposed) timer = setTimeout(connect, 3000);
      };
    };
    void connect();
    return () => {
      disposed = true;
      clearTimeout(timer);
      ws?.close();
    };
  }, [user, authenticated]);
  return (
    <Context.Provider value={{ store, actions: { refresh, command, auth, logout, ensure } }}>
      {children}
    </Context.Provider>
  );
}
export function useFinance() {
  const context = useContext(Context);
  if (!context) throw new Error("FinanceProvider missing");
  const state = useStore(context.store);
  return { ...state, ...context.actions };
}
