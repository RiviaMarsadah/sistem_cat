import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiFolder, FiPlus, FiTrash2, FiEye, FiUpload, FiDownload, FiHelpCircle, FiX, FiCheck } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import './GuruTheme.css';
import './JadwalUjian.css';
import './BankSoal.css';

const TINGKAT_OPTIONS = [
  { value: '10', label: '10' },
  { value: '11', label: '11' },
  { value: '12', label: '12' },
  { value: '0', label: 'Semua Tingkat' },
];

export default function BankSoal() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Collection Modal States (Persistent Input)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createNamaKoleksi, setCreateNamaKoleksi] = useState('');

  // Edit Collection Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [namaKoleksi, setNamaKoleksi] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Import Modal States
  const [showImportModal, setShowImportModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [importMapel, setImportMapel] = useState('');
  const [importTingkat, setImportTingkat] = useState('');
  const [importJurusan, setImportJurusan] = useState('');
  const [importKoleksiId, setImportKoleksiId] = useState('');
  const [importNamaBankSoal, setImportNamaBankSoal] = useState('');
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const [mapelList, setMapelList] = useState([]);
  const [jurusanList, setJurusanList] = useState([]);

  // Pagination
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const isShowAll = currentPage === 9999;
  const displayPage = isShowAll ? 1 : Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = isShowAll ? 0 : (displayPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = isShowAll ? items : items.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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

  const handleShowAll = () => { setCurrentPage(9999); };

  useEffect(() => { 
    if (currentPage !== 9999 && currentPage > totalPages && totalPages >= 1) setCurrentPage(totalPages); 
  }, [totalPages, currentPage]);

  const loadOptions = async () => {
    try {
      const [mapelRes, jurusanRes] = await Promise.all([
        api.get('/guru/mata-pelajaran'),
        api.get('/guru/jurusan'),
      ]);
      setMapelList(mapelRes.data?.data || []);
      setJurusanList(jurusanRes.data?.data || []);
    } catch (e) {
      console.error('Load options error:', e);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/guru/bank-soal-koleksi');
      setItems(res.data?.data || []);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Gagal memuat bank soal', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOptions();
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin hapus bank soal (koleksi) ini? Seluruh soal di dalamnya bisa terhapus atau kehilangan referensi koleksi.')) return;
    try {
      await api.delete(`/guru/bank-soal-koleksi/${id}`);
      showToast('Bank Soal berhasil dihapus.', 'success');
      load();
    } catch (e) {
      showToast(e?.response?.data?.message || 'Gagal menghapus', 'error');
    }
  };

  const handleCreateKoleksi = async (e) => {
    e.preventDefault();
    if (!createNamaKoleksi.trim()) return;
    setSaving(true);
    try {
      await api.post('/guru/bank-soal-koleksi', { nama: createNamaKoleksi.trim() });
      showToast('Bank Soal baru berhasil dibuat!', 'success');
      setShowCreateModal(false);
      setCreateNamaKoleksi(''); // Clear state on success only!
      load();
    } catch (e) {
      showToast(e?.response?.data?.message || 'Gagal membuat bank soal', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveKoleksi = async (e) => {
    e.preventDefault();
    if (!namaKoleksi || !editingId) return;
    setSaving(true);
    try {
      await api.put(`/guru/bank-soal-koleksi/${editingId}`, { nama: namaKoleksi });
      showToast('Nama Bank Soal berhasil diperbarui.', 'success');
      setShowEditModal(false);
      load();
    } catch (e) {
      showToast(e?.response?.data?.message || 'Gagal menyimpan koleksi', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setNamaKoleksi(item.nama);
    setShowEditModal(true);
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get('/guru/bank-soal/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Template_Bank_Soal.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Gagal mengunduh template', 'error');
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!importMapel || !importTingkat) {
      showToast('Pilih Mata Pelajaran dan Tingkat terlebih dahulu.', 'error');
      return;
    }
    if (!importFile) {
      showToast('Pilih file Excel yang akan diunggah.', 'error');
      return;
    }
    setImportLoading(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('mataPelajaranId', importMapel);
      formData.append('tingkat', importTingkat);
      if (importJurusan) formData.append('jurusanId', importJurusan);
      if (importKoleksiId && importKoleksiId !== 'new') {
        formData.append('bankSoalKoleksiId', importKoleksiId);
      } else if (importNamaBankSoal) {
        formData.append('namaBankSoal', importNamaBankSoal);
      }
      const res = await api.post('/guru/bank-soal/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const resultData = res.data?.data || res.data;
      setImportResult(resultData);
      
      showToast(`${resultData?.created || 0} soal berhasil diimpor.`, 'success');
      
      setImportMapel('');
      setImportTingkat('');
      setImportJurusan('');
      setImportNamaBankSoal('');
      setImportKoleksiId('');
      setImportFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (res.data?.data?.created > 0) load();
      setShowImportModal(false);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Gagal mengimpor. Periksa format file lalu coba lagi.', 'error');
      setImportResult(null);
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="guru-page bank-soal-page">
      <div className="guru-header guru-header-card">
        <div>
          <h1 className="guru-title">
            <span className="guru-title-text">Bank Soal</span>
            <span className="guru-title-badge">Guru</span>
          </h1>
          <p className="guru-subtitle">Kelola kotak (koleksi) bank soal Anda, klik pada nama bank soal untuk mengelola butir soal.</p>
        </div>
        <div className="guru-meta">
          <div className="guru-meta-card">
             <div className="guru-meta-label">Total Koleksi</div>
             <div className="guru-meta-value">{items.length}</div>
          </div>
        </div>
      </div>

      <div className="guru-card">
        <div className="guru-card-header">
          <h2 className="guru-card-title">Daftar Bank Soal</h2>
          <div className="header-actions">
            <button
              type="button"
              className="btn-import-excel"
              onClick={() => setShowImportModal(true)}
            >
              <FiUpload /> Import Bank Soal
            </button>
            <button 
              type="button" 
              onClick={() => setShowCreateModal(true)} 
              className="btn-tambah"
            >
              <FiPlus />
              <span>Tambah Bank Soal</span>
            </button>
          </div>
        </div>

      <div className="bank-soal-table-wrap">
        {loading ? (
          <div className="loading-state">Memuat...</div>
        ) : (
          <table className="bank-soal-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Bank Soal</th>
                <th>Jumlah Soal</th>
                <th>Dibuat Pada</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-row">Belum ada bank soal. Silakan buat yang baru.</td>
                </tr>
              ) : (
                paginatedItems.map((row, idx) => (
                  <tr key={row.id} style={{ cursor: 'pointer', transition: 'background 0.2s' }} onClick={() => navigate(`/guru/bank-soal/detail/${row.id}`)}>
                    <td>{startIndex + idx + 1}</td>
                    <td>
                      <div className="folder-name-cell">
                        <FiFolder className="folder-icon" />
                        {row.nama}
                      </div>
                    </td>
                    <td>
                      <div className="soal-count-badge">
                        {row._count?.bankSoal || 0} Soal
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', color: '#64748b', fontSize: '0.9rem' }}>
                        {new Date(row.createdAt).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons-cell" onClick={(e) => e.stopPropagation()}>
                        <button type="button" className="btn-icon view" onClick={() => navigate(`/guru/bank-soal/detail/${row.id}`)} title="Masuk / Edit Soal">
                          <FiEye />
                        </button>
                        <button type="button" className="btn-icon edit" onClick={() => openEdit(row)} title="Rename Koleksi">
                          <FiEdit2 />
                        </button>
                        <button type="button" className="btn-icon delete" onClick={() => handleDelete(row.id)} title="Hapus Koleksi">
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalItems > 0 && (
        <div className="table-pagination">
          <span className="table-pagination-info">
            {isShowAll 
              ? `Menampilkan 1 - ${totalItems} dari ${totalItems} bank soal` 
              : `Menampilkan ${startIndex + 1} - ${Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} dari ${totalItems} bank soal`
            }
          </span>
          <div className="table-pagination-controls">
            <button type="button" className="table-pagination-btn" disabled={isShowAll || displayPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>Sebelumnya</button>
            <div className="table-pagination-pages">
              {isShowAll ? (
                <button type="button" className="table-pagination-page active" onClick={() => setCurrentPage(1)}>Tampilkan Per Halaman</button>
              ) : (
                getPaginationPages(totalPages, displayPage).map((item, idx) =>
                  item.type === 'ellipsis' ? (
                    <span key={`ellipsis-${item.key}`} className="table-pagination-ellipsis">…</span>
                  ) : (
                    <button key={item.value} type="button" className={`table-pagination-page ${item.value === displayPage ? 'active' : ''}`} onClick={() => setCurrentPage(item.value)}>{item.value}</button>
                  )
                )
              )}
            </div>
            <button type="button" className="table-pagination-btn" disabled={isShowAll || displayPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>Berikutnya</button>
            {!isShowAll && (
              <button type="button" className="table-pagination-btn show-all" onClick={handleShowAll}>Tampilkan Semua</button>
            )}
          </div>
        </div>
      )}
      </div>

      {/* Tambah Bank Soal Modal (Persistent State) */}
      {showCreateModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Tambah Bank Soal Baru</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)} aria-label="Tutup"><FiX /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreateKoleksi}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Nama Bank Soal *</label>
                  <input
                    type="text"
                    required
                    placeholder="Misal: Try Out Mandiri Ke-4"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                    value={createNamaKoleksi}
                    onChange={(e) => setCreateNamaKoleksi(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
                  <button type="button" onClick={() => setShowCreateModal(false)} style={{ padding: '10px 16px', background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', fontWeight: 'bold' }}>
                    Batal
                  </button>
                  <button type="submit" disabled={saving} style={{ padding: '10px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    {saving ? 'Loading...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Bank Soal Modal */}
      {showEditModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Ubah Nama Bank Soal</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)} aria-label="Tutup"><FiX /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSaveKoleksi}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Nama Bank Soal</label>
                  <input
                    type="text"
                    required
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                    value={namaKoleksi}
                    onChange={(e) => setNamaKoleksi(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
                  <button type="button" onClick={() => setShowEditModal(false)} style={{ padding: '10px 16px', background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', fontWeight: 'bold' }}>
                    Batal
                  </button>
                  <button type="submit" disabled={saving} style={{ padding: '10px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    {saving ? 'Loading...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="bank-soal-modal import-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Import Bank Soal dari Excel</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowImportModal(false)}
                aria-label="Tutup"
              >
                <FiX />
              </button>
            </div>
            <div className="import-modal-body">
              <p className="import-section-desc">
                Pilih bank soal dan parameter kelas, lalu upload file Excel.
              </p>
              <div className="import-actions-row">
                <button type="button" className="btn-download-template" onClick={handleDownloadTemplate}>
                  <FiDownload /> Download Template
                </button>
                <button type="button" className="btn-guide" onClick={() => setShowGuideModal(true)}>
                  <FiHelpCircle /> Panduan Format Excel
                </button>
              </div>
              <form onSubmit={handleImport} className="import-form">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="filter-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                    <label>Pilih Bank Soal</label>
                    <select value={importKoleksiId} onChange={(e) => setImportKoleksiId(e.target.value)}>
                      <option value="">— Masukkan Koleksi —</option>
                      {items.map((k) => (
                        <option key={k.id} value={k.id}>{k.nama}</option>
                      ))}
                      <option value="new">+ Buat Koleksi Baru</option>
                    </select>
                  </div>
                  {importKoleksiId === 'new' && (
                    <div className="filter-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                      <label>Nama Koleksi Baru</label>
                      <input
                        type="text"
                        placeholder="Misal: Latihan UN 2024"
                        value={importNamaBankSoal}
                        onChange={(e) => setImportNamaBankSoal(e.target.value)}
                        required
                      />
                    </div>
                  )}
                  <div className="filter-group" style={{ margin: 0 }}>
                    <label>Mata Pelajaran *</label>
                    <select value={importMapel} onChange={(e) => setImportMapel(e.target.value)} required>
                      <option value="">— Pilih Mapel —</option>
                      {mapelList.map((m) => (
                        <option key={m.id} value={m.id}>{m.namaMapel} ({m.kodeMapel || '-'})</option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-group" style={{ margin: 0 }}>
                    <label>Tingkat (Kelas) *</label>
                    <select value={importTingkat} onChange={(e) => setImportTingkat(e.target.value)} required>
                      <option value="">— Pilih Tingkat —</option>
                      {TINGKAT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-group" style={{ margin: 0 }}>
                    <label>Program Studi (Opsional)</label>
                    <select value={importJurusan} onChange={(e) => setImportJurusan(e.target.value)}>
                      <option value="">Semua Prodi</option>
                      {jurusanList.map((j) => (
                        <option key={j.id} value={j.id}>{j.namaProdi}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="upload-zone-wrapper">
                   <FiUpload className="upload-icon" />
                   <p className="upload-text">Klik atau seret file Excel ke sini</p>
                   <p className="upload-sub">Format yang didukung: .xlsx, .xls</p>
                   <input
                     ref={fileInputRef}
                     type="file"
                     accept=".xlsx,.xls"
                     onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                   />
                </div>
                
                {importFile && (
                   <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                      <span className="file-name-chip"><FiFolder style={{ marginRight: '4px' }} /> {importFile.name}</span>
                   </div>
                )}

                <button type="submit" className="btn-submit-import" disabled={importLoading || !importFile}>
                  <FiUpload style={{ fontSize: '1.2rem' }} /> {importLoading ? 'Sedang Memproses...' : 'Mulai Import Data'}
                </button>
              </form>
              {importResult && (
                <div className={`import-result ${importResult.failed > 0 ? 'has-errors' : ''}`}>
                  <p><strong>{importResult.created}</strong> soal berhasil diimpor, <strong>{importResult.failed}</strong> gagal.</p>
                  {importResult.errors?.length > 0 && (
                    <ul className="import-errors-list">
                      {importResult.errors.slice(0, 15).map((err, i) => (
                        <li key={i}>Baris {err.row}: {err.message}</li>
                      ))}
                      {importResult.errors.length > 15 && (
                        <li>… dan {importResult.errors.length - 15} error lainnya.</li>
                      )}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showGuideModal && (
        <div className="modal-overlay" onClick={() => setShowGuideModal(false)} role="dialog" aria-modal="true">
          <div className="bank-soal-modal guide-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Panduan Format Excel Import Bank Soal</h2>
              <button type="button" className="modal-close" onClick={() => setShowGuideModal(false)} aria-label="Tutup"><FiX /></button>
            </div>
            <div className="guide-content">
              <p className="guide-note mb-3" style={{ background: '#eff6ff', padding: '0.75rem', borderRadius: '8px', borderLeft: '4px solid #3b82f6', marginBottom: '1rem' }}>
                <strong>Catatan Penting:</strong> 
                Semua soal di dalam file Excel akan dimasukkan ke dalam <strong>Nama Bank Soal</strong> yang Anda pilih atau ketikkan sebelum mengunggah berkas.
              </p>
              <p><strong>Kolom di sheet &quot;Soal&quot; (baris pertama = header):</strong></p>
              <table className="guide-table">
                <thead>
                  <tr><th>Kolom</th><th>Keterangan</th></tr>
                </thead>
                <tbody>
                  <tr><td><code>Kategori</code></td><td><code>pilgan</code> | <code>pilgan_kompleks</code> | <code>pilgan_kategori</code></td></tr>
                  <tr><td><code>Soal</code></td><td>Teks pertanyaan (opsional untuk <code>pilgan_kategori</code>)</td></tr>
                  <tr><td><code>Opsi A</code> s/d <code>Opsi E</code></td><td>Isi opsi atau pernyataan. Minimal 3 untuk <code>pilgan</code>/<code>pilgan_kompleks</code>, minimal 1 untuk <code>pilgan_kategori</code></td></tr>
                  <tr><td><code>Jawaban</code></td><td>Single: satu huruf A–E. Multi: dipisah koma, contoh <code>A,B,D</code>. Benar/Salah: B atau S per pernyataan, contoh <code>B,B,S</code></td></tr>
                  <tr><td><code>Gambar</code></td><td>URL gambar (opsional)</td></tr>
                </tbody>
              </table>
              <p><strong>Contoh nilai Kategori:</strong> <code>pilgan</code>, <code>pilgan_kompleks</code>, <code>pilgan_kategori</code></p>
              <p>Untuk <strong>pilgan_kategori</strong>, isi Jawaban dengan <strong>B</strong> (Benar) dan <strong>S</strong> (Salah) sesuai urutan Opsi A, B, C, …</p>
              <p>Gunakan file template yang didownload agar format kolom sesuai.</p>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
