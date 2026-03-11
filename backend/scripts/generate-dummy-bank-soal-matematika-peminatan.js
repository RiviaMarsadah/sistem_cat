/**
 * Generate dummy bank soal Matematika Peminatan Kelas 11 (50 soal) dalam format template import.
 * Single choice: 5 opsi (A-E). Multi choice: 5-6 opsi bervariasi. Benar/salah: 3 pernyataan.
 * Output: dummy_bank_soal_matematika_peminatan_11.xlsx di root project
 */
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const HEADERS = ['Kategori', 'Soal', 'Opsi A', 'Opsi B', 'Opsi C', 'Opsi D', 'Opsi E', 'Opsi F', 'Jawaban', 'Gambar'];

// Baris = [kategori, soal, opsiA, opsiB, opsiC, opsiD, opsiE, opsiF, jawaban, gambar]
const singleChoice = [
  ['single_choice', 'Nilai dari lim(x→2) (x² - 4)/(x - 2) adalah...', '0', '2', '4', '6', 'Tidak ada', '', 'C', ''],
  ['single_choice', 'Turunan pertama dari f(x) = 3x⁴ - 2x² + 5 adalah...', '12x³ - 4x', '12x³ - 2x', '6x³ - 4x', '6x³ - 2x', '4x³ - 4x', '', 'A', ''],
  ['single_choice', '∫ (2x + 3) dx = ...', 'x² + 3x + C', '2x² + 3x + C', 'x² + 3 + C', '2x² + 3 + C', 'x² + 3x', '', 'A', ''],
  ['single_choice', 'Nilai sin 30° + cos 60° = ...', '0', '1/2', '1', '√3/2', '√2', '', 'C', ''],
  ['single_choice', 'Jika f(x) = x² dan g(x) = 2x - 1, maka (f ∘ g)(1) = ...', '0', '1', '2', '3', '4', '', 'B', ''],
  ['single_choice', 'Persamaan garis singgung lingkaran x² + y² = 25 di titik (3, 4) adalah...', '3x + 4y = 25', '4x + 3y = 25', '3x - 4y = 25', '4x - 3y = 0', 'x + y = 7', '', 'A', ''],
  ['single_choice', 'Suku ke-10 dari barisan aritmetika 2, 5, 8, 11, ... adalah...', '26', '29', '32', '35', '38', '', 'B', ''],
  ['single_choice', 'Nilai dari C(5, 2) adalah...', '5', '10', '15', '20', '25', '', 'B', ''],
  ['single_choice', 'Jika log 2 = a dan log 3 = b, maka log 12 = ...', 'a + b', '2a + b', 'a + 2b', '2a + 2b', 'ab', '', 'B', ''],
  ['single_choice', 'Bayangan titik (2, -3) oleh refleksi terhadap sumbu X adalah...', '(-2, 3)', '(2, 3)', '(-2, -3)', '(3, 2)', '(-3, 2)', '', 'B', ''],
  ['single_choice', 'Rumus suku ke-n barisan geometri 3, 6, 12, 24, ... adalah...', 'Un = 3·2ⁿ', 'Un = 3·2ⁿ⁻¹', 'Un = 2·3ⁿ', 'Un = 2·3ⁿ⁻¹', 'Un = 3ⁿ', '', 'B', ''],
  ['single_choice', 'Nilai dari sin² x + cos² x untuk setiap x ∈ R adalah...', '0', '1/2', '1', '2', 'Tergantung x', '', 'C', ''],
  ['single_choice', 'Jika f(x) = 2x - 5, maka f⁻¹(x) = ...', '(x + 5)/2', '(x - 5)/2', '(x + 2)/5', '2x + 5', '5 - 2x', '', 'A', ''],
  ['single_choice', 'Median dari data: 4, 5, 6, 7, 8, 9, 10 adalah...', '5', '6', '7', '8', '6,5', '', 'C', ''],
  ['single_choice', 'Dalam segitiga ABC, jika sin A = 3/5 dan A lancip, maka cos A = ...', '3/5', '4/5', '5/4', '3/4', '2/5', '', 'B', ''],
  ['single_choice', 'Persamaan lingkaran dengan pusat (0, 0) dan jari-jari 5 adalah...', 'x² + y² = 5', 'x² + y² = 10', 'x² + y² = 25', 'x + y = 5', 'x² - y² = 25', '', 'C', ''],
  ['single_choice', 'Nilai dari P(4, 2) adalah...', '6', '8', '12', '16', '24', '', 'C', ''],
  ['single_choice', 'Jika polinomial f(x) dibagi (x - 2) bersisa 5, maka f(2) = ...', '0', '2', '5', '7', 'Tidak dapat ditentukan', '', 'C', ''],
  ['single_choice', 'lim(x→0) sin x / x = ...', '0', '1/2', '1', '2', 'Tidak ada', '', 'C', ''],
  ['single_choice', 'Luas daerah di bawah kurva y = x² dari x = 0 sampai x = 2 adalah...', '2', '4/3', '2/3', '8/3', '4', '', 'D', ''],
];

