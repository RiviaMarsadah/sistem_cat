import { useEffect, useState } from 'react';
import { FiBookOpen, FiUsers, FiUser, FiCalendar } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import './Dashboard.css';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ringkasan, setRingkasan] = useState({
    totalMapel: 0,
    totalKelas: 0,
    totalPengguna: 0,
    totalJadwal: 0,
  });

  useEffect(() => {
    const loadRingkasan = async () => {
      setLoading(true);
      setError('');
      try {
        const [mapelRes, kelasRes, siswaRes, guruRes, jadwalRes] = await Promise.all([
          api.get('/admin/mata-pelajaran'),
          api.get('/admin/kelas'),
          api.get('/admin/siswa'),
          api.get('/admin/guru'),
          api.get('/admin/jadwal-ujian/admin'),
        ]);
        const totalSiswa = siswaRes.data?.data?.length || 0;
        const totalGuru = guruRes.data?.data?.length || 0;

        setRingkasan({
          totalMapel: mapelRes.data?.data?.length || 0,
          totalKelas: kelasRes.data?.data?.length || 0,
          totalPengguna: totalSiswa + totalGuru,
          totalJadwal: jadwalRes.data?.data?.length || 0,
        });
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
      icon: FiUsers,
      path: '/admin/kelas',
    },
    {
      title: 'Total Pengguna',
      value: ringkasan.totalPengguna,
      icon: FiUser,
      path: '/admin/user',
    },
    {
      title: 'Jadwal Ujian',
      value: ringkasan.totalJadwal,
      icon: FiCalendar,
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

      {/* Quick Actions */}
      <div className="quick-actions">
        <div className="section-header">
          <h2 className="section-title">Quick Actions</h2>
          <p className="section-subtitle">Akses cepat ke fitur utama</p>
        </div>
        <div className="actions-grid">
          <Link to="/admin/mata-pelajaran" className="action-card admin-action-card">
            <div className="action-icon-wrapper">
              <FiBookOpen className="action-icon" />
            </div>
            <span className="action-label">Mata Pelajaran</span>
          </Link>
          <Link to="/admin/kelas" className="action-card admin-action-card">
            <div className="action-icon-wrapper">
              <FiUsers className="action-icon" />
            </div>
            <span className="action-label">Kelas</span>
          </Link>
          <Link to="/admin/user" className="action-card admin-action-card">
            <div className="action-icon-wrapper">
              <FiUser className="action-icon" />
            </div>
            <span className="action-label">Manajemen Admin</span>
          </Link>
          <Link to="/admin/jadwal-ujian" className="action-card admin-action-card">
            <div className="action-icon-wrapper">
              <FiCalendar className="action-icon" />
            </div>
            <span className="action-label">Jadwal Ujian</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

