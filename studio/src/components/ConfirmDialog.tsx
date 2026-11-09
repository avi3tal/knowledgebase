import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "../theme/primitives";
import * as S from "./ConfirmDialog.style";

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
  // Portal: the page content keeps a transform from its entry animation, which would
  // otherwise make this fixed overlay position relative to <main>.
  return createPortal(
    <S.Backdrop onClick={onNo}>
      <S.Modal
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{title}</h3>
        {children}
        <S.Actions>
          <Button onClick={onNo}>{no}</Button>
          <Button $variant={danger ? "dangerSolid" : "primary"} onClick={onYes} autoFocus>
            {yes}
          </Button>
        </S.Actions>
      </S.Modal>
    </S.Backdrop>,
    document.body,
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
    <S.Bar role="alertdialog">
      <span>{text}</span>
      <Button $size="sm" $variant={danger ? "dangerSolid" : "primary"} onClick={onYes}>
        {yes}
      </Button>
      <Button $size="sm" onClick={onNo}>
        Cancel
      </Button>
    </S.Bar>
  );
}
