import { useState, useEffect, useCallback } from 'react';
import {
  FiSearch,
  FiAlertCircle
} from 'react-icons/fi';
import api from '../services/api';
import './CekSiswa.css';

const CekSiswa = () => {
  // Pencarian Real-Time
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Fetch data pencarian real-time (Debounced)
  const performSearch = useCallback(async (query) => {
    if (!query || !query.trim()) {
      setSearchResults([]);
      setLoadingSearch(false);
      return;
    }
    setLoadingSearch(true);
    try {
      const res = await api.get(`/public/siswa/search-realtime?q=${encodeURIComponent(query)}`);
      if (res.data?.success) {
        setSearchResults(res.data.data);
      }
    } catch (err) {
      console.error('Gagal melakukan pencarian:', err);
    } finally {
      setLoadingSearch(false);
    }
  }, []);

  // Debouncing input pencarian
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      performSearch(searchQuery);
    }, 400); // delay 400ms

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, performSearch]);

  return (
    <div className="cek-page-container">
      <div className="cek-content-wrapper animate-fade-in">
        {/* Header Row: Minimal & Space-Saving */}
        <div className="cek-header-row">
          <div className="cek-brand-minimal">
            <img src="/gambar/logo_ateka.png" alt="Logo ATEKA" className="brand-logo-img" />
            <div className="brand-text-minimal">
              <h1 className="brand-title">Pencarian Data Siswa</h1>
              <p className="brand-subtitle">Cek status pendaftaran Nama, Email, & Kelas Anda</p>
            </div>
          </div>
        </div>

        {/* Unified Search and Results Box */}
        <div className="cek-main-card">
          {/* Compact Search Bar */}
          <div className="cek-search-section">
            <div className="glass-search-input-wrapper">
              <FiSearch className="search-box-icon" />
              <input
                type="text"
                placeholder="Cari berdasarkan Nama, Email, atau Kelas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-box-input"
              />
              {loadingSearch && <div className="search-input-spinner"></div>}
            </div>
          </div>

          {/* Compact Results Panel */}
          <div className="cek-results-panel">
            {searchQuery.trim() !== '' && (
              <div className="panel-header-minimal">
                <span className="results-count-badge">
                  {searchResults.length} Siswa Terdaftar Ditemukan
                </span>
              </div>
            )}

            {/* Empty State / Invitation (Common for both Desktop and Mobile) */}
            {searchQuery.trim() === '' && (
              <div className="empty-results-box-only">
                <div className="search-invitation-box">
                  <FiSearch className="invitation-icon" />
                  <span className="invitation-title">Mulai Pencarian Data Anda</span>
                  <span className="invitation-desc">
                    Silakan masukkan Nama Lengkap, Email, atau Kelas Anda pada kolom pencarian di atas untuk memverifikasi data.
                  </span>
                </div>
              </div>
            )}

            {/* Loading State (Common for both Desktop and Mobile) */}
            {searchQuery.trim() !== '' && loadingSearch && searchResults.length === 0 && (
              <div className="empty-results-box-only">
                <div className="table-loading-spinner-wrapper">
                  <div className="loading-spinner-cek"></div>
                  <span>Sedang memuat data...</span>
                </div>
              </div>
            )}

            {/* Empty Search Data Not Found State */}
            {searchQuery.trim() !== '' && !loadingSearch && searchResults.length === 0 && (
              <div className="empty-results-box-only">
                <div className="empty-info-box">
                  <FiAlertCircle className="empty-icon" />
                  <span>Data tidak ditemukan. Masukkan kata kunci lain.</span>
                </div>
              </div>
            )}

            {/* ==========================================================================
               DESKTOP VIEW: CLEAN PREMIUM TABLE (WITH NISN)
               ========================================================================== */}
            {searchQuery.trim() !== '' && searchResults.length > 0 && (
              <div className="desktop-view-container">
                <div className="table-responsive-container">
                  <table className="custom-premium-table">
                    <thead>
                      <tr>
                        <th>Nama Lengkap</th>
                        <th>Email</th>
                        <th>NISN</th>
                        <th>Kelas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResults.map((siswa) => (
                        <tr key={siswa.id} className="table-row-animate">
                          <td className="bold-text">{siswa.namaLengkap}</td>
                          <td>{siswa.email}</td>
                          <td className="code-text" style={{ fontFamily: 'monospace', fontWeight: '600' }}>{siswa.nisn}</td>
                          <td>
                            <span className="kelas-badge">{siswa.kelas}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ==========================================================================
               MOBILE VIEW: COMPACT CARD VIEW (HP & TABLETS)
               ========================================================================== */}
            {searchQuery.trim() !== '' && searchResults.length > 0 && (
              <div className="mobile-view-container">
                <div className="mobile-cards-stack">
                  {searchResults.map((siswa) => (
                    <div key={siswa.id} className="mobile-student-card table-row-animate">
                      {/* Card Header: Student Name */}
                      <div className="card-header-row" style={{ borderBottom: '1px solid rgba(226, 232, 240, 0.6)', paddingBottom: '8px', marginBottom: '8px' }}>
                        <h4 className="card-student-name" style={{ fontSize: '1.1rem', margin: 0, color: '#1e293b', fontWeight: '700' }}>{siswa.namaLengkap}</h4>
                      </div>

                      {/* Card Details: List of clean key-value rows */}
                      <div className="card-body-details">
                        <div className="card-detail-item" style={{ marginBottom: '6px' }}>
                          <span className="detail-label" style={{ fontSize: '13.5px', color: '#64748b' }}>Email</span>
                          <span className="detail-value text-muted" style={{ fontSize: '13.5px', color: '#334155' }}>{siswa.email}</span>
                        </div>
                        <div className="card-detail-item" style={{ marginBottom: '6px' }}>
                          <span className="detail-label" style={{ fontSize: '13.5px', color: '#64748b' }}>NISN</span>
                          <span className="detail-value text-code" style={{ fontSize: '13.5px', color: '#334155', fontFamily: 'monospace', fontWeight: '600' }}>{siswa.nisn}</span>
                        </div>
                        <div className="card-detail-item">
                          <span className="detail-label" style={{ fontSize: '13.5px', color: '#64748b' }}>Kelas</span>
                          <span className="detail-value">
                            <span className="kelas-badge">{siswa.kelas}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CekSiswa;
