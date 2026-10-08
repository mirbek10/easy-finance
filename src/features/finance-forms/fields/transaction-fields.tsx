"use client";
import { inputMoney, today } from "@/src/shared/lib/money";
import type { Account, Snapshot, Transaction } from "@/src/shared/types";
import { Glyph } from "@/src/shared/ui";
import type { ReactNode } from "react";
import { renderTextField } from "../form-controls";
import type { Dialog } from "../types";
type Props = {
  snapshot: Snapshot;
  transaction: Transaction | undefined;
  dialog: Dialog;
  kind: string;
  setKind: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  suggestedCategoryId: string;
  setSuggestedCategoryId: (value: string) => void;
  suggestCategory: (text: string) => void;
  activeAccounts: Account[];
  renderAccountSelect: (name?: string, label?: string, initial?: string) => ReactNode;
  categorySelect: ReactNode;
};

// Поля формы; отправка и обработка ошибок находятся в finance-form.tsx.
export function TransactionFields({
  snapshot,
  transaction,
  dialog,
  kind,
  setKind,
  category,
  setCategory,
  suggestedCategoryId,
  setSuggestedCategoryId,
  suggestCategory,
  activeAccounts,
  renderAccountSelect,
  categorySelect,
}: Props) {
  return (
    <>
      <div className="segmented">
        {[
          ["expense", "Расход"],
          ["income", "Доход"],
          ["transfer", "Перевод"],
          ["refund", "Возврат"],
        ].map(([id, label]) => (
          <button
            type="button"
            key={id}
            className={kind === id ? "selected" : ""}
            onClick={() => setKind(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <label className="field amount-field">
        <span>Сумма</span>
        <div>
          <input
            name="amount"
            aria-label="Сумма"
            placeholder="0"
            defaultValue={transaction ? inputMoney(transaction.amount) : ""}
            inputMode="decimal"
            autoFocus
            required
          />
          <span>сом</span>
        </div>
      </label>
      {renderTextField(
        kind === "expense" ? "На что потратили?" : "Описание",
        "description",
        transaction?.description,
        "text",
        true,
        {
          maxLength: 500,
          placeholder: "Например, продукты на неделю",
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => suggestCategory(e.target.value),
        },
      )}
      {suggestedCategoryId && suggestedCategoryId !== category && (
        <button
          type="button"
          className="suggestion"
          onClick={() => {
            setCategory(suggestedCategoryId);
            setSuggestedCategoryId("");
          }}
        >
          <Glyph name="sparkle" size={16} />
          Предложена категория «
          {snapshot.categories.find((c) => c.id === suggestedCategoryId)?.name}» · применить
        </button>
      )}
      <div className="form-grid">
        {categorySelect}
        {renderAccountSelect()}
      </div>
      {kind === "transfer" &&
        renderAccountSelect("targetId", "На счёт", transaction?.targetId || activeAccounts[1]?.id)}
      {renderTextField(
        "Дата операции",
        "date",
        dialog.repeat
          ? today(snapshot.profile.timezone)
          : transaction?.date || today(snapshot.profile.timezone),
        "date",
      )}
      {kind === "expense" && (
        <label className="checkbox">
          <input name="remember" type="checkbox" />
          Запомнить категорию для этого описания
        </label>
      )}
      {!activeAccounts.length && (
        <p className="form-error">Перед первой операцией добавьте счёт в разделе «Счета».</p>
      )}
    </>
  );
}
