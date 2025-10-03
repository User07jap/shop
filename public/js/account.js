// Account dashboard script

(async function initAccount(){
  document.getElementById('year').textContent = new Date().getFullYear();
  AppUI.mountCartCount('#nav-cart-count');

  const user = Auth.currentUser();
  if (!user) {
    AppUI.mountAuth('#nav-auth');
    alert('Please sign in to view your dashboard.');
    location.href = '/E-commerce-website-main/e-commerce website/public/index.html';
    return;
  }
  AppUI.mountAuth('#nav-auth');

  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) logoutBtn.addEventListener('click', () => { Auth.logout(); location.href = '/E-commerce-website-main/e-commerce website/public/index.html'; });

  // Render profile
  const profile = document.getElementById('profile');
  profile.innerHTML = `
    <div class="flex between center">
      <div>
        <div style="font-weight:700">${user.name}</div>
        <div class="muted">${user.email}</div>
        <div class="muted">Role: ${user.role || 'customer'}</div>
      </div>
      <div>
        <a class="btn" href="/products.html">Shop more</a>
      </div>
    </div>
  `;

  // Fetch orders
  try {
    const { items } = await API.myOrders();
    renderOrders(items || []);
  } catch (err) {
    document.getElementById('orders').innerHTML = `<p class="danger">${err.message}</p>`;
  }

  function renderOrders(orders){
    const el = document.getElementById('orders');
    if (!orders.length) { el.innerHTML = '<p>No orders yet.</p>'; return; }
    el.innerHTML = orders.map(o => {
      const itemsHtml = (o.items || []).map(i => {
        const qty = i.qty || i.quantity || 1;
        const title = (i.product && i.product.title) || i.title || i.productId;
        const price = i.price || 0;
        return `<div>• ${title} × ${qty} - $${price * qty}</div>`;
      }).join('');
      return `
        <div class="order">
          <div class="row">
            <div>
              <div><strong>Order #${o.id}</strong></div>
              <div class="muted">${new Date(o.createdAt).toLocaleString()}</div>
            </div>
            <div><strong>Total: $${o.total}</strong></div>
          </div>
          <div class="items">${itemsHtml}</div>
        </div>
      `;
    }).join('');
  }
})();


