import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiEdit2, FiPlus, FiTrash2, FiUpload, FiDownload, FiHelpCircle } from 'react-icons/fi';
import api from '../../services/api';
import './BankSoal.css';

const KATEGORI_OPTIONS = [
  { value: 'single_choice', label: 'Single Choice (Pilihan Ganda)' },
  { value: 'multi_choice', label: 'Multi Choice (Banyak Jawaban Benar)' },
  { value: 'benar_salah', label: 'Pernyataan Benar/Salah' },
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

export default function BankSoal() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mapelList, setMapelList] = useState([]);
  const [jurusanList, setJurusanList] = useState([]);

  const [filterMapel, setFilterMapel] = useState('');
  const [filterTingkat, setFilterTingkat] = useState('');
  const [filterJurusan, setFilterJurusan] = useState('');
  const [filterKategori, setFilterKategori] = useState('');

  const [importMapel, setImportMapel] = useState('');
  const [importTingkat, setImportTingkat] = useState('');
  const [importJurusan, setImportJurusan] = useState('');
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showImportSection, setShowImportSection] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = useRef(null);

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

  const loadSoal = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filterMapel) params.set('mataPelajaranId', filterMapel);
      if (filterTingkat) params.set('tingkat', filterTingkat === '10' ? 'X' : filterTingkat === '11' ? 'XI' : filterTingkat === '12' ? 'XII' : filterTingkat === '0' ? 'SEMUA' : '');
      if (filterJurusan !== '') params.set('jurusanId', filterJurusan);
      if (filterKategori) params.set('kategoriSoal', filterKategori);
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
  }, [filterMapel, filterTingkat, filterJurusan, filterKategori]);

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
    if (!importMapel || !importTingkat) {
      setError('Pilih Mata Pelajaran dan Tingkat terlebih dahulu.');
      return;
    }
    if (!importFile) {
      setError('Pilih file Excel yang akan diunggah.');
      return;
    }
    setImportLoading(true);
    setError('');
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('mataPelajaranId', importMapel);
      formData.append('tingkat', importTingkat);
      if (importJurusan) formData.append('jurusanId', importJurusan);
      const res = await api.post('/guru/bank-soal/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(res.data?.data || res.data);
      setImportMapel('');
      setImportTingkat('');
      setImportJurusan('');
      setImportFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (res.data?.data?.created > 0) loadSoal();
    } catch (e) {
      setError(e?.response?.data?.message || 'Gagal mengimpor');
      setImportResult(null);
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="bank-soal-page">
      <div className="bank-soal-header">
        <div>
          <h1 className="page-title guru-title">
            <span className="title-text">Bank Soal</span>
            <span className="title-badge guru-badge">Guru</span>
          </h1>
          <p className="page-subtitle">Kelola soal berdasarkan mapel, tingkat (10/11/12), dan prodi</p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn-import-excel"
            onClick={() => setShowImportSection((v) => !v)}
            aria-expanded={showImportSection}
          >
            <FiUpload /> Import Excel
          </button>
          <Link to="/guru/bank-soal/tambah" className="btn-tambah">
            <FiPlus /> Tambah Soal
          </Link>
        </div>
      </div>

      {showImportSection && (
        <div className="bank-soal-import-section">
          <h3 className="import-section-title">Import Bank Soal dari Excel</h3>
          <p className="import-section-desc">Pilih mapel, tingkat, dan prodi. Soal dan kategori diambil dari file Excel.</p>
          <div className="import-actions-row">
            <button type="button" className="btn-download-template" onClick={handleDownloadTemplate}>
              <FiDownload /> Download Template
            </button>
            <button type="button" className="btn-guide" onClick={() => setShowGuideModal(true)}>
              <FiHelpCircle /> Panduan Format Excel
            </button>
          </div>
          <form onSubmit={handleImport} className="import-form">
            <div className="import-form-row">
              <div className="filter-group">
                <label>Mata Pelajaran</label>
                <select value={importMapel} onChange={(e) => setImportMapel(e.target.value)} required>
                  <option value="">— Pilih Mapel —</option>
                  {mapelList.map((m) => (
                    <option key={m.id} value={m.id}>{m.namaMapel}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Tingkat</label>
                <select value={importTingkat} onChange={(e) => setImportTingkat(e.target.value)} required>
                  <option value="">— Pilih Tingkat —</option>
                  {TINGKAT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Prodi</label>
                <select value={importJurusan} onChange={(e) => setImportJurusan(e.target.value)}>
                  <option value="">Semua Prodi</option>
                  {jurusanList.map((j) => (
                    <option key={j.id} value={j.id}>{j.nama}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="import-form-row import-file-row">
              <div className="filter-group">
                <label>File Excel (.xlsx)</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                />
                {importFile && <span className="file-name">{importFile.name}</span>}
              </div>
              <button type="submit" className="btn-submit-import" disabled={importLoading}>
                {importLoading ? 'Mengimpor...' : 'Import'}
              </button>
            </div>
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
      )}

      {showGuideModal && (
        <div className="modal-overlay" onClick={() => setShowGuideModal(false)} role="dialog" aria-modal="true">
          <div className="bank-soal-modal guide-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Panduan Format Excel Import Bank Soal</h2>
              <button type="button" className="modal-close" onClick={() => setShowGuideModal(false)} aria-label="Tutup">×</button>
            </div>
            <div className="guide-content">
              <p><strong>Kolom di sheet &quot;Soal&quot; (baris pertama = header):</strong></p>
              <table className="guide-table">
                <thead>
                  <tr><th>Kolom</th><th>Keterangan</th></tr>
                </thead>
                <tbody>
                  <tr><td><code>Kategori</code></td><td><code>single_choice</code> | <code>multi_choice</code> | <code>benar_salah</code></td></tr>
                  <tr><td><code>Soal</code></td><td>Teks pertanyaan (opsional untuk benar_salah)</td></tr>
                  <tr><td><code>Opsi A</code> s/d <code>Opsi F</code></td><td>Isi opsi atau pernyataan. Minimal 3 untuk single/multi choice, minimal 1 untuk benar_salah</td></tr>
                  <tr><td><code>Jawaban</code></td><td>Single: satu huruf A–F. Multi: dipisah koma, contoh <code>A,B,D</code>. Benar/Salah: B atau S per pernyataan, contoh <code>B,B,S</code></td></tr>
                  <tr><td><code>Gambar</code></td><td>URL gambar (opsional)</td></tr>
                </tbody>
              </table>
              <p><strong>Contoh nilai Kategori:</strong> <code>single_choice</code>, <code>multi_choice</code>, <code>benar_salah</code></p>
              <p>Untuk <strong>benar_salah</strong>, isi Jawaban dengan <strong>B</strong> (Benar) dan <strong>S</strong> (Salah) sesuai urutan Opsi A, B, C, …</p>
              <p>Gunakan file template yang didownload agar format kolom sesuai.</p>
            </div>
          </div>
        </div>
      )}

      <div className="bank-soal-filters">
        <h3 className="bank-soal-filters-title">Filter Daftar Soal</h3>
        <div className="filter-group">
          <label>Mata Pelajaran</label>
          <select value={filterMapel} onChange={(e) => setFilterMapel(e.target.value)}>
            <option value="">Semua Mapel</option>
            {mapelList.map((m) => (
              <option key={m.id} value={m.id}>{m.namaMapel}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Tingkat (Kelas)</label>
          <select value={filterTingkat} onChange={(e) => setFilterTingkat(e.target.value)}>
            <option value="">Semua</option>
            {TINGKAT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Prodi</label>
          <select value={filterJurusan} onChange={(e) => setFilterJurusan(e.target.value)}>
            <option value="">Semua Prodi</option>
            {jurusanList.map((j) => (
              <option key={j.id} value={j.id}>{j.nama}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Kategori Soal</label>
          <select value={filterKategori} onChange={(e) => setFilterKategori(e.target.value)}>
            <option value="">Semua Kategori</option>
            {KATEGORI_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

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
                    <td>{row.jurusan ? row.jurusan.nama : 'Semua Prodi'}</td>
                    <td>
                      <span className={`badge badge-${row.kategoriSoal}`}>
                        {KATEGORI_OPTIONS.find((o) => o.value === row.kategoriSoal)?.label || row.kategoriSoal}
                      </span>
                    </td>
                    <td className="soal-preview">{row.soal ? row.soal.slice(0, 80) + (row.soal.length > 80 ? '…' : '') : '(Pernyataan di kolom A-F)'}</td>
                    <td>{row.jawaban}</td>
                    <td>
                      <Link to={`/guru/bank-soal/edit/${row.id}`} className="btn-icon edit" title="Edit"><FiEdit2 /></Link>
                      <button type="button" className="btn-icon delete" onClick={() => handleDelete(row.id)} title="Hapus"><FiTrash2 /></button>
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
