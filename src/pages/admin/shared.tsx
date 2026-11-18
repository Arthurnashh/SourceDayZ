import type { ReactNode } from "react";
import { initials } from "../../lib/accounts";

export type AdminTab =
  | "visao"
  | "contas"
  | "servidores"
  | "pedidos"
  | "gateway"
  | "ajustes"
  | "historico";

export type NoticeTone = "ok" | "bad" | "warn";
export interface AdminNotice {
  tone: NoticeTone;
  text: string;
}

export function NoticeBar({
  notice,
  onClose,
}: {
  notice: AdminNotice;
  onClose: () => void;
}) {
  return (
    <div className={`acc-notice ${notice.tone} adm-notice`} role="status">
      <span>{notice.text}</span>
      <button type="button" onClick={onClose} aria-label="Fechar aviso">
        ×
      </button>
    </div>
  );
}

const SERVER_LABEL: Record<string, string> = {
  em_analise: "em análise",
  ativo: "ativo",
  pausado: "pausado",
  encerrado: "encerrado",
  aguardando: "aguardando",
  pago: "pago",
  cancelado: "cancelado",
  revogado: "revogado",
};

const TONE: Record<string, string> = {
  em_analise: "warn",
  aguardando: "warn",
  ativo: "ok",
  pago: "ok",
  pausado: "warn",
  encerrado: "dim",
  cancelado: "dim",
  revogado: "dim",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span className={`adm-pill ${TONE[status] ?? "dim"}`}>
      {SERVER_LABEL[status] ?? status}
    </span>
  );
}

export function Metric({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: "lime" | "blue" | "amber" | "red";
}) {
  return (
    <div className={`adm-metric ${tone ?? ""}`}>
      <span className="adm-metric-label">{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="adm-empty">{children}</div>;
}

export function Avatar({
  name,
  src,
  size = 34,
}: {
  name: string;
  src: string | null;
  size?: number;
}) {
  return (
    <span className="adm-avatar" style={{ width: size, height: size }}>
      {src ? (
        <img
          src={src}
          alt=""
          referrerPolicy="no-referrer"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
    </span>
  );
}

export function SectionHead({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="adm-section-head">
      <div>
        <p className="sd-eyebrow">administração</p>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="adm-section-actions">{actions}</div>}
    </div>
  );
}
