// A shared helper: make a request to the backend and give back the answer.
// If the backend returns an error, turn it into a readable error message.
async function request(url, options = {}) {
  // The browser's built-in web request tool.
  const res = await fetch(url, {
    // Tell the backend we are sending JSON.
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  // If the response was not okay, read the error and throw it.
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  // Otherwise turn the JSON answer into a JavaScript object.
  return res.json();
}

// Every way the frontend talks to the backend.
export const api = {
  // Ask the AI about an offer. Sends {prompt}, gets back the analysis.
  askAI: (prompt) => request('/api/ai/ask', { method: 'POST', body: JSON.stringify({ prompt }) }),
  // Get the list of products.
  getProducts: () => request('/api/products'),
  // Add a product (name, selling price, cost price).
  createProduct: (product) => request('/api/products', { method: 'POST', body: JSON.stringify(product) }),
  // Remove a product by its id.
  deleteProduct: (id) => request(`/api/products/${id}`, { method: 'DELETE' }),
  // Get the list of saved offers.
  getOffers: () => request('/api/offers'),
  // Save an offer the owner approved.
  createOffer: (offer) => request('/api/offers', { method: 'POST', body: JSON.stringify(offer) }),
  // Remove a saved offer by its id.
  deleteOffer: (id) => request(`/api/offers/${id}`, { method: 'DELETE' }),
};