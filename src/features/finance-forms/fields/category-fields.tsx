"use client";
import type { Category } from "@/src/shared/types";
import { renderTextField } from "../form-controls";
type Props = { editedCategory: Category | undefined };

// Поля формы; отправка и обработка ошибок находятся в finance-form.tsx.
export function CategoryFields({ editedCategory }: Props) {
  return (
    <>
      {renderTextField("Название категории", "name", editedCategory?.name, "text", true, {
        maxLength: 100,
      })}
      <label className="checkbox">
        <input name="daily" type="checkbox" defaultChecked={editedCategory?.daily} />
        Повседневные расходы — показывать дневной ориентир
      </label>
      <label className="checkbox">
        <input name="carry" type="checkbox" defaultChecked={editedCategory?.carry} />
        Переносить положительный остаток на следующий месяц
      </label>
    </>
  );
}
