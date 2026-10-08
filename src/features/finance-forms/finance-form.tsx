"use client";
import { useFinance } from "@/src/entities/finance";
import { errorMessage, isConflict } from "@/src/shared/api";
import { money, parseMoney } from "@/src/shared/lib/money";
import type { Account, Category, Goal, Obligation, Transaction } from "@/src/shared/types";
import { Glyph, Modal } from "@/src/shared/ui";
import { useState, type FormEvent } from "react";
import { buildFinanceCommand } from "./build-command";
import { AccountFields } from "./fields/account-fields";
import { AuthFields } from "./fields/auth-fields";
import { CategoryFields } from "./fields/category-fields";
import { ContributionFields } from "./fields/contribution-fields";
import { GoalFields } from "./fields/goal-fields";
import { ObligationFields } from "./fields/obligation-fields";
import { OnboardingFields } from "./fields/onboarding-fields";
import { PaymentFields } from "./fields/pay-fields";
import { ReallocationFields } from "./fields/reallocate-fields";
import { TransactionFields } from "./fields/transaction-fields";
import type { Dialog } from "./types";
export function FinanceForm({ dialog, onClose }: { dialog: Dialog; onClose: () => void }) {
  const { snapshot, month, command, auth, refresh, ensure } = useFinance();
  const item = dialog.item;
  const type = dialog.type;
  const transaction = type === "transaction" ? (item as Transaction | undefined) : undefined;
  const editedCategory = type === "category" ? (item as Category | undefined) : undefined;
  const account = type === "account" ? (item as Account | undefined) : undefined;
  const goal = ["goal", "contribution"].includes(type) ? (item as Goal | undefined) : undefined;
  const obligation = ["obligation", "pay"].includes(type)
    ? (item as Obligation | undefined)
    : undefined;
  const [kind, setKind] = useState(transaction?.kind || "expense");
  const [authMode, setAuthMode] = useState("login");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [hasConflict, setHasConflict] = useState(false);
  const [key, setKey] = useState(() => crypto.randomUUID());
  const [category, setCategory] = useState(
    transaction?.categoryId || obligation?.categoryId || "food",
  );
  const [suggestedCategoryId, setSuggestedCategoryId] = useState("");
  const activeAccounts = snapshot.accounts.filter((a) => !a.archived);
  const titles: Record<string, string> = {
    transaction: transaction && !dialog.repeat ? "Редактировать операцию" : "Новая операция",
    account: account ? "Настройки счёта" : "Новый счёт",
    goal: goal ? "Редактировать цель" : "Новая цель",
    contribution: `Пополнить «${goal?.name}»`,
    obligation: "Обязательный платёж",
    pay: `Оплатить «${obligation?.name}»`,
    auth: authMode === "login" ? "С возвращением" : "Начнём с чистого листа",
    category: editedCategory ? "Настройки категории" : "Новая категория",
    onboarding: "Настроим ваши финансы",
    reallocate: "Перенести бюджет",
  };

  const renderAccountSelect = (
    name = "accountId",
    label = "Счёт",
    initial = transaction?.accountId,
  ) => (
    <label className="field">
      <span>{label}</span>
      <select name={name} defaultValue={initial || activeAccounts[0]?.id} required>
        {!activeAccounts.length && <option value="">Сначала создайте счёт</option>}
        {activeAccounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name} · {money(a.balance)}
          </option>
        ))}
      </select>
    </label>
  );
  const categorySelect = (
    <label className="field">
      <span>Категория</span>
      <select name="categoryId" value={category} onChange={(e) => setCategory(e.target.value)}>
        {snapshot.categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </label>
  );
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setHasConflict(false);
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const readText = (name: string) => String(formData.get(name) || "");
    const readAmount = (name: string) => parseMoney(readText(name) || "0");
    try {
      if (type === "auth") {
        await auth(authMode, {
          email: readText("email"),
          password: readText("password"),
          name: readText("name"),
        });
        onClose();
        return;
      }
      const { path, payload } = buildFinanceCommand(
        dialog,
        snapshot,
        month,
        kind,
        category,
        formData,
      );
      await command(path, payload, key);
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      setHasConflict(isConflict(err));
    } finally {
      setIsSaving(false);
    }
  }
  function suggestCategory(text: string) {
    const rules = [
      { pattern: /продукт|обед|ужин|кафе|кофе|хлеб/i, id: "food" },
      { pattern: /такси|автобус|бензин|поездк/i, id: "transport" },
      { pattern: /аптек|лекарств|врач/i, id: "health" },
    ];
    const remembered = snapshot.rules?.find((r) => r.keyword === text.trim().toLowerCase());
    if (remembered) {
      setSuggestedCategoryId(remembered.categoryId);
      return;
    }
    const match = rules.find((r) => r.pattern.test(text));
    setSuggestedCategoryId(match ? match.id : "");
  }
  return (
    <Modal title={titles[type] || "Добавить"} onClose={onClose}>
      <form onSubmit={submit} onChange={() => setKey(crypto.randomUUID())} className="form-stack">
        {type === "transaction" && (
          <TransactionFields
            snapshot={snapshot}
            transaction={transaction}
            dialog={dialog}
            kind={kind}
            setKind={setKind}
            category={category}
            setCategory={setCategory}
            suggestedCategoryId={suggestedCategoryId}
            setSuggestedCategoryId={setSuggestedCategoryId}
            suggestCategory={suggestCategory}
            activeAccounts={activeAccounts}
            renderAccountSelect={renderAccountSelect}
            categorySelect={categorySelect}
          />
        )}
        {type === "account" && <AccountFields account={account} kind={kind} />}
        {type === "goal" && <GoalFields goal={goal} />}
        {type === "contribution" && (
          <ContributionFields goal={goal} renderAccountSelect={renderAccountSelect} />
        )}
        {type === "obligation" && (
          <ObligationFields
            snapshot={snapshot}
            obligation={obligation}
            categorySelect={categorySelect}
          />
        )}
        {type === "pay" && (
          <PaymentFields obligation={obligation} renderAccountSelect={renderAccountSelect} />
        )}
        {type === "category" && <CategoryFields editedCategory={editedCategory} />}
        {type === "auth" && (
          <AuthFields authMode={authMode} setAuthMode={setAuthMode} setError={setError} />
        )}
        {type === "onboarding" && <OnboardingFields snapshot={snapshot} />}
        {type === "reallocate" && <ReallocationFields snapshot={snapshot} />}
        {error && (
          <div className="form-error" role="alert">
            <Glyph name="warning" size={19} />
            <span>{error}</span>
          </div>
        )}
        {hasConflict && (
          <div className="conflict">
            <p>
              Ваш ввод остался в форме. Обновите данные и откройте запись заново, чтобы сравнить с
              сохранённой версией.
            </p>
            <button
              type="button"
              className="secondary"
              onClick={async () => {
                await refresh();
                onClose();
              }}
            >
              Загрузить серверную версию
            </button>
          </div>
        )}
        <div className="form-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Отмена
          </button>
          <button
            className="primary"
            disabled={
              isSaving ||
              hasConflict ||
              (["transaction", "pay", "contribution"].includes(type) && !activeAccounts.length)
            }
          >
            {isSaving
              ? "Сохраняем…"
              : type === "auth"
                ? authMode === "login"
                  ? "Войти"
                  : "Создать аккаунт"
                : type === "pay"
                  ? "Подтвердить оплату"
                  : "Сохранить"}
            <Glyph name="arrow" size={18} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
