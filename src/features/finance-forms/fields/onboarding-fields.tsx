"use client";
import { inputMoney } from "@/src/shared/lib/money";
import type { Snapshot } from "@/src/shared/types";
import { renderTextField } from "../form-controls";
type Props = { snapshot: Snapshot };

// Поля формы; отправка и обработка ошибок находятся в finance-form.tsx.
export function OnboardingFields({ snapshot }: Props) {
  return (
    <>
      <p className="form-hint">
        Оценки помогут предложить бюджет. Они не добавляют деньги на счета. После настройки можно
        создать счета, цели и платежи.
      </p>
      {renderTextField("Ваше имя", "name", snapshot.profile.name)}
      <label className="field">
        <span>Часовой пояс</span>
        <select name="timezone" defaultValue={snapshot.profile.timezone}>
          {[
            "Asia/Bishkek",
            "Asia/Almaty",
            "Europe/Moscow",
            "Europe/Berlin",
            "America/New_York",
            "UTC",
          ].map((z) => (
            <option key={z}>{z}</option>
          ))}
        </select>
      </label>
      {renderTextField(
        "Ожидаемый доход в месяц, сом",
        "income",
        inputMoney(snapshot.profile.expectedIncome),
        "text",
        false,
      )}
      <div className="form-grid">
        {renderTextField(
          "Питание в месяц, сом",
          "food",
          inputMoney(snapshot.profile.food),
          "text",
          false,
        )}
        {renderTextField(
          "Транспорт в месяц, сом",
          "transport",
          inputMoney(snapshot.profile.transport),
          "text",
          false,
        )}
      </div>
      {renderTextField(
        "Человек в семье",
        "people",
        String(snapshot.profile.people || 1),
        "number",
        false,
        {
          min: 1,
          max: 50,
        },
      )}
    </>
  );
}
