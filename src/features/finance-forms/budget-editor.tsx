"use client";
import { useFinance } from "@/src/entities/finance";
import { api, errorMessage } from "@/src/shared/api";
import { inputMoney, money, parseMoney } from "@/src/shared/lib/money";
import type { Budget } from "@/src/shared/types";
import { Glyph, Modal } from "@/src/shared/ui";
import { useState, type FormEvent } from "react";

export function BudgetEditor({ onClose }: { onClose: () => void }) {
  const { snapshot, month, command, ensure } = useFinance();
  const existing = snapshot.budgets.find((b) => b.month === month);
  const [budget, setBudget] = useState<Budget>(
    existing || {
      id: month,
      month,
      income: snapshot.profile.expectedIncome,
      reserve: "0",
      goalPlan: "0",
      limits: {},
      locked: [],
      version: 0,
    },
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [explanation, setExplanation] = useState("");
  const [deficit, setDeficit] = useState("0");
  const [key] = useState(() => crypto.randomUUID());
  const changeAmount = (name: "income" | "reserve" | "goalPlan", value: string) => {
    try {
      setBudget({ ...budget, [name]: parseMoney(value || "0") });
    } catch {
      setError("Сумма должна содержать не более двух знаков после запятой");
    }
  };
  async function propose() {
    setIsSaving(true);
    setError("");
    try {
      await ensure();
      const result = await api.proposal({
        month: budget.month,
        income: budget.income,
        reserve: budget.reserve,
        goalPlan: budget.goalPlan,
        limits: budget.limits,
        locked: budget.locked,
        planGoals: true,
      });
      setBudget(result.budget);
      setExplanation(result.explanation);
      setDeficit(result.deficit);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setIsSaving(false);
    }
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      await command(
        "/budgets",
        {
          month: budget.month,
          income: budget.income,
          reserve: budget.reserve,
          goalPlan: budget.goalPlan,
          limits: budget.limits,
          locked: budget.locked,
          expectedVersion: budget.version,
        },
        key,
      );
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setIsSaving(false);
    }
  }
  return (
    <Modal title="План на месяц" onClose={onClose} wide>
      <form className="form-stack" onSubmit={save}>
        <label className="field">
          <span>Месяц бюджета</span>
          <input
            type="month"
            value={budget.month}
            onChange={(e) =>
              setBudget({
                ...budget,
                month: e.target.value,
                version: snapshot.budgets.find((b) => b.month === e.target.value)?.version || 0,
              })
            }
            required
          />
        </label>
        <div className="form-grid">
          {(
            [
              ["income", "Планируемый доход"],
              ["reserve", "Резерв"],
              ["goalPlan", "План взносов на цели"],
            ] as const
          ).map(([name, label]) => (
            <label className="field" key={name}>
              <span>{label}, сом</span>
              <input
                key={`${name}-${budget[name]}`}
                inputMode="decimal"
                defaultValue={inputMoney(budget[name])}
                onBlur={(e) => changeAmount(name, e.target.value)}
              />
            </label>
          ))}
        </div>
        <button type="button" className="secondary" onClick={propose} disabled={isSaving}>
          <Glyph name="sparkle" size={20} />
          Предложить распределение
        </button>
        {explanation && (
          <div className="info-note">
            {explanation}
            {BigInt(deficit) > BigInt(0) && <strong> Дефицит: {money(deficit)}.</strong>}
          </div>
        )}
        <div className="budget-edit-list">
          {snapshot.categories.map((c) => (
            <div className="budget-edit-row" key={c.id}>
              <span className="category-dot" style={{ background: c.color }} />
              <label htmlFor={`limit-${c.id}`}>{c.name}</label>
              <input
                id={`limit-${c.id}`}
                aria-label={`Лимит: ${c.name}`}
                key={`${c.id}-${explanation}-${budget.limits[c.id]}`}
                inputMode="decimal"
                defaultValue={inputMoney(budget.limits[c.id] || "0")}
                onBlur={(e) => {
                  try {
                    setBudget({
                      ...budget,
                      limits: { ...budget.limits, [c.id]: parseMoney(e.target.value || "0") },
                    });
                  } catch (err) {
                    setError(errorMessage(err));
                  }
                }}
              />
              <span>сом</span>
              <button
                type="button"
                aria-label={`Закрепить: ${c.name}`}
                aria-pressed={budget.locked.includes(c.id)}
                className={`icon-button ${budget.locked.includes(c.id) ? "locked" : ""}`}
                onClick={() =>
                  setBudget({
                    ...budget,
                    locked: budget.locked.includes(c.id)
                      ? budget.locked.filter((id) => id !== c.id)
                      : [...budget.locked, c.id],
                  })
                }
              >
                <Glyph name="lock" size={17} />
              </button>
            </div>
          ))}
        </div>
        <p className="form-hint">
          Закреплённые суммы сохраняются при пересчёте. Предложение применяется только после
          сохранения.
        </p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Отмена
          </button>
          <button className="primary" disabled={isSaving}>
            {isSaving ? "Сохраняем…" : "Сохранить бюджет"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
