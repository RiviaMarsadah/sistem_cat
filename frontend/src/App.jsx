import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import DashboardLayout from './layout/DashboardLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminJurusan from './pages/admin/Jurusan';
import AdminKelas from './pages/admin/Kelas';
import AdminUser from './pages/admin/User';
import AdminSiswa from './pages/admin/Siswa';
import AdminGuru from './pages/admin/Guru';
import AdminMataPelajaran from './pages/admin/MataPelajaran';
import AdminAngkatan from './pages/admin/Angkatan';
import AdminApiSync from './pages/admin/ApiSync';
import GuruDashboard from './pages/guru/Dashboard';
import GuruBankSoal from './pages/guru/BankSoal';
import GuruBankSoalDetail from './pages/guru/BankSoalDetail';
import GuruBankSoalForm from './pages/guru/BankSoalForm';
import GuruPaketUjian from './pages/guru/PaketUjian';
import GuruPaketUjianForm from './pages/guru/PaketUjianForm';
import AdminJadwalUjian from './pages/admin/JadwalUjian';
import AdminJadwalWizard from './pages/admin/JadwalWizard';
import GuruJadwalUjian from './pages/guru/JadwalUjian';
import GuruRekapUjian from './pages/guru/RekapUjian';
import GuruAnalisisSoal from './pages/guru/AnalisisSoal';
import ReviewHasilGuru from './pages/guru/ReviewHasil';


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
            <Route path="siswa" element={<AdminSiswa />} />
            <Route path="guru" element={<AdminGuru />} />
            <Route path="angkatan" element={<AdminAngkatan />} />
            <Route path="api-sync" element={<AdminApiSync />} />
            <Route path="jadwal-ujian" element={<AdminJadwalUjian />} />
            <Route path="jadwal-ujian/wizard" element={<AdminJadwalWizard />} />
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>

          {/* Guru Routes */}
          <Route path="/guru" element={<DashboardLayout role="guru" />}>
            <Route path="dashboard" element={<GuruDashboard />} />
            <Route path="bank-soal" element={<GuruBankSoal />} />
            <Route path="bank-soal/detail/:koleksiId" element={<GuruBankSoalDetail />} />
            <Route path="bank-soal/tambah" element={<GuruBankSoalForm />} />
            <Route path="bank-soal/edit/:id" element={<GuruBankSoalForm />} />
            <Route path="paket-ujian" element={<GuruPaketUjian />} />
            <Route path="paket-ujian/tambah" element={<GuruPaketUjianForm />} />
            <Route path="paket-ujian/edit/:id" element={<GuruPaketUjianForm />} />
            <Route path="jadwal-ujian" element={<GuruJadwalUjian />} />
            <Route path="rekap-ujian" element={<GuruRekapUjian />} />
            <Route path="rekap-ujian/review/:id" element={<ReviewHasilGuru />} />
            <Route path="analisis-soal" element={<GuruAnalisisSoal />} />

            <Route path="*" element={<Navigate to="/guru/dashboard" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App
