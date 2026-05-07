import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBook, FiClock, FiCheckCircle, FiFileText, FiFilter, FiEye, FiTrash2 } from 'react-icons/fi';
import api from '../../services/api';
import './GuruTheme.css';
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

  // Pagination
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = results.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const displayPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (displayPage - 1) * ITEMS_PER_PAGE;
  const paginatedResults = results.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  function getPaginationPages(tp, cp) {
    if (tp <= 7) return Array.from({ length: tp }, (_, i) => ({ type: 'page', value: i + 1 }));
    const delta = 1;
    let result = [{ type: 'page', value: 1 }];
    if (cp - delta > 2) result.push({ type: 'ellipsis', key: 'left' });
    for (let i = Math.max(2, cp - delta); i <= Math.min(tp - 1, cp + delta); i++) result.push({ type: 'page', value: i });
    if (cp + delta < tp - 1) result.push({ type: 'ellipsis', key: 'right' });
    result.push({ type: 'page', value: tp });
    return result;
  }

  useEffect(() => { if (currentPage > totalPages && totalPages >= 1) setCurrentPage(totalPages); }, [totalPages, currentPage]);
  useEffect(() => { setCurrentPage(1); }, [selectedExam, selectedKelas]);

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
    <div className="guru-page rekap-page">
      <div className="guru-header guru-header-card">
        <div>
          <h1 className="guru-title">
            <span className="guru-title-text">Rekap Hasil</span>
            <span className="guru-title-badge">Ujian</span>
          </h1>
          <p className="guru-subtitle">Pantau perkembangan dan hasil ujian siswa Anda secara mendalam.</p>
        </div>
        <div className="guru-meta">
          <div className="guru-meta-card">
            <div className="guru-meta-label">Total Peserta</div>
            <div className="guru-meta-value">{stats.total}</div>
          </div>
          <div className="guru-meta-card">
            <div className="guru-meta-label">Rata-rata</div>
            <div className="guru-meta-value">{stats.average}</div>
          </div>
          <div className="guru-meta-card">
            <div className="guru-meta-label">Tertinggi</div>
            <div className="guru-meta-value">{stats.highest}</div>
          </div>
        </div>
      </div>

      <div className="guru-card rekap-filter-card">
        <div className="guru-card-header">
          <h2 className="guru-card-title">Filter Pencarian</h2>
        </div>
        <div className="guru-form-grid">
          <div className="filter-item">
            <label className="guru-form-label">
              <FiBook /> Pilih Ujian
            </label>
            <select 
              className="guru-select"
              value={selectedExam} 
              onChange={(e) => { setSelectedExam(e.target.value); setSelectedKelas('all'); }}
              disabled={loading}
            >
              {exams.length === 0 ? <option>Tidak ada ujian</option> : null}
              {exams.map(e => (
                <option key={e.id} value={e.id}>{e.nama} - {e.mataPelajaran?.namaMapel}</option>
              ))}
            </select>
          </div>
          <div className="filter-item">
            <label className="guru-form-label">
              <FiFilter /> Pilih Kelas
            </label>
            <select 
              className="guru-select"
              value={selectedKelas} 
              onChange={(e) => setSelectedKelas(e.target.value)}
              disabled={loading}
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

      <div className="guru-card">
        <div className="guru-card-header">
          <h2 className="guru-card-title">Daftar Hasil Peserta</h2>
        </div>

        {fetchingResults ? (
          <div className="loading-state rekap-state">Memuat hasil ujian...</div>
        ) : results.length === 0 ? (
          <div className="empty-state rekap-state">Belum ada data hasil ujian untuk filter ini.</div>
        ) : (
          <div className="rekap-table">
            <div className="rekap-row rekap-head">
              <div>Siswa</div>
              <div>Nama Kelas</div>
              <div>Status</div>
              <div style={{ textAlign: 'center' }}>Nilai Akhir</div>
              <div style={{ textAlign: 'center' }}>Aksi</div>
            </div>

            {paginatedResults.map((r, idx) => (
              <div key={r.id} className="rekap-row">
                <div>
                  <div className="student-info">
                    <div className="student-avatar">
                      {r.siswa?.user?.namaLengkap?.charAt(0)}
                    </div>
                    <div className="student-names">
                      <div className="student-name">{r.siswa?.user?.namaLengkap}</div>
                      <div className="student-email">{r.siswa?.user?.email}</div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="kelas-pill">
                    {r.siswa?.kelas?.tingkat} {r.siswa?.kelas?.jurusan?.namaProdi || 'N/A'}
                  </div>
                </div>
                <div>
                  {r.status === 'selesai' ? (
                    <span className="status-badge aktif"><FiCheckCircle /> Selesai</span>
                  ) : (
                    <span className="status-badge progress"><FiClock /> Aktif</span>
                  )}
                </div>
                <div className="nilai-col">
                  <span className={`score-display ${Number(r.nilaiAkhir) >= 80 ? 'high' : 'med'}`}>
                    {r.status === 'selesai' ? Number(r.nilaiAkhir).toFixed(1) : '-'}
                  </span>
                </div>
                <div className="aksi-col">
                  <button 
                    className="btn-action primary" 
                    onClick={() => handleReview(r.id)} 
                  >
                    <FiEye /> Review
                  </button>
                  <button 
                    className="btn-action danger" 
                    onClick={() => handleDeleteResult(r.id, r.siswa?.user?.namaLengkap)}
                  >
                    <FiTrash2 /> Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>

        )}

        {/* Pagination */}
        {!fetchingResults && totalItems > 0 && (
          <div className="table-pagination">
            <span className="table-pagination-info">
              Menampilkan {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} dari {totalItems} hasil
            </span>
            <div className="table-pagination-controls">
              <button type="button" className="table-pagination-btn" disabled={displayPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>Sebelumnya</button>
              <div className="table-pagination-pages">
                {getPaginationPages(totalPages, displayPage).map((item) =>
                  item.type === 'ellipsis' ? <span key={`ellipsis-${item.key}`} className="table-pagination-ellipsis">…</span> :
                  <button key={item.value} type="button" className={`table-pagination-page ${item.value === displayPage ? 'active' : ''}`} onClick={() => setCurrentPage(item.value)}>{item.value}</button>
                )}
              </div>
              <button type="button" className="table-pagination-btn" disabled={displayPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>Berikutnya</button>
              <button type="button" className="table-pagination-btn show-all" onClick={() => setCurrentPage(9999)}>Tampilkan Semua</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

