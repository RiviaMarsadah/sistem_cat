import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiFolder, FiEye, FiUser, FiCalendar, FiBookOpen } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import '../guru/GuruTheme.css';
import '../guru/JadwalUjian.css';
import '../guru/BankSoal.css';

const ITEMS_PER_PAGE = 10;

export default function AdminGuruBankSoal() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/guru-data/bank-soal');
      setItems(res.data?.data || []);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Gagal memuat bank soal guru', 'error');
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

  return (
    <div className="guru-page bank-soal-page" style={{ padding: '0 20px 20px 20px' }}>
      <div className="guru-header guru-header-card" style={{ marginTop: '20px' }}>
        <div>
          <h1 className="guru-title">
            <span className="guru-title-text">Bank Soal Guru</span>
            <span className="guru-title-badge">Monitoring</span>
          </h1>
          <p className="guru-subtitle">Pemantauan seluruh folder bank soal dan materi pelajaran yang dibuat oleh Guru.</p>
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
          <h2 className="guru-card-title" style={{ margin: 0 }}>Daftar Bank Soal Guru</h2>
          <div style={{ position: 'relative', width: '280px' }}>
            <input
              type="text"
              placeholder="Cari bank soal atau guru..."
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
                transition: 'border-color 0.2s',
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

        <div className="bank-soal-table-wrap">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="loading-spinner" style={{ margin: '0 auto 1rem auto' }}></div>
              <p style={{ color: '#64748b' }}>Memuat data bank soal...</p>
            </div>
          ) : (
            <table className="bank-soal-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>No</th>
                  <th>Nama Bank Soal</th>
                  <th>Mata Pelajaran</th>
                  <th style={{ textAlign: 'center', width: '180px' }}>Pembuat (Guru)</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>Jumlah Soal</th>
                  <th style={{ width: '150px' }}>Dibuat Pada</th>
                  <th style={{ textAlign: 'center', width: '100px' }}>Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-row" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                      Tidak ada bank soal guru yang terdaftar.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((row, idx) => (
                    <tr key={row.id} className="table-row-hover" style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/guru/bank-soal/detail/${row.id}`)}>
                      <td style={{ fontWeight: 'bold', color: '#64748b' }}>{startIndex + idx + 1}</td>
                      <td>
                        <div className="folder-name-cell" style={{ fontWeight: '700' }}>
                          <FiFolder className="folder-icon" />
                          {row.nama}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '600', color: '#334155', fontSize: '0.85rem' }}>{row.mataPelajaran?.namaMapel || '-'}</span>
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Tingkat {row.tingkat || 'SEMUA'} {row.jurusan?.namaProdi ? `(${row.jurusan?.namaProdi})` : ''}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#475569', fontWeight: '700', padding: '4px 8px', background: '#f1f5f9', borderRadius: '6px' }}>
                          <FiUser size={12} /> {row.guru?.user?.namaLengkap || 'Admin'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="soal-count-badge" style={{ fontWeight: 'bold' }}>
                          {row._count?.bankSoal || 0} Soal
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '600', color: '#64748b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FiCalendar size={12} /> {new Date(row.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <button type="button" className="btn-icon view" onClick={() => navigate(`/admin/guru/bank-soal/detail/${row.id}`)} title="Lihat Daftar Soal" style={{ display: 'inline-flex', margin: '0 auto' }}>
                          <FiEye />
                        </button>
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
