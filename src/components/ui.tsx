import type { ReactNode } from "react";
import { useDocsT } from "../content/docs-i18n";

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: string }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export function toneForKind(kind: string): string {
  if (/TODO/.test(kind)) return "amber";
  if (/HACK/.test(kind)) return "red";
  if (/PATCH/.test(kind)) return "blue";
  if (/NOTE/.test(kind)) return "violet";
  return "neutral";
}

export function Stat({
  label, value, hint, tone = ""
}: { label: string; value: string; hint?: string; tone?: string }) {
  return (
    <div className={`stat ${tone}`}>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {hint && <span className="stat-hint">{hint}</span>}
    </div>
  );
}

export function Bars({
  items, max, mono = false
}: { items: { label: string; value: number }[]; max?: number; mono?: boolean }) {
  const top = max ?? Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="bars">
      {items.map((i) => (
        <div className="bar-row" key={i.label}>
          <span className={`bar-label ${mono ? "mono" : ""}`} title={i.label}>{i.label}</span>
          <span className="bar-track">
            <span className="bar-fill" style={{ width: `${Math.max(2, (i.value / top) * 100)}%` }} />
          </span>
          <span className="bar-value">{i.value.toLocaleString("pt-BR")}</span>
        </div>
      ))}
    </div>
  );
}

export function SearchInput({
  value, onChange, placeholder
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const { t } = useDocsT();
  return (
    <div className="search">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" strokeLinecap="round" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? t("common.search")}
        spellCheck={false}
      />
      {value && (
        <button className="clear" onClick={() => onChange("")} aria-label={t("common.clear")}>×</button>
      )}
    </div>
  );
}

export function Loading({ label }: { label?: string }) {
  const { t } = useDocsT();
  return (
    <div className="loading">
      <span className="spinner" />
      {label ?? t("common.loadingData")}
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  const { t } = useDocsT();
  return <div className="errorbox">{t("common.error")}: {message}</div>;
}

export function SectionTitle({ kicker, title, right }: { kicker?: string; title: string; right?: ReactNode }) {
  return (
    <div className="section-title">
      <div>
        {kicker && <span className="kicker">{kicker}</span>}
        <h2>{title}</h2>
      </div>
      {right}
    </div>
  );
}

export function CopyButton({ text }: { text: string }) {
  const { t } = useDocsT();
  return (
    <button
      className="copy"
      onClick={() => navigator.clipboard?.writeText(text)}
      title={t("common.copyCommand")}
    >
      {t("common.copy")}
    </button>
  );
}
