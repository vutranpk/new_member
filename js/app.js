// Welcome Studio — điều phối giao diện
import { loadCompanies } from './data.js';
import { applyBrand, setLogo, renderPoster, fitName, defaultMessages, createPhotoController } from './poster.js';
import { exportPoster } from './export.js';
import { slugify, formatPhone, titleCaseVi, escapeHtml } from './utils.js';

const $ = (id) => document.getElementById(id);
const DRAFT_KEY = 'ws:draft:v1';
const BASE_W = 794, BASE_H = 1123;

const FIELDS = ['name', 'titleVi', 'titleEn', 'dept', 'start', 'manager', 'phone', 'ext', 'email'];
const INPUT_ID = { name: 'f-name', titleVi: 'f-title-vi', titleEn: 'f-title-en', dept: 'f-dept', start: 'f-start', manager: 'f-manager', phone: 'f-phone', ext: 'f-ext', email: 'f-email' };
const REQUIRED = { name: 'Họ và tên', titleVi: 'Chức danh tiếng Việt', dept: 'Phòng ban', start: 'Ngày nhận việc' };

const state = {
  companies: [],
  company: null,
  zoomMode: 'fit',
  scale: 1,
  fontsReady: false,
  busy: false,
  form: emptyForm(),
};

function emptyForm() {
  return { salutation: '', name: '', titleVi: '', titleEn: '', dept: '', start: '', manager: '', phone: '', ext: '', email: '', autoMsg: true, msgVi: '', msgEn: '' };
}

/* ==========================================================================
   Khởi động
   ========================================================================== */
const photo = createPhotoController({ getScale: () => state.scale, onChange: () => {} });

init();

async function init() {
  window.lucide?.createIcons();
  restoreDraft();
  bindGate();
  bindEditor();
  bindStudio();
  loadWelcomeArt();

  document.fonts.ready.then(() => {
    state.fontsReady = true;
    updateExportButtons();
    if (state.company) refresh();
  });

  await loadList();

  const params = new URLSearchParams(location.search);
  const demoName = params.has('demo') ? (params.get('demo') || 'demo') : null;
  const initial = params.get('c') && state.companies.find((c) => c.id === params.get('c'));
  if (initial) openStudio(initial, { focus: false });
  if (demoName) loadDemo(demoName);
}

/* ==========================================================================
   Màn chọn công ty
   ========================================================================== */
async function loadList() {
  const list = $('company-list');
  const status = $('gate-status');
  status.className = 'gate-status'; status.textContent = '';
  list.setAttribute('aria-busy', 'true');
  try {
    const { companies, source, warning } = await loadCompanies();
    state.companies = companies;
    const tag = $('data-source');
    tag.hidden = false;
    tag.className = `source-tag source-tag--${source === 'sample' ? 'sample' : 'sheet'}`;
    tag.textContent = { sample: 'Dữ liệu nội bộ', sheet: 'Đồng bộ trực tuyến', cache: 'Bản lưu ngoại tuyến' }[source];
    if (warning) status.textContent = warning;
    renderList('');
    previewCompany(companies[0]);
  } catch (err) {
    list.innerHTML = '';
    $('company-count').textContent = 'Không có dữ liệu';
    status.className = 'gate-status gate-status--error';
    status.innerHTML = `${escapeHtml(err.message)}<br><button type="button" class="btn btn--secondary-dark" id="retry-load">Thử lại</button>`;
    $('retry-load').addEventListener('click', loadList);
  } finally {
    list.setAttribute('aria-busy', 'false');
  }
}

function renderList(query) {
  const q = slugify(query);
  const items = state.companies.filter((c) => !q || slugify(`${c.name} ${c.legalName} ${c.id}`).includes(q));
  const list = $('company-list');
  $('company-count').textContent = q ? `${items.length} / ${state.companies.length} công ty` : `${state.companies.length} công ty`;

  if (!items.length) {
    list.innerHTML = '';
    $('gate-status').className = 'gate-status';
    $('gate-status').textContent = `Không tìm thấy công ty nào khớp “${query}”. Thử tên viết tắt hoặc tên pháp nhân.`;
    return;
  }
  $('gate-status').textContent = '';

  list.innerHTML = items.map((c, i) => `
    <li>
      <button type="button" class="company-row" data-id="${escapeHtml(c.id)}" style="--row-accent:${c.accent}">
        <span class="company-row__idx">${String(i + 1).padStart(2, '0')}</span>
        <span class="logo-chip">
          ${c.logo ? `<img src="${escapeHtml(c.logo)}" alt="" loading="lazy">` : `<span class="logo-chip__text">${escapeHtml(initials(c.name))}</span>`}
        </span>
        <span class="company-row__text">
          <span class="company-row__name">${escapeHtml(c.name)}</span>
          <span class="company-row__legal">${escapeHtml(c.legalName)}${c.emailDomain ? ` · @${escapeHtml(c.emailDomain)}` : ''}</span>
        </span>
        <i data-lucide="arrow-right" class="icon company-row__go" aria-hidden="true"></i>
      </button>
    </li>`).join('');
  window.lucide?.createIcons();
}