const multiChoice = [
  ['multi_choice', 'Yang termasuk identitas trigonometri yang benar adalah...', 'sin² x + cos² x = 1', '1 + tan² x = sec² x', '1 + cot² x = cosec² x', 'sin 2x = 2 sin x', 'cos 2x = cos² x - sin² x', '', 'A,B,C,E', ''],
  ['multi_choice', 'Sifat-sifat limit fungsi yang benar adalah...', 'lim (f + g) = lim f + lim g', 'lim (f - g) = lim f - lim g', 'lim (f · g) = lim f · lim g', 'lim (k · f) = k · lim f', 'lim (f/g) = lim f / lim g jika lim g ≠ 0', '', 'A,B,C,D,E', ''],
  ['multi_choice', 'Aturan turunan yang benar untuk u dan v fungsi x adalah...', '(u + v)\' = u\' + v\'', '(u · v)\' = u\'v + uv\'', '(u/v)\' = (u\'v - uv\')/v²', '(k)\' = 0 untuk k konstanta', '(xⁿ)\' = nxⁿ⁻¹', '', 'A,B,C,D,E', ''],
  ['multi_choice', 'Fungsi yang memiliki invers pada domain R adalah...', 'f(x) = 2x + 1', 'f(x) = x²', 'f(x) = x³', 'f(x) = |x|', 'f(x) = 3 - x', '', 'A,C,E', ''],
  ['multi_choice', 'Yang termasuk barisan geometri adalah...', '2, 4, 8, 16, ...', '1, 3, 9, 27, ...', '5, 10, 15, 20, ...', '1, 1/2, 1/4, 1/8, ...', '3, -6, 12, -24, ...', '100, 10, 1, 0,1, ...', 'A,B,D,E,F', ''],
  ['multi_choice', 'Rumus yang terkait dengan lingkaran x² + y² = r² adalah...', 'Luas = πr²', 'Keliling = 2πr', 'Persamaan garis singgung di (x₁,y₁) adalah x₁x + y₁y = r²', 'Jarak pusat ke titik (a,b) = √(a² + b²)', 'Diameter = 2r', '', 'A,B,C,D,E', ''],
  ['multi_choice', 'Notasi sigma yang benar adalah...', 'Σ(k=1 to n) 1 = n', 'Σ(k=1 to n) k = n(n+1)/2', 'Σ(k=1 to n) k² = n(n+1)(2n+1)/6', 'Σ(k=1 to n) c = nc', 'Σ(k=1 to n) (a+k) = na + n(n+1)/2', '', 'A,B,C,D,E', ''],
  ['multi_choice', 'Untuk segitiga siku-siku dengan sisi a, b (siku-siku) dan c (miring), berlaku...', 'a² + b² = c²', 'sin θ = depan/miring', 'cos θ = samping/miring', 'tan θ = depan/samping', 'Luas = (1/2)ab', '', 'A,B,C,D,E', ''],
  ['multi_choice', 'Yang termasuk ukuran pemusatan data adalah...', 'Mean (rata-rata)', 'Median', 'Modus', 'Simpangan baku', 'Varians', 'Kuartil', 'A,B,C', ''],
  ['multi_choice', 'Integral tak tentu yang hasilnya benar adalah...', '∫ x dx = x²/2 + C', '∫ 1 dx = x + C', '∫ x² dx = x³/3 + C', '∫ 2x dx = x² + C', '∫ k dx = kx + C', '', 'A,B,C,D,E', ''],
  ['multi_choice', 'Transformasi geometri yang termasuk isometri (jarak tetap) adalah...', 'Refleksi', 'Rotasi', 'Translasi', 'Dilatasi dengan k = 2', 'Dilatasi dengan k = 1', '', 'A,B,C,E', ''],
  ['multi_choice', 'Persamaan trigonometri sin x = 1/2 dipenuhi oleh x = ... (0° ≤ x ≤ 360°)', '30°', '150°', '210°', '330°', '45°', '60°', 'A,B', ''],
  ['multi_choice', 'Sifat-sifat logaritma yang benar adalah...', 'log (a·b) = log a + log b', 'log (a/b) = log a - log b', 'log aⁿ = n log a', 'log 1 = 0', 'log 10 = 1', '', 'A,B,C,D,E', ''],
  ['multi_choice', 'Kombinasi dan permutasi: pernyataan yang benar adalah...', 'C(n,r) = n!/(r!(n-r)!)', 'P(n,r) = n!/(n-r)!', 'C(n,n) = 1', 'P(n,1) = n', 'C(n,0) = 1', '', 'A,B,C,D,E', ''],
  ['multi_choice', 'Fungsi f(x) = ax + b dengan a ≠ 0 memiliki sifat...', 'Domain dan range adalah R', 'Memiliki invers', 'Grafiknya garis lurus', 'f monoton naik jika a > 0', 'f monoton turun jika a < 0', 'f(0) = b', 'A,B,C,D,E,F', ''],
];

