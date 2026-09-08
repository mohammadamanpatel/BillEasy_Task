import { Icon } from './icons.jsx';

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Yes, delete',
  busy = false,
  onConfirm,
  onCancel,
}) {
  // When closed, render nothing at all.
  if (!open) return null;

  return (
    <div
      className="modal-scrim"
      onClick={busy ? undefined : onCancel}
      role="presentation"
    >
      {/* The white dialog card. stopPropagation keeps clicks inside it open. */}
      <div
        className="modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* The red warning circle icon. */}
        <div className="modal-icon">
          <Icon.Alert size={28} />
        </div>

        <h3 id="confirm-title">{title}</h3>
        <p>{message}</p>

        {/* Two buttons: NO on the left, YES (red) on the right. */}
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onCancel} disabled={busy}>
            No, keep it
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}