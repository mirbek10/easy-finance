"use client";
import { FinanceProvider, useFinance } from "@/src/entities/finance";
import { App } from "./finance-app";
import { AuthScreen } from "./auth-screen";

function AuthenticatedApp() {
  const { authenticated, sessionChecked } = useFinance();
  if (!sessionChecked) {
    return (
      <main className="auth-page" aria-busy="true">
        <section className="panel auth-card">
          <p role="status">Проверяем сохранённый вход…</p>
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
