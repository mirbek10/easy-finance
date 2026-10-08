"use client";

import { useState, type FormEvent } from "react";
import { useFinance } from "@/src/entities/finance";
import { api, errorMessage } from "@/src/shared/api";

export function ProfileEditor({ onSaved }: { onSaved: () => void }) {
  const { snapshot, refresh } = useFinance();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    // Passwords are secrets; keep spaces exactly as the user entered them.
    const newPassword = String(fields.get("newPassword") || "");
    const confirmation = String(fields.get("confirmation") || "");
    const currentPassword = String(fields.get("currentPassword") || "");

    setError("");
    setMessage("");

    if (!currentPassword) {
      setError("Введите текущий пароль для подтверждения изменений");
      return;
    }

    if (newPassword || confirmation) {
      if (newPassword !== confirmation) {
        setError("Новые пароли не совпадают");
        return;
      }
      if (newPassword.length < 10) {
        setError("Новый пароль должен содержать не менее 10 символов");
        return;
      }
    }

    setBusy(true);
    try {
      await api.updateProfile({
        name: String(fields.get("name") || "").trim(),
        email: String(fields.get("email") || "").trim(),
        timezone: String(fields.get("timezone") || "").trim(),
        currentPassword,
        newPassword,
      });

      for (const name of ["currentPassword", "newPassword", "confirmation"]) {
        const input = form.elements.namedItem(name) as HTMLInputElement | null;
        if (input) input.value = "";
      }

      await refresh();
      onSaved();
      setMessage("Профиль успешно обновлён");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form-stack profile-editor" onSubmit={submit}>
      <fieldset disabled={busy} className="auth-fields">
        <label className="field">
          <span>Имя</span>
          <input
            name="name"
            autoComplete="name"
            defaultValue={snapshot.profile.name}
            maxLength={100}
            required
          />
        </label>
        <label className="field">
          <span>Почта</span>
          <input
            name="email"
            type="email"
            autoComplete="username"
            defaultValue={snapshot.profile.email}
            maxLength={254}
            required
          />
        </label>
        <label className="field">
          <span>Часовой пояс</span>
          <input
            name="timezone"
            defaultValue={snapshot.profile.timezone}
            placeholder="Asia/Bishkek"
            required
          />
        </label>
        <label className="field">
          <span>Текущий пароль</span>
          <input
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            maxLength={200}
            required
            placeholder="Введите ваш текущий пароль"
          />
        </label>
        <label className="field">
          <span>Новый пароль (необязательно)</span>
          <input
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={10}
            maxLength={200}
            placeholder="Оставьте пустым, если не меняете"
          />
        </label>
        <label className="field">
          <span>Повторите новый пароль</span>
          <input
            name="confirmation"
            type="password"
            autoComplete="new-password"
            minLength={10}
            maxLength={200}
            placeholder="Повторите новый пароль"
          />
        </label>
        <p className="form-hint">
          Оставьте новый пароль пустым, чтобы сохранить текущий. При смене пароля или почты сессии
          на остальных устройствах завершаются автоматически.
        </p>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="green-text" style={{ fontWeight: 600 }}>
            {message}
          </p>
        )}
        <button className="primary" type="submit">
          {busy ? "Сохраняем…" : "Сохранить изменения"}
        </button>
      </fieldset>
    </form>
  );
}
