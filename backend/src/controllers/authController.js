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
    res.redirect(`${env.frontendUrl}/login?error=oauth_failed`);
  }
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
      username: user.username,
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

