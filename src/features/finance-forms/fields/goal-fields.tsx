"use client";
import { inputMoney } from "@/src/shared/lib/money";
import type { Goal } from "@/src/shared/types";
import { renderTextField } from "../form-controls";
type Props = { goal: Goal | undefined };

// Поля формы; отправка и обработка ошибок находятся в finance-form.tsx.
export function GoalFields({ goal }: Props) {
  return (
    <>
      {renderTextField("На что копим?", "name", goal?.name, "text", true, {
        maxLength: 100,
        placeholder: "Например, путешествие",
      })}
      {renderTextField(
        "Целевая сумма, сом",
        "target",
        goal ? inputMoney(goal.target) : "",
        "text",
        true,
        { inputMode: "decimal" },
      )}
      <div className="form-grid">
        {renderTextField("Срок", "deadline", goal?.deadline || "2027-06-01", "date")}
        <label className="field">
          <span>Приоритет</span>
          <select name="priority" defaultValue={goal?.priority || 2}>
            <option value="1">Высокий</option>
            <option value="2">Обычный</option>
            <option value="3">Низкий</option>
          </select>
        </label>
      </div>
      <label className="field">
        <span>Значок</span>
        <select name="icon" defaultValue={goal?.icon || "goals"}>
          <option value="goals">Цель</option>
          <option value="education">Обучение</option>
          <option value="heart">Здоровье</option>
          <option value="laptop">Техника</option>
          <option value="home">Дом</option>
        </select>
      </label>
    </>
  );
}
