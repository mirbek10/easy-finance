"use client";
import { useFinance } from "@/src/entities/finance";
import { type Dialog } from "@/src/features/finance-forms";
import { money } from "@/src/shared/lib/money";
import { Empty, Glyph, IconBox } from "@/src/shared/ui";
import { SectionHead } from "@/src/widgets/dashboard";
export function PaymentsView({ open }: { open: (dialog: Dialog) => void }) {
  const { snapshot: snapshot, set } = useFinance();
  return (
    <section className="panel">
      <SectionHead
        title="Плановые платежи"
        subtitle="Отмечайте оплату, когда деньги действительно списаны"
      />
      {snapshot.obligations.length ? (
        <div className="payments-list">
          {[...snapshot.obligations]
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((o) => (
              <div className="payment-row" key={o.id}>
                <IconBox
                  name={o.name.toLowerCase().includes("интернет") ? "wifi" : "calendar"}
                  color={o.transactionId ? "green" : "purple"}
                />
                <div>
                  <h3>{o.name}</h3>
                  <p>
                    {new Date(`${o.date}T12:00:00`).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}{" "}
                    · {o.recurrence === "monthly" ? "Ежемесячно" : "Один раз"}
                  </p>
                </div>
                <strong>{money(o.amount)}</strong>
                {o.transactionId ? (
                  <span className="paid-badge">
                    <Glyph name="check" size={15} />
                    Оплачено
                  </span>
                ) : (
                  <button className="secondary" onClick={() => open({ type: "pay", item: o })}>
                    Оплатить
                  </button>
                )}
              </div>
            ))}
        </div>
      ) : (
        <Empty
          title="Все платежи под контролем"
          text="Добавьте аренду, интернет и другие регулярные расходы."
          action={
            <button className="primary" onClick={() => open({ type: "obligation" })}>
              Добавить платёж
            </button>
          }
        />
      )}
    </section>
  );
}
