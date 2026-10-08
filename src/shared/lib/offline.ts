import type { Command, Dashboard, Snapshot } from "../types";
export type Pending = { id: string; user: string; path: string; data: Command; error?: string };
async function db() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("izy-finance", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("cache");
      request.result.createObjectStore("queue", { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function write(store: string, action: (snapshot: IDBObjectStore) => void) {
  const database = await db();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(store, "readwrite");
      action(transaction.objectStore(store));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
}
async function read<T>(store: string, key?: string): Promise<T> {
  const database = await db();
  try {
    return await new Promise<T>((resolve, reject) => {
      const snapshot = database.transaction(store).objectStore(store);
      const request = key ? snapshot.get(key) : snapshot.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
}
export const offline = {
  save: (snapshot: Snapshot) => write("cache", (db) => db.put(snapshot, snapshot.profile.id)),
  load: (user: string) => read<Snapshot | undefined>("cache", user),
  saveDashboard: (user: string, month: string, dashboard: Dashboard) =>
    write("cache", (db) => db.put(dashboard, `${user}:${month}`)),
  loadDashboard: (user: string, month: string) =>
    read<Dashboard | undefined>("cache", `${user}:${month}`),
  add: (p: Pending) => write("queue", (db) => db.put(p)),
  remove: (id: string) => write("queue", (db) => db.delete(id)),
  list: async (user: string) => (await read<Pending[]>("queue")).filter((p) => p.user === user),
  clear: async (user: string) => {
    await write("cache", (db) => {
      const cursor = db.openCursor();
      cursor.onsuccess = () => {
        const entry = cursor.result;
        if (entry) {
          if (String(entry.key) === user || String(entry.key).startsWith(`${user}:`))
            entry.delete();
          entry.continue();
        }
      };
    });
    for (const p of await offline.list(user)) await offline.remove(p.id);
  },
};
