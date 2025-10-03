/*
  Simple Ecommerce backend using Node.js (Express) and JWT authentication.
  Data persisted to JSON files in ./data for demo purposes.
*/

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const SELLERS_FILE = path.join(DATA_DIR, 'sellers.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, 'utf8');
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.error('Failed reading JSON', filePath, err);
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Seed products if missing
if (!fs.existsSync(PRODUCTS_FILE)) {
  const seedProducts = require('./seed/products');
  writeJson(PRODUCTS_FILE, seedProducts);
}
if (!fs.existsSync(SELLERS_FILE)) {
  writeJson(SELLERS_FILE, []);
}

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend
app.use('/', express.static(path.join(__dirname, 'public')));
// Support absolute links like "/E-commerce-website-main/e-commerce website/public/..."
app.use('/E-commerce-website-main/e-commerce website/public', express.static(path.join(__dirname, 'public')));
// Also support encoded space variant
app.use('/E-commerce-website-main/e-commerce%20website/public', express.static(path.join(__dirname, 'public')));

// Auth helpers
function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function authRequired(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Missing token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function sellerRequired(req, res, next) {
  authRequired(req, res, () => {
    if (req.user && req.user.role === 'seller') return next();
    return res.status(403).json({ message: 'Seller access required' });
  });
}

function adminRequired(req, res, next) {
  authRequired(req, res, () => {
    if (req.user && req.user.role === 'admin') return next();
    return res.status(403).json({ message: 'Admin access required' });
  });
}

function toOutputProduct(product) {
  const discountPercent = Number(product.discountPercent || 0);
  const basePrice = Number(product.price || 0);
  const effective = Math.round(basePrice * (100 - discountPercent) / 100);
  return {
    ...product,
    price: effective,
    origPrice: basePrice,
    discountPercent
  };
}

// Routes: Auth
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }
  const users = readJson(USERS_FILE, []);
  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) return res.status(409).json({ message: 'Email already registered' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = { id: randomUUID(), name, email: email.toLowerCase(), passwordHash, role: role === 'seller' ? 'seller' : 'customer', createdAt: new Date().toISOString() };
  users.push(user);
  writeJson(USERS_FILE, users);
  const token = createToken({ id: user.id, email: user.email, name: user.name, role: user.role });
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const users = readJson(USERS_FILE, []);
  const user = users.find(u => u.email.toLowerCase() === String(email || '').toLowerCase());
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const ok = await bcrypt.compare(password || '', user.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
  const token = createToken({ id: user.id, email: user.email, name: user.name, role: user.role || 'customer' });
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role || 'customer' } });
});

app.get('/api/auth/me', authRequired, (req, res) => {
  const users = readJson(USERS_FILE, []);
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role || 'customer' } });
});

// Seller specific auth
app.post('/api/seller/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
  const users = readJson(USERS_FILE, []);
  const existing = users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (existing) return res.status(409).json({ message: 'Email already registered' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = { id: randomUUID(), name, email: String(email).toLowerCase(), passwordHash, role: 'seller', createdAt: new Date().toISOString() };
  users.push(user);
  writeJson(USERS_FILE, users);
  const sellers = readJson(SELLERS_FILE, []);
  sellers.push({ id: user.id, email: user.email, name: user.name, createdAt: user.createdAt });
  writeJson(SELLERS_FILE, sellers);
  const token = createToken({ id: user.id, email: user.email, name: user.name, role: 'seller' });
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: 'seller' } });
});

app.post('/api/seller/login', async (req, res) => {
  const { email, password } = req.body || {};
  const users = readJson(USERS_FILE, []);
  const user = users.find(u => u.email.toLowerCase() === String(email || '').toLowerCase());
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const ok = await bcrypt.compare(password || '', user.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
  if ((user.role || 'customer') !== 'seller') return res.status(403).json({ message: 'Not a seller account' });
  // Ensure seller profile exists
  const sellers = readJson(SELLERS_FILE, []);
  if (!sellers.find(s => s.id === user.id)) {
    sellers.push({ id: user.id, email: user.email, name: user.name, createdAt: new Date().toISOString() });
    writeJson(SELLERS_FILE, sellers);
  }
  const token = createToken({ id: user.id, email: user.email, name: user.name, role: 'seller' });
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: 'seller' } });
});

