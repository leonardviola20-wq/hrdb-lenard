
function setupMenuBook() {
  const book = document.getElementById('menuBook');
  if (!book) return;
  const prev = document.querySelector('.menu-nav.prev');
  const next = document.querySelector('.menu-nav.next');
  const scrollByPage = (dir) => { book.scrollBy({ left: dir * book.clientWidth, behavior: 'smooth' }); };
  if (prev) prev.addEventListener('click', () => scrollByPage(-1));
  if (next) next.addEventListener('click', () => scrollByPage(1));
}
const state = { menu: null, branches: null, activeCat: null, search: '' };

async function loadJSON(path) {
  const res = await fetch(path);
  return res.json();
}

function money(n, cur) { return cur + n.toLocaleString(); }

function renderSignature() {
  const grid = document.getElementById('signatureGrid');
  if (!grid || !state.menu) return;
  const sig = state.menu.categories.find(c => c.name === 'Signature Dishes');
  if (!sig) { const sec = document.getElementById('signature'); if (sec) sec.style.display = 'none'; return; }
  grid.innerHTML = sig.items.map(i => `
    <div class="sig-card">
      <h3>${i.name}</h3>
      <p>${i.desc}</p>
      <div class="price">${money(i.price, state.menu.currency)}</div>
    </div>
  `).join('');
}

function renderMenuTabs() {
  const tabs = document.getElementById('menuTabs');
  if (!tabs) return;
  tabs.innerHTML = state.menu.categories.map(c => `
    <button class="menu-tab" data-cat="${c.name}">${c.name}</button>
  `).join('');
  tabs.querySelectorAll('.menu-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeCat = btn.dataset.cat;
      state.search = '';
      document.getElementById('menuSearch').value = '';
      renderMenu();
      updateTabs();
    });
  });
  // default active = first
  state.activeCat = state.menu.categories[0].name;
  updateTabs();
}

function updateTabs() {
  document.querySelectorAll('.menu-tab').forEach(b => {
    b.classList.toggle('active', b.dataset.cat === state.activeCat);
  });
}

function renderMenu() {
  const content = document.getElementById('menuContent');
  if (!content) return;
  const q = state.search.toLowerCase();
  let cats = state.menu.categories;
  if (state.activeCat) cats = cats.filter(c => c.name === state.activeCat);
  content.innerHTML = cats.map(c => {
    const items = c.items.filter(i => !q || i.name.toLowerCase().includes(q) || (i.desc||'').toLowerCase().includes(q));
    if (!items.length) return '';
    return `<div class="menu-category">
      <h3>${c.name}</h3>
      ${items.map(i => `
        <div class="menu-item">
          <div>
            <div class="name">${i.name}</div>
            <div class="desc">${i.desc || ''}</div>
          </div>
          <div class="price">${money(i.price, state.menu.currency)}</div>
        </div>
      `).join('')}
    </div>`;
  }).join('');
}

function renderBranches() {
  const grid = document.getElementById('branchGrid');
  const sel = document.getElementById('branchSelect');
  if (!grid) return;
  grid.innerHTML = state.branches.map(b => `
    <div class="branch-card">
      <h3>${b.name}</h3>
      <p>${b.address}</p>
      <p class="phone"><a href="tel:${b.phone.replace(/[^0-9+]/g,'')}">${b.phone}</a></p>
      <p>${b.hours}</p>
      <a class="dir" href="${b.map}" target="_blank" rel="noopener">Get Directions &rarr;</a>
    </div>
  `).join('');
  if (sel) {
    sel.innerHTML = state.branches.map(b => `<option value="${b.name}">${b.name}</option>`).join('');
  }
}

function setupNav() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.getElementById('navLinks');
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
}

function setupSearch() {
  const input = document.getElementById('menuSearch');
  if (!input) return;
  input.addEventListener('input', () => {
    state.search = input.value;
    if (state.search) state.activeCat = null; else if (!state.activeCat) state.activeCat = state.menu.categories[0].name;
    updateTabs();
    renderMenu();
  });
}

function setupForm() {
  const form = document.getElementById('reserveForm');
  const note = document.getElementById('formNote');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(form);
    const name = fd.get('name'); const phone = fd.get('phone');
    if (!name || !phone) { note.textContent = 'Please fill in name and phone.'; return; }
    const subject = encodeURIComponent('Reservation Request - ' + name);
    const body = encodeURIComponent(
      `Name: ${name}\nPhone: ${phone}\nEmail: ${fd.get('email')}\nBranch: ${fd.get('branch')}\nDate: ${fd.get('date')}\nTime: ${fd.get('time')}\nGuests: ${fd.get('guests')}\nNotes: ${fd.get('notes')}`
    );
    // Replace the email below with your reservations address
    const email = 'reservations@aryapersianrestaurant.com';
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    note.textContent = 'Opening your email client to send the request. We will confirm by phone.';
  });
}

async function init() {
  try {
    [state.menu, state.branches] = await Promise.all([
      loadJSON('data/menu.json'),
      loadJSON('data/branches.json')
    ]);
  } catch (e) {
    console.error('Failed to load data', e);
    const mc = document.getElementById('menuContent');
    if (mc) mc.innerHTML = '<p style="text-align:center;color:#6b6b6b;">Menu could not load. Please open this page via <strong>http://localhost:8080</strong> (run <code>python -m http.server 8080</code> in the project folder) instead of opening the file directly.</p>';
    return;
  }
  renderSignature();
  renderMenuTabs();
  renderMenu();
  renderBranches();
  setupNav();
  setupSearch();
  setupForm();
  document.getElementById('year').textContent = new Date().getFullYear();
  setupMenuBook();
}

document.addEventListener('DOMContentLoaded', init);
