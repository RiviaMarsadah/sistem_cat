import { useEffect, useState } from 'react';
import { FiFileText, FiPackage, FiCalendar, FiLayers } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import './GuruTheme.css';
import './Dashboard.css';

const GuruDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ringkasan, setRingkasan] = useState({
    totalNamaBankSoal: 0,
    totalSoalDiBankSoal: 0,
    totalPaketUjian: 0,
    totalJadwalUjian: 0,
  });

  useEffect(() => {
    const loadRingkasan = async () => {
      setLoading(true);
      setError('');
      try {
        const [koleksiRes, bankSoalRes, paketRes, jadwalCustomRes] = await Promise.all([
          api.get('/guru/bank-soal-koleksi'),
          api.get('/guru/bank-soal'),
          api.get('/guru/paket-ujian'),
          api.get('/guru/jadwal-ujian/custom'),
        ]);

        setRingkasan({
          totalNamaBankSoal: koleksiRes.data?.data?.length || 0,
          totalSoalDiBankSoal: bankSoalRes.data?.data?.length || 0,
          totalPaketUjian: paketRes.data?.data?.length || 0,
          totalJadwalUjian: jadwalCustomRes.data?.data?.length || 0,
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
          <p className="guru-subtitle">Ringkasan data ujian dan akses cepat menu utama</p>
        </div>
        <div className="guru-meta">
          <div className="guru-meta-card">
            <div className="guru-meta-label">Total Bank Soal</div>
            <div className="guru-meta-value">{loading ? '...' : ringkasan.totalNamaBankSoal}</div>
          </div>
        </div>
      </div>

      {error && <div className="dashboard-error">{error}</div>}

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

      <div className="quick-actions">
        <div className="section-header">
          <h2 className="section-title">Quick Actions</h2>
          <p className="section-subtitle">Akses cepat ke menu yang paling sering dipakai</p>
        </div>
        <div className="actions-grid">
          <Link to="/guru/bank-soal" className="action-card guru-action-card">
            <div className="action-icon-wrapper">
              <FiFileText className="action-icon" />
            </div>
            <span className="action-label">Bank Soal</span>
          </Link>
          <Link to="/guru/paket-ujian" className="action-card guru-action-card">
            <div className="action-icon-wrapper">
              <FiPackage className="action-icon" />
            </div>
            <span className="action-label">Paket Ujian</span>
          </Link>
          <Link to="/guru/jadwal-ujian" className="action-card guru-action-card">
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

export default GuruDashboard;

