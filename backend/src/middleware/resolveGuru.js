const prisma = require('../config/prisma');

/**
 * Set req.guruId from logged-in user (req.user.userId).
 * Must run after authenticate middleware.
 */
async function resolveGuru(req, res, next) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const guru = await prisma.guru.findUnique({
      where: { userId: Number(userId) },
      select: { id: true },
    });
    if (!guru) {
      return res.status(403).json({ success: false, message: 'Akses hanya untuk guru' });
    }
    req.guruId = guru.id;
    next();
  } catch (err) {
    console.error('resolveGuru error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = resolveGuru;
