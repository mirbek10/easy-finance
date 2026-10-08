"use client";
import { useFinance } from "@/src/entities/finance";
import { money } from "@/src/shared/lib/money";
import type { Transaction } from "@/src/shared/types";
import { IconBox } from "@/src/shared/ui";

export function TransactionRow({
  transaction: t,
  onClick,
}: {
  transaction: Transaction;
  onClick: () => void;
}) {
  const { snapshot: snapshot } = useFinance();
  const cat = snapshot.categories.find((c) => c.id === t.categoryId);
  const incoming = t.kind === "income" || t.kind === "refund";
  const date = new Date(`${t.date}T12:00:00`).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
  return (
    <button className="transaction-row" onClick={onClick}>
      <IconBox
        name={t.kind === "transfer" ? "transfer" : incoming ? "income" : cat?.icon || "basket"}
        color={
          incoming
            ? "green"
            : cat?.id === "transport"
              ? "purple"
              : cat?.id === "shopping"
                ? "lilac"
                : "green"
        }
      />
      <span className="transaction-label">
        <strong>{t.description || cat?.name}</strong>
        <small>
          {date}
          {t.createdAt &&
            `, ${new Date(t.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: snapshot.profile.timezone })}`}
        </small>
      </span>
      <strong className={`transaction-amount ${incoming ? "green-text" : ""}`}>
        {incoming ? "+" : t.kind === "transfer" ? "" : "−"}
        {money(t.amount)}
      </strong>
    </button>
  );
}
