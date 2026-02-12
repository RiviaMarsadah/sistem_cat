import { FiBookOpen, FiUsers, FiUser, FiCalendar, FiFileText } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const AdminDashboard = () => {
  // Statistik (sementara hardcoded, nanti akan dari API)
  const stats = [
    {
      title: 'Mata Pelajaran',
      value: 0,
      icon: FiBookOpen,
      color: '#20b2aa',
      path: '/admin/mata-pelajaran',
    },
    {
      title: 'Kelas',
      value: 0,
      icon: FiUsers,
      color: '#87ceeb',
      path: '/admin/kelas',
    },
    {
      title: 'Siswa',
      value: 0,
      icon: FiUser,
      color: '#9b59b6',
      path: '/admin/siswa',
    },
    {
      title: 'Guru',
      value: 2,
      icon: FiUser,
      color: '#e74c3c',
      path: '/admin/guru',
    },
    {
      title: 'Jadwal Ujian',
      value: 0,
      icon: FiCalendar,
      color: '#f39c12',
      path: '/admin/jadwal-ujian',
    },
  ];

  return (
    <div className="admin-dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Ringkasan data dan aktivitas sistem</p>
        </div>
      </div>

      {/* Statistik Cards */}
      <div className="stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} to={stat.path} className="stat-card">
              <div className="stat-card-shine"></div>
              <div className="stat-icon" style={{ background: `${stat.color}15`, color: stat.color }}>
                <Icon />
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stat.value}</h3>
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
          <Link to="/admin/mata-pelajaran" className="action-card">
            <FiBookOpen className="action-icon" />
            <span className="action-label">Tambah Mata Pelajaran</span>
          </Link>
          <Link to="/admin/kelas" className="action-card">
            <FiUsers className="action-icon" />
            <span className="action-label">Tambah Kelas</span>
          </Link>
          <Link to="/admin/siswa" className="action-card">
            <FiUser className="action-icon" />
            <span className="action-label">Tambah Siswa</span>
          </Link>
          <Link to="/admin/guru" className="action-card">
            <FiUser className="action-icon" />
            <span className="action-label">Tambah Guru</span>
          </Link>
          <Link to="/admin/jadwal-ujian" className="action-card">
            <FiCalendar className="action-icon" />
            <span className="action-label">Buat Jadwal Ujian</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

