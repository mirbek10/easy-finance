import { parseMoney } from "@/src/shared/lib/money";
import type {
  Account,
  Category,
  Command,
  Goal,
  Obligation,
  Snapshot,
  Transaction,
} from "@/src/shared/types";
import type { Dialog } from "./types";

// Превращает значения HTML-формы в команду для Go API. Здесь нет HTTP-запросов.
export function buildFinanceCommand(
  dialog: Dialog,
  snapshot: Snapshot,
  month: string,
  kind: string,
  category: string,
  formData: FormData,
) {
  const readText = (name: string) => String(formData.get(name) || "");
  const readAmount = (name: string) => parseMoney(readText(name) || "0");
  const item = dialog.item;
  const type = dialog.type;
  const transaction = type === "transaction" ? (item as Transaction | undefined) : undefined;
  const editedCategory = type === "category" ? (item as Category | undefined) : undefined;
  const account = type === "account" ? (item as Account | undefined) : undefined;
  const goal = ["goal", "contribution"].includes(type) ? (item as Goal | undefined) : undefined;
  const obligation = ["obligation", "pay"].includes(type)
    ? (item as Obligation | undefined)
    : undefined;

  let path = `/${type}s`;
  let payload: Command = {};
  if (type === "transaction") {
    path = "/transactions";
    payload = {
      kind,
      remember: formData.get("remember") === "on",
      amount: readAmount("amount"),
      description: readText("description"),
      categoryId: category,
      accountId: readText("accountId"),
      targetId: readText("targetId"),
      date: readText("date"),
      ...(!dialog.repeat && transaction
        ? { id: transaction.id, expectedVersion: transaction.version }
        : {}),
    };
  }
  if (type === "account")
    payload = {
      name: readText("name"),
      kind: readText("kind"),
      opening: readAmount("opening"),
      ...(account
        ? {
            id: account.id,
            expectedVersion: account.version,
            archived: formData.get("archived") === "on",
          }
        : {}),
    };
  if (type === "goal")
    payload = {
      name: readText("name"),
      target: readAmount("target"),
      deadline: readText("deadline"),
      priority: Number(readText("priority")),
      icon: readText("icon"),
      color: "green",
      ...(goal ? { id: goal.id, expectedVersion: goal.version } : {}),
    };
  if (type === "contribution") {
    path = `/goals/${goal!.id}/contributions`;
    payload = {
      amount: readAmount("amount"),
      accountId: readText("accountId"),
      expectedVersion: goal!.version,
    };
  }
  if (type === "obligation")
    payload = {
      name: readText("name"),
      amount: readAmount("amount"),
      date: readText("date"),
      categoryId: category,
      recurrence: readText("recurrence"),
      ...(obligation ? { id: obligation.id, expectedVersion: obligation.version } : {}),
    };
  if (type === "pay") {
    path = `/obligations/${obligation!.id}/pay`;
    payload = { accountId: readText("accountId"), expectedVersion: obligation!.version };
  }
  if (type === "category") {
    path = "/categories";
    payload = {
      name: readText("name"),
      color: editedCategory?.color || "#5ebeb0",
      icon: editedCategory?.icon || "bag",
      daily: formData.get("daily") === "on",
      carry: formData.get("carry") === "on",
      ...(editedCategory ? { id: editedCategory.id, expectedVersion: editedCategory.version } : {}),
    };
  }
  if (type === "onboarding") {
    path = "/onboarding";
    payload = {
      name: readText("name"),
      timezone: readText("timezone"),
      income: readAmount("income"),
      people: Number(readText("people")),
      food: readAmount("food"),
      transport: readAmount("transport"),
    };
  }
  if (type === "reallocate") {
    path = "/budgets/reallocations";
    payload = {
      month,
      categoryId: readText("from"),
      targetId: readText("to"),
      amount: readAmount("amount"),
      expectedVersion: snapshot.budgets.find((b) => b.month === month)?.version || 0,
    };
  }

  return { path, payload };
}
