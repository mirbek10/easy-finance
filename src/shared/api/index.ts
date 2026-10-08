import axios from "axios";
import type { Command, Dashboard, Snapshot } from "../types";
const http = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
  timeout: 15000,
  headers: { "X-Requested-With": "IzyFinance" },
});
export const api = {
  updateProfile: async (data: {
    name: string;
    email: string;
    timezone: string;
    currentPassword: string;
    newPassword: string;
  }) => (await http.patch<Snapshot>("/auth/profile", data)).data,
  wsTicket: async () => (await http.get<{ ticket: string }>("/auth/ws-ticket")).data.ticket,
  snapshot: async () => (await http.get<Snapshot>("/sync/snapshot")).data,
  dashboard: async (month: string) =>
    (await http.get<Dashboard>("/dashboard", { params: { month } })).data,
  auth: async (mode: string, data: Command) =>
    (await http.post<Snapshot>(`/auth/${mode}`, data)).data,
  logout: async () => {
    await http.post("/auth/logout");
  },
  command: async (path: string, data: Command, key = crypto.randomUUID()) =>
    (await http.post<Snapshot>(path, data, { headers: { "Idempotency-Key": key } })).data,
  sessions: async (): Promise<
    { id: string; device: string; expires: string; current: boolean }[]
  > => (await http.get("/auth/sessions")).data,
  revoke: async (id: string) => {
    await http.delete(`/auth/sessions/${id}`);
  },
  proposal: async (data: Command) =>
    (
      await http.post<{ budget: import("../types").Budget; deficit: string; explanation: string }>(
        "/budgets/proposal",
        data,
      )
    ).data,
  export: async () => (await http.get<Snapshot>("/export")).data,
  preview: async (snapshot: unknown) =>
    (
      await http.post<{ accounts: number; transactions: number; goals: number }>(
        "/import/preview",
        snapshot,
      )
    ).data,
};
export function errorMessage(error: unknown) {
  if (axios.isAxiosError(error))
    return (
      error.response?.data?.error?.message ||
      "Сервер недоступен. Проверьте подключение и повторите."
    );
  return error instanceof Error ? error.message : "Не удалось выполнить действие";
}
export const isUnauthorized = (error: unknown) =>
  axios.isAxiosError(error) && error.response?.status === 401;
export const isOffline = (error: unknown) => axios.isAxiosError(error) && !error.response;
export const isConflict = (error: unknown) =>
  axios.isAxiosError(error) && error.response?.status === 409;
