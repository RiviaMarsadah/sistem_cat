const prisma = require('../config/prisma');

exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();

    // --- 1. Total Ujian Dijalankan ---
    const totalUjianDijalankan = await prisma.ujianSiswa.count({
      where: {
        status: { in: ['berlangsung', 'selesai'] }
      }
    });

    // --- 2. Periode Aktif (yang sedang berjalan) ---
    const periodeAktif = await prisma.periodeUjian.findFirst({
      where: {
        mulai: { lte: now },
        selesai: { gte: now }
      },
      orderBy: { mulai: 'desc' }
    });

    // --- 3. 5 Jadwal Ujian Terbaru ---
    const jadwalTerbaru = await prisma.jadwalUjian.findMany({
      where: { guruId: null },
      include: {
        mataPelajaran: true,
        periode: true
      },
      orderBy: { mulai: 'desc' },
      take: 5
    });

    // --- 4. 5 Siswa Terbaru ---
    const siswaTerbaru = await prisma.siswa.findMany({
      include: {
        user: { select: { namaLengkap: true } },
        kelas: { select: { namaKelas: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    return res.json({
      success: true,
      data: {
        totalUjianDijalankan,
        periodeAktif: periodeAktif ? {
          id: periodeAktif.id,
          nama: periodeAktif.nama,
          semester: periodeAktif.semester,
          tahunAjaran: periodeAktif.tahunAjaran,
          mulai: periodeAktif.mulai,
          selesai: periodeAktif.selesai
        } : null,
        jadwalTerbaru: jadwalTerbaru.map(j => ({
          id: j.id,
          nama: j.nama,
          namaMapel: j.mataPelajaran?.namaMapel || '-',
          namaPeriode: j.periode?.nama || '-',
          mulai: j.mulai,
          selesai: j.selesai
        })),
        siswaTerbaru: siswaTerbaru.map(s => ({
          id: s.id,
          nama: s.user?.namaLengkap || '-',
          nis: s.nis || '-',
          kelas: s.kelas?.namaKelas || '-',
          createdAt: s.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat statistik dashboard'
    });
  }
};

exports.getChartData = async (req, res) => {
  try {
    // --- Chart 1: Jumlah Siswa per Angkatan ---
    const angkatanData = await prisma.angkatan.findMany({
      include: {
        _count: {
          select: { siswa: true }
        }
      },
      orderBy: { tahunAngkatan: 'asc' }
    });

    // --- Chart 2: Distribusi Siswa per Tingkat Kelas ---
    const kelasData = await prisma.kelas.findMany({
      include: {
        _count: {
          select: { siswa: true }
        },
        jurusan: { select: { namaProdi: true } }
      },
      orderBy: { tingkat: 'asc' }
    });

    // Count siswa yang belum dikelas (kelasId = null)
    const siswaBelumDikelas = await prisma.siswa.count({
      where: { kelasId: null }
    });

    // Group by tingkat
    const siswaPerTingkat = {};
    kelasData.forEach(k => {
      const tingkat = k.tingkat;
      if (!siswaPerTingkat[tingkat]) {
        siswaPerTingkat[tingkat] = 0;
      }
      siswaPerTingkat[tingkat] += k._count.siswa;
    });

    // Tambahkan kategori "Belum Dikelas" jika ada
    if (siswaBelumDikelas > 0) {
      siswaPerTingkat['BELUM_DIKELAS'] = siswaBelumDikelas;
    }

    // --- Chart 3: Distribusi Nilai Ujian (Rentang Nilai) ---
    const ujianSelesai = await prisma.ujianSiswa.findMany({
      where: { status: 'selesai' },
      select: { nilaiAkhir: true }
    });

    // Kelompokkan nilai ke dalam rentang
    const nilaiRentang = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0
    };

    ujianSelesai.forEach(u => {
      const nilai = parseFloat(u.nilaiAkhir);
      if (nilai >= 0 && nilai <= 20) nilaiRentang['0-20']++;
      else if (nilai >= 21 && nilai <= 40) nilaiRentang['21-40']++;
      else if (nilai >= 41 && nilai <= 60) nilaiRentang['41-60']++;
      else if (nilai >= 61 && nilai <= 80) nilaiRentang['61-80']++;
      else if (nilai >= 81 && nilai <= 100) nilaiRentang['81-100']++;
    });

    return res.json({
      success: true,
      data: {
        siswaPerAngkatan: angkatanData.map(a => ({
          name: a.namaAngkatan,
          value: a._count.siswa
        })),
        siswaPerTingkat: Object.entries(siswaPerTingkat).map(([name, value]) => ({
          name: name === 'ALUMNI' ? 'Alumni' :
                name === 'KI' ? 'Kelas Industri' :
                name === 'BELUM_DIKELAS' ? 'Belum Dikelas' :
                `Kelas ${name}`,
          value
        })),
        distribusiNilai: Object.entries(nilaiRentang).map(([name, value]) => ({
          name,
          jumlah: value
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat data grafik'
    });
  }
};