function initials(name) {
  return name.replace(/^\[.*?\]\s*/, '').split(/\s+/).filter(Boolean).slice(-2).map((w) => w[0]).join('');
}

function bindGate() {
  const list = $('company-list');
  const search = $('company-search');
  const pick = (e) => e.target.closest('.company-row');

  list.addEventListener('click', (e) => {
    const row = pick(e);
    if (row) openStudio(state.companies.find((c) => c.id === row.dataset.id));
  });
  const hover = (e) => {
    const row = pick(e);
    if (row) previewCompany(state.companies.find((c) => c.id === row.dataset.id));
  };
  list.addEventListener('pointerover', hover);
  list.addEventListener('focusin', hover);

  search.addEventListener('input', () => renderList(search.value));
  search.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); list.querySelector('.company-row')?.click(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); list.querySelector('.company-row')?.focus(); }
  });
    list.addEventListener('keydown', (e) => {
    if (!['ArrowDown', 'ArrowUp'].includes(e.key)) return;
    const rows = [...list.querySelectorAll('.company-row')];
    const i = rows.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    (rows[i + (e.key === 'ArrowDown' ? 1 : -1)] || (e.key === 'ArrowUp' ? search : null))?.focus();
  });

  const sheet = $('mock-sheet');
  if (sheet) {
    const updateScale = () => {
      const w = sheet.clientWidth;
      if (w && $('mock-scaler')) {
        $('mock-scaler').style.transform = `scale(${w / BASE_W})`;
      }
    };
    const ro = new ResizeObserver(updateScale);
    ro.observe(sheet);
    window.addEventListener('resize', updateScale);
    requestAnimationFrame(updateScale);
  }
}

let previewId = null;
function previewCompany(c) {
  if (!c || previewId === c.id) return;
  previewId = c.id;
  applyBrand(c);
  const bg = $('mock-bg');
  if (c.background) { bg.hidden = false; bg.src = c.background; } else { bg.hidden = true; }
  setLogo($('mock-logo'), $('mock-logo-text'), c);
  if ($('mock-site')) $('mock-site').textContent = c.footer || '';
  if ($('mock-msg-vi') && c.legalName) {
    $('mock-msg-vi').innerHTML = `Chào mừng anh gia nhập <strong>${escapeHtml(c.legalName)}</strong>. Chúc anh sớm hòa nhập, phát triển và gặt hái nhiều thành công trên cương vị mới!`;
    if ($('mock-msg-en')) $('mock-msg-en').textContent = `Welcome to ${c.legalName}! We wish him a smooth transition, continued growth, and great success in his new role.`;
  }
  $('mock-name').textContent = c.name;
  document.querySelectorAll('.company-row').forEach((r) => r.classList.toggle('is-active', r.dataset.id === c.id));
}

/* ==========================================================================
   Studio
   ========================================================================== */
function openStudio(company, { focus = true } = {}) {
  if (!company) return;
  state.company = company;
  previewId = null;
  applyBrand(company);

  setLogo($('tb-logo'), $('tb-logo-text'), company, { short: true });
  $('tb-name').textContent = company.name;
  $('tb-legal').textContent = company.legalName;

  const bg = $('p-bg');
  if (company.background) { bg.hidden = false; bg.src = company.background; } else { bg.hidden = true; }
  setLogo($('p-logo'), $('p-logo-text'), company);
  $('f-email').placeholder = company.emailDomain ? `ten@${company.emailDomain}` : 'ten@congty.vn';

  $('gate').hidden = true;
  $('studio').hidden = false;
  document.title = `${company.name} — Welcome Studio`;
  history.replaceState(null, '', `${location.pathname}?c=${encodeURIComponent(company.id)}${location.search.includes('demo') ? '&demo' : ''}`);

  syncMessages();
  refresh();
  requestAnimationFrame(() => { layoutCanvas(); photo.refresh(); });
  if (focus) $('f-name').focus({ preventScroll: true });
}