// Admin specific auth
app.post('/api/admin/register', async (req, res) => {
  const { name, email, password, adminKey } = req.body || {};
  if (!name || !email || !password || !adminKey) {
    return res.status(400).json({ message: 'Name, email, password and admin key are required' });
  }
  // Simple admin key check - in production, use environment variable
  if (adminKey !== 'japhet098') {
    return res.status(403).json({ message: 'Invalid admin key' });
  }
  const users = readJson(USERS_FILE, []);
  const existing = users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (existing) return res.status(409).json({ message: 'Email already registered' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = { 
    id: randomUUID(), 
    name, 
    email: String(email).toLowerCase(), 
    passwordHash, 
    role: 'admin', 
    createdAt: new Date().toISOString() 
  };
  users.push(user);
  writeJson(USERS_FILE, users);
  const token = createToken({ id: user.id, email: user.email, name: user.name, role: 'admin' });
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: 'admin' } });
});

app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body || {};
  const users = readJson(USERS_FILE, []);
  const user = users.find(u => u.email.toLowerCase() === String(email || '').toLowerCase());
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const ok = await bcrypt.compare(password || '', user.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
  if ((user.role || 'customer') !== 'admin') return res.status(403).json({ message: 'Not an admin account' });
  const token = createToken({ id: user.id, email: user.email, name: user.name, role: 'admin' });
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: 'admin' } });
});

// Routes: Products
app.get('/api/products', (req, res) => {
  const { q, category, style, color, size, priceMin, priceMax, sort, page = 1, pageSize = 12 } = req.query;
  const products = readJson(PRODUCTS_FILE, []);
  // Only show approved products to customers
  let filtered = products.filter(p => p.status === 'approved');
  if (q) {
    const term = String(q).toLowerCase();
    filtered = filtered.filter(p => p.title.toLowerCase().includes(term) || p.description.toLowerCase().includes(term));
  }
  if (category) filtered = filtered.filter(p => p.category === category);
  if (style) filtered = filtered.filter(p => p.style === style);
  if (color) filtered = filtered.filter(p => p.colors.includes(color));
  if (size) filtered = filtered.filter(p => p.sizes.includes(size));
  // Apply discount for filtering by price; use effective price
  const min = priceMin ? Number(priceMin) : 0;
  const max = priceMax ? Number(priceMax) : Number.POSITIVE_INFINITY;
  filtered = filtered.filter(p => {
    const eff = Math.round(Number(p.price || 0) * (100 - Number(p.discountPercent || 0)) / 100);
    return eff >= min && eff <= max;
  });

  if (sort === 'price-asc') filtered.sort((a, b) => (a.price * (100 - (a.discountPercent||0))) - (b.price * (100 - (b.discountPercent||0))));
  if (sort === 'price-desc') filtered.sort((a, b) => (b.price * (100 - (b.discountPercent||0))) - (a.price * (100 - (a.discountPercent||0))));
  if (sort === 'rating-desc') filtered.sort((a, b) => b.rating - a.rating);

  const total = filtered.length;
  const pageNum = Number(page) || 1;
  const sizeNum = Number(pageSize) || 12;
  const start = (pageNum - 1) * sizeNum;
  const items = filtered.slice(start, start + sizeNum).map(toOutputProduct);
  return res.json({ items, total, page: pageNum, pageSize: sizeNum });
});

app.get('/api/products/:id', (req, res) => {
  const products = readJson(PRODUCTS_FILE, []);
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ message: 'Not found' });
  // Only show approved products to customers
  if (product.status !== 'approved') return res.status(404).json({ message: 'Not found' });
  return res.json({ product: toOutputProduct(product) });
});

// Routes: Orders
app.post('/api/orders', authRequired, (req, res) => {
  const { items, total, address } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Cart is empty' });
  }
  const orders = readJson(ORDERS_FILE, []);
  const order = {
    id: randomUUID(),
    userId: req.user.id,
    items,
    total,
    address: address || null,
    createdAt: new Date().toISOString()
  };
  orders.push(order);
  writeJson(ORDERS_FILE, orders);
  res.json({ order });
});

// Get current user's orders
app.get('/api/orders/mine', authRequired, (req, res) => {
  const orders = readJson(ORDERS_FILE, []);
  const mine = orders
    .filter(o => o.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ items: mine });
});

// Categories endpoint
app.get('/api/categories', (req, res) => {
  const products = readJson(PRODUCTS_FILE, []);
  const categories = Array.from(new Set(products.map(p => p.category))).sort();
  const styles = Array.from(new Set(products.map(p => p.style))).sort();
  res.json({ categories, styles });
});

