# Panduan Setup Google SSO untuk CAT System

## Langkah 1: Buat Google Cloud Project

1. Buka **Google Cloud Console**: https://console.cloud.google.com/
2. Login dengan akun Google Anda
3. Klik **"Select a project"** → **"New Project"**
4. Isi form:
   - **Project name**: `CAT System` (atau nama lain)
   - **Organization**: (opsional, bisa dikosongkan)
   - **Location**: (opsional)
5. Klik **"Create"**
6. Tunggu beberapa detik hingga project dibuat

## Langkah 2: Enable Google Identity Services API

1. Di Google Cloud Console, buka menu **"APIs & Services"** → **"Library"**
2. Cari **"Google Identity Services API"** atau **"Google+ API"**
3. Klik pada API tersebut
4. Klik tombol **"Enable"**
5. Tunggu hingga API enabled

**Catatan**: Google+ API sudah deprecated, tapi masih bisa digunakan. Lebih baik gunakan **"Google Identity Services API"** jika tersedia.

## Langkah 3: Setup OAuth Consent Screen

1. Di Google Cloud Console, buka **"APIs & Services"** → **"OAuth consent screen"**
2. Pilih **"External"** (untuk testing) atau **"Internal"** (jika pakai Google Workspace)
3. Klik **"Create"**
4. Isi form **App Information**:
   - **App name**: `CAT System`
   - **User support email**: Email Anda
   - **App logo**: (opsional)
   - **Application home page**: `http://localhost:5173` (untuk development)
   - **Application privacy policy link**: (opsional)
   - **Application terms of service link**: (opsional)
   - **Authorized domains**: (kosongkan untuk localhost)
   - **Developer contact information**: Email Anda
5. Klik **"Save and Continue"**
6. Di halaman **Scopes**, klik **"Add or Remove Scopes"**
7. Pilih scope berikut:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
8. Klik **"Update"** → **"Save and Continue"**
9. Di halaman **Test users** (jika External):
   - Klik **"Add Users"**
   - Tambahkan email Google yang akan digunakan untuk testing:
     - `gadinglalala121212@gmail.com`
     - `riviadimong321@gmail.com`
   - Klik **"Add"** → **"Save and Continue"**
10. Klik **"Back to Dashboard"**

## Langkah 4: Create OAuth 2.0 Credentials

1. Di Google Cloud Console, buka **"APIs & Services"** → **"Credentials"**
2. Klik **"Create Credentials"** → **"OAuth client ID"**
3. Jika diminta, pilih **"Web application"** sebagai Application type
4. Isi form:
   - **Name**: `CAT System Web Client`
   - **Authorized JavaScript origins**:
     ```
     http://localhost:5173
     http://localhost:3000
     ```
     (Untuk production, tambahkan: `https://yourdomain.com`)
   
   - **Authorized redirect URIs**:
     ```
     http://localhost:3000/api/auth/google/callback
     ```
     (Untuk production, tambahkan: `https://yourdomain.com/api/auth/google/callback`)
5. Klik **"Create"**
6. **PENTING**: Copy **Client ID** dan **Client Secret**
   - Simpan dengan aman, jangan commit ke Git!

## Langkah 5: Konfigurasi Backend

1. Buka file `backend/.env`
2. Tambahkan konfigurasi Google OAuth:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

**Ganti**:
- `your-client-id.apps.googleusercontent.com` dengan Client ID yang Anda copy
- `your-client-secret` dengan Client Secret yang Anda copy

## Langkah 6: Test SSO Google

1. **Pastikan backend dan frontend sudah running**:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. **Buka browser**: `http://localhost:5173/login`

3. **Klik "Masuk dengan Google"**

4. **Pilih akun Google** yang sudah ditambahkan sebagai test user

5. **Approve permissions** jika diminta

6. **Jika berhasil**, Anda akan di-redirect kembali ke aplikasi dan login otomatis

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Pastikan redirect URI di Google Console sama persis dengan `GOOGLE_REDIRECT_URI` di `.env`
- Harus sama termasuk `http://` atau `https://`

### Error: "email_not_registered"
- Pastikan email Google yang digunakan sudah di-seed ke database
- Jalankan seed: `node backend/src/utils/seed.js`

### Error: "access_denied"
- Pastikan email sudah ditambahkan sebagai test user di OAuth consent screen
- Atau ubah OAuth consent screen ke "Internal" jika pakai Google Workspace

### Error: "invalid_client"
- Pastikan Client ID dan Client Secret di `.env` sudah benar
- Jangan ada spasi atau karakter tambahan

## Production Setup

Untuk production, tambahkan:

1. **Authorized JavaScript origins**:
   ```
   https://yourdomain.com
   ```

2. **Authorized redirect URIs**:
   ```
   https://yourdomain.com/api/auth/google/callback
   ```

3. **Update `.env`**:
   ```env
   GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback
   FRONTEND_URL=https://yourdomain.com
   ```

4. **Pastikan menggunakan HTTPS** (OAuth memerlukan HTTPS di production)

## Keamanan

- ✅ Jangan commit `.env` ke Git
- ✅ Jangan share Client Secret
- ✅ Gunakan HTTPS di production
- ✅ Validasi email di backend sebelum login
- ✅ Simpan Client Secret dengan aman

## Selesai! 🎉

SSO Google sudah siap digunakan. User yang sudah di-seed bisa langsung login dengan akun Google mereka.

