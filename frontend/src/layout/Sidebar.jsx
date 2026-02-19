import { NavLink, useNavigate } from 'react-router-dom';
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
  FiActivity,
  FiBarChart2,
  FiLogOut,
  FiBell,
  FiSettings
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ role, user }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Menu items untuk Admin
  const adminMenu = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: FiHome, disabled: false },
    { path: '/admin/jurusan', label: 'Jurusan', icon: FiLayers, disabled: false },
    { path: '/admin/mata-pelajaran', label: 'Mata Pelajaran', icon: FiBookOpen, disabled: true },
    { path: '/admin/kelas', label: 'Kelas', icon: FiUsers, disabled: false },
    { path: '/admin/user', label: 'Management User', icon: FiSettings, disabled: false },
    { path: '/admin/siswa', label: 'Siswa', icon: FiUser, disabled: true },
    { path: '/admin/guru', label: 'Guru', icon: FiUser, disabled: true },
    { path: '/admin/jadwal-ujian', label: 'Jadwal Ujian', icon: FiCalendar, disabled: true },
  ];

  // Menu items untuk Guru
  const guruMenu = [
    { path: '/guru/dashboard', label: 'Dashboard', icon: FiHome, disabled: false },
    { path: '/guru/bank-soal', label: 'Bank Soal', icon: FiFileText, disabled: true },
    { path: '/guru/paket-ujian', label: 'Paket Ujian', icon: FiPackage, disabled: true },
    { path: '/guru/detail-ujian', label: 'Detail Ujian', icon: FiEye, disabled: true },
    { path: '/guru/monitoring', label: 'Monitoring', icon: FiActivity, disabled: true },
    { path: '/guru/evaluasi', label: 'Evaluasi Soal', icon: FiBarChart2, disabled: true },
  ];

  const menuItems = role === 'admin' ? adminMenu : guruMenu;
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
            />
          ) : (
            <span className="profile-avatar-initial">
              {userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </span>
          )}
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
        {menuItems.map((item) => {
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

