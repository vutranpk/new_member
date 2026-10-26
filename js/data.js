// Đọc danh sách công ty từ Google Sheet (CSV đã publish) hoặc file mẫu.
import { parseHex } from './utils.js';

const CACHE_KEY = 'ws:companies:v1';

const DEFAULT_COLORS = { ink: '#103D54', primary: '#11A3DC', accent: '#EB1F36' };

/**
 * @returns {Promise<{companies: Array, source: 'sheet'|'sample'|'cache', warning?: string}>}
 */
export async function loadCompanies() {
  const cfg = window.WS_CONFIG || {};
  const sheetUrl = (cfg.SHEET_CSV_URL || '').trim();

  if (sheetUrl) {
    try {
      const companies = await fetchCsv(sheetUrl);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), companies })); } catch { /* bộ nhớ đầy: bỏ qua */ }
      return { companies, source: 'sheet' };
    } catch (err) {
      const cached = readCache();
      if (cached) return { companies: cached, source: 'cache', warning: 'Không kết nối được dữ liệu trực tuyến, đang dùng bản lưu gần nhất.' };
      throw new Error('Không kết nối được dữ liệu trực tuyến. Vui lòng kiểm tra kết nối mạng.');
    }
  }

  const companies = await fetchCsv(cfg.SAMPLE_CSV_URL || 'data/companies.sample.csv');
  return { companies, source: 'sample' };
}

async function fetchCsv(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  const parsed = window.Papa.parse(text, { header: true, skipEmptyLines: 'greedy', transformHeader: (h) => h.trim().toLowerCase() });
  const rows = parsed.data.map(normalize).filter(Boolean);
  if (!rows.length) throw new Error('Danh sách công ty trống');
  return rows;
}

function normalize(row) {
  const get = (k) => String(row[k] ?? '').trim();
  const id = get('id');
  const name = get('name');
  if (!id || !name) return null;
  const active = get('active').toUpperCase();
  if (active && !['TRUE', '1', 'YES', 'X', 'CÓ'].includes(active)) return null;

  const color = (k) => (parseHex(get(k)) ? '#' + get(k).replace('#', '').toUpperCase() : DEFAULT_COLORS[k]);
  return {
    id,
    name,
    legalName: get('legal_name') || name,
    logo: get('logo'),
    background: get('background'),
    ink: color('ink'),
    primary: color('primary'),
    accent: color('accent'),
    emailDomain: get('email_domain').replace(/^@/, ''),
    footer: get('footer'),
    announceVi: get('announce_vi'),
    announceEn: get('announce_en'),
  };
}

function readCache() {
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    return raw && Array.isArray(raw.companies) && raw.companies.length ? raw.companies : null;
  } catch { return null; }
}
