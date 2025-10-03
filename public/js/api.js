// API utilities

const API = {
  async request(pathname, options = {}) {
    const headers = options.headers || {};
    headers['Content-Type'] = 'application/json';
    const token = Auth.currentToken && Auth.currentToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(pathname, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  },
  getProducts(params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, v);
    });
    return this.request(`/api/products?${qs.toString()}`);
  },
  getProduct(id) { return this.request(`/api/products/${id}`); },
  getCategories() { return this.request('/api/categories'); },
  post(path, body) { return this.request(path, { method: 'POST', body: JSON.stringify(body) }); },
  createOrder(items, total) { return this.post('/api/orders', { items, total }); },
  myOrders() { return this.request('/api/orders/mine'); },
  // Seller endpoints
  seller: {
    login(email, password) { return API.post('/api/seller/login', { email, password }); },
    register(name, email, password) { return API.post('/api/seller/register', { name, email, password }); },
    listProducts() { return API.request('/api/seller/products'); },
    createProduct(payload) { return API.request('/api/seller/products', { method: 'POST', body: JSON.stringify(payload) }); },
    updateProduct(id, payload) { return API.request(`/api/seller/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }); },
    deleteProduct(id) { return API.request(`/api/seller/products/${id}`, { method: 'DELETE' }); }
  }
};


