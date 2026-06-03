const fs = require('fs');
const path = 'd:/FILE TUGAS AKHIR/~APLIKASI/Website CAT/frontend/src/pages/admin/JadwalUjian.jsx';

let content = fs.readFileSync(path, 'utf8');

// ── Deteksi whitespace aktual di area kritis ──────────────────────────────
const idx1 = content.indexOf("const rowClass = isEven ?");
const ctx = content.substring(idx1 - 200, idx1 + 300);
console.log('=== Context around rowClass ===');
console.log(JSON.stringify(ctx));
console.log('===============================');
