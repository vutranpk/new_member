/**
 * Cấu hình Welcome Studio.
 *
 * SHEET_CSV_URL: link CSV của Google Sheet (File → Share → Publish to web → chọn sheet → CSV).
 * Để trống = dùng dữ liệu mẫu trong data/companies.sample.csv.
 */
window.WS_CONFIG = {
  SHEET_CSV_URL: 'https://docs.google.com/spreadsheets/d/1mx8Qg3OWAx2jSLFRXrljgXkpO4ghBwJQ-ax33oRC5OU/export?format=csv',
  SAMPLE_CSV_URL: 'data/companies.sample.csv',

  // Kích thước xuất file: A4 ở 300 DPI
  EXPORT_WIDTH: 2480,
  EXPORT_HEIGHT: 3508,

  // Câu thông báo mặc định nếu Sheet không ghi riêng cho công ty
  DEFAULT_ANNOUNCE_VI: 'PHÒNG HCNS TRÂN TRỌNG THÔNG BÁO<br>CÙNG TOÀN THỂ ANH/CHỊ CBNV',
  DEFAULT_ANNOUNCE_EN: 'The HR & Administration Department Is Pleased To Announce To All Employees',
};
