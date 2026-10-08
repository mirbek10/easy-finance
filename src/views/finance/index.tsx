"use client";
import { FinanceProvider, useFinance } from "@/src/entities/finance";
import { App } from "./finance-app";
import { AuthScreen } from "./auth-screen";

function AuthenticatedApp() {
  const { authenticated } = useFinance();
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
