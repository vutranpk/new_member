// Dựng poster từ dữ liệu form + công ty đang chọn.
import { mixHex, ensureContrast, escapeHtml, formatDate, formatPhone } from './utils.js';

const PAPER = '#F6F4EF';
const $ = (id) => document.getElementById(id);

/* ---------------------------------------------------------------------------
   Màu thương hiệu → biến CSS (dùng chung cho giao diện và poster)
--------------------------------------------------------------------------- */
export function applyBrand(company) {
  const root = document.documentElement.style;
  const primaryText = ensureContrast(mixHex(company.primary, company.ink, 0.45), PAPER, 4.5, company.ink);
  const accentStrong = ensureContrast(company.accent, '#FFFFFF', 4.6, '#000000');
  root.setProperty('--brand-ink', company.ink);
  root.setProperty('--brand-primary', company.primary);
  root.setProperty('--brand-accent', company.accent);
  root.setProperty('--brand-primary-text', primaryText);
  root.setProperty('--brand-accent-strong', accentStrong);
}

/* ---------------------------------------------------------------------------
   Logo: ảnh nếu có, nếu không (hoặc lỗi tải) thì hiện tên công ty bằng Barlow
--------------------------------------------------------------------------- */
export function setLogo(img, textEl, company, { short = false } = {}) {
  const clean = company.name.replace(/^\[.*?\]\s*/, '');
  textEl.textContent = short ? clean.split(/\s+/).filter(Boolean).slice(-2).map((w) => w[0]).join('') : clean;
  const showText = () => { img.hidden = true; textEl.hidden = false; };
  if (!company.logo) { img.removeAttribute('src'); showText(); return; }
  img.onerror = showText;
  img.onload = () => { img.hidden = false; textEl.hidden = true; };
  img.alt = company.name;
  img.src = company.logo;
}

/* ---------------------------------------------------------------------------
   Lời chúc mặc định theo danh xưng
--------------------------------------------------------------------------- */
export function pronouns(salutation) {
  return salutation === 'ms'
    ? { vi: 'chị', salute: 'Chị / Ms.', obj: 'her', poss: 'her' }
    : { vi: 'anh', salute: 'Anh / Mr.', obj: 'him', poss: 'his' };
}

export function defaultMessages(salutation, company) {
  const p = pronouns(salutation);
  const legal = company.legalName;
  const end = /[.!?]$/.test(legal) ? '' : '.';
  return {
    vi: `Chào mừng ${p.vi} gia nhập ${legal}${end} Chúc ${p.vi} sớm hòa nhập, phát triển<br>và gặt hái nhiều thành công trên cương vị mới!`,
    en: `Welcome to ${legal}! We wish ${p.obj} a smooth transition, continued growth, and great<br>success in ${p.poss} new role.`,
  };
}

/* ---------------------------------------------------------------------------
   Render
--------------------------------------------------------------------------- */
const ph = (label) => `<span class="is-placeholder preview-only">${escapeHtml(label)}</span>`;

export function renderPoster(state, company) {
  const cfg = window.WS_CONFIG;
  const p = pronouns(state.salutation);

  const viAnnounce = company.announceVi || cfg.DEFAULT_ANNOUNCE_VI;
  $('p-announce-vi').innerHTML = viAnnounce.includes('<br>') ? viAnnounce : escapeHtml(viAnnounce);
  $('p-announce-en').textContent = company.announceEn || cfg.DEFAULT_ANNOUNCE_EN;
  $('p-salute').textContent = p.salute;

  $('p-name').innerHTML = state.name ? escapeHtml(state.name) : ph('Họ và tên');
  $('p-title-vi').innerHTML = state.titleVi ? escapeHtml(state.titleVi) : ph('Chức danh');
  $('p-title-en').textContent = state.titleEn || '';

  $('p-manager').innerHTML = state.manager ? escapeHtml(state.manager) : ph('Quản lý trực tiếp');
  $('p-dept').innerHTML = state.dept ? escapeHtml(state.dept) : ph('Phòng ban');
  $('p-start').innerHTML = state.start ? formatDate(state.start) : ph('dd.mm.yyyy');

  const phone = formatPhone(state.phone);
  const parts = [];
  if (phone || state.ext) {
    parts.push([escapeHtml(phone), state.ext ? `(Ext: ${escapeHtml(state.ext)})` : ''].filter(Boolean).join(' '));
  }
  if (state.email) parts.push(escapeHtml(state.email));
  $('p-contact').innerHTML = parts.length ? parts.join(' / ') : ph('Điện thoại / Email');

  const msg = state.autoMsg ? defaultMessages(state.salutation, company) : { vi: state.msgVi, en: state.msgEn };
  const rawVi = msg.vi || '';
  const escapedVi = rawVi.includes('<br>') ? rawVi : escapeHtml(rawVi);
  $('p-msg-vi').innerHTML = emphasize(escapedVi, escapeHtml(company.legalName));
  const rawEn = msg.en || '';
  $('p-msg-en').innerHTML = rawEn.includes('<br>') ? rawEn : escapeHtml(rawEn);

  $('p-site').textContent = company.footer || '';
}

