"use client";
// Общее текстовое поле: подпись, значение и атрибуты HTML.
export const renderTextField = (
  label: string,
  name: string,
  value = "",
  inputType = "text",
  required = true,
  extra: Record<string, unknown> = {},
) => (
  <label className="field">
    <span>{label}</span>
    <input name={name} type={inputType} defaultValue={value} required={required} {...extra} />
  </label>
);
