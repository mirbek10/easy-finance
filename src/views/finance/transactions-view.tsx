"use client";
import { useFinance } from "@/src/entities/finance";
import { type Dialog } from "@/src/features/finance-forms";
import { Empty, Glyph } from "@/src/shared/ui";
import { TransactionRow } from "@/src/widgets/dashboard";
import { useState } from "react";

export function Transactions({ open }: { open: (dashboard: Dialog) => void }) {
  const { snapshot: snapshot, month } = useFinance();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");
  const [category, setCategory] = useState("");
  const [account, setAccount] = useState("");
  const [page, setPage] = useState(1);
  const filtered = snapshot.transactions
    .filter(
      (t) =>
        t.date.startsWith(month) &&
        (!kind || t.kind === kind) &&
        (!category || t.categoryId === category) &&
        (!account || t.accountId === account) &&
        t.description.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  return (
    <section className="panel transactions-panel">
      <div className="transaction-filters">
        <label className="search-field">
          <Glyph name="search" size={20} />
          <input
            placeholder="Поиск по операциям"
            aria-label="Поиск по операциям"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <select
          aria-label="Тип операции"
          value={kind}
          onChange={(e) => {
            setKind(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Все типы</option>
          <option value="expense">Расходы</option>
          <option value="income">Доходы</option>
          <option value="transfer">Переводы</option>
          <option value="refund">Возвраты</option>
        </select>
        <select
          aria-label="Категория операции"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Все категории</option>
          {snapshot.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Счёт операции"
          value={account}
          onChange={(e) => {
            setAccount(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Все счета</option>
          {snapshot.accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <div className="list-label">
        <span>{filtered.length} операций за выбранный месяц</span>
        <span>Сумма, KGS</span>
      </div>
      {filtered.length ? (
        filtered
          .slice((page - 1) * 15, page * 15)
          .map((t) => (
            <TransactionRow
              key={t.id}
              transaction={t}
              onClick={() => open({ type: "detail", item: t })}
            />
          ))
      ) : (
        <Empty
          title="Операции не найдены"
          text="Попробуйте изменить фильтры или добавьте новую операцию."
          action={
            <button className="secondary" onClick={() => open({ type: "transaction" })}>
              Добавить операцию
            </button>
          }
        />
      )}
      {filtered.length > 15 && (
        <div className="pagination">
          <button className="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>
            Назад
          </button>
          <span>
            {page} / {Math.ceil(filtered.length / 15)}
          </span>
          <button
            className="secondary"
            disabled={page * 15 >= filtered.length}
            onClick={() => setPage(page + 1)}
          >
            Далее
          </button>
        </div>
      )}
    </section>
  );
}
