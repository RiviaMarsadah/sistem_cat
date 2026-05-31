import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { FiBook, FiInfo, FiPieChart, FiAlertTriangle, FiCheck, FiX, FiEye } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import '../guru/GuruTheme.css';
import '../guru/AnalisisSoal.css';

const BASE_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

const isImageFile = (str) => {
  if (!str) return false;
  return /\.(apng|avif|gif|jpg|jpeg|jfif|pjpeg|pjpg|png|svg|webp)$/i.test(str);
};

const ITEMS_PER_PAGE = 10;

export default function AdminGuruAnalisisSoal() {
  const { showToast } = useToast();
  const [loading, setLoading]       = useState(false);
  const [analyzing, setAnalyzing]   = useState(false);
  const [packages, setPackages]     = useState([]);
  const [selectedPaket, setSelectedPaket] = useState('');
  const [analysisData, setAnalysisData]   = useState(null);
  const [previewSoal, setPreviewSoal]     = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  const rawData = analysisData?.analysis || [];
  const totalItems = rawData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const isShowAll = currentPage === 9999;
  const displayPage = isShowAll ? 1 : Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = isShowAll ? 0 : (displayPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = isShowAll ? rawData : rawData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
  }, [selectedPaket]);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/guru-data/analisis/paket');
      const list = res.data?.data || [];
      setPackages(list);
      if (list.length > 0) setSelectedPaket(list[0].id);
    } catch (e) {
      console.error('Fetch packages error:', e);
      showToast('Gagal memuat daftar paket ujian guru', 'error');
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    if (!selectedPaket) return;
    setAnalyzing(true);
    try {
      const res = await api.get(`/admin/guru-data/analisis/paket/${selectedPaket}`);
      setAnalysisData(res.data?.data);
    } catch (e) {
      console.error('Run analysis error:', e);
      showToast('Gagal menganalisis butir soal paket ini', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  useEffect(() => {
    if (selectedPaket) runAnalysis();
  }, [selectedPaket]);

  const getDifficultyBadge = (difficulty) => {
    switch (difficulty) {
      case 'Mudah': return <span className="diff-badge mudah" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#d1fae5', color: '#065f46', fontWeight: '700', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem' }}><FiCheck /> Mudah</span>;
      case 'Sedang': return <span className="diff-badge sedang" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#fef3c7', color: '#92400e', fontWeight: '700', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem' }}><FiInfo /> Sedang</span>;
      case 'Sulit':  return <span className="diff-badge sulit" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#fee2e2', color: '#991b1b', fontWeight: '700', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem' }}><FiAlertTriangle /> Sulit</span>;
      default:       return <span className="diff-badge">N/A</span>;
    }
  };

  const getKategoriLabel = (kat) => {
    switch (kat) {
      case 'pilgan': 
        return <span style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', padding: '4px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '700', whiteSpace: 'nowrap' }}>Pilgan</span>;
      case 'pilgan_kompleks': 
        return <span style={{ background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe', padding: '4px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '700', whiteSpace: 'nowrap' }}>PG Kompleks</span>;
      case 'pilgan_kategori': 
        return <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '4px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '700', whiteSpace: 'nowrap' }}>PG Kategori</span>;
      default: 
        return <span style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '700', whiteSpace: 'nowrap' }}>{kat || '-'}</span>;
    }
  };

  const mudahCount  = rawData.filter(a => a.difficulty === 'Mudah').length  || 0;
  const sedangCount = rawData.filter(a => a.difficulty === 'Sedang').length || 0;
  const sulitCount  = rawData.filter(a => a.difficulty === 'Sulit').length  || 0;

  const currentPaketDetails = packages.find(p => String(p.id) === String(selectedPaket));

  return (
    <div className="guru-page analisis-page" style={{ padding: '0 20px 20px 20px' }}>
      {/* Header */}
      <div className="guru-header guru-header-card" style={{ marginTop: '20px' }}>
        <div>
          <h1 className="guru-title">
            <span className="guru-title-text">Analisis Soal Guru</span>
            <span className="guru-title-badge">Monitoring</span>
          </h1>
          <p className="guru-subtitle">Pemantauan analisis butir soal, indeks kesulitan, dan validitas soal hasil ujian guru.</p>
        </div>
        <div className="guru-meta">
          <div className="guru-meta-card">
            <div className="guru-meta-label">Total Responden</div>
            <div className="guru-meta-value">{analysisData?.totalParticipants ?? 0}</div>
          </div>
          <div className="guru-meta-card">
            <div className="guru-meta-label">Total Soal</div>
            <div className="guru-meta-value">{analysisData?.analysis?.length ?? 0}</div>
          </div>
        </div>
      </div>

      {/* Pilih Paket */}
      <div className="guru-card analisis-filter-card">
        <div className="guru-card-header">
          <h2 className="guru-card-title" style={{ margin: 0 }}>Pilih Paket Analisis</h2>
        </div>
        <div>
          <label className="guru-form-label">
            <FiBook /> Paket Ujian Guru yang Telah Dikerjakan Siswa
          </label>
          <select
            className="guru-select"
            value={selectedPaket}
            onChange={(e) => setSelectedPaket(e.target.value)}
            disabled={loading}
          >
            {packages.length === 0
              ? <option value="">Belum ada paket yang dikerjakan siswa</option>
              : packages.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nama} — {p.mataPelajaran?.namaMapel} ({p.guru?.user?.namaLengkap || 'Guru'}) ({p._count?.soalPaket} Soal)
                  </option>
                ))
            }
          </select>
        </div>

        {currentPaketDetails && (
          <div style={{ marginTop: '1rem', padding: '10px 14px', background: '#eff6ff', borderRadius: '8px', borderLeft: '4px solid #3b82f6', fontSize: '0.85rem', color: '#1e40af', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
            <span style={{ fontWeight: '700' }}>
              Pembuat Paket: {currentPaketDetails.guru?.user?.namaLengkap || '-'}
            </span>
            <span>|</span>
            <span style={{ fontWeight: '600' }}>
              Mata Pelajaran: {currentPaketDetails.mataPelajaran?.namaMapel || '-'}
            </span>
          </div>
        )}
      </div>

      {/* Ringkasan Kesulitan */}
      {analysisData && rawData.length > 0 && (
        <div className="analisis-summary-grid">
          <div className="summary-box mudah">
            <span className="s-val">{mudahCount}</span>
            <span className="s-lbl">Soal Mudah <small>(&gt; 70% benar)</small></span>
          </div>
          <div className="summary-box sedang">
            <span className="s-val">{sedangCount}</span>
            <span className="s-lbl">Soal Sedang <small>(30–70% benar)</small></span>
          </div>
          <div className="summary-box sulit">
            <span className="s-val">{sulitCount}</span>
            <span className="s-lbl">Soal Sulit <small>(&lt; 30% benar)</small></span>
          </div>
          <div className="summary-box info">
            <span className="s-val">{analysisData.totalParticipants}</span>
            <span className="s-lbl">Total Siswa <small>yang mengerjakan</small></span>
          </div>
        </div>
      )}

      {/* Tabel Analisis */}
      <div className="guru-card">
        <div className="guru-card-header">
          <h2 className="guru-card-title" style={{ margin: 0 }}>Statistik Per Butir Soal</h2>
        </div>

        {analyzing ? (
          <div style={{ textAlign: 'center', padding: '3rem' }} className="analisis-state">
            <div className="loading-spinner" style={{ margin: '0 auto 1rem auto' }}></div>
            <p style={{ color: '#64748b' }}>Menganalisis performa soal...</p>
          </div>
        ) : !analysisData || rawData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }} className="analisis-empty">
            <FiPieChart size={48} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
            <p>{packages.length === 0
              ? 'Belum ada paket ujian yang dikerjakan siswa.'
              : 'Pilih paket ujian untuk melihat analisis butir soal.'
            }</p>
          </div>
        ) : (
          <div className="analisis-table-wrapper" style={{ overflowX: 'auto' }}>
            <div className="analisis-table" style={{ minWidth: '900px' }}>
              {/* Head */}
              <div className="analisis-row analisis-head">
                <div>No</div>
                <div>Pertanyaan</div>
                <div>Kategori</div>
                <div>Penjawab</div>
                <div>Benar</div>
                <div>% Akurasi Jawaban</div>
                <div>Evaluasi</div>
                <div>Aksi</div>
              </div>

              {/* Rows */}
              {paginatedItems.map((item, index) => (
                <div key={item.bankSoalId} className="analisis-row table-row-hover">
                  <div className="soal-num" style={{ fontWeight: '800', color: '#64748b' }}>#{startIndex + index + 1}</div>
                  <div 
                    className="soal-text-cell" 
                    dangerouslySetInnerHTML={{ __html: item.soal }} 
                    onClick={() => setPreviewSoal(item)}
                    style={{ cursor: 'pointer', transition: 'color 0.15s', fontWeight: '500', color: '#1e293b', fontSize: '0.85rem' }}
                    title="Klik untuk pratinjau soal lengkap"
                    onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
                    onMouseLeave={(e) => e.currentTarget.style.color = ''}
                  />
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {getKategoriLabel(item.kategori)}
                  </div>
                  <div className="stat-cell" style={{ textAlign: 'center' }}>
                    <span className="stat-val" style={{ fontWeight: '700', color: '#475569' }}>{item.respondents}</span>
                    <span className="stat-lbl" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>siswa</span>
                  </div>
                  <div className="stat-cell" style={{ textAlign: 'center' }}>
                    <span className="stat-val green" style={{ fontWeight: '700', color: '#10b981' }}>{item.correctAnswers}</span>
                    <span className="stat-lbl" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>siswa</span>
                  </div>
                  <div className="stat-cell">
                    <span className={`stat-val ratio-text ${item.ratio >= 70 ? 'ratio-high' : item.ratio >= 30 ? 'ratio-mid' : 'ratio-low'}`} style={{ fontWeight: '800' }}>
                      {item.ratio}%
                    </span>
                    <div className="ratio-bar" style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
                      <div className={`ratio-fill ${item.ratio >= 70 ? 'ratio-high' : item.ratio >= 30 ? 'ratio-mid' : 'ratio-low'}`} style={{ width: `${item.ratio}%`, height: '100%' }} />
                    </div>
                  </div>
                  <div className="eval-cell" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {getDifficultyBadge(item.difficulty)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setPreviewSoal(item)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        boxShadow: '0 2px 4px rgba(59, 130, 246, 0.15)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                    >
                      <FiEye /> Pratinjau
                    </button>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {!analyzing && totalItems > 0 && (
                <div className="table-pagination">
                  <span className="table-pagination-info">
                    {isShowAll 
                      ? `Menampilkan 1 – ${totalItems} dari ${totalItems} soal` 
                      : `Menampilkan ${startIndex + 1} – ${Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} dari ${totalItems} soal`
                    }
                  </span>
                  <div className="table-pagination-controls">
                    <button type="button" className="table-pagination-btn" disabled={isShowAll || displayPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>Sebelumnya</button>
                    <div className="table-pagination-pages">
                      {isShowAll ? (
                        <button type="button" className="table-pagination-page active" onClick={() => setCurrentPage(1)}>Tampilkan Per Halaman</button>
                      ) : (
                        getPaginationPages(totalPages, displayPage).map((pg, idx) =>
                          pg.type === 'ellipsis' ? <span key={`ellipsis-${pg.key}`} className="table-pagination-ellipsis">…</span> :
                          <button key={pg.value} type="button" className={`table-pagination-page ${pg.value === displayPage ? 'active' : ''}`} onClick={() => setCurrentPage(pg.value)}>{pg.value}</button>
                        )
                      )}
                    </div>
                    <button type="button" className="table-pagination-btn" disabled={isShowAll || displayPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>Berikutnya</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {previewSoal && ReactDOM.createPortal(
        <div className="modal-overlay" onClick={() => setPreviewSoal(null)} style={{ zIndex: 10000 }}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', width: '90%' }}>
            <div className="modal-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.75rem', borderBottom: '1px solid #e2e8f0'}}>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: '#1e293b' }}>Pratinjau Butir Soal</h3>
              <button 
                type="button" 
                onClick={() => setPreviewSoal(null)} 
                style={{
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  borderRadius: '50%',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '1.75rem', maxHeight: '75vh', overflowY: 'auto' }}>
              {/* Question Text */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Pertanyaan</div>
                <div style={{ fontSize: '1rem', color: '#0f172a', fontWeight: '600', lineHeight: '1.6', background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} dangerouslySetInnerHTML={{ __html: previewSoal.soal }} />
              </div>

              {/* Question Image if any */}
              {previewSoal.gambar && (
                <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', marginBottom: '0.5rem', letterSpacing: '0.05em', textAlign: 'left' }}>Gambar Pendukung</div>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'inline-block', maxWidth: '100%' }}>
                    <img 
                      src={previewSoal.gambar.endsWith('.webp') ? `${BASE_URL}/uploads/${previewSoal.gambar}` : previewSoal.gambar} 
                      alt="Soal" 
                      style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'contain', borderRadius: '6px' }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                </div>
              )}

              {/* Options */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Pilihan Jawaban</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {['A', 'B', 'C', 'D', 'E'].map((opt, optIdx) => {
                    const val = previewSoal[`kolom${opt}`];
                    if (!val) return null;

                    const isKategori = previewSoal.kategori === 'pilgan_kategori';

                    // For PG Kategori: jawaban is stored as 'B,S,B,S' per filled option index
                    // B = Benar (correct), S = Salah (incorrect)
                    let isCorrect = false;
                    let kategoriAnswer = null;
                    if (isKategori && previewSoal.jawaban) {
                      const parts = previewSoal.jawaban.split(',').map(x => x.trim().toUpperCase());
                      kategoriAnswer = parts[optIdx] || null;
                      isCorrect = kategoriAnswer === 'B';
                    } else {
                      isCorrect = previewSoal.jawaban && previewSoal.jawaban.split(',').map(x => x.trim().toUpperCase()).includes(opt);
                    }

                    // Styling
                    const bgColor = isKategori
                      ? (isCorrect ? '#ecfdf5' : '#fff5f5')
                      : (isCorrect ? '#ecfdf5' : '#ffffff');
                    const borderColor = isKategori
                      ? (isCorrect ? '2px solid #10b981' : '2px solid #f87171')
                      : (isCorrect ? '2px solid #10b981' : '1px solid #e2e8f0');
                    const badgeBg = isKategori
                      ? (isCorrect ? '#10b981' : '#ef4444')
                      : (isCorrect ? '#10b981' : '#f1f5f9');
                    const badgeColor = isKategori ? '#ffffff' : (isCorrect ? '#ffffff' : '#475569');
                    const textColor = isKategori
                      ? (isCorrect ? '#065f46' : '#7f1d1d')
                      : (isCorrect ? '#065f46' : '#334155');

                    return (
                      <div 
                        key={opt}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '12px', 
                          padding: '10px 16px', 
                          borderRadius: '8px', 
                          background: bgColor,
                          border: borderColor,
                          boxShadow: isCorrect ? '0 2px 4px rgba(16, 185, 129, 0.08)' : (isKategori ? '0 2px 4px rgba(239, 68, 68, 0.06)' : 'none'),
                          transition: 'all 0.2s'
                        }}
                      >
                        {/* Badge A, B, C, D, E */}
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          width: '28px', 
                          height: '28px', 
                          borderRadius: '50%', 
                          background: badgeBg,
                          color: badgeColor,
                          fontWeight: '700', 
                          fontSize: '0.85rem',
                          flexShrink: 0
                        }}>
                          {opt}
                        </span>
                        
                        {/* Text or Image */}
                        <div style={{ flex: '1', fontSize: '0.9rem', color: textColor, fontWeight: (isCorrect || isKategori) ? '600' : '500' }}>
                          {isImageFile(val) ? (
                            <img 
                              src={`${BASE_URL}/uploads/${val}`} 
                              alt={`Opsi ${opt}`} 
                              style={{ maxHeight: '60px', borderRadius: '4px', objectFit: 'contain' }}
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            val
                          )}
                        </div>

                        {/* Answer Indicator */}
                        {isKategori && kategoriAnswer && (
                          <span style={{
                            background: isCorrect ? '#10b981' : '#ef4444',
                            color: 'white',
                            fontSize: '0.7rem',
                            fontWeight: '700',
                            padding: '3px 10px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            flexShrink: 0
                          }}>
                            {isCorrect ? '✓ Benar' : '✗ Salah'}
                          </span>
                        )}
                        {!isKategori && isCorrect && (
                          <span style={{ background: '#10b981', color: 'white', fontSize: '0.7rem', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase', flexShrink: 0 }}>Kunci</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Difficulty Stats */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem 1.25rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '2px' }}>Tingkat Kesukaran</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: '700', color: previewSoal.difficulty === 'Mudah' ? '#16a34a' : previewSoal.difficulty === 'Sedang' ? '#1d4ed8' : '#dc2626' }}>{previewSoal.difficulty}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '2px' }}>Kategori Soal</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#334155' }}>
                    {previewSoal.kategori === 'pilgan' ? 'Pilihan Ganda' : previewSoal.kategori === 'pilgan_kompleks' ? 'Pilihan Ganda Kompleks' : 'Pilihan Ganda Kategori'}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '2px' }}>Rasio Benar</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#334155' }}>{previewSoal.ratio}% ({previewSoal.correctAnswers} / {previewSoal.respondents} siswa)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
}
