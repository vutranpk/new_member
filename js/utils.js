// Hàm tiện ích dùng chung

/** Trộn 2 màu hex. t = 0 → a, t = 1 → b */
export function mixHex(a, b, t) {
  const pa = parseHex(a), pb = parseHex(b);
  if (!pa || !pb) return a;
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

export function parseHex(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Độ tương phản WCAG giữa 2 màu hex */
export function contrast(a, b) {
  const lum = (hex) => {
    const [r, g, bl] = parseHex(hex).map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Làm tối dần màu cho tới khi đạt tỷ lệ tương phản mong muốn với nền */
export function ensureContrast(color, bg, target, towards = '#000000') {
  let c = color;
  for (let t = 0; t <= 1 && contrast(c, bg) < target; t += 0.05) c = mixHex(color, towards, t);
  return c;
}

/** "Đoàn Mạnh Tùng" → "doan-manh-tung" */
export function slugify(s) {
  return String(s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** "2026-09-14" → "14.09.2026" */
export function formatDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? `${m[3]}.${m[2]}.${m[1]}` : '';
}

/** Gom số điện thoại VN theo nhóm 4-3-3: "0946841376" → "0946 841 376" */
export function formatPhone(raw) {
  const d = String(raw || '').replace(/[^\d+]/g, '');
  if (/^0\d{9}$/.test(d)) return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  if (/^\+84\d{9}$/.test(d)) return `+84 ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}`;
  return String(raw || '').trim();
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Viết hoa chữ cái đầu mỗi từ, giữ nguyên dấu tiếng Việt */
export function titleCaseVi(s) {
  return String(s || '').trim().replace(/\s+/g, ' ')
    .split(' ').map((w) => w.charAt(0).toLocaleUpperCase('vi') + w.slice(1).toLocaleLowerCase('vi')).join(' ');
}

/**
 * Chuyển đổi các định dạng xuống dòng (<br>, <br/>, <br />, \n, \r\n) thành thẻ <br> chuẩn trong HTML,
 * đồng thời escape phần text để chống lỗi hoặc injection.
 */
export function formatHtmlBreaks(raw) {
  if (!raw) return '';
  return String(raw)
    .split(/<br\s*\/?>|\r?\n/gi)
    .map((seg) => escapeHtml(seg.trim()))
    .filter(Boolean)
    .join('<br>');
}

