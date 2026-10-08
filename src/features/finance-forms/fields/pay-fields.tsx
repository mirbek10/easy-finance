"use client";
import { money } from "@/src/shared/lib/money";
import type { Obligation } from "@/src/shared/types";
import type { ReactNode } from "react";
type Props = {
  obligation: Obligation | undefined;
  renderAccountSelect: (name?: string, label?: string, initial?: string) => ReactNode;
};

// Поля формы; отправка и обработка ошибок находятся в finance-form.tsx.
export function PaymentFields({ obligation, renderAccountSelect }: Props) {
  return (
    <>
      <div className="payment-total">{money(obligation!.amount)}</div>
      <p className="form-hint">Создадим расход «{obligation!.name}» и отметим платёж оплаченным.</p>
      {renderAccountSelect()}
    </>
  );
}
