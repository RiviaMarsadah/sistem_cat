const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// Cache in-memory untuk menyimpan OTP pendaftaran
// Key: email.toLowerCase(), Value: { otp, data, expiresAt }
const otpCache = new Map();

/**
 * 1. Pencarian detail siswa secara persis (exact match)
 * Berdasarkan nama lengkap atau email yang terdaftar
 */
exports.searchStudent = async (req, res) => {
  const { query } = req.body;
  if (!query || !query.trim()) {
    return res.status(400).json({ success: false, message: 'Kata kunci pencarian wajib diisi' });
  }

  const trimmedQuery = query.trim();

  try {
    const student = await prisma.siswa.findFirst({
      where: {
        OR: [
          { user: { email: { equals: trimmedQuery } } },
          { user: { namaLengkap: { equals: trimmedQuery } } }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            namaLengkap: true,
            status: true,
            googleLinked: true,
            createdAt: true
          }
        },
        kelas: {
          include: { jurusan: true }
        }
      }
    });

    if (!student) {
      return res.json({ 
        success: true, 
        data: null, 
        message: 'Data siswa tidak ditemukan. Pastikan nama atau email Anda dimasukkan secara lengkap dan persis.' 
      });
    }

    return res.json({ success: true, data: student });
  } catch (err) {
    console.error('Search student error:', err);
    return res.status(500).json({ success: false, message: 'Gagal mencari data siswa' });
  }
};

/**
 * 2. Mengambil semua kelas dengan format lengkap
 * Contoh: X Teknik Kendaraan Ringan Otomotif 1
 */
exports.getClasses = async (req, res) => {
  try {
    const classes = await prisma.kelas.findMany({
      include: {
        jurusan: true
      },
      orderBy: [
        { tingkat: 'asc' },
        { namaKelas: 'asc' }
      ]
    });

    const formatted = classes.map(c => {
      const prodiName = c.jurusan ? c.jurusan.namaProdi : '';
      return {
        id: c.id,
        namaLengkapKelas: `${c.tingkat} ${prodiName} ${c.inisial}`.replace(/\s+/g, ' ').trim()
      };
    });

    return res.json({ success: true, data: formatted });
  } catch (err) {
    console.error('Get classes error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat daftar kelas' });
  }
};

/**
 * 3. Mengambil semua daftar agama unik dari database
 */
exports.getReligions = async (req, res) => {
  try {
    const religions = await prisma.siswa.findMany({
      select: { agama: true },
      distinct: ['agama']
    });

    const filteredList = Array.from(
      new Set(
        religions
          .map(r => r.agama ? r.agama.trim() : null)
          .filter(Boolean)
      )
    );

    return res.json({ success: true, data: filteredList });
  } catch (err) {
    console.error('Get religions error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat daftar agama' });
  }
};

/**
 * 4. Request pendaftaran mandiri - Mengirimkan Kode OTP via Email
 */
