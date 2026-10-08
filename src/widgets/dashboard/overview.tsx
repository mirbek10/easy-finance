"use client";
import { useFinance } from "@/src/entities/finance";
import type { Dialog } from "@/src/features/finance-forms";
import { money, percent } from "@/src/shared/lib/money";
import { Empty, Glyph, IconBox, Progress } from "@/src/shared/ui";
import { GoalCard } from "./goal-card";
import { SectionHead } from "./section-head";
import { TransactionRow } from "./transaction-row";

export function Overview({ open }: { open: (dashboard: Dialog) => void }) {
  const { snapshot: snapshot, dashboard: dashboard, month, set } = useFinance();
  const budgetPercent = percent(dashboard.expenses, dashboard.budget);
  const expenseCategories = snapshot.categories.filter(
    (c) => BigInt(dashboard.categories[c.id] || "0") > BigInt(0),
  );
  const transactions = snapshot.transactions
    .filter((t) => t.date.startsWith(month))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const upcoming = snapshot.obligations
    .filter((o) => !o.transactionId)
    .sort((a, b) => a.date.localeCompare(b.date));
  let offset = 0;
  const circles = expenseCategories.map((c) => {
    const p = percent(dashboard.categories[c.id], dashboard.expenses);
    const result = (
      <circle
        key={c.id}
        cx="90"
        cy="90"
        r="70"
        fill="none"
        stroke={c.color}
        strokeWidth="23"
        strokeDasharray={`${p * 4.398} ${439.8 - p * 4.398}`}
        strokeDashoffset={-offset * 4.398}
      />
    );
    offset += p;
    return result;
  });
  return (
    <div className="overview-grid">
      <div className="stats-grid">
        <button className="stat-card balance-card" onClick={() => set({ tab: "accounts" })}>
          <IconBox name="wallet" />
          <div className="stat-content">
            <span className="stat-label">Общий баланс</span>
            <strong>
              {money(dashboard.balance, false)} <span>сом</span>
            </strong>
            <div className="stat-footer">
              <span className="stat-chip">
                <Glyph name="accounts" size={13} />
                {snapshot.accounts.filter((a) => !a.archived).length} счёта
              </span>
              <small>включая накопления на цели</small>
            </div>
          </div>
          <Glyph name="right" size={20} className="mobile-stat-arrow" />
        </button>
        <button className="stat-card available-card" onClick={() => open({ type: "available" })}>
          <IconBox name="coins" color="purple" />
          <div className="stat-content">
            <span className="stat-label">Можно потратить</span>
            <strong>
              {money(dashboard.available, false)} <span>сом</span>
            </strong>
            <div className="stat-footer">
              <small>
                Доступно для свободных
                <br className="desktop-break" /> расходов
              </small>
            </div>
          </div>
          <Glyph name="right" size={20} className="mobile-stat-arrow" />
        </button>
        <button className="stat-card expense-card" onClick={() => set({ tab: "transactions" })}>
          <IconBox name="chart" color="pink" />
          <div className="stat-content">
            <span className="stat-label">Расходы за месяц</span>
            <strong>
              {money(dashboard.expenses, false)} <span>сом</span>
            </strong>
            <div className="stat-footer">
              <span className="stat-chip neutral">
                {transactions.filter((t) => t.kind === "expense").length} операций
              </span>
              <small>
                Доходы: <span className="green-text">+{money(dashboard.income)}</span>
              </small>
            </div>
          </div>
        </button>
      </div>
      <section className="panel budget-panel">
        <SectionHead
          title="Бюджет на месяц"
          icon="chart"
          link="Все категории"
          onClick={() => set({ tab: "budget" })}
        />
        <div className="budget-amount">
          <div>
            <strong>{money(dashboard.expenses, false)}</strong>
            <span> / {money(dashboard.budget)}</span>
          </div>
          <span>{budgetPercent}%</span>
        </div>
        <Progress
          value={budgetPercent}
          label="Бюджет месяца"
          color={budgetPercent >= 100 ? "pink" : "green"}
        />
        <div className="budget-meta">
          <span>
            {BigInt(dashboard.remaining) < BigInt(0) ? "Превышение" : "Осталось"}{" "}
            <b>
              {money(
                BigInt(dashboard.remaining) < BigInt(0)
                  ? -BigInt(dashboard.remaining)
                  : dashboard.remaining,
              )}
            </b>
          </span>
          <span>
            Дней до конца месяца: <b>{dashboard.days}</b>
          </span>
        </div>
        <div className="budget-insight">
          <span className="tiny-dot" />
          <span>
            {budgetPercent > 100
              ? "Расходы превысили план. Пересмотрите лимиты."
              : budgetPercent >= 80
                ? "Бюджет подходит к концу — следите за расходами."
                : BigInt(dashboard.budget) > BigInt(0)
                  ? "Вы укладываетесь в запланированный бюджет"
                  : "Создайте план, чтобы управлять расходами"}
          </span>
          <Glyph name={budgetPercent > 100 ? "warning" : "check"} size={16} />
        </div>
      </section>
      <section className="panel category-panel">
        <SectionHead title="Расходы по категориям" />
        <div className="category-chart">
          <div className="donut">
            <svg viewBox="0 0 180 180" role="img" aria-label="Распределение расходов по категориям">
              <circle cx="90" cy="90" r="70" fill="none" stroke="#e9ecf4" strokeWidth="23" />
              <g transform="rotate(-90 90 90)">{circles}</g>
            </svg>
            <div>
              <strong>{money(dashboard.expenses, false)}</strong>
              <span>сом</span>
            </div>
          </div>
          <div className="chart-legend">
            {expenseCategories.length ? (
              expenseCategories.slice(0, 5).map((c) => (
                <button key={c.id} onClick={() => set({ tab: "budget" })}>
                  <span className="category-dot" style={{ background: c.color }} />
                  <span>{c.name}</span>
                  <span>{percent(dashboard.categories[c.id], dashboard.expenses)}%</span>
                  <span>{money(dashboard.categories[c.id])}</span>
                </button>
              ))
            ) : (
              <p className="muted">Здесь появятся ваши расходы</p>
            )}
          </div>
        </div>
      </section>
      <section className="panel goals-panel">
        <SectionHead
          title="Мои цели"
          icon="goals"
          link="Все цели"
          onClick={() => set({ tab: "goals" })}
        />
        {snapshot.goals.length ? (
          <div className="goal-grid">
            {snapshot.goals.slice(0, 3).map((g) => (
              <GoalCard
                key={g.id}
                goal={g}
                onClick={() => open({ type: "contribution", item: g })}
              />
            ))}
          </div>
        ) : (
          <Empty
            title="Мечта становится целью"
            text="Укажите сумму и срок — и начните копить."
            action={
              <button className="secondary" onClick={() => open({ type: "goal" })}>
                Создать цель
              </button>
            }
          />
        )}
      </section>
      <section className="panel recent-panel">
        <SectionHead
          title="Последние операции"
          link="Все операции"
          onClick={() => set({ tab: "transactions" })}
        />
        <div className="recent-list">
          {transactions.length ? (
            transactions
              .slice(0, 3)
              .map((t) => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  onClick={() => open({ type: "detail", item: t })}
                />
              ))
          ) : (
            <Empty title="Пока нет операций" text="Добавьте первый доход или расход." />
          )}
        </div>
      </section>
      <section className="panel payments-panel">
        <SectionHead
          title="Ближайшие платежи"
          icon="calendar"
          link="Все платежи"
          onClick={() => set({ tab: "payments" })}
        />
        {upcoming.length ? (
          <div className="upcoming-grid">
            {upcoming.slice(0, 2).map((o) => (
              <div className="upcoming-item" key={o.id}>
                <div className="date-square">
                  <strong>{o.date.slice(8)}</strong>
                  <span>
                    {new Date(`${o.date}T12:00:00`)
                      .toLocaleDateString("ru-RU", { month: "short" })
                      .replace(".", "")}
                  </span>
                </div>
                <div>
                  <h3>{o.name}</h3>
                  <p>{o.recurrence === "monthly" ? "Ежемесячный платёж" : "Разовый платёж"}</p>
                </div>
                <strong>{money(o.amount)}</strong>
                <button
                  className="icon-button"
                  aria-label={`Оплатить ${o.name}`}
                  onClick={() => open({ type: "pay", item: o })}
                >
                  <Glyph name="right" size={18} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="inline-empty">
            Нет запланированных платежей
            <button className="text-link" onClick={() => open({ type: "obligation" })}>
              Добавить платёж
            </button>
          </div>
        )}
      </section>
      <div className="overview-footer">
        <Glyph name="lock" size={14} />
        <span>Ваши финансы. Только для вас.</span>
        <span className="footer-currency">Кыргызский сом · KGS</span>
      </div>
    </div>
  );
}
