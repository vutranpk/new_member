// Dựng poster từ dữ liệu form + công ty đang chọn.
import { mixHex, ensureContrast, escapeHtml, formatDate, formatPhone, formatHtmlBreaks } from './utils.js';

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
  if (salutation === 'ms') return { vi: 'chị', salute: 'Chị / Ms.', obj: 'her', poss: 'her' };
  if (salutation === 'mr') return { vi: 'anh', salute: 'Anh / Mr.', obj: 'him', poss: 'his' };
  return { vi: 'anh/chị', salute: '', obj: 'them', poss: 'their' };
}

export function defaultMessages(salutation, company) {
  const p = pronouns(salutation);
  return {
    vi: salutation
      ? `Chúc ${p.vi} sớm hòa nhập phát triển & thành công tại`
      : `Chúc anh/chị sớm hòa nhập phát triển & thành công tại`,
    en: salutation === 'ms'
      ? `We wish her a smooth transition, continued growth & great success at`
      : (salutation === 'mr'
        ? `We wish him a smooth transition, continued growth & great success at`
        : `We wish you a smooth transition, continued growth & great success at`),
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
  if ($('p-announce-vi')) $('p-announce-vi').innerHTML = formatHtmlBreaks(viAnnounce);
  const enAnnounce = company.announceEn || cfg.DEFAULT_ANNOUNCE_EN;
  if ($('p-announce-en')) $('p-announce-en').innerHTML = formatHtmlBreaks(enAnnounce);

  // Dòng 1 bảng thông tin: Danh xưng & Họ tên
  const saluteHtml = state.salutation ? (state.salutation === 'ms' ? 'Chị / <em lang="en">Ms.</em>' : 'Anh / <em lang="en">Mr.</em>') : 'Anh/Chị / <em lang="en">Mr./Ms.</em>';
  if ($('p-row-salute')) $('p-row-salute').innerHTML = saluteHtml;
  if ($('p-row-name')) $('p-row-name').innerHTML = state.name ? escapeHtml(state.name) : ph('Họ và tên');

  // Dòng 2: Chức vụ
  const roleParts = [state.titleVi ? escapeHtml(state.titleVi) : '', state.titleEn ? `<em lang="en">${escapeHtml(state.titleEn)}</em>` : ''].filter(Boolean);
  if ($('p-role')) $('p-role').innerHTML = roleParts.length ? roleParts.join(' / ') : ph('Chức vụ / Position');

  // Dòng 3: Phòng ban
  if ($('p-dept')) $('p-dept').innerHTML = state.dept ? escapeHtml(state.dept) : ph('Phòng ban / Department');

  // Dòng 4: Ngày nhận việc
  if ($('p-start')) $('p-start').innerHTML = state.start ? formatDate(state.start) : ph('dd.mm.yyyy');

  // Dòng 5: ĐTDD
  if ($('p-phone')) $('p-phone').innerHTML = state.phone ? formatPhone(state.phone) : ph('09xx xxx xxx');

  // Dòng 6: Số nội bộ
  if ($('p-ext')) $('p-ext').innerHTML = state.ext ? escapeHtml(state.ext) : ph('---');

  // Dòng 7: Email
  if ($('p-email')) $('p-email').innerHTML = state.email ? escapeHtml(state.email) : ph('email@congty.vn');

  // Dòng 8: Quản lý trực tiếp
  if ($('p-manager')) $('p-manager').innerHTML = state.manager ? escapeHtml(state.manager) : ph('Tổng Giám Đốc / President');

  // Khối Welcome phía dưới
  if ($('p-salute')) $('p-salute').innerHTML = saluteHtml;
  if ($('p-name')) $('p-name').innerHTML = state.name ? escapeHtml(state.name) : ph('Họ và tên');
  if ($('p-join-company')) $('p-join-company').textContent = company.legalName || 'PHUC SINH CONSUMER CORP';

  // Lời chúc
  const msg = state.autoMsg ? defaultMessages(state.salutation, company) : { vi: state.msgVi, en: state.msgEn };
  if ($('p-msg-vi')) $('p-msg-vi').innerHTML = formatHtmlBreaks(msg.vi || '');
  if ($('p-msg-en')) $('p-msg-en').innerHTML = formatHtmlBreaks(msg.en || '');
  if ($('p-wish-company')) $('p-wish-company').textContent = company.legalName || 'PHUC SINH CONSUMER CORP';

  // Chân trang
  if ($('p-site')) $('p-site').textContent = company.footer || 'WWW.KCOFFEE.VN / K COFFEE APP';
}

/* ---------------------------------------------------------------------------
   Xử lý tên: giữ kích thước và định dạng đẹp mắt
--------------------------------------------------------------------------- */
export function fitName() {
  const el = $('p-name');
  if (!el) return { mode: 'normal', size: 24 };
  return { mode: 'normal', size: 24 };
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
