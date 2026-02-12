import { FiFileText, FiPackage, FiActivity } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const GuruDashboard = () => {
  // Statistik (sementara hardcoded, nanti akan dari API)
  const aktifPaket = 0;
  const totalPaket = 0;
  const selesaiPaket = 0;

  return (
    <div className="guru-dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Ringkasan aktivitas dan ujian Anda</p>
        </div>
      </div>

      {/* Statistik Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-shine"></div>
          <div className="stat-icon" style={{ background: '#20b2aa15', color: '#20b2aa' }}>
            <FiActivity />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{aktifPaket}</h3>
            <p className="stat-title">Ujian Aktif</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-shine"></div>
          <div className="stat-icon" style={{ background: '#87ceeb15', color: '#87ceeb' }}>
            <FiPackage />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{totalPaket}</h3>
            <p className="stat-title">Total Paket Ujian</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-shine"></div>
          <div className="stat-icon" style={{ background: '#9b59b615', color: '#9b59b6' }}>
            <FiFileText />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{selesaiPaket}</h3>
            <p className="stat-title">Ujian Selesai</p>
          </div>
        </div>
      </div>

      {/* Ujian Aktif */}
      <div className="ujian-section">
        <div className="section-header">
          <h2 className="section-title">Ujian Aktif</h2>
          <p className="section-subtitle">Daftar ujian yang sedang berlangsung</p>
        </div>
        <div className="empty-state">
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
          <Link to="/guru/bank-soal" className="action-card">
            <FiFileText className="action-icon" />
            <span className="action-label">Tambah Soal</span>
          </Link>
          <Link to="/guru/paket-ujian" className="action-card">
            <FiPackage className="action-icon" />
            <span className="action-label">Buat Paket Ujian</span>
          </Link>
          <Link to="/guru/monitoring" className="action-card">
            <FiActivity className="action-icon" />
            <span className="action-label">Monitoring Ujian</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GuruDashboard;

