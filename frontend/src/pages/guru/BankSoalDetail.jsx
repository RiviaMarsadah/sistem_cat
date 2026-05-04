import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FiEdit2, FiPlus, FiTrash2, FiUpload, FiDownload, FiHelpCircle, FiX, FiFolder, FiArrowLeft } from 'react-icons/fi';
import api from '../../services/api';
import './JadwalUjian.css';
import './BankSoal.css';

const KATEGORI_OPTIONS = [
  { value: 'pilgan', label: 'Pilihan Ganda Sederhana' },
  { value: 'pilgan_kompleks', label: 'Pilihan Ganda Kompleks' },
  { value: 'pilgan_kategori', label: 'Pilihan Ganda Kategori' },
];

const TINGKAT_OPTIONS = [
  { value: '10', api: 'X', label: '10' },
  { value: '11', api: 'XI', label: '11' },
  { value: '12', api: 'XII', label: '12' },
  { value: '0', api: 'SEMUA', label: 'Semua Tingkat' },
];

const ITEMS_PER_PAGE = 10;

/** Mengembalikan array berisi nomor halaman dan '...' untuk paginasi ringkas (1, 2, ..., 46, 47). */
function getPaginationPages(totalPages, currentPage) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => ({ type: 'page', value: i + 1 }));
  }
  const delta = 2;
  const rangeStart = Math.max(2, currentPage - delta);
  const rangeEnd = Math.min(totalPages - 1, currentPage + delta);
  const result = [];
  result.push({ type: 'page', value: 1 });
  if (rangeStart > 2) result.push({ type: 'ellipsis', key: 'left' });
  for (let i = rangeStart; i <= rangeEnd; i++) result.push({ type: 'page', value: i });
  if (rangeEnd < totalPages - 1) result.push({ type: 'ellipsis', key: 'right' });
  if (totalPages > 1) result.push({ type: 'page', value: totalPages });
  return result;
}

function tingkatToDisplay(t) {
  if (t === 'X') return '10';
  if (t === 'XI') return '11';
  if (t === 'XII') return '12';
  if (t === 'SEMUA') return 'Semua';
  return t;
}

