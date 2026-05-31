const prisma = require('../config/prisma');
const sijuwanApi = require('../utils/sijuwanApi');
const bcrypt = require('bcryptjs');

function mapApiTingkatToLocal(tingkatRaw) {
  if (!tingkatRaw) return null;
  const raw = tingkatRaw.trim().toUpperCase();
  if (raw === '10' || raw === 'X') return 'X';
  if (raw === '11' || raw === 'XI') return 'XI';
  if (raw === '12' || raw === 'XII') return 'XII';
  if (raw === 'ALUMNI') return 'ALUMNI';
  if (raw === 'KI') return 'KI';
  return null;
}

// ---- SSE Progress Emitter & Polling Snapshot ----
const progressEmitters = new Map();   // userId -> SSE response
const progressSnapshots = new Map();  // userId -> { processed, total, batch, module }

exports.registerEmitter = (userId, res) => {
  progressEmitters.set(userId, res);
};

exports.unregisterEmitter = (userId) => {
  progressEmitters.delete(userId);
};

const emitProgress = (userId, data) => {
  // Keep polling snapshot up-to-date
  if (data.type === 'progress' || data.type === 'batch_start') {
    progressSnapshots.set(userId, data);
  } else if (data.type === 'complete') {
    progressSnapshots.delete(userId);
  }

  // Emit to SSE clients
  const res = progressEmitters.get(userId);
  if (res && !res.writableEnded) {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }
};

/**
 * Helper to check differences
 */
const isDifferent = (apiVal, localVal) => {
  const v1 = String(apiVal || '').trim();
  const v2 = String(localVal || '').trim();
  return v1 !== v2;
};

/**
 * Sync Analysis Logic
 */
