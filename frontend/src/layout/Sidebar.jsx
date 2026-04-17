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
  FiChevronDown
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ role, user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [expandedCategories, setExpandedCategories] = useState({});

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Menu items untuk Admin
  const adminMenu = [
    {
      category: 'Utama',
      items: [
        { path: '/admin/dashboard', label: 'Dashboard', icon: FiHome, disabled: false },
      ]
    },
    {
      category: 'Data Master',
      items: [
        { path: '/admin/jurusan', label: 'Jurusan', icon: FiLayers, disabled: false },
        { path: '/admin/mata-pelajaran', label: 'Mata Pelajaran', icon: FiBookOpen, disabled: false },
        { path: '/admin/kelas', label: 'Kelas', icon: FiUsers, disabled: false },
      ]
    },
    {
      category: 'Manajemen User',
      items: [
        { path: '/admin/user', label: 'Manajemen Admin', icon: FiSettings, disabled: false },
        { path: '/admin/siswa', label: 'Siswa', icon: FiUser, disabled: false },
        { path: '/admin/guru', label: 'Guru', icon: FiUser, disabled: false },
      ]
    },
    {
      category: 'Ujian',
      items: [
        { path: '/admin/jadwal-ujian', label: 'Jadwal Ujian', icon: FiCalendar, disabled: false },
      ]
    }
  ];

  // Menu items untuk Guru
  const guruMenu = [
    {
      category: 'Utama',
      items: [
        { path: '/guru/dashboard', label: 'Dashboard', icon: FiHome, disabled: false },
      ]
    },
    {
      category: 'Manajemen Ujian',
      items: [
        { path: '/guru/bank-soal', label: 'Bank Soal', icon: FiFileText, disabled: false },
        { path: '/guru/paket-ujian', label: 'Paket Ujian', icon: FiPackage, disabled: false },
        { path: '/guru/jadwal-ujian', label: 'Jadwal Ujian', icon: FiCalendar, disabled: false },
        { path: '/guru/detail-ujian', label: 'Detail Ujian', icon: FiEye, disabled: true },
        { path: '/guru/evaluasi', label: 'Evaluasi Soal', icon: FiBarChart2, disabled: true },
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
        newExpanded[group.category] = true; // Default open
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
    <aside className={`sidebar ${role === 'admin' ? 'sidebar-admin' : 'sidebar-guru'}`}>
      <div className="sidebar-header">
        <h2 className="sidebar-logo">CAT</h2>
        <div className="sidebar-subtitle-wrapper">
          <span className="sidebar-subtitle">Dashboard</span>
          <span className={`sidebar-role-badge ${role === 'admin' ? 'role-badge-admin' : 'role-badge-guru'}`}>
            {role === 'admin' ? 'Admin' : 'Guru'}
          </span>
        </div>
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
                // If image fails to load, replace it with initials dynamically
                e.target.style.display = 'none';
                if (e.target.nextElementSibling) {
                  e.target.nextElementSibling.style.display = 'flex';
                }
              }}
            />
          ) : null}
          <span 
            className="profile-avatar-initial" 
            style={{ display: user?.googlePicture ? 'none' : 'flex' }}
          >
            {userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </span>
        </div>
        <div className="profile-info">
          <div className="profile-name">{userName}</div>
          <div className="profile-role">{userRole}</div>
        </div>
      </div>

      {/* Notifications */}
      <div className="sidebar-notifications">
        <NavLink
          to={role === 'admin' ? '/admin/notifikasi' : '/guru/notifikasi'}
          className={({ isActive }) =>
            `sidebar-notification-btn ${isActive ? 'active' : ''}`
          }
        >
          <FiBell className="notification-icon" />
          <span className="notification-label">Notifikasi</span>
        </NavLink>
      </div>

      <nav className="sidebar-nav">
        {menuGroups.map((group) => {
          const isExpanded = expandedCategories[group.category];
          return (
            <div key={group.category} className={`sidebar-category ${isExpanded ? 'expanded' : 'collapsed'}`}>
              <div 
                className="sidebar-category-header"
                onClick={() => toggleCategory(group.category)}
              >
                <span className="category-text">{group.category}</span>
                <FiChevronDown className="chevron-icon" />
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
    </aside>
  );
};

export default Sidebar;

