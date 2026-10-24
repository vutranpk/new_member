// Xuất poster ra PNG / PDF A4 300 DPI.
const BASE_W = 794;
const BASE_H = 1123;

let fontCSS = null;
let warmedUp = false;

function options(poster) {
  const { EXPORT_WIDTH, EXPORT_HEIGHT } = window.WS_CONFIG;
  return {
    width: BASE_W,
    height: BASE_H,
    // Vẽ thẳng ra đúng 2480 × 3508 px (tỷ lệ A4 thật lệch 0.01% so với khung 794 × 1123)
    pixelRatio: 1,
    canvasWidth: EXPORT_WIDTH,
    canvasHeight: EXPORT_HEIGHT,
    backgroundColor: '#F6F4EF',
    fontEmbedCSS: fontCSS,
    cacheBust: false,
    style: { transform: 'none', margin: '0' },
    filter: (node) => !(node.classList && node.classList.contains('preview-only')),
  };
}

async function prepare(poster) {
  await document.fonts.ready;
  if (!fontCSS) fontCSS = await window.htmlToImage.getFontEmbedCSS(poster);
  // Lần chụp đầu, trình duyệt đôi khi chưa giải mã xong ảnh nền → chụp nháp một lần nhỏ.
  if (!warmedUp) {
    await window.htmlToImage.toCanvas(poster, { ...options(poster), canvasWidth: 248, canvasHeight: 351 });
    warmedUp = true;
  }
}

function download(href, filename) {
  const a = document.createElement('a');
  a.href = href; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
}

/**
 * format: 'jpg' (ảnh A4 300 DPI, ~2 MB, dùng in & gửi) | 'pdf' (A4 để in)
 */
export async function exportPoster(poster, format, basename) {
  poster.classList.add('is-exporting');
  try {
    await prepare(poster);
    const jpeg = await window.htmlToImage.toJpeg(poster, { ...options(poster), quality: 0.92 });
    if (format === 'pdf') {
      const pdf = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
      pdf.addImage(jpeg, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      pdf.save(`${basename}.pdf`);
    } else {
      download(jpeg, `${basename}.jpg`);
    }
  } finally {
    poster.classList.remove('is-exporting');
  }
}
