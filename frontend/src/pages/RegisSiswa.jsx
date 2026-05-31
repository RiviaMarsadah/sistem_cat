import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiSearch, 
  FiUser, 
  FiMail, 
  FiLock, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiBookOpen, 
  FiUserPlus, 
  FiHash, 
  FiInbox,
  FiGlobe,
  FiCalendar
} from 'react-icons/fi';
import api from '../services/api';
import './RegisSiswa.css';

const RegisSiswa = () => {
  const navigate = useNavigate();

  // Tab State: 'search' atau 'register'
  const [activeTab, setActiveTab] = useState('search');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  const [searchError, setSearchError] = useState('');

  // Dropdown Lists (fetched from DB)
  const [classesList, setClassesList] = useState([]);
  const [religionsList, setReligionsList] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    namaLengkap: '',
    email: '',
    nis: '',
    nisn: '',
    kelasId: '',
    agama: '',
    customAgama: '',
    password: ''
  });
  const [showCustomAgama, setShowCustomAgama] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // OTP State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Fetch classes and religions list on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [resClasses, resReligions] = await Promise.all([
          api.get('/public/classes'),
          api.get('/public/religions')
        ]);
        if (resClasses.data?.success) {
          const filteredClasses = resClasses.data.data.filter((c) => {
            const className = (c.namaLengkapKelas || c.namaKelas || c.name || '').toUpperCase();
            return !className.includes('ALUMNI');
          });
          setClassesList(filteredClasses);
        }
        if (resReligions.data?.success) {
          setReligionsList(resReligions.data.data);
        }
      } catch (err) {
        console.error('Gagal mengambil metadata registrasi:', err);
      }
    };
    fetchMetadata();
  }, []);

  // Handle Input Changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (name === 'agama') {
      if (value === '__custom__') {
        setShowCustomAgama(true);
      } else {
        setShowCustomAgama(false);
        setFormData((prev) => ({ ...prev, customAgama: '' }));
      }
    }
  };

  // 1. Action: Exact Search Student
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchError('Masukkan nama lengkap atau email Anda');
      return;
    }

    setSearchLoading(true);
    setSearchError('');
    setSearchResult(null);
    setSearchMessage('');

    try {
      const res = await api.post('/public/siswa/search', { query: searchQuery });
      setSearchLoading(false);
      if (res.data?.success) {
        if (res.data.data) {
          setSearchResult(res.data.data);
        } else {
          setSearchMessage(res.data.message || 'Siswa tidak ditemukan.');
        }
      } else {
        setSearchError(res.data?.message || 'Gagal mencari data.');
      }
    } catch (err) {
      setSearchLoading(false);
      setSearchError(err.response?.data?.message || 'Terjadi kesalahan saat memproses pencarian.');
    }
  };

  // 2. Action: Request OTP Registration
  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess('');

    // Validasi input
    if (!formData.namaLengkap.trim()) return setRegisterError('Nama lengkap wajib diisi');
    if (!formData.email.trim()) return setRegisterError('Email wajib diisi');
    if (!formData.kelasId) return setRegisterError('Silakan pilih kelas Anda');
    if (!formData.agama) return setRegisterError('Silakan pilih agama Anda');
    if (formData.agama === '__custom__' && !formData.customAgama.trim()) {
      return setRegisterError('Silakan masukkan agama baru Anda');
    }

    // Tampilkan modal konfirmasi data
    setShowConfirmModal(true);
  };

  // 2B. Action: Submit Registration to Server
  const submitRegistration = async () => {
    setShowConfirmModal(false);
    setRegisterLoading(true);
    setRegisterError('');
    setRegisterSuccess('');

    const finalAgama = formData.agama === '__custom__' ? formData.customAgama.trim() : formData.agama;

    try {
      const res = await api.post('/public/siswa/register/request', {
        namaLengkap: formData.namaLengkap,
        email: formData.email,
        nis: formData.nis,
        nisn: formData.nisn,
        kelasId: formData.kelasId,
        agama: finalAgama
      });

      setRegisterLoading(false);

      if (res.data?.success) {
        setOtpCode('');
        setOtpError('');
        setShowOtpModal(true);
      } else {
        setRegisterError(res.data?.message || 'Registrasi gagal. Coba lagi.');
      }
    } catch (err) {
      setRegisterLoading(false);
      setRegisterError(err.response?.data?.message || 'Terjadi kesalahan sistem pendaftaran.');
    }
  };

  // 3. Action: Verify OTP & Save Student
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setOtpError('Masukkan 6 digit kode OTP');
      return;
    }
    if (otpCode.trim().length !== 6) {
      setOtpError('Kode OTP harus berisi 6 digit angka');
      return;
    }

    setOtpLoading(true);
    setOtpError('');

    try {
      const res = await api.post('/public/siswa/register/verify', {
        email: formData.email,
        otp: otpCode.trim()
      });

      setOtpLoading(false);

      if (res.data?.success) {
        setShowOtpModal(false);
        setRegisterSuccess(res.data.message || 'Registrasi Berhasil!');
        // Reset form
        setFormData({
          namaLengkap: '',
          email: '',
          nis: '',
          nisn: '',
          kelasId: '',
          agama: '',
          customAgama: '',
          password: ''
        });
        setShowCustomAgama(false);
      } else {
        setOtpError(res.data?.message || 'Verifikasi OTP gagal.');
      }
    } catch (err) {
      setOtpLoading(false);
      setOtpError(err.response?.data?.message || 'Kode OTP tidak cocok atau sudah kedaluwarsa.');
    }
  };

  const selectedClassName = classesList.find(c => String(c.id) === String(formData.kelasId))?.namaLengkapKelas || '';
  const finalAgamaValue = formData.agama === '__custom__' ? formData.customAgama : formData.agama;

  return (
    <div className="regis-page-container">
      {/* Background decoration elements */}
      <div className="decor-circle decor-1"></div>
      <div className="decor-circle decor-2"></div>

      <div className="regis-card-wrapper">
        {/* Brand Header */}
        <div className="regis-brand-header">
          <div className="regis-icon-logo">
            <img src="/gambar/logo_ateka.png" alt="ATEKA CAT Logo" className="regis-logo-img" />
          </div>
          <div className="regis-title-group">
            <h1 className="regis-main-title">ATEKA</h1>
            <p className="regis-sub-title">Sistem Pendaftaran Mandiri ATEKA CAT</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="regis-tabs-container">
          <button 
            className={`regis-tab-btn ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('search');
              setRegisterError('');
              setRegisterSuccess('');
            }}
          >
            <FiSearch className="tab-icon" />
            <span>Cari Siswa</span>
          </button>
          <button 
            className={`regis-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('register');
              setSearchError('');
              setSearchResult(null);
              setSearchMessage('');
            }}
          >
            <FiUserPlus className="tab-icon" />
            <span>Registrasi Baru</span>
          </button>
        </div>

        {/* Card Body */}
        <div className="regis-card-body">
          {/* TAB 1: SEARCH STUDENT */}
          {activeTab === 'search' && (
            <div className="search-tab-content">
              <h2 className="section-tab-title">Periksa Status Pendaftaran Anda</h2>
              <p className="section-tab-subtitle">
                Masukkan Nama Lengkap atau Alamat Email Anda secara lengkap dan persis untuk memeriksa status atau melihat data detail Anda.
              </p>

              <form onSubmit={handleSearch} className="search-form-centered">
                <div className="search-input-group">
                  <FiSearch className="search-bar-icon" />
                  <input 
                    type="text" 
                    placeholder="Contoh: Andhika Pratama atau andhika@school.com"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-main-input"
                  />
                  <button type="submit" className="search-submit-btn" disabled={searchLoading}>
                    {searchLoading ? 'Mencari...' : 'Cari'}
                  </button>
                </div>
                {searchError && (
                  <div className="error-alert-banner">
                    <FiAlertCircle className="alert-banner-icon" />
                    <span>{searchError}</span>
                  </div>
                )}
              </form>

              {/* Search Result Display */}
              {searchLoading && (
                <div className="search-loading-spinner-wrapper">
                  <div className="loading-spinner-regis"></div>
                  <p>Mencari data siswa di database...</p>
                </div>
              )}

              {searchMessage && (
                <div className="info-alert-banner">
                  <FiAlertCircle className="alert-banner-icon" />
                  <span>{searchMessage}</span>
                </div>
              )}

              {searchResult && (
                <div className="search-result-card animate-fade-in">
                  {/* Premium SaaS Header Banner */}
                  <div className="result-card-banner"></div>

                  {/* Overlapping Profile Header */}
                  <div className="result-header-floating">
                    <div className="avatar-floating">
                      <FiUser />
                    </div>
                    <div className="result-header-text">
                      <h3>{searchResult.user?.namaLengkap}</h3>
                      <p><FiMail className="email-icon-inline" /> {searchResult.user?.email}</p>
                    </div>

                  </div>

                  {/* High-fidelity detail grid */}
                  <div className="result-details-grid">
                    <div className="detail-item">
                      <div className="detail-icon-box">
                        <FiHash />
                      </div>
                      <div className="detail-content">
                        <span className="detail-label">NIS (Nomor Induk Siswa)</span>
                        <span className="detail-value">{searchResult.nis || 'Belum diatur (N/A)'}</span>
                      </div>
                    </div>

                    <div className="detail-item">
                      <div className="detail-icon-box">
                        <FiHash />
                      </div>
                      <div className="detail-content">
                        <span className="detail-label">NISN</span>
                        <span className="detail-value">{searchResult.nisn || 'Belum diatur (N/A)'}</span>
                      </div>
                    </div>

                    <div className="detail-item">
                      <div className="detail-icon-box">
                        <FiBookOpen />
                      </div>
                      <div className="detail-content">
                        <span className="detail-label">Kelas Terdaftar</span>
                        <span className="detail-value">
                          {searchResult.kelas 
                            ? `${searchResult.kelas.tingkat} ${searchResult.kelas.jurusan?.namaProdi || ''} ${searchResult.kelas.inisial}`.replace(/\s+/g, ' ').trim()
                            : 'Belum diatur (N/A)'}
                        </span>
                      </div>
                    </div>

                    <div className="detail-item">
                      <div className="detail-icon-box">
                        <FiGlobe />
                      </div>
                      <div className="detail-content">
                        <span className="detail-label">Agama</span>
                        <span className="detail-value">{searchResult.agama || 'Belum diatur (N/A)'}</span>
                      </div>
                    </div>

                    <div className="detail-item">
                      <div className="detail-icon-box">
                        <FiLock />
                      </div>
                      <div className="detail-content">
                        <span className="detail-label">Metode Autentikasi</span>
                        <span className="detail-value">
                          {searchResult.user?.googleLinked ? 'Akun Google Terhubung' : 'Kata Sandi Sistem'}
                        </span>
                      </div>
                    </div>

                    <div className="detail-item">
                      <div className="detail-icon-box">
                        <FiCalendar />
                      </div>
                      <div className="detail-content">
                        <span className="detail-label">Tanggal Terdaftar</span>
                        <span className="detail-value">
                          {searchResult.user?.createdAt 
                            ? new Date(searchResult.user.createdAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })
                            : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REGISTER STUDENT */}
          {activeTab === 'register' && (
            <div className="register-tab-content animate-fade-in">
              <h2 className="section-tab-title">Formulir Registrasi Akun Mandiri</h2>
              <p className="section-tab-subtitle">
                Isi seluruh data berikut secara lengkap dan benar. Setelah mendaftar, Anda wajib memverifikasi akun menggunakan OTP email.
              </p>

              {registerError && (
                <div className="error-alert-banner">
                  <FiAlertCircle className="alert-banner-icon" />
                  <span>{registerError}</span>
                </div>
              )}

              {registerSuccess && (
                <div className="success-alert-banner">
                  <FiCheckCircle className="alert-banner-icon" />
                  <span>{registerSuccess}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="register-grid-form">
                {/* 1. Nama Lengkap */}
                <div className="form-input-container">
                  <label className="form-field-label">Nama Lengkap Siswa *</label>
                  <div className="form-input-icon-wrapper">
                    <FiUser className="input-field-icon" />
                    <input 
                      type="text" 
                      name="namaLengkap"
                      placeholder="Masukkan nama lengkap Anda"
                      value={formData.namaLengkap}
                      onChange={handleInputChange}
                      className="form-main-input"
                      required
                    />
                  </div>
                </div>

                {/* 2. Email */}
                <div className="form-input-container">
                  <label className="form-field-label">Alamat Email Aktif *</label>
                  <div className="form-input-icon-wrapper">
                    <FiMail className="input-field-icon" />
                    <input 
                      type="email" 
                      name="email"
                      placeholder="contoh@gmail.com (Untuk OTP)"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="form-main-input"
                      required
                    />
                  </div>
                </div>

                {/* 3. Kelas (Dynamic Dropdown) */}
                <div className="form-input-container">
                  <label className="form-field-label">Kelas Terdaftar *</label>
                  <div className="form-input-icon-wrapper">
                    <FiBookOpen className="input-field-icon" />
                    <select
                      name="kelasId"
                      value={formData.kelasId}
                      onChange={handleInputChange}
                      className="form-main-select"
                      required
                    >
                      <option value="">-- Pilih Kelas --</option>
                      {classesList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.namaLengkapKelas}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 4. Agama (Dropdown + Custom) */}
                <div className="form-input-container">
                  <label className="form-field-label">Agama *</label>
                  <div className="form-input-icon-wrapper">
                    <FiGlobe className="input-field-icon" />
                    <select
                      name="agama"
                      value={formData.agama}
                      onChange={handleInputChange}
                      className="form-main-select"
                      required
                    >
                      <option value="">-- Agama --</option>
                      {religionsList.map((r, idx) => (
                        <option key={idx} value={r}>
                          {r}
                        </option>
                      ))}
                      <option value="__custom__">-- Input Agama Lainnya --</option>
                    </select>
                  </div>
                </div>

                {/* 4B. Input Agama Baru (Conditional) */}
                {showCustomAgama && (
                  <div className="form-input-container grid-span-2 animate-slide-down">
                    <label className="form-field-label">Masukkan Agama Baru Anda *</label>
                    <div className="form-input-icon-wrapper">
                      <FiGlobe className="input-field-icon" />
                      <input 
                        type="text" 
                        name="customAgama"
                        placeholder="Contoh: Konghucu / Aliran Kepercayaan"
                        value={formData.customAgama}
                        onChange={handleInputChange}
                        className="form-main-input"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* 5. NIS (Opsional) */}
                <div className="form-input-container">
                  <label className="form-field-label">NIS (Nomor Induk Siswa) - Opsional</label>
                  <div className="form-input-icon-wrapper">
                    <FiHash className="input-field-icon" />
                    <input 
                      type="text" 
                      name="nis"
                      placeholder="Masukkan NIS Anda"
                      value={formData.nis}
                      onChange={handleInputChange}
                      className="form-main-input"
                    />
                  </div>
                </div>

                {/* 6. NISN (Opsional) */}
                <div className="form-input-container">
                  <label className="form-field-label">NISN (Nomor Induk Siswa Nasional) - Opsional</label>
                  <div className="form-input-icon-wrapper">
                    <FiHash className="input-field-icon" />
                    <input 
                      type="text" 
                      name="nisn"
                      placeholder="Masukkan NISN Anda"
                      value={formData.nisn}
                      onChange={handleInputChange}
                      className="form-main-input"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <div className="form-btn-submit-container grid-span-2">
                  <button 
                    type="submit" 
                    className="form-register-submit-btn"
                    disabled={registerLoading}
                  >
                    {registerLoading ? 'Mengirim OTP...' : 'Daftar Sekarang'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

      </div>

      {/* CONFIRMATION DATA REVIEW MODAL */}
      {showConfirmModal && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-box animate-scale-up">
            <div className="confirm-modal-header">
              <h3>Konfirmasi Data Anda</h3>
              <p className="confirm-modal-desc">
                Apakah data pendaftaran Anda di bawah ini sudah benar? 
                Mohon periksa kembali agar email verifikasi OTP dikirimkan dengan benar.
              </p>
            </div>

            <div className="confirm-table-container">
              <div className="confirm-row">
                <span className="confirm-label">Nama Lengkap</span>
                <span className="confirm-value">{formData.namaLengkap}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-label">Alamat Email</span>
                <span className="confirm-value">{formData.email}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-label">Kelas</span>
                <span className="confirm-value">{selectedClassName}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-label">Agama</span>
                <span className="confirm-value">{finalAgamaValue}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-label">NIS</span>
                <span className="confirm-value">{formData.nis.trim() || '- (Tidak Diisi)'}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-label">NISN</span>
                <span className="confirm-value">{formData.nisn.trim() || '- (Tidak Diisi)'}</span>
              </div>
            </div>

            <div className="confirm-modal-actions">
              <button 
                type="button" 
                className="confirm-back-btn"
                onClick={() => setShowConfirmModal(false)}
              >
                Periksa Kembali
              </button>
              <button 
                type="button" 
                className="confirm-submit-btn"
                onClick={submitRegistration}
              >
                Ya, Kirim Kode OTP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTP VERIFICATION MODAL DIALOG */}
      {showOtpModal && (
        <div className="otp-modal-overlay">
          <div className="otp-modal-box animate-scale-up">
            <div className="otp-modal-icon-wrapper">
              <FiInbox className="otp-mailbox-icon" />
            </div>
            <h3>Verifikasi Email Anda</h3>
            <p className="otp-modal-desc">
              Kami telah mengirimkan 6 digit Kode OTP ke alamat email <strong>{formData.email}</strong>. 
              Silakan masukkan kode tersebut di bawah untuk mengaktifkan akun Anda.
            </p>

            {otpError && (
              <div className="error-alert-banner">
                <FiAlertCircle className="alert-banner-icon" />
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="otp-modal-form">
              <input 
                type="text" 
                maxLength="6"
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="otp-digits-input"
                autoFocus
              />
              
              <div className="otp-modal-actions">
                <button 
                  type="submit" 
                  className="otp-verify-btn" 
                  disabled={otpLoading}
                >
                  {otpLoading ? 'Memverifikasi...' : 'Verifikasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisSiswa;
