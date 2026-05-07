import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiEdit2, FiEye, FiPlus, FiTrash2, FiX, FiLock } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './GuruTheme.css';
import './JadwalUjian.css';
import './PaketUjian.css';

const TIPE_OPTIONS = [
  { value: 'UH', label: 'UH' },
  { value: 'UTS', label: 'UTS' },
  { value: 'UAS', label: 'UAS' },
  { value: 'Lainnya', label: 'Lainnya' },
];

const KATEGORI_OPTIONS = [
  { value: 'pilgan', label: 'Pilihan Ganda Sederhana' },
  { value: 'pilgan_kompleks', label: 'Pilihan Ganda Kompleks' },
  { value: 'pilgan_kategori', label: 'Pilihan Ganda Kategori' },
];

function tingkatToDisplay(t) {
  if (t === 'X') return '10';
  if (t === 'XI') return '11';
  if (t === 'XII') return '12';
  if (t === 'SEMUA') return 'Semua';
  return t;
}

export default function PaketUjian() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [soalModalOpen, setSoalModalOpen] = useState(false);
  const [soalModalLoading, setSoalModalLoading] = useState(false);
  const [soalModalData, setSoalModalData] = useState(null);

  // Pagination
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const displayPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (displayPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = items.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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

  useEffect(() => { if (currentPage > totalPages && totalPages >= 1) setCurrentPage(totalPages); }, [totalPages, currentPage]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/guru/paket-ujian');
      setItems(res.data?.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Gagal memuat paket ujian');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin hapus paket ujian ini?')) return;
    try {
      await api.delete(`/guru/paket-ujian/${id}`);
      load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Gagal menghapus');
    }
  };

  const openSoalModal = async (id) => {
    setSoalModalOpen(true);
    setSoalModalData(null);
    setSoalModalLoading(true);
    try {
      const res = await api.get(`/guru/paket-ujian/${id}`);
      setSoalModalData(res.data?.data || null);
    } catch (e) {
      setSoalModalData(null);
      setError(e?.response?.data?.message || 'Gagal memuat soal');
    } finally {
      setSoalModalLoading(false);
    }
  };

  const closeSoalModal = () => {
    setSoalModalOpen(false);
    setSoalModalData(null);
  };

  return (
    <div className="paket-ujian-page guru-page">
      <div className="guru-header guru-header-card">
        <div>
          <h1 className="guru-title">
            <span className="guru-title-text">Paket Ujian</span>
            <span className="guru-title-badge">Guru</span>
          </h1>
          <p className="guru-subtitle">Buat dan kelola paket soal ujian (UH, UTS, UAS) yang siap dijadwalkan</p>
        </div>
        <div className="guru-meta">
          <div className="guru-meta-card">
            <div className="guru-meta-label">Total Paket</div>
            <div className="guru-meta-value">{items.length}</div>
          </div>
          <Link to="/guru/paket-ujian/tambah" className="btn-add-user">
            <FiPlus className="btn-plus" />
            <span>Buat Paket Ujian</span>
          </Link>
        </div>
      </div>

      {error && <div className="user-alert" role="alert">{error}</div>}

      <div className="guru-card">
        <div className="guru-card-header">
          <h2 className="guru-card-title">Daftar Paket Ujian</h2>
        </div>

        {loading ? (
          <div className="loading-state">Memuat...</div>
        ) : (
        <div className="paket-ujian-table-wrap">
          <table className="paket-ujian-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Paket</th>
                <th>Mapel</th>
                <th>Tingkat</th>
                <th>Tipe</th>
                <th>Jumlah Soal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-row">
                    Belum ada paket ujian. Klik &quot;Buat Paket Ujian&quot;.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((row, idx) => (
                  <tr key={row.id}>
                    <td>{startIndex + idx + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                        <span>{row.nama}</span>
                        {row.guru?.user?.namaLengkap && row.guru.user.namaLengkap !== user?.namaLengkap && (
                          <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: '#e2e8f0', borderRadius: '4px', color: '#475569', whiteSpace: 'nowrap' }}>
                            Oleh: {row.guru.user.namaLengkap}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{row.mataPelajaran?.namaMapel}</td>
                    <td>{tingkatToDisplay(row.tingkat)}</td>
                    <td>{TIPE_OPTIONS.find((o) => o.value === row.tipeUjian)?.label || row.tipeUjian}</td>
                    <td>{row._count?.soalPaket ?? 0}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-icon view"
                        onClick={() => openSoalModal(row.id)}
                        title="Tampilkan Soal"
                      >
                        <FiEye />
                      </button>
                      {row.guru?.user?.namaLengkap === user?.namaLengkap ? (
                        <>
                          <Link to={`/guru/paket-ujian/edit/${row.id}`} className="btn-icon edit" title="Edit">
                            <FiEdit2 />
                          </Link>
                          <button
                            type="button"
                            className="btn-icon delete"
                            onClick={() => handleDelete(row.id)}
                            title="Hapus"
                          >
                            <FiTrash2 />
                          </button>
                        </>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', marginLeft: '6px' }} title="Hanya author yang bisa edit">
                          <FiLock style={{ display: 'inline', marginBottom: '-2px' }} /> Shared
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        )}

        {/* Pagination */}
        {!loading && totalItems > 0 && (
          <div className="table-pagination">
            <span className="table-pagination-info">
              Menampilkan {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} dari {totalItems} paket
            </span>
            <div className="table-pagination-controls">
              <button type="button" className="table-pagination-btn" disabled={displayPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>Sebelumnya</button>
              <div className="table-pagination-pages">
                {getPaginationPages(totalPages, displayPage).map((item) =>
                  item.type === 'ellipsis' ? (
                    <span key={`ellipsis-${item.key}`} className="table-pagination-ellipsis">…</span>
                  ) : (
                    <button key={item.value} type="button" className={`table-pagination-page ${item.value === displayPage ? 'active' : ''}`} onClick={() => setCurrentPage(item.value)}>{item.value}</button>
                  )
                )}
              </div>
              <button type="button" className="table-pagination-btn" disabled={displayPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>Berikutnya</button>
              <button type="button" className="table-pagination-btn show-all" onClick={handleShowAll}>Tampilkan Semua</button>
            </div>
          </div>
        )}
      </div>

      {soalModalOpen && (
        <div className="modal-overlay" onClick={closeSoalModal} role="dialog" aria-modal="true" aria-labelledby="modal-soal-title">
          <div className="modal-content modal-soal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 id="modal-soal-title" className="modal-title">
                {soalModalData ? `Soal dalam paket: ${soalModalData.nama}` : 'Soal dalam paket'}
              </h2>
              <button type="button" className="modal-close" onClick={closeSoalModal} aria-label="Tutup">
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              {soalModalLoading ? (
                <div className="soal-picker-loading">Memuat soal...</div>
              ) : !soalModalData ? (
                <div className="soal-picker-empty">Gagal memuat data.</div>
              ) : !soalModalData.soalPaket?.length ? (
                <div className="soal-picker-empty">Belum ada soal di paket ini.</div>
              ) : (
                <div className="modal-soal-table-wrap">
                  <table className="paket-ujian-table modal-soal-table">
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>Mapel</th>
                        <th>Tingkat</th>
                        <th>Kategori</th>
                        <th>Soal / Pernyataan</th>
                        <th>Jawaban</th>
                      </tr>
                    </thead>
                    <tbody>
                      {soalModalData.soalPaket.map((sp, idx) => {
                        const s = sp.bankSoal;
                        if (!s) return null;
                        return (
                          <tr key={sp.id ?? s.id}>
                            <td>{idx + 1}</td>
                            <td>{s.mataPelajaran?.namaMapel}</td>
                            <td>{tingkatToDisplay(s.tingkat)}</td>
                            <td>
                              <span className={`badge badge-${s.kategoriSoal}`}>
                                {KATEGORI_OPTIONS.find((k) => k.value === s.kategoriSoal)?.label || s.kategoriSoal}
                              </span>
                            </td>
                            <td className="cell-soal-preview">
                              {s.soal ? (s.soal.slice(0, 80) + (s.soal.length > 80 ? '…' : '')) : '(Pernyataan di kolom A-F)'}
                            </td>
                            <td>{s.jawaban}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
