import { useState } from 'react';
import { api } from '../api.js';
import ConfirmModal from './ConfirmModal.jsx';
import { Icon } from './icons.jsx';

// The verdict badge needs the lowercase word for styling (good/risky/loss).
function statusClass(status) {
  return status.toLowerCase();
}

// Turn the stored offer into readable text like "10% off" or "Rs 20 off".
function formatDiscount(offer) {
  return offer.discountType === 'percentage'
    ? `${offer.discountValue}% off`
    : `Rs ${offer.discountValue} off`;
}

// Turn the database date into a friendly Indian date and time.
function formatDate(value) {
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OffersView({ offers, onOffersChange, onToast }) {
  // Which offer (if any) is waiting for the delete confirmation.
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // After YES, really delete: refresh the table, then confirm with a toast.
  async function confirmDelete() {
    setDeleting(true);
    try {
      await api.deleteOffer(pendingDelete.id);
      await onOffersChange();
      onToast('Offer deleted');
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }

  return (
    <section className="panel">
      {/* Panel heading + count pill. */}
      <div className="panel-head">
        <h2>Saved offers</h2>
        <span className="count-pill">{offers.length}</span>
      </div>
      <p className="panel-sub">
        The offers you approved in the Ask AI chat.
      </p>

      {/* Either an empty message or the offers table. */}
      {offers.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">
            <Icon.Tag size={24} />
          </div>
          No offers yet. Ask AI for an idea, then save it from the chat.
        </div>
      ) : (
        <div className="table-wrap">
          <table className="otable">
            <thead>
              <tr>
                <th>Offer</th>
                <th>Audience</th>
                <th>Verdict</th>
                <th>Created</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {/* One row per saved offer. */}
              {offers.map((o) => (
                <tr key={o.id}>
                  <td className="nowrap">
                    <span className="cell-main">{o.product?.name || `#${o.productId}`}</span>{' '}
                    <span className="cell-dim">{formatDiscount(o)}</span>
                  </td>
                  <td>{o.customerGroup?.name || 'All customers'}</td>
                  {/* The colored verdict badge. */}
                  <td>
                    <span className={`badge ${statusClass(o.status)}`}>
                      <span className="dot" />
                      {o.status}
                    </span>
                  </td>
                  <td className="cell-dim nowrap">{formatDate(o.created_at)}</td>
                  {/* Delete opens the yes/no popup; never instant. */}
                  <td className="nowrap">
                    <button
                      className="icon-btn small danger"
                      onClick={() => setPendingDelete(o)}
                      aria-label="Delete offer"
                      title="Delete offer"
                    >
                      <Icon.Trash size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* The YES / NO confirmation popup for deleting. */}
      <ConfirmModal
        open={pendingDelete !== null}
        title="Delete this offer?"
        message={
          <>
            This saved offer for "<strong>{pendingDelete?.product?.name || 'a product'}</strong>"
            will be removed.
          </>
        }
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  );
}