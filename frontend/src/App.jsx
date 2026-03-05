import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import DashboardLayout from './layout/DashboardLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminJurusan from './pages/admin/Jurusan';
import AdminKelas from './pages/admin/Kelas';
import AdminUser from './pages/admin/User';
import AdminMataPelajaran from './pages/admin/MataPelajaran';
import GuruDashboard from './pages/guru/Dashboard';
import GuruBankSoal from './pages/guru/BankSoal';
import GuruBankSoalForm from './pages/guru/BankSoalForm';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<Login />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<DashboardLayout role="admin" />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="jurusan" element={<AdminJurusan />} />
            <Route path="mata-pelajaran" element={<AdminMataPelajaran />} />
            <Route path="kelas" element={<AdminKelas />} />
            <Route path="user" element={<AdminUser />} />
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>

          {/* Guru Routes */}
          <Route path="/guru" element={<DashboardLayout role="guru" />}>
            <Route path="dashboard" element={<GuruDashboard />} />
            <Route path="bank-soal" element={<GuruBankSoal />} />
            <Route path="bank-soal/tambah" element={<GuruBankSoalForm />} />
            <Route path="bank-soal/edit/:id" element={<GuruBankSoalForm />} />
            <Route path="*" element={<Navigate to="/guru/dashboard" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App