function closeStudio() {
  $('studio').hidden = true;
  $('gate').hidden = false;
  document.title = 'Welcome Studio — Thông báo nhân sự mới';
  history.replaceState(null, '', location.pathname);
  if (state.company) previewCompany(state.company);
  const row = document.querySelector(`.company-row[data-id="${CSS.escape(state.company?.id || '')}"]`);
  (row || $('company-search')).focus();
}

function refresh() {
  if (!state.company) return;
  renderPoster(state.form, state.company);
  const fit = fitName();
  const hint = $('name-hint');
  const msg = {
    normal: 'Tên nằm gọn trên một dòng.',
    semi: 'Tên hơi dài: dùng Barlow Semi Condensed để giữ một dòng.',
    shrink: `Tên hơi dài: đã giảm cỡ chữ còn ${Math.round(fit.size)}px để giữ một dòng.`,
    wrap: 'Tên từ 4 chữ đã tự động chia thành hai dòng cân đối đẹp mắt.',
  }[fit.mode];
  if (hint) {
    hint.textContent = state.form.name ? msg : 'Tên 2–3 chữ nằm 1 dòng; từ 4 chữ tự chia 2 dòng cân đối.';
    hint.classList.remove('field__hint--warn');
  }
  photo.refresh();
}

/* ---- Form ---- */
function bindEditor() {
  const form = $('editor');
  form.addEventListener('submit', (e) => e.preventDefault());

  FIELDS.forEach((k) => {
    const el = $(INPUT_ID[k]);
    el.value = state.form[k] || '';
    el.addEventListener('input', () => {
      state.form[k] = el.value.trim();
      if (el.getAttribute('aria-invalid') === 'true' && el.value.trim()) el.removeAttribute('aria-invalid');
      saveDraft(); refresh();
    });
  });

  // Chuẩn hóa khi rời ô
  $('f-name').addEventListener('blur', (e) => commit('name', titleCaseVi(e.target.value)));
  $('f-phone').addEventListener('blur', (e) => commit('phone', formatPhone(e.target.value)));
  $('f-ext').addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, ''); });
  $('f-email').addEventListener('blur', (e) => {
    const v = e.target.value.trim().replace(/\s+/g, '');
    const domain = state.company?.emailDomain;
    commit('email', v && !v.includes('@') && domain ? `${v}@${domain}`.toLowerCase() : v.toLowerCase());
  });

  form.querySelectorAll('input[name="salutation"]').forEach((r) => {
    r.checked = state.form.salutation ? r.value === state.form.salutation : false;
    r.addEventListener('change', () => {
      state.form.salutation = r.value;
      const group = $('salute-group');
      if (group) group.removeAttribute('aria-invalid');
      const err = $('salute-error');
      if (err) err.hidden = true;
      syncMessages(); saveDraft(); refresh();
    });
  });

  const auto = $('f-auto-msg');
  auto.checked = state.form.autoMsg;
  auto.addEventListener('change', () => {
    state.form.autoMsg = auto.checked;
    if (!auto.checked && state.company && !state.form.msgVi) {
      const d = defaultMessages(state.form.salutation, state.company);
      state.form.msgVi = d.vi; state.form.msgEn = d.en;
    }
    syncMessages(); saveDraft(); refresh();
    if (!auto.checked) $('f-msg-vi').focus();
  });
  ['vi', 'en'].forEach((lang) => {
    const el = $(`f-msg-${lang}`);
    el.addEventListener('input', () => { state.form[lang === 'vi' ? 'msgVi' : 'msgEn'] = el.value; saveDraft(); refresh(); });
  });

  bindPhoto();
}

function commit(key, value) {
  const el = $(INPUT_ID[key]);
  el.value = value;
  state.form[key] = value;
  saveDraft(); refresh();
}

function syncMessages() {
  const vi = $('f-msg-vi'), en = $('f-msg-en');
  const auto = state.form.autoMsg;
  vi.readOnly = en.readOnly = auto;
  if (auto && state.company) {
    const d = defaultMessages(state.form.salutation, state.company);
    vi.value = d.vi; en.value = d.en;
  } else {
    vi.value = state.form.msgVi; en.value = state.form.msgEn;
  }
}

