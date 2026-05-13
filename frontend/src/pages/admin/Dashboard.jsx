import { useEffect, useState } from 'react';
import {
  FiBookOpen, FiUsers, FiUser, FiCalendar,
  FiUserPlus, FiUsers as FiUsersIcon, FiHome, FiGrid,
  FiLayers, FiAward, FiClock, FiActivity, FiCheckCircle,
  FiTrendingUp, FiBarChart2
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import './Dashboard.css';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ringkasan, setRingkasan] = useState({
    totalMapel: 0,
    totalKelas: 0,
    totalSiswa: 0,
    totalGuru: 0,
    totalAdmin: 0,
    totalJurusan: 0,
    totalAngkatan: 0,
    totalPeriode: 0,
    totalJadwal: 0,
    totalUjianDijalankan: 0,
  });
  const [periodeAktif, setPeriodeAktif] = useState(null);
  const [jadwalTerbaru, setJadwalTerbaru] = useState([]);
  const [siswaTerbaru, setSiswaTerbaru] = useState([]);
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const loadRingkasan = async () => {
      setLoading(true);
      setError('');
      try {
        const [mapelRes, kelasRes, siswaRes, guruRes, adminRes, jurusanRes, angkatanRes, periodeRes, jadwalRes, statsRes, chartRes] = await Promise.all([
          api.get('/admin/mata-pelajaran'),
          api.get('/admin/kelas'),
          api.get('/admin/siswa'),
          api.get('/admin/guru'),
          api.get('/admin/user'),
          api.get('/admin/jurusan'),
          api.get('/admin/angkatan'),
          api.get('/admin/periode'),
          api.get('/admin/jadwal-ujian/admin'),
          api.get('/admin/stats'),
          api.get('/admin/stats/charts'),
        ]);

        const statsData = statsRes.data?.data || {};
        setPeriodeAktif(statsData.periodeAktif || null);
        setJadwalTerbaru(statsData.jadwalTerbaru || []);
        setSiswaTerbaru(statsData.siswaTerbaru || []);
        setChartData(chartRes.data?.data || null);

        setRingkasan(prev => ({
          ...prev,
          totalMapel:     mapelRes.data?.data?.length || 0,
          totalKelas:     kelasRes.data?.data?.length || 0,
          totalSiswa:     siswaRes.data?.data?.length || 0,
          totalGuru:      guruRes.data?.data?.length || 0,
          totalAdmin:     adminRes.data?.data?.length || 0,
          totalJurusan:   jurusanRes.data?.data?.length || 0,
          totalAngkatan:  angkatanRes.data?.data?.length || 0,
          totalPeriode:    periodeRes.data?.data?.length || 0,
          totalJadwal:    jadwalRes.data?.data?.length || 0,
          totalUjianDijalankan: statsData.totalUjianDijalankan || 0,
        }));
      } catch (e) {
        setError(e?.response?.data?.message || 'Gagal memuat ringkasan dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadRingkasan();
  }, []);

  const stats = [
    {
      title: 'Mata Pelajaran',
      value: ringkasan.totalMapel,
      icon: FiBookOpen,
      path: '/admin/mata-pelajaran',
    },
    {
      title: 'Kelas',
      value: ringkasan.totalKelas,
      icon: FiUsersIcon,
      path: '/admin/kelas',
    },
    {
      title: 'Total Siswa',
      value: ringkasan.totalSiswa,
      icon: FiUserPlus,
      path: '/admin/siswa',
    },
    {
      title: 'Total Guru',
      value: ringkasan.totalGuru,
      icon: FiUsers,
      path: '/admin/guru',
    },
    {
      title: 'Total Admin',
      value: ringkasan.totalAdmin,
      icon: FiUser,
      path: '/admin/user',
    },
    {
      title: 'Jurusan',
      value: ringkasan.totalJurusan,
      icon: FiGrid,
      path: '/admin/jurusan',
    },
    {
      title: 'Angkatan',
      value: ringkasan.totalAngkatan,
      icon: FiHome,
      path: '/admin/angkatan',
    },
    {
      title: 'Periode Ujian',
      value: ringkasan.totalPeriode,
      icon: FiLayers,
      path: '/admin/jadwal-ujian',
    },
    {
      title: 'Jadwal Ujian',
      value: ringkasan.totalJadwal,
      icon: FiCalendar,
      path: '/admin/jadwal-ujian',
    },
    {
      title: 'Ujian Dijalankan',
      value: ringkasan.totalUjianDijalankan,
      icon: FiAward,
      path: '/admin/jadwal-ujian',
    },
  ];

  return (
    <div className="admin-dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title admin-title">
            <span className="title-text">Dashboard</span>
            <span className="title-badge admin-badge">Admin</span>
          </h1>
          <p className="page-subtitle">Ringkasan data utama dan akses cepat menu admin</p>
        </div>
      </div>

      {error && <div className="dashboard-error">{error}</div>}

      <div className="stats-grid">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} to={stat.path} className="stat-card admin-stat-card" style={{ animationDelay: `${index * 0.06}s` }}>
              <div className="stat-icon-wrapper">
                <Icon className="stat-icon" />
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{loading ? '...' : stat.value}</h3>
                <p className="stat-title">{stat.title}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Widgets Section */}
      <div className="widgets-section">
        <div className="widgets-grid">

          {/* Widget Periode Aktif */}
          <div className="widget-card">
            <div className="widget-header">
              <div className="widget-icon-wrapper">
                <FiActivity className="widget-icon" />
              </div>
              <h3 className="widget-title">Periode Ujian Aktif</h3>
            </div>
            <div className="widget-body">
              {loading ? (
                <div className="widget-loading">Memuat...</div>
              ) : periodeAktif ? (
                <div className="periode-info">
                  <div className="periode-nama">{periodeAktif.nama}</div>
                  <div className="periode-detail">
                    <span className="periode-badge">{periodeAktif.semester}</span>
                    <span className="periode-badge">{periodeAktif.tahunAjaran}</span>
                  </div>
                  <div className="periode-dates">
                    <FiClock size={12} />
                    <span>{new Date(periodeAktif.mulai).toLocaleDateString('id-ID')} — {new Date(periodeAktif.selesai).toLocaleDateString('id-ID')}</span>
                  </div>
                  <Link to="/admin/jadwal-ujian" className="widget-link">
                    Lihat Jadwal →
                  </Link>
                </div>
              ) : (
                <div className="widget-empty">
                  <FiCheckCircle size={28} className="empty-icon" />
                  <p>Tidak ada periode aktif saat ini</p>
                  <Link to="/admin/jadwal-ujian" className="widget-link">Buat Periode Baru →</Link>
                </div>
              )}
            </div>
          </div>

          {/* Widget Jadwal Ujian Terbaru */}
          <div className="widget-card">
            <div className="widget-header">
              <div className="widget-icon-wrapper">
                <FiCalendar className="widget-icon" />
              </div>
              <h3 className="widget-title">Jadwal Ujian Terbaru</h3>
              <Link to="/admin/jadwal-ujian" className="widget-see-all">Lihat Semua</Link>
            </div>
            <div className="widget-body">
              {loading ? (
                <div className="widget-loading">Memuat...</div>
              ) : jadwalTerbaru.length > 0 ? (
                <div className="widget-list">
                  {jadwalTerbaru.map(j => (
                    <div key={j.id} className="widget-list-item">
                      <div className="item-info">
                        <div className="item-primary">{j.nama}</div>
                        <div className="item-secondary">{j.namaMapel}</div>
                      </div>
                      <div className="item-date">
                        {new Date(j.mulai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="widget-empty">
                  <FiCalendar size={28} className="empty-icon" />
                  <p>Belum ada jadwal ujian</p>
                </div>
              )}
            </div>
          </div>

          {/* Widget Siswa Terbaru */}
          <div className="widget-card">
            <div className="widget-header">
              <div className="widget-icon-wrapper">
                <FiUserPlus className="widget-icon" />
              </div>
              <h3 className="widget-title">Siswa Terbaru</h3>
              <Link to="/admin/siswa" className="widget-see-all">Lihat Semua</Link>
            </div>
            <div className="widget-body">
              {loading ? (
                <div className="widget-loading">Memuat...</div>
              ) : siswaTerbaru.length > 0 ? (
                <div className="widget-list">
                  {siswaTerbaru.map(s => (
                    <div key={s.id} className="widget-list-item">
                      <div className="item-info">
                        <div className="item-primary">{s.nama}</div>
                        <div className="item-secondary">{s.kelas} · NIS: {s.nis}</div>
                      </div>
                      <div className="item-date">
                        {new Date(s.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="widget-empty">
                  <FiUserPlus size={28} className="empty-icon" />
                  <p>Belum ada siswa terdaftar</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Charts Section */}
      {!loading && chartData && (
        <div className="charts-section">
          <div className="section-header">
            <h2 className="section-title">
              <FiBarChart2 size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Statistik & Visualisasi
            </h2>
            <p className="section-subtitle">Distribusi data siswa dan aktivitas ujian</p>
          </div>

          <div className="charts-grid">
            {/* Chart: Siswa per Angkatan (Bar Chart) */}
            <div className="chart-card">
              <div className="chart-header">
                <h3 className="chart-title">Jumlah Siswa per Angkatan</h3>
              </div>
              <div className="chart-body">
                {chartData.siswaPerAngkatan && chartData.siswaPerAngkatan.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData.siswaPerAngkatan} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                        formatter={(value) => [`${value} siswa`, 'Jumlah']}
                      />
                      <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-empty">Belum ada data angkatan</div>
                )}
              </div>
            </div>

            {/* Chart: Distribusi Siswa per Tingkat (Pie Chart) */}
            <div className="chart-card">
              <div className="chart-header">
                <h3 className="chart-title">Distribusi Siswa per Tingkat</h3>
              </div>
              <div className="chart-body">
                {chartData.siswaPerTingkat && chartData.siswaPerTingkat.length > 0 ? (
                  <div className="pie-chart-wrapper">
                    <ResponsiveContainer width="55%" height={220}>
                      <PieChart>
                        <Pie
                          data={chartData.siswaPerTingkat}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {chartData.siswaPerTingkat.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                          formatter={(value, name) => [`${value} siswa`, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pie-legend">
                      {chartData.siswaPerTingkat.map((item, index) => (
                        <div key={item.name} className="legend-item">
                          <span className="legend-dot" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} />
                          <span className="legend-label">{item.name}</span>
                          <span className="legend-value">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="chart-empty">Belum ada data kelas</div>
                )}
              </div>
            </div>

            {/* Chart: Distribusi Nilai Ujian (Bar Chart) */}
            <div className="chart-card chart-wide">
              <div className="chart-header">
                <h3 className="chart-title">Distribusi Nilai Ujian</h3>
              </div>
              <div className="chart-body">
                {chartData.distribusiNilai && chartData.distribusiNilai.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData.distribusiNilai} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} label={{ value: 'Rentang Nilai', position: 'insideBottom', offset: -5, fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} label={{ value: 'Jumlah Siswa', angle: -90, position: 'insideLeft', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                        formatter={(value) => [`${value} siswa`, 'Jumlah']}
                      />
                      <Bar dataKey="jumlah" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={60} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-empty">Belum ada data nilai ujian</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

