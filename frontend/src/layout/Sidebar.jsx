import { NavLink, useNavigate } from 'react-router-dom';
import { 
  FiHome, 
  FiBookOpen, 
  FiUsers, 
  FiUser, 
  FiCalendar,
  FiFileText,
  FiPackage,
  FiEye,
  FiActivity,
  FiBarChart2,
  FiLogOut,
  FiBell
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
    { path: '/admin/dashboard', label: 'Dashboard', icon: FiHome },
    { path: '/admin/mata-pelajaran', label: 'Mata Pelajaran', icon: FiBookOpen },
    { path: '/admin/kelas', label: 'Kelas', icon: FiUsers },
    { path: '/admin/siswa', label: 'Siswa', icon: FiUser },
    { path: '/admin/guru', label: 'Guru', icon: FiUser },
    { path: '/admin/jadwal-ujian', label: 'Jadwal Ujian', icon: FiCalendar },
  ];

  // Menu items untuk Guru
  const guruMenu = [
    { path: '/guru/dashboard', label: 'Dashboard', icon: FiHome },
    { path: '/guru/bank-soal', label: 'Bank Soal', icon: FiFileText },
    { path: '/guru/paket-ujian', label: 'Paket Ujian', icon: FiPackage },
    { path: '/guru/detail-ujian', label: 'Detail Ujian', icon: FiEye },
    { path: '/guru/monitoring', label: 'Monitoring', icon: FiActivity },
    { path: '/guru/evaluasi', label: 'Evaluasi Soal', icon: FiBarChart2 },
  ];

  const menuItems = role === 'admin' ? adminMenu : guruMenu;
  const userName = user?.namaLengkap || user?.nama_lengkap || user?.name || 'User';
  const userRole = role === 'admin' ? 'Administrator' : 'Guru';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-logo">CAT</h2>
        <p className="sidebar-subtitle">Dashboard {role === 'admin' ? 'Admin' : 'Guru'}</p>
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

