"use client";
import { useFinance } from "@/src/entities/finance";
import { BudgetEditor, FinanceForm, type Dialog } from "@/src/features/finance-forms";
import { errorMessage } from "@/src/shared/api";
import { money, monthName } from "@/src/shared/lib/money";
import type { Transaction } from "@/src/shared/types";
import { Empty, Glyph, IconBox, Modal } from "@/src/shared/ui";
import { Overview } from "@/src/widgets/dashboard";
import { useEffect, useRef, useState } from "react";
import { AccountsView } from "./accounts-view";
import { BudgetView } from "./budget-view";
import { GoalsView } from "./goals-view";
import { navigation } from "./navigation";
import { PaymentsView } from "./payments-view";
import { Settings } from "./settings-view";
import { TransactionDetail } from "./transaction-detail";
import { Transactions } from "./transactions-view";

export function App() {
  const { snapshot, dashboard, month, set, sync, toast, tab, pending, command, logout, ensure } =
    useFinance();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [notifications, setNotifications] = useState(false);
  const [error, setError] = useState("");
  const onboardingShown = useRef("");
  const title =
    tab === "overview"
      ? "Мои финансы"
      : navigation.find((n) => n.id === tab)?.label || "Мои финансы";
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => set({ toast: "" }), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, set]);
  useEffect(() => {
    if (
      !dialog &&
      snapshot.profile.id !== "preview" &&
      !snapshot.profile.onboarded &&
      !snapshot.profile.demo &&
      onboardingShown.current !== snapshot.profile.id
    ) {
      onboardingShown.current = snapshot.profile.id;
      setDialog({ type: "onboarding" });
    }
  }, [snapshot.profile.id, snapshot.profile.onboarded, snapshot.profile.demo, dialog]);
  const unread = snapshot.notifications.filter((n) => !n.read).length;
  async function changeMonth(value: string) {
    if (!value) return;
    try {
      if (snapshot.profile.id === "preview") await ensure();
      set({ month: value });
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Мои финансы — главная">
          <span className="brand-mark">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span>Мои финансы</span>
        </a>
        <div className="sidebar-label">ЛИЧНЫЙ КАБИНЕТ</div>
        <nav className="main-nav" aria-label="Основная навигация">
          {navigation.map((n) => (
            <button
              key={n.id}
              className={tab === n.id ? "active" : ""}
              aria-current={tab === n.id ? "page" : undefined}
              onClick={() => set({ tab: n.id })}
            >
              <Glyph name={n.icon} size={23} weight={tab === n.id ? "duotone" : "regular"} />
              <span>{n.label}</span>
              {tab === n.id && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="small-sparkle">
              <Glyph name="sparkle" size={20} />
            </span>
            <h3>
              Большие планы
              <br />
              начинаются с малого
            </h3>
            <p>
              Откладывайте на то,
              <br />
              что действительно важно.
            </p>
            <button onClick={() => setDialog({ type: "goal" })}>
              Создать цель
              <Glyph name="arrow" size={17} />
            </button>
          </div>
          <button
            className="profile-button"
            onClick={() =>
              snapshot.profile.demo ? setDialog({ type: "auth" }) : set({ tab: "settings" })
            }
          >
            <span className="avatar">{snapshot.profile.name.slice(0, 1).toUpperCase()}</span>
            <span>
              <strong>{snapshot.profile.name}</strong>
              <small>{snapshot.profile.demo ? "Демонстрационный аккаунт" : "Личный аккаунт"}</small>
            </span>
            <Glyph name="down" size={16} />
          </button>
        </div>
      </aside>
      <div className="main-area">
        <div className="topbar">
          <div className="breadcrumb">
            Личное пространство
            <Glyph name="right" size={13} />
            <span>{title}</span>
          </div>
          <div className="topbar-right">
            <span
              className={`sync-status ${sync.includes("Нет") || sync === "Ошибка" ? "offline" : ""}`}
            >
              <span />
              {sync}
            </span>
            <span className="topbar-divider" />
            <button
              className="notification-button icon-button"
              aria-label="Уведомления"
              onClick={() => setNotifications(!notifications)}
            >
              <Glyph name="bell" size={22} />
              {unread > 0 && <i />}
            </button>
          </div>
        </div>
        <main className="main-content">
          <header className="page-header">
            <div>
              <div className="heading-row">
                <h1>{title}</h1>
                <span className="personal-badge">Личное</span>
              </div>
              <label className="month-picker">
                <Glyph name="calendar" size={18} />
                <span>{monthName(month)}</span>
                <Glyph name="down" size={14} />
                <input
                  type="month"
                  aria-label="Выбранный месяц"
                  value={month}
                  onChange={(e) => void changeMonth(e.target.value)}
                />
              </label>
            </div>
            <div className="header-actions">
              <button
                className="mobile-bell icon-button"
                aria-label="Уведомления"
                onClick={() => setNotifications(!notifications)}
              >
                <Glyph name="bell" />
              </button>
              <button
                className="primary add-button"
                onClick={() =>
                  setDialog({
                    type:
                      tab === "accounts"
                        ? "account"
                        : tab === "goals"
                          ? "goal"
                          : tab === "payments"
                            ? "obligation"
                            : "transaction",
                  })
                }
              >
                <Glyph name="plus" size={23} />
                <span>Добавить</span>
              </button>
            </div>
          </header>
          {snapshot.profile.demo && (
            <div className="demo-banner">
              <span>
                <span className="demo-tag">ДЕМО</span>Знакомьтесь с вашими будущими финансами
              </span>
              <button onClick={() => setDialog({ type: "auth" })}>
                Создать свой аккаунт
                <Glyph name="arrow" size={16} />
              </button>
            </div>
          )}
          {unread > 0 && tab === "overview" && (
            <div className="notice">
              <Glyph name="warning" size={20} />
              <span>{snapshot.notifications.filter((n) => !n.read).at(-1)?.message}</span>
              <button className="text-link" onClick={() => set({ tab: "budget" })}>
                Пересмотреть бюджет
              </button>
            </div>
          )}
          {error && (
            <div className="notice error" role="alert">
              {error}
              <button
                className="icon-button"
                aria-label="Закрыть ошибку"
                onClick={() => setError("")}
              >
                <Glyph name="close" size={18} />
              </button>
            </div>
          )}
          {sync === "Войдите снова" && (
            <div className="notice">
              <Glyph name="lock" size={20} />
              <span>Сессия завершена. Войдите для отправки изменений.</span>
              <button className="text-link" onClick={() => setDialog({ type: "auth" })}>
                Войти
              </button>
            </div>
          )}
          {pending.length > 0 && (
            <div className="notice">
              <Glyph name="wifi" size={20} />
              <div>
                <strong>Ожидают синхронизации: {pending.length}</strong>
                {pending.map((p) => (
                  <p key={p.id}>
                    {String(p.data.description)} · {money(String(p.data.amount))}
                    {p.error ? ` — ${p.error}` : " — отправим при подключении"}
                  </p>
                ))}
              </div>
            </div>
          )}
          {tab === "overview" && <Overview open={setDialog} />}
          {tab === "transactions" && <Transactions open={setDialog} />}
          {tab === "accounts" && <AccountsView open={setDialog} />}
          {tab === "budget" && <BudgetView open={setDialog} />}
          {tab === "goals" && <GoalsView open={setDialog} />}
          {tab === "payments" && <PaymentsView open={setDialog} />}
          {tab === "settings" && <Settings open={setDialog} />}
        </main>
      </div>
      <button className="mobile-add primary" onClick={() => setDialog({ type: "transaction" })}>
        <Glyph name="plus" size={24} />
        Добавить операцию
      </button>
      <nav className="mobile-nav" aria-label="Мобильная навигация">
        {navigation
          .filter((n) => ["overview", "transactions", "goals", "accounts"].includes(n.id))
          .map((n) => (
            <button
              key={n.id}
              className={tab === n.id ? "active" : ""}
              onClick={() => set({ tab: n.id })}
            >
              <Glyph name={n.icon} size={23} weight={tab === n.id ? "fill" : "regular"} />
              <span>{n.label}</span>
            </button>
          ))}
        <button
          className={tab === "settings" || tab === "budget" || tab === "payments" ? "active" : ""}
          onClick={() => setDialog({ type: "more" })}
        >
          <Glyph name="dots" size={24} />
          <span>Ещё</span>
        </button>
      </nav>
      {toast && (
        <div className="toast" role="status">
          <Glyph name="success" size={21} />
          {toast}
        </div>
      )}
      {notifications && (
        <Modal title="Уведомления" onClose={() => setNotifications(false)}>
          {snapshot.notifications.length ? (
            <>
              <div className="notification-list">
                {[...snapshot.notifications].reverse().map((n) => (
                  <div key={n.id}>
                    <IconBox name="warning" color="pink" />
                    <p>
                      {n.message}
                      <small>{monthName(n.month)}</small>
                    </p>
                  </div>
                ))}
              </div>
              <button
                className="secondary"
                onClick={async () => {
                  try {
                    await command("/notifications", {});
                    setNotifications(false);
                  } catch (e) {
                    setError(errorMessage(e));
                  }
                }}
              >
                Отметить прочитанными
              </button>
            </>
          ) : (
            <Empty
              title="Всё спокойно"
              text="Здесь появятся предупреждения о бюджете. Мы сообщим, когда расходы приблизятся к лимиту."
            />
          )}
        </Modal>
      )}
      {dialog && !["detail", "available", "budget", "more"].includes(dialog.type) && (
        <FinanceForm
          key={`${dialog.type}-${dialog.item?.id || "new"}`}
          dialog={dialog}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.type === "budget" && <BudgetEditor onClose={() => setDialog(null)} />}
      {dialog?.type === "detail" && (
        <TransactionDetail
          transaction={dialog.item as Transaction}
          close={() => setDialog(null)}
          open={setDialog}
        />
      )}
      {dialog?.type === "available" && (
        <Modal title="Сколько можно потратить" onClose={() => setDialog(null)}>
          <p className="form-hint">
            Свободные деньги после вычета накоплений, резерва и неоплаченных обязательств.
          </p>
          <div className="calculation">
            <p>
              <span>Все ваши счета</span>
              <strong>{money(dashboard.balance)}</strong>
            </p>
            <p>
              <span>Цели и резерв</span>
              <strong>−{money(dashboard.reserved)}</strong>
            </p>
            <p>
              <span>Неоплаченные платежи</span>
              <strong>−{money(dashboard.unpaid)}</strong>
            </p>
            <p className="calculation-total">
              <span>{BigInt(dashboard.available) < BigInt(0) ? "Дефицит" : "Доступно"}</span>
              <strong>{money(dashboard.available)}</strong>
            </p>
          </div>
          <p className="form-hint">
            Ожидаемый доход не включён в баланс. Запланированные взносы не считаются накоплениями.
          </p>
        </Modal>
      )}
      {dialog?.type === "more" && (
        <Modal title="Мои финансы" onClose={() => setDialog(null)}>
          <div className="more-nav">
            {navigation
              .filter((n) => ["budget", "payments", "settings"].includes(n.id))
              .map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    set({ tab: n.id });
                    setDialog(null);
                  }}
                >
                  <Glyph name={n.icon} />
                  {n.label}
                  <Glyph name="right" size={18} />
                </button>
              ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
