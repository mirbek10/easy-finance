"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useFinance } from "@/src/entities/finance";
import { errorMessage } from "@/src/shared/api";
import { Glyph } from "@/src/shared/ui";

export function AuthScreen() {
  const { auth } = useFinance();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const address = new URL(window.location.href);
    const sensitiveFields = ["email", "password", "currentPassword", "newPassword", "confirmation"];
    const hasCredentialsInAddress = sensitiveFields.some((field) =>
      address.searchParams.has(field),
    );
    if (!hasCredentialsInAddress) return;

    for (const field of sensitiveFields) address.searchParams.delete(field);
    window.history.replaceState(
      window.history.state,
      "",
      `${address.pathname}${address.search}${address.hash}`,
    );
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const password = String(fields.get("password"));
    if (mode === "register" && password !== fields.get("confirmation")) {
      setError("Пароли не совпадают");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await auth(mode, {
        email: String(fields.get("email")),
        password,
        name: String(fields.get("name") || ""),
      });
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="panel auth-card" aria-labelledby="auth-title">
        <div className="auth-brand">
          <Glyph name="wallet" size={28} /> Мои финансы
        </div>
        <h1 id="auth-title">{mode === "login" ? "Войдите в аккаунт" : "Создайте аккаунт"}</h1>
        <p className="form-hint">
          Ваши счета, бюджет и цели — в одном месте. Войдите, чтобы продолжить.
        </p>
        <form className="form-stack" onSubmit={submit} key={mode}>
          <fieldset disabled={busy} className="auth-fields">
            {mode === "register" && (
              <label className="field">
                <span>Как вас зовут?</span>
                <input name="name" autoComplete="name" maxLength={100} required />
              </label>
            )}
            <label className="field">
              <span>Email</span>
              <input name="email" type="email" autoComplete="username" maxLength={254} required />
            </label>
            <label className="field">
              <span>Пароль</span>
              <input
                name="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={10}
                maxLength={200}
                required
              />
            </label>
            {mode === "register" && (
              <label className="field">
                <span>Повторите пароль</span>
                <input
                  name="confirmation"
                  type="password"
                  autoComplete="new-password"
                  minLength={10}
                  maxLength={200}
                  required
                />
              </label>
            )}
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <button className="primary" type="submit">
              {busy ? "Подождите…" : mode === "login" ? "Войти" : "Создать аккаунт"}
            </button>
            <button
              className="text-link"
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
            >
              {mode === "login" ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
            </button>
          </fieldset>
        </form>
      </section>
    </main>
  );
}
