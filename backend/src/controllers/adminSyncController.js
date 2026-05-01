const prisma = require('../config/prisma');
const sijuwanApi = require('../utils/sijuwanApi');
const bcrypt = require('bcryptjs');

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
        const parts = (apiItem.nama_kelas || '').split(' ');
        const tingkatRaw = parts[0];
        const inisial = parts[parts.length - 1] || '1';
        const tingkat = tingkatRaw === 'Alumni' ? 'ALUMNI' : (tingkatRaw === 'KI' ? 'KI' : tingkatRaw);

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
        const localItemByEmail = localList.find(l => l.user.email === apiItem.email);
        const emailConflict = allUsers.find(u => u.email === apiItem.email && u.role !== 'siswa');

        if (!localItemByNisn && !localItemByEmail) {
          if (emailConflict) {
            report.conflicts.push({
              anchor: apiItem.email,
              message: `Email "${apiItem.email}" sudah digunakan oleh user dengan role "${emailConflict.role}".`
            });
          } else {
            report.new.push({ ...apiItem, _anchor: apiItem.nisn || apiItem.email });
          }
        } else {
          const localItem = localItemByNisn || localItemByEmail;
          let changes = {};
          if (isDifferent(apiItem.nama, localItem.user.namaLengkap)) changes.nama = { old: localItem.user.namaLengkap, new: apiItem.nama };
          if (isDifferent(apiItem.nis, localItem.nis)) changes.nis = { old: localItem.nis, new: apiItem.nis };
          
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
 * Sync Execution Logic
 */
exports.execute = async (req, res) => {
  const { module, items } = req.body; 
  
  try {
    let result = { created: 0, updated: 0 };
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('password123', salt);

    if (module === 'prodi') {
      for (const item of items) {
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
        }
      }
    }

    else if (module === 'angkatan') {
      for (const item of items) {
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
        }
      }
    }

    else if (module === 'mapel') {
      for (const item of items) {
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
        }
      }
    }

    else if (module === 'kelas') {
      const jurusans = await prisma.jurusan.findMany();
      const validTingkat = ['X', 'XI', 'XII', 'Alumni', 'KI'];

      for (const item of items) {
        if (!item || !item.nama_kelas) continue;

        try {
          const jur = jurusans.find(j => j.kodeProdi === item.kode_prodi);
          if (!jur) {
            console.warn(`⚠️ Skipping Kelas ${item.nama_kelas}: Prodi ${item.kode_prodi} not found locally.`);
            continue;
          }

          // Parse nama_kelas (e.g., "X TKRO 1", "Alumni TKRO", "KI 24")
          const parts = item.nama_kelas.split(' ');
          const tingkatRaw = parts[0];
          
          // Skip if tingkat is not in Enum
          if (!validTingkat.includes(tingkatRaw)) {
            console.warn(`Skipping kelas ${item.nama_kelas} - invalid tingkat: ${tingkatRaw}`);
            continue;
          }

          let tingkat;
          if (tingkatRaw === 'Alumni') tingkat = 'ALUMNI';
          else if (tingkatRaw === 'KI') tingkat = 'KI';
          else tingkat = tingkatRaw;

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
        }
      }
    }

    else if (module === 'guru') {
      for (const item of items) {
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
            const user = await prisma.user.create({
              data: {
                email: item.email,
                namaLengkap: item.nama,
                password: defaultPassword,
                role: 'guru',
                status: 'aktif'
              }
            });
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
            result.created++;
          }
        } catch (err) {
          console.error(`❌ Error syncing guru ${item.email}:`, err.message);
        }
      }
    }

    else if (module === 'siswa') {
      const kelasList = await prisma.kelas.findMany();
      const angkatanList = await prisma.angkatan.findMany();
      
      // We also need to map API's id_kelas and id_angkatan to NAMES
      const apiKelasRes = await sijuwanApi.getKelas({ per_page: 1000 });
      const apiKelasList = apiKelasRes.data.data || apiKelasRes.data || [];
      
      const apiAngkatanRes = await sijuwanApi.getAngkatan({ per_page: 1000 }).catch(() => ({ data: [] }));
      const apiAngkatanList = apiAngkatanRes.data.data || apiAngkatanRes.data || [];

      for (const item of items) {
        try {
          if (item.id) {
            const siswa = await prisma.siswa.findUnique({ where: { id: item.id }, include: { user: true } });
            await prisma.user.update({
              where: { id: siswa.userId },
              data: { namaLengkap: item.changes.nama?.new || siswa.user.namaLengkap }
            });
            result.updated++;
          } else {
            // Resolve relation IDs from API names to Local IDs
            const apiK = apiKelasList.find(k => k.id_kelas === item.id_kelas);
            const apiA = apiAngkatanList.find(a => a.id_angkatan === item.id_angkatan);
            
            const localK = kelasList.find(k => k.namaKelas === apiK?.nama_kelas);
            const localA = angkatanList.find(a => a.tahunAngkatan === Number(apiA?.tahun_angkatan));

            if (!localK || !localA) {
              console.warn(`⚠️ Skipping Siswa ${item.nama}: Kelas (${apiK?.nama_kelas || 'Not found in API'}) or Angkatan (${apiA?.tahun_angkatan || 'Not found in API'}) not found in local database.`);
              continue;
            }

            const user = await prisma.user.create({
              data: {
                email: item.email,
                namaLengkap: item.nama,
                password: defaultPassword,
                role: 'siswa',
                status: 'aktif'
              }
            });
            await prisma.siswa.create({
              data: {
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
        }
      }
    }

    return res.json({ success: true, result });
  } catch (err) {
    console.error(`Execute error [${module}]:`, err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