// Seller product management
app.get('/api/seller/products', sellerRequired, (req, res) => {
  const products = readJson(PRODUCTS_FILE, []);
  const mine = products.filter(p => p.sellerId === req.user.id).map(toOutputProduct);
  res.json({ items: mine });
});

app.post('/api/seller/products', sellerRequired, (req, res) => {
  const {
    title, description = '', price, category = '', style = '', colors = [], sizes = [], image = '/assets/placeholder.svg', thumbnails = []
  } = req.body || {};
  if (!title || price === undefined) return res.status(400).json({ message: 'Title and price are required' });
  const products = readJson(PRODUCTS_FILE, []);
  const product = {
    id: randomUUID(),
    title,
    description,
    price: Number(price),
    rating: 0,
    category,
    style,
    colors: Array.isArray(colors) ? colors : [],
    sizes: Array.isArray(sizes) ? sizes : [],
    image,
    thumbnails: Array.isArray(thumbnails) ? thumbnails : [],
    discountPercent: 0,
    sellerId: req.user.id,
    status: 'pending', // Products require admin approval
    createdAt: new Date().toISOString()
  };
  products.push(product);
  writeJson(PRODUCTS_FILE, products);
  res.json({ product: toOutputProduct(product) });
});

app.put('/api/seller/products/:id', sellerRequired, (req, res) => {
  const products = readJson(PRODUCTS_FILE, []);
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Not found' });
  const existing = products[idx];
  if (existing.sellerId && existing.sellerId !== req.user.id) return res.status(403).json({ message: 'Not your product' });
  const allowed = ['title', 'description', 'price', 'category', 'style', 'colors', 'sizes', 'image', 'thumbnails', 'discountPercent'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) existing[key] = key === 'price' || key === 'discountPercent' ? Number(req.body[key]) : req.body[key];
  }
  products[idx] = existing;
  writeJson(PRODUCTS_FILE, products);
  res.json({ product: toOutputProduct(existing) });
});

app.delete('/api/seller/products/:id', sellerRequired, (req, res) => {
  const products = readJson(PRODUCTS_FILE, []);
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Not found' });
  const existing = products[idx];
  if (existing.sellerId && existing.sellerId !== req.user.id) return res.status(403).json({ message: 'Not your product' });
  const removed = products.splice(idx, 1)[0];
  writeJson(PRODUCTS_FILE, products);
  res.json({ product: toOutputProduct(removed) });
});

// Admin product management
app.get('/api/admin/products/pending', adminRequired, (req, res) => {
  const products = readJson(PRODUCTS_FILE, []);
  const pendingProducts = products.filter(p => p.status === 'pending');
  res.json({ items: pendingProducts.map(toOutputProduct) });
});

app.put('/api/admin/products/:id/approve', adminRequired, (req, res) => {
  const products = readJson(PRODUCTS_FILE, []);
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Product not found' });
  
  products[idx].status = 'approved';
  products[idx].approvedAt = new Date().toISOString();
  products[idx].approvedBy = req.user.id;
  
  writeJson(PRODUCTS_FILE, products);
  res.json({ product: toOutputProduct(products[idx]) });
});

app.put('/api/admin/products/:id/reject', adminRequired, (req, res) => {
  const { reason } = req.body || {};
  const products = readJson(PRODUCTS_FILE, []);
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Product not found' });
  
  products[idx].status = 'rejected';
  products[idx].rejectedAt = new Date().toISOString();
  products[idx].rejectedBy = req.user.id;
  products[idx].rejectionReason = reason || 'No reason provided';
  
  writeJson(PRODUCTS_FILE, products);
  res.json({ product: toOutputProduct(products[idx]) });
});

app.get('/api/admin/products', adminRequired, (req, res) => {
  const { status, page = 1, pageSize = 20 } = req.query;
  const products = readJson(PRODUCTS_FILE, []);
  let filtered = products.slice();
  
  if (status) {
    filtered = filtered.filter(p => p.status === status);
  }
  
  const total = filtered.length;
  const pageNum = Number(page) || 1;
  const sizeNum = Number(pageSize) || 20;
  const start = (pageNum - 1) * sizeNum;
  const items = filtered.slice(start, start + sizeNum).map(toOutputProduct);
  
  res.json({ items, total, page: pageNum, pageSize: sizeNum });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
