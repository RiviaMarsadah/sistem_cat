import { useEffect, useState, useMemo } from 'react';
import { FiBook, FiCalendar, FiClock, FiShield, FiUser, FiCopy } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import '../guru/GuruTheme.css';
import '../guru/JadwalUjian.css';
import '../guru/PaketUjian.css';

const getTingkatLabel = (tingkat) => {
  const map = { X: '10', XI: '11', XII: '12', ALUMNI: 'Alumni', KI: 'KI' };
  return map[tingkat] || tingkat;
};

const getNamaKelasDisplay = (kelas) => {
  if (!kelas) return '-';
  const tingkatLabel = getTingkatLabel(kelas.tingkat);
  const prodiLabel = kelas.jurusan?.namaProdi || '';
  const romanTingkat = kelas.tingkat || '';
  const kodeProdi = kelas.jurusan?.kodeProdi || '';
  return `${tingkatLabel} ${prodiLabel} (${romanTingkat} ${kodeProdi}) ${kelas.inisial || ''}`.replace(/\s+$/, '');
};

const ITEMS_PER_PAGE = 10;

export default function AdminGuruJadwal() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [searchCustom, setSearchCustom] = useState('');
  const [currentPageCustom, setCurrentPageCustom] = useState(1);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/guru-data/jadwal');
      // Only display custom exams scheduled by teachers (marked as custom or has a non-null creator)
      const allSchedules = res.data?.data || [];
      const customOnly = allSchedules.filter(j => j.kategori === 'custom' || j.guruId !== null);
      setSchedules(customOnly);
    } catch (err) {
      showToast('Gagal memuat data jadwal guru. ' + (err?.response?.data?.message || ''), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredCustomJadwal = useMemo(() => {
    if (!searchCustom.trim()) return schedules;
    const query = searchCustom.toLowerCase();
    return schedules.filter(j => 
      (j.nama || '').toLowerCase().includes(query) ||
      (j.mataPelajaran?.namaMapel || '').toLowerCase().includes(query) ||
      (j.paketUjian?.nama || '').toLowerCase().includes(query) ||
      (j.guru?.user?.namaLengkap || '').toLowerCase().includes(query)
    );
  }, [schedules, searchCustom]);

  const totalItems = filteredCustomJadwal.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const isShowAll = currentPageCustom === 9999;
  const displayPage = isShowAll ? 1 : Math.min(Math.max(1, currentPageCustom), totalPages);
  const startIndex = isShowAll ? 0 : (displayPage - 1) * ITEMS_PER_PAGE;
  const paginatedCustom = isShowAll ? filteredCustomJadwal : filteredCustomJadwal.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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

  const handleCopyToken = (tokenVal, typeLabel) => {
    navigator.clipboard.writeText(tokenVal);
    showToast(`Token ${typeLabel} berhasil disalin: ${tokenVal}`, 'success');
  };

  return (
    <div className="guru-page jadwal-page" style={{ padding: '0 20px 20px 20px' }}>
      <div className="guru-header guru-header-card" style={{ marginTop: '20px' }}>
        <div>
          <h1 className="guru-title">
            <span className="guru-title-text">Jadwal Ujian Guru</span>
            <span className="guru-title-badge">Monitoring</span>
          </h1>
          <p className="guru-subtitle">Oversight pemantauan seluruh jadwal agenda ujian mandiri custom yang dibuat oleh Guru.</p>
        </div>
        <div className="guru-meta">
          <div className="guru-meta-card">
            <div className="guru-meta-label">Total Jadwal Custom</div>
            <div className="guru-meta-value">{schedules.length}</div>
          </div>
        </div>
      </div>

      <div className="guru-card" style={{ marginTop: '20px' }}>
        <div className="guru-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 className="guru-card-title" style={{ margin: 0 }}>Daftar Ujian Mandiri Custom Guru</h2>
          <div style={{ position: 'relative', width: '280px' }}>
            <input
              type="text"
              placeholder="Cari ulangan atau guru..."
              value={searchCustom}
              onChange={(e) => {
                setSearchCustom(e.target.value);
                setCurrentPageCustom(1);
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

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 1rem auto' }}></div>
            <p style={{ color: '#64748b' }}>Memuat data jadwal custom guru...</p>
          </div>
        ) : filteredCustomJadwal.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            <FiCalendar size={48} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
            <p>{searchCustom ? 'Tidak ada ulangan custom guru yang cocok dengan pencarian Anda.' : 'Belum ada ulangan mandiri yang dibuat oleh Guru.'}</p>
          </div>
        ) : (
          <div className="jadwal-table-wrap" style={{ marginTop: '1rem', overflowX: 'auto' }}>
            <table className="paket-ujian-table" style={{ minWidth: '950px' }}>
              <thead>
                <tr>
                  <th className="text-left" style={{ width: '200px' }}>Nama Ujian</th>
                  <th className="text-left" style={{ width: '220px' }}>Waktu Ujian</th>
                  <th className="text-center" style={{ width: '130px' }}>Kelas</th>
                  <th className="text-center" style={{ width: '160px' }}>Token IN / OUT</th>
                  <th className="text-left" style={{ width: '220px' }}>Mata Pelajaran & Paket Soal</th>
                  <th className="text-center" style={{ width: '130px' }}>Kiosk Mode</th>
                  <th className="text-center" style={{ width: '180px' }}>Pembuat (Autor)</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCustom.map((j, idx) => {
                  const tglObj = new Date(j.mulai);
                  const hariTanggal = tglObj.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                  const waktuMulai = tglObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
                  const waktuSelesai = new Date(j.selesai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
                  const isEven = idx % 2 === 1;
                  const rowClass = isEven ? 'session-row-even' : 'session-row-odd';

                  return (
                    <tr key={j.id} className={rowClass}>
                      <td className="text-left">
                        <div style={{ fontWeight: '700', color: '#1e293b' }}>
                          {j.nama}
                        </div>
                      </td>
                      <td className="text-left">
                        <div style={{ fontSize: '0.9rem', color: '#334155' }}>
                          <FiClock style={{ marginRight: '0.25rem', verticalAlign: 'text-bottom' }} />
                          {waktuMulai} - {waktuSelesai} <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>({j.durasi} Menit)</span>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px', fontWeight: '500' }}>{hariTanggal}</div>
                        </div>
                      </td>
                      <td className="text-center">
                        <div style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}>
                          {j.kelasJadwal && j.kelasJadwal.length > 0 ? (
                            <div className="class-tooltip-container">
                              <span 
                                className="mapel-badge" 
                                style={{ 
                                  background: '#eff6ff', 
                                  color: '#1e40af', 
                                  border: '1px solid #bfdbfe', 
                                  fontWeight: '700', 
                                  padding: '4px 12px', 
                                  borderRadius: '20px', 
                                  fontSize: '0.85rem',
                                  cursor: 'pointer'
                                }}
                              >
                                {j.kelasJadwal.length} Kelas
                              </span>
                              <div className={`class-tooltip-bubble ${j.kelasJadwal.length > 10 ? 'scrollable' : ''}`}>
                                <div style={{ 
                                  display: 'grid', 
                                  gridTemplateColumns: j.kelasJadwal.length === 1 ? '1fr' : 'repeat(2, 1fr)', 
                                  gap: '8px', 
                                  width: 'max-content'
                                }}>
                                  {j.kelasJadwal.map((kj, idx2) => (
                                    <span key={idx2} style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', whiteSpace: 'nowrap', textAlign: 'center', lineHeight: '1.3' }}>
                                      {getNamaKelasDisplay(kj.kelas)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>-</span>
                          )}
                        </div>
                      </td>
                      <td className="text-center">
                        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                          <button 
                            type="button"
                            onClick={() => handleCopyToken(j.token, 'Check-In')}
                            title="Klik untuk menyalin Token Check-In"
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              gap: '6px', 
                              background: '#ecfdf5', 
                              color: '#047857', 
                              border: '1px solid #a7f3d0', 
                              padding: '5px 12px', 
                              borderRadius: '8px', 
                              fontSize: '0.8rem', 
                              fontWeight: '700',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                              width: '105px'
                            }}
                          >
                            <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#065f46', marginRight: '2px' }}>IN:</span>
                            <span>{j.token || '-'}</span>
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleCopyToken(j.tokenCheckOut, 'Check-Out')}
                            title="Klik untuk menyalin Token Check-Out"
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              gap: '6px', 
                              background: '#fef2f2', 
                              color: '#b91c1c', 
                              border: '1px solid #fecaca', 
                              padding: '5px 12px', 
                              borderRadius: '8px', 
                              fontSize: '0.8rem', 
                              fontWeight: '700',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                              width: '105px'
                            }}
                          >
                            <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#991b1b', marginRight: '2px' }}>OUT:</span>
                            <span>{j.tokenCheckOut || '-'}</span>
                          </button>
                        </div>
                      </td>
                      <td className="text-left">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div className="user-role-badge status-aktif" style={{ display: 'inline-flex', whiteSpace: 'nowrap', width: 'fit-content' }}>
                            <FiBook style={{ marginRight: '0.25rem' }} />
                            {j.mataPelajaran?.namaMapel}
                          </div>
                          <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginTop: '2px' }}>
                            Paket: {j.paketUjian?.nama || '-'}
                          </div>
                        </div>
                      </td>
                      <td className="text-center">
                        {j.opsiKeamanan ? (
                          <span style={{ fontSize: '0.7rem', background: '#d1fae5', color: '#059669', padding: '4px 8px', borderRadius: '4px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <FiShield /> AKTIF
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.7rem', background: '#f1f5f9', color: '#94a3b8', padding: '4px 8px', borderRadius: '4px', fontWeight: '600' }}>
                            NONAKTIF
                          </span>
                        )}
                      </td>
                      <td className="text-center">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', color: '#334155', fontWeight: '700', padding: '5px 10px', background: '#f1f5f9', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                          <FiUser size={12} style={{ color: '#2563eb' }} /> {j.guru?.user?.namaLengkap || 'Admin'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalItems > 0 && (
          <div className="table-pagination">
            <span className="table-pagination-info">
              {isShowAll 
                ? `Menampilkan 1 - ${totalItems} dari ${totalItems} jadwal` 
                : `Menampilkan ${startIndex + 1} - ${Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} dari ${totalItems} jadwal`
              }
            </span>
            <div className="table-pagination-controls">
              <button type="button" className="table-pagination-btn" disabled={isShowAll || displayPage <= 1} onClick={() => setCurrentPageCustom(p => Math.max(1, p - 1))}>Sebelumnya</button>
              <div className="table-pagination-pages">
                {isShowAll ? (
                  <button type="button" className="table-pagination-page active" onClick={() => setCurrentPageCustom(1)}>Tampilkan Per Halaman</button>
                ) : (
                  getPaginationPages(totalPages, displayPage).map((item, idx) =>
                    item.type === 'ellipsis' ? (
                      <span key={`ellipsis-${item.key}`} className="table-pagination-ellipsis">…</span>
                    ) : (
                      <button key={item.value} type="button" className={`table-pagination-page ${item.value === displayPage ? 'active' : ''}`} onClick={() => setCurrentPageCustom(item.value)}>{item.value}</button>
                    )
                  )
                )}
              </div>
              <button type="button" className="table-pagination-btn" disabled={isShowAll || displayPage >= totalPages} onClick={() => setCurrentPageCustom(p => Math.min(totalPages, p + 1))}>Berikutnya</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
