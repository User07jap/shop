// Simple client state management for auth and cart using localStorage

const Storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key) {
    localStorage.removeItem(key);
  }
};

const Auth = {
  tokenKey: 'auth_token',
  userKey: 'auth_user',
  currentToken() { return Storage.get(this.tokenKey, null); },
  currentUser() { return Storage.get(this.userKey, null); },
  isLoggedIn() { return !!this.currentToken(); },
  async login(email, password) {
    const res = await API.post('/api/auth/login', { email, password });
    Storage.set(this.tokenKey, res.token);
    Storage.set(this.userKey, res.user);
    return res.user;
  },
  async register(name, email, password) {
    const res = await API.post('/api/auth/register', { name, email, password });
    Storage.set(this.tokenKey, res.token);
    Storage.set(this.userKey, res.user);
    return res.user;
  },
  logout() { Storage.remove(this.tokenKey); Storage.remove(this.userKey); },
  openAuthModal() { AppUI.openAuthModal(); }
};

const Cart = {
  key: 'cart_items',
  items() { return Storage.get(this.key, []); },
  setItems(items) { Storage.set(this.key, items); },
  add(productId, delta = 1) {
    const items = this.items();
    const existing = items.find(i => i.productId === productId);
    if (existing) { existing.qty = Math.max(0, existing.qty + delta); }
    else if (delta > 0) { items.push({ productId, qty: delta }); }
    const filtered = items.filter(i => i.qty > 0);
    this.setItems(filtered);
  },
  remove(productId) { this.setItems(this.items().filter(i => i.productId !== productId)); },
  clear() { this.setItems([]); },
  async withDetails() {
    const items = this.items();
    if (!items.length) return [];
    const ids = items.map(i => i.productId);
    const all = await API.getProducts({ pageSize: 1000 });
    return items.map(i => ({ ...i, product: all.items.find(p => p.id === i.productId) })).filter(x => x.product);
  },
  computeTotals() {
    const items = Storage.get(this.key, []);
    const priceMap = Storage.get('price_cache', {});
    const subtotal = items.reduce((sum, i) => sum + (priceMap[i.productId] || 0) * i.qty, 0);
    const roundedSubtotal = Math.round(subtotal);
    const discount = Math.round(roundedSubtotal * 0.2);
    const delivery = items.length ? 15 : 0;
    const total = Math.max(0, roundedSubtotal - discount + delivery);
    return { subtotal: roundedSubtotal, discount, delivery, total };
  }
};


