"use client";
import { type ReactNode } from "react";
import { IconBox } from "./icon-box";

export function Empty({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <IconBox name="wallet" />
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
