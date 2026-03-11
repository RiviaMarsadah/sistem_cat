# Panduan API untuk Aplikasi Mobile (CAT)

Dokumen ini berisi route API backend yang **sudah tersedia** dan dapat digunakan oleh aplikasi mobile.

---

## Dasar

### Base URL

- **Development (HP satu jaringan dengan laptop):** `http://<IP_LOKAL>:3000`  
  Contoh: `http://192.168.1.5:3000`
- **Production:** `https://<domain-backend-anda>`  
  Semua route memakai prefiks **`/api`**.

### Autentikasi

Untuk route yang butuh login, sertakan header:

```
Authorization: Bearer <JWT_TOKEN>
```

Response error umum:

- **401** – Token tidak ada / tidak valid / kadaluarsa → arahkan ke layar login.
- **403** – Role tidak sesuai.

---

## Route yang Bisa Digunakan

### 1. Health check (tanpa auth)

| Method | Route | Keterangan |
|--------|-------|------------|
| GET | `/api/health` | Cek apakah backend hidup. |

**Response sukses (200):**

```json
{
  "status": "OK",
  "message": "CAT Backend API is running",
  "timestamp": "2025-03-03T..."
}
```

---

### 2. Profil user (butuh auth)

| Method | Route | Keterangan |
|--------|-------|------------|
| GET | `/api/auth/profile` | Profil user yang login (termasuk data siswa jika role siswa). |

**Header:** `Authorization: Bearer <token>`

**Response sukses (200):**

```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "siswa@sekolah.id",
    "role": "siswa",
    "namaLengkap": "Nama Siswa",
    "status": "aktif",
    "siswa": {
      "id": 1,
      "userId": 1,
      "nis": "12345",
      "kelasId": 1,
      "kelas": { "id": 1, "namaKelas": "X IPA 1", "tingkat": "X", ... }
    }
  }
}
```

Jika user guru, yang muncul adalah `guru`, bukan `siswa`. Gunakan response ini untuk menyimpan role dan data user di app.

---

### 3. Logout (butuh auth)

| Method | Route | Keterangan |
|--------|-------|------------|
| POST | `/api/auth/logout` | Logout. Di app cukup hapus token lalu panggil ini (opsional). |

**Header:** `Authorization: Bearer <token>`

**Response sukses (200):**

```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## Ringkasan

| Method | Route | Auth | Keterangan |
|--------|-------|------|------------|
| GET | `/api/health` | Tidak | Cek backend hidup |
| GET | `/api/auth/profile` | Bearer token | Profil user + siswa/guru |
| POST | `/api/auth/logout` | Bearer token | Logout |

---

## Format response umum

- **Sukses:** `{ "success": true, "data": ... }` atau `{ "success": true, "user": ... }` atau `{ "success": true, "message": "..." }`.
- **Error:** `{ "success": false, "message": "Pesan error" }` dengan status HTTP 4xx/5xx.

Dokumen ini dapat diperbarui ketika ada penambahan route di backend.
