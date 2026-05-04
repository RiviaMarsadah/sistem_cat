import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBook, FiClock, FiCheckCircle, FiFileText, FiFilter, FiEye, FiTrash2 } from 'react-icons/fi';
import api from '../../services/api';
import './RekapUjian.css';

export default function RekapUjianGuru() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchingResults, setFetchingResults] = useState(false);
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('all');
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState({ total: 0, finished: 0, average: 0, highest: 0 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/guru/rekap/jadwal');
      const examsData = res.data?.data || [];
      setExams(examsData);
      if (examsData.length > 0) {
        setSelectedExam(examsData[0].id);
      }
    } catch (error) {
      console.error('Fetch exams error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async () => {
    if (!selectedExam) return;
    setFetchingResults(true);
    try {
      const res = await api.get(`/guru/rekap/results?jadwalId=${selectedExam}&kelasId=${selectedKelas}`);
      const data = res.data?.data || [];
      setResults(data);

      // Calculate stats
      const finished = data.filter(r => r.status === 'selesai');
      const scores = finished.map(r => Number(r.nilaiAkhir));
      setStats({
        total: data.length,
        finished: finished.length,
        average: scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0,
        highest: scores.length > 0 ? Math.max(...scores).toFixed(1) : 0
      });
    } catch (error) {
      console.error('Fetch results error:', error);
    } finally {
      setFetchingResults(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { fetchResults(); }, [selectedExam, selectedKelas]);

  const handleReview = (id) => {
    navigate(`/guru/rekap-ujian/review/${id}`);
  };

  const handleDeleteResult = async (id, studentName) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus hasil ujian dari ${studentName}? Tindakan ini tidak dapat dibatalkan.`)) {
      try {
        await api.delete(`/guru/rekap/results/${id}`);
        fetchResults(); // Refresh list
      } catch (error) {
        console.error('Delete result error:', error);
        alert('Gagal menghapus hasil ujian.');
      }
    }
  };

  const availableClasses = results.reduce((acc, current) => {
    const kelas = current.siswa?.kelas;
    if (kelas && !acc.find(item => item.id === kelas.id)) {
      acc.push(kelas);
    }
    return acc;
  }, []).sort((a, b) => a.namaKelas?.localeCompare(b.namaKelas));


  return (
    <div className="admin-user-page">
      <div className="user-header">
        <div>
          <h1 className="user-title">
            <span className="title-text">Rekap Hasil</span>
            <span className="title-badge">Ujian</span>
          </h1>
          <p className="user-subtitle">Pantau perkembangan dan hasil ujian siswa Anda secara mendalam.</p>
        </div>
        <div className="user-meta">
          <div className="meta-card">
            <div className="meta-label">Total Peserta</div>
            <div className="meta-value">{stats.total}</div>
          </div>
          <div className="meta-card">
            <div className="meta-label">Rata-rata</div>
            <div className="meta-value">{stats.average}</div>
          </div>
          <div className="meta-card">
            <div className="meta-label">Tertinggi</div>
            <div className="meta-value">{stats.highest}</div>
          </div>
        </div>
      </div>

      <div className="user-card" style={{ marginBottom: '2rem' }}>
        <div className="user-card-header">
          <h2 className="user-card-title">Filter Pencarian</h2>
        </div>
        <div style={{ padding: '1.5rem 2rem', display: 'flex', gap: '1.5rem' }}>
          <div className="filter-item" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiBook /> Pilih Ujian
            </label>
            <select 
              className="input"
              value={selectedExam} 
              onChange={(e) => { setSelectedExam(e.target.value); setSelectedKelas('all'); }}
              disabled={loading}
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}
            >
              {exams.length === 0 ? <option>Tidak ada ujian</option> : null}
              {exams.map(e => (
                <option key={e.id} value={e.id}>{e.nama} - {e.mataPelajaran?.namaMapel}</option>
              ))}
            </select>
          </div>
          <div className="filter-item" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiFilter /> Pilih Kelas
            </label>
            <select 
              className="input"
              value={selectedKelas} 
              onChange={(e) => setSelectedKelas(e.target.value)}
              disabled={loading}
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}
            >
              <option value="all">Semua Kelas</option>
              {availableClasses.map(k => (
                <option key={k.id} value={k.id}>
                  {k.tingkat} {k.jurusan?.namaProdi}
                </option>
              ))}



            </select>
          </div>
        </div>
      </div>

      <div className="user-card">
        <div className="user-card-header">
          <h2 className="user-card-title">Daftar Hasil Peserta</h2>
          <div className="results-count" style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '600' }}>
            Total: {results.length} Siswa
          </div>
        </div>

        {fetchingResults ? (
          <div className="loading-state" style={{ padding: '4rem', textAlign: 'center' }}>Memuat hasil ujian...</div>
        ) : results.length === 0 ? (
          <div className="empty-state" style={{ padding: '5rem', textAlign: 'center' }}>Belum ada data hasil ujian untuk filter ini.</div>
        ) : (
          <div className="rekap-table">
            <div className="rekap-row rekap-head">
              <div>Siswa</div>
              <div>Nama Kelas</div>
              <div>Status</div>
              <div style={{ textAlign: 'center' }}>Nilai Akhir</div>
              <div style={{ textAlign: 'center' }}>Aksi</div>
            </div>

            {results.map((r) => (
              <div key={r.id} className="rekap-row">
                <div>
                  <div className="student-info">
                    <div className="student-avatar" style={{ width: '36px', height: '36px', background: '#eff6ff', color: '#2563eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', marginRight: '12px', flexShrink: 0 }}>
                      {r.siswa?.user?.namaLengkap?.charAt(0)}
                    </div>
                    <div className="student-names" style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: '700', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.siswa?.user?.namaLengkap}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.siswa?.user?.email}</div>
                    </div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', background: '#eff6ff', padding: '5px 10px', borderRadius: '8px', color: '#1e40af', fontWeight: '700', display: 'inline-block', lineHeight: '1.3' }}>
                    {r.siswa?.kelas?.tingkat} {r.siswa?.kelas?.jurusan?.namaProdi || 'N/A'}
                  </div>
                </div>
                <div>
                  {r.status === 'selesai' ? (
                    <span className="status-badge aktif"><FiCheckCircle /> Selesai</span>
                  ) : (
                    <span className="status-badge progress" style={{ background: '#eff6ff', color: '#3b82f6' }}><FiClock /> Aktif</span>
                  )}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span className={`score-display ${Number(r.nilaiAkhir) >= 75 ? 'high' : Number(r.nilaiAkhir) >= 50 ? 'med' : 'low'}`} style={{ fontWeight: '800', fontSize: '1.1rem' }}>
                    {r.status === 'selesai' ? Number(r.nilaiAkhir).toFixed(1) : '-'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                  <button 
                    className="btn-action primary" 
                    onClick={() => handleReview(r.id)} 
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.875rem', width: 'auto' }}
                  >
                    <FiEye /> Review
                  </button>
                  <button 
                    className="btn-action danger" 
                    onClick={() => handleDeleteResult(r.id, r.siswa?.user?.namaLengkap)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.875rem', width: 'auto', background: '#fee2e2', color: '#ef4444' }}
                  >
                    <FiTrash2 /> Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>

        )}
      </div>
    </div>
  );
}