exports.analyze = async (req, res) => {
  const { module } = req.query;
  
  try {
    let report = { new: [], updates: [], syncedCount: 0, conflicts: [] };

    // --- PRODI / JURUSAN ---
    if (module === 'prodi') {
      const apiRes = await sijuwanApi.getProdi({ per_page: 1000 });
      const apiList = apiRes.data.data || apiRes.data || [];
      const localList = await prisma.jurusan.findMany();

      apiList.forEach(apiItem => {
        const localItem = localList.find(l => l.kodeProdi === apiItem.kode_prodi);

        if (!localItem) {
          report.new.push({ ...apiItem, _anchor: apiItem.kode_prodi });
        } else if (isDifferent(apiItem.nama_prodi, localItem.namaProdi)) {
          report.updates.push({
            id: localItem.id,
            anchor: apiItem.kode_prodi,
            changes: { namaProdi: { old: localItem.namaProdi, new: apiItem.nama_prodi } }
          });
        } else {
          report.syncedCount++;
        }
      });
    }

    // --- ANGKATAN ---
    else if (module === 'angkatan') {
      const apiRes = await sijuwanApi.getAngkatan({ per_page: 1000 }).catch(() => ({ data: [] }));
      const apiList = apiRes.data.data || apiRes.data || [];
      const localList = await prisma.angkatan.findMany();

      apiList.forEach(apiItem => {
        const localItem = localList.find(l => l.tahunAngkatan === Number(apiItem.tahun_angkatan));
        if (!localItem) {
          report.new.push({ ...apiItem, _anchor: apiItem.tahun_angkatan });
        } else if (isDifferent(apiItem.nama_angkatan, localItem.namaAngkatan)) {
          report.updates.push({
            id: localItem.id,
            anchor: apiItem.tahun_angkatan,
            changes: { namaAngkatan: { old: localItem.namaAngkatan, new: apiItem.nama_angkatan } }
          });
        } else {
          report.syncedCount++;
        }
      });
    }

    // --- MATA PELAJARAN ---
    else if (module === 'mapel') {
      const apiRes = await sijuwanApi.getMapel({ per_page: 1000 });
      const apiList = apiRes.data.data || apiRes.data || [];
      const localList = await prisma.mataPelajaran.findMany();

      apiList.forEach(apiItem => {
        const localItem = localList.find(l => l.kodeMapel === apiItem.kode_mapel);
        if (!localItem) {
          report.new.push({ ...apiItem, _anchor: apiItem.kode_mapel });
        } else if (isDifferent(apiItem.nama_mapel, localItem.namaMapel)) {
          report.updates.push({
            id: localItem.id,
            anchor: apiItem.kode_mapel,
            changes: { namaMapel: { old: localItem.namaMapel, new: apiItem.nama_mapel } }
          });
        } else {
          report.syncedCount++;
        }
      });
    }

    // --- KELAS ---
    else if (module === 'kelas') {
      const apiRes = await sijuwanApi.getKelas({ per_page: 1000 });
      const apiList = apiRes.data.data || apiRes.data || [];
      const localList = await prisma.kelas.findMany({ include: { jurusan: true } });

      apiList.forEach(apiItem => {
        // More robust matching: try to find by parsed components
        const parts = (apiItem.nama_kelas || '').trim().split(' ');
        const tingkatRaw = parts[0];
        const inisial = parts[parts.length - 1] || '1';
        const tingkat = mapApiTingkatToLocal(tingkatRaw);

        const localItem = localList.find(l => 
          l.tingkat === tingkat && 
          l.jurusan?.kodeProdi === apiItem.kode_prodi && 
          l.inisial === inisial
        );

        if (!localItem) {
          report.new.push({ ...apiItem, _anchor: apiItem.nama_kelas });
        } else {
          if (isDifferent(apiItem.kode_prodi, localItem.jurusan?.kodeProdi)) {
             report.updates.push({
               id: localItem.id,
               anchor: apiItem.nama_kelas,
               changes: { prodi: { old: localItem.jurusan?.kodeProdi, new: apiItem.kode_prodi } }
             });
          } else {
            report.syncedCount++;
          }
        }
      });
    }

    // --- GURU ---
    else if (module === 'guru') {
      const apiRes = await sijuwanApi.getGuru({ per_page: 1000 });
      const apiList = apiRes.data.data || apiRes.data || [];
      const localList = await prisma.guru.findMany({ include: { user: true } });
      const allUsers = await prisma.user.findMany();

      apiList.forEach(apiItem => {
        const localItemByNip = localList.find(l => l.nip === apiItem.nip);
        const localItemByEmail = localList.find(l => l.user.email === apiItem.email);
        
        // If not found in GURU list, check if email is used by OTHER roles (Admin, etc)
        const emailConflict = allUsers.find(u => u.email === apiItem.email && u.role !== 'guru');

        if (!localItemByNip && !localItemByEmail) {
          if (emailConflict) {
            report.conflicts.push({
              anchor: apiItem.email,
              message: `Email "${apiItem.email}" sudah digunakan oleh user dengan role "${emailConflict.role}".`
            });
          } else {
            report.new.push({ ...apiItem, _anchor: apiItem.nip || apiItem.email });
          }
        } else {
          const localItem = localItemByNip || localItemByEmail;
          let changes = {};
          if (isDifferent(apiItem.nama, localItem.user.namaLengkap)) changes.nama = { old: localItem.user.namaLengkap, new: apiItem.nama };
          if (isDifferent(apiItem.nohp, localItem.noHp)) changes.nohp = { old: localItem.noHp, new: apiItem.nohp };
          if (isDifferent(apiItem.alamat, localItem.alamat)) changes.alamat = { old: localItem.alamat, new: apiItem.alamat };
          
          if (Object.keys(changes).length > 0) {
            report.updates.push({ id: localItem.id, anchor: apiItem.nip || apiItem.email, changes });
          } else {
            report.syncedCount++;
          }
        }
      });
    }

    // --- SISWA ---
    else if (module === 'siswa') {
      const apiRes = await sijuwanApi.getSiswa({ per_page: 2000 });
      const apiList = apiRes.data.data || apiRes.data || [];
      const localList = await prisma.siswa.findMany({ include: { user: true, kelas: true } });
      const allUsers = await prisma.user.findMany();

      apiList.forEach(apiItem => {
        const localItemByNisn = localList.find(l => l.nisn === apiItem.nisn);
        const localItemByEmailLower = localList.find(l => l.user?.email?.toLowerCase() === (apiItem.email || '').toLowerCase());
        const emailConflict = allUsers.find(u =>
          u.email.toLowerCase() === (apiItem.email || '').toLowerCase() && u.role !== 'siswa'
        );

        if (!localItemByNisn && !localItemByEmailLower) {
          if (emailConflict) {
            report.conflicts.push({
              anchor: apiItem.email,
              message: `Email "${apiItem.email}" sudah digunakan oleh user dengan role "${emailConflict.role}".`
            });
          } else {
            report.new.push({ ...apiItem, _anchor: apiItem.nisn || apiItem.email });
          }
        } else {
          const localItem = localItemByNisn || localItemByEmailLower;
          let changes = {};
          if (isDifferent(apiItem.nama, localItem.user.namaLengkap)) changes.nama = { old: localItem.user.namaLengkap, new: apiItem.nama };
          if (isDifferent(apiItem.nis, localItem.nis)) changes.nis = { old: localItem.nis, new: apiItem.nis };
          // Jika siswa sudah ada tapi belum punya kelas, jadwalkan untuk di-link
          if (localItem.kelasId === null && apiItem.id_kelas) changes.linkKelas = apiItem.id_kelas;

          if (Object.keys(changes).length > 0) {
            report.updates.push({ id: localItem.id, anchor: apiItem.nisn || apiItem.email, changes });
          } else {
            report.syncedCount++;
          }
        }
      });
    }

    return res.json({ success: true, report });
  } catch (err) {
    console.error(`Analyze error [${module}]:`, err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Yield to event loop to avoid blocking (for batched processing)
 */
const yieldToEventLoop = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Find local kelas by matching API data with multiple strategies
 * Returns { kelas, matchedBy } or null
 */
const findLocalKelas = (apiKelasItem, apiKelasList, localKelasList) => {
  if (!apiKelasItem) return null;

  const apiNamaKelas = apiKelasItem.nama_kelas?.trim();

  // Strategy 1: Exact match by namaKelas
  let match = localKelasList.find(k => k.namaKelas === apiNamaKelas);
  if (match) return { kelas: match, matchedBy: 'exact_name' };

  // Strategy 2: Match by parsed components (tingkat + kode prodi + inisial)
  const parts = apiNamaKelas.split(' ');
  const tingkatRaw = parts[0];
  const inisial = parts[parts.length - 1] || '1';

  let tingkat = tingkatRaw;
  if (tingkatRaw === 'Alumni') tingkat = 'ALUMNI';
  else if (tingkatRaw === 'KI') tingkat = 'KI';

  const kodeProdi = apiKelasItem.kode_prodi;
  match = localKelasList.find(k =>
    k.tingkat === tingkat &&
    k.jurusanId === apiKelasItem.localJurusanId &&
    k.inisial === inisial
  );
  if (match) return { kelas: match, matchedBy: 'parsed_components' };

  // Strategy 3: Fuzzy match - case-insensitive namaKelas
  match = localKelasList.find(k =>
    k.namaKelas.toLowerCase() === apiNamaKelas.toLowerCase()
  );
  if (match) return { kelas: match, matchedBy: 'case_insensitive' };

  return null;
};

/**
 * JSON polling endpoint — GET /admin/sync/progress
 * Returns current sync progress snapshot for polling
 */
exports.progress = async (req, res) => {
  const userId = String(req.user?.id || 'default');
  const snapshot = progressSnapshots.get(userId);
  return res.json({ success: true, progress: snapshot || null });
};

/**
 * Progress stream endpoint — SSE (keep-alive) mode
 * GET /admin/sync/progress-stream
 */
exports.progressStream = (req, res) => {
  let userId = 'default';

  // Support token query param for SSE (EventSource can't send headers)
  if (req.query.token) {
    try {
      const jwt = require('jsonwebtoken');
      const env = require('../config/env');
      const decoded = jwt.verify(req.query.token, env.jwt.secret);
      userId = String(decoded.id);
    } catch {
      // token invalid — still use 'default'
    }
  } else if (req.user?.id) {
    userId = String(req.user.id);
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  progressEmitters.set(userId, res);
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  req.on('close', () => { progressEmitters.delete(userId); });
};

/**
 * Sync Execution Logic
 */
exports.execute = async (req, res) => {
  const { module, items } = req.body;
  const userId = String(req.user?.id || 'default');

  try {
    let result = { created: 0, updated: 0, skipped: 0, errors: [] };
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('password123', salt);

    // ---- Batch config: process in chunks of 100 ----
    const BATCH_SIZE = 100;
    const shouldBatch = Array.isArray(items) && items.length > 100;
    const totalBatches = shouldBatch ? Math.ceil(items.length / BATCH_SIZE) : 1;
    if (shouldBatch) {
      console.log(`[Sync] ${items.length} items for "${module}" — will process in batches of ${BATCH_SIZE}`);
    }

    if (module === 'prodi') {
      const batches = shouldBatch
        ? Array.from({ length: Math.ceil(items.length / BATCH_SIZE) }, (_, i) => items.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE))
        : [items];

      for (const batch of batches) {
        for (const item of batch) {
          try {
            if (item.id) {
              await prisma.jurusan.update({ where: { id: item.id }, data: { namaProdi: item.changes.namaProdi.new } });
              result.updated++;
            } else {
              await prisma.jurusan.upsert({
                where: { kodeProdi: item.kode_prodi },
                update: { namaProdi: item.nama_prodi },
                create: { kodeProdi: item.kode_prodi, namaProdi: item.nama_prodi }
              });
              result.created++;
            }
          } catch (itemErr) {
            console.error(`❌ Error syncing prodi ${item.kode_prodi || item.anchor}:`, itemErr.message);
            result.errors.push({ item: item.kode_prodi || item.anchor, reason: itemErr.message });
          }
        }
        if (shouldBatch) await yieldToEventLoop();
      }
    }

    else if (module === 'angkatan') {
      const batches = shouldBatch
        ? Array.from({ length: Math.ceil(items.length / BATCH_SIZE) }, (_, i) => items.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE))
        : [items];

      for (const batch of batches) {
        for (const item of batch) {
          try {
            if (item.id) {
              await prisma.angkatan.update({ where: { id: item.id }, data: { namaAngkatan: item.changes.namaAngkatan.new } });
              result.updated++;
            } else {
              await prisma.angkatan.upsert({
                where: { tahunAngkatan: Number(item.tahun_angkatan) },
                update: { namaAngkatan: item.nama_angkatan },
                create: { namaAngkatan: item.nama_angkatan, tahunAngkatan: Number(item.tahun_angkatan) }
              });
              result.created++;
            }
          } catch (err) {
            console.error(`❌ Error syncing angkatan ${item.tahun_angkatan}:`, err.message);
            result.errors.push({ item: item.tahun_angkatan, reason: err.message });
          }
        }
        if (shouldBatch) await yieldToEventLoop();
      }
    }

    else if (module === 'mapel') {
      const batches = shouldBatch
        ? Array.from({ length: Math.ceil(items.length / BATCH_SIZE) }, (_, i) => items.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE))
        : [items];

      for (const batch of batches) {
        for (const item of batch) {
          try {
            if (item.id) {
              await prisma.mataPelajaran.update({ where: { id: item.id }, data: { namaMapel: item.changes.namaMapel.new } });
              result.updated++;
            } else {
              await prisma.mataPelajaran.upsert({
                where: { kodeMapel: item.kode_mapel },
                update: { namaMapel: item.nama_mapel },
                create: { kodeMapel: item.kode_mapel, namaMapel: item.nama_mapel }
              });
              result.created++;
            }
          } catch (err) {
            console.error(`❌ Error syncing mapel ${item.kode_mapel}:`, err.message);
            result.errors.push({ item: item.kode_mapel, reason: err.message });
          }
        }
        if (shouldBatch) await yieldToEventLoop();
      }
    }

    else if (module === 'kelas') {
      const jurusans = await prisma.jurusan.findMany();
      const validTingkat = ['X', 'XI', 'XII', 'Alumni', 'KI'];

      const batches = shouldBatch
        ? Array.from({ length: Math.ceil(items.length / BATCH_SIZE) }, (_, i) => items.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE))
        : [items];

      for (const batch of batches) {
        for (const item of batch) {
          if (!item || !item.nama_kelas) continue;

          try {
            const jur = jurusans.find(j => j.kodeProdi === item.kode_prodi);
            if (!jur) {
              console.warn(`⚠️ Skipping Kelas ${item.nama_kelas}: Prodi ${item.kode_prodi} not found locally.`);
              result.skipped++;
              continue;
            }

            // Parse nama_kelas (e.g., "10 KM-4 X", "Alumni TKRO", "KI 24")
            const parts = (item.nama_kelas || '').trim().split(' ');
            const tingkatRaw = parts[0];
            const tingkat = mapApiTingkatToLocal(tingkatRaw);

            // Skip if tingkat is not in Enum
            if (!tingkat) {
              console.warn(`Skipping kelas ${item.nama_kelas} - invalid tingkat: ${tingkatRaw}`);
              result.skipped++;
              continue;
            }

            const inisial = parts[parts.length - 1] || '1';

            if (item.id) {
              await prisma.kelas.update({ where: { id: item.id }, data: { jurusanId: jur.id } });
              result.updated++;
            } else {
              await prisma.kelas.upsert({
                where: { tingkat_jurusanId_inisial: { tingkat, jurusanId: jur.id, inisial } },
                update: { namaKelas: item.nama_kelas },
                create: {
                  namaKelas: item.nama_kelas,
                  tingkat,
                  inisial,
                  jurusanId: jur.id
                }
              });
              result.created++;
            }
          } catch (err) {
            console.error(`❌ Error syncing kelas ${item.nama_kelas}:`, err.message);
            result.errors.push({ item: item.nama_kelas, reason: err.message });
          }
        }
        if (shouldBatch) await yieldToEventLoop();
      }
    }

    else if (module === 'guru') {
      const batches = shouldBatch
        ? Array.from({ length: Math.ceil(items.length / BATCH_SIZE) }, (_, i) => items.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE))
        : [items];

      for (const batch of batches) {
        for (const item of batch) {
          try {
            if (item.id) {
              const guru = await prisma.guru.findUnique({ where: { id: item.id }, include: { user: true } });
              await prisma.user.update({
                where: { id: guru.userId },
                data: { namaLengkap: item.changes.nama?.new || guru.user.namaLengkap }
              });
              await prisma.guru.update({
                where: { id: item.id },
                data: {
                  noHp: item.changes.nohp?.new || guru.noHp,
                  alamat: item.changes.alamat?.new || guru.alamat
                }
              });
              result.updated++;
            } else {
              // Cek apakah email sudah ada dengan role berbeda
              const existingUser = await prisma.user.findUnique({
                where: { email: item.email.toLowerCase() }
              });
              if (existingUser && existingUser.role !== 'guru') {
                console.warn(`⚠️ Skipping Guru "${item.nama}": email sudah digunakan oleh role "${existingUser.role}"`);
                result.skipped++;
                continue;
              }

              const user = await prisma.user.upsert({
                where: { email: item.email.toLowerCase() },
                update: { namaLengkap: item.nama },
                create: {
                  email: item.email.toLowerCase(),
                  namaLengkap: item.nama,
                  password: defaultPassword,
                  role: 'guru',
                  status: 'aktif'
                }
              });
              // Cek apakah guru record sudah ada
              const existingGuru = await prisma.guru.findUnique({ where: { userId: user.id } });
              if (!existingGuru) {
                await prisma.guru.create({
                  data: {
                    userId: user.id,
                    nip: item.nip,
                    jk: item.jk,
                    agama: item.agama,
                    noHp: item.nohp,
                    alamat: item.alamat
                  }
                });
              }
              result.created++;
            }
          } catch (err) {
            console.error(`❌ Error syncing guru ${item.email}:`, err.message);
            result.errors.push({ email: item.email, reason: err.message });
          }
        }
        if (shouldBatch) await yieldToEventLoop();
      }
    }

    else if (module === 'siswa') {
      // Build O(1) lookup maps
      const kelasList = await prisma.kelas.findMany({ include: { jurusan: true } });
      const angkatanList = await prisma.angkatan.findMany();
      const jurusanList = await prisma.jurusan.findMany();

      const localKelasByNorm  = new Map(kelasList.map(k => [`${k.tingkat}_${k.jurusanId}_${k.inisial}`, k]));
      const localAngkatanByTahun = new Map(angkatanList.map(a => [a.tahunAngkatan, a]));
      const localJurusanByKode   = new Map(jurusanList.map(j => [j.kodeProdi, j]));

      // Pre-link API kelas → localJurusanId for faster lookup
      const apiKelasList = [];
      try {
        const apiKelasRes = await sijuwanApi.getKelas({ per_page: 1000 });
        (apiKelasRes.data.data || apiKelasRes.data || []).forEach(k => {
          const parts = (k.nama_kelas || '').trim().split(' ');
          const tingkatRaw = parts[0];
          const inisial = parts[parts.length - 1] || '1';
          const tingkat = mapApiTingkatToLocal(tingkatRaw);

          apiKelasList.push({
            ...k,
            tingkat,
            inisial,
            localJurusanId: localJurusanByKode.get(k.kode_prodi)?.id
          });
        });
      } catch (e) {
        console.warn('[Sync] Could not fetch API kelas list:', e.message);
      }

      const apiKelasById = new Map(apiKelasList.map(k => [k.id_kelas, k]));

      const apiAngkatanList = [];
      try {
        const apiAngRes = await sijuwanApi.getAngkatan({ per_page: 1000 });
        (apiAngRes.data.data || apiAngRes.data || []).forEach(a => apiAngkatanList.push(a));
      } catch (e) {
        console.warn('[Sync] Could not fetch API angkatan list:', e.message);
      }
      const apiAngkatanById = new Map(apiAngkatanList.map(a => [a.id_angkatan, a]));

      // ---- Process items (batched if > 100) ----
      const totalItems = items.length;
      const batches = shouldBatch
        ? Array.from({ length: Math.ceil(totalItems / BATCH_SIZE) }, (_, i) =>
            items.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE))
        : [items];

      for (let [batchIdx, batch] of batches.entries()) {
        let itemIdx = 0;
        if (shouldBatch) {
          console.log(`[Sync] Processing batch ${batchIdx + 1}/${batches.length} for "${module}"`);
          emitProgress(userId, {
            type: 'batch_start',
            batch: batchIdx + 1,
            totalBatches,
            module,
            processed: batchIdx * BATCH_SIZE,
            total: totalItems,
          });
        }

        for (const item of batch) {
          try {
            if (item.id) {
              const siswa = await prisma.siswa.findUnique({ where: { id: item.id }, include: { user: true } });
              
              let siswaUpdateData = {};
              if (item.changes?.linkKelas) {
                const apiK = apiKelasById.get(item.changes.linkKelas);
                const localK = apiK
                  ? localKelasByNorm.get(`${apiK.tingkat}_${apiK.localJurusanId}_${apiK.inisial}`)
                  : null;
                if (localK) {
                  siswaUpdateData.kelasId = localK.id;
                }
              }
              if (item.changes?.nis?.new) {
                siswaUpdateData.nis = item.changes.nis.new;
              }

              await prisma.user.update({
                where: { id: siswa.userId },
                data: { namaLengkap: item.changes.nama?.new || siswa.user.namaLengkap }
              });

              if (Object.keys(siswaUpdateData).length > 0) {
                await prisma.siswa.update({
                  where: { id: item.id },
                  data: siswaUpdateData
                });
              }
              result.updated++;
            } else {
              // O(1) lookup using pre-built maps
              const apiK = apiKelasById.get(item.id_kelas);
              const apiA = apiAngkatanById.get(item.id_angkatan);

              let localK = apiK
                ? localKelasByNorm.get(`${apiK.tingkat}_${apiK.localJurusanId}_${apiK.inisial}`)
                : null;
              const localA = localAngkatanByTahun.get(Number(apiA?.tahun_angkatan));

              if (!localK || !localA) {
                const reason = [];
                if (!localK) reason.push(`kelas "${apiK?.nama_kelas || item.id_kelas || '?'}" belum ada di DB`);
                if (!localA) reason.push(`angkatan "${apiA?.tahun_angkatan || item.id_angkatan || '?'}" belum ada di DB`);
                console.warn(`⚠️ Skipping "${item.nama}": ${reason.join(' & ')}`);
                result.skipped++;
                continue;
              }

              const user = await prisma.user.upsert({
                where: { email: item.email.toLowerCase() },
                update: { namaLengkap: item.nama },
                create: {
                  email: item.email.toLowerCase(),
                  namaLengkap: item.nama,
                  password: defaultPassword,
                  role: 'siswa',
                  status: 'aktif'
                }
              });

              await prisma.siswa.upsert({
                where: { userId: user.id },
                update: {
                  nis: item.nis,
                  nisn: item.nisn,
                  jk: item.jk,
                  agama: item.agama,
                  noHp: item.nohp,
                  alamat: item.alamat,
                  kelasId: localK.id,
                  idAngkatan: localA.id
                },
                create: {
                  userId: user.id,
                  nis: item.nis,
                  nisn: item.nisn,
                  jk: item.jk,
                  agama: item.agama,
                  noHp: item.nohp,
                  alamat: item.alamat,
                  kelasId: localK.id,
                  idAngkatan: localA.id
                }
              });
              result.created++;
            }
          } catch (err) {
            console.error(`❌ Error syncing siswa ${item.email}:`, err.message);
            result.errors.push({ email: item.email, reason: err.message });
          }

          // Emit progress update every item
          const processed = batchIdx * BATCH_SIZE + itemIdx + 1;
          emitProgress(userId, {
            type: 'progress',
            batch: batchIdx + 1,
            totalBatches,
            processed,
            total: totalItems,
            module,
          });
          itemIdx++;
        }

        // Yield between batches to avoid blocking the event loop
        if (shouldBatch) await yieldToEventLoop();
      }

      if (shouldBatch) {
        console.log(`[Sync] "${module}" complete: created=${result.created}, updated=${result.updated}, skipped=${result.skipped}`);
        emitProgress(userId, { type: 'complete', result });
      }
    }

    return res.json({ success: true, result });
  } catch (err) {
    console.error(`Execute error [${module}]:`, err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
