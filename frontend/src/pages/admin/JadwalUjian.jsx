import { useEffect, useState, useMemo } from 'react';
import { FiPlus, FiTrash2, FiClock, FiCalendar, FiBook, FiCheckCircle, FiXCircle, FiX, FiShield, FiChevronRight, FiArrowLeft, FiEdit2, FiAlertCircle, FiChevronLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import '../guru/PaketUjian.css';
import './JadwalUjian.css';
import './User.css';

export default function JadwalUjianAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  // View State logic
  const [activePeriodeId, setActivePeriodeId] = useState(null);
  const [periodes, setPeriodes] = useState([]);

  // Confirm Modal (Jadwal)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState(null);
  
  // Modal Periode Actions
  const [showConfirmPeriodeModal, setShowConfirmPeriodeModal] = useState(false);
  const [confirmPeriodeData, setConfirmPeriodeData] = useState(null);
  const [showEditPeriodeModal, setShowEditPeriodeModal] = useState(false);
  const [editPeriodeData, setEditPeriodeData] = useState({ id: '', nama: '', mulai: '', selesai: '', semester: 'Gasal', tahunAjaran: '' });

  const filteredPeriodes = useMemo(() => {
    return periodes.filter(p => 
      p.nama.toLowerCase().includes(search.toLowerCase()) || 
      p.semester.toLowerCase().includes(search.toLowerCase()) ||
      p.tahunAjaran.toLowerCase().includes(search.toLowerCase())
    );
  }, [periodes, search]);

  const totalPages = itemsPerPage === 0 ? 1 : Math.ceil(filteredPeriodes.length / itemsPerPage);
  
  const paginatedPeriodes = useMemo(() => {
    if (itemsPerPage === 0) return filteredPeriodes;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPeriodes.slice(start, start + itemsPerPage);
  }, [filteredPeriodes, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, itemsPerPage]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resJadwal, resPeriode] = await Promise.all([
        api.get('/admin/jadwal-ujian/admin'),
        api.get('/admin/periode')
      ]);
      setItems(resJadwal.data?.data || []);
      setPeriodes(resPeriode.data?.data || []);
    } catch (e) {
      setError('Gagal memuat jadwal. ' + (e?.response?.data?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleBuatWizard = () => {
     navigate('/admin/jadwal-ujian/wizard');
  };

  const confirmDelete = (item) => {
    setConfirmData(item);
    setShowConfirmModal(true);
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const res = await api.delete(`/admin/jadwal-ujian/${confirmData.id}`);
      setShowConfirmModal(false);
      setSuccess(res.data.message);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal menghapus jadwal');
    } finally {
      setSaving(false);
    }
  };

  const openEditPeriode = (p, e) => {
    e.stopPropagation();
    setEditPeriodeData({ 
        id: p.id, 
        nama: p.nama, 
        mulai: new Date(p.mulai).toISOString().split('T')[0], 
        selesai: new Date(p.selesai).toISOString().split('T')[0], 
        semester: p.semester, 
        tahunAjaran: p.tahunAjaran 
    });
    setShowEditPeriodeModal(true);
  };

  const submitEditPeriode = async (e) => {
      e.preventDefault();
      setSaving(true);
      try {
          const res = await api.put(`/admin/periode/${editPeriodeData.id}`, editPeriodeData);
          setShowEditPeriodeModal(false);
          setSuccess("Periode berhasil diperbarui");
          await loadData();
      } catch (err) {
          setError(err?.response?.data?.message || "Gagal memperbarui periode");
      } finally {
          setSaving(false);
      }
  };

  const confirmDeletePeriode = (p) => {
    setConfirmPeriodeData(p);
    setShowConfirmPeriodeModal(true);
  };

  const handleDeletePeriode = async () => {
    setSaving(true);
    try {
      const res = await api.delete(`/admin/periode/${confirmPeriodeData.id}`);
      setShowConfirmPeriodeModal(false);
      setSuccess("Periode berhasil dihapus");
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal menghapus periode');
    } finally {
      setSaving(false);
    }
  };

  const renderListPeriode = () => {
    if (loading && periodes.length === 0) return <div className="paket-ujian-loading">Memuat periode...</div>;
    
    return (
      <div className="user-card" style={{ marginTop: '1.5rem' }}>
        <div className="user-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 className="user-card-title">Daftar Periode Ujian</h2>
            <div className="search-box">
              <input 
                type="text" 
                placeholder="Cari periode..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          <button className="btn-add-user" onClick={handleBuatWizard} disabled={saving}>
            <FiPlus />
            <span>Jadwal Ujian</span>
          </button>
        </div>

        <div className="paket-ujian-table-wrap">
        <table className="paket-ujian-table">
          <thead>
            <tr>
              <th>Periode Ujian</th>
              <th>Semester & Tahun Ajaran</th>
              <th>Waktu Pelaksanaan</th>
              <th>Total Jadwal Ujian</th>
              <th>Kiosk Mode</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPeriodes.map(p => {
               const periodItems = items.filter(j => String(j.periodeId) === String(p.id));
               const isKioskActive = periodItems.some(j => j.opsiKeamanan === true);

               return (
                 <tr key={p.id} onClick={() => setActivePeriodeId(p.id)} style={{ cursor: 'pointer', transition: 'background 0.2s' }} className="clickable-row">
                   <td>
                     <div style={{fontWeight: '700', color: '#1e293b'}}>{p.nama}</div>
                   </td>
                   <td>
                     <div style={{fontWeight: '600', color: '#334155'}}>{p.semester} - {p.tahunAjaran}</div>
                   </td>
                   <td>
                     <div style={{fontSize: '0.85rem', color: '#64748b'}}>
                       <FiCalendar style={{marginRight: '4px', verticalAlign: 'text-bottom'}}/> 
                       {new Date(p.mulai).toLocaleDateString('id-ID')} s/d {new Date(p.selesai).toLocaleDateString('id-ID')}
                     </div>
                   </td>
                   <td>
                     <div style={{display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#eff6ff', color: '#2563eb', fontWeight: '700', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem'}}>
                        {p._count?.jadwalUjians || periodItems.length} Sesi Terjadwal
                     </div>
                   </td>
                   <td>
                      {isKioskActive ? (
                         <span style={{ fontSize: '0.7rem', background: '#d1fae5', color: '#059669', padding: '4px 8px', borderRadius: '4px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <FiShield /> AKTIF
                         </span>
                      ) : (
                         <span style={{ fontSize: '0.7rem', background: '#f1f5f9', color: '#94a3b8', padding: '4px 8px', borderRadius: '4px', fontWeight: '600' }}>
                            NONAKTIF
                         </span>
                      )}
                   </td>
                   <td>
                     <div style={{ display: 'flex', gap: '8px' }}>
                       <button className="btn-action primary" onClick={(e) => openEditPeriode(p, e)} title="Edit Periode" style={{ background: '#3b82f6', color: 'white' }}>
                          <FiEdit2 />
                       </button>
                       <button className="btn-action btn-delete" onClick={(e) => { e.stopPropagation(); confirmDeletePeriode(p); }} title="Hapus Periode">
                          <FiTrash2 />
                       </button>
                     </div>
                   </td>
                 </tr>
               )
            })}
          </tbody>
        </table>
        </div>

        {filteredPeriodes.length > 0 && (
          <div className="pagination-container" style={{ padding: '1rem' }}>
            <div className="pagination-info">
              Menampilkan <strong>{itemsPerPage === 0 ? filteredPeriodes.length : Math.min(filteredPeriodes.length, (currentPage - 1) * itemsPerPage + 1)}</strong> - <strong>{itemsPerPage === 0 ? filteredPeriodes.length : Math.min(filteredPeriodes.length, currentPage * itemsPerPage)}</strong> dari <strong>{filteredPeriodes.length}</strong> data
            </div>
            <div className="pagination-controls">
              <button 
                className="btn-pagination" 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || itemsPerPage === 0}
              >
                <FiChevronLeft />
              </button>
              
              {itemsPerPage !== 0 && Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                  return (
                    <button 
                      key={page} 
                      className={`btn-pagination ${currentPage === page ? 'active' : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} style={{ color: '#94a3b8' }}>...</span>;
                }
                return null;
              })}

              <button 
                className="btn-pagination" 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || itemsPerPage === 0}
              >
                <FiChevronRight />
              </button>

              <button 
                className={`pagination-show-all ${itemsPerPage === 0 ? 'active' : ''}`}
                onClick={() => setItemsPerPage(itemsPerPage === 0 ? 20 : 0)}
              >
                {itemsPerPage === 0 ? 'Batasi 20' : 'Tampilkan Semua'}
              </button>
            </div>
          </div>
        )}

        {periodes.length === 0 && (
          <div className="user-empty" style={{ padding: '3rem 0' }}>
            Belum ada periode ujian. Silakan buat jadwal baru melalui tombol di atas.
          </div>
        )}
      </div>
    );
  };

  const renderDetailPeriode = () => {
    const periode = periodes.find(p => p.id === activePeriodeId);
    if (!periode) return null;
    const filteredItems = items
      .filter(j => String(j.periodeId) === String(activePeriodeId))
      .sort((a, b) => new Date(a.mulai) - new Date(b.mulai));
    
    // Check if Kiosk mode is active in any of the scheduled items
    const isKioskActive = filteredItems.some(j => j.opsiKeamanan === true);

    return (
      <div className="periode-detail-view" style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
        <button onClick={() => setActivePeriodeId(null)} style={{ background: 'none', border: 'none', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '600', marginBottom: '1.5rem', padding: 0, fontSize: '0.95rem' }}>
          <FiArrowLeft /> Kembali ke Daftar Periode
        </button>

        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '2rem', marginBottom: '2rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', border: '1px solid #e2e8f0' }}>Tahun {periode?.tahunAjaran}</span>
              <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', border: '1px solid #e2e8f0' }}>Semester {periode?.semester}</span>
              {isKioskActive && (
                <span style={{ background: '#d1fae5', color: '#059669', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiShield /> KIOSK MODE AKTIF
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '0.75rem', letterSpacing: '-0.5px', color: '#1e293b' }}>{periode?.nama}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.9rem' }}>
                <FiCalendar /> Berlangsung: {new Date(periode?.mulai).toLocaleDateString('id-ID', { dateStyle: 'long' })} &mdash; {new Date(periode?.selesai).toLocaleDateString('id-ID', { dateStyle: 'long' })}
            </div>
          </div>
          
          {/* Decorative Background */}
          <FiCalendar style={{ position: 'absolute', right: '-20px', top: '-20px', fontSize: '180px', opacity: '0.03', transform: 'rotate(15deg)', color: '#3b82f6' }} />
        </div>

        <div className="paket-ujian-table-wrap">
        {loading ? (
          <div className="paket-ujian-loading">Memuat data jadwal...</div>
        ) : filteredItems.length === 0 ? (
          <table className="paket-ujian-table">
            <tbody>
              <tr><td className="empty-row" colSpan={6}>Belum ada sesi jadwal di dalam periode ini.</td></tr>
            </tbody>
          </table>
        ) : (
          <table className="paket-ujian-table">
            <thead>
              <tr>
                <th>Hari dan Tanggal Ujian</th>
                <th>Waktu Ujian</th>
                <th>Kelas</th>
                <th>Ruangan</th>
                <th>Mata Pelajaran</th>
                <th>Status Paket</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(j => {
                const tglObj = new Date(j.mulai);
                const hariTanggal = tglObj.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                const waktuMulai = tglObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
                const waktuSelesai = new Date(j.selesai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');

                return (
                <tr key={j.id}>
                  <td>
                    <div style={{fontWeight: '600', color: '#1e293b'}}>
                      {hariTanggal}
                    </div>
                  </td>
                  <td>
                    <div style={{fontSize: '0.9rem', color: '#334155'}}>
                        <FiClock style={{marginRight: '0.25rem', verticalAlign: 'text-bottom'}} />
                        {waktuMulai} - {waktuSelesai}
                        <div style={{fontSize: '0.75rem', color: '#64748b', marginTop: '2px'}}>({j.durasi} Menit)</div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '200px' }}>
                      {j.kelasJadwal?.map((kj, idx) => {
                          const tLabel = kj.kelas?.tingkat || '';
                          const jLabel = kj.kelas?.jurusan?.idJurusan || '';
                          const kName = `${tLabel} ${jLabel} ${kj.kelas?.inisial || ''}`;
                          return (
                            <span key={idx} style={{background: '#f8fafc', border: '1px solid #e2e8f0', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', color: '#475569', fontWeight: '600'}}>
                              {kName.trim()}
                            </span>
                          );
                      })}
                      {(!j.kelasJadwal || j.kelasJadwal.length === 0) && <span style={{color: '#94a3b8', fontSize: '0.8rem'}}>-</span>}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: '600' }}>
                      {j.ruangan || '-'}
                    </span>
                  </td>
                  <td>
                    <div className="user-role-badge status-aktif" style={{display: 'inline-flex', whiteSpace: 'nowrap'}}>
                        <FiBook style={{marginRight: '0.25rem'}} />
                        {j.mataPelajaran?.namaMapel}
                    </div>
                  </td>
                  <td>
                    {j.paketUjianId ? (
                      <span className="user-status-badge status-aktif" style={{whiteSpace: 'nowrap'}}>
                        <FiCheckCircle /> Siap Ujian
                      </span>
                    ) : (
                      <span className="user-status-badge status-nonaktif" style={{whiteSpace: 'nowrap'}}>
                        <FiXCircle /> Belum Diisi Paket
                      </span>
                    )}
                  </td>
                  <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-action btn-delete" onClick={() => confirmDelete(j)} title="Hapus Jadwal">
                          <FiTrash2 />
                        </button>
                      </div>
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        )}
        </div>
      </div>
    );
  };

  return (
    <div className="user-page" style={{ padding: '0 20px 20px 20px' }}>
      <div className="user-header">
        <div>
          <h1 className="user-title">
            <span className="title-text">Jadwal Ujian</span>
            <span className="title-badge">Admin</span>
          </h1>
          <p className="user-subtitle">Pilih atau buat periode ujian untuk mengelola jadwal kelas.</p>
        </div>
        <div className="user-meta">
          <div className="meta-card">
            <div className="meta-label">Total</div>
            <div className="meta-value">{periodes.length}</div>
          </div>
        </div>
      </div>

      {error && <div className="paket-ujian-error">{error}</div>}
      {success && <div className="paket-ujian-error admin-success-alert">{success}</div>}

      {activePeriodeId === null ? renderListPeriode() : renderDetailPeriode()}

      {/* Edit Periode Modal */}
      {showEditPeriodeModal && (
        <div className="modal-overlay">
          <div className="modal-container modal-form">
            <div className="modal-header">
              <h3 className="modal-title">Edit Periode Ujian</h3>
              <button className="modal-close" onClick={() => setShowEditPeriodeModal(false)}><FiX /></button>
            </div>
            <form onSubmit={submitEditPeriode}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="label">Judul Periode <span className="label-required">*</span></label>
                  <input className="input" required value={editPeriodeData.nama} onChange={(e) => setEditPeriodeData({...editPeriodeData, nama: e.target.value})} />
                </div>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                   <div className="form-group">
                      <label className="label">Tahun Ajaran <span className="label-required">*</span></label>
                      <select className="input" required value={editPeriodeData.tahunAjaran} onChange={(e) => setEditPeriodeData({...editPeriodeData, tahunAjaran: e.target.value})}>
                        {Array.from({length: 15}, (_, i) => 2020 + i).map(year => (
                           <option key={year} value={`${year}/${year + 1}`}>{year}/{year + 1}</option>
                        ))}
                      </select>
                   </div>
                   <div className="form-group">
                      <label className="label">Semester <span className="label-required">*</span></label>
                      <select className="input" required value={editPeriodeData.semester} onChange={(e) => setEditPeriodeData({...editPeriodeData, semester: e.target.value})}>
                         <option value="Gasal">Gasal</option>
                         <option value="Genap">Genap</option>
                      </select>
                   </div>
                </div>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                   <div className="form-group">
                      <label className="label">Tgl Mulai Ujian <span className="label-required">*</span></label>
                      <input type="date" className="input" required value={editPeriodeData.mulai} onChange={(e) => setEditPeriodeData({...editPeriodeData, mulai: e.target.value})} />
                   </div>
                   <div className="form-group">
                      <label className="label">Tgl Selesai Ujian <span className="label-required">*</span></label>
                      <input type="date" className="input" required value={editPeriodeData.selesai} onChange={(e) => setEditPeriodeData({...editPeriodeData, selesai: e.target.value})} />
                   </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="modal-btn modal-btn-cancel" onClick={() => setShowEditPeriodeModal(false)}>Batal</button>
                <button type="submit" className="modal-btn modal-btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Conform Delete Jadwal Sesi */}
      {showConfirmModal && confirmData && (
        <div className="modal-overlay">
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-confirm">
              <div className="modal-confirm-header">
                <div className="modal-confirm-icon-box danger">
                  <FiAlertCircle className="modal-icon" />
                </div>
                <h3 className="modal-confirm-title">Hapus Sesi Jadwal?</h3>
              </div>
              <div className="modal-confirm-body">
                <div className="modal-confirm-text">
                  Yakin ingin menghapus jadwal pada <span className="modal-confirm-item">{new Date(confirmData.mulai).toLocaleDateString('id-ID', { dateStyle: 'long' })}</span>?
                </div>
                <div className="modal-confirm-warning">
                  <FiAlertCircle /> Tindakan ini tidak dapat dibatalkan. Seluruh record ujian siswa di jadwal ini akan ikut terhapus.
                </div>
              </div>
              <div className="modal-confirm-footer">
                <button className="btn btn-secondary" onClick={() => setShowConfirmModal(false)} disabled={saving}>
                  <FiX /> Batal
                </button>
                <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
                  {saving ? 'Menghapus...' : <><FiTrash2 /> Ya, Hapus</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conform Delete Periode */}
      {showConfirmPeriodeModal && confirmPeriodeData && (
        <div className="modal-overlay">
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-confirm">
              <div className="modal-confirm-header">
                <div className="modal-confirm-icon-box danger">
                  <FiAlertCircle className="modal-icon" />
                </div>
                <h3 className="modal-confirm-title">Hapus Periode Ujian?</h3>
              </div>
              <div className="modal-confirm-body">
                <div className="modal-confirm-text">
                  Yakin ingin menghapus periode <span className="modal-confirm-item">{confirmPeriodeData.nama}</span>?
                </div>
                <div className="modal-confirm-warning">
                  <FiAlertCircle /> PERHATIAN: Seluruh data jadwal sesi dan hasil ujian siswa dalam periode ini akan terhapus permanen!
                </div>
              </div>
              <div className="modal-confirm-footer">
                <button className="btn btn-secondary" onClick={() => setShowConfirmPeriodeModal(false)} disabled={saving}>
                  <FiX /> Batal
                </button>
                <button className="btn btn-danger" onClick={handleDeletePeriode} disabled={saving}>
                  {saving ? 'Menghapus...' : <><FiTrash2 /> Ya, Hapus Semua</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