exports.requestOtp = async (req, res) => {
  const { namaLengkap, email, nis, nisn, kelasId, agama, password } = req.body;

  const finalPassword = password || 'siswa123';

  if (!namaLengkap || !email || !kelasId || !agama) {
    return res.status(400).json({ success: false, message: 'Semua kolom wajib diisi kecuali NIS dan NISN' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    // A. Validasi keunikan Email
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email ini sudah digunakan oleh akun lain' });
    }

    // B. Validasi keunikan NIS (jika diisi)
    if (nis && nis.trim()) {
      const existingNis = await prisma.siswa.findUnique({
        where: { nis: nis.trim() }
      });
      if (existingNis) {
        return res.status(409).json({ success: false, message: 'NIS sudah terdaftar di sistem' });
      }
    }

    // C. Validasi keunikan NISN (jika diisi)
    if (nisn && nisn.trim()) {
      const existingNisn = await prisma.siswa.findUnique({
        where: { nisn: nisn.trim() }
      });
      if (existingNisn) {
        return res.status(409).json({ success: false, message: 'NISN sudah terdaftar di sistem' });
      }
    }

    // Generate OTP & Expiry (5 menit)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    // Simpan data pendaftaran sementara ke Cache
    otpCache.set(normalizedEmail, {
      otp,
      expiresAt,
      data: {
        namaLengkap: namaLengkap.trim(),
        nis: nis ? nis.trim() : null,
        nisn: nisn ? nisn.trim() : null,
        kelasId: Number(kelasId),
        agama: agama.trim(),
        password: finalPassword
      }
    });

    // Mengkonfigurasi nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE === 'true' || true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Desain template email OTP yang premium
    const mailOptions = {
      from: `"ATEKA CAT Support" <${process.env.SMTP_USER}>`,
      to: normalizedEmail,
      subject: 'KODE OTP Verifikasi Registrasi Siswa — ATEKA CAT',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #0f1f3d; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.5px;">ATEKA CAT</h1>
            <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px;">Sistem Evaluasi Ujian Mandiri Siswa</p>
          </div>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 25px;" />
          <p style="color: #1e293b; font-size: 16px; line-height: 1.5; margin-top: 0;">Halo <strong>${namaLengkap.trim()}</strong>,</p>
          <p style="color: #475569; font-size: 15px; line-height: 1.6;">Anda sedang melakukan registrasi akun siswa mandiri pada sistem ATEKA CAT. Silakan masukkan kode OTP berikut pada halaman verifikasi:</p>
          <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; padding: 20px; text-align: center; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #0f1f3d; border-radius: 12px; margin: 30px 0;">
            ${otp}
          </div>
          <p style="color: #ef4444; font-size: 13px; font-weight: 600; text-align: center; margin-top: 10px;">⚠️ Kode verifikasi ini hanya berlaku selama 5 menit.</p>
          <p style="color: #64748b; font-size: 14px; line-height: 1.6; text-align: center; margin-top: 30px;">Jika Anda merasa tidak melakukan pendaftaran ini, harap abaikan email ini dengan aman.</p>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0 20px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">Email ini dikirim secara otomatis oleh ATEKA CAT Server. Harap tidak membalas email ini secara langsung.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`[OTP GENERATED] OTP for ${normalizedEmail} is ${otp}`);

    return res.json({ 
      success: true, 
      message: 'Kode OTP berhasil dikirim! Silakan periksa kotak masuk atau spam email Anda.' 
    });
  } catch (err) {
    console.error('Request OTP email sending error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Gagal mengirim email OTP. Pastikan email terdaftar aktif dan hubungi admin jika kendala berlanjut.' 
    });
  }
};

/**
 * 5. Verifikasi OTP & Transaksi database penyimpanan Siswa Baru
 */
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email dan Kode OTP wajib diisi' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const cached = otpCache.get(normalizedEmail);

  if (!cached) {
    return res.status(400).json({ 
      success: false, 
      message: 'Sesi pendaftaran tidak ditemukan. Silakan kirim ulang formulir registrasi.' 
    });
  }

  // Cek masa kedaluwarsa
  if (Date.now() > cached.expiresAt) {
    otpCache.delete(normalizedEmail);
    return res.status(400).json({ 
      success: false, 
      message: 'Kode OTP Anda telah kedaluwarsa (lebih dari 5 menit). Silakan ulangi proses pendaftaran.' 
    });
  }

  // Cek kecocokan OTP
  if (cached.otp !== otp.trim()) {
    return res.status(400).json({ success: false, message: 'Kode OTP yang Anda masukkan salah. Silakan coba lagi.' });
  }

  const { namaLengkap, nis, nisn, kelasId, agama, password } = cached.data;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cari angkatan yang sesuai dengan tahun berjalan
    const currentYear = new Date().getFullYear();
    let angkatan = await prisma.angkatan.findUnique({
      where: { tahunAngkatan: currentYear }
    });

    if (!angkatan) {
      angkatan = await prisma.angkatan.findFirst();
    }

    const result = await prisma.$transaction(async (tx) => {
      // A. Buat User
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          namaLengkap,
          role: 'siswa',
          status: 'aktif'
        }
      });

      // B. Buat Siswa Detail
      const siswa = await tx.siswa.create({
        data: {
          userId: user.id,
          nis: nis || null,
          nisn: nisn || null,
          kelasId: kelasId,
          idAngkatan: angkatan ? angkatan.id : null,
          agama,
          foto: 'default.jpg'
        }
      });

      return { user, siswa };
    });

    // Pendaftaran sukses, hapus cache OTP
    otpCache.delete(normalizedEmail);

    return res.status(201).json({
      success: true,
      message: 'Registrasi mandiri Anda berhasil! Akun Anda telah aktif, silakan masuk ke aplikasi mobile.',
      data: {
        userId: result.user.id,
        email: result.user.email,
        namaLengkap: result.user.namaLengkap
      }
    });

  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Data email, NIS, atau NISN sudah terdaftar' });
    }
    console.error('Verification and creation transaction error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem saat menyimpan akun pendaftaran Anda.' });
  }
};
