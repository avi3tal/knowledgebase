import { useEffect } from "react";

/** In-page modal confirmation (never window.confirm). Esc cancels, Enter confirms. */
export function ConfirmDialog({
  title,
  children,
  yes,
  no = "Cancel",
  danger = false,
  onYes,
  onNo,
}: {
  title: string;
  children?: React.ReactNode;
  yes: string;
  no?: string;
  danger?: boolean;
  onYes: () => void;
  onNo: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onNo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNo]);
  return (
    <div className="modal-backdrop" onClick={onNo}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{title}</h3>
        {children}
        <div className="modal-actions">
          <button onClick={onNo}>{no}</button>
          <button className={danger ? "danger solid" : "primary"} onClick={onYes} autoFocus>
            {yes}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Small inline "are you sure?" bar, for row-level confirmations. */
export function ConfirmBar({
  text,
  yes,
  danger = false,
  onYes,
  onNo,
}: {
  text: string;
  yes: string;
  danger?: boolean;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <span className="confirm-bar" role="alertdialog">
      <span>{text}</span>
      <button className={danger ? "danger solid" : "primary"} onClick={onYes}>
        {yes}
      </button>
      <button onClick={onNo}>Cancel</button>
    </span>
  );
}
