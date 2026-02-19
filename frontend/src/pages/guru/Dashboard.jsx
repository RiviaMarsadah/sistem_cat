import { FiFileText, FiPackage, FiActivity, FiTrendingUp, FiClock } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const GuruDashboard = () => {
  // Statistik (sementara hardcoded, nanti akan dari API)
  const aktifPaket = 0;
  const totalPaket = 0;
  const selesaiPaket = 0;
  const totalSoal = 0;

  const stats = [
    {
      title: 'Ujian Aktif',
      value: aktifPaket,
      icon: FiActivity,
    },
    {
      title: 'Total Paket Ujian',
      value: totalPaket,
      icon: FiPackage,
    },
    {
      title: 'Ujian Selesai',
      value: selesaiPaket,
      icon: FiClock,
    },
    {
      title: 'Total Soal',
      value: totalSoal,
      icon: FiFileText,
    },
  ];

  return (
    <div className="guru-dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title guru-title">
            <span className="title-text">Dashboard</span>
            <span className="title-badge guru-badge">Guru</span>
          </h1>
          <p className="page-subtitle">Ringkasan aktivitas dan ujian Anda</p>
        </div>
      </div>

      {/* Statistik Cards */}
      <div className="stats-grid">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="stat-card guru-stat-card" style={{ animationDelay: `${index * 0.1}s` }}>
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
            </div>
          );
        })}
      </div>

      {/* Ujian Aktif */}
      <div className="ujian-section">
        <div className="section-header">
          <h2 className="section-title">Ujian Aktif</h2>
          <p className="section-subtitle">Daftar ujian yang sedang berlangsung</p>
        </div>
        <div className="empty-state">
          <FiActivity className="empty-icon" />
          <p>Tidak ada ujian aktif saat ini</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <div className="section-header">
          <h2 className="section-title">Quick Actions</h2>
          <p className="section-subtitle">Akses cepat ke fitur utama</p>
        </div>
        <div className="actions-grid">
          <Link to="/guru/bank-soal" className="action-card guru-action-card">
            <div className="action-icon-wrapper">
              <FiFileText className="action-icon" />
            </div>
            <span className="action-label">Tambah Soal</span>
          </Link>
          <Link to="/guru/paket-ujian" className="action-card guru-action-card">
            <div className="action-icon-wrapper">
              <FiPackage className="action-icon" />
            </div>
            <span className="action-label">Buat Paket Ujian</span>
          </Link>
          <Link to="/guru/monitoring" className="action-card guru-action-card">
            <div className="action-icon-wrapper">
              <FiActivity className="action-icon" />
            </div>
            <span className="action-label">Monitoring Ujian</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GuruDashboard;

