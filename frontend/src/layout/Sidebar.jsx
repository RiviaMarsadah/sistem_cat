import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  FiHome,
  FiBookOpen,
  FiUsers,
  FiUser,
  FiCalendar,
  FiLayers,
  FiFileText,
  FiPackage,
  FiEye,
  FiBarChart2,
  FiLogOut,
  FiBell,
  FiSettings,
  FiChevronDown,
  FiRefreshCw,
  FiX,
  FiChevronsLeft
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ role, user, isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [expandedCategories, setExpandedCategories] = useState({});
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    navigate('/login');
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  // Menu items untuk Admin
  const adminMenu = [
    {
      category: 'UTAMA',
      items: [
        { path: '/admin/dashboard', label: 'Dashboard', icon: FiHome, disabled: false },
        { path: '/admin/api-sync', label: 'Sinkronisasi API', icon: FiRefreshCw, disabled: true },
      ]
    },
    {
      category: 'DATA MASTER',
      items: [
        { path: '/admin/jurusan', label: 'Jurusan', icon: FiLayers, disabled: false },
        { path: '/admin/mata-pelajaran', label: 'Mata Pelajaran', icon: FiBookOpen, disabled: false },
        { path: '/admin/kelas', label: 'Kelas', icon: FiUsers, disabled: false },
        { path: '/admin/angkatan', label: 'Angkatan', icon: FiLayers, disabled: false },
      ]
    },
    {
      category: 'MANAJEMEN USER',
      items: [
        { path: '/admin/user', label: 'Manajemen Admin', icon: FiSettings, disabled: false },
        { path: '/admin/siswa', label: 'Siswa', icon: FiUser, disabled: false },
        { path: '/admin/guru', label: 'Guru', icon: FiUser, disabled: false },
      ]
    },
    {
      category: 'UJIAN',
      items: [
        { path: '/admin/jadwal-ujian', label: 'Jadwal Ujian', icon: FiCalendar, disabled: false },
        { path: '/admin/ujian-siswa', label: 'Ujian Siswa', icon: FiFileText, disabled: false },
      ]
    },
    {
      category: 'DATA MENU GURU',
      items: [
        { path: '/admin/guru/jadwal-ujian', label: 'Jadwal Ujian Guru', icon: FiCalendar, disabled: false },
        { path: '/admin/guru/bank-soal', label: 'Bank Soal Guru', icon: FiFileText, disabled: false },
        { path: '/admin/guru/paket-ujian', label: 'Paket Ujian Guru', icon: FiPackage, disabled: false },
        { path: '/admin/guru/rekap-ujian', label: 'Rekap Hasil Ujian', icon: FiEye, disabled: false },
        { path: '/admin/guru/analisis-soal', label: 'Analisis Soal Guru', icon: FiBarChart2, disabled: false },
      ]
    }
  ];

  // Menu items untuk Guru
  const guruMenu = [
    {
      category: 'UTAMA',
      items: [
        { path: '/guru/dashboard', label: 'Dashboard', icon: FiHome, disabled: false },
      ]
    },
    {
      category: 'MANAJEMEN ASET',
      items: [
        { path: '/guru/bank-soal', label: 'Bank Soal', icon: FiFileText, disabled: false },
        { path: '/guru/paket-ujian', label: 'Paket Ujian', icon: FiPackage, disabled: false },
      ]
    },
    {
      category: 'PELAKSANAAN',
      items: [
        { path: '/guru/jadwal-ujian', label: 'Jadwal Ujian', icon: FiCalendar, disabled: false },
      ]
    },
    {
      category: 'LAPORAN & EVALUASI',
      items: [
        { path: '/guru/rekap-ujian', label: 'Rekap Hasil', icon: FiEye, disabled: false },
        { path: '/guru/analisis-soal', label: 'Analisis Soal', icon: FiBarChart2, disabled: false },
      ]
    }
  ];

  const menuGroups = role === 'admin' ? adminMenu : guruMenu;

  // Auto-expand category marked as active
  useEffect(() => {
    const newExpanded = { ...expandedCategories };
    menuGroups.forEach(group => {
      const hasActive = group.items.some(item => location.pathname === item.path);
      if (hasActive) {
        newExpanded[group.category] = true;
      } else if (newExpanded[group.category] === undefined) {
        newExpanded[group.category] = true;
      }
    });
    setExpandedCategories(newExpanded);
  }, [location.pathname, role]);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const userName = user?.namaLengkap || user?.nama_lengkap || user?.name || 'User';
  const userRole = role === 'admin' ? 'Administrator' : 'Guru';

  return (
    <aside className={`sidebar ${role === 'admin' ? 'sidebar-admin' : 'sidebar-guru'} ${isOpen ? 'active' : ''}`}>
      {/* ── Brand Header ── */}
      <div className="sidebar-header">
        {/* Toggle/Close button on mobile */}
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
          <FiX />
        </button>
        {/* Collapse button on desktop */}
        <button 
          className="sidebar-collapse-btn" 
          onClick={onToggleCollapse} 
          aria-label="Collapse sidebar" 
          title="Sembunyikan Sidebar"
        >
          <FiChevronsLeft />
        </button>
        {/* Logo besar di tengah */}
        <div className="sidebar-logo-wrapper">
          <img src="/gambar/logo.png" alt="SISTEM CAT" onError={(e) => { e.target.style.display='none'; }} />
        </div>
        {/* Subtitle */}
        <span className="sidebar-logo-sub">Dashboard <br />computer Assisted test</span>
      </div>

      {/* User Profile Section */}
      <div className="sidebar-profile">
        <div className="profile-avatar">
          {user?.googlePicture ? (
            <img
              src={user.googlePicture}
              alt={userName}
              className="profile-avatar-img"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                if (e.target.nextElementSibling) {
                  e.target.nextElementSibling.style.display = 'flex';
                }
              }}
            />
          ) : null}
          <span className="profile-avatar-initial" style={{ display: user?.googlePicture ? 'none' : 'flex' }}>
            {userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </span>
        </div>
        <div className="profile-info">
          <div className="profile-name">{userName}</div>
          <div className="profile-role">{userRole}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuGroups.map((group) => {
          return (
            <div key={group.category} className="sidebar-category expanded">
              <div
                className="sidebar-category-header"
                style={{ cursor: 'default' }}
              >
                <span className="category-text">{group.category}</span>
              </div>
              <div className="sidebar-category-items">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  if (item.disabled) {
                    return (
                      <div
                        key={item.path}
                        className="sidebar-item disabled"
                        title="Fitur belum tersedia"
                      >
                        <Icon className="sidebar-icon" />
                        <span className="sidebar-label">{item.label}</span>
                      </div>
                    );
                  }
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `sidebar-item ${isActive ? 'active' : ''}`
                      }
                    >
                      <Icon className="sidebar-icon" />
                      <span className="sidebar-label">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-item logout-btn" onClick={handleLogout}>
          <FiLogOut className="sidebar-icon" />
          <span className="sidebar-label">Logout</span>
        </button>
      </div>

      {/* Modal Konfirmasi Logout */}
      {showLogoutModal && (
        <div className="sidebar-modal-overlay" onClick={cancelLogout}>
          <div className="sidebar-modal-container" onClick={(e) => e.stopPropagation()}>
            <h3 className="sidebar-modal-title">Konfirmasi Logout</h3>
            <p className="sidebar-modal-message">Apakah Anda yakin ingin keluar dari sistem?</p>
            <div className="sidebar-modal-actions">
              <button className="sidebar-modal-btn sidebar-modal-btn-cancel" onClick={cancelLogout}>
                Batal
              </button>
              <button className="sidebar-modal-btn sidebar-modal-btn-confirm" onClick={confirmLogout}>
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;