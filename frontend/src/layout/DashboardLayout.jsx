import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import './DashboardLayout.css';

const DashboardLayout = ({ role }) => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

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
    <div className="dashboard-layout">
      <Sidebar role={role} user={user} />
      <div className="main-content">
        <div className="content-area">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;

