# Panduan Import Bank Soal dari Excel

Gunakan fitur **Import Excel** di halaman Bank Soal (Guru). Pilih **Mata Pelajaran**, **Tingkat** (10/11/12), dan **Prodi** (atau Semua Prodi), lalu unggah file Excel.

## Format file Excel

- **Sheet pertama** harus berisi data soal. Baris pertama = **header** (nama kolom).
- Unduh **Template** dari tombol "Download Template" agar format kolom pasti benar.

## Kolom yang wajib ada

| Kolom     | Keterangan |
|----------|------------|
| **Kategori** | `single_choice` \| `multi_choice` \| `benar_salah` |
| **Soal** | Teks pertanyaan. Untuk benar_salah boleh kosong. |
| **Opsi A** … **Opsi F** | Isi opsi atau pernyataan. Single/Multi: minimal 3 kolom terisi. Benar/Salah: minimal 1 pernyataan. |
| **Jawaban** | Lihat aturan per kategori di bawah. |
| **Gambar** | URL gambar (opsional). |

## Aturan kolom Jawaban

- **single_choice**: Satu huruf saja, contoh: `A` atau `C`.
- **multi_choice**: Beberapa huruf dipisah koma, contoh: `A,B,D`.
- **benar_salah**: Urutan B (Benar) dan S (Salah) untuk tiap pernyataan (A, B, C, …). Contoh: `B,B,S` = pernyataan A benar, B benar, C salah.

## Contoh isi Excel

- **Single choice**: Kategori = `single_choice`, Soal = "Siapa presiden pertama Indonesia?", Opsi A–D diisi, Jawaban = `A`.
- **Multi choice**: Kategori = `multi_choice`, Soal = "Yang termasuk bilangan prima...", Opsi A–E diisi, Jawaban = `A,B,D`.
- **Benar/Salah**: Kategori = `benar_salah`, Soal boleh kosong atau diisi konteks, Opsi A–C = pernyataan, Jawaban = `B,S,B`.

File template yang didownload sudah berisi sheet **Panduan** dengan penjelasan singkat. Gunakan sheet **Soal** untuk mengisi data.
