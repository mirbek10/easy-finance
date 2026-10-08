"use client";
import { Glyph } from "@/src/shared/ui";

export function SectionHead({
  title,
  icon,
  link,
  onClick,
  subtitle,
}: {
  title: string;
  icon?: string;
  link?: string;
  onClick?: () => void;
  subtitle?: string;
}) {
  return (
    <div className="section-head">
      <div>
        <h2>
          {icon && <Glyph name={icon} size={22} className="purple-text" />}
          {title}
        </h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {link && (
        <button className="text-link" onClick={onClick}>
          {link}
          <Glyph name="right" size={14} />
        </button>
      )}
    </div>
  );
}
