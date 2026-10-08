"use client";
import { useFinance } from "@/src/entities/finance";
import { type Dialog } from "@/src/features/finance-forms";
import { money, percent } from "@/src/shared/lib/money";
import { Glyph, IconBox, Progress } from "@/src/shared/ui";
import { SectionHead } from "@/src/widgets/dashboard";

export function BudgetView({ open }: { open: (dashboard: Dialog) => void }) {
  const { snapshot: snapshot, dashboard: dashboard, month, set } = useFinance();
  const budget = snapshot.budgets.find((b) => b.month === month);
  return (
    <>
      <section className="panel budget-page-summary">
        <div>
          <span className="muted">Бюджет месяца</span>
          <h2>
            {money(dashboard.expenses)} <span>/ {money(dashboard.budget)}</span>
          </h2>
          <Progress value={percent(dashboard.expenses, dashboard.budget)} label="Расход бюджета" />
        </div>
        <button className="primary" onClick={() => open({ type: "budget" })}>
          <Glyph name="edit" size={18} />
          {budget ? "Изменить план" : "Создать план"}
        </button>
      </section>
      <section className="panel">
        <SectionHead
          title="Бюджет по категориям"
          link="Новая категория"
          onClick={() => open({ type: "category" })}
        />
        <div className="category-budget-list">
          {snapshot.categories.map((c) => {
            const spent = dashboard.categories[c.id] || "0";
            const limit =
              (dashboard as typeof dashboard & { limits?: Record<string, string> }).limits?.[
                c.id
              ] ||
              budget?.limits[c.id] ||
              "0";
            const p = percent(spent, limit);
            const left = BigInt(limit) - BigInt(spent);
            return (
              <div className="category-budget" key={c.id}>
                <IconBox name={c.icon} color={p >= 100 ? "pink" : "green"} />
                <div>
                  <div className="category-budget-heading">
                    <button
                      className="category-settings-button"
                      onClick={() => open({ type: "category", item: c })}
                      title="Настройки категории"
                    >
                      <h3>{c.name}</h3>
                    </button>
                    <span>
                      <strong>{money(spent, false)}</strong> / {money(limit)}
                    </span>
                  </div>
                  <Progress value={p} color={p >= 100 ? "pink" : "green"} label={c.name} />
                  <div className="category-budget-bottom">
                    <span className={left < BigInt(0) ? "pink-text" : ""}>
                      {left < BigInt(0)
                        ? `Превышение на ${money(-left)}`
                        : p >= 100 && BigInt(limit) > BigInt(0)
                          ? "Лимит исчерпан"
                          : p >= 80
                            ? `Осталось ${money(left)} — ${p}% лимита использовано`
                            : `Осталось ${money(left)}`}
                    </span>
                    {c.daily && dashboard.days > 0 && left > BigInt(0) && (
                      <span>≈ {money(left / BigInt(dashboard.days))} в день</span>
                    )}
                  </div>
                </div>
                <button
                  className="icon-button"
                  aria-label={`Изменить лимит: ${c.name}`}
                  onClick={() => open({ type: "budget" })}
                >
                  <Glyph name="edit" size={19} />
                </button>
              </div>
            );
          })}
        </div>
        {!!snapshot.audit?.length && (
          <details className="budget-audit">
            <summary>История изменений бюджета</summary>
            {snapshot.audit
              .filter((a) => a.kind === "reallocation")
              .slice(-10)
              .reverse()
              .map((a) => (
                <p key={a.id}>
                  {new Date(a.at).toLocaleDateString("ru-RU")} · {a.detail}
                </p>
              ))}
          </details>
        )}
        <div className="budget-page-actions">
          <button
            className="secondary"
            disabled={!budget}
            onClick={() => open({ type: "reallocate" })}
          >
            <Glyph name="transfer" size={18} />
            Перенести бюджет
          </button>
          <button className="text-link" onClick={() => set({ tab: "transactions" })}>
            Посмотреть расходы
            <Glyph name="right" size={16} />
          </button>
        </div>
      </section>
    </>
  );
}
