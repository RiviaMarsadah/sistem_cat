import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiEye, FiArrowLeft, FiBookOpen, FiUser, FiInfo, FiLayers, FiX } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import '../guru/GuruTheme.css';
import '../guru/JadwalUjian.css';
import '../guru/BankSoal.css';

const BASE_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
const ITEMS_PER_PAGE = 10;

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

const isImageFile = (str) => typeof str === 'string' && str.trim().endsWith('.webp');

export default function AdminGuruBankSoalDetail() {
  const { koleksiId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [koleksiDetail, setKoleksiDetail] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSoalForPreview, setSelectedSoalForPreview] = useState(null);

  const loadSoal = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/guru-data/bank-soal/${koleksiId}`);
      if (res.data?.success) {
        setKoleksiDetail(res.data.data);
        setItems(res.data.data?.bankSoal || []);
      }
    } catch (e) {
      showToast(e?.response?.data?.message || 'Gagal memuat bank soal', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSoal();
  }, [koleksiId]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return items;
    return items.filter((row) => 
      (row.soal || '').toLowerCase().includes(query) ||
      (row.jawaban || '').toLowerCase().includes(query) ||
      (row.kolomA || '').toLowerCase().includes(query) ||
      (row.kolomB || '').toLowerCase().includes(query) ||
      (row.kolomC || '').toLowerCase().includes(query) ||
      (row.kolomD || '').toLowerCase().includes(query) ||
      (row.kolomE || '').toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const isShowAll = currentPage === 9999;
  const displayPage = isShowAll ? 1 : Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = isShowAll ? 0 : (displayPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = isShowAll ? filteredItems : filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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

  return (
    <div className="bank-soal-page" style={{ padding: '0 20px 20px 20px' }}>
      <div className="bank-soal-header-banner flex justify-between items-center" style={{ marginTop: '20px', marginBottom: '20px' }}>
        <div>
          <button type="button" className="btn-back" onClick={() => navigate('/admin/guru/bank-soal')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.75rem', padding: 0 }}>
            <FiArrowLeft /> Kembali ke Daftar Bank Soal Guru
          </button>
          {koleksiDetail && (
            <>
              <h1 className="page-title guru-title" style={{ margin: '4px 0', fontSize: '1.75rem', fontWeight: '800', color: '#1e293b' }}>
                Koleksi: {koleksiDetail.nama}
              </h1>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginTop: '6px', fontSize: '0.85rem', color: '#64748b' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontWeight: '600' }}>
                  <FiBookOpen size={12} /> {koleksiDetail.mataPelajaran?.namaMapel || '-'}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontWeight: '600' }}>
                  <FiLayers size={12} /> Kelas {tingkatToDisplay(koleksiDetail.tingkat)} {koleksiDetail.jurusan?.namaProdi ? `(${koleksiDetail.jurusan?.namaProdi})` : ''}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#eff6ff', color: '#2563eb', padding: '4px 8px', borderRadius: '6px', fontWeight: '700' }}>
                  <FiUser size={12} /> Oleh: {koleksiDetail.guru?.user?.namaLengkap || 'Admin'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="guru-card">
        <div className="guru-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1rem 1.5rem' }}>
          <h2 className="guru-card-title" style={{ margin: 0 }}>
            Daftar Butir Soal ({filteredItems.length} dari {items.length})
          </h2>
          <div style={{ position: 'relative', width: '300px' }}>
            <input
              type="text"
              placeholder="Cari soal, opsi, atau kunci..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
            <p style={{ color: '#64748b' }}>Memuat butir soal...</p>
          </div>
        ) : (
          <div className="bank-soal-table-wrap">
            <table className="bank-soal-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>No</th>
                  <th style={{ width: '150px' }}>Kategori</th>
                  <th>Soal</th>
                  <th style={{ width: '90px' }}>Gambar</th>
                  <th>Jawaban A</th>
                  <th>Jawaban B</th>
                  <th>Jawaban C</th>
                  <th>Jawaban D</th>
                  <th>Jawaban E</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>Kunci Jawaban</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="empty-row" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                      {searchQuery ? 'Tidak ada soal yang cocok dengan pencarian Anda.' : 'Belum ada soal terdaftar.'}
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((row, idx) => (
                    <tr key={row.id}>
                      <td style={{ fontWeight: 'bold', color: '#64748b' }}>{startIndex + idx + 1}</td>
                      <td>
                        <span className={`badge badge-${row.kategoriSoal}`}>
                          {KATEGORI_OPTIONS.find((o) => o.value === row.kategoriSoal)?.label || row.kategoriSoal}
                        </span>
                      </td>
                      <td className="soal-preview" style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.soal ? (row.soal.length > 50 ? row.soal.slice(0, 50) + '…' : row.soal) : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>(Pernyataan)</span>}
                      </td>
                      <td>
                        {row.gambar ? (
                          <img 
                            src={row.gambar.endsWith('.webp') ? `${BASE_URL}/uploads/${row.gambar}` : row.gambar} 
                            alt="Soal" 
                            style={{ maxHeight: '40px', borderRadius: '4px', maxWidth: '80px', objectFit: 'contain' }} 
                          />
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>-</span>
                        )}
                      </td>
                      <td style={{ maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {isImageFile(row.kolomA) ? (
                          <img src={`${BASE_URL}/uploads/${row.kolomA}`} alt="Opsi A" style={{ maxHeight: '35px', borderRadius: '4px' }} />
                        ) : (
                          row.kolomA || '-'
                        )}
                      </td>
                      <td style={{ maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {isImageFile(row.kolomB) ? (
                          <img src={`${BASE_URL}/uploads/${row.kolomB}`} alt="Opsi B" style={{ maxHeight: '35px', borderRadius: '4px' }} />
                        ) : (
                          row.kolomB || '-'
                        )}
                      </td>
                      <td style={{ maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {isImageFile(row.kolomC) ? (
                          <img src={`${BASE_URL}/uploads/${row.kolomC}`} alt="Opsi C" style={{ maxHeight: '35px', borderRadius: '4px' }} />
                        ) : (
                          row.kolomC || '-'
                        )}
                      </td>
                      <td style={{ maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {isImageFile(row.kolomD) ? (
                          <img src={`${BASE_URL}/uploads/${row.kolomD}`} alt="Opsi D" style={{ maxHeight: '35px', borderRadius: '4px' }} />
                        ) : (
                          row.kolomD || '-'
                        )}
                      </td>
                      <td style={{ maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {isImageFile(row.kolomE) ? (
                          <img src={`${BASE_URL}/uploads/${row.kolomE}`} alt="Opsi E" style={{ maxHeight: '35px', borderRadius: '4px' }} />
                        ) : (
                          row.kolomE || '-'
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-pilgan">
                          {row.jawaban}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="action-buttons-cell" style={{ display: 'inline-flex', justifyContent: 'center' }}>
                          <button type="button" className="btn-icon view" onClick={() => setSelectedSoalForPreview(row)} title="Preview Soal">
                            <FiEye />
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

        {/* Pagination */}
        {!loading && totalItems > 0 && (
          <div className="bank-soal-pagination" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0' }}>
            <span className="pagination-info" style={{ fontSize: '0.85rem', color: '#64748b' }}>
              {isShowAll 
                ? `Menampilkan 1-${totalItems} dari ${totalItems} soal`
                : `Menampilkan ${startIndex + 1}-${startIndex + paginatedItems.length} dari ${totalItems} soal`
              }
            </span>
            <div className="pagination-controls" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button
                type="button"
                className="pagination-btn"
                disabled={isShowAll || displayPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{ padding: '6px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
              >
                Sebelumnya
              </button>
              <div className="pagination-pages" style={{ display: 'flex', gap: '4px' }}>
                {isShowAll ? (
                  <button
                    type="button"
                    className="pagination-page active"
                    onClick={() => setCurrentPage(1)}
                    style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' }}
                  >
                    Tampilkan Per Halaman
                  </button>
                ) : (
                  getPaginationPages(totalPages, displayPage).map((item, idx) =>
                    item.type === 'ellipsis' ? (
                      <span key={`ellipsis-${item.key}`} style={{ padding: '6px', color: '#94a3b8' }}>…</span>
                    ) : (
                      <button
                        key={item.value}
                        type="button"
                        className={`pagination-page ${item.value === displayPage ? 'active' : ''}`}
                        onClick={() => setCurrentPage(item.value)}
                        style={{
                          padding: '6px 12px',
                          background: item.value === displayPage ? '#3b82f6' : '#f1f5f9',
                          color: item.value === displayPage ? 'white' : '#475569',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        {item.value}
                      </button>
                    )
                  )
                )}
              </div>
              <button
                type="button"
                className="pagination-btn"
                disabled={isShowAll || displayPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                style={{ padding: '6px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {selectedSoalForPreview && (
        <div className="modal-overlay" onClick={() => setSelectedSoalForPreview(null)} role="dialog" aria-modal="true">
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                Preview Detail Butir Soal
              </h3>
              <button className="modal-close" onClick={() => setSelectedSoalForPreview(null)} aria-label="Tutup">×</button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem', maxHeight: '75vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                <span style={{ background: '#3b82f6', color: 'white', fontWeight: 'bold', fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px' }}>
                  Kategori: {KATEGORI_OPTIONS.find((o) => o.value === selectedSoalForPreview.kategoriSoal)?.label || selectedSoalForPreview.kategoriSoal}
                </span>
                <span style={{ background: '#f1f5f9', color: '#475569', fontWeight: '600', fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                  Tingkat: {tingkatToDisplay(selectedSoalForPreview.tingkat)}
                </span>
              </div>

              {selectedSoalForPreview.soal && (
                <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>
                  {selectedSoalForPreview.soal}
                </div>
              )}

              {selectedSoalForPreview.gambar && (
                <div style={{ margin: '15px 0', textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', background: '#f8fafc' }}>
                  <img
                    src={`${BASE_URL}/uploads/${selectedSoalForPreview.gambar}`}
                    alt="Visual Soal"
                    style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '6px' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '1rem' }}>
                {['A', 'B', 'C', 'D', 'E'].map((letter) => {
                  const optionVal = selectedSoalForPreview[`kolom${letter}`];
                  const isKategori = selectedSoalForPreview.kategoriSoal === 'pilgan_kategori';
                  if (!optionVal && !isKategori) return null;

                  const parsedPreviewAnswers = (selectedSoalForPreview.jawaban || '').split(',').map(s => s.trim().toUpperCase());
                  let isCorrect = false;
                  if (selectedSoalForPreview.kategoriSoal === 'pilgan') {
                    isCorrect = selectedSoalForPreview.jawaban === letter;
                  } else if (selectedSoalForPreview.kategoriSoal === 'pilgan_kompleks') {
                    isCorrect = parsedPreviewAnswers.includes(letter);
                  } else if (selectedSoalForPreview.kategoriSoal === 'pilgan_kategori') {
                    const letters = ['A', 'B', 'C', 'D', 'E'].filter(l => selectedSoalForPreview[`kolom${l}`]?.trim());
                    const letterIdx = letters.indexOf(letter);
                    isCorrect = letterIdx !== -1 && parsedPreviewAnswers[letterIdx] === 'B';
                  }

                  return (
                    <div key={letter} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: isCorrect ? '#ecfdf5' : '#f8fafc',
                      border: isCorrect ? '1px solid #10b981' : '1px solid #e2e8f0',
                    }}>
                      <span style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: '800',
                        background: isCorrect ? '#10b981' : '#cbd5e1',
                        color: 'white',
                      }}>
                        {letter}
                      </span>
                      <div style={{ flex: 1, fontSize: '0.9rem', color: isCorrect ? '#065f46' : '#1e293b', fontWeight: isCorrect ? '700' : '500' }}>
                        {optionVal && optionVal.endsWith('.webp') ? (
                          <img 
                            src={`${BASE_URL}/uploads/${optionVal}`} 
                            alt={`Pilihan ${letter}`} 
                            style={{ maxHeight: '120px', borderRadius: '4px', border: '1px solid #e2e8f0' }} 
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          optionVal || `[Pernyataan Kategori ${letter}]`
                        )}
                      </div>
                      {isKategori && (
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: isCorrect ? '#047857' : '#991b1b',
                          color: 'white',
                        }}>
                          {isCorrect ? 'BENAR (B)' : 'SALAH (S)'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0' }}>
              <button type="button" onClick={() => setSelectedSoalForPreview(null)} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                Tutup Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
