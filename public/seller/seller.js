// Seller dashboard logic

(function(){
  AppUI.mountAuth('#nav-auth');
  AppUI.mountCartCount('#nav-cart-count');

  const listEl = document.getElementById('list');
  const formWrap = document.getElementById('form-wrap');
  const form = document.getElementById('product-form');
  const formTitle = document.getElementById('form-title');
  const btnNew = document.getElementById('btn-new');

  let editingId = null;

  function ensureSeller(){
    const user = Auth.currentUser();
    if (!user) { alert('Please login as seller.'); return false; }
    if ((user.role||'customer') !== 'seller') { alert('Seller account required. Register as seller.'); return false; }
    return true;
  }

  async function load(){
    try {
      if (!ensureSeller()) return;
      const res = await API.seller.listProducts();
      renderList(res.items || []);
    } catch (e) {
      console.error(e);
      alert(e.message);
    }
  }

  function renderList(items){
    if (!items.length) { listEl.innerHTML = '<p class="muted">No products yet. Create one.</p>'; return; }
    listEl.innerHTML = items.map(p => `
      <div class="seller-card">
        <img src="${p.image}" alt="${p.title}" />
        <div style="flex:1">
          <div style="font-weight:700">${p.title}</div>
          <div class="muted">${p.category || ''} ${p.style ? '• '+p.style : ''}</div>
          <div class="flex gap-sm center" style="margin-top:6px">
            <span>Price: $${p.price}</span>
            ${p.discountPercent?`<span class="muted">(${p.discountPercent}% off, was $${p.origPrice})</span>`:''}
          </div>
          <div class="flex gap-sm" style="margin-top:8px">
            <button class="btn small" data-edit="${p.id}">Edit</button>
            <button class="btn small" style="background:#e11d48" data-del="${p.id}">Delete</button>
          </div>
        </div>
      </div>
    `).join('');
    listEl.querySelectorAll('button[data-edit]').forEach(b => b.addEventListener('click', () => onEdit(b.getAttribute('data-edit'), items)));
    listEl.querySelectorAll('button[data-del]').forEach(b => b.addEventListener('click', () => onDelete(b.getAttribute('data-del'))));
  }

  function openForm(mode, data){
    form.reset();
    formWrap.classList.remove('hidden');
    formTitle.textContent = mode === 'edit' ? 'Edit Product' : 'Create Product';
    if (mode === 'edit' && data){
      form.title.value = data.title || '';
      form.price.value = data.origPrice != null ? data.origPrice : data.price || 0;
      form.description.value = data.description || '';
      form.category.value = data.category || '';
      form.style.value = data.style || '';
      form.colors.value = (data.colors||[]).join(', ');
      form.sizes.value = (data.sizes||[]).join(', ');
      form.image.value = data.image || '';
      form.discountPercent.value = data.discountPercent || 0;
    }
  }

  btnNew.addEventListener('click', () => { editingId = null; if (!ensureSeller()) return; openForm('create'); });
  document.getElementById('btn-cancel').addEventListener('click', () => { formWrap.classList.add('hidden'); });

  async function onEdit(id, items){
    const data = items.find(x => x.id === id);
    editingId = id;
    openForm('edit', data);
  }

  async function onDelete(id){
    if (!ensureSeller()) return;
    if (!confirm('Delete this product?')) return;
    try { await API.seller.deleteProduct(id); await load(); } catch(e){ alert(e.message); }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!ensureSeller()) return;
    const payload = {
      title: form.title.value.trim(),
      price: Number(form.price.value || 0),
      description: form.description.value.trim(),
      category: form.category.value.trim(),
      style: form.style.value.trim(),
      colors: form.colors.value.split(',').map(s=>s.trim()).filter(Boolean),
      sizes: form.sizes.value.split(',').map(s=>s.trim()).filter(Boolean),
      image: form.image.value.trim() || '/assets/placeholder.svg',
      discountPercent: Number(form.discountPercent.value || 0)
    };
    try{
      if (editingId) await API.seller.updateProduct(editingId, payload);
      else await API.seller.createProduct(payload);
      formWrap.classList.add('hidden');
      await load();
    }catch(err){ alert(err.message); }
  });

  // Seller auth buttons
  document.getElementById('btn-seller-login').addEventListener('click', () => AppUI.openAuthModal());
  const getSellerBackdrop = () => document.getElementById('seller-register-backdrop');
  const getSellerForm = () => document.getElementById('seller-register-form');
  document.getElementById('btn-seller-register').addEventListener('click', () => SellerAuth.openRegisterModal());
  document.addEventListener('click', (e) => {
    const backdrop = getSellerBackdrop();
    if (backdrop && e.target === backdrop) backdrop.style.display = 'none';
  });
  getSellerForm().addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('seller-name').value.trim();
    const email = document.getElementById('seller-email').value.trim();
    const password = document.getElementById('seller-password').value;
    try {
      await SellerAuth.register(name, email, password);
      alert('Seller account created successfully. Please log in.');
      SellerAuth.closeRegisterModal();
      Auth.logout();
      AppUI.openAuthModal();
    } catch(e){ alert(e.message); }
  });

  // Initial
  if (Auth.currentUser() && (Auth.currentUser().role||'customer') === 'seller') load();
})();


