import { useEffect, useState } from 'react';
import { FiBook, FiInfo, FiPieChart, FiAlertTriangle, FiCheck } from 'react-icons/fi';
import api from '../../services/api';
import './GuruTheme.css';
import './AnalisisSoal.css';

export default function AnalisisSoal() {
  const [loading, setLoading]       = useState(false);
  const [analyzing, setAnalyzing]   = useState(false);
  const [packages, setPackages]     = useState([]);
  const [selectedPaket, setSelectedPaket] = useState('');
  const [analysisData, setAnalysisData]   = useState(null);

  // Pagination
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const rawData = analysisData?.analysis || [];
  const totalItems = rawData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const displayPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (displayPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = rawData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
  useEffect(() => { setCurrentPage(1); }, [selectedPaket]);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const res = await api.get('/guru/analisis/paket');
      const list = res.data?.data || [];
      setPackages(list);
      if (list.length > 0) setSelectedPaket(list[0].id);
    } catch (e) {
      console.error('Fetch packages error:', e);
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    if (!selectedPaket) return;
    setAnalyzing(true);
    try {
      const res = await api.get(`/guru/analisis/paket/${selectedPaket}`);
      setAnalysisData(res.data?.data);
    } catch (e) {
      console.error('Run analysis error:', e);
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => { fetchPackages(); }, []);
  useEffect(() => { if (selectedPaket) runAnalysis(); }, [selectedPaket]);

  const getDifficultyBadge = (difficulty) => {
    switch (difficulty) {
      case 'Mudah': return <span className="diff-badge mudah"><FiCheck /> Mudah</span>;
      case 'Sedang': return <span className="diff-badge sedang"><FiInfo /> Sedang</span>;
      case 'Sulit':  return <span className="diff-badge sulit"><FiAlertTriangle /> Sulit</span>;
      default:       return <span className="diff-badge">N/A</span>;
    }
  };

  const mudahCount  = analysisData?.analysis?.filter(a => a.difficulty === 'Mudah').length  || 0;
  const sedangCount = analysisData?.analysis?.filter(a => a.difficulty === 'Sedang').length || 0;
  const sulitCount  = analysisData?.analysis?.filter(a => a.difficulty === 'Sulit').length  || 0;

  return (
    <div className="guru-page analisis-page">

      {/* ── Header ── */}
      <div className="guru-header guru-header-card">
        <div>
          <h1 className="guru-title">
            <span className="guru-title-text">Analisis Butir</span>
            <span className="guru-title-badge">Soal</span>
          </h1>
          <p className="guru-subtitle">Evaluasi tingkat kesulitan soal berdasarkan performa pengerjaan siswa.</p>
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

      {/* ── Pilih Paket ── */}
      <div className="guru-card analisis-filter-card">
        <div className="guru-card-header">
          <h2 className="guru-card-title">Pilih Paket Analisis</h2>
        </div>
        <div>
          <label className="guru-form-label">
            <FiBook /> Paket Ujian yang Telah Digunakan
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
                    {p.nama} — {p.mataPelajaran?.namaMapel} ({p._count?.soalPaket} Soal)
                  </option>
                ))
            }
          </select>
        </div>
      </div>

      {/* ── Ringkasan Kesulitan ── */}
      {analysisData && analysisData.analysis.length > 0 && (
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

      {/* ── Tabel Analisis ── */}
      <div className="guru-card">
        <div className="guru-card-header">
          <h2 className="guru-card-title">Statistik Per Soal</h2>
        </div>

        {analyzing ? (
          <div className="analisis-state">
            Menganalisis performa soal...
          </div>
        ) : !analysisData || analysisData.analysis.length === 0 ? (
          <div className="analisis-empty">
            <FiPieChart size={48} className="analisis-empty-icon" />
            <p>{packages.length === 0
              ? 'Belum ada paket ujian yang dikerjakan siswa.'
              : 'Pilih paket ujian untuk melihat analisis butir soal.'
            }</p>
          </div>
        ) : (
          <div className="analisis-table">
            {/* Head */}
            <div className="analisis-row analisis-head">
              <div>No</div>
              <div>Pertanyaan</div>
              <div>Penjawab</div>
              <div>Benar</div>
              <div>% Benar</div>
              <div>Evaluasi</div>
            </div>

            {/* Rows */}
            {paginatedItems.map((item, index) => (
              <div key={item.bankSoalId} className="analisis-row">
                <div className="soal-num">#{startIndex + index + 1}</div>
                <div className="soal-text-cell" dangerouslySetInnerHTML={{ __html: item.soal }} />
                <div className="stat-cell">
                  <span className="stat-val">{item.respondents}</span>
                  <span className="stat-lbl">siswa</span>
                </div>
                <div className="stat-cell">
                  <span className="stat-val green">{item.correctAnswers}</span>
                  <span className="stat-lbl">siswa</span>
                </div>
                <div className="stat-cell">
                  <span className={`stat-val ratio-text ${item.ratio >= 70 ? 'ratio-high' : item.ratio >= 30 ? 'ratio-mid' : 'ratio-low'}`}>
                    {item.ratio}%
                  </span>
                  <div className="ratio-bar">
                    <div className={`ratio-fill ${item.ratio >= 70 ? 'ratio-high' : item.ratio >= 30 ? 'ratio-mid' : 'ratio-low'}`} style={{ width: `${item.ratio}%` }} />
                  </div>
                </div>
                <div className="eval-cell">
                  {getDifficultyBadge(item.difficulty)}
                </div>
              </div>
            ))}

            {/* Pagination */}
            {!analyzing && totalItems > 0 && (
              <div className="table-pagination">
                <span className="table-pagination-info">
                  Menampilkan {startIndex + 1}{' – '}{Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} dari {totalItems} soal
                </span>
                <div className="table-pagination-controls">
                  <button type="button" className="table-pagination-btn" disabled={displayPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>Sebelumnya</button>
                  <div className="table-pagination-pages">
                    {getPaginationPages(totalPages, displayPage).map((pg) =>
                      pg.type === 'ellipsis' ? <span key={`ellipsis-${pg.key}`} className="table-pagination-ellipsis">…</span> :
                      <button key={pg.value} type="button" className={`table-pagination-page ${pg.value === displayPage ? 'active' : ''}`} onClick={() => setCurrentPage(pg.value)}>{pg.value}</button>
                    )}
                  </div>
                  <button type="button" className="table-pagination-btn" disabled={displayPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>Berikutnya</button>
                  <button type="button" className="table-pagination-btn show-all" onClick={() => setCurrentPage(9999)}>Tampilkan Semua</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
