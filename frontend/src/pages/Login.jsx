import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiBookOpen } from 'react-icons/fi';
import api from '../services/api';
import './Login.css';

const Login = () => {
  // state untuk error message dan loading status
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // hooks untuk navigasi dan ambil parameter dari URL
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuthUser } = useAuth();

  // disable scroll body pas halaman login muncul
  useEffect(() => {
    document.body.classList.add('login-page-active');
    
    return () => {
      // balikin scroll pas komponen di-unmount
      document.body.classList.remove('login-page-active');
    };
  }, []);

  // handle callback dari OAuth Google
  useEffect(() => {
    const token = searchParams.get('token');
    const errorParam = searchParams.get('error');
    const emailParam = searchParams.get('email');

    // cek kalau ada error dari callback
    if (errorParam) {
      if (errorParam === 'email_not_registered') {
        setError(`Email ${emailParam ? decodeURIComponent(emailParam) : ''} belum terdaftar. Hubungi admin untuk mendaftarkan akun Anda.`);
      } else if (errorParam === 'oauth_failed') {
        setError('Gagal melakukan autentikasi dengan Google. Silakan coba lagi.');
      } else if (errorParam === 'oauth_init_failed') {
        setError('Gagal memulai proses autentikasi. Silakan coba lagi.');
      } else {
        setError('Terjadi kesalahan saat login. Silakan coba lagi.');
      }
    }

    // kalau ada token, simpan dan ambil profil user
    if (token) {
      localStorage.setItem('token', token);
      
      // ambil data profil user dari API
      api.get('/auth/profile')
        .then(response => {
          const user = response.data.user;
          localStorage.setItem('user', JSON.stringify(user));
          setAuthUser(user);
          
          // redirect sesuai role user
          if (user.role === 'admin') {
            navigate('/admin/dashboard');
          } else if (user.role === 'guru') {
            navigate('/guru/dashboard');
          } else {
            navigate('/');
          }
        })
        .catch(err => {
          console.error('Failed to get profile:', err);
          setError('Gagal memuat profil pengguna.');
        });
    }
  }, [searchParams, navigate, setAuthUser]);

  // fungsi untuk handle klik tombol login Google
  const handleGoogleLogin = () => {
    setLoading(true);
    setError('');
    
    // redirect ke backend untuk mulai OAuth flow
    const apiUrl = import.meta.env.VITE_API_URL;
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <>
      <div className="login-container">
        <div className="login-card-large">
          {/* bagian kiri: gambar sekolah */}
          <div className="login-left-section">
            <div className="login-image-wrapper">
              <img 
                src="/gambar/sekolah.png" 
                alt="SMK Negeri Jawa Tengah" 
                className="login-school-image"
                onError={(e) => {
                  // pakai gambar fallback kalau gambar utama gagal load
                  e.target.src = "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&q=80";
                }}
              />
              <div className="login-image-overlay">
                {/* overlay untuk efek gradient */}
              </div>
              <div className="login-logo-overlay">
                <div className="login-logo-content">
                  <img 
                    src="/gambar/logo.png" 
                    alt="Logo Sekolah" 
                    className="login-school-logo"
                    onError={(e) => {
                      // sembunyikan logo kalau gagal load
                      e.target.style.display = 'none';
                    }}
                  />
                  <h2 className="login-school-name">SMK Negeri Jawa Tengah Semarang</h2>
                </div>
              </div>
            </div>
          </div>

          {/* bagian kanan: form login */}
          <div className="login-right-section">
            <div className="login-form-wrapper">
              {/* header dengan logo dan judul */}
              <div className="login-header">
                <div className="login-logo-container">
                  <div className="login-icon-wrapper">
                    <FiBookOpen className="login-icon" />
                  </div>
                  <div className="login-logo-text">
                    <h1 className="login-title">CAT Dashboard</h1>
                    <p className="login-subtitle">Computer Assisted Test</p>
                  </div>
                </div>
                <div className="login-welcome-text">
                  <h2 className="login-welcome-title">Selamat Datang</h2>
                  <p className="login-welcome-subtitle">Masuk ke akun Anda untuk melanjutkan</p>
                </div>
              </div>

              <div className="login-content">
                {/* tampilkan error message kalau ada */}
                {error && (
                  <div style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#fee',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}>
                    {error}
                  </div>
                )}

                {/* divider sebelum tombol login */}
                <div className="login-divider">
                  <span className="divider-text">Masuk dengan</span>
                </div>
                
                {/* tombol login Google */}
                <button
                  className="google-login-button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner"></div>
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <svg className="google-logo-icon" width="20" height="20" viewBox="0 0 18 18">
                        <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                        <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                        <path fill="#FBBC05" d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.712s.102-1.172.282-1.712V4.956H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.044l3.007-2.332z"/>
                        <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.956L3.964 7.288C4.672 5.163 6.656 3.58 9 3.58z"/>
                      </svg>
                      <span>Masuk dengan Google</span>
                    </>
                  )}
                </button>

                {/* info footer */}
                <div className="login-footer-info">
                  <svg className="info-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" fill="#6b7280"/>
                    <path d="M7 4h2v2H7V4zm0 4h2v4H7V8z" fill="#6b7280"/>
                  </svg>
                  <span>Gunakan akun Google untuk mengakses sistem</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
