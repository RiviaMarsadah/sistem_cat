import { useEffect, useState } from 'react';
import { 
  FiFileText, FiPackage, FiCalendar, FiLayers,
  FiActivity, FiCheckCircle, FiBarChart2, FiClock
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
import './GuruTheme.css';
import './Dashboard.css';

const getTingkatLabel = (tingkat) => {
  const map = { X: '10', XI: '11', XII: '12', ALUMNI: 'ALUMNI', KI: 'KI' };
  return map[tingkat] || tingkat;
};

const getNamaKelasDisplay = (kelas) => {
  if (!kelas || !kelas.tingkat || !kelas.jurusan || !kelas.inisial) return kelas?.namaKelas || '-';
  const kode = kelas.jurusan.kodeProdi || '';
  return `${getTingkatLabel(kelas.tingkat)} ${kode} ${kelas.inisial}`;
};

const GuruDashboard = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [ringkasan, setRingkasan] = useState({
    totalNamaBankSoal: 0,
    totalSoalDiBankSoal: 0,
    totalPaketUjian: 0,
    totalJadwalUjian: 0,
  });
  const [jadwalTerbaru, setJadwalTerbaru] = useState([]);
  const [chartData, setChartData] = useState({
    tipeSoal: [],
    soalPerKoleksi: []
  });

  useEffect(() => {
    const loadRingkasan = async () => {
      setLoading(true);
      try {
        const [koleksiRes, bankSoalRes, paketRes, jadwalCustomRes, jadwalRes] = await Promise.all([
          api.get('/guru/bank-soal-koleksi'),
          api.get('/guru/bank-soal'),
          api.get('/guru/paket-ujian'),
          api.get('/guru/jadwal-ujian/custom'),
          api.get('/guru/rekap/jadwal')
        ]);

        const allSoal = bankSoalRes.data?.data || [];
        const allKoleksi = koleksiRes.data?.data || [];
        const allJadwal = jadwalRes.data?.data || [];

        setRingkasan({
          totalNamaBankSoal: allKoleksi.length,
          totalSoalDiBankSoal: allSoal.length,
          totalPaketUjian: paketRes.data?.data?.length || 0,
          totalJadwalUjian: allJadwal.length,
        });

        // Widget: Jadwal Terbaru (Top 4)
        setJadwalTerbaru(allJadwal.slice(0, 4));

        // Chart 1: Tipe Soal
        let pilgan = 0, kompleks = 0, kategori = 0;
        allSoal.forEach(s => {
          if (s.kategoriSoal === 'pilgan') pilgan++;
          else if (s.kategoriSoal === 'pilgan_kompleks') kompleks++;
          else if (s.kategoriSoal === 'pilgan_kategori') kategori++;
        });
        const tipeSoal = [];
        if (pilgan > 0) tipeSoal.push({ name: 'Pilihan Ganda Sederhana', value: pilgan });
        if (kompleks > 0) tipeSoal.push({ name: 'Pilihan Ganda Kompleks', value: kompleks });
        if (kategori > 0) tipeSoal.push({ name: 'Pilihan Ganda Kategori', value: kategori });

        // Chart 2: Kerapatan Butir Soal per Koleksi
        const soalPerKoleksiMap = {};
        allSoal.forEach(s => {
          const kId = s.bankSoalKoleksiId;
          if (kId) {
            soalPerKoleksiMap[kId] = (soalPerKoleksiMap[kId] || 0) + 1;
          }
        });
        const perKoleksi = allKoleksi.map(k => ({
          name: k.nama,
          jumlah: soalPerKoleksiMap[k.id] || 0
        })).sort((a, b) => b.jumlah - a.jumlah).slice(0, 5); // top 5

        setChartData({
          tipeSoal,
          soalPerKoleksi: perKoleksi
        });
      } catch (e) {
        showToast(e?.response?.data?.message || 'Gagal memuat ringkasan dashboard', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadRingkasan();
  }, []);

  const stats = [
    {
      title: 'Total Bank Soal',
      value: ringkasan.totalNamaBankSoal,
      icon: FiLayers,
    },
    {
      title: 'Total Paket Ujian',
      value: ringkasan.totalPaketUjian,
      icon: FiPackage,
    },
    {
      title: 'Total Jadwal Ujian',
      value: ringkasan.totalJadwalUjian,
      icon: FiCalendar,
    },
    {
      title: 'Total Soal (Bank Soal)',
      value: ringkasan.totalSoalDiBankSoal,
      icon: FiFileText,
    },
  ];

  return (
    <div className="guru-page dashboard-page">
      <div className="guru-header guru-header-card">
        <div>
          <h1 className="guru-title">
            <span className="guru-title-text">Dashboard</span>
            <span className="guru-title-badge">Guru</span>
          </h1>
          <p className="guru-subtitle">Analisis performa kelas, sebaran nilai siswa, dan ringkasan aset bank soal Anda.</p>
        </div>
        <div className="guru-meta">
          <div className="guru-meta-card">
            <div className="guru-meta-label">Total Bank Soal</div>
            <div className="guru-meta-value">{loading ? '...' : ringkasan.totalNamaBankSoal}</div>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="stat-card guru-stat-card" style={{ animationDelay: `${index * 0.06}s` }}>
              <div className="stat-icon-wrapper">
                <Icon className="stat-icon" />
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{loading ? '...' : stat.value}</h3>
                <p className="stat-title">{stat.title}</p>
              </div>
            </div>
          );
        })}
      </div>


      {/* Widgets Section */}
      <div className="widgets-section" style={{ marginTop: '1.5rem' }}>
        <div className="widgets-grid">
          {/* Widget: Jadwal Ujian Terbaru */}
          <div className="widget-card">
            <div className="widget-header header-color-ujian">
              <div className="widget-icon-wrapper">
                <FiActivity className="widget-icon" />
              </div>
              <h3 className="widget-title">Ujian Aktif & Terbaru</h3>
              <Link to="/guru/rekap-ujian" className="widget-see-all">Buka Rekap</Link>
            </div>
            <div className="widget-body">
              {loading ? (
                <div className="widget-loading">Memuat...</div>
              ) : jadwalTerbaru.length > 0 ? (
                <div className="widget-list">
                  {jadwalTerbaru.map(j => {
                    const kelasStr = j.kelasJadwal?.map(kj => getNamaKelasDisplay(kj.kelas)).join(', ') || '-';
                    return (
                      <div key={j.id} className="widget-list-item">
                        <div className="item-info">
                          <div className="item-primary">{j.nama}</div>
                          <div className="item-secondary">{j.mataPelajaran?.namaMapel} • Kelas: {kelasStr}</div>
                        </div>
                        <div className="item-date">
                          {new Date(j.mulai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="widget-empty">
                  <FiCheckCircle size={28} className="empty-icon" />
                  <p>Tidak ada jadwal ujian terkini</p>
                  <Link to="/guru/jadwal-ujian" className="widget-link">Buat Ujian Mandiri →</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {!loading && (
        <div className="charts-section">
          <div className="section-header">
            <h2 className="section-title">
              <FiBarChart2 size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Analisis Aset Soal
            </h2>
            <p className="section-subtitle">Visualisasi distribusi aset soal dan keragaman koleksi</p>
          </div>

          <div className="charts-grid">
            {/* Chart: Distribusi Tipe Soal (Pie Chart) */}
            <div className="chart-card">
              <div className="chart-header header-color-tipe">
                <h3 className="chart-title">Distribusi Tipe Soal</h3>
              </div>
              <div className="chart-body">
                {chartData.tipeSoal.length > 0 ? (
                  <div className="pie-chart-wrapper">
                    <ResponsiveContainer width="55%" height={220}>
                      <PieChart>
                        <Pie
                          data={chartData.tipeSoal}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {chartData.tipeSoal.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                          formatter={(value, name) => [`${value} butir`, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pie-legend">
                      {chartData.tipeSoal.map((item, index) => (
                        <div key={item.name} className="legend-item">
                          <span className="legend-dot" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} />
                          <span className="legend-label">{item.name}</span>
                          <span className="legend-value">: {item.value} butir</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="chart-empty">Belum ada butir soal</div>
                )}
              </div>
            </div>

            {/* Chart: Jumlah Soal per Koleksi (Bar Chart) */}
            <div className="chart-card">
              <div className="chart-header header-color-koleksi">
                <h3 className="chart-title">Kerapatan Koleksi Soal (Top 5)</h3>
              </div>
              <div className="chart-body">
                {chartData.soalPerKoleksi.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData.soalPerKoleksi} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => val.length > 10 ? val.substring(0,10)+'...' : val} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                        formatter={(value) => [`${value} butir`, 'Jumlah Soal']}
                      />
                      <Bar dataKey="jumlah" fill="#1b3a6b" radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-empty">Belum ada koleksi soal</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuruDashboard;

