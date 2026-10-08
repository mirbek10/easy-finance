import { test, expect } from "@playwright/test";

test("demo overview, filters, keyboard dialog and responsive layouts", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.getByRole("button", { name: "Попробовать демо-режим" }).click();
  await expect(page.getByRole("heading", { name: "Мои финансы", exact: true })).toBeVisible();
  await expect(page.getByText("ДЕМО", { exact: true })).toBeVisible();
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Добавить", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page
    .getByRole("navigation", { name: "Основная навигация" })
    .getByRole("button", { name: "Операции" })
    .click();
  await page.getByRole("textbox", { name: "Поиск по операциям" }).fill("нет такой операции");
  await expect(page.getByRole("heading", { name: "Операции не найдены" })).toBeVisible();
  await page
    .getByRole("navigation", { name: "Основная навигация" })
    .getByRole("button", { name: "Обзор" })
    .click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
  await expect(page.getByRole("navigation", { name: "Мобильная навигация" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole("button", { name: "Добавить операцию", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  expect(errors).toEqual([]);
});

test("registration, account, income, budget warning, sync and idempotency", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/");
  await page.getByRole("button", { name: "Нет аккаунта? Зарегистрироваться" }).click();
  const email = `browser-${Date.now()}@example.test`;
  const password = "Test-password-2026";
  await page.getByLabel("Как вас зовут?").fill("Проверка финансов");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Пароль", { exact: true }).fill(password);
  await page.getByLabel("Повторите пароль").fill(password);
  await page.getByRole("button", { name: "Создать аккаунт", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Настроим ваши финансы" })).toBeVisible();
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page
    .getByRole("navigation", { name: "Основная навигация" })
    .getByRole("button", { name: "Счета", exact: true })
    .click();
  await page.getByRole("button", { name: /^Добавить счёт/ }).click();
  await page.getByLabel("Название счёта").fill("Тестовая карта");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Тестовая карта" })).toBeVisible();
  const headers = { "X-Requested-With": "IzyFinance", Origin: "http://localhost:3000" };
  const snapshot = await (await context.request.get("/api/v1/sync/snapshot")).json();
  const account = snapshot.accounts[0].id;
  const income = await context.request.post("/api/v1/transactions", {
    headers: { ...headers, "Idempotency-Key": "income-browser-test" },
    data: {
      kind: "income",
      amount: "1000000",
      accountId: account,
      categoryId: "other",
      description: "Доход для теста",
      date: "2026-10-07",
    },
  });
  expect(income.ok()).toBeTruthy();
  const budget = await context.request.post("/api/v1/budgets", {
    headers: { ...headers, "Idempotency-Key": "budget-browser-test" },
    data: {
      month: "2026-10",
      income: "1000000",
      reserve: "0",
      goalPlan: "0",
      limits: { food: "10000" },
      expectedVersion: 0,
    },
  });
  expect(budget.ok()).toBeTruthy();

  const second = await browser.newContext();
  const secondPage = await second.newPage();
  await secondPage.goto("/");
  await secondPage.getByLabel("Email", { exact: true }).fill(email);
  await secondPage.getByLabel("Пароль", { exact: true }).fill(password);
  await secondPage.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(secondPage.getByRole("heading", { name: "Мои финансы", exact: true })).toBeVisible();

  await page
    .getByRole("navigation", { name: "Основная навигация" })
    .getByRole("button", { name: "Операции", exact: true })
    .click();
  await page.getByRole("button", { name: "Добавить", exact: true }).click();
  await page.getByLabel("Сумма", { exact: true }).fill("150");
  await page.getByLabel("На что потратили?").fill("Тестовый обед");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(secondPage.getByText("Тестовый обед", { exact: true })).toBeVisible({
    timeout: 15000,
  });
  await secondPage.getByRole("button", { name: "Уведомления", exact: true }).first().click();
  await expect(
    secondPage.getByRole("dialog", { name: "Уведомления" }).getByText(/Превышение — 50 сом/),
  ).toBeVisible();
  const command = {
    kind: "expense",
    amount: "100",
    accountId: account,
    categoryId: "food",
    description: "Без дубля",
    date: "2026-10-07",
  };
  const retryHeaders = { ...headers, "Idempotency-Key": "repeat-browser-test" };
  await context.request.post("/api/v1/transactions", { headers: retryHeaders, data: command });
  await context.request.post("/api/v1/transactions", { headers: retryHeaders, data: command });
  const final = await (await context.request.get("/api/v1/sync/snapshot")).json();
  expect(
    final.transactions.filter((t: { description: string }) => t.description === "Без дубля"),
  ).toHaveLength(1);
  const conflict = await context.request.post("/api/v1/transactions", {
    headers: retryHeaders,
    data: { ...command, amount: "200" },
  });
  expect(conflict.status()).toBe(409);
  await context.setOffline(true);
  await page.getByRole("button", { name: "Добавить", exact: true }).click();
  await page.getByLabel("Сумма", { exact: true }).fill("25");
  await page.getByLabel("На что потратили?").fill("Офлайн-покупка");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(page.getByText("Ожидают синхронизации: 1")).toBeVisible();
  await context.setOffline(false);
  await expect(page.getByText("Ожидают синхронизации: 1")).not.toBeVisible({ timeout: 20000 });
  await expect(page.getByText("Офлайн-покупка", { exact: true })).toBeVisible();
  const exported = await (await context.request.get("/api/v1/export")).json();
  const preview = await context.request.post("/api/v1/import/preview", { headers, data: exported });
  expect(preview.ok()).toBeTruthy();
  expect((await preview.json()).transactions).toBe(4);
  await context.close();
  await second.close();
});

test("profile editing: update name, email, and password", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/");
  await page.getByRole("button", { name: "Нет аккаунта? Зарегистрироваться" }).click();
  const email = `profile-${Date.now()}@example.test`;
  const newEmail = `profile-new-${Date.now()}@example.test`;
  const password = "Initial-password-2026";
  const newPassword = "Updated-password-2026";

  await page.getByLabel("Как вас зовут?").fill("Старое Имя");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Пароль", { exact: true }).fill(password);
  await page.getByLabel("Повторите пароль").fill(password);
  await page.getByRole("button", { name: "Создать аккаунт", exact: true }).click();

  const onboardingSave = page.getByRole("button", { name: "Сохранить", exact: true });
  if (await onboardingSave.isVisible()) {
    await onboardingSave.click();
  }

  await page
    .getByRole("navigation", { name: "Основная навигация" })
    .getByRole("button", { name: "Настройки" })
    .click();
  await expect(page.getByRole("heading", { name: "Личный профиль" })).toBeVisible();

  await page.getByLabel("Имя").fill("Новое Имя");
  await page.getByLabel("Почта").fill(newEmail);
  await page.getByLabel("Текущий пароль").fill(password);
  await page.getByLabel("Новый пароль (необязательно)").fill(newPassword);
  await page.getByLabel("Повторите новый пароль").fill(newPassword);
  await page.getByRole("button", { name: "Сохранить изменения" }).click();

  await expect(page.getByText("Профиль успешно обновлён")).toBeVisible();
  await expect(page.getByText("Новое Имя")).toBeVisible();
  await expect(page.getByText(newEmail)).toBeVisible();

  await page.getByRole("button", { name: "Выйти из аккаунта" }).click();
  await expect(page.getByRole("heading", { name: "Войдите в аккаунт" })).toBeVisible();

  await page.getByLabel("Email", { exact: true }).fill(newEmail);
  await page.getByLabel("Пароль", { exact: true }).fill(newPassword);
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Мои финансы", exact: true })).toBeVisible();

  await context.close();
});
