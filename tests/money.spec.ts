import { test, expect } from "@playwright/test";
import { money, parseMoney, percent } from "../src/shared/lib/money";
test("money preserves exact minor units", () => {
  expect(parseMoney("150,50")).toBe("15050");
  expect(parseMoney("1 200.01")).toBe("120001");
  expect(parseMoney("-1.01")).toBe("-101");
  expect(() => parseMoney("1.001")).toThrow();
  expect(() => parseMoney("1e5")).toThrow();
  expect(money("15050")).toBe("150,50 сом");
  expect(percent("7500", "10000")).toBe(75);
});
