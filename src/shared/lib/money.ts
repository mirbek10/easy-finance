export function money(value: string | bigint, currency = true): string {
  const amount = BigInt(value || "0");
  const absolute = amount < BigInt(0) ? -amount : amount;
  const whole = (absolute / BigInt(100)).toLocaleString("ru-RU");
  const fraction = absolute % BigInt(100);
  return `${amount < BigInt(0) ? "−" : ""}${whole}${fraction ? `,${fraction.toString().padStart(2, "0")}` : ""}${currency ? " сом" : ""}`;
}
export function parseMoney(value: string): string {
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  if (!/^-?\d{1,12}(\.\d{1,2})?$/.test(normalized))
    throw new Error("Введите сумму с точностью до двух знаков");
  const negative = normalized.startsWith("-");
  const [whole, fraction = ""] = normalized.replace("-", "").split(".");
  return (
    (BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"))) *
    BigInt(negative ? -1 : 1)
  ).toString();
}
export const inputMoney = (value: string) =>
  (BigInt(value || "0") / BigInt(100)).toString() +
  (BigInt(value || "0") % BigInt(100)
    ? `.${(BigInt(value) % BigInt(100)).toString().padStart(2, "0")}`
    : "");
export const percent = (value: string, total: string) =>
  BigInt(total || "0") > BigInt(0) ? Number((BigInt(value) * BigInt(100)) / BigInt(total)) : 0;
export function today(timezone = "Asia/Bishkek") {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function monthName(month: string) {
  return new Date(`${month}-15T12:00:00`)
    .toLocaleDateString("ru-RU", { month: "long", year: "numeric" })
    .replace(" г.", "");
}
