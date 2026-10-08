"use client";
import type { Account } from "@/src/shared/types";
import { renderTextField } from "../form-controls";
type Props = { account: Account | undefined; kind: string };

// Поля формы; отправка и обработка ошибок находятся в finance-form.tsx.
export function AccountFields({ account, kind }: Props) {
  return (
    <>
      {renderTextField("Название счёта", "name", account?.name, "text", true, {
        maxLength: 100,
        placeholder: "Например, основная карта",
      })}
      <label className="field">
        <span>Тип счёта</span>
        <select name="kind" defaultValue={account?.kind || "card"}>
          <option value="card">Банковская карта</option>
          <option value="cash">Наличные</option>
          <option value="savings">Накопительный счёт</option>
          <option value="other">Другой счёт</option>
        </select>
      </label>
      {!account &&
        renderTextField("Начальный остаток, сом", "opening", "0", "text", true, {
          inputMode: "decimal",
        })}
      <p className="form-hint">
        Начальный остаток не считается доходом. Переводы между счетами не меняют общий баланс.
      </p>
      {account && (
        <label className="checkbox">
          <input name="archived" type="checkbox" defaultChecked={account.archived} />
          Архивировать счёт, сохранив историю
        </label>
      )}
    </>
  );
}
