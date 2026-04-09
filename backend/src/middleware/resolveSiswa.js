const prisma = require('../config/prisma');

/**
 * Set req.siswaId from logged-in user (req.user.userId).
 * Must run after authenticate middleware.
 */
async function resolveSiswa(req, res, next) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const siswa = await prisma.siswa.findUnique({
      where: { userId: Number(userId) },
      select: { id: true },
    });
    if (!siswa) {
      return res.status(403).json({ success: false, message: 'Akses hanya untuk siswa' });
    }
    req.siswaId = siswa.id;
    return next();
  } catch (err) {
    console.error('resolveSiswa error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = resolveSiswa;

