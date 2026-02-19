import { FiBookOpen, FiUsers, FiUser, FiCalendar, FiFileText, FiTrendingUp } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const AdminDashboard = () => {
  // Statistik (sementara hardcoded, nanti akan dari API)
  const stats = [
    {
      title: 'Mata Pelajaran',
      value: 0,
      icon: FiBookOpen,
      path: '/admin/mata-pelajaran',
    },
    {
      title: 'Kelas',
      value: 0,
      icon: FiUsers,
      path: '/admin/kelas',
    },
    {
      title: 'Siswa',
      value: 0,
      icon: FiUser,
      path: '/admin/siswa',
    },
    {
      title: 'Guru',
      value: 2,
      icon: FiUser,
      path: '/admin/guru',
    },
    {
      title: 'Jadwal Ujian',
      value: 0,
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
          <p className="page-subtitle">Ringkasan data dan aktivitas sistem</p>
        </div>
      </div>

      {/* Statistik Cards */}
      <div className="stats-grid">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} to={stat.path} className="stat-card admin-stat-card" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="stat-icon-wrapper">
                <Icon className="stat-icon" />
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stat.value}</h3>
                <p className="stat-title">{stat.title}</p>
              </div>
              <div className="stat-arrow">
                <FiTrendingUp />
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
            <span className="action-label">Tambah Mata Pelajaran</span>
          </Link>
          <Link to="/admin/kelas" className="action-card admin-action-card">
            <div className="action-icon-wrapper">
              <FiUsers className="action-icon" />
            </div>
            <span className="action-label">Tambah Kelas</span>
          </Link>
          <Link to="/admin/siswa" className="action-card admin-action-card">
            <div className="action-icon-wrapper">
              <FiUser className="action-icon" />
            </div>
            <span className="action-label">Tambah Siswa</span>
          </Link>
          <Link to="/admin/guru" className="action-card admin-action-card">
            <div className="action-icon-wrapper">
              <FiUser className="action-icon" />
            </div>
            <span className="action-label">Tambah Guru</span>
          </Link>
          <Link to="/admin/jadwal-ujian" className="action-card admin-action-card">
            <div className="action-icon-wrapper">
              <FiCalendar className="action-icon" />
            </div>
            <span className="action-label">Buat Jadwal Ujian</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

