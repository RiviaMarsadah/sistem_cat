import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FiEdit2, FiPlus, FiTrash2, FiUpload, FiDownload, FiHelpCircle, FiX, FiFolder, FiArrowLeft, FiEye, FiCheck, FiSearch } from 'react-icons/fi';
import api from '../../services/api';
import './GuruTheme.css';
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

function displayToTingkatApi(v) {
  if (v === '10') return 'X';
  if (v === '11') return 'XI';
  if (v === '12') return 'XII';
  if (v === '0') return 'SEMUA';
  return v;
}

function apiToTingkatDisplay(t) {
  if (t === 'X') return '10';
  if (t === 'XI') return '11';
  if (t === 'XII') return '12';
  if (t === 'SEMUA') return '0';
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
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef(null);

  const [selectedSoalForPreview, setSelectedSoalForPreview] = useState(null);
  const [selectedSoalForEdit, setSelectedSoalForEdit] = useState(null);

  // States for Edit Form
  const [editMataPelajaranId, setEditMataPelajaranId] = useState('');
  const [editTingkat, setEditTingkat] = useState('10');
  const [editJurusanId, setEditJurusanId] = useState('');
  const [editKategoriSoal, setEditKategoriSoal] = useState('pilgan');
  const [editSoalText, setEditSoalText] = useState('');
  const [editKolom, setEditKolom] = useState({ A: '', B: '', C: '', D: '', E: '', F: '' });
  const [editJawaban, setEditJawaban] = useState({ single: '', multi: [], benarSalah: { A: '', B: '', C: '', D: '', E: '', F: '' } });
  const [editGambar, setEditGambar] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editFormError, setEditFormError] = useState('');

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

  const handleOpenEdit = (row) => {
    setSelectedSoalForEdit(row);
    setEditMataPelajaranId(row.mataPelajaranId ?? '');
    setEditTingkat(apiToTingkatDisplay(row.tingkat) ?? '10');
    setEditJurusanId(row.jurusanId != null ? String(row.jurusanId) : '');
    setEditKategoriSoal(row.kategoriSoal || 'pilgan');
    setEditSoalText(row.soal || '');
    setEditKolom({
      A: row.kolomA || '',
      B: row.kolomB || '',
      C: row.kolomC || '',
      D: row.kolomD || '',
      E: row.kolomE || '',
      F: row.kolomF || '',
    });
    setEditGambar(row.gambar || '');
    
    // Parse jawaban
    if (row.kategoriSoal === 'pilgan') {
      setEditJawaban({
        single: row.jawaban || '',
        multi: [],
        benarSalah: { A: '', B: '', C: '', D: '', E: '', F: '' }
      });
    } else if (row.kategoriSoal === 'pilgan_kompleks') {
      setEditJawaban({
        single: '',
        multi: (row.jawaban || '').split(',').map((s) => s.trim()).filter(Boolean),
        benarSalah: { A: '', B: '', C: '', D: '', E: '', F: '' }
      });
    } else {
      const parts = (row.jawaban || '').split(',').map((s) => s.trim().toUpperCase());
      const k = { A: row.kolomA || '', B: row.kolomB || '', C: row.kolomC || '', D: row.kolomD || '', E: row.kolomE || '', F: row.kolomF || '' };
      const filledLetters = ['A', 'B', 'C', 'D', 'E', 'F'].filter((l) => k[l]?.trim());
      const bs = { A: '', B: '', C: '', D: '', E: '', F: '' };
      filledLetters.forEach((l, i) => { bs[l] = parts[i] === 'S' ? 'S' : 'B'; });
      setEditJawaban({
        single: '',
        multi: [],
        benarSalah: bs
      });
    }
    setEditFormError('');
  };

  const toggleMultiEdit = (letter) => {
    setEditJawaban((j) => ({
      ...j,
      multi: j.multi.includes(letter) ? j.multi.filter((x) => x !== letter) : [...j.multi, letter],
    }));
  };

  const setBenarSalahEdit = (letter, value) => {
    setEditJawaban((j) => ({
      ...j,
      benarSalah: { ...j.benarSalah, [letter]: value },
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditFormError('');

    const filledKolom = ['A', 'B', 'C', 'D', 'E', 'F'].filter((l) => editKolom[l]?.trim()).length;
    if (editKategoriSoal !== 'pilgan_kategori' && filledKolom < 3) {
      setEditFormError('Minimal 3 kolom jawaban harus diisi.');
      return;
    }
    if (editKategoriSoal === 'pilgan' && !editJawaban.single) {
      setEditFormError('Pilih satu jawaban yang benar.');
      return;
    }
    if (editKategoriSoal === 'pilgan_kompleks' && editJawaban.multi.length === 0) {
      setEditFormError('Pilih minimal satu jawaban benar.');
      return;
    }
    if ((editKategoriSoal === 'pilgan' || editKategoriSoal === 'pilgan_kompleks') && !editSoalText.trim()) {
      setEditFormError('Pertanyaan wajib diisi.');
      return;
    }
    if (!editMataPelajaranId || !editTingkat) {
      setEditFormError('Mata pelajaran dan tingkat wajib dipilih.');
      return;
    }

    setEditSaving(true);

    try {
      const buildEditJawabanValue = () => {
        if (editKategoriSoal === 'pilgan') return editJawaban.single;
        if (editKategoriSoal === 'pilgan_kompleks') return editJawaban.multi.sort().join(',');
        if (editKategoriSoal === 'pilgan_kategori') {
          const filled = ['A', 'B', 'C', 'D', 'E', 'F'].filter((l) => editKolom[l]?.trim());
          return filled.map((l) => (editJawaban.benarSalah[l] === 'S' ? 'S' : 'B')).join(',');
        }
        return '';
      };

      const payload = {
        bankSoalKoleksiId: Number(koleksiId),
        mataPelajaranId: Number(editMataPelajaranId),
        tingkat: displayToTingkatApi(editTingkat),
        jurusanId: editJurusanId === '' ? null : Number(editJurusanId),
        kategoriSoal: editKategoriSoal,
        soal: editSoalText.trim() || null,
        kolomA: editKolom.A || null,
        kolomB: editKolom.B || null,
        kolomC: editKolom.C || null,
        kolomD: editKolom.D || null,
        kolomE: editKolom.E || null,
        kolomF: editKolom.F || null,
        jawaban: buildEditJawabanValue(),
        gambar: editGambar.trim() || null,
      };

      await api.put(`/guru/bank-soal/${selectedSoalForEdit.id}`, payload);
      setSelectedSoalForEdit(null);
      loadSoal();
    } catch (err) {
      setEditFormError(err?.response?.data?.message || 'Gagal menyimpan soal');
    } finally {
      setEditSaving(false);
    }
  };

  // Filter items based on search query
  const filteredItems = items.filter((row) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    
    const soalMatch = (row.soal || '').toLowerCase().includes(query);
    const jawabanMatch = (row.jawaban || '').toLowerCase().includes(query);
    const opsiAMatch = (row.kolomA || '').toLowerCase().includes(query);
    const opsiBMatch = (row.kolomB || '').toLowerCase().includes(query);
    const opsiCMatch = (row.kolomC || '').toLowerCase().includes(query);
    const opsiDMatch = (row.kolomD || '').toLowerCase().includes(query);
    const opsiEMatch = (row.kolomE || '').toLowerCase().includes(query);
    const opsiFMatch = (row.kolomF || '').toLowerCase().includes(query);
    
    return soalMatch || jawabanMatch || opsiAMatch || opsiBMatch || opsiCMatch || opsiDMatch || opsiEMatch || opsiFMatch;
  });

  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const displayPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (displayPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages >= 1) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  useEffect(() => {
    if (items.length > 0) {
      const first = items[0];
      setImportMapel(first.mataPelajaranId ? String(first.mataPelajaranId) : '');
      setImportTingkat(first.tingkat ? apiToTingkatDisplay(first.tingkat) : '');
      setImportJurusan(first.jurusanId != null ? String(first.jurusanId) : '');
    }
    if (koleksiId) {
      setImportKoleksiId(koleksiId);
    }
  }, [items, koleksiId]);

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
    <div className="guru-page bank-soal-page">
      <div className="guru-header guru-header-card">
        <div className="header-info">
          <button onClick={() => navigate('/guru/bank-soal')} className="btn-back">
            <FiArrowLeft /> Kembali ke Daftar Koleksi
          </button>
          <h1 className="guru-title">
            <span className="guru-title-text">{koleksiName}</span>
            <span className="guru-title-badge">Guru</span>
          </h1>
          <p className="guru-subtitle">
            <FiFolder /> Terdapat {items.length} Soal dalam koleksi ini
          </p>
        </div>

        <div className="guru-meta">
          <div className="guru-meta-card">
            <div className="guru-meta-label">Butir Soal</div>
            <div className="guru-meta-value">{items.length}</div>
          </div>
        </div>
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
                    <label>Pilih Bank Soal (Terkunci)</label>
                    <select value={importKoleksiId} disabled style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}>
                      <option value="">— Pilih Bank Soal —</option>
                      {koleksiList.map((k) => (
                        <option key={k.id} value={k.id}>{k.nama}</option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-group" style={{ margin: 0 }}>
                    <label>Mata Pelajaran * {items.length > 0 && '(Terkunci)'}</label>
                    <select 
                      value={importMapel} 
                      onChange={(e) => setImportMapel(e.target.value)} 
                      required 
                      disabled={items.length > 0}
                      style={items.length > 0 ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}
                    >
                      <option value="">— Pilih Mapel —</option>
                      {mapelList.map((m) => (
                        <option key={m.id} value={m.id}>{m.namaMapel}</option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-group" style={{ margin: 0 }}>
                    <label>Tingkat (Kelas) * {items.length > 0 && '(Terkunci)'}</label>
                    <select 
                      value={importTingkat} 
                      onChange={(e) => setImportTingkat(e.target.value)} 
                      required 
                      disabled={items.length > 0}
                      style={items.length > 0 ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}
                    >
                      <option value="">— Pilih Tingkat —</option>
                      {TINGKAT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-group" style={{ margin: 0 }}>
                    <label>Program Studi (Opsional) {items.length > 0 && '(Terkunci)'}</label>
                    <select 
                      value={importJurusan} 
                      onChange={(e) => setImportJurusan(e.target.value)}
                      disabled={items.length > 0}
                      style={items.length > 0 ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}
                    >
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

      <div className="guru-card">
        <div className="guru-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem', padding: '1rem 1.5rem' }}>
          {/* Kelompok Judul dan Search Bar di sebelah Kiri */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: '1', minWidth: '300px', flexWrap: 'wrap' }}>
            <h2 className="guru-card-title" style={{ margin: 0, whiteSpace: 'nowrap' }}>Daftar Butir Soal</h2>
            
            {/* Beautiful compact search input with magnifier icon */}
            <div className="search-box-wrap" style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
              <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '1.1rem', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Cari soal, opsi, atau kunci..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 2rem 0.55rem 2.25rem',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                  outline: 'none',
                  backgroundColor: '#f8fafc',
                  transition: 'all 0.2s'
                }}
                className="search-input-premium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Bersihkan
                </button>
              )}
            </div>
          </div>

          {/* Kelompok Aksi di sebelah Kanan */}
          <div className="header-actions" style={{ display: 'flex', gap: '0.75rem', margin: 0 }}>
            <button
              type="button"
              className="btn-import-excel"
              onClick={() => setShowImportModal(true)}
            >
              <FiUpload /> Import Soal
            </button>
            <Link to={`/guru/bank-soal/tambah?bankSoalKoleksiId=${koleksiId}`} className="btn-tambah">
              <FiPlus /> 
              <span>Tambah Soal</span>
            </Link>
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
                <th>Kategori</th>
                <th>Soal</th>
                <th>Jawaban A</th>
                <th>Jawaban B</th>
                <th>Jawaban C</th>
                <th>Jawaban D</th>
                <th>Jawaban E</th>
                <th>Jawaban F</th>
                <th>Kunci Jawaban</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="empty-row">
                    {searchQuery ? 'Tidak ada soal yang cocok dengan pencarian Anda.' : 'Belum ada soal. Klik "Tambah Soal".'}
                  </td>
                </tr>
              ) : (
                paginatedItems.map((row, idx) => (
                  <tr key={row.id}>
                    <td>{startIndex + idx + 1}</td>
                    <td>
                      <span className={`badge badge-${row.kategoriSoal}`}>
                        {KATEGORI_OPTIONS.find((o) => o.value === row.kategoriSoal)?.label || row.kategoriSoal}
                      </span>
                    </td>
                    <td className="soal-preview" style={{ maxWidth: '200px' }}>
                      {row.soal ? (row.soal.length > 50 ? row.soal.slice(0, 50) + '…' : row.soal) : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>(Pernyataan)</span>}
                    </td>
                    <td>{row.kolomA || '-'}</td>
                    <td>{row.kolomB || '-'}</td>
                    <td>{row.kolomC || '-'}</td>
                    <td>{row.kolomD || '-'}</td>
                    <td>{row.kolomE || '-'}</td>
                    <td>{row.kolomF || '-'}</td>
                    <td>
                      <span className="badge badge-pilgan">
                        {row.jawaban}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons-cell">
                        <button type="button" className="btn-icon view" onClick={() => setSelectedSoalForPreview(row)} title="Preview">
                          <FiEye />
                        </button>
                        <button type="button" className="btn-icon edit" onClick={() => handleOpenEdit(row)} title="Edit">
                          <FiEdit2 />
                        </button>
                        <button type="button" className="btn-icon delete" onClick={() => handleDelete(row.id)} title="Hapus">
                          <FiTrash2 />
                        </button>
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

      {/* Preview Modal - Hanya bisa ditutup dengan menekan tombol X */}
      {selectedSoalForPreview && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="bank-soal-modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Preview Detail Soal</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setSelectedSoalForPreview(null)}
                aria-label="Tutup"
              >
                <FiX />
              </button>
            </div>
            <div className="import-modal-body" style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#475569', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kategori</h4>
                <span className={`badge badge-${selectedSoalForPreview.kategoriSoal}`}>
                  {KATEGORI_OPTIONS.find((o) => o.value === selectedSoalForPreview.kategoriSoal)?.label || selectedSoalForPreview.kategoriSoal}
                </span>
              </div>

              {selectedSoalForPreview.soal && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#475569', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pertanyaan</h4>
                  <p style={{ margin: 0, fontSize: '1rem', color: '#0f172a', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                    {selectedSoalForPreview.soal}
                  </p>
                </div>
              )}

              {selectedSoalForPreview.gambar && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#475569', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gambar</h4>
                  <img 
                    src={selectedSoalForPreview.gambar} 
                    alt="Soal" 
                    style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', objectFit: 'contain' }} 
                  />
                </div>
              )}

              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', color: '#475569', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Opsi Jawaban / Pernyataan</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {['A', 'B', 'C', 'D', 'E', 'F'].map((letter) => {
                    const optionText = selectedSoalForPreview[`kolom${letter}`];
                    if (!optionText) return null;
                    
                    let isCorrect = false;
                    if (selectedSoalForPreview.kategoriSoal === 'pilgan') {
                      isCorrect = selectedSoalForPreview.jawaban === letter;
                    } else if (selectedSoalForPreview.kategoriSoal === 'pilgan_kompleks') {
                      const correctAnswers = (selectedSoalForPreview.jawaban || '').split(',').map(s => s.trim());
                      isCorrect = correctAnswers.includes(letter);
                    } else if (selectedSoalForPreview.kategoriSoal === 'pilgan_kategori') {
                      const bsParts = (selectedSoalForPreview.jawaban || '').split(',').map(s => s.trim().toUpperCase());
                      const letters = ['A', 'B', 'C', 'D', 'E', 'F'].filter(l => selectedSoalForPreview[`kolom${l}`]?.trim());
                      const idx = letters.indexOf(letter);
                      const status = bsParts[idx] === 'S' ? 'Salah' : 'Benar';
                      
                      return (
                        <div key={letter} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>{letter}. {optionText}</span>
                          <span className={`badge ${status === 'Benar' ? 'badge-pilgan_kompleks' : 'badge-pilgan_kategori'}`}>{status}</span>
                        </div>
                      );
                    }

                    return (
                      <div 
                        key={letter} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          padding: '0.75rem 1rem', 
                          background: isCorrect ? 'rgba(34, 197, 94, 0.1)' : '#f8fafc', 
                          border: isCorrect ? '1px solid #22c55e' : '1px solid #e2e8f0', 
                          borderRadius: '8px',
                          color: isCorrect ? '#15803d' : '#0f172a',
                          fontWeight: isCorrect ? 600 : 400
                        }}
                      >
                        <span style={{ marginRight: '0.5rem', fontWeight: 700 }}>{letter}.</span>
                        <span>{optionText}</span>
                        {isCorrect && <FiCheck style={{ marginLeft: 'auto', color: '#22c55e' }} />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#475569', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kunci Jawaban</h4>
                <span className="badge badge-pilgan" style={{ fontSize: '0.95rem', padding: '0.4rem 0.8rem' }}>
                  {selectedSoalForPreview.jawaban}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal - Hanya bisa ditutup dengan menekan tombol X */}
      {selectedSoalForEdit && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="bank-soal-modal" style={{ maxWidth: '780px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Soal</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setSelectedSoalForEdit(null)}
                aria-label="Tutup"
              >
                <FiX />
              </button>
            </div>
            
            <div style={{ overflowY: 'auto', padding: '1.5rem', flex: 1 }}>
              <form onSubmit={handleEditSubmit} className="import-form" style={{ marginTop: 0 }}>
                {editFormError && <div className="form-error">{editFormError}</div>}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div className="filter-group" style={{ margin: 0 }}>
                    <label>Mata Pelajaran (Terkunci)</label>
                    <select value={editMataPelajaranId} disabled style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}>
                      <option value="">— Pilih Mapel —</option>
                      {mapelList.map((m) => (
                        <option key={m.id} value={m.id}>{m.namaMapel}</option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-group" style={{ margin: 0 }}>
                    <label>Tingkat (Kelas) (Terkunci)</label>
                    <select value={editTingkat} disabled style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}>
                      {TINGKAT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-group" style={{ margin: 0 }}>
                    <label>Program Studi (Terkunci)</label>
                    <select value={editJurusanId} disabled style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}>
                      <option value="">Semua Prodi</option>
                      {jurusanList.map((j) => (
                        <option key={j.id} value={j.id}>{j.namaProdi}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="filter-group" style={{ margin: '0 0 1.25rem 0' }}>
                  <label>Kategori Soal *</label>
                  <select value={editKategoriSoal} onChange={(e) => setEditKategoriSoal(e.target.value)}>
                    {KATEGORI_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {(editKategoriSoal === 'pilgan' || editKategoriSoal === 'pilgan_kompleks') && (
                  <>
                    <div className="filter-group" style={{ margin: '0 0 1.25rem 0' }}>
                      <label>Pertanyaan *</label>
                      <textarea 
                        value={editSoalText} 
                        onChange={(e) => setEditSoalText(e.target.value)} 
                        rows={3} 
                        placeholder="Tulis pertanyaan..." 
                        required 
                        style={{ width: '100%', padding: '0.65rem 0.85rem', border: '2px solid #cbd5e1', borderRadius: '8px', background: '#fff', fontSize: '0.9375rem', resize: 'vertical' }}
                      />
                    </div>
                    <div className="filter-group" style={{ margin: '0 0 1.25rem 0' }}>
                      <label>URL Gambar (opsional)</label>
                      <input 
                        type="text" 
                        value={editGambar} 
                        onChange={(e) => setEditGambar(e.target.value)} 
                        placeholder="https://..." 
                        style={{ width: '100%', padding: '0.65rem 0.85rem', border: '2px solid #cbd5e1', borderRadius: '8px', background: '#fff', fontSize: '0.9375rem' }}
                      />
                    </div>
                  </>
                )}

                {editKategoriSoal === 'pilgan_kategori' && (
                  <>
                    <div className="filter-group" style={{ margin: '0 0 1.25rem 0' }}>
                      <label>Pertanyaan (opsional)</label>
                      <textarea 
                        value={editSoalText} 
                        onChange={(e) => setEditSoalText(e.target.value)} 
                        rows={3} 
                        placeholder="Tulis pertanyaan atau konteks untuk pernyataan di bawah (opsional)..." 
                        style={{ width: '100%', padding: '0.65rem 0.85rem', border: '2px solid #cbd5e1', borderRadius: '8px', background: '#fff', fontSize: '0.9375rem', resize: 'vertical' }}
                      />
                    </div>
                    <div className="filter-group" style={{ margin: '0 0 1.25rem 0' }}>
                      <label>URL Gambar (opsional)</label>
                      <input 
                        type="text" 
                        value={editGambar} 
                        onChange={(e) => setEditGambar(e.target.value)} 
                        placeholder="https://..." 
                        style={{ width: '100%', padding: '0.65rem 0.85rem', border: '2px solid #cbd5e1', borderRadius: '8px', background: '#fff', fontSize: '0.9375rem' }}
                      />
                    </div>
                  </>
                )}

                <div className="filter-group" style={{ margin: '0 0 1.5rem 0' }}>
                  <label>{editKategoriSoal === 'pilgan_kategori' ? 'Pernyataan (isi di kolom A–F)' : 'Opsi Jawaban (minimal 3)'}</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.50rem' }}>
                    {['A', 'B', 'C', 'D', 'E', 'F'].map((letter) => (
                      <div key={letter} className="kolom-row" style={{ margin: 0 }}>
                        <span className="kolom-letter" style={{ fontSize: '1rem', fontWeight: 'bold' }}>{letter}.</span>
                        <input
                          type="text"
                          value={editKolom[letter]}
                          onChange={(e) => setEditKolom((k) => ({ ...k, [letter]: e.target.value }))}
                          placeholder={editKategoriSoal === 'pilgan_kategori' ? `Pernyataan ${letter}` : `Opsi ${letter}`}
                          style={{ margin: 0 }}
                        />
                        {editKategoriSoal === 'pilgan' && (
                          <button
                            type="button"
                            className={`btn-check ${editJawaban.single === letter ? 'active' : ''}`}
                            onClick={() => setEditJawaban((j) => ({ ...j, single: letter }))}
                            title="Jawaban benar"
                            style={{ margin: 0 }}
                          >
                            <FiCheck />
                          </button>
                        )}
                        {editKategoriSoal === 'pilgan_kompleks' && (
                          <button
                            type="button"
                            className={`btn-check ${editJawaban.multi.includes(letter) ? 'active' : ''}`}
                            onClick={() => toggleMultiEdit(letter)}
                            title="Centang jika benar"
                            style={{ margin: 0 }}
                          >
                            <FiCheck />
                          </button>
                        )}
                        {editKategoriSoal === 'pilgan_kategori' && (
                          <div className="benar-salah-btns" style={{ display: 'flex', gap: '0.25rem' }}>
                            <button
                              type="button"
                              className={editJawaban.benarSalah[letter] === 'B' ? 'active' : ''}
                              onClick={() => setBenarSalahEdit(letter, 'B')}
                              style={{ padding: '0.4rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', background: editJawaban.benarSalah[letter] === 'B' ? '#22c55e' : '#fff', color: editJawaban.benarSalah[letter] === 'B' ? '#fff' : '#475569', fontWeight: 600 }}
                            >
                              Benar
                            </button>
                            <button
                              type="button"
                              className={editJawaban.benarSalah[letter] === 'S' ? 'active' : ''}
                              onClick={() => setBenarSalahEdit(letter, 'S')}
                              style={{ padding: '0.4rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', background: editJawaban.benarSalah[letter] === 'S' ? '#ef4444' : '#fff', color: editJawaban.benarSalah[letter] === 'S' ? '#fff' : '#475569', fontWeight: 600 }}
                            >
                              Salah
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setSelectedSoalForEdit(null)} style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.6rem 1.2rem', cursor: 'pointer', background: '#fff' }}>
                    Batal
                  </button>
                  <button type="submit" className="btn-primary" disabled={editSaving} style={{ borderRadius: '8px', padding: '0.6rem 1.2rem', cursor: 'pointer', background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 600 }}>
                    {editSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
