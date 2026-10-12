"use client";
import { FinanceProvider, useFinance } from "@/src/entities/finance";
import { App } from "./finance-app";
import { AuthScreen } from "./auth-screen";

function AuthenticatedApp() {
  const { authenticated, sessionChecked } = useFinance();
  if (!sessionChecked) {
    return (
      <main className="session-check" aria-busy="true">
        <section className="session-check__content" role="status" aria-live="polite">
          <div className="session-check__visual" aria-hidden="true">
            <span className="session-check__halo" />
            <span className="session-check__orbit" />
            <span className="session-check__mark">
              <svg viewBox="0 0 32 32" fill="none">
                <path d="M16 2.5 29.5 16 16 29.5 2.5 16 16 2.5Z" fill="currentColor" />
                <path d="M16 2.5V16h13.5L16 2.5Z" fill="#8DE0BA" />
                <path d="M16 16H2.5L16 29.5V16Z" fill="#087A54" />
              </svg>
            </span>
            <span className="session-check__spark session-check__spark--one" />
            <span className="session-check__spark session-check__spark--two" />
          </div>
          <p className="session-check__eyebrow">МОИ ФИНАНСЫ</p>
          <h1 className="session-check__title">Восстанавливаем ваш вход</h1>
          <p className="session-check__description">Проверяем защищённую сессию</p>
          <span className="session-check__dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </section>
      </main>
    );
  }
  return authenticated ? <App /> : <AuthScreen />;
}

// Входная точка: состояние принадлежит одному экземпляру приложения.
export function FinanceApp() {
  return (
    <FinanceProvider>
      <AuthenticatedApp />
    </FinanceProvider>
  );
}
