const client = require('../config/googleOAuth');
const prisma = require('../config/prisma');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

// Initiate Google OAuth
exports.googleLogin = (req, res) => {
  try {
    const url = client.generateAuthUrl({
      access_type: 'offline',
      scope: ['profile', 'email'],
      prompt: 'consent'
    });
    res.redirect(url);
  } catch (error) {
    console.error('Google OAuth Error:', error);
    res.redirect(`${env.frontendUrl}/login?error=oauth_init_failed`);
  }
};

// Google OAuth Callback
exports.googleCallback = async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.redirect(`${env.frontendUrl}/login?error=no_code`);
    }

    // Exchange code untuk token
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Get user info dari Google
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name;
    const picture = payload.picture;
    const googleId = payload.sub;

    // Cek apakah email sudah terdaftar di database
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.redirect(
        `${env.frontendUrl}/login?error=email_not_registered&email=${encodeURIComponent(email)}`
      );
    }

    // Update Google info ke database (jika belum ada)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: googleId,
        googlePicture: picture,
        googleLinked: true
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        email: user.email
      },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    );

    // Redirect ke frontend dengan token
    res.redirect(`${env.frontendUrl}/auth/callback?token=${token}`);

  } catch (error) {
    console.error('Google OAuth Callback Error:', error);
    // DEBUG SEMENTARA: tampilkan pesan error di URL agar bisa didiagnosis
    const errMsg = encodeURIComponent(error?.message || 'unknown');
    const errCode = encodeURIComponent(error?.code || error?.constructor?.name || 'unknown');
    res.redirect(`${env.frontendUrl}/login?error=oauth_failed&debug_msg=${errMsg}&debug_code=${errCode}`);
  }
};

// Google Sign-In untuk mobile (idToken langsung dari client)
exports.mobileGoogleLogin = async (req, res) => {
  const { idToken } = req.body || {};

  if (!idToken) {
    return res.status(400).json({
      success: false,
      message: 'idToken is required'
    });
  }

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    payload = ticket.getPayload();
  } catch (error) {
    // idToken invalid/expired/audience mismatch
    return res.status(401).json({
      success: false,
      message: 'Invalid idToken'
    });
  }

  const email = (payload?.email || '').trim().toLowerCase();
  const picture = payload?.picture || null;
  const googleId = payload?.sub || null;

  if (!email || !googleId) {
    return res.status(401).json({
      success: false,
      message: 'Invalid idToken'
    });
  }

  // Cari user berdasarkan email.
  // Relasi siswa->kelas dimuat jika ada, tapi untuk sementara tidak wajib.
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      guru: true,
      siswa: {
        include: {
          kelas: {
            include: {
              jurusan: true
            }
          }
        }
      }
    }
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Validasi akses mobile sementara: cukup berdasarkan `users.role`
  // (tidak memaksa adanya baris relasi di tabel `siswa`).
  if (user.role !== 'siswa') {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak. Hanya akun siswa yang dapat menggunakan aplikasi ini.'
    });
  }

  // Update Google linkage (idempotent)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      googleId: googleId,
      googlePicture: picture,
      googleLinked: true
    }
  });

  // Reload untuk memastikan relasi yang terbaru
  const updatedUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      guru: true,
      siswa: {
        include: {
          kelas: {
            include: {
              jurusan: true
            }
          }
        }
      }
    }
  });

  const token = jwt.sign(
    {
      userId: updatedUser.id,
      role: updatedUser.role,
      email: updatedUser.email
    },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );

  // Kirim hanya siswa.kelas (sesuai kebutuhan mobile)
  const userData = {
    id: updatedUser.id,
    email: updatedUser.email,
    role: updatedUser.role,
    namaLengkap: updatedUser.namaLengkap,
    status: updatedUser.status,
    googleLinked: updatedUser.googleLinked,
    googlePicture: updatedUser.googlePicture,
    siswa: updatedUser.siswa
        ? {
            id: updatedUser.siswa.id,
            nis: updatedUser.siswa.nis,
            nisn: updatedUser.siswa.nisn,
            kelas: updatedUser.siswa.kelas
              ? {
                  id: updatedUser.siswa.kelas.id,
                  namaKelas: updatedUser.siswa.kelas.namaKelas,
                  tingkat: updatedUser.siswa.kelas.tingkat,
                  inisial: updatedUser.siswa.kelas.inisial,
                  jurusan: updatedUser.siswa.kelas.jurusan 
                    ? {
                        id: updatedUser.siswa.kelas.jurusan.id,
                        kodeProdi: updatedUser.siswa.kelas.jurusan.kodeProdi,
                        namaProdi: updatedUser.siswa.kelas.jurusan.namaProdi
                      }
                    : null
                }
              : null
          }
      : null
  };

  return res.status(200).json({
    success: true,
    token,
    user: userData
  });
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        guru: true,
        siswa: {
          include: {
            kelas: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Format response
    const userData = {
      id: user.id,
      email: user.email,
      role: user.role,
      namaLengkap: user.namaLengkap,
      status: user.status,
      googleId: user.googleId,
      googlePicture: user.googlePicture,
      googleLinked: user.googleLinked,
      ...(user.guru && { guru: user.guru }),
      ...(user.siswa && { siswa: user.siswa })
    };

    res.json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
};

// Logout
exports.logout = (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
};

