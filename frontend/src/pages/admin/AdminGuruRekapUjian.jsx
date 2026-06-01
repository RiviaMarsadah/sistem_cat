import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBook, FiFilter, FiEye, FiDownload, FiSearch, FiUser, FiInfo, FiTrendingUp, FiChevronDown, FiX } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import '../guru/GuruTheme.css';
import '../guru/RekapUjian.css';

const ITEMS_PER_PAGE = 10;

export default function AdminGuruRekapUjian() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchingResults, setFetchingResults] = useState(false);
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('all');
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState({ total: 0, finished: 0, average: 0, highest: 0 });
  const [examSearch, setExamSearch] = useState('');
  const [examDropOpen, setExamDropOpen] = useState(false);
  const examDropRef = useRef(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

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

  useEffect(() => {
    if (currentPage !== 9999 && currentPage > totalPages && totalPages >= 1) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedExam, selectedKelas]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/guru-data/rekap/jadwal');
      const examsData = res.data?.data || [];
      setExams(examsData);
      if (examsData.length > 0) {
        setSelectedExam(examsData[0].id);
      }
    } catch (error) {
      console.error('Fetch exams error:', error);
      showToast('Gagal memuat daftar ujian guru', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async () => {
    if (!selectedExam) return;
    setFetchingResults(true);
    try {
      const res = await api.get(`/admin/guru-data/rekap/results?jadwalId=${selectedExam}&kelasId=${selectedKelas}`);
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
      showToast('Gagal memuat data hasil ujian guru', 'error');
    } finally {
      setFetchingResults(false);
    }
  };

  const filteredExams = useMemo(() => {
    const query = examSearch.toLowerCase();
    if (!query) return exams;
    return exams.filter(e => {
      const examName = (e.nama || '').toLowerCase();
      const mapelName = (e.mataPelajaran?.namaMapel || '').toLowerCase();
      const creatorName = (e.guru?.user?.namaLengkap || '').toLowerCase();
      const packetName = (e.paketUjian?.nama || '').toLowerCase();
      return examName.includes(query) || mapelName.includes(query) || creatorName.includes(query) || packetName.includes(query);
    });
  }, [exams, examSearch]);

  // Close exam dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (examDropRef.current && !examDropRef.current.contains(e.target)) {
        setExamDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchResults();
  }, [selectedExam, selectedKelas]);

  const getCreatorLabel = (e) => {
    if (!e) return '';
    const isOfficial = e.kategori === 'terjadwal' || !e.guruId;
    if (isOfficial) {
      if (e.paketUjian?.guru?.user?.namaLengkap) {
        return `Admin - ${e.paketUjian.guru.user.namaLengkap}`;
      }
      return 'Admin';
    }
    return e.guru?.user?.namaLengkap || 'Guru';
  };

  const handleReview = (id) => {
    navigate(`/admin/guru/rekap-ujian/review/${id}`);
  };

  const handleExportCSV = () => {
    if (results.length === 0) return;

    const currentExam = exams.find(e => String(e.id) === String(selectedExam));
    const examName = currentExam ? currentExam.nama : 'ujian';
    const cleanExamName = examName.toLowerCase().replace(/[^a-z0-9]/g, '_');

    // Headers
    const headers = ['No', 'Nama Siswa', 'Email', 'Kelas', 'Jawaban Benar', 'Nilai Akhir'];

    // Rows
    const rows = results.map((r, idx) => {
      const nama = r.siswa?.user?.namaLengkap || '-';
      const email = r.siswa?.user?.email || '-';
      const kelas = r.siswa?.kelas ? `${r.siswa.kelas.tingkat} ${r.siswa.kelas.jurusan?.namaProdi || ''} ${r.siswa.kelas.inisial || ''}` : '-';
      const jawabanBenar = `${r.benar} dari ${r.totalSoal}`;
      const nilai = r.status === 'selesai' ? Number(r.nilaiAkhir).toFixed(1) : '-';

      return [
        idx + 1,
        nama,
        email,
        kelas,
        jawabanBenar,
        nilai
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `rekap_nilai_guru_${cleanExamName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Rekapitulasi berhasil diekspor ke CSV', 'success');
  };

  const availableClasses = useMemo(() => {
    return results.reduce((acc, current) => {
      const kelas = current.siswa?.kelas;
      if (kelas && !acc.find(item => item.id === kelas.id)) {
        acc.push(kelas);
      }
      return acc;
    }, []).sort((a, b) => (a.tingkat + ' ' + (a.jurusan?.namaProdi || '')).localeCompare(b.tingkat + ' ' + (b.jurusan?.namaProdi || '')));
  }, [results]);

  const selectedExamDetails = useMemo(() => {
    return exams.find(e => String(e.id) === String(selectedExam));
  }, [exams, selectedExam]);

  return (
    <div className="guru-page rekap-page" style={{ padding: '0 20px 20px 20px' }}>
      <div className="guru-header guru-header-card" style={{ marginTop: '20px' }}>
        <div>
          <h1 className="guru-title">
            <span className="guru-title-text">Rekap Hasil Guru</span>
            <span className="guru-title-badge">Monitoring</span>
          </h1>
          <p className="guru-subtitle">Pemantauan seluruh hasil ujian, statistik kelas, dan rekapitulasi nilai siswa.</p>
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
          <h2 className="guru-card-title" style={{ margin: 0 }}>Filter & Pencarian Ujian</h2>
        </div>
        <div className="rekap-filter-grid">

          {/* ── Search Text Input ── */}
          <div className="filter-item">
            <label className="guru-form-label">
              <FiSearch /> Cari Ujian / Guru
            </label>
            <input
              type="text"
              className="guru-input"
              placeholder="Cari kata kunci..."
              value={examSearch}
              onChange={(e) => setExamSearch(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* ── Searchable Exam Combobox ── */}
          <div className="filter-item" ref={examDropRef}>
            <label className="guru-form-label">
              <FiBook /> Pilih Jadwal Ujian
            </label>
            <div style={{ position: 'relative' }}>
              {/* Display input – shows selected exam name or search text */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: examDropOpen ? '2px solid #3b82f6' : '1.5px solid #cbd5e1',
                  borderRadius: '10px',
                  background: '#fff',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                  gap: '8px',
                  boxShadow: examDropOpen ? '0 0 0 3px rgba(59,130,246,0.1)' : 'none'
                }}
                onClick={() => { if (!loading) { setExamDropOpen(v => !v); setExamSearch(''); } }}
              >
                <FiSearch size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
                {examDropOpen ? (
                  <input
                    autoFocus
                    type="text"
                    value={examSearch}
                    onChange={e => { e.stopPropagation(); setExamSearch(e.target.value); }}
                    onClick={e => e.stopPropagation()}
                    placeholder="Cari Nama Ujian atau Guru Pembuat Ujian..."
                    style={{
                      border: 'none',
                      outline: 'none',
                      flex: 1,
                      fontSize: '0.875rem',
                      color: '#1e293b',
                      background: 'transparent'
                    }}
                  />
                ) : (
                  <span style={{ flex: 1, fontSize: '0.875rem', color: selectedExam ? '#1e293b' : '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedExamDetails
                      ? `${selectedExamDetails.nama} — ${selectedExamDetails.mataPelajaran?.namaMapel || ''} (${getCreatorLabel(selectedExamDetails)})`
                      : 'Pilih jadwal ujian...'}
                  </span>
                )}
                {examDropOpen && examSearch
                  ? <FiX size={14} style={{ color: '#94a3b8', cursor: 'pointer', flexShrink: 0 }} onClick={e => { e.stopPropagation(); setExamSearch(''); }} />
                  : <FiChevronDown size={14} style={{ color: '#94a3b8', flexShrink: 0, transform: examDropOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                }
              </div>

              {/* Dropdown list */}
              {examDropOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  right: 0,
                  background: '#fff',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '10px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  zIndex: 999,
                  maxHeight: '260px',
                  overflowY: 'auto'
                }}>
                  {filteredExams.length === 0 ? (
                    <div style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center' }}>
                      Tidak ada ujian yang cocok
                    </div>
                  ) : filteredExams.map(e => {
                    const creatorLabel = getCreatorLabel(e);
                    const isSelected = String(e.id) === String(selectedExam);
                    return (
                      <div
                        key={e.id}
                        onClick={() => { setSelectedExam(e.id); setSelectedKelas('all'); setExamDropOpen(false); setExamSearch(''); }}
                        style={{
                          padding: '10px 16px',
                          cursor: 'pointer',
                          background: isSelected ? '#eff6ff' : 'transparent',
                          borderLeft: isSelected ? '3px solid #3b82f6' : '3px solid transparent',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={e2 => { if (!isSelected) e2.currentTarget.style.background = '#f8fafc'; }}
                        onMouseLeave={e2 => { if (!isSelected) e2.currentTarget.style.background = 'transparent'; }}
                      >
                        <div style={{ fontWeight: isSelected ? '700' : '600', fontSize: '0.875rem', color: isSelected ? '#1e40af' : '#1e293b' }}>
                          {e.nama}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <span>📚 {e.mataPelajaran?.namaMapel || '-'}</span>
                          <span>👤 {creatorLabel}</span>
                          {e.kategori === 'custom' && <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '1px 6px', borderRadius: '4px', fontWeight: '600' }}>Custom</span>}
                          {e.kategori === 'terjadwal' && <span style={{ background: '#dcfce7', color: '#15803d', padding: '1px 6px', borderRadius: '4px', fontWeight: '600' }}>Resmi</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Kelas Filter ── */}
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
                  {k.tingkat} {k.jurusan?.namaProdi || ''} {k.inisial || ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedExamDetails && (
          <div style={{ marginTop: '1rem', padding: '10px 14px', background: '#eff6ff', borderRadius: '8px', borderLeft: '4px solid #3b82f6', fontSize: '0.85rem', color: '#1e40af', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
            <span style={{ fontWeight: '700' }}>
              Pembuat Ujian: {getCreatorLabel(selectedExamDetails)}
            </span>
            <span>|</span>
            <span style={{ fontWeight: '600' }}>
              Mata Pelajaran: {selectedExamDetails.mataPelajaran?.namaMapel || '-'}
            </span>
            <span>|</span>
            <span style={{ fontWeight: '600' }}>
              Paket Soal: {selectedExamDetails.paketUjian?.nama || '-'}
            </span>
          </div>
        )}
      </div>

      <div className="guru-card">
        <div className="guru-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h2 className="guru-card-title" style={{ margin: 0 }}>Daftar Hasil Ujian Siswa</h2>
          {results.length > 0 && (
            <button className="btn-export-rekap" onClick={handleExportCSV} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <FiDownload /> Ekspor ke Excel (CSV)
            </button>
          )}
        </div>

        {fetchingResults ? (
          <div style={{ textAlign: 'center', padding: '3rem' }} className="loading-state rekap-state">
            <div className="loading-spinner" style={{ margin: '0 auto 1rem auto' }}></div>
            <p>Memuat hasil ujian...</p>
          </div>
        ) : results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }} className="empty-state rekap-state">
            <FiInfo size={36} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
            <p>Belum ada data hasil ujian siswa untuk jadwal ujian ini.</p>
          </div>
        ) : (
          <div className="rekap-table-wrapper" style={{ overflowX: 'auto' }}>
            <div className="rekap-table" style={{ minWidth: '800px' }}>
              <div className="rekap-row rekap-head">
                <div>Nama Siswa</div>
                <div>Kelas & Program Studi</div>
                <div style={{ textAlign: 'center' }}>Jawaban Benar</div>
                <div style={{ textAlign: 'center' }}>Nilai Akhir</div>
                <div style={{ textAlign: 'center' }}>Tindakan</div>
              </div>

              {paginatedResults.map((r) => (
                <div key={r.id} className="rekap-row table-row-hover">
                  <div>
                    <div className="student-info">
                      <div className="student-avatar" style={{ background: '#3b82f6', color: 'white', fontWeight: 'bold' }}>
                        {r.siswa?.user?.namaLengkap?.charAt(0)}
                      </div>
                      <div className="student-names">
                        <div className="student-name" style={{ fontWeight: '700', color: '#1e293b' }}>{r.siswa?.user?.namaLengkap}</div>
                        <div className="student-email" style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.siswa?.user?.email}</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="kelas-pill" style={{ display: 'inline-block', fontWeight: '700', fontSize: '0.78rem', background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '6px' }}>
                      {r.siswa?.kelas?.tingkat} {r.siswa?.kelas?.jurusan?.namaProdi || ''} {r.siswa?.kelas?.inisial || ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span className="benar-badge" style={{ fontWeight: '700', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '3px 8px', borderRadius: '4px' }}>
                      {r.benar} / {r.totalSoal} Soal
                    </span>
                  </div>
                  <div className="nilai-col" style={{ textAlign: 'center' }}>
                    <span className={`score-display ${Number(r.nilaiAkhir) >= 75 ? 'high' : 'med'}`} style={{ fontWeight: '800', fontSize: '1rem', padding: '4px 10px', borderRadius: '6px' }}>
                      {Number(r.nilaiAkhir).toFixed(1)}
                    </span>
                  </div>
                  <div className="aksi-col" style={{ textAlign: 'center' }}>
                    <button 
                      className="btn-action primary" 
                      onClick={() => handleReview(r.id)} 
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', margin: '0 auto' }}
                    >
                      <FiEye /> Review Lembar Ujian
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
                  getPaginationPages(totalPages, displayPage).map((item, idx) =>
                    item.type === 'ellipsis' ? <span key={`ellipsis-${item.key}`} className="table-pagination-ellipsis">…</span> :
                    <button key={item.value} type="button" className={`table-pagination-page ${item.value === displayPage ? 'active' : ''}`} onClick={() => setCurrentPage(item.value)}>{item.value}</button>
                  )
                )}
              </div>
              <button type="button" className="table-pagination-btn" disabled={isShowAll || displayPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>Berikutnya</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
