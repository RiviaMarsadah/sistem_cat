import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBook, FiClock, FiCheckCircle, FiFileText, FiFilter, FiEye, FiTrash2, FiDownload, FiSearch, FiAlertCircle, FiX } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import './GuruTheme.css';
import './RekapUjian.css';

export default function RekapUjianGuru() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchingResults, setFetchingResults] = useState(false);
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('all');
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState({ total: 0, finished: 0, average: 0, highest: 0 });
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState(null);

  const totalItems = results.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const isShowAll = currentPage === 9999;
  const displayPage = isShowAll ? 1 : Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = isShowAll ? 0 : (displayPage - 1) * ITEMS_PER_PAGE;
  const paginatedResults = isShowAll ? results : results.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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

  useEffect(() => { if (currentPage !== 9999 && currentPage > totalPages && totalPages >= 1) setCurrentPage(totalPages); }, [totalPages, currentPage]);
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
      showToast('Gagal memuat daftar ujian', 'error');
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
      const finishedData = data.filter(r => r.status === 'selesai');
      setResults(finishedData);

      // Calculate stats
      const scores = finishedData.map(r => Number(r.nilaiAkhir));
      setStats({
        total: finishedData.length,
        finished: finishedData.length,
        average: scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0,
        highest: scores.length > 0 ? Math.max(...scores).toFixed(1) : 0
      });
    } catch (error) {
      console.error('Fetch results error:', error);
      showToast('Gagal memuat data hasil ujian', 'error');
    } finally {
      setFetchingResults(false);
    }
  };

  const filteredExams = exams.filter(e => {
    const query = searchQuery.toLowerCase();
    const examName = (e.nama || '').toLowerCase();
    const mapelName = (e.mataPelajaran?.namaMapel || '').toLowerCase();
    const mapelKode = (e.mataPelajaran?.kodeMapel || '').toLowerCase();
    const packetName = (e.paketUjian?.nama || '').toLowerCase();
    return examName.includes(query) || mapelName.includes(query) || mapelKode.includes(query) || packetName.includes(query);
  });

  useEffect(() => {
    if (searchQuery) {
      const isSelectedInFiltered = filteredExams.some(e => String(e.id) === String(selectedExam));
      if (!isSelectedInFiltered && filteredExams.length > 0) {
        setSelectedExam(filteredExams[0].id);
        setSelectedKelas('all');
      }
    }
  }, [searchQuery]);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { fetchResults(); }, [selectedExam, selectedKelas]);

  const handleReview = (id) => {
    navigate(`/guru/rekap-ujian/review/${id}`);
  };

  const handleDeleteResult = (id, studentName) => {
    setConfirmData({
      id,
      title: 'Hapus Hasil Ujian?',
      message: `Apakah Anda yakin ingin menghapus hasil ujian dari ${studentName}?`,
      warning: 'Tindakan ini tidak dapat dibatalkan. Seluruh lembar jawaban dan data nilai siswa terkait ujian ini akan dihapus secara permanen.',
      action: async () => {
        try {
          await api.delete(`/guru/rekap/results/${id}`);
          showToast('Hasil ujian berhasil dihapus', 'success');
          fetchResults(); // Refresh list
        } catch (error) {
          console.error('Delete result error:', error);
          showToast('Gagal menghapus hasil ujian', 'error');
        } finally {
          setShowConfirmModal(false);
          setConfirmData(null);
        }
      }
    });
    setShowConfirmModal(true);
  };

  const handleExportExcel = async () => {
    if (results.length === 0) return;

    try {
      showToast('Sedang menyiapkan file Excel...', 'info');
      const currentExam = exams.find(e => String(e.id) === String(selectedExam));
      const examName = currentExam ? currentExam.nama : 'ujian';
      const cleanExamName = examName.toLowerCase().replace(/[^a-z0-9]/g, '_');

      const response = await api.get(`/guru/rekap/export?jadwalId=${selectedExam}&kelasId=${selectedKelas}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rekap_nilai_${cleanExamName}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      showToast('File Excel berhasil diunduh!', 'success');
    } catch (err) {
      console.error('Export error:', err);
      showToast('Gagal mengekspor rekap hasil', 'error');
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
          <p className="guru-subtitle">Rekapitulasi nilai akhir, status kelulusan, dan unduh laporan hasil ujian.</p>
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
        <div className="rekap-filter-grid">
          <div className="filter-item">
            <label className="guru-form-label">
              <FiSearch /> Cari Ujian / Paket Soal
            </label>
            <input
              type="text"
              className="guru-input"
              placeholder="Cari kata kunci..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={loading}
            />
          </div>
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
              {filteredExams.length === 0 ? <option value="">Tidak ada ujian cocok</option> : null}
              {filteredExams.map(e => (
                <option key={e.id} value={e.id}>{e.nama} - {e.mataPelajaran?.namaMapel} ({e.mataPelajaran?.kodeMapel || '-'})</option>
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
        <div className="guru-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h2 className="guru-card-title">Daftar Hasil Peserta</h2>
          {results.length > 0 && (
            <button className="btn-export-rekap" onClick={handleExportExcel}>
              <FiDownload /> Ekspor Excel
            </button>
          )}
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
              <div style={{ textAlign: 'center' }}>Jawaban Benar</div>
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
                <div style={{ textAlign: 'center' }}>
                  <span className="benar-badge">
                    {r.benar} / {r.totalSoal}
                  </span>
                </div>
                <div className="nilai-col">
                  <span className={`score-display ${Number(r.nilaiAkhir) >= 80 ? 'high' : 'med'}`}>
                    {Number(r.nilaiAkhir).toFixed(1)}
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
              {isShowAll 
                ? `Menampilkan 1 - ${totalItems} dari ${totalItems} hasil` 
                : `Menampilkan ${startIndex + 1} - ${Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} dari ${totalItems} hasil`
              }
            </span>
            <div className="table-pagination-controls">
              <button type="button" className="table-pagination-btn" disabled={isShowAll || displayPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>Sebelumnya</button>
              <div className="table-pagination-pages">
                {isShowAll ? (
                  <button type="button" className="table-pagination-page active" onClick={() => setCurrentPage(1)}>Tampilkan Per Halaman</button>
                ) : (
                  getPaginationPages(totalPages, displayPage).map((item) =>
                    item.type === 'ellipsis' ? <span key={`ellipsis-${item.key}`} className="table-pagination-ellipsis">…</span> :
                    <button key={item.value} type="button" className={`table-pagination-page ${item.value === displayPage ? 'active' : ''}`} onClick={() => setCurrentPage(item.value)}>{item.value}</button>
                  )
                )}
              </div>
              <button type="button" className="table-pagination-btn" disabled={isShowAll || displayPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>Berikutnya</button>
              {!isShowAll && (
                <button type="button" className="table-pagination-btn show-all" onClick={() => setCurrentPage(9999)}>Tampilkan Semua</button>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Confirm Delete Modal */}
      {showConfirmModal && confirmData && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-confirm" style={{ padding: '1.5rem' }}>
              <div className="modal-confirm-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="modal-confirm-icon-box danger" style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#fef2f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#dc2626',
                  fontSize: '1.5rem',
                  flexShrink: 0
                }}>
                  <FiAlertCircle />
                </div>
                <h3 className="modal-confirm-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
                  {confirmData.title}
                </h3>
              </div>
              <div className="modal-confirm-body" style={{ marginBottom: '1.5rem' }}>
                <div className="modal-confirm-text" style={{ fontSize: '0.95rem', color: '#475569', marginBottom: '0.75rem', lineHeight: '1.5' }}>
                  {confirmData.message}
                </div>
                {confirmData.warning && (
                  <div className="modal-confirm-warning" style={{
                    display: 'flex',
                    gap: '0.5rem',
                    background: '#fffbeb',
                    border: '1px solid #fef3c7',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    color: '#b45309',
                    fontSize: '0.85rem',
                    lineHeight: '1.4'
                  }}>
                    <FiAlertCircle style={{ flexShrink: 0, marginTop: '0.15rem', fontSize: '1rem' }} />
                    <span>{confirmData.warning}</span>
                  </div>
                )}
              </div>
              <div className="modal-confirm-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowConfirmModal(false)} style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', fontWeight: 600 }}>
                  Batal
                </button>
                <button type="button" className="btn-danger" onClick={confirmData.action} style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <FiTrash2 /> Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

