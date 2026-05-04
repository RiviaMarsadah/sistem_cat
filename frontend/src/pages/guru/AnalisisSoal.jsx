import { useEffect, useState } from 'react';
import { FiBook, FiInfo, FiPieChart, FiAlertTriangle, FiCheck } from 'react-icons/fi';
import api from '../../services/api';
import './AnalisisSoal.css';

export default function AnalisisSoal() {
  const [loading, setLoading]       = useState(false);
  const [analyzing, setAnalyzing]   = useState(false);
  const [packages, setPackages]     = useState([]);
  const [selectedPaket, setSelectedPaket] = useState('');
  const [analysisData, setAnalysisData]   = useState(null);

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
    <div className="admin-user-page">

      {/* ── Header ── */}
      <div className="user-header">
        <div>
          <h1 className="user-title">
            <span className="title-text">Analisis Butir</span>
            <span className="title-badge">Soal</span>
          </h1>
          <p className="user-subtitle">Evaluasi tingkat kesulitan soal berdasarkan performa pengerjaan siswa.</p>
        </div>
        <div className="user-meta">
          <div className="meta-card">
            <div className="meta-label">Total Responden</div>
            <div className="meta-value">{analysisData?.totalParticipants ?? 0}</div>
          </div>
          <div className="meta-card">
            <div className="meta-label">Total Soal</div>
            <div className="meta-value">{analysisData?.analysis?.length ?? 0}</div>
          </div>
        </div>
      </div>

      {/* ── Pilih Paket ── */}
      <div className="user-card" style={{ marginBottom: '1.5rem' }}>
        <div className="user-card-header">
          <h2 className="user-card-title">Pilih Paket Analisis</h2>
        </div>
        <div style={{ padding: '1rem 1.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <FiBook /> Paket Ujian yang Telah Digunakan
          </label>
          <select
            className="input"
            value={selectedPaket}
            onChange={(e) => setSelectedPaket(e.target.value)}
            disabled={loading}
            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}
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
      <div className="user-card">
        <div className="user-card-header">
          <h2 className="user-card-title">Statistik Per Soal</h2>
        </div>

        {analyzing ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
            Menganalisis performa soal...
          </div>
        ) : !analysisData || analysisData.analysis.length === 0 ? (
          <div style={{ padding: '5rem', textAlign: 'center', color: '#94a3b8' }}>
            <FiPieChart size={48} style={{ marginBottom: '1rem', opacity: 0.4, display: 'block', margin: '0 auto 1rem' }} />
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
            {analysisData.analysis.map((item, index) => (
              <div key={item.bankSoalId} className="analisis-row">
                <div className="soal-num">#{index + 1}</div>
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
                  <span className="stat-val" style={{ color: item.ratio >= 70 ? '#16a34a' : item.ratio >= 30 ? '#2563eb' : '#dc2626' }}>
                    {item.ratio}%
                  </span>
                  <div className="ratio-bar">
                    <div className="ratio-fill" style={{
                      width: `${item.ratio}%`,
                      background: item.ratio >= 70 ? '#16a34a' : item.ratio >= 30 ? '#3b82f6' : '#dc2626'
                    }} />
                  </div>
                </div>
                <div className="eval-cell">
                  {getDifficultyBadge(item.difficulty)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
