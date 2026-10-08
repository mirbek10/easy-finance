"use client";
import type { Snapshot } from "@/src/shared/types";
import { renderTextField } from "../form-controls";
type Props = { snapshot: Snapshot };

// Поля формы; отправка и обработка ошибок находятся в finance-form.tsx.
export function ReallocationFields({ snapshot }: Props) {
  return (
    <>
      <p className="form-hint">Общая сумма бюджета не изменится. Перенос сохранится в истории.</p>
      <div className="form-grid">
        {["from", "to"].map((name, i) => (
          <label className="field" key={name}>
            <span>{i ? "В категорию" : "Из категории"}</span>
            <select name={name} defaultValue={snapshot.categories[i]?.id}>
              {snapshot.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      {renderTextField("Сумма переноса, сом", "amount", "", "text", true, { inputMode: "decimal" })}
    </>
  );
}
