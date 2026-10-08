"use client";
import { useFinance } from "@/src/entities/finance";
import { type Dialog } from "@/src/features/finance-forms";
import { money } from "@/src/shared/lib/money";
import { Glyph, IconBox } from "@/src/shared/ui";
export function AccountsView({ open }: { open: (dialog: Dialog) => void }) {
  const { snapshot: snapshot, set } = useFinance();
  return (
    <div className="accounts-grid">
      {snapshot.accounts.map((a) => (
        <section className={`panel account-panel ${a.archived ? "archived" : ""}`} key={a.id}>
          <div className="flex items-center justify-between">
            <IconBox
              name={a.kind === "cash" ? "wallet" : a.kind === "savings" ? "coins" : "accounts"}
              color={a.kind === "savings" ? "purple" : "green"}
            />
            <button
              className="icon-button"
              aria-label={`Настройки: ${a.name}`}
              onClick={() => open({ type: "account", item: a })}
            >
              <Glyph name="edit" size={20} />
            </button>
          </div>
          <h2>{a.name}</h2>
          <p>
            {a.archived
              ? "В архиве"
              : a.kind === "card"
                ? "Банковская карта"
                : a.kind === "savings"
                  ? "Накопительный счёт"
                  : "Счёт в сомах"}
          </p>
          <strong className="account-balance">{money(a.balance)}</strong>
          <div className="account-actions">
            <button className="text-link" onClick={() => set({ tab: "transactions" })}>
              История
              <Glyph name="right" size={14} />
            </button>
            <span>KGS</span>
          </div>
        </section>
      ))}
      <button className="add-account" onClick={() => open({ type: "account" })}>
        <Glyph name="plus" size={30} />
        <strong>Добавить счёт</strong>
        <span>Карта, наличные или накопления</span>
      </button>
    </div>
  );
}
