"use client";
import { inputMoney, today } from "@/src/shared/lib/money";
import type { Obligation, Snapshot } from "@/src/shared/types";
import type { ReactNode } from "react";
import { renderTextField } from "../form-controls";
type Props = { snapshot: Snapshot; obligation: Obligation | undefined; categorySelect: ReactNode };

// Поля формы; отправка и обработка ошибок находятся в finance-form.tsx.
export function ObligationFields({ snapshot, obligation, categorySelect }: Props) {
  return (
    <>
      {renderTextField("Название", "name", obligation?.name, "text", true, {
        placeholder: "Например, аренда квартиры",
        maxLength: 100,
      })}
      {renderTextField(
        "Сумма, сом",
        "amount",
        obligation ? inputMoney(obligation.amount) : "",
        "text",
        true,
        { inputMode: "decimal" },
      )}
      <div className="form-grid">
        {renderTextField(
          "Дата платежа",
          "date",
          obligation?.date || today(snapshot.profile.timezone),
          "date",
        )}
        {categorySelect}
      </div>
      <label className="field">
        <span>Повторять</span>
        <select name="recurrence" defaultValue={obligation?.recurrence || "monthly"}>
          <option value="monthly">Каждый месяц</option>
          <option value="once">Один раз</option>
        </select>
      </label>
      <p className="form-hint">
        Плановый платёж не списывает деньги. Расход появится после подтверждения оплаты.
      </p>
    </>
  );
}
