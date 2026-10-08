"use client";
import { useFinance } from "@/src/entities/finance";
import { type Dialog } from "@/src/features/finance-forms";
import { api, errorMessage } from "@/src/shared/api";
import { money, today } from "@/src/shared/lib/money";
import type { Snapshot } from "@/src/shared/types";
import { Glyph, IconBox, Modal } from "@/src/shared/ui";
import { SectionHead } from "@/src/widgets/dashboard";
import { useEffect, useState } from "react";
import { ProfileEditor } from "./profile-editor";

export function Settings({ open }: { open: (dashboard: Dialog) => void }) {
  const { snapshot: snapshot, logout, command, ensure, set } = useFinance();
  const [error, setError] = useState("");
  const [sessions, setSessions] = useState<Awaited<ReturnType<typeof api.sessions>>>([]);
  const [imported, setImported] = useState<Snapshot | null>(null);
  const [preview, setPreview] = useState<{
    accounts: number;
    transactions: number;
    goals: number;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => {
    if (snapshot.profile.id !== "preview")
      api
        .sessions()
        .then(setSessions)
        .catch((e) => setError(errorMessage(e)));
  }, [snapshot.profile.id]);
  async function exportData() {
    try {
      await ensure();
      const data = await api.export();
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `my-finance-${today()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  async function importFile(file?: File) {
    if (!file) return;
    setError("");
    try {
      if (file.size > 8 * 1024 * 1024) throw new Error("Максимальный размер файла — 8 МБ");
      await ensure();
      const data = JSON.parse(await file.text());
      const result = await api.preview(data);
      setImported(data);
      setPreview(result);
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <div className="settings-grid">
      <section className="panel">
        <SectionHead title="Личный профиль" />
        <div className="settings-profile">
          <span className="avatar large">{snapshot.profile.name[0]}</span>
          <div>
            <h3>{snapshot.profile.name}</h3>
            <p>{snapshot.profile.demo ? "Демонстрационный аккаунт" : snapshot.profile.email}</p>
          </div>
        </div>
        {!snapshot.profile.demo ? (
          <ProfileEditor
            onSaved={() => {
              void api
                .sessions()
                .then(setSessions)
                .catch((error) => setError(errorMessage(error)));
            }}
          />
        ) : (
          <p className="form-hint" style={{ margin: "16px 0" }}>
            В демо-режиме изменение профиля недоступно. Войдите или создайте личный аккаунт для
            управления почтой и паролем.
          </p>
        )}
        <div className="calculation">
          <p>
            <span>Валюта</span>
            <strong>Кыргызский сом · KGS</strong>
          </p>
          <p>
            <span>Часовой пояс</span>
            <strong>{snapshot.profile.timezone}</strong>
          </p>
          <p>
            <span>Ожидаемый доход</span>
            <strong>{money(snapshot.profile.expectedIncome)}</strong>
          </p>
        </div>
        <button className="secondary" onClick={() => open({ type: "onboarding" })}>
          <Glyph name="edit" size={18} />
          Изменить настройки
        </button>
        {snapshot.profile.demo && (
          <button className="text-link settings-login" onClick={() => open({ type: "auth" })}>
            Войти или создать аккаунт
            <Glyph name="arrow" size={18} />
          </button>
        )}
      </section>
      <section className="panel">
        <SectionHead title="Ваши данные" subtitle="Сохраняйте резервную копию финансовой истории" />
        <div className="data-actions">
          <button onClick={exportData}>
            <IconBox name="download" />
            <span>
              <strong>Экспорт данных</strong>
              <small>Все счета, операции, цели и бюджет в JSON</small>
            </span>
            <Glyph name="right" size={18} />
          </button>
          <label>
            <IconBox name="upload" color="purple" />
            <span>
              <strong>Импорт из файла</strong>
              <small>Предварительный просмотр перед заменой</small>
            </span>
            <Glyph name="right" size={18} />
            <input
              type="file"
              accept="application/json,.json"
              onChange={(e) => {
                void importFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <p className="form-hint">
          Перед заменой сервер создаст резервную копию. Файл экспорта не содержит паролей и сессий.
        </p>
      </section>
      <section className="panel sessions-panel">
        <SectionHead title="Активные сессии" subtitle="Устройства, на которых выполнен вход" />
        {sessions.length ? (
          sessions.map((session) => (
            <div className="session-row" key={session.id}>
              <IconBox name="device" color="purple" />
              <div>
                <h3>
                  {session.device.includes("Mobile") ? "Мобильное устройство" : "Веб-браузер"}
                  {session.current && <span className="current-badge">Это устройство</span>}
                </h3>
                <p>Действует до {new Date(session.expires).toLocaleDateString("ru-RU")}</p>
              </div>
              {!session.current && (
                <button
                  className="text-link danger-text"
                  onClick={async () => {
                    try {
                      await api.revoke(session.id);
                      setSessions(await api.sessions());
                    } catch (e) {
                      setError(errorMessage(e));
                    }
                  }}
                >
                  Завершить
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="muted">Войдите в аккаунт, чтобы управлять устройствами.</p>
        )}
        {snapshot.profile.id !== "preview" && (
          <button
            className="secondary logout-button"
            onClick={async () => {
              try {
                await logout();
              } catch (e) {
                setError(errorMessage(e));
              }
            }}
          >
            <Glyph name="logout" size={20} />
            Выйти из аккаунта
          </button>
        )}
      </section>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {preview && imported && (
        <Modal
          title="Проверка импорта"
          onClose={() => {
            setPreview(null);
            setImported(null);
          }}
        >
          <p className="form-hint">
            Файл прошёл проверку. Текущая финансовая история будет заменена.
          </p>
          <div className="calculation">
            <p>
              <span>Счета</span>
              <strong>{preview.accounts}</strong>
            </p>
            <p>
              <span>Операции</span>
              <strong>{preview.transactions}</strong>
            </p>
            <p>
              <span>Цели</span>
              <strong>{preview.goals}</strong>
            </p>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="form-actions">
            <button className="secondary" onClick={() => setPreview(null)}>
              Отмена
            </button>
            <button
              className="primary"
              disabled={isSaving}
              onClick={async () => {
                setIsSaving(true);
                try {
                  await command("/import/commit", {
                    snapshot: imported,
                    mode: "replace",
                    expectedRevision: snapshot.revision,
                  });
                  setPreview(null);
                  setImported(null);
                } catch (e) {
                  setError(errorMessage(e));
                } finally {
                  setIsSaving(false);
                }
              }}
            >
              {isSaving ? "Импортируем…" : "Подтвердить замену"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
