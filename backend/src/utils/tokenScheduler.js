/**
 * Token Scheduler — Auto-regenerasi token ujian setiap 15 menit (menit ke 10, 25, 40, 55)
 * Hanya untuk ujian yang berlangsung HARI INI agar tidak berat.
 */

const prisma = require('../config/prisma');

// ── Karakter token: 6 digit alfanumerik uppercase ──────────────────────────
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const TOKEN_LEN = 6;
const REGEN_INTERVAL_MS = 15 * 60 * 1000; // 15 menit

function generateRawToken() {
  let t = '';
  for (let i = 0; i < TOKEN_LEN; i++) {
    t += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return t;
}

/**
 * Buat token 6 karakter yang unik (tidak ada duplikat di DB).
 * Maksimal 20 percobaan untuk menghindari infinite loop.
 */
async function generateUniqueToken(excludeId = null) {
  let attempts = 0;
  while (attempts < 20) {
    const token = generateRawToken();
    const where = { token };
    if (excludeId) {
      // Kecualikan baris yang sedang di-update agar tidak self-conflict
      where.NOT = { id: excludeId };
    }
    const existing = await prisma.jadwalUjian.findFirst({ where: { token, NOT: excludeId ? { id: excludeId } : undefined } });
    if (!existing) return token;
    attempts++;
  }
  // Fallback: timestamp-based token (sangat jarang terjadi)
  return (Date.now().toString(36).toUpperCase() + 'XXXXXX').slice(0, TOKEN_LEN);
}

/**
 * Regenerasi token (checkIn & checkOut) untuk seluruh jadwal ujian HARI INI.
 * Definisi "hari ini": mulai <= endOfDay && selesai >= startOfDay
 * Hanya ujian yang belum selesai (selesai >= now) yang di-regenerasi
 * agar tidak membuang query pada ujian yang sudah lewat.
 */
async function regenerateTokensForToday() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  try {
    // Ambil semua jadwal hari ini yang belum selesai
    const jadwalList = await prisma.jadwalUjian.findMany({
      where: {
        mulai:   { lte: endOfDay },
        selesai: { gte: now },       // Hanya yang masih aktif/akan datang
        // selesai juga harus dalam rentang hari ini (mulai di hari ini)
        AND: { selesai: { gte: startOfDay } }
      },
      select: { id: true }
    });

    if (jadwalList.length === 0) {
      console.log('[TokenScheduler] Tidak ada jadwal hari ini yang perlu di-regenerasi.');
      return { updated: 0 };
    }

    console.log(`[TokenScheduler] Regenerasi token untuk ${jadwalList.length} jadwal hari ini...`);

    let updated = 0;
    // Proses satu per satu agar token benar-benar unik
    for (const jadwal of jadwalList) {
      const newToken    = await generateUniqueToken(jadwal.id);
      const newTokenOut = await generateUniqueToken(jadwal.id);

      await prisma.jadwalUjian.update({
        where: { id: jadwal.id },
        data:  { token: newToken, tokenCheckOut: newTokenOut }
      });
      updated++;
    }

    console.log(`[TokenScheduler] ✅ Berhasil regenerasi ${updated} token jadwal.`);
    return { updated };
  } catch (err) {
    console.error('[TokenScheduler] ❌ Error saat regenerasi token:', err);
    return { updated: 0, error: err.message };
  }
}

/**
 * Hitung waktu (ms) sampai slot 15 menit berikutnya.
 * Slot: menit ke-10, 25, 40, dan 55 setiap jam.
 */
function msUntilNextSlot() {
  const now = Date.now();
  const OFFSET_MS = 10 * 60 * 1000; // 10 minutes offset
  const shiftedTime = now - OFFSET_MS;
  const currentSlot = Math.floor(shiftedTime / REGEN_INTERVAL_MS);
  const nextSlotMs  = (currentSlot + 1) * REGEN_INTERVAL_MS + OFFSET_MS;
  return nextSlotMs - now;
}

/**
 * Start scheduler — sync ke slot 15 menit berikutnya, lalu setInterval.
 */
function startTokenScheduler() {
  const delay = msUntilNextSlot();
  const nextAt = new Date(Date.now() + delay);
  console.log(`[TokenScheduler] 🕒 Scheduler aktif. Regenerasi pertama: ${nextAt.toLocaleTimeString('id-ID')}`);

  // Jalankan tepat di awal slot berikutnya
  setTimeout(() => {
    regenerateTokensForToday();
    // Kemudian setiap 15 menit
    setInterval(regenerateTokensForToday, REGEN_INTERVAL_MS);
  }, delay);
}

module.exports = {
  startTokenScheduler,
  regenerateTokensForToday,
  msUntilNextSlot,
  REGEN_INTERVAL_MS
};
