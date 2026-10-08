"use client";
import { useFinance } from "@/src/entities/finance";
import { type Dialog } from "@/src/features/finance-forms";
import { money, today } from "@/src/shared/lib/money";
import { Empty, Glyph } from "@/src/shared/ui";
import { GoalCard } from "@/src/widgets/dashboard";
export function GoalsView({ open }: { open: (dialog: Dialog) => void }) {
  const { snapshot: snapshot, set } = useFinance();
  return (
    <>
      <div className="section-intro">
        <p>У каждой мечты есть план. Приближайтесь к своим целям шаг за шагом.</p>
        <span>{snapshot.goals.length} цели</span>
      </div>
      <div className="goals-page-grid">
        {snapshot.goals.map((g) => {
          const remaining = BigInt(g.target) - BigInt(g.allocated);
          const date = new Date(`${g.deadline}T12:00:00`);
          const now = new Date(`${today(snapshot.profile.timezone)}T12:00:00`);
          const months = Math.max(
            1,
            (date.getFullYear() - now.getFullYear()) * 12 + date.getMonth() - now.getMonth(),
          );
          return (
            <section className="panel full-goal" key={g.id}>
              <GoalCard goal={g} onClick={() => open({ type: "contribution", item: g })} />
              <div className="goal-details">
                <p>
                  <span>Осталось накопить</span>
                  <strong>{money(remaining > BigInt(0) ? remaining : "0")}</strong>
                </p>
                <p>
                  <span>Срок</span>
                  <strong>{date.toLocaleDateString("ru-RU")}</strong>
                </p>
                <p>
                  <span>{date < now ? "Срок прошёл" : "Ориентир в месяц"}</span>
                  <strong className={date < now ? "pink-text" : ""}>
                    {date < now
                      ? "Обновите план"
                      : money(
                          remaining > BigInt(0)
                            ? (remaining + BigInt(months - 1)) / BigInt(months)
                            : "0",
                        )}
                  </strong>
                </p>
              </div>
              <div className="flex gap-3">
                <button className="primary" onClick={() => open({ type: "contribution", item: g })}>
                  <Glyph name="plus" size={18} />
                  Пополнить
                </button>
                <button
                  className="secondary icon-button"
                  aria-label={`Редактировать ${g.name}`}
                  onClick={() => open({ type: "goal", item: g })}
                >
                  <Glyph name="edit" size={19} />
                </button>
              </div>
            </section>
          );
        })}
        {!snapshot.goals.length && (
          <Empty
            title="На что вы мечтаете накопить?"
            text="Создайте первую цель — от небольшого подарка до собственного дома."
            action={
              <button className="primary" onClick={() => open({ type: "goal" })}>
                Создать цель
              </button>
            }
          />
        )}
      </div>
    </>
  );
}
