import { useState, useCallback, useEffect } from 'react';
import { api } from './api.js';
import AskAI from './components/AskAI.jsx';
import ProductsView from './components/ProductsView.jsx';
import OffersView from './components/OffersView.jsx';
import { Icon } from './components/icons.jsx';

// A product's margin as a percentage of the selling price.
function marginOf(product) {
  if (!product.sellingPrice) return 0;
  return ((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100;
}

export default function App() {
  // The data lists, the chat drawer flag, backend reachability, toasts.
  const [products, setProducts] = useState([]);
  const [offers, setOffers] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [backendDown, setBackendDown] = useState(false);
  const [toast, setToast] = useState(null);

  // Download the product list. On failure, show the error banner.
  const refreshProducts = useCallback(async () => {
    try {
      setProducts(await api.getProducts());
      setBackendDown(false);
    } catch {
      setBackendDown(true);
    }
  }, []);

  // Download the saved-offer list.
  const refreshOffers = useCallback(async () => {
    try {
      setOffers(await api.getOffers());
    } catch {
      // The banner is already handled by refreshProducts.
    }
  }, []);

  // On first open, fetch both lists.
  useEffect(() => {
    refreshProducts();
    refreshOffers();
  }, [refreshProducts, refreshOffers]);

  // After the owner saves an offer, refresh the offers panel.
  const handleOfferSaved = useCallback(() => {
    refreshOffers();
  }, [refreshOffers]);

  // A tiny popup that disappears by itself after 3 seconds.
  const showToast = useCallback((message) => {
    setToast({ id: Date.now(), message });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Pressing Escape closes the chat drawer.
  useEffect(() => {
    if (!chatOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setChatOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [chatOpen]);

  // Quick numbers for the stat cards.
  const avgMargin =
    products.length > 0
      ? Math.round(products.reduce((sum, p) => sum + marginOf(p), 0) / products.length)
      : null;

  return (
    <div className="app">
      {/* Top bar with the brand */}
      <header className="topbar">
        <div className="brand">
          {/* The gradient logo tile */}
          <div className="brand-logo">
            <Icon.Sparkles size={24} />
          </div>
          <div>
            <h1>Offer Sensei</h1>
            <p>Ask AI whether an offer makes financial sense</p>
          </div>
        </div>
        <span className="topbar-chip">
          <Icon.Sparkles size={15} />
          AI-powered
        </span>
      </header>

      {/* A calm warning when the backend cannot be reached */}
      {backendDown && (
        <div className="error-banner">
          <Icon.Alert size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            The backend is not reachable. Make sure you have run the backend with{' '}
            <code>npm start</code> in the <code>backend</code> folder.
          </span>
        </div>
      )}

      {/* The three quick stat cards */}
      <section className="stats" aria-label="Quick numbers">
        <div className="stat-card">
          <div className="stat-icon brand-tint">
            <Icon.Box size={22} />
          </div>
          <div>
            <div className="stat-label">Products</div>
            <div className="stat-value">{products.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon good-tint">
            <Icon.Tag size={22} />
          </div>
          <div>
            <div className="stat-label">Saved offers</div>
            <div className="stat-value">{offers.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warn-tint">
            <Icon.Trend size={22} />
          </div>
          <div>
            <div className="stat-label">Average margin</div>
            <div className="stat-value">{avgMargin === null ? '—' : `${avgMargin}%`}</div>
          </div>
        </div>
      </section>

      {/* The two panels, side by side on wide screens */}
      <main className="dashboard">
        <ProductsView
          products={products}
          onProductsChange={refreshProducts}
          onToast={showToast}
        />
        <OffersView
          offers={offers}
          onOffersChange={refreshOffers}
          onToast={showToast}
        />
      </main>

      {/* A reminder of the app's core principle */}
      <p className="footer-note">
        The AI understands your words. The backend owns every financial calculation.
      </p>

      {/* Floating "Ask AI" button (bottom-right) */}
      <button className="fab" onClick={() => setChatOpen(true)} aria-label="Ask AI">
        <Icon.Sparkles size={22} />
        Ask AI
      </button>

      {/* The chat drawer + the soft backdrop behind it */}
      <div className={`scrim ${chatOpen ? 'open' : ''}`} onClick={() => setChatOpen(false)} />
      <AskAI
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        products={products}
        onOfferSaved={handleOfferSaved}
        onToast={showToast}
      />

      {/* The toast popup (auto-dismissed) */}
      {toast && (
        <div className="toast show" key={toast.id} role="status">
          <span className="tick">
            <Icon.Check size={12} />
          </span>
          {toast.message}
        </div>
      )}
    </div>
  );
}