import React, { useState } from 'react';
import api from '../../services/api';
import {
  FiRefreshCw, FiCheckCircle, FiAlertCircle, FiDatabase,
  FiArrowRight, FiActivity, FiSearch, FiSave, FiList,
  FiBookOpen, FiUsers, FiUser, FiPlus
} from 'react-icons/fi';
import './ApiSync.css';

const MODULES = [
  { id: 'prodi', label: 'Jurusan / Prodi', icon: FiDatabase },
  { id: 'angkatan', label: 'Angkatan', icon: FiList },
  { id: 'mapel', label: 'Mata Pelajaran', icon: FiBookOpen },
  { id: 'kelas', label: 'Kelas', icon: FiUsers },
  { id: 'guru', label: 'Guru', icon: FiUser },
  { id: 'siswa', label: 'Siswa', icon: FiUsers },
];

const ApiSync = () => {
  const [selectedModules, setSelectedModules] = useState(MODULES.map(m => m.id));
  const [analyzing, setAnalyzing] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [executingModule, setExecutingModule] = useState('');
  const [reports, setReports] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('summary');
  const [showAll, setShowAll] = useState({}); // { modId_type: boolean }

  const toggleModule = (id) => {
    setSelectedModules(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const startAnalysis = async () => {
    if (selectedModules.length === 0) return;
    setAnalyzing(true);
    setError('');
    setSuccess('');
    const newReports = {};

    try {
      for (const modId of selectedModules) {
        const res = await api.get(`/admin/sync/analyze?module=${modId}`);
        if (res.data.success) {
          newReports[modId] = res.data.report;
        }
      }
      setReports(newReports);
      setActiveTab('report');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal melakukan analisa API');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExecute = async (module, type) => {
    setExecuting(true);
    setExecutingModule(module);
    setError('');
    setSuccess('');

    try {
      const report = reports[module];
      let items = [];
      if (type === 'new') items = report.new;
      if (type === 'update') items = report.updates;
      if (type === 'all') items = [...report.new, ...report.updates];

      const res = await api.post('/admin/sync/execute', {
        module,
        type,
        items
      });

      if (res.data.success) {
        const reRes = await api.get(`/admin/sync/analyze?module=${module}`);
        setReports(prev => ({ ...prev, [module]: reRes.data.report }));

        const { result } = res.data;
        const skipped = result.skipped || 0;
        const errors = result.errors?.length || 0;
        setSuccess(
          `Sinkron "${MODULES.find(m => m.id === module)?.label}" selesai — ` +
          `${result.created} dibuat, ${result.updated} diperbarui` +
          (skipped > 0 ? `, ${skipped} dilewati` : '') +
          (errors > 0 ? `, ${errors} error` : '')
        );
      }
    } catch (err) {
      setError(`Gagal sinkronisasi ${module}: ` + (err.response?.data?.message || err.message));
    } finally {
      setExecuting(false);
      setExecutingModule('');
    }
  };

  return (
    <div className="admin-sync-page">
      <div className="user-header">
        <div className="header-info">
          <h1 className="user-title">
            <span className="title-text">Sinkronisasi API SIJUWAN</span>
          </h1>
          <p className="user-subtitle">Sinkronkan data lokal dengan server eksternal secara otomatis</p>
        </div>
        <button
          className={`btn-add-user ${analyzing ? 'btn-loading' : ''}`}
          onClick={startAnalysis}
          disabled={analyzing || executing || selectedModules.length === 0}
        >
          {analyzing ? <FiRefreshCw className="spin" /> : <FiSearch />} Cek Update Data
        </button>
      </div>

      {error && (
        <div className="user-alert">
          <FiAlertCircle /> {error}
        </div>
      )}

      {success && (
        <div className="user-success">
          <FiCheckCircle /> {success}
        </div>
      )}

      <div className="sync-layout">
        <aside className="sync-sidebar">
          <div className="user-card">
            <h3 className="user-card-title" style={{ fontSize: '1rem', marginBottom: '1rem' }}>Pilih Tabel</h3>
            <div className="module-selector">
              {MODULES.map(mod => (
                <div
                  key={mod.id}
                  className={`module-item ${selectedModules.includes(mod.id) ? 'selected' : ''}`}
                  onClick={() => !analyzing && !executing && toggleModule(mod.id)}
                >
                  <div className="module-check">
                    {selectedModules.includes(mod.id) ? <FiCheckCircle /> : <div className="dot" />}
                  </div>
                  <span className="module-label">{mod.label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="sync-content">
          {Object.keys(reports).length === 0 ? (
            <div className="user-card empty-sync-card">
              <div className="user-empty">
                <FiActivity className="empty-icon" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.2 }} />
                <h3>Siap Melakukan Analisa</h3>
                <p>Pilih tabel di samping lalu klik "Cek Update Data" untuk melihat perbedaan antara database lokal dengan API SIJUWAN.</p>
              </div>
            </div>
          ) : (
            <div className="reports-container">
              {selectedModules.map(modId => {
                const report = reports[modId];
                if (!report) return null;
                const moduleLabel = MODULES.find(m => m.id === modId).label;

                return (
                  <div key={modId} className="user-card report-card">
                    <div className="report-header">
                      <div className="report-title-info">
                        <h3>{moduleLabel}</h3>
                        <span className="anchor-text">Berdasarkan data unik API</span>
                      </div>
                      <div className="report-stats">
                        <div className="stat-pill new">+{report.new.length} Baru</div>
                        <div className="stat-pill update">~{report.updates.length} Perlu Update</div>
                        <div className="stat-pill synced">{report.syncedCount} Sinkron</div>
                        {report.conflicts && report.conflicts.length > 0 && (
                          <div className="stat-pill conflict" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                            !{report.conflicts.length} Konflik
                          </div>
                        )}
                        {report.skippedCount > 0 && (
                          <div className="stat-pill" style={{ background: '#fef3c7', color: '#b45309' }}>
                            ⚠{report.skippedCount} Dilewati
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="report-actions">
                      <button
                        className="btn btn-outline btn-small"
                        disabled={executing || report.new.length === 0}
                        onClick={() => handleExecute(modId, 'new')}
                      >
                        <FiPlus /> Impor Data Baru
                      </button>
                      <button
                        className="btn btn-outline btn-small"
                        disabled={executing || report.updates.length === 0}
                        onClick={() => handleExecute(modId, 'update')}
                      >
                        <FiSave /> Perbarui Data Lama
                      </button>
                      <button
                        className="btn primary btn-small"
                        disabled={executing || (report.new.length === 0 && report.updates.length === 0)}
                        onClick={() => handleExecute(modId, 'all')}
                      >
                        Sinkron Semua
                      </button>
                    </div>

                    {(report.new.length > 0 || report.updates.length > 0) && (
                      <div className="report-details" style={{ display: 'block' }}>
                        {report.new.length > 0 && (
                          <div className="detail-section" style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                              <h4 style={{ margin: 0 }}>Data Baru ({report.new.length}):</h4>
                              {report.new.length > 10 && (
                                <button
                                  className="btn btn-outline btn-small"
                                  onClick={() => setShowAll(prev => ({ ...prev, [`${modId}_new`]: !prev[`${modId}_new`] }))}
                                >
                                  {showAll[`${modId}_new`] ? 'Sembunyikan' : 'Tampilkan Semua'}
                                </button>
                              )}
                            </div>
                            <div className="user-table-wrap">
                              <table className="user-table">
                                <thead>
                                  <tr>
                                    <th>Anchor (ID/Kode)</th>
                                    <th>Detail Data</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {report.new.slice(0, showAll[`${modId}_new`] ? undefined : 10).map((n, i) => (
                                    <tr key={i}>
                                      <td style={{ fontWeight: 'bold', color: '#1e40af' }}>{n._anchor}</td>
                                      <td style={{ fontSize: '0.85rem' }}>
                                        {Object.entries(n)
                                          .filter(([k]) => !k.startsWith('_') && !['id', 'created_at', 'updated_at'].includes(k))
                                          .map(([k, v]) => (
                                            <span key={k} style={{ marginRight: '1rem' }}>
                                              <strong style={{ textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}:</strong> {String(v)}
                                            </span>
                                          ))}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {report.updates.length > 0 && (
                          <div className="detail-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                              <h4 style={{ margin: 0 }}>Perubahan Data ({report.updates.length}):</h4>
                              {report.updates.length > 10 && (
                                <button
                                  className="btn btn-outline btn-small"
                                  onClick={() => setShowAll(prev => ({ ...prev, [`${modId}_update`]: !prev[`${modId}_update`] }))}
                                >
                                  {showAll[`${modId}_update`] ? 'Sembunyikan' : 'Tampilkan Semua'}
                                </button>
                              )}
                            </div>
                            <div className="user-table-wrap">
                              <table className="user-table">
                                <thead>
                                  <tr>
                                    <th>Anchor</th>
                                    <th>Perubahan Field</th>
                                    <th>Nilai (Lama → Baru)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {report.updates.slice(0, showAll[`${modId}_update`] ? undefined : 10).map((u, i) => (
                                    <tr key={i}>
                                      <td style={{ fontWeight: 'bold' }}>{u.anchor}</td>
                                      <td>
                                        {Object.keys(u.changes).map(field => (
                                          <div key={field} style={{ marginBottom: '4px' }}>
                                            <span className="status-badge" style={{ background: '#f1f5f9', color: '#475569' }}>
                                              {field}
                                            </span>
                                          </div>
                                        ))}
                                      </td>
                                      <td>
                                        {Object.entries(u.changes).map(([field, vals]) => (
                                          <div key={field} className="diff-item" style={{ background: 'transparent', padding: 0, marginBottom: '4px' }}>
                                            <span style={{ textDecoration: 'line-through', color: '#94a3b8' }}>{String(vals.old)}</span>
                                            <FiArrowRight style={{ margin: '0 8px', color: '#3b82f6' }} />
                                            <span style={{ fontWeight: 'bold', color: '#1e40af' }}>{String(vals.new)}</span>
                                          </div>
                                        ))}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                        {report.conflicts && report.conflicts.length > 0 && (
                          <div className="detail-section" style={{ marginTop: '2rem' }}>
                            <div className="user-alert" style={{ background: '#fff1f2', border: '1px solid #fecaca', color: '#991b1b', marginBottom: '1rem' }}>
                              <FiAlertCircle /> Ada beberapa data yang tidak bisa masuk karena bentrok dengan data lokal (Nama sudah dipakai kode lain).
                            </div>
                            <div className="user-table-wrap">
                              <table className="user-table">
                                <thead style={{ background: '#fef2f2' }}>
                                  <tr>
                                    <th>Anchor</th>
                                    <th>Penyebab Konflik</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {report.conflicts.map((c, i) => (
                                    <tr key={i}>
                                      <td style={{ fontWeight: 'bold' }}>{c.anchor}</td>
                                      <td style={{ color: '#b91c1c' }}>{c.message}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {executing && (
        <div className="sync-overlay">
          <div className="sync-loader">
            <div className="loader-circles">
              <div></div><div></div><div></div>
            </div>
            <h3>
              {executingModule
                ? `Menyelaraskan ${MODULES.find(m => m.id === executingModule)?.label}...`
                : 'Sedang Menyelaraskan Database...'}
            </h3>
            <p style={{ marginTop: '1.2rem', color: '#94a3b8', fontSize: '0.85rem' }}>Mohon jangan tutup halaman ini agar integritas data tetap terjaga.</p>
          </div>
        </div>
      )}

    </div>
  );
};

export default ApiSync;