"use client";
import { money } from "@/src/shared/lib/money";
import type { Goal } from "@/src/shared/types";
import type { ReactNode } from "react";
import { renderTextField } from "../form-controls";
type Props = {
  goal: Goal | undefined;
  renderAccountSelect: (name?: string, label?: string, initial?: string) => ReactNode;
};

// Поля формы; отправка и обработка ошибок находятся в finance-form.tsx.
export function ContributionFields({ goal, renderAccountSelect }: Props) {
  return (
    <>
      <p className="form-hint">
        Накоплено {money(goal!.allocated)} из {money(goal!.target)}. Деньги резервируются на
        выбранном счёте и остаются частью общего баланса.
      </p>
      {renderTextField("Сумма пополнения, сом", "amount", "", "text", true, {
        inputMode: "decimal",
        autoFocus: true,
      })}
      {renderAccountSelect()}
      <p className="form-hint">Для изъятия укажите отрицательную сумму.</p>
    </>
  );
}