const benarSalah = [
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang limit.', 'lim(x→c) k = k untuk k konstanta.', 'lim(x→c) x = c.', 'Limit lim(x→0) (1/x) ada dan sama dengan 0.', '', '', '', 'B,B,S', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang turunan.', 'Turunan dari konstanta adalah 0.', 'Jika f(x) = xⁿ maka f\'(x) = nxⁿ⁻¹.', 'Turunan dari f(x) + g(x) adalah f\'(x) + g\'(x).', '', '', '', 'B,B,B', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang trigonometri.', 'Nilai maksimum sin x adalah 1.', 'Nilai minimum cos x adalah -1.', 'Perioda fungsi tan x adalah 2π.', '', '', '', 'B,B,S', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang integral.', '∫ f\'(x) dx = f(x) + C.', 'Integral tentu dari 0 ke a dari f(x) dx bisa negatif.', '∫₀^a f(x) dx = -∫_a^0 f(x) dx.', '', '', '', 'B,B,B', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang barisan.', 'Barisan aritmetika memiliki beda yang konstan.', 'Barisan geometri memiliki rasio yang konstan.', 'Suku ke-n barisan aritmetika: Un = a + (n-1)b.', '', '', '', 'B,B,B', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang lingkaran.', 'Persamaan x² + y² + Ax + By + C = 0 dapat merepresentasikan lingkaran.', 'Jari-jari lingkaran x² + y² = r² adalah r.', 'Garis yang memotong lingkaran di satu titik disebut garis singgung.', '', '', '', 'B,B,B', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang peluang.', 'Nilai peluang selalu antara 0 dan 1.', 'Peluang kejadian mustahil adalah 0.', 'C(n,r) = C(n, n-r).', '', '', '', 'B,B,B', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang fungsi.', 'Fungsi f(x) = x² adalah fungsi bijektif pada R.', 'Fungsi identitas I(x) = x memetakan setiap bilangan ke dirinya sendiri.', 'Komposisi (f ∘ g)(x) = f(g(x)).', '', '', '', 'S,B,B', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang statistika.', 'Median membagi data terurut menjadi dua bagian sama banyak.', 'Modus adalah nilai yang paling sering muncul.', 'Mean sensitif terhadap nilai ekstrem.', '', '', '', 'B,B,B', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang polinomial.', 'Jika P(x) dibagi (x - a) bersisa R, maka P(a) = R.', 'Derajat hasil bagi (P(x) : (x-a)) lebih rendah satu dari derajat P(x).', 'Teorema sisa berlaku untuk pembagi berderajat 1 saja.', '', '', '', 'B,B,S', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang vektor.', 'Vektor memiliki besar dan arah.', 'Vektor nol memiliki besar 0.', 'Dua vektor sama jika besar dan arahnya sama.', '', '', '', 'B,B,B', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang transformasi.', 'Refleksi terhadap sumbu X mengubah (x,y) menjadi (x,-y).', 'Rotasi 90° berlawanan arah jarum jam mengubah (x,y) menjadi (-y,x).', 'Dilatasi dengan faktor k mengalikan jarak dari pusat dengan k.', '', '', '', 'B,B,B', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang logaritma.', 'Logaritma hanya terdefinisi untuk bilangan positif.', 'log 1 = 0 untuk basis berapa pun (positif dan ≠ 1).', 'log a + log b = log (a + b).', '', '', '', 'B,B,S', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang persamaan kuadrat.', 'Diskriminan D = b² - 4ac menentukan banyak akar real.', 'Jika D > 0 maka ada dua akar real berbeda.', 'Jika D = 0 maka ada satu akar real (kembar).', '', '', '', 'B,B,B', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang deret.', 'Deret aritmetika: Sn = (n/2)(2a + (n-1)b).', 'Deret geometri tak hingga konvergen jika |r| < 1.', 'Jumlah deret geometri tak hingga S∞ = a/(1-r) untuk |r| < 1.', '', '', '', 'B,B,B', ''],
];

