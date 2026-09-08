import { useState } from 'react';
import { api } from '../api.js';
import ConfirmModal from './ConfirmModal.jsx';
import { Icon } from './icons.jsx';

// A product's margin as a share of the selling price.
// 40%+ = healthy (green), 20-39% = okay (blue), below = low (amber).
function marginPct(product) {
  if (!product.sellingPrice) return 0;
  return Math.round(((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100);
}

function marginClass(pct) {
  if (pct >= 40) return 'high';
  if (pct >= 20) return 'mid';
  return 'low';
}

export default function ProductsView({ products, onProductsChange, onToast }) {
  // The form fields, the error message, a "busy" flag, and which
  // product (if any) is waiting for the delete confirmation.
  const [name, setName] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Run when the owner adds a product.
  async function addProduct(e) {
    e.preventDefault(); // stop the page from reloading
    setError('');
    setBusy(true);
    try {
      await api.createProduct({
        name,
        sellingPrice: Number(sellingPrice),
        costPrice: Number(costPrice),
      });
      setName('');
      setSellingPrice('');
      setCostPrice('');
      onProductsChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // After YES, really delete: refresh the tiles, then confirm with a toast.
  async function confirmDelete() {
    setDeleting(true);
    try {
      await api.deleteProduct(pendingDelete.id);
      await onProductsChange();
      onToast(`"${pendingDelete.name}" deleted`);
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }

  return (
    <section className="panel">
      {/* Panel heading + count pill. */}
      <div className="panel-head">
        <h2>Products</h2>
        <span className="count-pill">{products.length}</span>
      </div>
      <p className="panel-sub">
        Enter each product once. The AI finds them from this list — you never type prices twice.
      </p>

      {/* The add-product form: three labeled fields + one button. */}
      <form className="pform" onSubmit={addProduct}>
        <div className="field">
          <label htmlFor="product-name">Product name</label>
          <input
            id="product-name"
            placeholder="e.g. Butter"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="selling-price">Selling price</label>
          <input
            id="selling-price"
            placeholder="e.g. 55"
            type="number"
            min="0"
            step="0.01"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="cost-price">Cost price</label>
          <input
            id="cost-price"
            placeholder="e.g. 45"
            type="number"
            min="0"
            step="0.01"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            required
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          <Icon.Plus size={18} />
          Add
        </button>
      </form>

      {/* Backend errors, if any. */}
      {error && <p className="form-error">{error}</p>}

      {/* Either an empty message or the grid of product cards. */}
      {products.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">
            <Icon.Box size={24} />
          </div>
          No products yet. Add your first product above.
        </div>
      ) : (
        <div className="ptiles">
          {/* One card per product. */}
          {products.map((p) => {
            const margin = marginPct(p);
            return (
              <div key={p.id} className="ptile">
                <div className="ptile-top">
                  <h4 title={p.name}>{p.name}</h4>
                  {/* A colored chip showing margin health. */}
                  <span className={`margin-chip ${marginClass(margin)}`}>{margin}%</span>
                </div>
                <p className="ptile-price">
                  Sells at <strong>Rs {p.sellingPrice}</strong> · costs{' '}
                  <strong>Rs {p.costPrice}</strong>
                </p>
                <div className="ptile-foot">
                  <span className="cell-dim">Cash margin {margin}%</span>
                  {/* Delete opens the yes/no popup; never instant. */}
                  <button
                    className="icon-btn small danger"
                    onClick={() => setPendingDelete(p)}
                    aria-label={`Delete ${p.name}`}
                    title="Delete product"
                  >
                    <Icon.Trash size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* The YES / NO confirmation popup for deleting. */}
      <ConfirmModal
        open={pendingDelete !== null}
        title="Delete this product?"
        message={
          <>
            "<strong>{pendingDelete?.name}</strong>" will be removed. You can always add it
            again.
          </>
        }
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  );
}