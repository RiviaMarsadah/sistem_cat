import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiMenu, FiChevronsRight } from 'react-icons/fi';
import Sidebar from './Sidebar';
import './DashboardLayout.css';

const DashboardLayout = ({ role }) => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  const toggleCollapse = () => setIsSidebarCollapsed(prev => !prev);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login');
      } else if (user.role !== role) {
        // Redirect ke dashboard sesuai role
        if (user.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (user.role === 'guru') {
          navigate('/guru/dashboard');
        } else {
          navigate('/login');
        }
      }
    }
  }, [user, role, loading, navigate]);

  // Reset sidebar state on navigation / screen changes implicitly
  useEffect(() => {
    closeSidebar();
  }, [navigate]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== role) {
    return null;
  }

  return (
    <div className={`dashboard-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Mobile Top Header */}
      <header className="mobile-header">
        <button className="mobile-menu-btn" onClick={toggleSidebar} aria-label="Toggle Menu">
          <FiMenu />
        </button>
        <div className="mobile-logo-section">
          <img 
            src="/gambar/logo.png" 
            alt="Logo" 
            className="mobile-logo-img" 
            onError={(e) => { e.target.style.display='none'; }} 
          />
          <span className="mobile-logo-text">SISTEM CAT</span>
        </div>
        <div className="mobile-user-section">
          <span className={`mobile-role-badge badge-${role}`}>
            {role === 'admin' ? 'Admin' : 'Guru'}
          </span>
        </div>
      </header>

      {/* Desktop Show Sidebar Button (when collapsed) */}
      {isSidebarCollapsed && (
        <button 
          className="desktop-toggle-btn" 
          onClick={toggleCollapse} 
          title="Tampilkan Sidebar"
          aria-label="Show sidebar"
        >
          <FiChevronsRight />
        </button>
      )}

      {/* Backdrop overlay */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} 
        onClick={closeSidebar}
      ></div>

      <Sidebar 
        role={role} 
        user={user} 
        isOpen={isSidebarOpen} 
        onClose={closeSidebar} 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleCollapse}
      />
      <div className="main-content">
        <div className="content-area">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;

