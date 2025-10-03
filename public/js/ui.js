// UI helpers for rendering components

const AppUI = {
  mountAuth(selector) {
    const el = document.querySelector(selector);
    const user = Auth.currentUser();
    if (!el) return;
    if (user) {
      el.innerHTML = `
        <a href="/E-commerce-website-main/e-commerce website/public/account.html" class="btn" style="background:#333">Dashboard</a>
        <span>Hello, ${user.name}</span>
        <button class="btn" id="btn-logout">Logout</button>
      `;
      el.querySelector('#btn-logout').addEventListener('click', () => {
        Auth.logout();
        location.reload();
      });
    } else {
      el.innerHTML = `<button class="btn" id="btn-login">Sign In</button>`;
      el.querySelector('#btn-login').addEventListener('click', () => Auth.openAuthModal());
    }
  },
  mountCartCount(selector) {
    const el = document.querySelector(selector);
    if (!el) return;
    const items = Cart.items();
    el.textContent = items.reduce((s, i) => s + i.qty, 0);
  },
  renderProductGrid(selector, products) {
    const el = document.querySelector(selector);
    const cache = {};
    el.innerHTML = products.map(p => {
      cache[p.id] = p.price;
      return `
        <div class="product-card">
          <img src="${p.image}" alt="${p.title}" />
          <div class="p-body">
            <div class="title">${p.title}</div>
            <div class="muted">${p.rating.toFixed(1)}/5</div>
            <div class="price">$${p.price}</div>
            <button class="btn" data-id="${p.id}">Add to Cart</button>
          </div>
        </div>`;
    }).join('');
    // cache prices for totals calculation without refetching
    Storage.set('price_cache', cache);
    el.querySelectorAll('button[data-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        Cart.add(id, 1);
        this.mountCartCount('#nav-cart-count');
      });
    });
  },
  renderPagination(selector, page, pages, onGo) {
    const el = document.querySelector(selector);
    if (!el) return;
    if (pages <= 1) { el.innerHTML = ''; return; }
    let html = '';
    html += `<button ${page===1?'disabled':''} data-goto="${page-1}">Prev</button>`;
    for (let p = 1; p <= pages; p++) {
      html += `<button ${p===page?'style=\"font-weight:700\"':''} data-goto="${p}">${p}</button>`;
    }
    html += `<button ${page===pages?'disabled':''} data-goto="${page+1}">Next</button>`;
    el.innerHTML = html;
    el.querySelectorAll('button[data-goto]').forEach(b => {
      b.addEventListener('click', () => onGo(Number(b.getAttribute('data-goto'))));
    });
  },
  populateSelect(selector, options) {
    const el = document.querySelector(selector);
    el.innerHTML = options.map(v => `<option value="${v}">${v || 'All'}</option>`).join('');
  },
  async renderCart(selector, handlers){
    const el = document.querySelector(selector);
    const items = await Cart.withDetails();
    const priceCache = {};
    el.innerHTML = items.map(({ product, qty }) => {
      priceCache[product.id] = product.price;
      return `
        <div class="cart-item">
          <img src="${product.image}" alt="${product.title}">
          <div>
            <div class="title">${product.title}</div>
            <div class="muted">$${product.price}</div>
            <div class="qty">
              <button data-dec="${product.id}">−</button>
              <span>${qty}</span>
              <button data-inc="${product.id}">+</button>
              <button data-rem="${product.id}" style="margin-left:auto">🗑</button>
            </div>
          </div>
          <div class="price">$${product.price * qty}</div>
        </div>`;
    }).join('') || '<p>Your cart is empty.</p>';
    Storage.set('price_cache', priceCache);
    el.querySelectorAll('button[data-inc]').forEach(b => b.addEventListener('click', () => handlers.onIncrease(b.getAttribute('data-inc'))));
    el.querySelectorAll('button[data-dec]').forEach(b => b.addEventListener('click', () => handlers.onDecrease(b.getAttribute('data-dec'))));
    el.querySelectorAll('button[data-rem]').forEach(b => b.addEventListener('click', () => handlers.onRemove(b.getAttribute('data-rem'))));
  },
  openAuthModal() {
    let backdrop = document.querySelector('#auth-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop';
      backdrop.id = 'auth-backdrop';
      backdrop.innerHTML = `
        <div class="modal">
          <h3>Welcome</h3>
          <div class="tabs">
            <button id="tab-login" class="btn">Login</button>
            <button id="tab-register" class="btn" style="background:#555">Register</button>
          </div>
          <form id="form-login">
            <input id="login-email" type="email" placeholder="Email" required />
            <input id="login-password" type="password" placeholder="Password" required />
            <button class="btn" type="submit">Login</button>
          </form>
          <form id="form-register" class="hidden">
            <input id="reg-name" placeholder="Name" required />
            <input id="reg-email" type="email" placeholder="Email" required />
            <input id="reg-password" type="password" placeholder="Password" required />
            <button class="btn" type="submit">Create Account</button>
          </form>
        </div>`;
      document.body.appendChild(backdrop);
      backdrop.addEventListener('click', (e) => { if (e.target === backdrop) backdrop.style.display='none'; });
      const show = (type) => {
        document.getElementById('form-login').classList.toggle('hidden', type !== 'login');
        document.getElementById('form-register').classList.toggle('hidden', type !== 'register');
      };
      document.getElementById('tab-login').addEventListener('click', () => show('login'));
      document.getElementById('tab-register').addEventListener('click', () => show('register'));
      document.getElementById('form-login').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          await Auth.login(document.getElementById('login-email').value, document.getElementById('login-password').value);
          backdrop.style.display='none';
          AppUI.mountAuth('#nav-auth');
        } catch (err) { alert(err.message); }
      });
      document.getElementById('form-register').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          await Auth.register(
            document.getElementById('reg-name').value,
            document.getElementById('reg-email').value,
            document.getElementById('reg-password').value
          );
          backdrop.style.display='none';
          AppUI.mountAuth('#nav-auth');
        } catch (err) { alert(err.message); }
      });
    }
    backdrop.style.display = 'flex';
  }
};