/* ---- Ảnh ---- */
function bindPhoto() {
  const input = $('f-photo');
  const zone = $('dropzone');
  const err = $('photo-error');

  const showError = (m) => { err.textContent = m; err.hidden = !m; };

  async function take(file) {
    showError('');
    if (!file) return;
    if (!file.type.startsWith('image/')) { showError('File này không phải ảnh. Hãy chọn JPG hoặc PNG.'); return; }
    if (file.size > 15 * 1024 * 1024) { showError('Ảnh lớn hơn 15 MB. Hãy dùng ảnh nhẹ hơn.'); return; }
    try {
      const src = await readAsDataURL(file);
      const { w, h } = await imageSize(src);
      if (Math.min(w, h) < 500) showError('Ảnh hơi nhỏ (dưới 500 px), bản in có thể bị mờ.');
      setPhoto(src, w, h, file.name);
    } catch {
      showError('Không đọc được ảnh này. Thử lưu lại dưới dạng JPG rồi chọn lại.');
    }
  }

  input.addEventListener('change', () => { take(input.files[0]); input.value = ''; });
  ['dragenter', 'dragover'].forEach((t) => zone.addEventListener(t, (e) => { e.preventDefault(); zone.classList.add('is-over'); }));
  ['dragleave', 'drop'].forEach((t) => zone.addEventListener(t, (e) => { e.preventDefault(); zone.classList.remove('is-over'); }));
  zone.addEventListener('drop', (e) => take(e.dataTransfer.files[0]));
  // Thả ảnh thẳng lên poster cũng được
  const frame = $('p-photo-frame');
  frame.addEventListener('dragover', (e) => e.preventDefault());
  frame.addEventListener('drop', (e) => { e.preventDefault(); take(e.dataTransfer.files[0]); });

  $('f-zoom').addEventListener('input', (e) => photo.zoom(Number(e.target.value) / 100));
  $('photo-center').addEventListener('click', () => { photo.center(); $('f-zoom').value = 100; });
  $('photo-replace').addEventListener('click', () => input.click());
  $('photo-remove').addEventListener('click', () => {
    photo.clear();
    $('photo-tools').hidden = true; zone.hidden = false; showError('');
    zone.focus?.();
  });
}

function setPhoto(src, w, h, filename, opts) {
  photo.set(src, w, h, opts);
  $('photo-thumb').src = src;
  $('photo-file').textContent = filename;
  $('f-zoom').value = Math.round((opts?.zoom || 1) * 100);
  $('photo-tools').hidden = false;
  $('dropzone').hidden = true;
}

function readAsDataURL(blob) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob); });
}
function imageSize(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res({ w: i.naturalWidth, h: i.naturalHeight }); i.onerror = rej; i.src = src; });
}

/* ---- Topbar ---- */
function bindStudio() {
  $('back-to-gate').addEventListener('click', closeStudio);

  document.querySelectorAll('.zoom__btn').forEach((b) => b.addEventListener('click', () => {
    state.zoomMode = b.dataset.zoom;
    document.querySelectorAll('.zoom__btn').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    layoutCanvas();
  }));

  $('reset-form').addEventListener('click', () => {
    if (!confirm('Xóa toàn bộ thông tin và ảnh đang nhập?')) return;
    state.form = emptyForm();
    FIELDS.forEach((k) => { const el = $(INPUT_ID[k]); el.value = ''; el.removeAttribute('aria-invalid'); });
    form.querySelectorAll('input[name="salutation"]').forEach((r) => { r.checked = false; });
    const group = $('salute-group');
    if (group) group.removeAttribute('aria-invalid');
    const err = $('salute-error');
    if (err) err.hidden = true;
    $('f-auto-msg').checked = true;
    $('photo-remove').click();
    syncMessages(); saveDraft(); refresh();
    $('f-name').focus();
  });

  $('export-png').addEventListener('click', () => runExport());

  new ResizeObserver(() => layoutCanvas()).observe($('viewport'));
}

function layoutCanvas() {
  if ($('studio').hidden) return;
  const vp = $('viewport');
  const cs = getComputedStyle(vp);
  const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
  const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
  const stacked = window.matchMedia('(max-width: 960px)').matches;
  let s = 1;
  if (state.zoomMode === 'fit' || stacked) {
    const sw = (vp.clientWidth - padX) / BASE_W;
    const sh = (vp.clientHeight - padY) / BASE_H;
    s = stacked ? sw : Math.min(sw, sh);
    s = Math.max(0.2, Math.min(s, 1.5));
  }
  state.scale = s;
  vp.classList.toggle('is-fit', state.zoomMode === 'fit' && !stacked);
  $('poster-box').style.width = `${BASE_W * s}px`;
  $('poster-box').style.height = `${BASE_H * s}px`;
  $('poster-scale').style.transform = `scale(${s})`;
}

