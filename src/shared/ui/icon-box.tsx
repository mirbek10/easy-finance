"use client";
import { Glyph } from "./glyph";

export function IconBox({
  name,
  color = "green",
  size = 23,
}: {
  name: string;
  color?: string;
  size?: number;
}) {
  return (
    <span className={`icon-box ${color}`}>
      <Glyph name={name} size={size} weight="duotone" />
    </span>
  );
}