/** In đậm tên công ty trong lời chúc tiếng Việt */
function emphasize(html, legal) {
  if (!legal || !html.includes(legal)) return html;
  return html.split(legal).join(`<strong>${legal}</strong>`);
}

/* ---------------------------------------------------------------------------
   Xử lý tên: Tên từ 4 từ trở lên tự động xuống 2 dòng cân đối.
   Tên 2–3 từ giữ trên 1 dòng (dùng Semi Condensed hoặc co nhẹ nếu tràn).
--------------------------------------------------------------------------- */
const NAME_BASE = 33;
const NAME_MIN = 24;

export function fitName() {
  const el = $('p-name');
  const text = (el.querySelector('.is-placeholder') ? '' : el.textContent).trim();
  const words = text ? text.split(/\s+/).filter(Boolean) : [];
  const avail = el.parentElement.clientWidth - 20; // trừ 20px padding-left

  el.classList.remove('is-semi', 'is-wrap');
  el.style.fontSize = `${NAME_BASE}px`;

  if (!text) return { mode: 'normal', size: NAME_BASE };

  // Quy tắc thông minh: Tên từ 4 chữ trở lên tự động xuống 2 dòng cân đối đẹp mắt
  if (words.length >= 4) {
    el.style.fontSize = '28px';
    el.classList.add('is-wrap');
    return { mode: 'wrap', size: 28 };
  }

  // Tên 2–3 chữ: Ưu tiên nằm trọn vẹn trên 1 dòng
  if (el.scrollWidth <= avail) return { mode: 'normal', size: NAME_BASE };

  // Nếu hơi dài thì đổi sang Barlow Semi Condensed
  el.classList.add('is-semi');
  if (el.scrollWidth <= avail) return { mode: 'semi', size: NAME_BASE };

  // Nếu vẫn tràn thì giảm cỡ chữ
  const size = Math.floor(NAME_BASE * (avail / el.scrollWidth) * 10) / 10;
  if (size >= NAME_MIN) {
    el.style.fontSize = `${size}px`;
    return { mode: 'shrink', size };
  }

  // Quá dài thì xuống dòng
  el.style.fontSize = '28px';
  el.classList.add('is-wrap');
  return { mode: 'wrap', size: 28 };
}

/* ---------------------------------------------------------------------------
   Ảnh chân dung: phủ kín khung bo tròn, phóng to và kéo để căn mặt
--------------------------------------------------------------------------- */
export function createPhotoController({ getScale, onChange }) {
  const frame = $('p-photo-frame');
  const img = $('p-photo');
  const empty = $('p-photo-empty');
  let photo = null; // { src, w, h, zoom, x, y }

  function bounds() {
    const W = frame.clientWidth, H = frame.clientHeight;
    const s = Math.max(W / photo.w, H / photo.h) * photo.zoom;
    const dw = photo.w * s, dh = photo.h * s;
    return { dw, dh, mx: Math.max(0, (dw - W) / 2), my: Math.max(0, (dh - H) / 2) };
  }

  function apply() {
    if (!photo) {
      img.hidden = true; img.removeAttribute('src');
      empty.hidden = false; frame.classList.remove('has-photo');
      return;
    }
    const b = bounds();
    photo.x = Math.max(-b.mx, Math.min(b.mx, photo.x));
    photo.y = Math.max(-b.my, Math.min(b.my, photo.y));
    img.style.width = `${b.dw}px`;
    img.style.height = `${b.dh}px`;
    img.style.transform = `translate(calc(-50% + ${photo.x}px), calc(-50% + ${photo.y}px))`;
    if (img.getAttribute('src') !== photo.src) img.src = photo.src;
    img.hidden = false; empty.hidden = true; frame.classList.add('has-photo');
  }

  // Kéo ảnh
  let drag = null;
  frame.addEventListener('pointerdown', (e) => {
    if (!photo || e.button !== 0) return;
    drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, x: photo.x, y: photo.y };
    frame.setPointerCapture(e.pointerId);
    frame.classList.add('is-dragging');
  });
  frame.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const k = getScale() || 1;
    photo.x = drag.x + (e.clientX - drag.sx) / k;
    photo.y = drag.y + (e.clientY - drag.sy) / k;
    apply();
  });
  const end = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null; frame.classList.remove('is-dragging');
    onChange(photo);
  };
  frame.addEventListener('pointerup', end);
  frame.addEventListener('pointercancel', end);

  return {
    /** Nạp ảnh mới; mặc định đẩy khung lên phần trên ảnh (nơi thường có khuôn mặt) */
    set(src, w, h, opts = {}) {
      photo = { src, w, h, zoom: opts.zoom ?? 1, x: opts.x ?? 0, y: opts.y ?? Number.POSITIVE_INFINITY };
      if (opts.y == null) { const b = bounds(); photo.y = b.my * 0.6; }
      apply();
      onChange(photo);
    },
    zoom(z) { if (!photo) return; photo.zoom = z; apply(); onChange(photo); },
    center() { if (!photo) return; photo.zoom = 1; photo.x = 0; photo.y = bounds().my * 0.6; apply(); onChange(photo); },
    clear() { photo = null; apply(); onChange(null); },
    refresh: apply,
    get: () => photo,
  };
}