function buildRows() {
  const rows = [HEADERS];
  singleChoice.forEach((r) => rows.push(r));
  multiChoice.forEach((r) => rows.push(r));
  benarSalah.forEach((r) => rows.push(r));
  return rows;
}

function main() {
  const rows = buildRows();
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 14 }, { wch: 55 }, { wch: 38 }, { wch: 38 }, { wch: 38 },
    { wch: 38 }, { wch: 22 }, { wch: 18 }, { wch: 14 }, { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Soal');

  const panduanRows = [
    ['PANDUAN FORMAT IMPORT BANK SOAL'],
    [],
    ['Kolom di sheet "Soal" (baris pertama = header):'],
    ['Kategori', 'single_choice | multi_choice | benar_salah'],
    ['Soal', 'Teks pertanyaan (opsional untuk benar_salah)'],
    ['Opsi A s/d F', 'Isi opsi atau pernyataan. Minimal 3 untuk single/multi, minimal 1 untuk benar_salah'],
    ['Jawaban', 'Single: satu huruf A-F. Multi: dipisah koma contoh A,B,D. Benar/Salah: B atau S per pernyataan, contoh B,B,S'],
    ['Gambar', 'URL gambar (opsional)'],
    [],
    ['File ini: 50 soal Matematika Peminatan Kelas 11 (20 single, 15 multi, 15 benar/salah). Mapel & tingkat dipilih saat import di aplikasi.'],
  ];
  const wsPanduan = XLSX.utils.aoa_to_sheet(panduanRows);
  wsPanduan['!cols'] = [{ wch: 50 }, { wch: 75 }];
  XLSX.utils.book_append_sheet(wb, wsPanduan, 'Panduan');

  const outDir = path.join(__dirname, '../..');
  const outPath = path.join(outDir, 'dummy_bank_soal_matematika_peminatan_11.xlsx');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  XLSX.writeFile(wb, outPath);
  console.log('File berhasil dibuat:', outPath);
  console.log('Total baris data:', rows.length - 1, '(baris 1 = header)');
  console.log('  - Single choice:', singleChoice.length);
  console.log('  - Multi choice:', multiChoice.length);
  console.log('  - Benar/Salah:', benarSalah.length);
}

main();
