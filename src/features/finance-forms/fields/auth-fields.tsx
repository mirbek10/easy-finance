"use client";
import { renderTextField } from "../form-controls";
type Props = {
  authMode: string;
  setAuthMode: (value: string) => void;
  setError: (value: string) => void;
};

// Поля формы; отправка и обработка ошибок находятся в finance-form.tsx.
export function AuthFields({ authMode, setAuthMode, setError }: Props) {
  return (
    <>
      <p className="form-hint">Ваш бюджет, счета и цели — на всех ваших устройствах.</p>

      {authMode === "register" &&
        renderTextField("Как вас зовут?", "name", "", "text", true, {
          autoComplete: "given-name",
          maxLength: 100,
        })}
      {renderTextField("Email", "email", "", "email", true, {
        autoComplete: "email",
        placeholder: "you@example.com",
      })}
      {renderTextField("Пароль", "password", "", "password", true, {
        minLength: 10,
        maxLength: 200,
        autoComplete: authMode === "login" ? "current-password" : "new-password",
        placeholder: "Не менее 10 символов",
      })}
      <button
        className="text-link"
        type="button"
        onClick={() => {
          setAuthMode(authMode === "login" ? "register" : "login");
          setError("");
        }}
      >
        {authMode === "login" ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
      </button>
    </>
  );
}