/* ---- Xuất file ---- */
function updateExportButtons() {
  const ok = state.fontsReady && !state.busy;
  const btn = $('export-png');
  if (btn) btn.disabled = !ok;
}

async function runExport() {
  const missing = [];
  const saluteGroup = $('salute-group');
  const saluteErr = $('salute-error');

  if (!state.form.salutation) {
    missing.push({ key: 'salutation', label: 'Danh xưng' });
    if (saluteGroup) saluteGroup.setAttribute('aria-invalid', 'true');
    if (saluteErr) saluteErr.hidden = false;
  } else {
    if (saluteGroup) saluteGroup.removeAttribute('aria-invalid');
    if (saluteErr) saluteErr.hidden = true;
  }

  Object.keys(REQUIRED).forEach((k) => {
    const el = $(INPUT_ID[k]);
    const isMissing = !state.form[k];
    if (isMissing) missing.push({ key: k, label: REQUIRED[k] });
    if (el) el.toggleAttribute('aria-invalid', isMissing);
  });

  if (missing.length) {
    toast(`Còn thiếu: ${missing.map((m) => m.label).join(', ')}.`, 'err');
    if (!state.form.salutation) {
      document.querySelector('input[name="salutation"]')?.focus();
    } else if (missing[0]) {
      $(INPUT_ID[missing[0].key])?.focus();
    }
    return;
  }
  if (!photo.get() && !confirm('Poster chưa có ảnh chân dung. Vẫn tải về?')) return;

  const btn = $('export-png');
  const label = btn.innerHTML;
  state.busy = true; updateExportButtons();
  btn.classList.add('is-busy');
  btn.innerHTML = `<span class="spinner" aria-hidden="true"></span><span>Đang xuất…</span>`;
  try {
    const name = `thong-bao-nhan-su-moi_${slugify(state.form.name)}_${slugify(state.company.id)}`;
    await exportPoster($('poster'), 'jpg', name);
    toast('Đã tải ảnh A4 (JPG 2480 × 3508 px, 300 DPI).', 'ok');
  } catch (err) {
    console.error(err);
    toast('Xuất file không thành công. Thử tải lại trang rồi xuất lại.', 'err');
  } finally {
    btn.innerHTML = label; btn.classList.remove('is-busy');
    state.busy = false; updateExportButtons();
  }
}

let toastTimer;
function toast(text, kind = 'ok') {
  const t = $('toast');
  $('toast-text').textContent = text;
  t.dataset.kind = kind;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, kind === 'err' ? 6000 : 3500);
}

/* ---- Lưu nháp trong phiên (không lưu ảnh) ---- */
function saveDraft() {
  try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(state.form)); } catch { /* bỏ qua */ }
}
function restoreDraft() {
  try { Object.assign(state.form, JSON.parse(sessionStorage.getItem(DRAFT_KEY) || '{}')); } catch { /* bỏ qua */ }
}

/* ---- Chữ Welcome (SVG dùng chung, màu theo biến thương hiệu) ---- */
async function loadWelcomeArt() {
  try {
    const res = await fetch('assets/shared/welcome.svg');
    const svg = (await res.text()).replace(/<\?xml[^>]*\?>/, '');
    $('p-welcome').innerHTML = svg;
    if ($('mock-welcome')) $('mock-welcome').innerHTML = svg;
  } catch {
    $('p-welcome').innerHTML = '<p class="poster__title">Welcome</p>';
    if ($('mock-welcome')) $('mock-welcome').innerHTML = '<p class="poster__title">Welcome</p>';
  }
}

/* ---- Dữ liệu thử trên máy: ?demo đọc samples/demo.json (không đưa lên GitHub) ---- */
async function loadDemo(demoName) {
  try {
    const name = String(demoName).replace(/[^\w-]/g, '');
    const demo = await (await fetch(`samples/${name}.json`, { cache: 'no-store' })).json();
    FIELDS.forEach((k) => { if (demo[k] != null) { state.form[k] = demo[k]; $(INPUT_ID[k]).value = demo[k]; } });
    if (demo.salutation) { state.form.salutation = demo.salutation; document.querySelector(`input[name="salutation"][value="${demo.salutation}"]`).checked = true; }
    syncMessages(); refresh();
    if (demo.photo) {
      const blob = await (await fetch(demo.photo)).blob();
      const src = await readAsDataURL(blob);
      const { w, h } = await imageSize(src);
      setPhoto(src, w, h, demo.photo.split('/').pop(), demo.photoFrame);
    }
  } catch (e) {
    console.warn('Không có samples/demo.json', e);
  }
}
