import { useEffect, useState, useMemo } from 'react';
import { FiEye, FiX, FiUser, FiCalendar, FiBookOpen } from 'react-icons/fi';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import '../guru/GuruTheme.css';
import '../guru/JadwalUjian.css';
import '../guru/PaketUjian.css';

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

const ITEMS_PER_PAGE = 10;

export default function AdminGuruPaketUjian() {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [soalModalOpen, setSoalModalOpen] = useState(false);
  const [soalModalLoading, setSoalModalLoading] = useState(false);
  const [soalModalData, setSoalModalData] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/guru-data/paket-ujian');
      setItems(res.data?.data || []);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Gagal memuat paket ujian guru', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(row => 
      (row.nama || '').toLowerCase().includes(query) ||
      (row.mataPelajaran?.namaMapel || '').toLowerCase().includes(query) ||
      (row.guru?.user?.namaLengkap || '').toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const isShowAll = currentPage === 9999;
  const displayPage = isShowAll ? 1 : Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = isShowAll ? 0 : (displayPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = isShowAll ? filteredItems : filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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

  const openSoalModal = async (id) => {
    setSoalModalOpen(true);
    setSoalModalData(null);
    setSoalModalLoading(true);
    try {
      // Re-use listAllPaket but find detail
      const selected = items.find(it => it.id === id);
      setSoalModalData(selected || null);
    } catch (e) {
      setSoalModalData(null);
      showToast('Gagal memuat soal paket ujian', 'error');
    } finally {
      setSoalModalLoading(false);
    }
  };

  const closeSoalModal = () => {
    setSoalModalOpen(false);
    setSoalModalData(null);
  };

  return (
    <div className="paket-ujian-page guru-page" style={{ padding: '0 20px 20px 20px' }}>
      <div className="guru-header guru-header-card" style={{ marginTop: '20px' }}>
        <div>
          <h1 className="guru-title">
            <span className="guru-title-text">Paket Ujian Guru</span>
            <span className="guru-title-badge">Monitoring</span>
          </h1>
          <p className="guru-subtitle">Pemantauan seluruh paket ujian terstandar yang disusun dari bank soal oleh Guru.</p>
        </div>
        <div className="guru-meta">
          <div className="guru-meta-card">
            <div className="guru-meta-label">Total Paket</div>
            <div className="guru-meta-value">{items.length}</div>
          </div>
        </div>
      </div>

      <div className="guru-card">
        <div className="guru-card-header">
          <h2 className="guru-card-title" style={{ margin: 0 }}>Daftar Paket Ujian Guru</h2>
          <div style={{ position: 'relative', width: '280px' }}>
            <input
              type="text"
              placeholder="Cari paket ujian atau guru..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                paddingLeft: '34px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 1rem auto' }}></div>
            <p style={{ color: '#64748b' }}>Memuat paket ujian...</p>
          </div>
        ) : (
          <div className="paket-ujian-table-wrap">
            <table className="paket-ujian-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>No</th>
                  <th>Nama Paket Ujian</th>
                  <th>Mata Pelajaran</th>
                  <th style={{ textAlign: 'center', width: '180px' }}>Pembuat (Guru)</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Tingkat</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Tipe</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>Jumlah Soal</th>
                  <th style={{ width: '150px' }}>Dibuat Pada</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="empty-row" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                      Tidak ada paket ujian guru ditemukan.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((row, idx) => (
                    <tr key={row.id} className="table-row-hover" style={{ cursor: 'pointer' }} onClick={() => openSoalModal(row.id)}>
                      <td style={{ fontWeight: 'bold', color: '#64748b' }}>{startIndex + idx + 1}</td>
                      <td>
                        <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.9rem' }}>{row.nama}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: '600', color: '#334155', fontSize: '0.85rem' }}>{row.mataPelajaran?.namaMapel || '-'}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#475569', fontWeight: '700', padding: '4px 8px', background: '#f1f5f9', borderRadius: '6px' }}>
                          <FiUser size={12} /> {row.guru?.user?.namaLengkap || 'Admin'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="user-role-badge status-aktif" style={{ textTransform: 'uppercase' }}>{tingkatToDisplay(row.tingkat)}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="user-role-badge status-aktif" style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}>
                          {TIPE_OPTIONS.find((o) => o.value === row.tipeUjian)?.label || row.tipeUjian}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="soal-count-badge" style={{ fontWeight: 'bold' }}>
                          {row._count?.soalPaket ?? 0} Soal
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '600', color: '#64748b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FiCalendar size={12} /> {new Date(row.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="btn-icon view"
                          onClick={() => openSoalModal(row.id)}
                          title="Tampilkan Soal"
                          style={{ display: 'inline-flex', margin: '0 auto' }}
                        >
                          <FiEye />
                        </button>
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
              {isShowAll 
                ? `Menampilkan 1 - ${totalItems} dari ${totalItems} paket` 
                : `Menampilkan ${startIndex + 1} - ${Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} dari ${totalItems} paket`
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
            </div>
          </div>
        )}
      </div>

      {soalModalOpen && (
        <div className="modal-overlay" onClick={closeSoalModal} role="dialog" aria-modal="true" aria-labelledby="modal-soal-title">
          <div className="modal-content modal-soal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '90vw' }}>
            <div className="modal-header">
              <h2 id="modal-soal-title" className="modal-title">
                {soalModalData ? `Butir Soal Paket: ${soalModalData.nama}` : 'Butir Soal Paket'}
              </h2>
              <button type="button" className="modal-close" onClick={closeSoalModal} aria-label="Tutup">
                <FiX />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {soalModalLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }} className="soal-picker-loading">Memuat soal...</div>
              ) : !soalModalData ? (
                <div style={{ textAlign: 'center', padding: '2rem' }} className="soal-picker-empty">Gagal memuat data.</div>
              ) : !soalModalData.soalPaket?.length ? (
                <div style={{ textAlign: 'center', padding: '2rem' }} className="soal-picker-empty">Belum ada soal di paket ini.</div>
              ) : (
                <div className="modal-soal-table-wrap">
                  <table className="paket-ujian-table modal-soal-table">
                    <thead>
                      <tr>
                        <th style={{ width: '50px' }}>No</th>
                        <th style={{ width: '150px' }}>Mata Pelajaran</th>
                        <th style={{ width: '70px', textAlign: 'center' }}>Tingkat</th>
                        <th style={{ width: '160px' }}>Kategori</th>
                        <th>Soal / Pernyataan</th>
                        <th style={{ width: '120px', textAlign: 'center' }}>Jawaban Benar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {soalModalData.soalPaket.map((sp, idx) => {
                        const s = sp.bankSoal;
                        if (!s) return null;
                        return (
                          <tr key={sp.id ?? s.id}>
                            <td style={{ fontWeight: 'bold', color: '#64748b' }}>{idx + 1}</td>
                            <td>
                              <span style={{ fontWeight: '600', color: '#475569', fontSize: '0.85rem' }}>{s.mataPelajaran?.namaMapel}</span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className="user-role-badge status-aktif">{tingkatToDisplay(s.tingkat)}</span>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', background: '#f1f5f9', color: '#334155' }}>
                                {KATEGORI_OPTIONS.find((k) => k.value === s.kategoriSoal)?.label || s.kategoriSoal}
                              </span>
                            </td>
                            <td className="cell-soal-preview" style={{ fontSize: '0.85rem', fontWeight: '500', color: '#1e293b' }}>
                              {s.soal ? (s.soal.length > 70 ? s.soal.slice(0, 70) + '…' : s.soal) : '[Gambar / Pernyataan saja]'}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{ background: '#ecfdf5', color: '#047857', fontWeight: '800', border: '1px solid #a7f3d0', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                                {s.jawaban}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem', borderTop: '1px solid #e2e8f0' }}>
              <button type="button" onClick={closeSoalModal} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                Tutup Sesi Detail Soal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