export default function BankSoalDetail() {
  const { koleksiId } = useParams();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mapelList, setMapelList] = useState([]);
  const [jurusanList, setJurusanList] = useState([]);
  const [koleksiList, setKoleksiList] = useState([]);

  const [importMapel, setImportMapel] = useState('');
  const [importTingkat, setImportTingkat] = useState('');
  const [importJurusan, setImportJurusan] = useState('');
  const [importNamaBankSoal, setImportNamaBankSoal] = useState('');
  const [importKoleksiId, setImportKoleksiId] = useState('');
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importError, setImportError] = useState('');
  const [importNotice, setImportNotice] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = useRef(null);

  const loadOptions = async () => {
    try {
      const [mapelRes, jurusanRes, koleksiRes] = await Promise.all([
        api.get('/guru/mata-pelajaran'),
        api.get('/guru/jurusan'),
        api.get('/guru/bank-soal-koleksi'),
      ]);
      setMapelList(mapelRes.data?.data || []);
      setJurusanList(jurusanRes.data?.data || []);
      setKoleksiList(koleksiRes.data?.data || []);
    } catch (e) {
      console.error('Load options error:', e);
    }
  };

  const loadSoal = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (koleksiId) params.set('bankSoalKoleksiId', koleksiId);
      const res = await api.get(`/guru/bank-soal?${params.toString()}`);
      setItems(res.data?.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Gagal memuat bank soal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    loadSoal();
  }, [koleksiId]);

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin hapus soal ini?')) return;
    try {
      await api.delete(`/guru/bank-soal/${id}`);
      loadSoal();
    } catch (e) {
      setError(e?.response?.data?.message || 'Gagal menghapus');
    }
  };

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const displayPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (displayPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = items.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages && totalPages >= 1) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get('/guru/bank-soal/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template_import_bank_soal.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError(e?.response?.data?.message || 'Gagal mengunduh template');
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    setImportError('');
    setImportNotice(null);
    if (!importMapel || !importTingkat) {
      setImportError('Pilih Mata Pelajaran dan Tingkat terlebih dahulu.');
      return;
    }
    if (!importFile) {
      setImportError('Pilih file Excel yang akan diunggah.');
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
      setImportNotice({
        type: 'success',
        text: `${resultData?.created || 0} soal berhasil diimpor.`,
      });
      setImportMapel('');
      setImportTingkat('');
      setImportJurusan('');
      setImportNamaBankSoal('');
      setImportKoleksiId('');
      setImportFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (res.data?.data?.created > 0) loadSoal();
      setShowImportModal(false);
    } catch (e) {
      setImportError(e?.response?.data?.message || 'Gagal mengimpor. Periksa format file lalu coba lagi.');
      setImportResult(null);
    } finally {
      setImportLoading(false);
    }
  };

  const currentKoleksi = koleksiList.find((k) => String(k.id) === String(koleksiId));
  const koleksiName = currentKoleksi ? currentKoleksi.nama : loading ? 'Memuat...' : 'Koleksi Bank Soal';

  return (
    <div className="periode-detail-view" style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
        <button onClick={() => navigate('/guru/bank-soal')} style={{ background: 'none', border: 'none', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '600', marginBottom: '1.5rem', padding: 0, fontSize: '0.95rem' }}>
          <FiArrowLeft /> Kembali ke Daftar Koleksi
        </button>

        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '2rem', marginBottom: '2rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '0.75rem', letterSpacing: '-0.5px', color: '#1e293b' }}>{koleksiName}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.9rem' }}>
                <FiFolder /> Terdapat {items.length} Soal
            </div>
          </div>
          
          <div className="header-actions" style={{ zIndex: 1, display: 'flex', gap: '12px' }}>
            <button
              type="button"
              className="btn-import-excel"
              onClick={() => setShowImportModal(true)}
            >
              <FiUpload /> Import Bank Soal
            </button>
            <Link to="/guru/bank-soal/tambah" className="btn-add-user">
              <FiPlus className="btn-plus" /> 
              <span>Tambah Bank Soal</span>
            </Link>
          </div>

          {/* Decorative Background */}
          <FiFolder style={{ position: 'absolute', right: '150px', top: '-40px', fontSize: '180px', opacity: '0.03', transform: 'rotate(15deg)', color: '#3b82f6' }} />
        </div>

      {importNotice && (
        <div className={`bank-soal-notice ${importNotice.type}`}>
          {importNotice.text}
        </div>
      )}

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
                {importError && <div className="form-error">{importError}</div>}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="filter-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                    <label>Pilih Bank Soal</label>
                    <select value={importKoleksiId} onChange={(e) => setImportKoleksiId(e.target.value)}>
                      <option value="">— Jangan Masukkan Koleksi (Opsional) —</option>
                      {koleksiList.map((k) => (
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
                        <option key={m.id} value={m.id}>{m.namaMapel}</option>
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
              <button type="button" className="modal-close" onClick={() => setShowGuideModal(false)} aria-label="Tutup">×</button>
            </div>
            <div className="guide-content">
              <p className="guide-note mb-3" style={{ background: '#eff6ff', padding: '0.75rem', borderRadius: '8px', borderLeft: '4px solid #3b82f6', marginBottom: '1rem' }}>
                <strong>Catatan Penting:</strong> 
                Semua soal di dalam file Excel akan dimasukkan ke dalam <strong>Nama Bank Soal</strong> yang Anda ketikkan di form aplikasi sebelum melakukan klik Import. 
              </p>
              <p><strong>Kolom di sheet &quot;Soal&quot; (baris pertama = header):</strong></p>
              <table className="guide-table">
                <thead>
                  <tr><th>Kolom</th><th>Keterangan</th></tr>
                </thead>
                <tbody>
                  <tr><td><code>Kategori</code></td><td><code>pilgan</code> | <code>pilgan_kompleks</code> | <code>pilgan_kategori</code></td></tr>
                  <tr><td><code>Soal</code></td><td>Teks pertanyaan (opsional untuk <code>pilgan_kategori</code>)</td></tr>
                  <tr><td><code>Opsi A</code> s/d <code>Opsi F</code></td><td>Isi opsi atau pernyataan. Minimal 3 untuk <code>pilgan</code>/<code>pilgan_kompleks</code>, minimal 1 untuk <code>pilgan_kategori</code></td></tr>
                  <tr><td><code>Jawaban</code></td><td>Single: satu huruf A–F. Multi: dipisah koma, contoh <code>A,B,D</code>. Benar/Salah: B atau S per pernyataan, contoh <code>B,B,S</code></td></tr>
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

      {/* Filter dihapus sesuai permintaan */}

      {error && <div className="bank-soal-error">{error}</div>}

      {loading ? (
        <div className="bank-soal-loading">Memuat...</div>
      ) : (
        <div className="bank-soal-table-wrap">
          <table className="bank-soal-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Mapel</th>
                <th>Tingkat</th>
                <th>Prodi</th>
                <th>Kategori</th>
                <th>Soal / Pernyataan</th>
                <th>Jawaban</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={8} className="empty-row">Belum ada soal. Klik &quot;Tambah Soal&quot;.</td></tr>
              ) : (
                paginatedItems.map((row, idx) => (
                  <tr key={row.id}>
                    <td>{startIndex + idx + 1}</td>
                    <td>{row.mataPelajaran?.namaMapel}</td>
                    <td>{tingkatToDisplay(row.tingkat)}</td>
                    <td>{row.jurusan ? row.jurusan.namaProdi : 'Semua Prodi'}</td>
                    <td>
                      <span className={`badge badge-${row.kategoriSoal}`}>
                        {KATEGORI_OPTIONS.find((o) => o.value === row.kategoriSoal)?.label || row.kategoriSoal}
                      </span>
                    </td>
                    <td className="soal-preview">{row.soal ? row.soal.slice(0, 80) + (row.soal.length > 80 ? '…' : '') : '(Pernyataan di kolom A-F)'}</td>
                    <td>{row.jawaban}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Link to={`/guru/bank-soal/edit/${row.id}`} className="btn-action primary" style={{ background: '#3b82f6', color: 'white', border: 'none', width: '38px', height: '38px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', padding: 0 }} title="Edit"><FiEdit2 size={20} /></Link>
                        <button type="button" className="btn-action" style={{ background: '#ef4444', color: 'white', border: 'none', width: '38px', height: '38px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }} onClick={() => handleDelete(row.id)} title="Hapus"><FiTrash2 size={20} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && totalItems > 0 && (
        <div className="bank-soal-pagination">
          <span className="pagination-info">
            Menampilkan {startIndex + 1}-{startIndex + paginatedItems.length} dari {totalItems} soal
          </span>
          <div className="pagination-controls">
            <button
              type="button"
              className="pagination-btn"
              disabled={displayPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              aria-label="Halaman sebelumnya"
            >
              Sebelumnya
            </button>
            <div className="pagination-pages">
              {getPaginationPages(totalPages, displayPage).map((item, idx) =>
                item.type === 'ellipsis' ? (
                  <span key={`ellipsis-${item.key}`} className="pagination-ellipsis" aria-hidden="true">
                    …
                  </span>
                ) : (
                  <button
                    key={item.value}
                    type="button"
                    className={`pagination-page ${item.value === displayPage ? 'active' : ''}`}
                    onClick={() => setCurrentPage(item.value)}
                    aria-label={`Halaman ${item.value}`}
                    aria-current={item.value === displayPage ? 'page' : undefined}
                  >
                    {item.value}
                  </button>
                )
              )}
            </div>
            <button
              type="button"
              className="pagination-btn"
              disabled={displayPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Halaman berikutnya"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
