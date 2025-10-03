// Dedicated helper for seller auth UX

const SellerAuth = {
  openRegisterModal() {
    const backdrop = document.getElementById('seller-register-backdrop');
    if (backdrop) backdrop.style.display = 'flex';
  },
  closeRegisterModal() {
    const backdrop = document.getElementById('seller-register-backdrop');
    if (backdrop) backdrop.style.display = 'none';
  },
  async register(name, email, password) {
    // Do not auto-login; require explicit login after registration
    const res = await API.seller.register(name, email, password);
    return res.user;
  },
  async login(email, password) {
    const res = await API.seller.login(email, password);
    Storage.set(Auth.tokenKey, res.token);
    Storage.set(Auth.userKey, res.user);
    return res.user;
  }
};


