"use client";
import { useFinance } from "@/src/entities/finance";
import { type Dialog } from "@/src/features/finance-forms";
import { errorMessage } from "@/src/shared/api";
import { money } from "@/src/shared/lib/money";
import type { Transaction } from "@/src/shared/types";
import { Glyph, Modal } from "@/src/shared/ui";
import { useState } from "react";

export function TransactionDetail({
  transaction: t,
  close,
  open,
}: {
  transaction: Transaction;
  close: () => void;
  open: (dashboard: Dialog) => void;
}) {
  const { snapshot: snapshot, command } = useFinance();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  async function remove() {
    setIsSaving(true);
    try {
      await command("/transactions", { id: t.id, expectedVersion: t.version, delete: true });
      close();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setIsSaving(false);
    }
  }
  return (
    <Modal title={t.description} onClose={close}>
      <div
        className={`detail-amount ${t.kind === "income" || t.kind === "refund" ? "green-text" : ""}`}
      >
        {t.kind === "income" || t.kind === "refund" ? "+" : t.kind === "transfer" ? "" : "−"}
        {money(t.amount)}
      </div>
      <div className="calculation">
        <p>
          <span>Счёт</span>
          <strong>{snapshot.accounts.find((a) => a.id === t.accountId)?.name}</strong>
        </p>
        {t.targetId && (
          <p>
            <span>На счёт</span>
            <strong>{snapshot.accounts.find((a) => a.id === t.targetId)?.name}</strong>
          </p>
        )}
        <p>
          <span>Категория</span>
          <strong>{snapshot.categories.find((c) => c.id === t.categoryId)?.name}</strong>
        </p>
        <p>
          <span>Дата</span>
          <strong>{new Date(`${t.date}T12:00:00`).toLocaleDateString("ru-RU")}</strong>
        </p>
      </div>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {confirm ? (
        <div className="delete-confirm">
          <p>Удалить операцию? Баланс и расходы будут пересчитаны.</p>
          <button className="danger" disabled={isSaving} onClick={remove}>
            {isSaving ? "Удаляем…" : "Да, удалить"}
          </button>
          <button className="secondary" onClick={() => setConfirm(false)}>
            Отмена
          </button>
        </div>
      ) : (
        <div className="detail-actions">
          <button className="secondary" onClick={() => open({ type: "transaction", item: t })}>
            <Glyph name="edit" size={18} />
            Изменить
          </button>
          <button
            className="secondary"
            onClick={() => open({ type: "transaction", item: t, repeat: true })}
          >
            <Glyph name="repeat" size={18} />
            Повторить
          </button>
          <button
            className="icon-button danger-text"
            aria-label="Удалить операцию"
            onClick={() => setConfirm(true)}
          >
            <Glyph name="trash" size={21} />
          </button>
        </div>
      )}
    </Modal>
  );
}
